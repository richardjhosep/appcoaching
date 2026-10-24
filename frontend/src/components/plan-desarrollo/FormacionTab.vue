<script setup lang="ts">
import SkeletonBlock from '../SkeletonBlock.vue'
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import type { PlanDesarrollo } from '../../api/planesDesarrollo'
import { getMisRecursos, type Recurso } from '../../api/recursos'
import { listQuizzesDisponibles, type QuizResumen } from '../../api/quiz'
import { listFlashcardsDisponibles, type FlashcardConEstado } from '../../api/flashcards'
import { listMapasDisponibles, type MapaResumen } from '../../api/mapas'
import { listCompetencias, type Competencia } from '../../api/competencias'
import {
  listarRecursosPersonales,
  crearRecursoPersonal,
  eliminarRecursoPersonal,
  type RecursoPersonal,
  type CategoriaRecursoPersonal,
} from '../../api/recursosPersonales'
import { formacionDe } from '../../lib/formacionRecomendada'
import { ApiError } from '../../api/client'
import { notifyError } from '../../lib/notify'
import SectionCard from '../SectionCard.vue'
import EmptyState from '../EmptyState.vue'
import RecursoIcono from '../RecursoIcono.vue'
import NavIcon from '../NavIcon.vue'

const props = defineProps<{ plan: PlanDesarrollo }>()

const router = useRouter()
const loading = ref(true)
const recursos = ref<Recurso[]>([])
const quizzes = ref<QuizResumen[]>([])
const flashcards = ref<FlashcardConEstado[]>([])
const mapas = ref<MapaResumen[]>([])
const competencias = ref<Competencia[]>([])
const misRecursos = ref<RecursoPersonal[]>([])

onMounted(async () => {
  loading.value = true
  const [r, q, f, m, comps, propios] = await Promise.all([
    getMisRecursos(),
    listQuizzesDisponibles(),
    listFlashcardsDisponibles(),
    listMapasDisponibles(),
    listCompetencias(),
    listarRecursosPersonales(),
  ])
  recursos.value = r
  quizzes.value = q
  flashcards.value = f
  mapas.value = m
  competencias.value = comps
  misRecursos.value = propios
  loading.value = false
})

// Material que el propio coachee encontró y quiere registrar — a diferencia de todo lo
// de arriba (asignado por el coach), esto es 100% suyo y no depende de la competencia
// del plan, por eso se muestra siempre, no solo cuando hay competenciaId.
const CATEGORIAS: { value: CategoriaRecursoPersonal; label: string }[] = [
  { value: 'libro', label: 'Libro' },
  { value: 'articulo', label: 'Artículo' },
  { value: 'video', label: 'Video' },
  { value: 'podcast', label: 'Podcast' },
  { value: 'practica_guiada', label: 'Práctica guiada' },
]
const categoriaLabel = (c: CategoriaRecursoPersonal) => CATEGORIAS.find((o) => o.value === c)?.label ?? c

const nuevoRecurso = reactive({ categoria: '' as CategoriaRecursoPersonal | '', titulo: '', url: '', notas: '' })
const guardandoRecurso = ref(false)
const errorRecurso = ref<string | null>(null)

async function agregarRecursoPersonal() {
  if (!nuevoRecurso.categoria || !nuevoRecurso.titulo.trim()) return
  guardandoRecurso.value = true
  errorRecurso.value = null
  try {
    const creado = await crearRecursoPersonal({
      categoria: nuevoRecurso.categoria,
      titulo: nuevoRecurso.titulo.trim(),
      url: nuevoRecurso.url.trim() || undefined,
      notas: nuevoRecurso.notas.trim() || undefined,
    })
    misRecursos.value = [creado, ...misRecursos.value]
    nuevoRecurso.categoria = ''
    nuevoRecurso.titulo = ''
    nuevoRecurso.url = ''
    nuevoRecurso.notas = ''
  } catch (err) {
    errorRecurso.value = err instanceof ApiError ? err.message : 'No se pudo agregar el material.'
    await notifyError('No se pudo agregar el material', errorRecurso.value)
  } finally {
    guardandoRecurso.value = false
  }
}

async function borrarRecursoPersonal(id: string) {
  await eliminarRecursoPersonal(id)
  misRecursos.value = misRecursos.value.filter((r) => r.id !== id)
}

const formacion = computed(() =>
  formacionDe(props.plan.competenciaId, {
    recursos: recursos.value,
    quizzes: quizzes.value,
    flashcards: flashcards.value,
    mapas: mapas.value,
  }),
)

