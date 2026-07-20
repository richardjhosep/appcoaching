<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import AppShell from '../../components/AppShell.vue'
import AppModal from '../../components/AppModal.vue'
import Pagination from '../../components/Pagination.vue'
import StatusToggle from '../../components/StatusToggle.vue'
import IconButton from '../../components/IconButton.vue'
import { createCoachee, deleteCoachee, listCoachees, setCoacheeActivo, updateCoachee, type CoacheeListItem } from '../../api/coachees'
import { listEmpresas, type Empresa } from '../../api/empresas'
import { ApiError } from '../../api/client'
import { notifyError, notifySuccess, confirmDialog, showCredential } from '../../lib/notify'
import { primerDiaDelMes, hoy, dentroDeRango } from '../../lib/dateRange'

const PAGE_SIZE = 12

const loading = ref(true)
const coachees = ref<CoacheeListItem[]>([])
const empresas = ref<Empresa[]>([])
const search = ref('')
const filtroEmpresa = ref('')
const filtroEstado = ref<'' | 'activos' | 'inactivos'>('')
const fechaDesde = ref(primerDiaDelMes())
const fechaHasta = ref(hoy())
const page = ref(1)

async function load() {
  loading.value = true
  const [c, e] = await Promise.all([listCoachees(), listEmpresas()])
  c.sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''))
  coachees.value = c
  empresas.value = e
  loading.value = false
}

onMounted(load)

function estaActivo(c: CoacheeListItem): boolean {
  return c.activo !== false
}

const formatoCLP = new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 })

const filtradas = computed(() => {
  const q = search.value.trim().toLowerCase()
  return coachees.value.filter((c) => {
    if (q && !c.nombre.toLowerCase().includes(q) && !(c.user?.email.toLowerCase().includes(q))) return false
    if (filtroEmpresa.value && c.empresaId !== filtroEmpresa.value) return false
    if (filtroEstado.value === 'activos' && !estaActivo(c)) return false
    if (filtroEstado.value === 'inactivos' && estaActivo(c)) return false
    if (!dentroDeRango(c.createdAt, fechaDesde.value, fechaHasta.value)) return false
    return true
  })
})

const paginadas = computed(() => {
  const start = (page.value - 1) * PAGE_SIZE
  return filtradas.value.slice(start, start + PAGE_SIZE)
})

function limpiarFiltros() {
  search.value = ''
  filtroEmpresa.value = ''
  filtroEstado.value = ''
  fechaDesde.value = primerDiaDelMes()
  fechaHasta.value = hoy()
  page.value = 1
}

// --- Modal de creación/edición ---
const modalOpen = ref(false)
const editando = ref<CoacheeListItem | null>(null)
const guardando = ref(false)
const form = reactive({
  nombre: '',
  email: '',
  empresaId: '',
  jefeDirecto: '',
  objetivoProceso: '',
  tarifaPropia: null as number | null,
  areaGerencia: '',
})
const errors = reactive<{ nombre?: string; email?: string; tarifaPropia?: string }>({})

const formatoMiles = new Intl.NumberFormat('es-CL')
const tarifaPropiaDisplay = computed<string>({
  get: () => (form.tarifaPropia !== null ? formatoMiles.format(form.tarifaPropia) : ''),
  set: (value: string) => {
    const digits = value.replace(/\D/g, '')
    form.tarifaPropia = digits ? Number(digits) : null
  },
})

function abrirCrear() {
  editando.value = null
  form.nombre = ''
  form.email = ''
  form.empresaId = ''
  form.jefeDirecto = ''
  form.objetivoProceso = ''
  form.tarifaPropia = null
  form.areaGerencia = ''
  errors.nombre = undefined
  errors.email = undefined
  errors.tarifaPropia = undefined
  modalOpen.value = true
}

function abrirEditar(coachee: CoacheeListItem) {
  editando.value = coachee
  form.nombre = coachee.nombre
  form.email = coachee.user?.email ?? ''
  form.empresaId = coachee.empresaId ?? ''
  form.jefeDirecto = coachee.jefeDirecto ?? ''
  form.objetivoProceso = coachee.objetivoProceso ?? ''
  form.tarifaPropia = coachee.tarifaPropia ?? null
  form.areaGerencia = coachee.areaGerencia ?? ''
  errors.nombre = undefined
  errors.email = undefined
  errors.tarifaPropia = undefined
  modalOpen.value = true
}

