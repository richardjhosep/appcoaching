<script setup lang="ts">
import NavIcon from './NavIcon.vue'

withDefaults(defineProps<{ icon: string; title: string; description?: string }>(), {
  description: undefined,
})
</script>

<template>
  <div class="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-[var(--color-line)] bg-[var(--color-parchment)]/30 px-6 py-10 text-center">
    <!-- Ilustración de línea: el anillo partido de la marca (dos arcos que se encuentran) con el
         ícono del contexto al centro. Un solo dibujo para los ~45 estados vacíos. -->
    <div
      class="relative flex h-20 w-20 items-center justify-center text-[var(--color-forest)]"
      aria-hidden="true"
    >
      <svg
        class="absolute inset-0"
        viewBox="0 0 100 100"
        fill="none"
        stroke-linecap="round"
      >
        <circle
          cx="50"
          cy="50"
          r="44"
          fill="var(--color-parchment)"
          fill-opacity="0.55"
        />
        <path
          d="M 45.6 91.8 A 42 42 0 0 1 45.6 8.2"
          stroke="var(--color-primary)"
          stroke-opacity="0.75"
          stroke-width="3"
        />
        <path
          d="M 54.4 8.2 A 42 42 0 0 1 54.4 91.8"
          stroke="var(--color-amber)"
          stroke-width="3"
        />
        <circle
          cx="86"
          cy="22"
          r="2.5"
          fill="var(--color-amber)"
          stroke="none"
        />
        <circle
          cx="14"
          cy="78"
          r="2"
          fill="var(--color-primary)"
          fill-opacity="0.5"
          stroke="none"
        />
      </svg>
      <NavIcon
        :name="icon"
        :size="28"
      />
    </div>
    <p class="font-[family-name:var(--font-heading)] text-sm font-semibold text-[var(--color-ink)]">
      {{ title }}
    </p>
    <p
      v-if="description"
      class="max-w-sm text-sm text-[var(--color-muted)]"
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
