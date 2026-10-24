<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import AppShell from '../../components/AppShell.vue'
import AppModal from '../../components/AppModal.vue'
import GestionModal from '../../components/GestionModal.vue'
import Pagination from '../../components/Pagination.vue'
import IconButton from '../../components/IconButton.vue'
import SkeletonBlock from '../../components/SkeletonBlock.vue'
import ErrorState from '../../components/ErrorState.vue'
import EmptyState from '../../components/EmptyState.vue'
import AppButton from '../../components/AppButton.vue'
import FormField from '../../components/FormField.vue'
import StatusBadge from '../../components/StatusBadge.vue'
import {
  createProspecto,
  updateProspecto,
  deleteProspecto,
  listProspectos,
  crearGestionProspecto,
  getGestionDeProspecto,
  convertirAEmpresa,
  convertirACoachee,
  marcarPerdido,
  type Prospecto,
  type TipoProspecto,
  type EtapaProspecto,
  type GestionProspecto,
} from '../../api/prospectos'
import { listarParametros } from '../../api/configuracion'
import { ApiError } from '../../api/client'
import { notifyError, notifySuccess, confirmDialog } from '../../lib/notify'
import { etapaEsCerrada, etapaLabel } from '../../lib/etapaProspecto'
import { useCarga } from '../../lib/useCarga'
import { enfocarPrimerInvalido } from '../../lib/enfocarInvalido'

const router = useRouter()

const PAGE_SIZE = 12

const prospectos = ref<Prospecto[]>([])
const fuentes = ref<string[]>([])
const search = ref('')
const filtroEtapa = ref<EtapaProspecto | ''>('')
const filtroFuente = ref('')
const page = ref(1)

async function load() {
  // Los prospectos son críticos; el catálogo de fuentes solo alimenta filtros y un select.
  const [p, f] = await Promise.all([
    listProspectos(),
    tolerar(listarParametros('FUENTES_PROSPECTO')),
  ])
  prospectos.value = p
  fuentes.value = (f ?? []).filter((param) => param.estado).map((param) => param.valor)
}

const { loading, error, fallos, recargar, tolerar } = useCarga(load)

onMounted(recargar)

const tonoEtapa: Record<EtapaProspecto, 'neutral' | 'bronze' | 'sage' | 'danger'> = {
  contactado: 'neutral',
  propuesta_enviada: 'bronze',
  negociacion: 'bronze',
  ganado: 'sage',
  perdido: 'danger',
}

const formatoCLP = new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 })

const filtrados = computed(() => {
  const q = search.value.trim().toLowerCase()
  return prospectos.value.filter((p) => {
    if (q && !p.nombre.toLowerCase().includes(q)) return false
    if (filtroEtapa.value && p.etapa !== filtroEtapa.value) return false
    if (filtroFuente.value && p.fuente !== filtroFuente.value) return false
    return true
  })
})

const paginados = computed(() => {
  const start = (page.value - 1) * PAGE_SIZE
  return filtrados.value.slice(start, start + PAGE_SIZE)
})

function limpiarFiltros() {
  search.value = ''
  filtroEtapa.value = ''
  filtroFuente.value = ''
  page.value = 1
}

// --- Modal de alta/edición ---
const modalOpen = ref(false)
const editando = ref<Prospecto | null>(null)
const guardando = ref(false)
const form = reactive({
  nombre: '',
  tipo: 'empresa' as TipoProspecto,
  contactoNombre: '',
  email: '',
  telefono: '',
  fuente: '',
  valorEstimado: null as number | null,
  notas: '',
})
const errors = reactive<{ nombre?: string }>({})
const serverErrors = ref<Record<string, string>>({})

const formatoMiles = new Intl.NumberFormat('es-CL')
const valorEstimadoDisplay = computed<string>({
  get: () => (form.valorEstimado !== null ? formatoMiles.format(form.valorEstimado) : ''),
  set: (value: string) => {
    const digits = value.replace(/\D/g, '')
    form.valorEstimado = digits ? Number(digits) : null
  },
})

function abrirCrear() {
  editando.value = null
  form.nombre = ''
  form.tipo = 'empresa'
  form.contactoNombre = ''
  form.email = ''
  form.telefono = ''
  form.fuente = ''
  form.valorEstimado = null
  form.notas = ''
  errors.nombre = undefined
  serverErrors.value = {}
  modalOpen.value = true
}

