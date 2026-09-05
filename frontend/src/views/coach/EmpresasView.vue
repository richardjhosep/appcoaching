<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import AppShell from '../../components/AppShell.vue'
import AppModal from '../../components/AppModal.vue'
import Pagination from '../../components/Pagination.vue'
import StatusToggle from '../../components/StatusToggle.vue'
import IconButton from '../../components/IconButton.vue'
import SkeletonBlock from '../../components/SkeletonBlock.vue'
import EmptyState from '../../components/EmptyState.vue'
import { createEmpresa, deleteEmpresa, listEmpresas, updateEmpresa, type Empresa } from '../../api/empresas'
import { getKpisDeEmpresa, getEncuestasDeEmpresa, type KpisEmpresa, type Encuesta } from '../../api/satisfaccion'
import { ApiError } from '../../api/client'
import { notifyError, notifySuccess, confirmDialog } from '../../lib/notify'
import { dentroDeRango } from '../../lib/dateRange'

const PAGE_SIZE = 12

const loading = ref(true)
const empresas = ref<Empresa[]>([])
const search = ref('')
const filtroEstado = ref<'' | 'activas' | 'inactivas'>('')
// Vacío por defecto — un mantenedor debe mostrar todo hasta que el coach acote, nunca ocultar
// registros existentes solo porque se creó antes del 1° del mes actual.
const fechaDesde = ref('')
const fechaHasta = ref('')
const page = ref(1)

async function load() {
  loading.value = true
  const data = await listEmpresas()
  data.sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''))
  empresas.value = data
  loading.value = false
}

onMounted(load)

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

const paginadas = computed(() => {
  const start = (page.value - 1) * PAGE_SIZE
  return filtradas.value.slice(start, start + PAGE_SIZE)
})

function limpiarFiltros() {
  search.value = ''
  filtroEstado.value = ''
  fechaDesde.value = ''
  fechaHasta.value = ''
  page.value = 1
}

const formatoCLP = new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 })

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
  horasContratadas: null as number | null,
  pagada: false,
  fechaInicio: '',
  fechaFin: '',
})
const errors = reactive<{ nombre?: string; tarifaHora?: string }>({})
const serverErrors = ref<Record<string, string>>({})

function abrirCrear() {
  editando.value = null
  form.nombre = ''
  form.tarifaHora = null
  form.horasContratadas = null
  form.pagada = false
  form.fechaInicio = ''
  form.fechaFin = ''
  errors.nombre = undefined
  errors.tarifaHora = undefined
  serverErrors.value = {}
  modalOpen.value = true
}

function abrirEditar(empresa: Empresa) {
  editando.value = empresa
  form.nombre = empresa.nombre
  form.tarifaHora = empresa.tarifaHora
  form.horasContratadas = empresa.horasContratadas
  form.pagada = empresa.pagada
  form.fechaInicio = empresa.fechaInicio ?? ''
  form.fechaFin = empresa.fechaFin ?? ''
  errors.nombre = undefined
  errors.tarifaHora = undefined
  serverErrors.value = {}
  modalOpen.value = true
}

function validar(): boolean {
  errors.nombre = !form.nombre.trim() || form.nombre.trim().length < 2
    ? 'El nombre debe tener al menos 2 caracteres.'
    : undefined
  errors.tarifaHora = form.tarifaHora === null || form.tarifaHora <= 0 || !Number.isInteger(form.tarifaHora)
    ? 'La tarifa por hora es obligatoria y debe ser un entero mayor a 0.'
    : undefined
  return !errors.nombre && !errors.tarifaHora
}