const nombreCompetencia = computed(
  () => competencias.value.find((c) => c.id === props.plan.competenciaId)?.nombre ?? null,
)

// Distingue "no hay nada de material todavía" de "hay material, pero de otras
// competencias" — la primera vez que probamos esto en real, confundía a un coach
// ver "no hay nada" cuando en realidad sí tenía Quiz/Flashcards, solo que de otra
// competencia distinta a la de este plan.
const hayContenidoDeOtraCompetencia = computed(() => {
  const tieneAlgunaCompetencia = (id: string | null) => id !== null && id !== props.plan.competenciaId
  return (
    recursos.value.some((r) => tieneAlgunaCompetencia(r.competenciaId)) ||
    quizzes.value.some((q) => tieneAlgunaCompetencia(q.competenciaId)) ||
    flashcards.value.some((f) => tieneAlgunaCompetencia(f.competenciaId)) ||
    mapas.value.some((m) => tieneAlgunaCompetencia(m.competenciaId))
  )
})

// Texto libre de antes de este cambio — ya no editable, se muestra de solo lectura
// para no perder lo que el coach haya escrito, pero no se vuelve a guardar.
const notasAntiguas = computed(() =>
  [
    { label: 'Libros', contenido: props.plan.formacionLibros },
    { label: 'Artículos', contenido: props.plan.formacionArticulos },
    { label: 'Videos', contenido: props.plan.formacionVideos },
    { label: 'Podcasts', contenido: props.plan.formacionPodcasts },
    { label: 'Práctica guiada', contenido: props.plan.formacionPracticaGuiada },
  ].filter((n) => n.contenido?.trim()),
)
</script>

