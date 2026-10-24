<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import AppShell from '../../components/AppShell.vue'
import AppModal from '../../components/AppModal.vue'
import Pagination from '../../components/Pagination.vue'
import StatusToggle from '../../components/StatusToggle.vue'
import IconButton from '../../components/IconButton.vue'
import SkeletonBlock from '../../components/SkeletonBlock.vue'
import ErrorState from '../../components/ErrorState.vue'
import AppButton from '../../components/AppButton.vue'
import FormField from '../../components/FormField.vue'
import SortableTh from '../../components/SortableTh.vue'
import StatusBadge from '../../components/StatusBadge.vue'
import EmptyState from '../../components/EmptyState.vue'
import {
  createEmpresa,
  deleteEmpresa,
  listEmpresas,
  updateEmpresa,
  getCompetenciasDeEmpresa,
  setCompetenciasDeEmpresa,
  type Empresa,
} from '../../api/empresas'
import { listCompetenciasDeEmpresaParaCoach, type Competencia } from '../../api/competencias'
import { getKpisDeEmpresa, getEncuestasDeEmpresa, type KpisEmpresa, type Encuesta } from '../../api/satisfaccion'
import { ApiError } from '../../api/client'
import { notifyError, notifySuccess, confirmDialog } from '../../lib/notify'
import { dentroDeRango } from '../../lib/dateRange'
import { formatCLP, formatUF, type Moneda } from '../../lib/moneda'
import TarifaInput from '../../components/TarifaInput.vue'
import { listUsers, type UserAccount } from '../../api/users'
import { useAuthStore } from '../../stores/auth'
import { useRoute, useRouter } from 'vue-router'
import { useCarga } from '../../lib/useCarga'
import { ordenarPor, useOrden } from '../../lib/ordenar'
import { leerTexto } from '../../lib/queryParams'
import { enfocarPrimerInvalido } from '../../lib/enfocarInvalido'

const PAGE_SIZE = 12

const empresas = ref<Empresa[]>([])
const search = ref('')
const filtroEstado = ref<'' | 'activas' | 'inactivas'>('')
// Vacío por defecto — un mantenedor debe mostrar todo hasta que el coach acote, nunca ocultar
// registros existentes solo porque se creó antes del 1° del mes actual.
const fechaDesde = ref('')
const fechaHasta = ref('')
const page = ref(1)

// Se carga por empresa al abrir el editor: catálogo global del coach + el manual propio que
// esa empresa cargó desde su portal (empresaId no nulo).
const competenciasDisponibles = ref<Competencia[]>([])
const competenciasDeLaEmpresa = computed(() => competenciasDisponibles.value.filter((c) => c.empresaId))
const competenciasDelCatalogo = computed(() => competenciasDisponibles.value.filter((c) => !c.empresaId))

async function load() {
  const [data, usuarios] = await Promise.all([
    listEmpresas(),
    // Solo el superadmin necesita saber qué usuario tiene cada empresa (para "Ver como").
    auth.user?.superadmin ? listUsers().catch(() => [] as UserAccount[]) : Promise.resolve([] as UserAccount[]),
  ])
  empresas.value = data
  usuariosEmpresa.value = usuarios.filter((u) => u.role === 'empresa')
}

const { loading, error, recargar } = useCarga(load)

// --- "Ver como" (solo superadmin): entra al portal de la empresa en solo lectura usando una
// de sus cuentas de usuario (todas ven el mismo portal); se prefiere una activa.
const auth = useAuthStore()
const router = useRouter()
const route = useRoute()
const usuariosEmpresa = ref<UserAccount[]>([])
const entrandoVerComo = ref<string | null>(null)

function usuarioDeEmpresa(empresaId: string): UserAccount | null {
  const deLaEmpresa = usuariosEmpresa.value.filter((u) => u.empresaId === empresaId)
  return deLaEmpresa.find((u) => u.isActive) ?? deLaEmpresa[0] ?? null
}

async function verComoEmpresa(empresa: Empresa) {
  const usuario = usuarioDeEmpresa(empresa.id)
  if (!usuario) return
  entrandoVerComo.value = empresa.id
  try {
    await auth.iniciarVerComo(usuario.id, '/coach/empresas')
    await router.push('/')
  } catch (err) {
    await notifyError('No se pudo entrar en modo "Ver como"', err instanceof ApiError ? err.message : 'Ocurrió un error inesperado.')
  } finally {
    entrandoVerComo.value = null
  }
}