function validar(): boolean {
  errors.nombre = form.nombre.trim().length < 2 ? 'El nombre debe tener al menos 2 caracteres.' : undefined
  errors.email = !editando.value && !/.+@.+\..+/.test(form.email.trim()) ? 'Ingresa un email válido.' : undefined
  errors.tarifaPropia = form.tarifaPropia !== null && (form.tarifaPropia <= 0 || !Number.isInteger(form.tarifaPropia))
    ? 'La tarifa propia debe ser un entero mayor a 0.'
    : undefined
  return !errors.nombre && !errors.email && !errors.tarifaPropia
}

async function guardar() {
  if (!validar()) return
  guardando.value = true
  try {
    if (editando.value) {
      await updateCoachee(editando.value.id, {
        nombre: form.nombre,
        empresaId: form.empresaId || null,
        jefeDirecto: form.jefeDirecto || undefined,
        objetivoProceso: form.objetivoProceso || undefined,
        tarifaPropia: form.tarifaPropia ?? undefined,
        areaGerencia: form.areaGerencia || undefined,
      })
      modalOpen.value = false
      await load()
      await notifySuccess('Coachee actualizado', `Los datos de ${form.nombre} se guardaron correctamente.`)
    } else {
      const resultado = await createCoachee({
        nombre: form.nombre,
        email: form.email,
        empresaId: form.empresaId || undefined,
        jefeDirecto: form.jefeDirecto || undefined,
        objetivoProceso: form.objetivoProceso || undefined,
        tarifaPropia: form.tarifaPropia ?? undefined,
        areaGerencia: form.areaGerencia || undefined,
      })
      modalOpen.value = false
      await load()
      if (resultado.temporaryPassword) {
        await showCredential(form.email, resultado.temporaryPassword)
      } else {
        await notifySuccess('Coachee creado', `${form.nombre} ya está disponible en el sistema.`)
      }
    }
  } catch (err) {
    await notifyError('No se pudo guardar', err instanceof ApiError ? err.message : 'Ocurrió un error inesperado.')
  } finally {
    guardando.value = false
  }
}

async function toggleActivo(coachee: CoacheeListItem) {
  const activar = !estaActivo(coachee)
  const confirmado = await confirmDialog({
    title: activar ? '¿Activar este coachee?' : '¿Desactivar este coachee?',
    text: activar
      ? `${coachee.nombre} volverá a estar disponible y podrá iniciar sesión.`
      : `${coachee.nombre} quedará marcado como inactivo y no podrá iniciar sesión. No se elimina ningún dato.`,
    confirmText: activar ? 'Activar' : 'Desactivar',
    danger: !activar,
  })
  if (!confirmado) return
  try {
    await setCoacheeActivo(coachee.id, activar)
    await load()
    await notifySuccess(activar ? 'Coachee activado' : 'Coachee desactivado')
  } catch (err) {
    await notifyError('No se pudo cambiar el estado', err instanceof ApiError ? err.message : 'Ocurrió un error inesperado.')
  }
}

