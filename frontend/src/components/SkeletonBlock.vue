<script setup lang="ts">
// Indicador de carga compartido por toda la app. Por defecto es un spinner; con
// `variant="cards"|"list"|"table"` muestra un esqueleto con la forma del contenido para
// evitar saltos de layout. Cambiar acá alcanza a todas las vistas que hacen
// `<SkeletonBlock v-if="loading" />`.
withDefaults(defineProps<{ variant?: 'spinner' | 'cards' | 'list' | 'table'; rows?: number }>(), {
  variant: 'spinner',
  rows: 3,
})
</script>

<template>
  <div
    v-if="variant === 'spinner'"
    class="flex flex-col items-center justify-center gap-2 py-8"
    role="status"
    aria-label="Cargando"
  >
    <svg
      class="h-6 w-6 animate-spin text-[var(--color-sage)]"
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        stroke-width="3"
        class="opacity-20"
      />
      <path
        d="M12 2a10 10 0 0 1 10 10"
        stroke="currentColor"
        stroke-width="3"
        stroke-linecap="round"
      />
    </svg>
    <span class="text-xs text-[var(--color-muted)]">Cargando…</span>
  </div>
  <div
    v-else
    role="status"
    aria-label="Cargando"
    class="animate-pulse"
    :class="variant === 'cards' ? 'grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3' : 'space-y-2'"
  >
    <div
      v-for="n in rows"
      :key="n"
      class="rounded-2xl bg-[var(--color-parchment)]/70"
      :class="variant === 'cards' ? 'h-28' : variant === 'table' ? 'h-10 rounded-lg' : 'h-14'"
    />
  </div>
</template>
