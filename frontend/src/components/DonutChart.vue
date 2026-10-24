<script setup lang="ts">
import { computed } from 'vue'
import { VChart, ECHARTS_INIT_OPTIONS } from '../lib/echartsCore'
import { baseOption } from '../lib/echartsTheme'
import { escaparHtml } from '../lib/progresoCamino'

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

// Resumen textual para lectores de pantalla: el SVG de la dona no es legible para ellos.
const resumenAria = computed(() => {
  const detalle = props.segments.map((s) => `${s.label} ${s.count} (${s.pct}%)`).join(', ')
  return `Gráfico de dona, ${props.centerValue} ${props.centerLabel}. ${detalle}`
})

const option = computed(() => ({
  ...baseOption(),
  tooltip: { ...baseOption().tooltip, formatter: (p: { name: string; value: number; percent: number }) => `${escaparHtml(p.name)}: ${p.value} · ${p.percent}%` },
  series: [
    {
      type: 'pie',
      radius: ['70%', '100%'],
      avoidLabelOverlap: false,
      label: { show: false },
      emphasis: { scale: false },
      // Borde blanco entre segmentos: separa visualmente tonos parecidos (más de 4 segmentos).
      data: props.segments.map((s) => ({
        name: s.label,
        value: s.count,
        itemStyle: { color: s.color, borderColor: '#ffffff', borderWidth: 2 },
      })),
    },
  ],
}))
</script>

<template>
  <div class="flex flex-col items-center gap-4 sm:flex-row sm:gap-6">
    <!-- El tamaño va en este div contenedor, nunca en <VChart> (ver TendenciaChart.vue). -->
    <div
      role="img"
      :aria-label="resumenAria"
      class="relative h-36 w-36 shrink-0 sm:h-40 sm:w-40"
    >
      <VChart
        class="h-full w-full"
        :option="option"
        :init-options="ECHARTS_INIT_OPTIONS"
        autoresize
      />
      <!-- Texto central superpuesto — ECharts no tiene forma nativa limpia de centrar texto
           enriquecido (dos tamaños/pesos distintos) dentro de una dona. -->
      <div class="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span class="text-2xl font-semibold text-[var(--color-ink)]">{{ centerValue }}</span>
        <span class="text-xs text-[var(--color-muted)]">{{ centerLabel }}</span>
      </div>
    </div>
    <ul class="w-full min-w-0 flex-1 space-y-1.5 text-sm">
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
        <span
          class="truncate"
          :title="s.label"
        >{{ s.label }}</span>
        <span class="ml-auto shrink-0 cifra text-xs text-[var(--color-muted)]">
          {{ s.count }} · {{ s.pct }}%
        </span>
      </li>
    </ul>
  </div>
</template>