<template>
  <div class="space-y-4">
    <SkeletonBlock v-if="loading" />

    <EmptyState
      v-else-if="!plan.competenciaId"
      icon="formacion"
      title="Define primero una competencia"
      description="La formación complementaria se arma sola a partir de la competencia que elijas en la pestaña Definición."
    />

    <EmptyState
      v-else-if="formacion.vacio"
      icon="formacion"
      :title="`Todavía no hay material de ${nombreCompetencia ?? 'esta competencia'}`"
      :description="hayContenidoDeOtraCompetencia
        ? `Sí hay recursos, quiz, flashcards o mapas mentales creados, pero de otras competencias — ninguno etiquetado como ${nombreCompetencia ?? 'esta'} todavía.`
        : 'Cuando tu coach agregue recursos, quiz, flashcards o mapas mentales de esta competencia, van a aparecer acá.'"
    />

    <template v-else>
      <SectionCard
        v-if="formacion.recursos.length"
        title="Recursos"
        icon="biblioteca"
      >
        <ul class="space-y-2">
          <li
            v-for="r in formacion.recursos"
            :key="r.id"
            class="flex items-center gap-2 text-sm"
          >
            <RecursoIcono
              :recurso="r"
              size="xs"
            />
            {{ r.titulo }}
          </li>
        </ul>
        <button
          class="mt-3 text-xs text-[var(--color-sage)] hover:underline"
          @click="router.push({ name: 'coachee-biblioteca' })"
        >
          Ir a Biblioteca <NavIcon name="flecha-derecha" :size="14" class="inline-block align-[-0.15em]" aria-hidden="true" />
        </button>
      </SectionCard>

      <SectionCard
        v-if="formacion.quizzes.length"
        title="Quiz"
        icon="quiz"
      >
        <ul class="space-y-1 text-sm">
          <li
            v-for="q in formacion.quizzes"
            :key="q.id"
          >
            {{ q.titulo }}
          </li>
        </ul>
        <button
          class="mt-3 text-xs text-[var(--color-sage)] hover:underline"
          @click="router.push({ name: 'coachee-quiz' })"
        >
          Ir a Quiz <NavIcon name="flecha-derecha" :size="14" class="inline-block align-[-0.15em]" aria-hidden="true" />
        </button>
      </SectionCard>

      <SectionCard
        v-if="formacion.flashcards.length"
        title="Flashcards"
        icon="flashcards"
      >
        <p class="text-sm text-[var(--color-ink)]/70">
          {{ formacion.flashcards.length }} flashcard{{ formacion.flashcards.length === 1 ? '' : 's' }} de esta competencia.
        </p>
        <button
          class="mt-3 text-xs text-[var(--color-sage)] hover:underline"
          @click="router.push({ name: 'coachee-flashcards' })"
        >
          Ir a Flashcards <NavIcon name="flecha-derecha" :size="14" class="inline-block align-[-0.15em]" aria-hidden="true" />
        </button>
      </SectionCard>

      <SectionCard
        v-if="formacion.mapas.length"
        title="Mapas mentales"
        icon="mapa"
      >
        <ul class="space-y-1 text-sm">
          <li
            v-for="m in formacion.mapas"
            :key="m.id"
          >
            {{ m.titulo }}
          </li>
        </ul>
        <button
          class="mt-3 text-xs text-[var(--color-sage)] hover:underline"
          @click="router.push({ name: 'coachee-mapas' })"
        >
          Ir a Mapas mentales <NavIcon name="flecha-derecha" :size="14" class="inline-block align-[-0.15em]" aria-hidden="true" />
        </button>
      </SectionCard>
    </template>

    <SectionCard
      v-if="!loading"
      title="Mis materiales de formación"
      icon="formacion"
    >
      <p class="mb-3 text-xs text-[var(--color-muted)]">
        Libros, artículos, videos, podcasts o prácticas que tú mismo encontraste — independiente
        de lo que tu coach te haya asignado arriba.
      </p>

      <p
        v-if="errorRecurso"
        class="mb-2 text-sm text-[var(--color-danger)]"
      >
        {{ errorRecurso }}
      </p>

      <ul
        v-if="misRecursos.length"
        class="mb-3 space-y-2"
      >
        <li
          v-for="r in misRecursos"
          :key="r.id"
          class="rounded-lg border border-[var(--color-line)] p-2 text-sm"
        >
          <div class="flex items-start justify-between gap-2">
            <div>
              <span class="mr-2 rounded bg-[var(--color-parchment)] px-1.5 py-0.5 text-xs text-[var(--color-ink)]/70">
                {{ categoriaLabel(r.categoria) }}
              </span>
              <a
                v-if="r.url"
                :href="r.url"
                target="_blank"
                rel="noopener"
                class="font-medium underline"
              >{{ r.titulo }}</a>
              <span
                v-else
                class="font-medium"
              >{{ r.titulo }}</span>
              <p
                v-if="r.notas"
                class="mt-1 text-xs text-[var(--color-muted)]"
              >
                {{ r.notas }}
              </p>
            </div>
            <button
              class="shrink-0 text-xs text-[var(--color-bronze)] hover:underline"
              @click="borrarRecursoPersonal(r.id)"
            >
              Quitar
            </button>
          </div>
        </li>
      </ul>

      <div class="grid gap-2 sm:grid-cols-2">
        <select
          v-model="nuevoRecurso.categoria"
          class="rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm"
        >
          <option
            value=""
            disabled
          >
            Categoría
          </option>
          <option
            v-for="c in CATEGORIAS"
            :key="c.value"
            :value="c.value"
          >
            {{ c.label }}
          </option>
        </select>
        <input
          v-model="nuevoRecurso.titulo"
          type="text"
          placeholder="Título"
          class="rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm"
        >
        <input
          v-model="nuevoRecurso.url"
          type="text"
          placeholder="Link (opcional)"
          class="rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm sm:col-span-2"
        >
        <textarea
          v-model="nuevoRecurso.notas"
          rows="2"
          placeholder="Notas (opcional) — ¿por qué te sirvió?"
          class="rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm sm:col-span-2"
        />
        <button
          class="w-fit rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm hover:bg-[var(--color-parchment)]/50 disabled:opacity-60 sm:col-span-2"
          :disabled="guardandoRecurso || !nuevoRecurso.categoria || !nuevoRecurso.titulo.trim()"
          @click="agregarRecursoPersonal"
        >
          {{ guardandoRecurso ? 'Guardando…' : 'Agregar' }}
        </button>
      </div>
    </SectionCard>

    <details
      v-if="notasAntiguas.length"
      class="rounded-2xl border border-[var(--color-line)] bg-white p-4"
    >
      <summary class="cursor-pointer text-xs font-medium uppercase tracking-wide text-[var(--color-subtle)]">
        Notas antiguas de formación
      </summary>
      <div class="mt-3 space-y-2">
        <p
          v-for="n in notasAntiguas"
          :key="n.label"
          class="text-sm"
        >
          <span class="font-medium">{{ n.label }}:</span> {{ n.contenido }}
        </p>
      </div>
    </details>
  </div>
</template>
