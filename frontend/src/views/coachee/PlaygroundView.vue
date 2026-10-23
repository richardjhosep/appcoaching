<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppShell from '../../components/AppShell.vue'
import TabBar from '../../components/TabBar.vue'
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
import { useCarga } from '../../lib/useCarga'

const route = useRoute()
const router = useRouter()

type TabKey = 'quiz' | 'flashcards' | 'mapas' | 'mis-mapas' | 'ejercicios' | 'test-estilo' | 'pizarra'

// Mismo patrón que HerramientasView.vue (coach): antes eran 5 ítems de menú aparte, ahora una
// barra de pestañas (TabBar, con scroll horizontal en móvil) — mismo mecanismo `?tab=`. "Mapas mentales" es lo
// que asigna el coach (solo lectura); "Mis mapas" y "Mi pizarra" son propios del coachee,
// editables y 100% privados — deliberadamente pestañas distintas para no mezclar conceptos.
const tabs: Array<{ key: TabKey; label: string; icon: string; badge?: number | null }> = [
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

// Los conteos son decorativos: si una llamada falla, esa pestaña simplemente no muestra
// número (en vez de romper la pantalla).
const { tolerar, recargar } = useCarga(async () => {
  const [quizzes, flashcards, mapas, misMapas, notas, ejercicios, tests] = await Promise.all([
    tolerar(listQuizzesDisponibles()),
    tolerar(listFlashcardsDisponibles()),
    tolerar(listMapasDisponibles()),
    tolerar(listMapasPersonales()),
    tolerar(listarNotas()),
    tolerar(listEjerciciosDisponibles()),
    tolerar(listTestsEstiloDisponibles()),
  ])
  conteos.value = {
    quiz: quizzes?.length ?? null,
    flashcards: flashcards?.length ?? null,
    mapas: mapas?.length ?? null,
    'mis-mapas': misMapas?.length ?? null,
    pizarra: notas?.length ?? null,
    ejercicios: ejercicios?.length ?? null,
    'test-estilo': tests?.length ?? null,
  }
})
onMounted(recargar)

const tabsConConteo = computed(() => tabs.map((t) => ({ ...t, badge: conteos.value[t.key] })))
</script>

<template>
  <AppShell>
    <h1 class="mb-1 font-[family-name:var(--font-heading)] text-xl font-semibold">
      Playground
    </h1>
    <p class="mb-4 text-sm text-[var(--color-muted)]">
      Tu espacio para practicar — quiz, flashcards, mapas mentales, ejercicios y tu test de estilo.
    </p>

    <div class="mb-5 max-w-full overflow-x-auto">
      <TabBar
        :tabs="tabsConConteo"
        :model-value="activeTab"
        scroll
        @update:model-value="irATab"
      />
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
