<script setup lang="ts">
// Chip de estado único. Los tonos reutilizan los colores semánticos de nivelProgreso
// (sage = bien, bronze = atención, danger = problema) para que el mismo estado se vea igual
// en todas las pantallas.
withDefaults(defineProps<{ tone?: 'sage' | 'bronze' | 'danger' | 'spark' | 'neutral' }>(), {
  tone: 'neutral',
})

const TONES = {
  sage: 'bg-[color-mix(in_srgb,var(--color-sage)_15%,white)] text-[var(--color-sage)]',
  bronze: 'bg-[color-mix(in_srgb,var(--color-bronze)_15%,white)] text-[var(--color-bronze)]',
  danger: 'bg-[color-mix(in_srgb,var(--color-danger)_12%,white)] text-[var(--color-danger)]',
  spark: 'bg-[color-mix(in_srgb,var(--color-spark)_12%,white)] text-[var(--color-spark)]',
  neutral: 'bg-[var(--color-parchment)] text-[var(--color-muted)]',
}
</script>

<template>
  <span
    class="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium"
    :class="TONES[tone]"
  >
    <slot />
  </span>
</template>
