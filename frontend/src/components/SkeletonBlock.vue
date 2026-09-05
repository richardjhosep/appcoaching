<script setup lang="ts">
// Reemplaza el texto plano "Cargando…" en toda la app por un placeholder que
// insinúa la forma del contenido que va a aparecer, en vez de una pantalla en
// blanco con una palabra. `rows` controla cuántas barras se dibujan; la última
// siempre queda más corta para que no se vea como una grilla perfecta.
withDefaults(defineProps<{ rows?: number }>(), { rows: 3 })
</script>

<template>
  <div
    class="flex flex-col gap-3"
    role="status"
    aria-label="Cargando"
  >
    <div
      v-for="i in rows"
      :key="i"
      class="skeleton-shimmer h-4 rounded-lg"
      :style="{ width: i === rows ? '55%' : '100%' }"
    />
  </div>
</template>
