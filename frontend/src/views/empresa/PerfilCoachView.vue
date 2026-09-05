<script setup lang="ts">
import { onMounted, ref } from 'vue'
import AppShell from '../../components/AppShell.vue'
import PerfilCoachContenido from '../../components/PerfilCoachContenido.vue'
import SkeletonBlock from '../../components/SkeletonBlock.vue'
import { getPerfilCoach, type PerfilCoach } from '../../api/perfilCoach'

const loading = ref(true)
const perfil = ref<PerfilCoach | null>(null)

onMounted(async () => {
  perfil.value = await getPerfilCoach()
  loading.value = false
})
</script>

<template>
  <AppShell>
    <h1 class="mb-1 font-[family-name:var(--font-heading)] text-xl font-semibold">
      Mi Coach
    </h1>
    <p class="mb-4 text-sm text-[var(--color-ink)]/60">
      Conoce a la persona que acompaña el desarrollo de tu equipo.
    </p>

    <SkeletonBlock v-if="loading" />
    <PerfilCoachContenido
      v-else-if="perfil"
      :perfil="perfil"
    />
  </AppShell>
</template>