// Búsqueda global / enlaces: /coach/empresas?id=<empresa> abre el editor de esa empresa.
async function abrirDesdeQuery() {
  const id = leerTexto(route.query, 'id')
  if (!id || loading.value || error.value) return
  const empresa = empresas.value.find((e) => e.id === id)
  await router.replace({ query: { ...route.query, id: undefined } })
  if (empresa) await abrirEditar(empresa)
}

onMounted(async () => {
  await recargar()
  await abrirDesdeQuery()
})
watch(() => route.query.id, () => void abrirDesdeQuery())

const filtradas = computed(() => {
  const q = search.value.trim().toLowerCase()
  return empresas.value.filter((e) => {
    if (q && !e.nombre.toLowerCase().includes(q)) return false
    if (filtroEstado.value === 'activas' && !e.isActive) return false
    if (filtroEstado.value === 'inactivas' && e.isActive) return false
    if (!dentroDeRango(e.createdAt, fechaDesde.value, fechaHasta.value)) return false
    return true
  })
})

const orden = useOrden('creado', 'desc')
const VALOR_ORDEN: Record<string, (e: Empresa) => string | number | boolean | null | undefined> = {
  nombre: (e) => e.nombre,
  tarifa: (e) => e.tarifaHora,
  horas: (e) => e.horasContratadasEfectivas ?? e.horasContratadas,
  pagada: (e) => e.pagada,
  fin: (e) => e.fechaFin,
  estado: (e) => e.isActive,
  creado: (e) => e.createdAt,
}
const ordenadas = computed(() =>
  ordenarPor(filtradas.value, VALOR_ORDEN[orden.clave.value] ?? VALOR_ORDEN.creado, orden.dir.value),
)

const paginadas = computed(() => {
  const start = (page.value - 1) * PAGE_SIZE
  return ordenadas.value.slice(start, start + PAGE_SIZE)
})

function ordenarPorColumna(clave: string) {
  orden.alternar(clave)
  page.value = 1
}

function limpiarFiltros() {
  search.value = ''
  filtroEstado.value = ''
  fechaDesde.value = ''
  fechaHasta.value = ''
  page.value = 1
}

function formatoTarifa(e: Empresa): string {
  return e.tarifaHoraMoneda === 'uf' ? formatUF(e.tarifaHora) : formatCLP(e.tarifaHora)
}

function formatoFechaFin(fechaFin: string | null): string {
  if (!fechaFin) return '—'
  return new Date(`${fechaFin}T00:00:00`).toLocaleDateString('es-CL')
}

// --- Modal de satisfacción: la empresa llena su encuesta desde su propia cuenta (calificación
// 1-5 general, no ligada a un coachee o ciclo puntual) — hasta ahora esa data no se veía en
// ningún lado del panel del coach pese a que el endpoint ya existía.
const modalSatisfaccion = ref<Empresa | null>(null)
const kpisSatisfaccion = ref<KpisEmpresa | null>(null)
const encuestasSatisfaccion = ref<Encuesta[]>([])
const cargandoSatisfaccion = ref(false)

async function abrirSatisfaccion(empresa: Empresa) {
  modalSatisfaccion.value = empresa
  cargandoSatisfaccion.value = true
  const [kpis, encuestas] = await Promise.all([
    getKpisDeEmpresa(empresa.id),
    getEncuestasDeEmpresa(empresa.id),
  ])
  kpisSatisfaccion.value = kpis
  encuestasSatisfaccion.value = encuestas
  cargandoSatisfaccion.value = false
}

// --- Modal de creación/edición ---
const modalOpen = ref(false)
const editando = ref<Empresa | null>(null)
const guardando = ref(false)
const form = reactive({
  nombre: '',
  tarifaHora: null as number | null,
  tarifaHoraMoneda: 'clp' as Moneda,
  horasContratadas: null as number | null,
  horasFijas: false,
  pagada: false,
  fechaInicio: '',
  fechaFin: '',
})
const errors = reactive<{ nombre?: string; tarifaHora?: string }>({})
const serverErrors = ref<Record<string, string>>({})

