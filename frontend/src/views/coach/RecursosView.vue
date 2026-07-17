<script setup lang="ts">
import { onMounted, reactive, ref, watch } from 'vue'
import AppShell from '../../components/AppShell.vue'
import {
  crearRecurso,
  listRecursos,
  removeRecurso,
  asignarRecurso,
  getAsignacionesDeRecurso,
  type Recurso,
  type TipoRecurso,
} from '../../api/recursos'
import { listCoachees, type CoacheeListItem } from '../../api/coachees'
import { ApiError } from '../../api/client'

const recursos = ref<Recurso[]>([])
const coachees = ref<CoacheeListItem[]>([])
const loading = ref(true)
const search = ref('')
const etiquetaFiltro = ref('')
const error = ref<string | null>(null)
const expandido = ref<string | null>(null)
const asignacionesPorRecurso = reactive<Record<string, Set<string>>>({})

const form = reactive({
  titulo: '',
  tipo: 'link' as TipoRecurso,
  url: '',
  etiquetas: '',
  descripcion: '',
})
const archivoSeleccionado = ref<File | null>(null)
const creando = ref(false)

async function load() {
  loading.value = true
  recursos.value = await listRecursos(search.value || undefined, etiquetaFiltro.value || undefined)
  loading.value = false
}

onMounted(async () => {
  coachees.value = await listCoachees()
  await load()
})

watch([search, etiquetaFiltro], load)

function onArchivoChange(event: Event) {
  const input = event.target as HTMLInputElement
  archivoSeleccionado.value = input.files?.[0] ?? null
}

async function crear() {
  if (!form.titulo.trim()) return
  creando.value = true
  error.value = null
  try {
    const recurso = await crearRecurso({
      titulo: form.titulo.trim(),
      tipo: form.tipo,
      url: form.tipo === 'link' ? form.url.trim() : undefined,
      etiquetas: form.etiquetas.trim() || undefined,
      descripcion: form.descripcion.trim() || undefined,
      archivo: form.tipo === 'archivo' ? (archivoSeleccionado.value ?? undefined) : undefined,
    })
    recursos.value = [recurso, ...recursos.value]
    form.titulo = ''
    form.url = ''
    form.etiquetas = ''
    form.descripcion = ''
    archivoSeleccionado.value = null
  } catch (err) {
    error.value = err instanceof ApiError ? err.message : 'No se pudo crear el recurso.'
  } finally {
    creando.value = false
  }
}

async function borrar(id: string) {
  try {
    await removeRecurso(id)
    recursos.value = recursos.value.filter((r) => r.id !== id)
  } catch (err) {
    error.value = err instanceof ApiError ? err.message : 'No se pudo eliminar el recurso.'
  }
}

async function toggleExpandir(recursoId: string) {
  if (expandido.value === recursoId) {
    expandido.value = null
    return
  }
  expandido.value = recursoId
  if (!asignacionesPorRecurso[recursoId]) {
    const asignaciones = await getAsignacionesDeRecurso(recursoId)
    asignacionesPorRecurso[recursoId] = new Set(asignaciones.map((a) => a.coacheeId))
  }
}

async function toggleAsignacion(recursoId: string, coacheeId: string, activa: boolean) {
  try {
    await asignarRecurso(recursoId, coacheeId, activa)
    const set = asignacionesPorRecurso[recursoId]
    if (activa) set.add(coacheeId)
    else set.delete(coacheeId)
  } catch (err) {
    error.value = err instanceof ApiError ? err.message : 'No se pudo actualizar la asignación.'
  }
}
</script>

<template>
  <AppShell>
    <h1 class="mb-4 font-[family-name:var(--font-heading)] text-xl font-semibold">
      Biblioteca de recursos
    </h1>
    <p
      v-if="error"
      class="mb-3 text-sm text-[var(--color-bronze)]"
    >
      {{ error }}
    </p>

    <div class="mb-4 grid gap-3 rounded-2xl border border-[var(--color-line)] bg-white p-4 sm:grid-cols-2">
      <label class="text-sm sm:col-span-2">
        Título
        <input
          v-model="form.titulo"
          type="text"
          class="mt-1 w-full rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm"
        >
      </label>
      <label class="text-sm">
        Tipo
        <select
          v-model="form.tipo"
          class="mt-1 w-full rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm"
        >
          <option value="link">
            Link
          </option>
          <option value="archivo">
            Archivo
          </option>
        </select>
      </label>
      <label class="text-sm">
        Etiquetas (separadas por coma)
        <input
          v-model="form.etiquetas"
          type="text"
          class="mt-1 w-full rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm"
        >
      </label>
      <label
        v-if="form.tipo === 'link'"
        class="text-sm sm:col-span-2"
      >
        URL
        <input
          v-model="form.url"
          type="url"
          class="mt-1 w-full rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm"
        >
      </label>
      <label
        v-else
        class="text-sm sm:col-span-2"
      >
        Archivo
        <input
          type="file"
          class="mt-1 w-full text-sm"
          @change="onArchivoChange"
        >
      </label>
      <button
        class="w-fit rounded-lg bg-[var(--color-ink)] px-4 py-2 text-sm text-[var(--color-parchment)] disabled:opacity-60 sm:col-span-2"
        :disabled="creando"
        @click="crear"
      >
        {{ creando ? 'Subiendo…' : 'Agregar recurso' }}
      </button>
    </div>

    <div class="mb-4 flex gap-2">
      <input
        v-model="search"
        type="text"
        placeholder="Buscar por título…"
        class="flex-1 rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm"
      >
      <input
        v-model="etiquetaFiltro"
        type="text"
        placeholder="Filtrar por etiqueta…"
        class="flex-1 rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm"
      >
    </div>

    <div
      v-if="loading"
      class="text-sm text-[var(--color-ink)]/60"
    >
      Cargando…
    </div>
    <div
      v-else-if="recursos.length === 0"
      class="text-sm text-[var(--color-ink)]/60"
    >
      No hay recursos con este filtro.
    </div>
    <div
      v-else
      class="space-y-3"
    >
      <div
        v-for="r in recursos"
        :key="r.id"
        class="rounded-2xl border border-[var(--color-line)] bg-white p-4"
      >
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium">
              {{ r.titulo }}
            </p>
            <p class="text-xs text-[var(--color-ink)]/60">
              {{ r.tipo === 'link' ? r.url : r.archivoNombre }}
              <span v-if="r.etiquetas?.length"> · {{ r.etiquetas.join(', ') }}</span>
            </p>
          </div>
          <div class="flex gap-2">
            <button
              class="text-xs text-[var(--color-sage)] hover:underline"
              @click="toggleExpandir(r.id)"
            >
              {{ expandido === r.id ? 'Ocultar asignación' : 'Asignar a coachees' }}
            </button>
            <button
              class="text-xs text-[var(--color-bronze)] hover:underline"
              @click="borrar(r.id)"
            >
              Eliminar
            </button>
          </div>
        </div>
        <div
          v-if="expandido === r.id"
          class="mt-3 grid gap-1 border-t border-[var(--color-line)] pt-3 sm:grid-cols-2"
        >
          <label
            v-for="c in coachees"
            :key="c.id"
            class="flex items-center gap-2 text-sm"
          >
            <input
              type="checkbox"
              :checked="asignacionesPorRecurso[r.id]?.has(c.id)"
              @change="toggleAsignacion(r.id, c.id, ($event.target as HTMLInputElement).checked)"
            >
            {{ c.nombre }}
          </label>
        </div>
      </div>
    </div>
  </AppShell>
</template>
