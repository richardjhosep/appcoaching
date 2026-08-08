<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppShell from '../../components/AppShell.vue'
import ContratosTab from './legal/ContratosTab.vue'
import PrivacidadTab from './legal/PrivacidadTab.vue'
import AuditoriaTab from './legal/AuditoriaTab.vue'

const route = useRoute()
const router = useRouter()

type TabKey = 'contratos' | 'privacidad' | 'auditoria'
const tabs: Array<{ key: TabKey; label: string }> = [
  { key: 'contratos', label: 'Contratos' },
  { key: 'privacidad', label: 'Privacidad' },
  { key: 'auditoria', label: 'Auditoría' },
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

    <ContratosTab v-if="activeTab === 'contratos'" />
    <PrivacidadTab v-else-if="activeTab === 'privacidad'" />
    <AuditoriaTab v-else-if="activeTab === 'auditoria'" />
  </AppShell>
</template>