// Competencias prioritarias/contratadas — solo tiene sentido una vez que la empresa ya
// existe (mismo criterio que horasContratadas/pagada, ocultos al crear).
// Siguiente paso guiado: tras crear una empresa se ofrece crear su primer coachee.
const recienCreada = ref<{ id: string; nombre: string } | null>(null)

const competenciasSeleccionadas = ref<string[]>([])
const horasCalculadas = ref<number | null>(null)
function toggleCompetencia(competenciaId: string) {
  competenciasSeleccionadas.value = competenciasSeleccionadas.value.includes(competenciaId)
    ? competenciasSeleccionadas.value.filter((id) => id !== competenciaId)
    : [...competenciasSeleccionadas.value, competenciaId]
}

function abrirCrear() {
  editando.value = null
  form.nombre = ''
  form.tarifaHora = null
  form.tarifaHoraMoneda = 'clp'
  form.horasContratadas = null
  form.horasFijas = false
  form.pagada = false
  form.fechaInicio = ''
  form.fechaFin = ''
  errors.nombre = undefined
  errors.tarifaHora = undefined
  serverErrors.value = {}
  modalOpen.value = true
}

async function abrirEditar(empresa: Empresa) {
  editando.value = empresa
  form.nombre = empresa.nombre
  form.tarifaHora = empresa.tarifaHora
  form.tarifaHoraMoneda = empresa.tarifaHoraMoneda
  // Al activar "horas fijas" se parte del valor que hoy rige (si no hay uno manual guardado).
  form.horasContratadas = empresa.horasFijas
    ? empresa.horasContratadas
    : (empresa.horasContratadas ?? empresa.horasContratadasEfectivas ?? null)
  form.horasFijas = empresa.horasFijas
  horasCalculadas.value = empresa.horasFijas ? null : (empresa.horasContratadasEfectivas ?? 0)
  form.pagada = empresa.pagada
  form.fechaInicio = empresa.fechaInicio ?? ''
  form.fechaFin = empresa.fechaFin ?? ''
  errors.nombre = undefined
  errors.tarifaHora = undefined
  serverErrors.value = {}
  competenciasSeleccionadas.value = []
  competenciasDisponibles.value = []
  modalOpen.value = true
  const [actuales, disponibles] = await Promise.all([
    getCompetenciasDeEmpresa(empresa.id),
    listCompetenciasDeEmpresaParaCoach(empresa.id),
  ])
  competenciasSeleccionadas.value = actuales.map((c) => c.competenciaId)
  competenciasDisponibles.value = disponibles
}

function validar(): boolean {
  errors.nombre = !form.nombre.trim() || form.nombre.trim().length < 2
    ? 'El nombre debe tener al menos 2 caracteres.'
    : undefined
  // En UF el monto es fraccionario (ej. 3.5) — el entero solo se exige en CLP.
  errors.tarifaHora = form.tarifaHora === null || form.tarifaHora <= 0
    || (form.tarifaHoraMoneda === 'clp' && !Number.isInteger(form.tarifaHora))
    ? 'La tarifa por hora es obligatoria y debe ser mayor a 0.'
    : undefined
  const valido = !errors.nombre && !errors.tarifaHora
  if (!valido) void enfocarPrimerInvalido()
  return valido
}

async function guardar() {
  if (!validar()) return
  guardando.value = true
  serverErrors.value = {}
  try {
    if (editando.value) {
      await Promise.all([
        updateEmpresa(editando.value.id, {
          nombre: form.nombre,
          tarifaHora: form.tarifaHora!,
          tarifaHoraMoneda: form.tarifaHoraMoneda,
          horasFijas: form.horasFijas,
          // El valor manual solo se manda cuando rige — si no, se conserva el guardado.
          ...(form.horasFijas ? { horasContratadas: form.horasContratadas ?? 0 } : {}),
          pagada: form.pagada,
          fechaInicio: form.fechaInicio || null,
          fechaFin: form.fechaFin || null,
        }),
        setCompetenciasDeEmpresa(editando.value.id, competenciasSeleccionadas.value),
      ])
      modalOpen.value = false
      await recargar()
      await notifySuccess('Empresa actualizada', `Los datos de ${form.nombre} se guardaron correctamente.`)
    } else {
      const creada = await createEmpresa(
        form.nombre,
        form.tarifaHora!,
        form.tarifaHoraMoneda,
        form.fechaInicio || undefined,
        form.fechaFin || undefined,
      )
      modalOpen.value = false
      if (creada) recienCreada.value = { id: creada.id, nombre: creada.nombre }
      await recargar()
      await notifySuccess('Empresa creada', `${form.nombre} ya está disponible para asignar coachees.`)
    }
  } catch (err) {
    serverErrors.value = err instanceof ApiError ? (err.fieldErrors ?? {}) : {}
    void enfocarPrimerInvalido()
    await notifyError('No se pudo guardar', err instanceof ApiError ? err.message : 'Ocurrió un error inesperado.')
  } finally {
    guardando.value = false
  }
}

