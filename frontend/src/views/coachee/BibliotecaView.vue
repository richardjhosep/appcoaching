<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import AppShell from '../../components/AppShell.vue'
import AppModal from '../../components/AppModal.vue'
import RecursoIcono from '../../components/RecursoIcono.vue'
import EmptyState from '../../components/EmptyState.vue'
import SkeletonBlock from '../../components/SkeletonBlock.vue'
import { getMisCarpetas, type Carpeta } from '../../api/carpetas'
import {
  getMisRecursos,
  addAprendizaje,
  getMisAprendizajes,
  descargarArchivo,
  type Recurso,
  type Aprendizaje,
  type CategoriaRecurso,
} from '../../api/recursos'
import { ApiError } from '../../api/client'
import { buildArbol, breadcrumbDe, idsDescendientes } from '../../lib/carpetaArbol'
import { formatearFechaLimite } from '../../lib/fechaLimite'

const loading = ref(true)
const error = ref<string | null>(null)
const carpetas = ref<Carpeta[]>([])
const misRecursos = ref<Recurso[]>([])
const seleccionadaId = ref<string | null>(null)

const recursoAbierto = ref<Recurso | null>(null)
const aprendizajesDelAbierto = ref<Aprendizaje[]>([])
// Un registro = la parte estudiada (capítulo/s en un libro) + uno o más aprendizajes de esa
// parte + cómo se aplica al trabajo (obligatorio).
const nuevaSeccion = ref('')
const nuevosAprendizajes = ref<string[]>([''])
const nuevaAplicacion = ref('')
const intentoGuardar = ref(false)
const guardandoAprendizaje = ref(false)

const arbol = computed(() => buildArbol(carpetas.value))
const migas = computed(() => breadcrumbDe(carpetas.value, seleccionadaId.value))
const carpetaActual = computed(() => migas.value.at(-1) ?? null)
const subcarpetas = computed(() =>
  [...carpetas.value]
    .filter((c) => c.parentId === seleccionadaId.value)
    .sort((a, b) => a.nombre.localeCompare(b.nombre)),
)

// Filtro por formato — independiente de la navegación por carpetas, se aplica sobre
// cualquiera de las dos listas de recursos de abajo.
const FILTROS_CATEGORIA: { value: CategoriaRecurso | null; label: string }[] = [
  { value: null, label: 'Todos' },
  { value: 'texto', label: 'Texto' },
  { value: 'audio', label: 'Audio' },
  { value: 'video', label: 'Video' },
]
const categoriaFiltro = ref<CategoriaRecurso | null>(null)

const recursosDeCarpeta = computed(() => {
  if (!seleccionadaId.value) return []
  return misRecursos.value.filter(
    (r) => r.carpetaId === seleccionadaId.value && (!categoriaFiltro.value || r.categoria === categoriaFiltro.value),
  )
})

/**
 * Archivos compartidos puntualmente cuya carpeta no es visible (ni pública ni con acceso
 * otorgado): no tienen una carpeta navegable donde mostrarse, así que aparecen sueltos en la raíz.
 */
