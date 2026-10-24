<script setup lang="ts">
// Botón único de la app. Reemplaza las ~8 combinaciones de padding/peso copiadas por vista.
// `sm` mide 36px de alto y `md` 40px; en móvil ambos suben a 44px (blanco táctil).
withDefaults(defineProps<{
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'sm' | 'md'
  type?: 'button' | 'submit' | 'reset'
  loading?: boolean
  disabled?: boolean
}>(), {
  variant: 'primary',
  size: 'md',
  type: 'button',
  loading: false,
  disabled: false,
})

const VARIANTS = {
  primary: 'bg-[var(--color-primary)] text-[var(--color-on-primary)] hover:bg-[var(--color-primary-hover)]',
  secondary: 'border border-[var(--color-line)] bg-white text-[var(--color-ink)] hover:bg-[var(--color-parchment)]/60',
  danger: 'bg-[var(--color-danger)] text-white hover:bg-[var(--color-danger)]/90',
  ghost: 'text-[var(--color-ink)] hover:bg-[var(--color-parchment)]/70',
}
const SIZES = {
  sm: 'min-h-11 px-3 text-xs sm:min-h-9',
  md: 'min-h-11 px-4 text-sm sm:min-h-10',
}
</script>

<template>
  <button
    :type="type"
    :disabled="disabled || loading"
    :aria-busy="loading || undefined"
    class="inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
    :class="[VARIANTS[variant], SIZES[size]]"
  >
    <svg
      v-if="loading"
      class="h-4 w-4 animate-spin"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        stroke-width="3"
        class="opacity-25"
      />
      <path
        d="M12 2a10 10 0 0 1 10 10"
        stroke="currentColor"
        stroke-width="3"
        stroke-linecap="round"
      />
    </svg>
    <slot />
  </button>
</template>
