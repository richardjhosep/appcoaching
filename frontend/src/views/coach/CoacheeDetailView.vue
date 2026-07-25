<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppShell from '../../components/AppShell.vue'
import PerfilTab from './coachee-detail/PerfilTab.vue'
import PlanTab from './coachee-detail/PlanTab.vue'
import SesionesTab from './coachee-detail/SesionesTab.vue'
import CicloTab from './coachee-detail/CicloTab.vue'
import { getCoachee, type Coachee } from '../../api/coachees'

const props = defineProps<{ coacheeId: string }>()

const route = useRoute()
const router = useRouter()

const coachee = ref<Coachee | null>(null)
const loading = ref(true)

type TabKey = 'perfil' | 'plan' | 'sesiones' | 'ciclo'
const tabs: Array<{ key: TabKey; label: string }> = [
  { key: 'perfil', label: 'Perfil' },
  { key: 'plan', label: 'Plan' },
  { key: 'sesiones', label: 'Sesiones' },
  { key: 'ciclo', label: 'Ciclo e informes' },
]

const activeTab = computed<TabKey>(() => {
  const q = route.query.tab
  return tabs.some((t) => t.key === q) ? (q as TabKey) : 'perfil'
})

function irATab(tab: TabKey) {
  void router.replace({ query: { ...route.query, tab } })
}

async function load() {
  loading.value = true
  coachee.value = await getCoachee(props.coacheeId)
  loading.value = false
}

onMounted(load)
watch(() => props.coacheeId, load)
</script>

<template>
  <AppShell>
    <div class="mb-4">
      <RouterLink
        to="/coach/coachees"
        class="text-sm text-[var(--color-sage)] underline"
      >
        ← Volver a Coachees
      </RouterLink>
    </div>

    <div
      v-if="loading"
      class="text-sm text-[var(--color-ink)]/60"
    >
      Cargando…
    </div>
    <template v-else-if="coachee">
      <div class="mb-4">
        <h1 class="font-[family-name:var(--font-heading)] text-xl font-semibold">
          {{ coachee.nombre }}
        </h1>
        <p class="text-sm text-[var(--color-ink)]/60">
          {{ coachee.empresa?.nombre ?? 'Independiente' }}
        </p>
      </div>

      <div class="mb-4 flex gap-1 border-b border-[var(--color-line)]">
        <button
          v-for="t in tabs"
          :key="t.key"
          class="border-b-2 px-3 py-2 text-sm"
          :class="activeTab === t.key ? 'border-[var(--color-sage)] font-medium text-[var(--color-sage)]' : 'border-transparent text-[var(--color-ink)]/60'"
          @click="irATab(t.key)"
        >
          {{ t.label }}
        </button>
      </div>

      <PerfilTab
        v-if="activeTab === 'perfil'"
        :coachee-id="props.coacheeId"
      />
      <PlanTab
        v-else-if="activeTab === 'plan'"
        :coachee-id="props.coacheeId"
      />
      <SesionesTab
        v-else-if="activeTab === 'sesiones'"
        :coachee-id="props.coacheeId"
      />
      <CicloTab
        v-else-if="activeTab === 'ciclo'"
        :coachee-id="props.coacheeId"
      />
    </template>
  </AppShell>
</template>
