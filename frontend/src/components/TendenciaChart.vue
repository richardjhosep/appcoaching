<script setup lang="ts">
import { computed } from 'vue'
import type { PuntoTendencia } from '../api/satisfaccion'
import { VChart, ECHARTS_INIT_OPTIONS } from '../lib/echartsCore'
import { resolveColor, baseOption } from '../lib/echartsTheme'

const props = defineProps<{ puntos: PuntoTendencia[] }>()

interface Fila {
  label: string
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
  { label: 'Satisfacción', escala: 5, sufijo: '/5', valores: serie('satisfaccionPromedio') },
  { label: 'Procesos logrados', escala: 100, sufijo: '%', valores: serie('pctLogrado') },
  { label: 'Asistencia', escala: 100, sufijo: '%', valores: serie('tasaAsistencia') },
])

// Resumen para lectores de pantalla (el SVG del gráfico no les sirve).
function resumenAria(fila: Fila): string {
  return `${fila.label}: ${fila.valores.map((v) => `${v.etiqueta} ${v.valor}${fila.sufijo}`).join(', ')}`
}

function optionDe(fila: Fila) {
  // Un mismo neutro (ink) para las 3 series: cada tarjeta ya se identifica por su título, y
  // sage/bronze/spark significan "bien/atención/logro" en el resto de la app — usarlos acá
  // como color de serie sugeriría un estado que el dato no tiene.
  const ink = resolveColor('--color-ink')
  const color = `color-mix(in srgb, ${ink} 78%, white)`
  return {
    ...baseOption(),
    xAxis: {
      type: 'category',
      data: fila.valores.map((v) => v.etiqueta),
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { fontSize: 12, color: ink },
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
          fontSize: 12,
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
      <p class="mb-1 text-xs text-[var(--color-muted)]">
        {{ fila.label }}
      </p>
      <p
        v-if="fila.valores.length === 0"
        class="flex h-28 items-center justify-center text-sm text-[var(--color-subtle)]"
      >
        Sin datos todavía
      </p>
      <!-- vue-echarts inyecta `x-vue-echarts{height:100%}` sin cascade layer, así que gana por
           encima de cualquier utilidad de Tailwind (que sí vive en una layer) puesta
           directamente en <VChart> — el tamaño real se define en este div contenedor, nunca
           en el propio VChart (que solo recibe h-full/w-full, igual de todas formas). -->
      <div
        v-else
        role="img"
        :aria-label="resumenAria(fila)"
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
