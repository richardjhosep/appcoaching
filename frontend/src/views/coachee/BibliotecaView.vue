<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import AppShell from '../../components/AppShell.vue'
import AppModal from '../../components/AppModal.vue'
import RecursoIcono from '../../components/RecursoIcono.vue'
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

const topicoActivo = ref<string | null>(null)
const recursoAbierto = ref<Recurso | null>(null)
const aprendizajesDelAbierto = ref<Aprendizaje[]>([])
const nuevoAprendizaje = ref('')
const guardandoAprendizaje = ref(false)

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
watch(tab, () => {
  topicoActivo.value = null
  recursoAbierto.value = null
})

const recursosDelTab = computed(() => (tab.value === 'mia' ? misRecursos.value : catalogo.value))

interface Grupo { topico: string; recursos: Recurso[] }

const grupos = computed<Grupo[]>(() => {
  const porTopico = new Map<string, Recurso[]>()
  for (const r of recursosDelTab.value) {
    const topico = r.etiquetas?.[0]?.trim() || 'Sin categoría'
    if (!porTopico.has(topico)) porTopico.set(topico, [])
    porTopico.get(topico)!.push(r)
  }
  return [...porTopico.entries()]
    .map(([topico, recursos]) => ({ topico, recursos }))
    .sort((a, b) => a.topico.localeCompare(b.topico))
})

const itemsTopicoActivo = computed(
  () => grupos.value.find((g) => g.topico === topicoActivo.value)?.recursos ?? [],
)

async function abrirRecurso(r: Recurso) {
  recursoAbierto.value = r
  nuevoAprendizaje.value = ''
  aprendizajesDelAbierto.value = tab.value === 'mia' ? await getMisAprendizajes(r.id) : []
}

function cerrarModal() {
  recursoAbierto.value = null
}

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
    cerrarModal()
  } catch (err) {
    error.value = err instanceof ApiError ? err.message : 'No se pudo quitar de tu biblioteca.'
  }
}