async function eliminar(coachee: CoacheeListItem) {
  const confirmado = await confirmDialog({
    title: '¿Eliminar este coachee?',
    text: `Esta acción no se puede deshacer. Se eliminará ${coachee.nombre} de forma definitiva.`,
    confirmText: 'Eliminar',
    danger: true,
  })
  if (!confirmado) return
  try {
    await deleteCoachee(coachee.id)
    await load()
    await notifySuccess('Coachee eliminado')
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
          Mantenedor de Coachees
        </h1>
        <p class="text-sm text-[var(--color-ink)]/60">
          Gestión y administración de los coachees del sistema.
        </p>
      </div>
      <button
        class="rounded-lg bg-[var(--color-ink)] px-4 py-2 text-sm font-medium text-[var(--color-parchment)]"
        @click="abrirCrear"
      >
        + Nuevo Coachee
      </button>
    </div>

    <div
      v-if="loading"
      class="text-sm text-[var(--color-ink)]/60"
    >
      Cargando…
    </div>
    <div
      v-else
      class="space-y-3"
    >
      <div class="flex flex-wrap items-center gap-2">
        <select
          v-model="filtroEmpresa"
          class="rounded-lg border border-[var(--color-line)] px-3 py-1.5 text-sm"
          @change="page = 1"
        >
          <option value="">
            Empresa: Todas
          </option>
          <option
            v-for="e in empresas"
            :key="e.id"
            :value="e.id"
          >
            {{ e.nombre }}
          </option>
        </select>
        <select
          v-model="filtroEstado"
          class="rounded-lg border border-[var(--color-line)] px-3 py-1.5 text-sm"
          @change="page = 1"
        >
          <option value="">
            Estado: Todos
          </option>
          <option value="activos">
            Activos
          </option>
          <option value="inactivos">
            Inactivos
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
        placeholder="Buscar por nombre o email…"
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
                Email
              </th>
              <th class="px-4 py-3">
                Empresa
              </th>
              <th class="px-4 py-3">
                Área/Gerencia
              </th>
              <th class="px-4 py-3">
                Tarifa
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
              v-for="c in paginadas"
              :key="c.id"
              class="border-b border-[var(--color-line)] last:border-0"
            >
              <td class="px-4 py-3 font-medium">
                {{ c.nombre }}
              </td>
              <td class="px-4 py-3 text-[var(--color-ink)]/70">
                {{ c.user?.email ?? '—' }}
              </td>
              <td class="px-4 py-3 text-[var(--color-ink)]/70">
                {{ c.empresa?.nombre ?? 'Independiente' }}
              </td>
              <td class="px-4 py-3 text-[var(--color-ink)]/70">
                {{ c.areaGerencia ?? '—' }}
              </td>
              <td class="px-4 py-3 font-[family-name:var(--font-mono)] text-xs">
                {{ c.tarifaPropia ? formatoCLP.format(c.tarifaPropia) : '—' }}
              </td>
              <td class="px-4 py-3">
                <StatusToggle
                  :active="estaActivo(c)"
                  @toggle="toggleActivo(c)"
                />
              </td>
              <td class="px-4 py-3 text-xs text-[var(--color-ink)]/60">
                {{ c.createdAt ? new Date(c.createdAt).toLocaleDateString('es-CL') : '—' }}
              </td>
              <td class="px-4 py-3">
                <div class="flex gap-2">
                  <IconButton
                    icon="ver"
                    title="Ver seguimiento"
                    :to="`/coach/coachees/${c.id}/seguimiento`"
                  />
                  <IconButton
                    icon="editar"
                    title="Editar"
                    @click="abrirEditar(c)"
                  />
                  <IconButton
                    icon="eliminar"
                    title="Eliminar"
                    @click="eliminar(c)"
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
      :title="editando ? 'Editar Coachee' : 'Nuevo Coachee'"
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
            :class="errors.nombre ? 'border-[var(--color-bronze)]' : 'border-[var(--color-line)]'"
          >
          <span
            v-if="errors.nombre"
            class="mt-1 block text-xs text-[var(--color-bronze)]"
          >{{ errors.nombre }}</span>
        </label>

        <label
          v-if="!editando"
          class="block text-sm"
        >
          Email
          <input
            v-model="form.email"
            type="email"
            class="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
            :class="errors.email ? 'border-[var(--color-bronze)]' : 'border-[var(--color-line)]'"
          >
          <span
            v-if="errors.email"
            class="mt-1 block text-xs text-[var(--color-bronze)]"
          >{{ errors.email }}</span>
        </label>

        <label class="block text-sm">
          Empresa (opcional, independiente si se deja vacío)
          <select
            v-model="form.empresaId"
            class="mt-1 w-full rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm"
          >
            <option value="">
              Independiente
            </option>
            <option
              v-for="e in empresas"
              :key="e.id"
              :value="e.id"
            >
              {{ e.nombre }}
            </option>
          </select>
        </label>

        <label class="block text-sm">
          Área/gerencia (opcional)
          <input
            v-model="form.areaGerencia"
            type="text"
            class="mt-1 w-full rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm"
          >
        </label>

        <label class="block text-sm">
          Jefe directo (opcional)
          <input
            v-model="form.jefeDirecto"
            type="text"
            class="mt-1 w-full rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm"
          >
        </label>

        <label class="block text-sm">
          Tarifa propia por hora, CLP (opcional)
          <input
            v-model="tarifaPropiaDisplay"
            type="text"
            inputmode="numeric"
            class="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
            :class="errors.tarifaPropia ? 'border-[var(--color-bronze)]' : 'border-[var(--color-line)]'"
          >
          <span
            v-if="errors.tarifaPropia"
            class="mt-1 block text-xs text-[var(--color-bronze)]"
          >{{ errors.tarifaPropia }}</span>
        </label>

        <label class="block text-sm">
          Objetivo del proceso (opcional)
          <textarea
            v-model="form.objetivoProceso"
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
  </AppShell>
</template>
