<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import AppShell from '../../components/AppShell.vue'
import AppModal from '../../components/AppModal.vue'
import RecursoIcono from '../../components/RecursoIcono.vue'
import { getMisCarpetas, type Carpeta } from '../../api/carpetas'
import {
  getMisRecursos,
  addAprendizaje,
  getMisAprendizajes,
  descargarArchivo,
  type Recurso,
  type Aprendizaje,
} from '../../api/recursos'
import { ApiError } from '../../api/client'
import { buildArbol, breadcrumbDe, idsDescendientes } from '../../lib/carpetaArbol'

const loading = ref(true)
const error = ref<string | null>(null)
const carpetas = ref<Carpeta[]>([])
const misRecursos = ref<Recurso[]>([])
const seleccionadaId = ref<string | null>(null)

const recursoAbierto = ref<Recurso | null>(null)
const aprendizajesDelAbierto = ref<Aprendizaje[]>([])
const nuevoAprendizaje = ref('')
const guardandoAprendizaje = ref(false)

const arbol = computed(() => buildArbol(carpetas.value))
const migas = computed(() => breadcrumbDe(carpetas.value, seleccionadaId.value))
const carpetaActual = computed(() => migas.value.at(-1) ?? null)
const subcarpetas = computed(() =>
  [...carpetas.value]
    .filter((c) => c.parentId === seleccionadaId.value)
    .sort((a, b) => a.nombre.localeCompare(b.nombre)),
)
const recursosDeCarpeta = computed(() =>
  seleccionadaId.value ? misRecursos.value.filter((r) => r.carpetaId === seleccionadaId.value) : [],
)

/**
 * Archivos compartidos puntualmente cuya carpeta no es visible (ni pública ni con acceso
 * otorgado): no tienen una carpeta navegable donde mostrarse, así que aparecen sueltos en la raíz.
 */
const recursosSueltos = computed(() => {
  const idsDeCarpetasVisibles = new Set(carpetas.value.map((c) => c.id))
  return misRecursos.value.filter((r) => !idsDeCarpetasVisibles.has(r.carpetaId))
})

function totalRecursosEn(carpetaId: string): number {
  const ids = idsDescendientes(carpetas.value, carpetaId)
  return misRecursos.value.filter((r) => ids.has(r.carpetaId)).length
}

async function loadAll() {
  loading.value = true
  const [cs, rs] = await Promise.all([getMisCarpetas(), getMisRecursos()])
  carpetas.value = cs
  misRecursos.value = rs
  loading.value = false
}

onMounted(loadAll)

function seleccionar(id: string | null) {
  seleccionadaId.value = id
}

async function abrirRecurso(r: Recurso) {
  recursoAbierto.value = r
  nuevoAprendizaje.value = ''
  aprendizajesDelAbierto.value = await getMisAprendizajes(r.id)
}

function cerrarModal() {
  recursoAbierto.value = null
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

    <div
      v-if="loading"
      class="text-sm text-[var(--color-ink)]/60"
    >
      Cargando…
    </div>

    <template v-else-if="!carpetaActual">
      <p
        v-if="arbol.length === 0 && recursosSueltos.length === 0"
        class="text-sm text-[var(--color-ink)]/60"
      >
        Todavía no tienes acceso a ninguna carpeta.
      </p>
      <template v-else>
        <div
          v-if="arbol.length"
          class="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4"
        >
          <button
            v-for="c in arbol"
            :key="c.id"
            class="flex flex-col items-start gap-3 rounded-2xl border border-[var(--color-line)] bg-white p-4 text-left transition-all hover:-translate-y-0.5 hover:border-[var(--color-sage)] hover:shadow-md"
            @click="seleccionar(c.id)"
          >
            <div class="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--color-parchment)] text-[var(--color-ink)]/70">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.8"
                stroke-linecap="round"
                stroke-linejoin="round"
              ><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /></svg>
            </div>
            <div>
              <p class="text-sm font-medium">
                {{ c.nombre }}
              </p>
              <p class="text-xs text-[var(--color-ink)]/50">
                {{ totalRecursosEn(c.id) }} recurso{{ totalRecursosEn(c.id) === 1 ? '' : 's' }}
              </p>
            </div>
          </button>
        </div>

        <template v-if="recursosSueltos.length">
          <p class="mb-2 text-xs font-medium uppercase tracking-wide text-[var(--color-ink)]/45">
            Compartidos contigo directamente
          </p>
          <div class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            <button
              v-for="r in recursosSueltos"
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
      </template>
    </template>

    <template v-else>
      <nav class="mb-4 flex flex-wrap items-center gap-1 text-sm text-[var(--color-ink)]/60">
        <button
          class="hover:text-[var(--color-ink)] hover:underline"
          @click="seleccionar(null)"
        >
          Mi biblioteca
        </button>
        <template
          v-for="(m, i) in migas"
          :key="m.id"
        >
          <span class="opacity-40">/</span>
          <button
            class="hover:underline"
            :class="i === migas.length - 1 ? 'font-medium text-[var(--color-ink)]' : 'hover:text-[var(--color-ink)]'"
            @click="seleccionar(m.id)"
          >
            {{ m.nombre }}
          </button>
        </template>
      </nav>

      <div
        v-if="subcarpetas.length"
        class="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4"
      >
        <button
          v-for="s in subcarpetas"
          :key="s.id"
          class="flex flex-col items-start gap-3 rounded-2xl border border-[var(--color-line)] bg-white p-4 text-left transition-all hover:-translate-y-0.5 hover:border-[var(--color-sage)] hover:shadow-md"
          @click="seleccionar(s.id)"
        >
          <div class="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--color-parchment)] text-[var(--color-ink)]/70">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.8"
              stroke-linecap="round"
              stroke-linejoin="round"
            ><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /></svg>
          </div>
          <div>
            <p class="text-sm font-medium">
              {{ s.nombre }}
            </p>
            <p class="text-xs text-[var(--color-ink)]/50">
              {{ totalRecursosEn(s.id) }} recurso{{ totalRecursosEn(s.id) === 1 ? '' : 's' }}
            </p>
          </div>
        </button>
      </div>

      <p
        v-if="recursosDeCarpeta.length === 0 && subcarpetas.length === 0"
        class="text-sm text-[var(--color-ink)]/50"
      >
        Esta carpeta está vacía.
      </p>

      <div
        v-if="recursosDeCarpeta.length"
        class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4"
      >
        <button
          v-for="r in recursosDeCarpeta"
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

      <div class="mt-4 space-y-2 border-t border-[var(--color-line)] pt-4">
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
