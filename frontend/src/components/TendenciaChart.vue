<script setup lang="ts">
import { computed } from 'vue'
import type { PuntoTendencia } from '../api/satisfaccion'
import { VChart, ECHARTS_INIT_OPTIONS } from '../lib/echartsCore'
import { resolveColor, baseOption } from '../lib/echartsTheme'

const props = defineProps<{ puntos: PuntoTendencia[] }>()

interface Fila {
  label: string
  colorVar: string
  escala: number
  sufijo: string
  valores: Array<{ etiqueta: string; valor: number }>
}

type Metrica = 'satisfaccionPromedio' | 'pctLogrado' | 'tasaAsistencia'

function serie(metrica: Metrica): Array<{ etiqueta: string; valor: number }> {
  // Solo los meses que SÍ tienen dato — un mes vacío no aparece como columna en cero, que se
  // leería como "mal resultado" en vez de "no hubo actividad ese mes".
  return props.puntos
    .filter((p) => p[metrica] !== null)
    .map((p) => ({ etiqueta: p.etiqueta, valor: p[metrica] as number }))
}

const filas = computed<Fila[]>(() => [
  { label: 'Satisfacción', colorVar: '--color-spark', escala: 5, sufijo: '/5', valores: serie('satisfaccionPromedio') },
  { label: 'Procesos logrados', colorVar: '--color-sage', escala: 100, sufijo: '%', valores: serie('pctLogrado') },
  { label: 'Asistencia', colorVar: '--color-bronze', escala: 100, sufijo: '%', valores: serie('tasaAsistencia') },
])

function optionDe(fila: Fila) {
  const color = resolveColor(fila.colorVar)
  const ink = resolveColor('--color-ink')
  return {
    ...baseOption(),
    xAxis: {
      type: 'category',
      data: fila.valores.map((v) => v.etiqueta),
      axisLine: { show: false },
      axisTick: { show: false },
    },
    yAxis: { type: 'value', max: fila.escala, show: false },
    series: [
      {
        type: 'bar',
        data: fila.valores.map((v) => v.valor),
        itemStyle: { color, borderRadius: [4, 4, 0, 0] },
        barMaxWidth: 36,
        label: {
          show: true,
          position: 'top',
          color: ink,
          formatter: (p: { value: number }) => `${p.value}${fila.sufijo}`,
        },
      },
    ],
  }
}
</script>

<template>
  <div class="grid gap-4 sm:grid-cols-3">
    <div
      v-for="fila in filas"
      :key="fila.label"
      class="rounded-xl border border-[var(--color-line)] bg-white p-3"
    >
      <p class="mb-1 text-xs text-[var(--color-ink)]/60">
        {{ fila.label }}
      </p>
      <p
        v-if="fila.valores.length === 0"
        class="flex h-28 items-center justify-center text-sm text-[var(--color-ink)]/40"
      >
        Sin datos todavía
      </p>
      <!-- vue-echarts inyecta `x-vue-echarts{height:100%}` sin cascade layer, así que gana por
           encima de cualquier utilidad de Tailwind (que sí vive en una layer) puesta
           directamente en <VChart> — el tamaño real se define en este div contenedor, nunca
           en el propio VChart (que solo recibe h-full/w-full, igual de todas formas). -->
      <div
        v-else
        class="h-28 w-full"
      >
        <VChart
          class="h-full w-full"
          :option="optionDe(fila)"
          :init-options="ECHARTS_INIT_OPTIONS"
          autoresize
        />
      </div>
    </div>
  </div>
</template>