async function toggleActivo(empresa: Empresa) {
  const activar = !empresa.isActive
  const confirmado = await confirmDialog({
    title: activar ? '¿Activar esta empresa?' : '¿Desactivar esta empresa?',
    text: activar
      ? `${empresa.nombre} volverá a estar disponible.`
      : `${empresa.nombre} quedará marcada como inactiva. No se elimina ningún dato.`,
    confirmText: activar ? 'Activar' : 'Desactivar',
    danger: !activar,
  })
  if (!confirmado) return
  try {
    await updateEmpresa(empresa.id, { isActive: activar })
    await recargar()
    await notifySuccess(activar ? 'Empresa activada' : 'Empresa desactivada')
  } catch (err) {
    await notifyError('No se pudo cambiar el estado', err instanceof ApiError ? err.message : 'Ocurrió un error inesperado.')
  }
}

async function eliminar(empresa: Empresa) {
  const confirmado = await confirmDialog({
    title: '¿Eliminar esta empresa?',
    text: `Esta acción no se puede deshacer. Se eliminará ${empresa.nombre} de forma definitiva.`,
    confirmText: 'Eliminar',
    danger: true,
  })
  if (!confirmado) return
  try {
    await deleteEmpresa(empresa.id)
    await recargar()
    await notifySuccess('Empresa eliminada')
  } catch (err) {
    await notifyError('No se pudo eliminar', err instanceof ApiError ? err.message : 'Ocurrió un error inesperado.')
  }
}
</script>