async function guardar() {
  if (!validar()) return
  guardando.value = true
  serverErrors.value = {}
  try {
    if (editando.value) {
      await updateEmpresa(editando.value.id, {
        nombre: form.nombre,
        tarifaHora: form.tarifaHora!,
        horasContratadas: form.horasContratadas,
        pagada: form.pagada,
        fechaInicio: form.fechaInicio || null,
        fechaFin: form.fechaFin || null,
      })
      modalOpen.value = false
      await load()
      await notifySuccess('Empresa actualizada', `Los datos de ${form.nombre} se guardaron correctamente.`)
    } else {
      await createEmpresa(form.nombre, form.tarifaHora!, form.fechaInicio || undefined, form.fechaFin || undefined)
      modalOpen.value = false
      await load()
      await notifySuccess('Empresa creada', `${form.nombre} ya está disponible para asignar coachees.`)
    }
  } catch (err) {
    serverErrors.value = err instanceof ApiError ? (err.fieldErrors ?? {}) : {}
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
    await load()
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
    await load()
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
        <p class="text-sm text-[var(--color-ink)]/60">
          Gestión y administración de las empresas del sistema.
        </p>
      </div>
      <button
        class="rounded-lg bg-[var(--color-ink)] px-4 py-2 text-sm font-medium text-[var(--color-parchment)]"
        @click="abrirCrear"
      >
        + Nueva Empresa
      </button>
    </div>

    <SkeletonBlock v-if="loading" />
    <div
      v-else
      class="space-y-3"
    >
      <div class="flex flex-wrap items-center gap-2">
        <select
          v-model="filtroEstado"
          class="rounded-lg border border-[var(--color-line)] px-3 py-1.5 text-sm"
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
        <label class="flex items-center gap-1.5 text-xs text-[var(--color-ink)]/60">
          Desde
          <input
            v-model="fechaDesde"
            type="date"
            class="rounded-lg border border-[var(--color-line)] px-2 py-1.5 text-sm"
            @change="page = 1"
          >
        </label>
        <label class="flex items-center gap-1.5 text-xs text-[var(--color-ink)]/60">
          Hasta
          <input
            v-model="fechaHasta"
            type="date"
            class="rounded-lg border border-[var(--color-line)] px-2 py-1.5 text-sm"
            @change="page = 1"
          >
        </label>
        <button
          class="rounded-lg border border-[var(--color-line)] px-3 py-1.5 text-xs hover:bg-[var(--color-parchment)]/50"
          @click="limpiarFiltros"
        >
          × Limpiar filtros
        </button>
        <span class="ml-auto text-xs text-[var(--color-ink)]/50">{{ filtradas.length }} registro(s)</span>
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
                Tarifa/hora
              </th>
              <th class="px-4 py-3">
                Horas contratadas
              </th>
              <th class="px-4 py-3">
                Pagada
              </th>
              <th class="px-4 py-3">
                Término contrato
              </th>
              <th class="px-4 py-3">
                Estado
              </th>
              <th class="px-4 py-3">
                Creado
              </th>
              <th class="px-4 py-3">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-if="paginadas.length === 0"
              class="border-b border-[var(--color-line)] last:border-0"
            >
              <td
                colspan="8"
                class="px-4 py-6 text-center text-sm text-[var(--color-ink)]/50"
              >
                Sin resultados.
              </td>
            </tr>
            <tr
              v-for="e in paginadas"
              :key="e.id"
              class="border-b border-[var(--color-line)] last:border-0"
            >
              <td class="px-4 py-3 font-medium">
                {{ e.nombre }}
              </td>
              <td class="px-4 py-3 font-[family-name:var(--font-mono)] text-xs">
                {{ formatoCLP.format(e.tarifaHora) }}
              </td>
              <td class="px-4 py-3">
                {{ e.horasContratadas ?? '—' }}
              </td>
              <td class="px-4 py-3">
                {{ e.pagada ? 'Sí' : 'No' }}
              </td>
              <td
                class="px-4 py-3 text-xs"
                :class="!e.fechaFin ? 'text-[var(--color-bronze)]' : ''"
              >
                {{ formatoFechaFin(e.fechaFin) }}
              </td>
              <td class="px-4 py-3">
                <StatusToggle
                  :active="e.isActive"
                  @toggle="toggleActivo(e)"
                />
              </td>
              <td class="px-4 py-3 text-xs text-[var(--color-ink)]/60">
                {{ e.createdAt ? new Date(e.createdAt).toLocaleDateString('es-CL') : '—' }}
              </td>
              <td class="px-4 py-3">
                <div class="flex gap-2">
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
        @submit.prevent="guardar"
      >
        <label class="block text-sm">
          Nombre
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

        <label class="block text-sm">
          Tarifa por hora (CLP)
          <input
            v-model.number="form.tarifaHora"
            type="number"
            min="1"
            class="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
            :class="errors.tarifaHora || serverErrors.tarifaHora ? 'border-[var(--color-danger)]' : 'border-[var(--color-line)]'"
          >
          <span
            v-if="errors.tarifaHora || serverErrors.tarifaHora"
            class="mt-1 block text-xs text-[var(--color-danger)]"
          >{{ errors.tarifaHora || serverErrors.tarifaHora }}</span>
        </label>

        <div class="grid grid-cols-2 gap-3">
          <label class="block text-sm">
            Inicio de contrato (opcional)
            <input
              v-model="form.fechaInicio"
              type="date"
              class="mt-1 w-full rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm"
            >
          </label>
          <label class="block text-sm">
            Término de contrato (opcional)
            <input
              v-model="form.fechaFin"
              type="date"
              class="mt-1 w-full rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm"
            >
          </label>
        </div>

        <label
          v-if="editando"
          class="block text-sm"
        >
          Horas contratadas
          <input
            v-model.number="form.horasContratadas"
            type="number"
            min="0"
            class="mt-1 w-full rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm"
          >
        </label>

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
            <p class="mb-1 text-xs text-[var(--color-ink)]/50">
              Satisfacción promedio
            </p>
            <p class="font-[family-name:var(--font-mono)] text-xl">
              {{ kpisSatisfaccion.satisfaccionPromedio !== null ? `${kpisSatisfaccion.satisfaccionPromedio} ★` : '—' }}
            </p>
          </div>
          <div class="rounded-xl border border-[var(--color-line)] p-3">
            <p class="mb-1 text-xs text-[var(--color-ink)]/50">
              Tasa de asistencia
            </p>
            <p class="font-[family-name:var(--font-mono)] text-xl">
              {{ kpisSatisfaccion.tasaAsistencia !== null ? `${kpisSatisfaccion.tasaAsistencia}%` : '—' }}
            </p>
          </div>
          <div class="rounded-xl border border-[var(--color-line)] p-3">
            <p class="mb-1 text-xs text-[var(--color-ink)]/50">
              Procesos terminados
            </p>
            <p class="font-[family-name:var(--font-mono)] text-xl">
              {{ kpisSatisfaccion.procesosTerminados }}
            </p>
          </div>
          <div class="rounded-xl border border-[var(--color-line)] p-3">
            <p class="mb-1 text-xs text-[var(--color-ink)]/50">
              Procesos en curso
            </p>
            <p class="font-[family-name:var(--font-mono)] text-xl">
              {{ kpisSatisfaccion.procesosEnCurso }}
            </p>
          </div>
        </div>

        <div class="border-t border-[var(--color-line)] pt-4">
          <p class="mb-2 text-xs font-medium uppercase tracking-wide text-[var(--color-ink)]/50">
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
                      :class="n <= enc.calificacion ? 'text-[var(--color-bronze)]' : 'text-[var(--color-ink)]/20'"
                    >★</span>
                  </span>
                  <span class="text-xs text-[var(--color-ink)]/50">{{ new Date(enc.createdAt).toLocaleDateString('es-CL') }}</span>
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