const recursosSueltos = computed(() => {
  const idsDeCarpetasVisibles = new Set(carpetas.value.map((c) => c.id))
  return misRecursos.value.filter(
    (r) => !idsDeCarpetasVisibles.has(r.carpetaId) && (!categoriaFiltro.value || r.categoria === categoriaFiltro.value),
  )
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
  limpiarFormAprendizaje()
  aprendizajesDelAbierto.value = await getMisAprendizajes(r.id)
}

function cerrarModal() {
  recursoAbierto.value = null
}

function limpiarFormAprendizaje() {
  nuevaSeccion.value = ''
  nuevosAprendizajes.value = ['']
  nuevaAplicacion.value = ''
  intentoGuardar.value = false
}

// En un libro/texto el capítulo es obligatorio; en video/audio (o sin categoría) es opcional.
const seccionObligatoria = computed(() => recursoAbierto.value?.categoria === 'texto')
const etiquetaSeccion = computed(() => {
  const categoria = recursoAbierto.value?.categoria
  if (categoria === 'texto') return 'Capítulo(s) estudiado(s)'
  if (categoria === 'video' || categoria === 'audio') return 'Parte o minuto (opcional)'
  return 'Capítulo o sección (opcional)'
})

const aprendizajesValidos = computed(() => nuevosAprendizajes.value.map((a) => a.trim()).filter(Boolean))
const faltaSeccion = computed(() => seccionObligatoria.value && !nuevaSeccion.value.trim())
const faltaAprendizaje = computed(() => aprendizajesValidos.value.length === 0)
const faltaAplicacion = computed(() => !nuevaAplicacion.value.trim())

function agregarOtroAprendizaje() {
  nuevosAprendizajes.value = [...nuevosAprendizajes.value, '']
}

function quitarAprendizaje(i: number) {
  nuevosAprendizajes.value = nuevosAprendizajes.value.filter((_, idx) => idx !== i)
}

function lineas(contenido: string): string[] {
  return contenido.split('\n').filter((l) => l.trim())
}

async function guardarAprendizaje() {
  const recurso = recursoAbierto.value
  intentoGuardar.value = true
  if (!recurso || faltaSeccion.value || faltaAprendizaje.value || faltaAplicacion.value) return
  guardandoAprendizaje.value = true
  error.value = null
  try {
    const aprendizaje = await addAprendizaje(recurso.id, {
      aprendizajes: aprendizajesValidos.value,
      aplicacion: nuevaAplicacion.value.trim(),
      seccion: nuevaSeccion.value.trim() || undefined,
    })
    aprendizajesDelAbierto.value = [aprendizaje, ...aprendizajesDelAbierto.value]
    limpiarFormAprendizaje()
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

    <SkeletonBlock v-if="loading" />

    <template v-else>
      <div class="mb-4 flex flex-wrap gap-2">
        <button
          v-for="f in FILTROS_CATEGORIA"
          :key="f.label"
          class="rounded-full border px-3 py-1 text-xs"
          :class="categoriaFiltro === f.value
            ? 'border-[var(--color-primary)] bg-[var(--color-primary)] text-[var(--color-on-primary)]'
            : 'border-[var(--color-line)] hover:bg-[var(--color-parchment)]/50'"
          @click="categoriaFiltro = f.value"
        >
          {{ f.label }}
        </button>
      </div>

      <template v-if="!carpetaActual">
        <EmptyState
          v-if="arbol.length === 0 && recursosSueltos.length === 0"
          icon="biblioteca"
          title="Todavía no tienes acceso a ninguna carpeta"
          description="Cuando tu coach te comparta material, va a aparecer acá organizado por carpetas."
        />
        <template v-else>
          <TransitionGroup
            v-if="arbol.length"
            name="fade-slide"
            tag="div"
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
                <p class="text-xs text-[var(--color-muted)]">
                  {{ totalRecursosEn(c.id) }} recurso{{ totalRecursosEn(c.id) === 1 ? '' : 's' }}
                </p>
              </div>
            </button>
          </TransitionGroup>

          <template v-if="recursosSueltos.length">
            <p class="mb-2 text-xs font-medium uppercase tracking-wide text-[var(--color-muted)]">
              Compartidos contigo directamente
            </p>
            <TransitionGroup
              name="fade-slide"
              tag="div"
              class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4"
            >
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
                <p
                  v-if="formatearFechaLimite(r.fechaLimite)"
                  class="text-xs text-[var(--color-bronze)]"
                >
                  {{ formatearFechaLimite(r.fechaLimite) }}
                </p>
              </button>
            </TransitionGroup>
          </template>
        </template>
      </template>

      <template v-else>
        <nav class="mb-4 flex flex-wrap items-center gap-1 text-sm text-[var(--color-muted)]">
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
              <p class="text-xs text-[var(--color-muted)]">
                {{ totalRecursosEn(s.id) }} recurso{{ totalRecursosEn(s.id) === 1 ? '' : 's' }}
              </p>
            </div>
          </button>
        </div>

        <EmptyState
          v-if="recursosDeCarpeta.length === 0 && subcarpetas.length === 0"
          icon="biblioteca"
          title="Esta carpeta está vacía"
          description="Todavía no hay recursos guardados acá."
        />

        <TransitionGroup
          v-if="recursosDeCarpeta.length"
          name="fade-slide"
          tag="div"
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
            <p
              v-if="formatearFechaLimite(r.fechaLimite)"
              class="text-xs text-[var(--color-bronze)]"
            >
              {{ formatearFechaLimite(r.fechaLimite) }}
            </p>
          </button>
        </TransitionGroup>
      </template>
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
            rel="noopener noreferrer"
            class="mt-2 inline-block text-sm text-[var(--color-saltup-ink)] underline"
          >Abrir link</a>
          <button
            v-else
            class="mt-2 text-sm text-[var(--color-saltup-ink)] underline"
            @click="descargar(recursoAbierto)"
          >
            Descargar archivo
          </button>
        </div>
      </div>

      <div class="mt-4 space-y-2 border-t border-[var(--color-line)] pt-4">
        <p class="text-xs font-medium uppercase tracking-wide text-[var(--color-muted)]">
          Mis aprendizajes
        </p>
        <ul class="space-y-2 text-sm">
          <li
            v-for="a in aprendizajesDelAbierto"
            :key="a.id"
            class="rounded-lg border border-[var(--color-line)] p-2.5"
          >
            <p
              v-if="a.seccion"
              class="mb-1 text-xs font-semibold text-[var(--color-saltup-ink)]"
            >
              {{ a.seccion }}
            </p>
            <ul
              v-if="lineas(a.contenido).length > 1"
              class="list-disc space-y-0.5 pl-4"
            >
              <li
                v-for="(l, i) in lineas(a.contenido)"
                :key="i"
              >
                {{ l }}
              </li>
            </ul>
            <p v-else>
              {{ a.contenido }}
            </p>
            <p
              v-if="a.aplicacion"
              class="mt-1 text-xs text-[var(--color-muted)]"
            >
              <strong>¿Cómo lo aplico?</strong> {{ a.aplicacion }}
            </p>
          </li>
        </ul>
        <form
          class="space-y-3 rounded-lg bg-[var(--color-parchment)]/40 p-3"
          novalidate
          @submit.prevent="guardarAprendizaje"
        >
          <label class="block text-xs font-medium">
            {{ etiquetaSeccion }}
            <input
              v-model="nuevaSeccion"
              type="text"
              :placeholder="seccionObligatoria ? 'Ej. Capítulos 3 y 4' : 'Ej. minuto 12 al 25'"
              class="mt-1 w-full rounded-lg border bg-white px-3 py-2 text-sm font-normal"
              :class="intentoGuardar && faltaSeccion ? 'border-[var(--color-danger)]' : 'border-[var(--color-line)]'"
            >
            <span
              v-if="intentoGuardar && faltaSeccion"
              class="mt-1 block font-normal text-[var(--color-danger)]"
            >Indica qué capítulo(s) estudiaste.</span>
          </label>

          <fieldset class="space-y-1.5">
            <legend class="mb-1 text-xs font-medium">
              Aprendizajes de esta parte
            </legend>
            <div
              v-for="(_, i) in nuevosAprendizajes"
              :key="i"
              class="flex items-center gap-2"
            >
              <input
                v-model="nuevosAprendizajes[i]"
                type="text"
                :placeholder="i === 0 ? 'Registra un aprendizaje práctico' : 'Otro aprendizaje'"
                :aria-label="`Aprendizaje ${i + 1}`"
                class="w-full rounded-lg border bg-white px-3 py-2 text-sm"
                :class="intentoGuardar && faltaAprendizaje && i === 0 ? 'border-[var(--color-danger)]' : 'border-[var(--color-line)]'"
              >
              <button
                v-if="nuevosAprendizajes.length > 1"
                type="button"
                class="shrink-0 text-xs text-[var(--color-muted)] hover:text-[var(--color-danger)]"
                :aria-label="`Quitar aprendizaje ${i + 1}`"
                @click="quitarAprendizaje(i)"
              >
                ✕
              </button>
            </div>
            <button
              type="button"
              class="text-xs text-[var(--color-saltup-ink)] hover:underline"
              @click="agregarOtroAprendizaje"
            >
              + Otro aprendizaje
            </button>
            <span
              v-if="intentoGuardar && faltaAprendizaje"
              class="block text-xs text-[var(--color-danger)]"
            >Registra al menos un aprendizaje.</span>
          </fieldset>

          <label class="block text-xs font-medium">
            ¿Cómo se aplica a mi trabajo?
            <textarea
              v-model="nuevaAplicacion"
              rows="2"
              placeholder="Ej. Lo voy a usar en mis reuniones 1:1 con el equipo"
              class="mt-1 w-full rounded-lg border bg-white px-3 py-2 text-sm font-normal"
              :class="intentoGuardar && faltaAplicacion ? 'border-[var(--color-danger)]' : 'border-[var(--color-line)]'"
            />
            <span
              v-if="intentoGuardar && faltaAplicacion"
              class="mt-1 block font-normal text-[var(--color-danger)]"
            >Este campo es obligatorio: cuenta cómo lo llevarás a la práctica.</span>
          </label>

          <button
            type="submit"
            class="rounded-lg bg-[var(--color-primary)] px-3 py-2 text-sm text-[var(--color-on-primary)] disabled:opacity-60"
            :disabled="guardandoAprendizaje"
          >
            {{ guardandoAprendizaje ? 'Guardando…' : 'Guardar aprendizaje' }}
          </button>
        </form>
      </div>
    </AppModal>
  </AppShell>
</template>