async function guardarAprendizaje() {
  const recurso = recursoAbierto.value
  const contenido = nuevoAprendizaje.value.trim()
  if (!recurso || !contenido) return
  guardandoAprendizaje.value = true
  try {
    const aprendizaje = await addAprendizaje(recurso.id, contenido)
    aprendizajesDelAbierto.value = [aprendizaje, ...aprendizajesDelAbierto.value]
    nuevoAprendizaje.value = ''
  } catch (err) {
    error.value = err instanceof ApiError ? err.message : 'No se pudo guardar el aprendizaje.'
  } finally {
    guardandoAprendizaje.value = false
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
      class="mb-3 text-sm text-[var(--color-danger)]"
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

    <input
      v-if="tab === 'catalogo'"
      v-model="search"
      type="text"
      placeholder="Buscar por título…"
      class="mb-4 w-full rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm"
    >

    <div
      v-if="loading"
      class="text-sm text-[var(--color-ink)]/60"
    >
      Cargando…
    </div>

    <p
      v-else-if="recursosDelTab.length === 0"
      class="text-sm text-[var(--color-ink)]/60"
    >
      {{ tab === 'mia' ? 'Todavía no tienes recursos en tu biblioteca.' : 'No se encontraron recursos.' }}
    </p>

    <template v-else-if="!topicoActivo">
      <div class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <button
          v-for="g in grupos"
          :key="g.topico"
          class="flex flex-col items-start gap-3 rounded-2xl border border-[var(--color-line)] bg-white p-4 text-left transition-all hover:-translate-y-0.5 hover:border-[var(--color-sage)] hover:shadow-md"
          @click="topicoActivo = g.topico"
        >
          <div class="flex items-center gap-1.5">
            <RecursoIcono
              v-for="r in g.recursos.slice(0, 3)"
              :key="r.id"
              :recurso="r"
              size="xs"
            />
            <span
              v-if="g.recursos.length > 3"
              class="flex h-7 items-center rounded-lg bg-[var(--color-parchment)] px-1.5 text-[11px] font-medium text-[var(--color-ink)]/60"
            >+{{ g.recursos.length - 3 }}</span>
          </div>
          <div>
            <p class="text-sm font-medium">
              {{ g.topico }}
            </p>
            <p class="text-xs text-[var(--color-ink)]/50">
              {{ g.recursos.length }} recurso{{ g.recursos.length === 1 ? '' : 's' }}
            </p>
          </div>
        </button>
      </div>
    </template>

    <template v-else>
      <button
        class="mb-4 text-sm text-[var(--color-sage)] underline"
        @click="topicoActivo = null"
      >
        ← Volver a tópicos
      </button>
      <div class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <button
          v-for="r in itemsTopicoActivo"
          :key="r.id"
          class="flex flex-col items-center gap-2 rounded-2xl border border-[var(--color-line)] bg-white p-4 text-center transition-all hover:-translate-y-0.5 hover:border-[var(--color-sage)] hover:shadow-md"
          @click="abrirRecurso(r)"
        >
          <RecursoIcono
            :recurso="r"
            size="lg"
          />
          <p class="line-clamp-2 text-xs font-medium">
            {{ r.titulo }}
          </p>
        </button>
      </div>
    </template>

    <AppModal
      v-if="recursoAbierto"
      :title="recursoAbierto.titulo"
      @close="cerrarModal"
    >
      <div class="flex items-start gap-3">
        <RecursoIcono
          :recurso="recursoAbierto"
          size="lg"
        />
        <div class="min-w-0 flex-1">
          <p
            v-if="recursoAbierto.descripcion"
            class="text-sm text-[var(--color-ink)]/70"
          >
            {{ recursoAbierto.descripcion }}
          </p>
          <a
            v-if="recursoAbierto.tipo === 'link'"
            :href="recursoAbierto.url!"
            target="_blank"
            rel="noopener"
            class="mt-2 inline-block text-sm text-[var(--color-saltup)] underline"
          >Abrir link</a>
          <button
            v-else
            class="mt-2 text-sm text-[var(--color-saltup)] underline"
            @click="descargar(recursoAbierto)"
          >
            Descargar archivo
          </button>
        </div>
      </div>

      <div class="mt-4 flex justify-end">
        <button
          v-if="tab === 'mia'"
          class="text-xs text-[var(--color-bronze)] hover:underline"
          @click="quitar(recursoAbierto.id)"
        >
          Quitar de mi biblioteca
        </button>
        <button
          v-else-if="!misRecursosIds.has(recursoAbierto.id)"
          class="rounded-lg border border-[var(--color-line)] px-3 py-1.5 text-xs hover:bg-[var(--color-parchment)]/50"
          @click="agregar(recursoAbierto.id)"
        >
          Agregar a mi biblioteca
        </button>
        <span
          v-else
          class="text-xs text-[var(--color-sage)]"
        >Ya en tu biblioteca</span>
      </div>

      <div
        v-if="tab === 'mia'"
        class="mt-4 space-y-2 border-t border-[var(--color-line)] pt-4"
      >
        <p class="text-xs font-medium uppercase tracking-wide text-[var(--color-ink)]/45">
          Mis aprendizajes
        </p>
        <ul class="space-y-1 text-sm">
          <li
            v-for="a in aprendizajesDelAbierto"
            :key="a.id"
          >
            {{ a.contenido }}
          </li>
        </ul>
        <div class="flex gap-2">
          <input
            v-model="nuevoAprendizaje"
            type="text"
            placeholder="Registra un aprendizaje práctico"
            class="flex-1 rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm"
            @keyup.enter="guardarAprendizaje"
          >
          <button
            class="rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm hover:bg-[var(--color-parchment)]/50 disabled:opacity-60"
            :disabled="guardandoAprendizaje"
            @click="guardarAprendizaje"
          >
            Agregar
          </button>
        </div>
      </div>
    </AppModal>
  </AppShell>
</template>
