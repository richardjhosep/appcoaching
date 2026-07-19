<script setup lang="ts">
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
    <svg
      :width="size"
      :height="size"
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect
        width="32"
        height="32"
        rx="9"
        fill="var(--color-sage)"
      />
      <path
        d="M9 18.5L13.2 22.5L23 11.5"
        stroke="var(--color-ivory)"
        stroke-width="2.6"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
    <span
      v-if="showWordmark"
      class="font-[family-name:var(--font-heading)] text-lg font-semibold tracking-tight"
      :class="dark ? 'text-[var(--color-ivory)]' : 'text-[var(--color-ink)]'"
    >
      Coach<span class="text-[var(--color-bronze)]">OS</span>
    </span>
  </div>
</template>