function abrirEditar(prospecto: Prospecto) {
  editando.value = prospecto
  form.nombre = prospecto.nombre
  form.tipo = prospecto.tipo
  form.contactoNombre = prospecto.contactoNombre ?? ''
  form.email = prospecto.email ?? ''
  form.telefono = prospecto.telefono ?? ''
  form.fuente = prospecto.fuente ?? ''
  form.valorEstimado = prospecto.valorEstimado
  form.notas = prospecto.notas ?? ''
  errors.nombre = undefined
  serverErrors.value = {}
  modalOpen.value = true
}

function validar(): boolean {
  errors.nombre = form.nombre.trim().length < 2 ? 'El nombre debe tener al menos 2 caracteres.' : undefined
  if (errors.nombre) void enfocarPrimerInvalido()
  return !errors.nombre
}

async function guardar() {
  if (!validar()) return
  guardando.value = true
  serverErrors.value = {}
  const input = {
    nombre: form.nombre,
    tipo: form.tipo,
    contactoNombre: form.contactoNombre || undefined,
    email: form.email || undefined,
    telefono: form.telefono || undefined,
    fuente: form.fuente || undefined,
    valorEstimado: form.valorEstimado ?? undefined,
    notas: form.notas || undefined,
  }
  try {
    if (editando.value) {
      await updateProspecto(editando.value.id, input)
      await notifySuccess('Prospecto actualizado')
    } else {
      await createProspecto(input)
      await notifySuccess('Prospecto creado')
    }
    modalOpen.value = false
    await recargar()
  } catch (err) {
    serverErrors.value = err instanceof ApiError ? (err.fieldErrors ?? {}) : {}
    void enfocarPrimerInvalido()
    await notifyError('No se pudo guardar', err instanceof ApiError ? err.message : 'Ocurrió un error inesperado.')
  } finally {
    guardando.value = false
  }
}

async function eliminar(prospecto: Prospecto) {
  const confirmado = await confirmDialog({
    title: '¿Eliminar este prospecto?',
    text: `Esta acción no se puede deshacer. Se eliminará ${prospecto.nombre} de forma definitiva.`,
    confirmText: 'Eliminar',
    danger: true,
  })
  if (!confirmado) return
  try {
    await deleteProspecto(prospecto.id)
    await recargar()
    await notifySuccess('Prospecto eliminado')
  } catch (err) {
    await notifyError('No se pudo eliminar', err instanceof ApiError ? err.message : 'Ocurrió un error inesperado.')
  }
}

// --- Gestión (bitácora de seguimiento) ---
const gestionModalAbierto = ref(false)
const prospectoGestion = ref<{ id: string; nombre: string } | null>(null)
const gestionHistorial = ref<GestionProspecto[]>([])
const gestionCargando = ref(false)
const gestionGuardando = ref(false)

async function abrirGestion(prospecto: Prospecto) {
  prospectoGestion.value = { id: prospecto.id, nombre: prospecto.nombre }
  gestionHistorial.value = []
  gestionModalAbierto.value = true
  gestionCargando.value = true
  try {
    gestionHistorial.value = await getGestionDeProspecto(prospecto.id)
  } catch (err) {
    await notifyError('No se pudo cargar el historial', err instanceof ApiError ? err.message : 'Ocurrió un error inesperado.')
  } finally {
    gestionCargando.value = false
  }
}

function cerrarGestion() {
  gestionModalAbierto.value = false
  prospectoGestion.value = null
}

async function guardarGestion(nota: string, proximoSeguimiento: string | undefined) {
  if (!prospectoGestion.value) return
  gestionGuardando.value = true
  try {
    await crearGestionProspecto(prospectoGestion.value.id, nota, proximoSeguimiento)
    await notifySuccess('Gestión registrada')
    gestionHistorial.value = await getGestionDeProspecto(prospectoGestion.value.id)
    await recargar()
  } catch (err) {
    await notifyError('No se pudo guardar', err instanceof ApiError ? err.message : 'Ocurrió un error inesperado.')
  } finally {
    gestionGuardando.value = false
  }
}

// --- Marcar perdido ---
async function perder(prospecto: Prospecto) {
  const confirmado = await confirmDialog({
    title: '¿Marcar como perdido?',
    text: `${prospecto.nombre} saldrá del pipeline activo. El detalle de qué pasó puedes dejarlo en su bitácora de gestión.`,
    confirmText: 'Marcar perdido',
    danger: true,
  })
  if (!confirmado) return
  try {
    await marcarPerdido(prospecto.id)
    await recargar()
    await notifySuccess('Prospecto marcado como perdido')
  } catch (err) {
    await notifyError('No se pudo actualizar', err instanceof ApiError ? err.message : 'Ocurrió un error inesperado.')
  }
}

