<script setup lang="ts">
import { computed } from 'vue'
import type { PuntoProgreso } from '../api/seguimiento'

const props = defineProps<{ puntos: PuntoProgreso[] }>()

const WIDTH = 300
const HEIGHT = 100
const PAD = 10

const coords = computed(() => {
  const n = props.puntos.length
  if (n === 0) return []
  return props.puntos.map((p, i) => {
    const x = n === 1 ? WIDTH / 2 : PAD + (i * (WIDTH - 2 * PAD)) / (n - 1)
    const y = HEIGHT - PAD - ((p.cercaniaObjetivo - 1) / 9) * (HEIGHT - 2 * PAD)
    return { x, y, valor: p.cercaniaObjetivo, fecha: p.fecha }
  })
})

const polylinePoints = computed(() => coords.value.map((c) => `${c.x},${c.y}`).join(' '))
</script>

<template>
  <div
    v-if="puntos.length === 0"
    class="text-sm text-[var(--color-ink)]/60"
  >
    Aún no hay datos de progreso (se completan al publicar un post-sesión).
  </div>
  <svg
    v-else
    :viewBox="`0 0 ${WIDTH} ${HEIGHT}`"
    class="w-full"
    role="img"
    aria-label="Línea de tiempo de progreso"
  >
    <polyline
      :points="polylinePoints"
      fill="none"
      stroke="var(--color-sage)"
      stroke-width="2"
    />
    <circle
      v-for="(c, i) in coords"
      :key="i"
      :cx="c.x"
      :cy="c.y"
      r="3"
      fill="var(--color-bronze)"
    >
      <title>{{ new Date(c.fecha).toLocaleDateString('es-CL') }}: {{ c.valor }}/10</title>
    </circle>
  </svg>
</template>
