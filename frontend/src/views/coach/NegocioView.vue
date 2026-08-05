<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppShell from '../../components/AppShell.vue'
import ResumenTab from './negocio/ResumenTab.vue'
import ComercialTab from './negocio/ComercialTab.vue'

const route = useRoute()
const router = useRouter()

type TabKey = 'resumen' | 'comercial'
const tabs: Array<{ key: TabKey; label: string }> = [
  { key: 'resumen', label: 'Resumen' },
  { key: 'comercial', label: 'Comercial' },
]

const activeTab = computed<TabKey>(() => {
  const q = route.query.tab
  return tabs.some((t) => t.key === q) ? (q as TabKey) : 'resumen'
})

function irATab(tab: TabKey) {
  void router.replace({ query: { ...route.query, tab } })
}
</script>

<template>
  <AppShell>
    <h1 class="mb-4 font-[family-name:var(--font-heading)] text-xl font-semibold">
      Negocio
    </h1>

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

    <ResumenTab v-if="activeTab === 'resumen'" />
    <ComercialTab v-else-if="activeTab === 'comercial'" />
  </AppShell>
</template>
