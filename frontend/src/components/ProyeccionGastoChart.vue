<script setup lang="ts">
import { computed, ref } from 'vue'
import type { ProyeccionMesEmpresa } from '../api/negocio'
import { VChart, ECHARTS_INIT_OPTIONS } from '../lib/echartsCore'
import { resolveColor, baseOption } from '../lib/echartsTheme'

const props = defineProps<{ meses: ProyeccionMesEmpresa[] }>()

const mesActivoIndex = ref(0)
const mesActivo = computed(() => props.meses[mesActivoIndex.value] ?? null)

const formatoCLP = new Intl.NumberFormat('es-CL', {
  style: 'currency',
  currency: 'CLP',
  maximumFractionDigits: 0,
})

const option = computed(() => {
  const sage = resolveColor('--color-sage')
  const sageClaro = `color-mix(in srgb, ${sage} 45%, white)`
  return {
    ...baseOption(),
    xAxis: {
      type: 'category',
      data: props.meses.map((m) => m.etiqueta),
      axisLine: { show: false },
      axisTick: { show: false },
    },
    yAxis: { type: 'value', show: false },
    series: [
      {
        type: 'bar',
        data: props.meses.map((m) => m.total),
        barMaxWidth: 24,
        itemStyle: {
          color: (p: { dataIndex: number }) => (p.dataIndex === mesActivoIndex.value ? sage : sageClaro),
          borderRadius: [4, 4, 0, 0],
        },
      },
    ],
  }
})

function onClick(params: { dataIndex: number }) {
  mesActivoIndex.value = params.dataIndex
}
</script>

<template>
  <div>
    <p class="mb-3 text-xs text-[var(--color-ink)]/50">
      Toca un mes para ver el detalle por coachee
    </p>

    <!-- Ver TendenciaChart.vue para por qué el tamaño va en este div y no en <VChart>. -->
    <div class="h-28 w-full">
      <VChart
        class="h-full w-full"
        :option="option"
        :init-options="ECHARTS_INIT_OPTIONS"
        autoresize
        @click="onClick"
      />
    </div>

    <div
      v-if="mesActivo"
      class="mt-3 border-t border-[var(--color-line)] pt-3"
    >
      <div class="flex items-baseline justify-between">
        <p class="text-sm font-medium">
          {{ mesActivo.etiqueta }}
        </p>
        <p class="font-[family-name:var(--font-mono)] text-xl text-[var(--color-sage)]">
          {{ formatoCLP.format(mesActivo.total) }}
        </p>
      </div>
      <p
        v-if="mesActivo.porCoachee.length === 0"
        class="mt-1 text-xs text-[var(--color-ink)]/50"
      >
        Sin actividad este mes.
      </p>
      <ul
        v-else
        class="mt-2 space-y-1 text-xs"
      >
        <li
          v-for="c in mesActivo.porCoachee"
          :key="c.nombre"
          class="flex items-center justify-between gap-3"
        >
          <span class="text-[var(--color-ink)]/70">{{ c.nombre }}</span>
          <span class="font-[family-name:var(--font-mono)]">{{ formatoCLP.format(c.monto) }}</span>
        </li>
      </ul>
    </div>
  </div>
</template>
