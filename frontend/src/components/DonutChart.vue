<script setup lang="ts">
import { computed } from 'vue'

export interface DonutSegment {
  label: string
  count: number
  pct: number
  color: string
}

const props = defineProps<{
  segments: DonutSegment[]
  centerValue: string | number
  centerLabel: string
}>()

// r=45 → circunferencia ≈ 282.74. Cada segmento es un <circle> con el mismo radio,
// recortado con stroke-dasharray a su porción y desplazado con stroke-dashoffset
// según lo que ya "llevan" los segmentos anteriores — la técnica estándar para donuts
// sin librería de gráficos (mismo criterio "SVG inline" que MapaCanvas/ProgresoLineaTiempo).
const CIRCUNFERENCIA = 2 * Math.PI * 45

const arcos = computed(() => {
  let acumulado = 0
  return props.segments.map((s) => {
    const largo = (s.pct / 100) * CIRCUNFERENCIA
    const arco = {
      ...s,
      dasharray: `${largo} ${CIRCUNFERENCIA - largo}`,
      dashoffset: -acumulado,
    }
    acumulado += largo
    return arco
  })
})
</script>

<template>
  <div class="flex items-center gap-6">
    <svg
      viewBox="0 0 120 120"
      width="120"
      height="120"
      class="shrink-0 -rotate-90"
    >
      <circle
        cx="60"
        cy="60"
        r="45"
        fill="none"
        stroke="var(--color-line)"
        stroke-width="18"
      />
      <circle
        v-for="arco in arcos"
        :key="arco.label"
        cx="60"
        cy="60"
        r="45"
        fill="none"
        :stroke="arco.color"
        stroke-width="18"
        :stroke-dasharray="arco.dasharray"
        :stroke-dashoffset="arco.dashoffset"
      />
      <text
        x="60"
        y="56"
        text-anchor="middle"
        class="rotate-90"
        style="transform-origin: 60px 60px"
        font-size="22"
        font-weight="600"
        fill="var(--color-ink)"
      >
        {{ centerValue }}
      </text>
      <text
        x="60"
        y="72"
        text-anchor="middle"
        class="rotate-90"
        style="transform-origin: 60px 60px"
        font-size="9"
        fill="var(--color-ink)"
        fill-opacity="0.6"
      >
        {{ centerLabel }}
      </text>
    </svg>
    <ul class="min-w-0 flex-1 space-y-1.5 text-sm">
      <li
        v-for="s in segments"
        :key="s.label"
        class="flex items-center gap-2"
      >
        <span
          class="h-2.5 w-2.5 shrink-0 rounded-full"
          :style="{ backgroundColor: s.color }"
          aria-hidden="true"
        />
        <span class="truncate">{{ s.label }}</span>
        <span class="ml-auto shrink-0 font-[family-name:var(--font-mono)] text-xs text-[var(--color-ink)]/60">
          {{ s.count }} · {{ s.pct }}%
        </span>
      </li>
    </ul>
  </div>
</template>
