<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppShell from '../../components/AppShell.vue'
import NavIcon from '../../components/NavIcon.vue'
import QuizTab from './playground/QuizTab.vue'
import FlashcardsTab from './playground/FlashcardsTab.vue'
import MapasTab from './playground/MapasTab.vue'
import MisMapasTab from './playground/MisMapasTab.vue'
import EjerciciosTab from './playground/EjerciciosTab.vue'
import TestEstiloTab from './playground/TestEstiloTab.vue'
import PizarraTab from './playground/PizarraTab.vue'
import { listQuizzesDisponibles } from '../../api/quiz'
import { listFlashcardsDisponibles } from '../../api/flashcards'
import { listMapasDisponibles } from '../../api/mapas'
import { listMapasPersonales } from '../../api/mapasPersonales'
import { listEjerciciosDisponibles } from '../../api/ejercicios'
import { listTestsEstiloDisponibles } from '../../api/testEstilo'
import { listarNotas } from '../../api/pizarra'

const route = useRoute()
const router = useRouter()

type TabKey = 'quiz' | 'flashcards' | 'mapas' | 'mis-mapas' | 'ejercicios' | 'test-estilo' | 'pizarra'

// Mismo patrón que EstudioView.vue (coach): antes eran 5 ítems de menú aparte, ahora cards
// grandes que hacen de selector de pestaña — mismo mecanismo `?tab=`. "Mapas mentales" es lo
// que asigna el coach (solo lectura); "Mis mapas" y "Mi pizarra" son propios del coachee,
// editables y 100% privados — deliberadamente pestañas distintas para no mezclar conceptos.
const tabs: Array<{ key: TabKey; label: string; icon: string }> = [
  { key: 'quiz', label: 'Quiz', icon: 'quiz' },
  { key: 'flashcards', label: 'Flashcards', icon: 'flashcards' },
  { key: 'mapas', label: 'Mapas mentales', icon: 'mapa' },
  { key: 'mis-mapas', label: 'Mis mapas', icon: 'mapa' },
  { key: 'pizarra', label: 'Mi pizarra', icon: 'pizarra' },
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

const conteos = ref<Record<TabKey, number | null>>({
  quiz: null,
  flashcards: null,
  mapas: null,
  'mis-mapas': null,
  pizarra: null,
  ejercicios: null,
  'test-estilo': null,
})

onMounted(async () => {
  const [quizzes, flashcards, mapas, misMapas, notas, ejercicios, tests] = await Promise.all([
    listQuizzesDisponibles(),
    listFlashcardsDisponibles(),
    listMapasDisponibles(),
    listMapasPersonales(),
    listarNotas(),
    listEjerciciosDisponibles(),
    listTestsEstiloDisponibles(),
  ])
  conteos.value = {
    quiz: quizzes.length,
    flashcards: flashcards.length,
    mapas: mapas.length,
    'mis-mapas': misMapas.length,
    pizarra: notas.length,
    ejercicios: ejercicios.length,
    'test-estilo': tests.length,
  }
})
</script>

<template>
  <AppShell>
    <h1 class="mb-1 font-[family-name:var(--font-heading)] text-xl font-semibold">
      Playground
    </h1>
    <p class="mb-4 text-sm text-[var(--color-ink)]/60">
      Tu espacio para practicar — quiz, flashcards, mapas mentales, ejercicios y tu test de estilo.
    </p>

    <div class="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
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
    <MisMapasTab v-else-if="activeTab === 'mis-mapas'" />
    <PizarraTab v-else-if="activeTab === 'pizarra'" />
    <EjerciciosTab v-else-if="activeTab === 'ejercicios'" />
    <TestEstiloTab v-else-if="activeTab === 'test-estilo'" />
  </AppShell>
</template>