// --- Convertir a cliente (ganado) ---
const convertirModalAbierto = ref(false)
const prospectoConvertir = ref<Prospecto | null>(null)
const convirtiendo = ref(false)
const formConvertir = reactive({
  nombre: '',
  tarifaHora: null as number | null,
  fechaInicio: '',
  fechaFin: '',
  email: '',
  jefeDirecto: '',
  objetivoProceso: '',
  tarifaPropia: null as number | null,
})

function abrirConvertir(prospecto: Prospecto) {
  prospectoConvertir.value = prospecto
  formConvertir.nombre = prospecto.nombre
  formConvertir.tarifaHora = null
  formConvertir.fechaInicio = ''
  formConvertir.fechaFin = ''
  formConvertir.email = prospecto.email ?? ''
  formConvertir.jefeDirecto = ''
  formConvertir.objetivoProceso = ''
  formConvertir.tarifaPropia = null
  convertirModalAbierto.value = true
}

function cerrarConvertir() {
  convertirModalAbierto.value = false
  prospectoConvertir.value = null
}

async function confirmarConvertir() {
  if (!prospectoConvertir.value) return
  convirtiendo.value = true
  try {
    if (prospectoConvertir.value.tipo === 'empresa') {
      if (!formConvertir.tarifaHora) throw new Error('Ingresa la tarifa por hora.')
      const empresa = await convertirAEmpresa(prospectoConvertir.value.id, {
        nombre: formConvertir.nombre,
        tarifaHora: formConvertir.tarifaHora,
        fechaInicio: formConvertir.fechaInicio || undefined,
        fechaFin: formConvertir.fechaFin || undefined,
      })
      await notifySuccess('Prospecto ganado', `${empresa.nombre} ya está disponible como empresa.`)
      cerrarConvertir()
      await recargar()
      // Lleva a la empresa recién creada (el mantenedor abre su editor con ?id=).
      void router.push({ path: '/coach/empresas', query: { id: empresa.id } })
    } else {
      if (!formConvertir.email) throw new Error('Ingresa el email.')
      const resultado = await convertirACoachee(prospectoConvertir.value.id, {
        nombre: formConvertir.nombre,
        email: formConvertir.email,
        jefeDirecto: formConvertir.jefeDirecto || undefined,
        objetivoProceso: formConvertir.objetivoProceso || undefined,
        tarifaPropia: formConvertir.tarifaPropia ?? undefined,
      })
      await notifySuccess('Prospecto ganado', `${resultado.coachee.nombre} ya está disponible como coachee.`)
      cerrarConvertir()
      await recargar()
      void router.push({ name: 'coach-coachee-detail', params: { coacheeId: resultado.coachee.id } })
    }
  } catch (err) {
    await notifyError('No se pudo convertir', err instanceof ApiError ? err.message : err instanceof Error ? err.message : 'Ocurrió un error inesperado.')
  } finally {
    convirtiendo.value = false
  }
}
</script>

