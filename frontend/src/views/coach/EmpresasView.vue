<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import AppShell from '../../components/AppShell.vue'
import AppModal from '../../components/AppModal.vue'
import Pagination from '../../components/Pagination.vue'
import StatusToggle from '../../components/StatusToggle.vue'
import IconButton from '../../components/IconButton.vue'
import { createEmpresa, deleteEmpresa, listEmpresas, updateEmpresa, type Empresa } from '../../api/empresas'
import { ApiError } from '../../api/client'
import { notifyError, notifySuccess, confirmDialog } from '../../lib/notify'

const PAGE_SIZE = 12

const loading = ref(true)
const empresas = ref<Empresa[]>([])
const search = ref('')
const filtroEstado = ref<'' | 'activas' | 'inactivas'>('')
const page = ref(1)

async function load() {
  loading.value = true
  empresas.value = await listEmpresas()
  loading.value = false
}

onMounted(load)

const filtradas = computed(() => {
  const q = search.value.trim().toLowerCase()
  return empresas.value.filter((e) => {
    if (q && !e.nombre.toLowerCase().includes(q)) return false
    if (filtroEstado.value === 'activas' && !e.isActive) return false
    if (filtroEstado.value === 'inactivas' && e.isActive) return false
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
  page.value = 1
}

const formatoCLP = new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 })

// --- Modal de creación/edición ---
const modalOpen = ref(false)
const editando = ref<Empresa | null>(null)
const guardando = ref(false)
const form = reactive({ nombre: '', tarifaHora: null as number | null, horasContratadas: null as number | null, pagada: false })
const errors = reactive<{ nombre?: string; tarifaHora?: string }>({})

function abrirCrear() {
  editando.value = null
  form.nombre = ''
  form.tarifaHora = null
  form.horasContratadas = null
  form.pagada = false
  errors.nombre = undefined
  errors.tarifaHora = undefined
  modalOpen.value = true
}

function abrirEditar(empresa: Empresa) {
  editando.value = empresa
  form.nombre = empresa.nombre
  form.tarifaHora = empresa.tarifaHora
  form.horasContratadas = empresa.horasContratadas
  form.pagada = empresa.pagada
  errors.nombre = undefined
  errors.tarifaHora = undefined
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
  try {
    if (editando.value) {
      await updateEmpresa(editando.value.id, {
        nombre: form.nombre,
        tarifaHora: form.tarifaHora!,
        horasContratadas: form.horasContratadas,
        pagada: form.pagada,
      })
      modalOpen.value = false
      await load()
      await notifySuccess('Empresa actualizada', `Los datos de ${form.nombre} se guardaron correctamente.`)
    } else {
      await createEmpresa(form.nombre, form.tarifaHora!)
      modalOpen.value = false
      await load()
      await notifySuccess('Empresa creada', `${form.nombre} ya está disponible para asignar coachees.`)
    }
  } catch (err) {
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
        <button
          v-if="filtroEstado || search"
          class="rounded-lg border border-[var(--color-line)] px-3 py-1.5 text-xs hover:bg-[var(--color-parchment)]/50"
          @click="limpiarFiltros"
        >
          × Limpiar
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
                colspan="7"
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
            :class="errors.nombre ? 'border-[var(--color-bronze)]' : 'border-[var(--color-line)]'"
          >
          <span
            v-if="errors.nombre"
            class="mt-1 block text-xs text-[var(--color-bronze)]"
          >{{ errors.nombre }}</span>
        </label>

        <label class="block text-sm">
          Tarifa por hora (CLP)
          <input
            v-model.number="form.tarifaHora"
            type="number"
            min="1"
            class="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
            :class="errors.tarifaHora ? 'border-[var(--color-bronze)]' : 'border-[var(--color-line)]'"
          >
          <span
            v-if="errors.tarifaHora"
            class="mt-1 block text-xs text-[var(--color-bronze)]"
          >{{ errors.tarifaHora }}</span>
        </label>

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
  </AppShell>
</template>