<template>
  <AppShell>
    <div class="mb-4 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 class="font-[family-name:var(--font-heading)] text-xl font-semibold">
          Mantenedor de Empresas
        </h1>
        <p class="text-sm text-[var(--color-muted)]">
          Gestión y administración de las empresas del sistema.
        </p>
      </div>
      <AppButton @click="abrirCrear">
        + Nueva Empresa
      </AppButton>
    </div>

    <div
      v-if="recienCreada"
      role="status"
      class="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--color-sage)]/40 bg-[var(--color-sage)]/10 px-4 py-3 text-sm"
    >
      <span><strong>{{ recienCreada.nombre }}</strong> ya está creada. El siguiente paso es sumar a sus coachees.</span>
      <span class="flex items-center gap-2">
        <RouterLink
          :to="{ path: '/coach/coachees', query: { crear: '1', empresaId: recienCreada.id } }"
          class="inline-flex min-h-11 items-center rounded-lg bg-[var(--color-primary)] px-4 text-sm font-medium text-[var(--color-on-primary)] hover:bg-[var(--color-primary-hover)] sm:min-h-9"
        >
          Crear coachee de esta empresa
        </RouterLink>
        <AppButton
          variant="ghost"
          size="sm"
          @click="recienCreada = null"
        >
          Cerrar
        </AppButton>
      </span>
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
    <div
      v-else
      class="space-y-3"
    >
      <div class="flex flex-wrap items-center gap-2">
        <select
          v-model="filtroEstado"
          aria-label="Filtrar por estado"
          class="field-input w-auto"
          @change="page = 1"
        >
          <option value="">
            Estado: Todas
          </option>
          <option value="activas">
            Activas
          </option>
          <option value="inactivas">
            Inactivas
          </option>
        </select>
        <label class="flex items-center gap-1.5 text-xs text-[var(--color-muted)]">
          Desde
          <input
            v-model="fechaDesde"
            type="date"
            class="field-input w-auto"
            @change="page = 1"
          >
        </label>
        <label class="flex items-center gap-1.5 text-xs text-[var(--color-muted)]">
          Hasta
          <input
            v-model="fechaHasta"
            type="date"
            class="field-input w-auto"
            @change="page = 1"
          >
        </label>
        <AppButton
          variant="secondary"
          size="sm"
          @click="limpiarFiltros"
        >
          × Limpiar filtros
        </AppButton>
        <span class="ml-auto text-xs text-[var(--color-muted)]">{{ filtradas.length }} registro(s)</span>
      </div>

      <input
        v-model="search"
        type="search"
        aria-label="Buscar empresas"
        placeholder="Buscar por nombre…"
        class="field-input"
        @input="page = 1"
      >

      <div class="data-table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <SortableTh
                label="Nombre"
                :activo="orden.clave.value === 'nombre'"
                :dir="orden.dir.value"
                @ordenar="ordenarPorColumna('nombre')"
              />
              <SortableTh
                label="Tarifa/hora"
                :activo="orden.clave.value === 'tarifa'"
                :dir="orden.dir.value"
                @ordenar="ordenarPorColumna('tarifa')"
              />
              <SortableTh
                label="Horas contratadas"
                :activo="orden.clave.value === 'horas'"
                :dir="orden.dir.value"
                @ordenar="ordenarPorColumna('horas')"
              />
              <SortableTh
                label="Pagada"
                :activo="orden.clave.value === 'pagada'"
                :dir="orden.dir.value"
                @ordenar="ordenarPorColumna('pagada')"
              />
              <SortableTh
                label="Término contrato"
                :activo="orden.clave.value === 'fin'"
                :dir="orden.dir.value"
                @ordenar="ordenarPorColumna('fin')"
              />
              <SortableTh
                label="Estado"
                :activo="orden.clave.value === 'estado'"
                :dir="orden.dir.value"
                @ordenar="ordenarPorColumna('estado')"
              />
              <SortableTh
                label="Creado"
                :activo="orden.clave.value === 'creado'"
                :dir="orden.dir.value"
                @ordenar="ordenarPorColumna('creado')"
              />
              <th scope="col">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="paginadas.length === 0">
              <td
                colspan="8"
                class="py-6 text-center text-sm text-[var(--color-muted)]"
              >
                Sin resultados.
              </td>
            </tr>
            <tr
              v-for="e in paginadas"
              :key="e.id"
            >
              <td class="font-medium">
                {{ e.nombre }}
              </td>
              <td class="cifra text-xs">
                {{ formatoTarifa(e) }}
              </td>
              <td>
                {{ e.horasContratadasEfectivas ?? e.horasContratadas ?? '—' }}
                <span
                  v-if="!e.horasFijas"
                  class="block text-xs text-[var(--color-muted)]"
                >según sesiones</span>
              </td>
              <td>
                <StatusBadge :tone="e.pagada ? 'sage' : 'bronze'">
                  {{ e.pagada ? 'Sí' : 'No' }}
                </StatusBadge>
              </td>
              <td
                class="text-xs"
                :class="!e.fechaFin ? 'text-[var(--color-bronze)]' : ''"
              >
                {{ formatoFechaFin(e.fechaFin) }}
              </td>
              <td>
                <StatusToggle
                  :active="e.isActive"
                  @toggle="toggleActivo(e)"
                />
              </td>
              <td class="text-xs text-[var(--color-muted)]">
                {{ e.createdAt ? new Date(e.createdAt).toLocaleDateString('es-CL') : '—' }}
              </td>
              <td>
                <div class="flex items-center gap-2">
                  <button
                    v-if="auth.user?.superadmin"
                    type="button"
                    class="inline-flex h-8 items-center gap-1.5 rounded-lg bg-[var(--color-saltup)] px-2.5 text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                    :disabled="!usuarioDeEmpresa(e.id) || entrandoVerComo === e.id"
                    :title="usuarioDeEmpresa(e.id)
                      ? `Ver el portal de ${e.nombre} tal como lo ve la empresa (solo lectura)`
                      : 'Esta empresa todavía no tiene una cuenta de usuario (créala en Usuarios)'"
                    @click="verComoEmpresa(e)"
                  >
                    <svg
                      width="13"
                      height="13"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      aria-hidden="true"
                    ><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7Z" /><circle
                      cx="12"
                      cy="12"
                      r="3"
                    /></svg>
                    Ver como
                  </button>
                  <IconButton
                    icon="ver"
                    title="Ver satisfacción"
                    @click="abrirSatisfaccion(e)"
                  />
                  <IconButton
                    icon="editar"
                    title="Editar"
                    @click="abrirEditar(e)"
                  />
                  <IconButton
                    icon="eliminar"
                    title="Eliminar"
                    @click="eliminar(e)"
                  />
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <Pagination
        v-model:page="page"
        :total-items="filtradas.length"
        :page-size="PAGE_SIZE"
      />
    </div>

    <AppModal
      v-if="modalOpen"
      :title="editando ? 'Editar empresa' : 'Nueva empresa'"
      @close="modalOpen = false"
    >
      <form
        class="space-y-4"
        novalidate
        @submit.prevent="guardar"
      >
        <FormField
          v-slot="{ id, describedby, invalid }"
          label="Nombre"
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

        <TarifaInput
          v-model="form.tarifaHora"
          v-model:moneda="form.tarifaHoraMoneda"
          label="Tarifa por hora"
          :error="errors.tarifaHora || serverErrors.tarifaHora"
        />

        <div class="grid grid-cols-2 gap-3">
          <FormField
            v-slot="{ id }"
            label="Inicio de contrato (opcional)"
          >
            <input
              :id="id"
              v-model="form.fechaInicio"
              type="date"
              class="field-input"
            >
          </FormField>
          <FormField
            v-slot="{ id }"
            label="Término de contrato (opcional)"
          >
            <input
              :id="id"
              v-model="form.fechaFin"
              type="date"
              class="field-input"
            >
          </FormField>
        </div>

        <div
          v-if="editando"
          class="space-y-2 text-sm"
        >
          <p>Horas contratadas</p>
          <label class="flex items-start gap-2 text-xs">
            <input
              v-model="form.horasFijas"
              type="checkbox"
              class="mt-0.5"
            >
            <span>
              Horas fijas por contrato
              <span class="block text-[var(--color-muted)]">
                Solo si la empresa contrató un número cerrado de horas. Si no, se calculan solas
                como la suma de las sesiones de sus coachees y cambian con cada coachee nuevo.
              </span>
            </span>
          </label>
          <input
            v-if="form.horasFijas"
            v-model.number="form.horasContratadas"
            type="number"
            min="0"
            aria-label="Horas contratadas fijas"
            class="field-input"
          >
          <p
            v-else
            class="rounded-lg bg-[var(--color-parchment)]/60 px-3 py-2 cifra"
          >
            {{ horasCalculadas ?? '—' }} h <span class="font-[family-name:var(--font-body)] text-xs text-[var(--color-muted)]">(según sesiones de sus coachees)</span>
          </p>
        </div>

        <label
          v-if="editando"
          class="flex items-center gap-2 text-sm"
        >
          <input
            v-model="form.pagada"
            type="checkbox"
          >
          Pagada
        </label>

        <div
          v-if="editando"
          class="text-sm"
        >
          Competencias prioritarias/contratadas
          <p class="mb-2 mt-1 text-xs text-[var(--color-muted)]">
            Las que marques son las que los coachees de esta empresa podrán asociar a su plan,
            junto con el manual propio de la empresa (si lo cargó).
          </p>
          <div class="max-h-56 space-y-2 overflow-y-auto rounded-lg border border-[var(--color-line)] p-2">
            <div v-if="competenciasDeLaEmpresa.length > 0">
              <p class="mb-1 text-xs font-semibold uppercase tracking-wide text-[var(--color-saltup)]">
                Manual de la empresa
              </p>
              <div class="grid gap-1 sm:grid-cols-2">
                <label
                  v-for="c in competenciasDeLaEmpresa"
                  :key="c.id"
                  class="flex items-center gap-2 text-xs"
                >
                  <input
                    type="checkbox"
                    :checked="competenciasSeleccionadas.includes(c.id)"
                    @change="toggleCompetencia(c.id)"
                  >
                  {{ c.nombre }}
                </label>
              </div>
            </div>
            <div>
              <p
                v-if="competenciasDeLaEmpresa.length > 0"
                class="mb-1 text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]"
              >
                Mi catálogo
              </p>
              <div class="grid gap-1 sm:grid-cols-2">
                <label
                  v-for="c in competenciasDelCatalogo"
                  :key="c.id"
                  class="flex items-center gap-2 text-xs"
                >
                  <input
                    type="checkbox"
                    :checked="competenciasSeleccionadas.includes(c.id)"
                    @change="toggleCompetencia(c.id)"
                  >
                  {{ c.nombre }}
                </label>
              </div>
            </div>
          </div>
        </div>

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

    <!-- Modal: Ver satisfacción -->
    <AppModal
      v-if="modalSatisfaccion"
      title="Satisfacción"
      size="lg"
      @close="modalSatisfaccion = null"
    >
      <p class="mb-4 text-sm font-medium">
        {{ modalSatisfaccion.nombre }}
      </p>
      <SkeletonBlock v-if="cargandoSatisfaccion" />
      <template v-else-if="kpisSatisfaccion">
        <div class="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div class="rounded-xl border border-[var(--color-line)] p-3">
            <p class="mb-1 text-xs text-[var(--color-muted)]">
              Satisfacción promedio
            </p>
            <p class="cifra text-xl font-semibold">
              {{ kpisSatisfaccion.satisfaccionPromedio !== null ? `${kpisSatisfaccion.satisfaccionPromedio} ★` : '—' }}
            </p>
          </div>
          <div class="rounded-xl border border-[var(--color-line)] p-3">
            <p class="mb-1 text-xs text-[var(--color-muted)]">
              Tasa de asistencia
            </p>
            <p class="cifra text-xl font-semibold">
              {{ kpisSatisfaccion.tasaAsistencia !== null ? `${kpisSatisfaccion.tasaAsistencia}%` : '—' }}
            </p>
          </div>
          <div class="rounded-xl border border-[var(--color-line)] p-3">
            <p class="mb-1 text-xs text-[var(--color-muted)]">
              Procesos terminados
            </p>
            <p class="cifra text-xl font-semibold">
              {{ kpisSatisfaccion.procesosTerminados }}
            </p>
          </div>
          <div class="rounded-xl border border-[var(--color-line)] p-3">
            <p class="mb-1 text-xs text-[var(--color-muted)]">
              Procesos en curso
            </p>
            <p class="cifra text-xl font-semibold">
              {{ kpisSatisfaccion.procesosEnCurso }}
            </p>
          </div>
        </div>

        <div class="border-t border-[var(--color-line)] pt-4">
          <p class="mb-2 text-xs font-medium uppercase tracking-wide text-[var(--color-muted)]">
            Encuestas respondidas
          </p>
          <EmptyState
            v-if="encuestasSatisfaccion.length === 0"
            icon="satisfaccion"
            title="Todavía no ha respondido ninguna encuesta"
            description="La empresa completa esta encuesta desde su propia cuenta, cuando quiera."
          />
          <ul
            v-else
            class="space-y-2"
          >
            <li
              v-for="enc in encuestasSatisfaccion"
              :key="enc.id"
              class="rounded-xl border border-[var(--color-line)] p-3"
            >
              <div class="mb-1 flex flex-wrap items-center justify-between gap-2">
                <span class="text-sm font-medium">
                  {{ enc.ciclo?.coachee?.nombre ?? 'Encuesta general (sin ciclo asociado)' }}
                </span>
                <span class="flex items-center gap-2">
                  <span class="text-sm">
                    <span
                      v-for="n in 5"
                      :key="n"
                      :class="n <= enc.calificacion ? 'text-[var(--color-bronze)]' : 'text-[var(--color-muted)]'"
                    >★</span>
                  </span>
                  <span class="text-xs text-[var(--color-muted)]">{{ new Date(enc.createdAt).toLocaleDateString('es-CL') }}</span>
                </span>
              </div>
              <ul
                v-if="enc.respuestas"
                class="mb-1 space-y-0.5 text-xs text-[var(--color-ink)]/70"
              >
                <li
                  v-for="r in enc.respuestas"
                  :key="r.categoria"
                >
                  {{ r.categoria }}: {{ r.valor }}/5
                </li>
              </ul>
              <p
                v-if="enc.comentario"
                class="text-sm"
              >
                {{ enc.comentario }}
              </p>
            </li>
          </ul>
        </div>
      </template>
    </AppModal>
  </AppShell>
</template>
