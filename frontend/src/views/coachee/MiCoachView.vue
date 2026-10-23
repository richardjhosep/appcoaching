<script setup lang="ts">
import { onMounted, ref } from 'vue'
import AppShell from '../../components/AppShell.vue'
import PerfilCoachContenido from '../../components/PerfilCoachContenido.vue'
import SkeletonBlock from '../../components/SkeletonBlock.vue'
import ErrorState from '../../components/ErrorState.vue'
import { useCarga } from '../../lib/useCarga'
import { getPerfilCoach, type PerfilCoach } from '../../api/perfilCoach'

const perfil = ref<PerfilCoach | null>(null)

const { loading, error, recargar } = useCarga(async () => {
  perfil.value = await getPerfilCoach()
})
onMounted(recargar)
</script>

<template>
  <AppShell>
    <h1 class="mb-1 font-[family-name:var(--font-heading)] text-xl font-semibold">
      Mi Coach
    </h1>
    <p class="mb-4 text-sm text-[var(--color-muted)]">
      Conoce a la persona que acompaña tu proceso.
    </p>

    <SkeletonBlock v-if="loading" />
    <ErrorState
      v-else-if="error"
      :description="error"
      @retry="recargar"
    />
    <PerfilCoachContenido
      v-else-if="perfil"
      :perfil="perfil"
    />
  </AppShell>
</template>
