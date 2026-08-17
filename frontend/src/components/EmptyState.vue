<script setup lang="ts">
import NavIcon from './NavIcon.vue'

withDefaults(defineProps<{ icon: string; title: string; description?: string }>(), {
  description: undefined,
})
</script>

<template>
  <div class="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-[var(--color-line)] bg-[var(--color-parchment)]/30 px-6 py-10 text-center">
    <div class="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-parchment)] text-[var(--color-bronze)]">
      <NavIcon
        :name="icon"
        :size="22"
      />
    </div>
    <p class="font-[family-name:var(--font-heading)] text-sm font-semibold text-[var(--color-ink)]">
      {{ title }}
    </p>
    <p
      v-if="description"
      class="max-w-sm text-sm text-[var(--color-ink)]/60"
    >
      {{ description }}
    </p>
    <div
      v-if="$slots.default"
      class="mt-1"
    >
      <slot />
    </div>
  </div>
</template>
