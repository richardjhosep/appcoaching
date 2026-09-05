<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppShell from '../../components/AppShell.vue'
import TabBar from '../../components/TabBar.vue'
import ResumenTab from './negocio/ResumenTab.vue'
import ComercialTab from './negocio/ComercialTab.vue'

const route = useRoute()
const router = useRouter()

type TabKey = 'resumen' | 'comercial'
const tabs: Array<{ key: TabKey; label: string; icon: string }> = [
  { key: 'resumen', label: 'Resumen', icon: 'dashboard' },
  { key: 'comercial', label: 'Comercial', icon: 'comercial' },
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

    <TabBar
      class="mb-4"
      :tabs="tabs"
      :model-value="activeTab"
      @update:model-value="irATab"
    />

    <ResumenTab v-if="activeTab === 'resumen'" />
    <ComercialTab v-else-if="activeTab === 'comercial'" />
  </AppShell>
</template>
