<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppShell from '../../components/AppShell.vue'
import TabBar from '../../components/TabBar.vue'
import ContratosTab from './legal/ContratosTab.vue'
import PrivacidadTab from './legal/PrivacidadTab.vue'
import AuditoriaTab from './legal/AuditoriaTab.vue'

const route = useRoute()
const router = useRouter()

type TabKey = 'contratos' | 'privacidad' | 'auditoria'
const tabs: Array<{ key: TabKey; label: string; icon: string }> = [
  { key: 'contratos', label: 'Contratos', icon: 'legal' },
  { key: 'privacidad', label: 'Privacidad', icon: 'password' },
  { key: 'auditoria', label: 'Auditoría', icon: 'auditoria' },
]

const activeTab = computed<TabKey>(() => {
  const q = route.query.tab
  return tabs.some((t) => t.key === q) ? (q as TabKey) : 'contratos'
})

function irATab(tab: TabKey) {
  void router.replace({ query: { ...route.query, tab } })
}
</script>

<template>
  <AppShell>
    <h1 class="mb-4 font-[family-name:var(--font-heading)] text-xl font-semibold">
      Legal y auditoría
    </h1>

    <TabBar
      class="mb-4"
      :tabs="tabs"
      :model-value="activeTab"
      @update:model-value="irATab"
    />

    <ContratosTab v-if="activeTab === 'contratos'" />
    <PrivacidadTab v-else-if="activeTab === 'privacidad'" />
    <AuditoriaTab v-else-if="activeTab === 'auditoria'" />
  </AppShell>
</template>
