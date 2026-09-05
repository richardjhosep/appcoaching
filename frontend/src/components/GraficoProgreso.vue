<script setup lang="ts">
import { computed } from 'vue'
import type { PuntoProgreso } from '../api/seguimiento'
import { nivelProgreso, coloresNivel } from '../lib/nivelProgreso'
import { VChart, ECHARTS_INIT_OPTIONS } from '../lib/echartsCore'
import { resolveColor, baseOption } from '../lib/echartsTheme'

const props = defineProps<{
  puntos: PuntoProgreso[]
  avance: number | null
}>()

const ordenados = computed(() =>
  [...props.puntos].sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime()),
)

function formatoFecha(iso: string): string {
  return new Date(iso).toLocaleDateString('es-CL', { day: 'numeric', month: 'short' })
}

const option = computed(() => {
  const sage = resolveColor('--color-sage')
  return {
    ...baseOption(),
    xAxis: {
      type: 'category',
      data: ordenados.value.map((p) => formatoFecha(p.fecha)),
      axisLine: { lineStyle: { color: resolveColor('--color-line') } },
    },
    yAxis: {
      type: 'value',
      min: 0,
      max: 100,
      axisLabel: { formatter: '{value}%' },
      splitLine: { lineStyle: { color: resolveColor('--color-line') } },
    },
    tooltip: {
      ...baseOption().tooltip,
      trigger: 'axis' as const,
      formatter: (params: Array<{ dataIndex: number; value: number }>) => {
        const p = ordenados.value[params[0]!.dataIndex]!
        return `${formatoFecha(p.fecha)}: ${params[0]!.value}%${p.aprendizaje ? `<br/>${p.aprendizaje}` : ''}`
      },
    },
    series: [
      {
        type: 'line',
        data: ordenados.value.map((p) => p.cercaniaObjetivo * 10),
        smooth: true,
        symbolSize: 7,
        lineStyle: { color: sage, width: 2 },
        itemStyle: {
          color: (p: { dataIndex: number }) => {
            const punto = ordenados.value[p.dataIndex]!
            return coloresNivel[nivelProgreso(punto.cercaniaObjetivo * 10)].fuerte
          },
        },
        areaStyle: { color: `color-mix(in srgb, ${sage} 16%, white)` },
      },
    ],
  }
})
</script>

<template>
  <div>
    <!-- Ver TendenciaChart.vue para por qué el tamaño va en este div y no en <VChart>. -->
    <div
      v-if="puntos.length > 0"
      class="aspect-[10/3] w-full"
    >
      <VChart
        class="h-full w-full"
        :option="option"
        :init-options="ECHARTS_INIT_OPTIONS"
        autoresize
      />
    </div>
    <p
      v-else
      class="flex aspect-[10/3] items-center justify-center text-center text-xs text-[var(--color-ink)]/45"
    >
      Tu progreso empieza en tu próxima sesión
    </p>

    <div
      v-if="avance !== null"
      class="mt-2 flex items-center justify-between text-sm"
    >
      <span class="text-[var(--color-ink)]/60">Avance general</span>
      <span
        class="font-[family-name:var(--font-mono)] font-semibold"
        :class="coloresNivel[nivelProgreso(avance)].texto"
      >{{ avance }}%</span>
    </div>
  </div>
</template>
