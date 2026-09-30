<script setup lang="ts">
// Indicador de carga compartido por toda la app (51 usos) — antes era un
// shimmer que insinuaba la forma del contenido; ahora es un spinner explícito.
// Cambiar acá alcanza a todas las vistas que hacen `<SkeletonBlock v-if="loading" />`,
// sin tocar cada llamado uno por uno.
</script>

<template>
  <div
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
    <span class="text-xs text-[var(--color-ink)]/50">Cargando…</span>
  </div>
</template>
