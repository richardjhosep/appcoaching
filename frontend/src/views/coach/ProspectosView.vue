<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import AppShell from '../../components/AppShell.vue'
import AppModal from '../../components/AppModal.vue'
import GestionModal from '../../components/GestionModal.vue'
import Pagination from '../../components/Pagination.vue'
import IconButton from '../../components/IconButton.vue'
import SkeletonBlock from '../../components/SkeletonBlock.vue'
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
import { etapaColor, etapaEsCerrada, etapaLabel } from '../../lib/etapaProspecto'

const router = useRouter()

const PAGE_SIZE = 12

const loading = ref(true)
const prospectos = ref<Prospecto[]>([])
const fuentes = ref<string[]>([])
const search = ref('')
const filtroEtapa = ref<EtapaProspecto | ''>('')
const filtroFuente = ref('')
const page = ref(1)

async function load() {
  loading.value = true
  const [p, f] = await Promise.all([
    listProspectos(),
    listarParametros('FUENTES_PROSPECTO'),
  ])
  prospectos.value = p
  fuentes.value = f.filter((param) => param.estado).map((param) => param.valor)
  loading.value = false
}

onMounted(load)

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
    await load()
  } catch (err) {
    serverErrors.value = err instanceof ApiError ? (err.fieldErrors ?? {}) : {}
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
    await load()
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
    await load()
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
    await load()
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
      await load()
      void router.push('/coach/empresas')
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
      await load()
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
        <p class="text-sm text-[var(--color-ink)]/60">
          Negocio en conversación, todavía sin firmar — antes de convertirse en Coachee o Empresa.
        </p>
      </div>
      <button
        class="rounded-lg bg-[var(--color-ink)] px-4 py-2 text-sm font-medium text-[var(--color-parchment)]"
        @click="abrirCrear"
      >
        + Nuevo Prospecto
      </button>
    </div>

    <SkeletonBlock v-if="loading" />
    <div
      v-else
      class="space-y-3"
    >
      <div class="flex flex-wrap items-center gap-2">
        <select
          v-model="filtroEtapa"
          class="rounded-lg border border-[var(--color-line)] px-3 py-1.5 text-sm"
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
          class="rounded-lg border border-[var(--color-line)] px-3 py-1.5 text-sm"
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
        <button
          class="rounded-lg border border-[var(--color-line)] px-3 py-1.5 text-xs hover:bg-[var(--color-parchment)]/50"
          @click="limpiarFiltros"
        >
          × Limpiar filtros
        </button>
        <span class="ml-auto text-xs text-[var(--color-ink)]/50">{{ filtrados.length }} registro(s)</span>
      </div>

      <input
        v-model="search"
        type="search"
        placeholder="Buscar por nombre…"
        class="w-full rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm"
        @input="page = 1"
      >

      <div class="overflow-x-auto rounded-2xl border border-[var(--color-line)] bg-white">
        <table class="w-full text-left text-sm">
          <thead>
            <tr class="border-b border-[var(--color-line)] bg-[var(--color-parchment)] text-xs text-[var(--color-ink)]/60">
              <th class="px-4 py-3">
                Nombre
              </th>
              <th class="px-4 py-3">
                Contacto
              </th>
              <th class="px-4 py-3">
                Fuente
              </th>
              <th class="px-4 py-3">
                Etapa
              </th>
              <th class="px-4 py-3">
                Valor estimado
              </th>
              <th class="px-4 py-3">
                Próximo seguimiento
              </th>
              <th class="px-4 py-3">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-if="paginados.length === 0"
              class="border-b border-[var(--color-line)] last:border-0"
            >
              <td
                colspan="7"
                class="px-4 py-6 text-center text-sm text-[var(--color-ink)]/50"
              >
                Sin resultados.
              </td>
            </tr>
            <tr
              v-for="p in paginados"
              :key="p.id"
              class="border-b border-[var(--color-line)] last:border-0"
            >
              <td class="px-4 py-3 font-medium">
                {{ p.nombre }}
                <span class="block text-xs font-normal text-[var(--color-ink)]/50">
                  {{ p.tipo === 'empresa' ? 'Empresa' : 'Persona' }}
                </span>
              </td>
              <td class="px-4 py-3 text-[var(--color-ink)]/70">
                {{ p.contactoNombre || p.email || p.telefono || '—' }}
              </td>
              <td class="px-4 py-3 text-[var(--color-ink)]/70">
                {{ p.fuente ?? '—' }}
              </td>
              <td class="px-4 py-3">
                <span
                  class="rounded-full px-2 py-0.5 text-xs font-medium"
                  :style="{ color: etapaColor[p.etapa], backgroundColor: `color-mix(in srgb, ${etapaColor[p.etapa]} 15%, transparent)` }"
                >
                  {{ etapaLabel[p.etapa] }}
                </span>
              </td>
              <td class="px-4 py-3 font-[family-name:var(--font-mono)] text-xs">
                {{ p.valorEstimado ? formatoCLP.format(p.valorEstimado) : '—' }}
              </td>
              <td class="px-4 py-3 text-xs text-[var(--color-ink)]/60">
                {{ p.proximoSeguimiento ? new Date(`${p.proximoSeguimiento}T00:00:00`).toLocaleDateString('es-CL') : '—' }}
              </td>
              <td class="px-4 py-3">
                <div class="flex flex-wrap gap-1.5">
                  <template v-if="!etapaEsCerrada(p.etapa)">
                    <button
                      type="button"
                      class="rounded-full border border-[var(--color-line)] px-2 py-1 text-xs hover:bg-[var(--color-parchment)]/60"
                      @click="abrirGestion(p)"
                    >
                      Gestionar
                    </button>
                    <button
                      type="button"
                      class="rounded-full border border-[var(--color-sage)] px-2 py-1 text-xs text-[var(--color-sage)] hover:bg-[var(--color-sage)]/10"
                      @click="abrirConvertir(p)"
                    >
                      Ganado
                    </button>
                    <button
                      type="button"
                      class="rounded-full border border-[var(--color-danger)] px-2 py-1 text-xs text-[var(--color-danger)] hover:bg-[var(--color-danger)]/10"
                      @click="perder(p)"
                    >
                      Perdido
                    </button>
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
        @submit.prevent="guardar"
      >
        <label class="block text-sm">
          Nombre {{ form.tipo === 'empresa' ? '(razón social)' : '' }}
          <input
            v-model="form.nombre"
            type="text"
            class="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
            :class="errors.nombre || serverErrors.nombre ? 'border-[var(--color-danger)]' : 'border-[var(--color-line)]'"
          >
          <span
            v-if="errors.nombre || serverErrors.nombre"
            class="mt-1 block text-xs text-[var(--color-danger)]"
          >{{ errors.nombre || serverErrors.nombre }}</span>
        </label>

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
            class="mt-1 w-full rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm"
          >
        </label>

        <label class="block text-sm">
          Email (opcional)
          <input
            v-model="form.email"
            type="email"
            class="mt-1 w-full rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm"
          >
        </label>

        <label class="block text-sm">
          Teléfono (opcional)
          <input
            v-model="form.telefono"
            type="text"
            class="mt-1 w-full rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm"
          >
        </label>

        <label class="block text-sm">
          Fuente (opcional)
          <select
            v-model="form.fuente"
            class="mt-1 w-full rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm"
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
            class="mt-1 w-full rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm"
          >
        </label>

        <label class="block text-sm">
          Notas (opcional)
          <textarea
            v-model="form.notas"
            rows="2"
            class="mt-1 w-full rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm"
          />
        </label>

        <div class="flex justify-end gap-2 pt-2">
          <button
            type="button"
            class="rounded-lg border border-[var(--color-line)] px-4 py-2 text-sm"
            @click="modalOpen = false"
          >
            Cancelar
          </button>
          <button
            type="submit"
            :disabled="guardando"
            class="rounded-lg bg-[var(--color-ink)] px-4 py-2 text-sm text-[var(--color-parchment)] disabled:opacity-60"
          >
            {{ guardando ? 'Guardando…' : 'Guardar' }}
          </button>
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
        <p class="text-sm text-[var(--color-ink)]/60">
          {{ prospectoConvertir.tipo === 'empresa' ? 'Se creará una Empresa con estos datos.' : 'Se creará un Coachee independiente con estos datos.' }}
        </p>

        <label class="block text-sm">
          Nombre
          <input
            v-model="formConvertir.nombre"
            type="text"
            class="mt-1 w-full rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm"
          >
        </label>

        <template v-if="prospectoConvertir.tipo === 'empresa'">
          <label class="block text-sm">
            Tarifa por hora, CLP
            <input
              v-model.number="formConvertir.tarifaHora"
              type="number"
              min="1"
              class="mt-1 w-full rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm"
            >
          </label>
          <label class="block text-sm">
            Fecha de inicio (opcional)
            <input
              v-model="formConvertir.fechaInicio"
              type="date"
              class="mt-1 w-full rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm"
            >
          </label>
          <label class="block text-sm">
            Fecha de fin (opcional)
            <input
              v-model="formConvertir.fechaFin"
              type="date"
              class="mt-1 w-full rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm"
            >
          </label>
        </template>
        <template v-else>
          <label class="block text-sm">
            Email
            <input
              v-model="formConvertir.email"
              type="email"
              class="mt-1 w-full rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm"
            >
          </label>
          <label class="block text-sm">
            Jefe directo (opcional)
            <input
              v-model="formConvertir.jefeDirecto"
              type="text"
              class="mt-1 w-full rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm"
            >
          </label>
          <label class="block text-sm">
            Objetivo del proceso (opcional)
            <textarea
              v-model="formConvertir.objetivoProceso"
              rows="2"
              class="mt-1 w-full rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm"
            />
          </label>
          <label class="block text-sm">
            Tarifa propia por hora, CLP (opcional)
            <input
              v-model.number="formConvertir.tarifaPropia"
              type="number"
              min="1"
              class="mt-1 w-full rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm"
            >
          </label>
        </template>

        <div class="flex justify-end gap-2 pt-2">
          <button
            type="button"
            class="rounded-lg border border-[var(--color-line)] px-4 py-2 text-sm"
            @click="cerrarConvertir"
          >
            Cancelar
          </button>
          <button
            type="submit"
            :disabled="convirtiendo"
            class="rounded-lg bg-[var(--color-sage)] px-4 py-2 text-sm text-white disabled:opacity-60"
          >
            {{ convirtiendo ? 'Convirtiendo…' : 'Confirmar' }}
          </button>
        </div>
      </form>
    </AppModal>
  </AppShell>
</template>
