<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import AppShell from '../../components/AppShell.vue'
import {
  listRecursos,
  getMisRecursos,
  autoasignarRecurso,
  quitarAutoasignacion,
  addAprendizaje,
  getMisAprendizajes,
  descargarArchivo,
  type Recurso,
  type Aprendizaje,
} from '../../api/recursos'
import { ApiError } from '../../api/client'

const tab = ref<'mia' | 'catalogo'>('mia')
const misRecursos = ref<Recurso[]>([])
const catalogo = ref<Recurso[]>([])
const search = ref('')
const loading = ref(true)
const error = ref<string | null>(null)
const expandido = ref<string | null>(null)
const aprendizajesPorRecurso = reactive<Record<string, Aprendizaje[]>>({})
const nuevoAprendizaje = reactive<Record<string, string>>({})

const misRecursosIds = computed(() => new Set(misRecursos.value.map((r) => r.id)))

async function loadMia() {
  misRecursos.value = await getMisRecursos()
}

async function loadCatalogo() {
  catalogo.value = await listRecursos(search.value || undefined)
}

async function loadAll() {
  loading.value = true
  await Promise.all([loadMia(), loadCatalogo()])
  loading.value = false
}

onMounted(loadAll)
watch(search, loadCatalogo)

async function agregar(recursoId: string) {
  try {
    await autoasignarRecurso(recursoId)
    await loadMia()
  } catch (err) {
    error.value = err instanceof ApiError ? err.message : 'No se pudo agregar a tu biblioteca.'
  }
}

async function quitar(recursoId: string) {
  try {
    await quitarAutoasignacion(recursoId)
    await loadMia()
  } catch (err) {
    error.value = err instanceof ApiError ? err.message : 'No se pudo quitar de tu biblioteca.'
  }
}

async function toggleAprendizajes(recursoId: string) {
  if (expandido.value === recursoId) {
    expandido.value = null
    return
  }
  expandido.value = recursoId
  aprendizajesPorRecurso[recursoId] = await getMisAprendizajes(recursoId)
}

async function guardarAprendizaje(recursoId: string) {
  const contenido = nuevoAprendizaje[recursoId]?.trim()
  if (!contenido) return
  try {
    const aprendizaje = await addAprendizaje(recursoId, contenido)
    aprendizajesPorRecurso[recursoId] = [aprendizaje, ...(aprendizajesPorRecurso[recursoId] ?? [])]
    nuevoAprendizaje[recursoId] = ''
  } catch (err) {
    error.value = err instanceof ApiError ? err.message : 'No se pudo guardar el aprendizaje.'
  }
}

async function descargar(r: Recurso) {
  await descargarArchivo(r.id, r.archivoNombre ?? 'archivo')
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

    <div class="mb-4 flex w-fit gap-1 rounded-full bg-[var(--color-parchment)] p-1">
      <button
        class="rounded-full px-3.5 py-1.5 text-sm transition-colors"
        :class="tab === 'mia' ? 'bg-[var(--color-ink)] text-[var(--color-parchment)]' : 'text-[var(--color-ink)]/70'"
        @click="tab = 'mia'"
      >
        Mi biblioteca
      </button>
      <button
        class="rounded-full px-3.5 py-1.5 text-sm transition-colors"
        :class="tab === 'catalogo' ? 'bg-[var(--color-ink)] text-[var(--color-parchment)]' : 'text-[var(--color-ink)]/70'"
        @click="tab = 'catalogo'"
      >
        Catálogo general
      </button>
    </div>

    <div
      v-if="loading"
      class="text-sm text-[var(--color-ink)]/60"
    >
      Cargando…
    </div>

    <div v-else-if="tab === 'mia'">
      <p
        v-if="misRecursos.length === 0"
        class="text-sm text-[var(--color-ink)]/60"
      >
        Todavía no tienes recursos en tu biblioteca.
      </p>
      <div
        v-else
        class="space-y-3"
      >
        <div
          v-for="r in misRecursos"
          :key="r.id"
          class="rounded-2xl border border-[var(--color-line)] bg-white p-4"
        >
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium">
                {{ r.titulo }}
              </p>
              <a
                v-if="r.tipo === 'link'"
                :href="r.url!"
                target="_blank"
                class="text-xs text-[var(--color-sage)] underline"
              >Abrir link</a>
              <button
                v-else
                class="text-xs text-[var(--color-sage)] underline"
                @click="descargar(r)"
              >
                Descargar archivo
              </button>
            </div>
            <div class="flex gap-2">
              <button
                class="text-xs text-[var(--color-ink)]/70 hover:underline"
                @click="toggleAprendizajes(r.id)"
              >
                Mis aprendizajes
              </button>
              <button
                class="text-xs text-[var(--color-bronze)] hover:underline"
                @click="quitar(r.id)"
              >
                Quitar
              </button>
            </div>
          </div>
          <div
            v-if="expandido === r.id"
            class="mt-3 space-y-2 border-t border-[var(--color-line)] pt-3"
          >
            <ul class="space-y-1 text-sm">
              <li
                v-for="a in aprendizajesPorRecurso[r.id]"
                :key="a.id"
              >
                {{ a.contenido }}
              </li>
            </ul>
            <div class="flex gap-2">
              <input
                v-model="nuevoAprendizaje[r.id]"
                type="text"
                placeholder="Registra un aprendizaje práctico"
                class="flex-1 rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm"
                @keyup.enter="guardarAprendizaje(r.id)"
              >
              <button
                class="rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm hover:bg-[var(--color-parchment)]/50"
                @click="guardarAprendizaje(r.id)"
              >
                Agregar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-else>
      <input
        v-model="search"
        type="text"
        placeholder="Buscar por título…"
        class="mb-4 w-full rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm"
      >
      <div class="space-y-3">
        <div
          v-for="r in catalogo"
          :key="r.id"
          class="flex items-center justify-between rounded-2xl border border-[var(--color-line)] bg-white p-4"
        >
          <div>
            <p class="text-sm font-medium">
              {{ r.titulo }}
            </p>
            <p class="text-xs text-[var(--color-ink)]/60">
              {{ r.etiquetas?.join(', ') }}
            </p>
          </div>
          <button
            v-if="!misRecursosIds.has(r.id)"
            class="rounded-lg border border-[var(--color-line)] px-3 py-2 text-xs hover:bg-[var(--color-parchment)]/50"
            @click="agregar(r.id)"
          >
            Agregar a mi biblioteca
          </button>
          <span
            v-else
            class="text-xs text-[var(--color-sage)]"
          >Ya en tu biblioteca</span>
        </div>
      </div>
    </div>
  </AppShell>
</template>
