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
  <div class="flex select-none items-center gap-2.5 cursor-default">
    <!-- Marca "nexus": un anillo partido en dos (coach + práctica) que se conectan en un
         punto central — el vínculo coach–coachee–empresa que la plataforma modela. -->
    <svg
      :width="size"
      :height="size"
      viewBox="0 0 100 100"
      class="shrink-0"
      aria-hidden="true"
    >
      <path
        d="M 43.4 87.4 A 38 38 0 0 1 43.4 12.6"
        fill="none"
        :stroke="dark ? 'var(--color-parchment)' : 'var(--color-ink)'"
        stroke-width="13"
        stroke-linecap="round"
      />
      <path
        d="M 56.6 12.6 A 38 38 0 0 1 56.6 87.4"
        fill="none"
        stroke="var(--color-bronze)"
        stroke-width="13"
        stroke-linecap="round"
      />
      <circle
        cx="50"
        cy="50"
        r="9"
        fill="var(--color-sage)"
      />
    </svg>
    <span
      v-if="showWordmark"
      class="font-[family-name:var(--font-heading)] text-lg font-semibold tracking-tight"
      :class="dark ? 'text-[var(--color-ivory)]' : 'text-[var(--color-ink)]'"
    >
      Coach<span class="text-[var(--color-bronze)]">Nexus</span>
    </span>
  </div>
</template>
