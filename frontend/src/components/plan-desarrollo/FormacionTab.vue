<script setup lang="ts">
import SkeletonBlock from '../SkeletonBlock.vue'
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import type { PlanDesarrollo } from '../../api/planesDesarrollo'
import { getMisRecursos, type Recurso } from '../../api/recursos'
import { listQuizzesDisponibles, type QuizResumen } from '../../api/quiz'
import { listFlashcardsDisponibles, type FlashcardConEstado } from '../../api/flashcards'
import { listMapasDisponibles, type MapaResumen } from '../../api/mapas'
import { listCompetencias, type Competencia } from '../../api/competencias'
import { formacionDe } from '../../lib/formacionRecomendada'
import SectionCard from '../SectionCard.vue'
import EmptyState from '../EmptyState.vue'
import RecursoIcono from '../RecursoIcono.vue'

const props = defineProps<{ plan: PlanDesarrollo }>()

const router = useRouter()
const loading = ref(true)
const recursos = ref<Recurso[]>([])
const quizzes = ref<QuizResumen[]>([])
const flashcards = ref<FlashcardConEstado[]>([])
const mapas = ref<MapaResumen[]>([])
const competencias = ref<Competencia[]>([])

onMounted(async () => {
  loading.value = true
  const [r, q, f, m, comps] = await Promise.all([
    getMisRecursos(),
    listQuizzesDisponibles(),
    listFlashcardsDisponibles(),
    listMapasDisponibles(),
    listCompetencias(),
  ])
  recursos.value = r
  quizzes.value = q
  flashcards.value = f
  mapas.value = m
  competencias.value = comps
  loading.value = false
})

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
          Ir a Biblioteca →
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
          Ir a Quiz →
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
          Ir a Flashcards →
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
          Ir a Mapas mentales →
        </button>
      </SectionCard>
    </template>

    <details
      v-if="notasAntiguas.length"
      class="rounded-2xl border border-[var(--color-line)] bg-white p-4"
    >
      <summary class="cursor-pointer text-xs font-medium uppercase tracking-wide text-[var(--color-ink)]/45">
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
