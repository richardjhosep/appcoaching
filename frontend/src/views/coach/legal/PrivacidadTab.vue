<script setup lang="ts">
import SkeletonBlock from '../../../components/SkeletonBlock.vue'
import { computed, onMounted, ref } from 'vue'
import { getCumplimiento, type MedidaCumplimiento } from '../../../api/legal'

const loading = ref(true)
const medidas = ref<MedidaCumplimiento[]>([])

const activas = computed(() => medidas.value.filter((m) => m.activa).length)

onMounted(async () => {
  medidas.value = await getCumplimiento()
  loading.value = false
})
</script>

<template>
  <SkeletonBlock v-if="loading" />
  <div
    v-else
    class="space-y-4"
  >
    <div class="rounded-2xl border border-[var(--color-line)] bg-[var(--color-parchment)]/40 p-4">
      <div class="flex items-baseline justify-between">
        <h2 class="text-sm font-medium">
          Panel de cumplimiento LPDP
        </h2>
        <p class="font-[family-name:var(--font-mono)] text-xl text-[var(--color-sage)]">
          {{ activas }} de {{ medidas.length }}
        </p>
      </div>
      <p class="mt-1 text-xs text-[var(--color-ink)]/60">
        Medidas de protección de datos personales activas hoy.
      </p>
    </div>

    <div
      v-for="m in medidas"
      :key="m.id"
      class="flex items-start gap-3 rounded-2xl border border-[var(--color-line)] bg-white p-4"
    >
      <span
        class="mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded-full text-xs"
        :class="m.activa
          ? 'bg-[var(--color-sage)]/20 text-[var(--color-sage)]'
          : 'bg-[var(--color-bronze)]/20 text-[var(--color-bronze)]'"
      >
        {{ m.activa ? '✓' : '○' }}
      </span>
      <p class="text-sm text-[var(--color-ink)]/80">
        {{ m.descripcion }}
      </p>
    </div>
  </div>
</template>
