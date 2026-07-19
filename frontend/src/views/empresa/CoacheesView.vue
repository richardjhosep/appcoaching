<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import AppShell from '../../components/AppShell.vue'
import { listCoachees, type CoacheeListItem } from '../../api/coachees'

const router = useRouter()
const coachees = ref<CoacheeListItem[]>([])
const loading = ref(true)

onMounted(async () => {
  coachees.value = await listCoachees()
  loading.value = false
})

function verCiclo(coacheeId: string) {
  void router.push({ name: 'empresa-ciclo', params: { coacheeId } })
}
</script>

<template>
  <AppShell>
    <h1 class="mb-4 font-[family-name:var(--font-heading)] text-xl font-semibold">
      Mis coachees
    </h1>
    <div
      v-if="loading"
      class="text-sm text-[var(--color-ink)]/60"
    >
      Cargando…
    </div>
    <p
      v-else-if="coachees.length === 0"
      class="text-sm text-[var(--color-ink)]/60"
    >
      Todavía no hay coachees asociados a tu empresa.
    </p>
    <ul
      v-else
      class="space-y-2"
    >
      <li
        v-for="c in coachees"
        :key="c.id"
        class="cursor-pointer rounded-xl border border-[var(--color-line)] bg-white p-3 text-sm hover:border-[var(--color-sage)]"
        @click="verCiclo(c.id)"
      >
        {{ c.nombre }}
      </li>
    </ul>
  </AppShell>
</template>
