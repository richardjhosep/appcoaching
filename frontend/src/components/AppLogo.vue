<script setup lang="ts">
import iconoUrl from '../assets/icono.jpg'

withDefaults(
  defineProps<{
    size?: number
    showWordmark?: boolean
    dark?: boolean
  }>(),
  { size: 32, showWordmark: true, dark: false },
)
</script>

<template>
  <div class="flex items-center gap-2.5">
    <img
      :src="iconoUrl"
      :width="size"
      :height="size"
      alt="CoachOS"
      class="shrink-0 rounded-[22%] object-cover"
      :style="{ width: `${size}px`, height: `${size}px` }"
    >
    <span
      v-if="showWordmark"
      class="font-[family-name:var(--font-heading)] text-lg font-semibold tracking-tight"
      :class="dark ? 'text-[var(--color-ivory)]' : 'text-[var(--color-ink)]'"
    >
      Coach<span class="text-[var(--color-bronze)]">OS</span>
    </span>
  </div>
</template>