<template>
  <AppShell>
    <div class="mb-4 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 class="font-[family-name:var(--font-heading)] text-xl font-semibold">
          Prospectos
        </h1>
        <p class="text-sm text-[var(--color-muted)]">
          Negocio en conversación, todavía sin firmar — antes de convertirse en Coachee o Empresa.
        </p>
      </div>
      <AppButton @click="abrirCrear">
        + Nuevo Prospecto
      </AppButton>
    </div>

    <SkeletonBlock
      v-if="loading"
      variant="table"
      :rows="6"
    />
    <ErrorState
      v-else-if="error"
      @retry="recargar"
    />
    <EmptyState
      v-else-if="prospectos.length === 0"
      icon="prospectos"
      title="Todavía no tienes prospectos"
      description="Registra el negocio en conversación para darle seguimiento hasta que se convierta en empresa o coachee."
    >
      <AppButton @click="abrirCrear">
        Crear primer prospecto
      </AppButton>
    </EmptyState>
    <div
      v-else
      class="space-y-3"
    >
      <div
        v-if="fallos > 0"
        role="status"
        class="rounded-xl border border-[var(--color-bronze)]/40 bg-[var(--color-bronze)]/10 px-4 py-3 text-sm"
      >
        No pudimos cargar el catálogo de fuentes: los filtros por fuente pueden estar incompletos.
      </div>
      <div class="flex flex-wrap items-center gap-2">
        <select
          v-model="filtroEtapa"
          aria-label="Filtrar por etapa"
          class="field-input w-auto"
          @change="page = 1"
        >
          <option value="">
            Etapa: Todas
          </option>
          <option
            v-for="(label, etapa) in etapaLabel"
            :key="etapa"
            :value="etapa"
          >
            {{ label }}
          </option>
        </select>
        <select
          v-model="filtroFuente"
          aria-label="Filtrar por fuente"
          class="field-input w-auto"
          @change="page = 1"
        >
          <option value="">
            Fuente: Todas
          </option>
          <option
            v-for="f in fuentes"
            :key="f"
            :value="f"
          >
            {{ f }}
          </option>
        </select>
        <AppButton
          variant="secondary"
          size="sm"
          @click="limpiarFiltros"
        >
          × Limpiar filtros
        </AppButton>
        <span class="ml-auto text-xs text-[var(--color-muted)]">{{ filtrados.length }} registro(s)</span>
      </div>

      <input
        v-model="search"
        type="search"
        aria-label="Buscar prospectos"
        placeholder="Buscar por nombre…"
        class="field-input"
        @input="page = 1"
      >

      <div class="data-table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th scope="col">
                Nombre
              </th>
              <th scope="col">
                Contacto
              </th>
              <th scope="col">
                Fuente
              </th>
              <th scope="col">
                Etapa
              </th>
              <th scope="col">
                Valor estimado
              </th>
              <th scope="col">
                Próximo seguimiento
              </th>
              <th scope="col">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="paginados.length === 0">
              <td
                colspan="7"
                class="py-6 text-center text-sm text-[var(--color-muted)]"
              >
                Sin resultados.
              </td>
            </tr>
            <tr
              v-for="p in paginados"
              :key="p.id"
            >
              <td class="font-medium">
                {{ p.nombre }}
                <span class="block text-xs font-normal text-[var(--color-muted)]">
                  {{ p.tipo === 'empresa' ? 'Empresa' : 'Persona' }}
                </span>
              </td>
              <td class="text-[var(--color-muted)]">
                {{ p.contactoNombre || p.email || p.telefono || '—' }}
              </td>
              <td class="text-[var(--color-muted)]">
                {{ p.fuente ?? '—' }}
              </td>
              <td>
                <StatusBadge :tone="tonoEtapa[p.etapa]">
                  {{ etapaLabel[p.etapa] }}
                </StatusBadge>
              </td>
              <td class="cifra text-xs">
                {{ p.valorEstimado ? formatoCLP.format(p.valorEstimado) : '—' }}
              </td>
              <td class="text-xs text-[var(--color-muted)]">
                {{ p.proximoSeguimiento ? new Date(`${p.proximoSeguimiento}T00:00:00`).toLocaleDateString('es-CL') : '—' }}
              </td>
              <td>
                <div class="flex flex-wrap gap-1.5">
                  <template v-if="!etapaEsCerrada(p.etapa)">
                    <AppButton
                      variant="secondary"
                      size="sm"
                      @click="abrirGestion(p)"
                    >
                      Gestionar
                    </AppButton>
                    <AppButton
                      variant="secondary"
                      size="sm"
                      @click="abrirConvertir(p)"
                    >
                      Ganado
                    </AppButton>
                    <AppButton
                      variant="secondary"
                      size="sm"
                      @click="perder(p)"
                    >
                      Perdido
                    </AppButton>
                    <IconButton
                      icon="editar"
                      title="Editar"
                      @click="abrirEditar(p)"
                    />
                  </template>
                  <IconButton
                    icon="eliminar"
                    title="Eliminar"
                    @click="eliminar(p)"
                  />
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <Pagination
        v-model:page="page"
        :total-items="filtrados.length"
        :page-size="PAGE_SIZE"
      />
    </div>

    <AppModal
      v-if="modalOpen"
      :title="editando ? 'Editar Prospecto' : 'Nuevo Prospecto'"
      @close="modalOpen = false"
    >
      <form
        class="space-y-4"
        novalidate
        @submit.prevent="guardar"
      >
        <FormField
          v-slot="{ id, describedby, invalid }"
          :label="`Nombre ${form.tipo === 'empresa' ? '(razón social)' : ''}`.trim()"
          :error="errors.nombre || serverErrors.nombre"
        >
          <input
            :id="id"
            v-model="form.nombre"
            type="text"
            class="field-input"
            :aria-describedby="describedby"
            :aria-invalid="invalid"
          >
        </FormField>

        <div class="flex gap-4 text-sm">
          <label class="flex items-center gap-1.5">
            <input
              v-model="form.tipo"
              type="radio"
              value="empresa"
            > Empresa
          </label>
          <label class="flex items-center gap-1.5">
            <input
              v-model="form.tipo"
              type="radio"
              value="persona"
            > Persona
          </label>
        </div>

        <label
          v-if="form.tipo === 'empresa'"
          class="block text-sm"
        >
          Nombre de contacto (opcional)
          <input
            v-model="form.contactoNombre"
            type="text"
            class="field-input mt-1"
          >
        </label>

        <label class="block text-sm">
          Email (opcional)
          <input
            v-model="form.email"
            type="email"
            class="field-input mt-1"
          >
        </label>

        <label class="block text-sm">
          Teléfono (opcional)
          <input
            v-model="form.telefono"
            type="text"
            class="field-input mt-1"
          >
        </label>

        <label class="block text-sm">
          Fuente (opcional)
          <select
            v-model="form.fuente"
            class="field-input mt-1"
          >
            <option value="">
              Sin especificar
            </option>
            <option
              v-for="f in fuentes"
              :key="f"
              :value="f"
            >
              {{ f }}
            </option>
          </select>
        </label>

        <label class="block text-sm">
          Valor estimado, CLP (opcional)
          <input
            v-model="valorEstimadoDisplay"
            type="text"
            inputmode="numeric"
            class="field-input mt-1"
          >
        </label>

        <label class="block text-sm">
          Notas (opcional)
          <textarea
            v-model="form.notas"
            rows="2"
            class="field-input mt-1"
          />
        </label>

        <div class="flex justify-end gap-2 pt-2">
          <AppButton
            variant="secondary"
            @click="modalOpen = false"
          >
            Cancelar
          </AppButton>
          <AppButton
            type="submit"
            :loading="guardando"
          >
            {{ guardando ? 'Guardando…' : 'Guardar' }}
          </AppButton>
        </div>
      </form>
    </AppModal>

    <GestionModal
      v-if="gestionModalAbierto && prospectoGestion"
      :title="`Gestión — ${prospectoGestion.nombre}`"
      :historial="gestionHistorial"
      :cargando="gestionCargando"
      :guardando="gestionGuardando"
      @guardar="guardarGestion"
      @close="cerrarGestion"
    />

    <AppModal
      v-if="convertirModalAbierto && prospectoConvertir"
      :title="`Marcar como ganado — ${prospectoConvertir.nombre}`"
      @close="cerrarConvertir"
    >
      <form
        class="space-y-4"
        @submit.prevent="confirmarConvertir"
      >
        <p class="text-sm text-[var(--color-muted)]">
          {{ prospectoConvertir.tipo === 'empresa' ? 'Se creará una Empresa con estos datos.' : 'Se creará un Coachee independiente con estos datos.' }}
        </p>

        <label class="block text-sm">
          Nombre
          <input
            v-model="formConvertir.nombre"
            type="text"
            class="field-input mt-1"
          >
        </label>

        <template v-if="prospectoConvertir.tipo === 'empresa'">
          <label class="block text-sm">
            Tarifa por hora, CLP
            <input
              v-model.number="formConvertir.tarifaHora"
              type="number"
              min="1"
              class="field-input mt-1"
            >
          </label>
          <label class="block text-sm">
            Fecha de inicio (opcional)
            <input
              v-model="formConvertir.fechaInicio"
              type="date"
              class="field-input mt-1"
            >
          </label>
          <label class="block text-sm">
            Fecha de fin (opcional)
            <input
              v-model="formConvertir.fechaFin"
              type="date"
              class="field-input mt-1"
            >
          </label>
        </template>
        <template v-else>
          <label class="block text-sm">
            Email
            <input
              v-model="formConvertir.email"
              type="email"
              class="field-input mt-1"
            >
          </label>
          <label class="block text-sm">
            Jefe directo (opcional)
            <input
              v-model="formConvertir.jefeDirecto"
              type="text"
              class="field-input mt-1"
            >
          </label>
          <label class="block text-sm">
            Objetivo del proceso (opcional)
            <textarea
              v-model="formConvertir.objetivoProceso"
              rows="2"
              class="field-input mt-1"
            />
          </label>
          <label class="block text-sm">
            Tarifa propia por hora, CLP (opcional)
            <input
              v-model.number="formConvertir.tarifaPropia"
              type="number"
              min="1"
              class="field-input mt-1"
            >
          </label>
        </template>

        <div class="flex justify-end gap-2 pt-2">
          <AppButton
            variant="secondary"
            @click="cerrarConvertir"
          >
            Cancelar
          </AppButton>
          <AppButton
            type="submit"
            :loading="convirtiendo"
          >
            {{ convirtiendo ? 'Convirtiendo…' : 'Confirmar' }}
          </AppButton>
        </div>
      </form>
    </AppModal>
  </AppShell>
</template>
