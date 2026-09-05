<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppShell from '../../components/AppShell.vue'
import NavIcon from '../../components/NavIcon.vue'
import QuizTab from './estudio/QuizTab.vue'
import FlashcardsTab from './estudio/FlashcardsTab.vue'
import MapasTab from './estudio/MapasTab.vue'
import EjerciciosTab from './estudio/EjerciciosTab.vue'
import TestEstiloTab from './estudio/TestEstiloTab.vue'
import { listQuizzes } from '../../api/quiz'
import { listFlashcards } from '../../api/flashcards'
import { listMapas } from '../../api/mapas'
import { listEjercicios } from '../../api/ejercicios'
import { listTestsEstilo } from '../../api/testEstilo'

const route = useRoute()
const router = useRouter()

type TabKey = 'quiz' | 'flashcards' | 'mapas' | 'ejercicios' | 'test-estilo'

// Antes eran 5 ítems de menú aparte (mismo esqueleto lista→detalle en cada uno) — se
// consolidan acá como cards grandes que hacen de selector de pestaña, mismo mecanismo
// `?tab=` que ya usan NegocioView.vue/LegalView.vue, pero con el lenguaje visual de card en
// vez de texto chico (Mapas usa un canvas interactivo, no cabe bien en un modal).
const tabs: Array<{ key: TabKey; label: string; icon: string }> = [
  { key: 'quiz', label: 'Quiz', icon: 'quiz' },
  { key: 'flashcards', label: 'Flashcards', icon: 'flashcards' },
  { key: 'mapas', label: 'Mapas mentales', icon: 'mapa' },
  { key: 'ejercicios', label: 'Ejercicios', icon: 'ejercicios' },
  { key: 'test-estilo', label: 'Test de Estilo', icon: 'estilo' },
]

const activeTab = computed<TabKey>(() => {
  const q = route.query.tab
  return tabs.some((t) => t.key === q) ? (q as TabKey) : 'quiz'
})

function irATab(tab: TabKey) {
  void router.replace({ query: { ...route.query, tab } })
}

// Contador por card — mismo criterio que los tabs de DashboardView.vue ("Coachees (3)"):
// 5 list*() que cada Tab ya llama por su cuenta al montarse, acá solo se piden en paralelo
// una vez más para el badge (no se comparte el resultado con el Tab activo, cada uno reusa
// su propio ciclo de carga/loading, igual que Negocio/Legal).
const conteos = ref<Record<TabKey, number | null>>({
  quiz: null,
  flashcards: null,
  mapas: null,
  ejercicios: null,
  'test-estilo': null,
})

onMounted(async () => {
  const [quizzes, flashcards, mapas, ejercicios, tests] = await Promise.all([
    listQuizzes(),
    listFlashcards(),
    listMapas(),
    listEjercicios(),
    listTestsEstilo(),
  ])
  conteos.value = {
    quiz: quizzes.length,
    flashcards: flashcards.length,
    mapas: mapas.length,
    ejercicios: ejercicios.length,
    'test-estilo': tests.length,
  }
})
</script>

<template>
  <AppShell>
    <h1 class="mb-1 font-[family-name:var(--font-heading)] text-xl font-semibold">
      Estudiar
    </h1>
    <p class="mb-4 text-sm text-[var(--color-ink)]/60">
      El contenido de práctica que le compartes a tus coachees — cada tarjeta es un tipo distinto.
    </p>

    <div class="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      <button
        v-for="t in tabs"
        :key="t.key"
        type="button"
        class="flex flex-col items-start gap-2 rounded-2xl border bg-white p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-md"
        :class="activeTab === t.key
          ? 'border-[var(--color-sage)] bg-[var(--color-sage)]/5 shadow-sm'
          : 'border-[var(--color-line)] hover:border-[var(--color-sage)]'"
        @click="irATab(t.key)"
      >
        <NavIcon
          :name="t.icon"
          :size="20"
          :class="activeTab === t.key ? 'text-[var(--color-sage)]' : 'text-[var(--color-ink)]/60'"
        />
        <span class="text-sm font-medium">
          {{ t.label }} ({{ conteos[t.key] ?? '…' }})
        </span>
      </button>
    </div>

    <QuizTab v-if="activeTab === 'quiz'" />
    <FlashcardsTab v-else-if="activeTab === 'flashcards'" />
    <MapasTab v-else-if="activeTab === 'mapas'" />
    <EjerciciosTab v-else-if="activeTab === 'ejercicios'" />
    <TestEstiloTab v-else-if="activeTab === 'test-estilo'" />
  </AppShell>
</template>
