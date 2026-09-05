<script setup lang="ts">
import { computed, ref } from 'vue'
import type { ProyeccionMes } from '../api/negocio'
import { VChart, ECHARTS_INIT_OPTIONS } from '../lib/echartsCore'
import { resolveColor, baseOption } from '../lib/echartsTheme'

const props = defineProps<{ meses: ProyeccionMes[] }>()

type Vista = 'coachee' | 'empresa'
const VISTAS: Vista[] = ['coachee', 'empresa']
const vistaLabel: Record<Vista, string> = { coachee: 'Coachee', empresa: 'Empresa' }

const vista = ref<Vista>('coachee')
const mesActivoIndex = ref(0)

const formatoCLP = new Intl.NumberFormat('es-CL', {
  style: 'currency',
  currency: 'CLP',
  maximumFractionDigits: 0,
})

const mesActivo = computed(() => props.meses[mesActivoIndex.value] ?? null)
const desgloseActivo = computed(() => {
  if (!mesActivo.value) return []
  return vista.value === 'coachee' ? mesActivo.value.porCoachee : mesActivo.value.porEmpresa
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
      axisLabel: { fontSize: 10 },
    },
    yAxis: { type: 'value', show: false },
    series: [
      {
        type: 'bar',
        data: props.meses.map((m) => m.total),
        barMaxWidth: 20,
        itemStyle: {
          color: (p: { dataIndex: number }) => (p.dataIndex === mesActivoIndex.value ? sage : sageClaro),
          borderRadius: [3, 3, 0, 0],
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
  <div class="rounded-2xl border border-[var(--color-line)] bg-white p-4">
    <div class="mb-3 flex flex-wrap items-center justify-between gap-3">
      <div>
        <h2 class="text-sm font-medium">
          Ingresos proyectados — 12 meses
        </h2>
        <p class="text-xs text-[var(--color-ink)]/50">
          Toca un mes para ver el monto exacto
        </p>
      </div>
      <div class="flex w-fit gap-1 rounded-full bg-[var(--color-parchment)] p-1">
        <button
          v-for="v in VISTAS"
          :key="v"
          type="button"
          class="rounded-full px-3 py-1 text-xs transition-colors"
          :class="vista === v ? 'bg-[var(--color-ink)] text-[var(--color-parchment)]' : 'text-[var(--color-ink)]/70'"
          @click="vista = v"
        >
          {{ vistaLabel[v] }}
        </button>
      </div>
    </div>

    <!-- Ver TendenciaChart.vue para por qué el tamaño va en este div y no en <VChart>. -->
    <div class="h-[110px] w-full">
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
        v-if="desgloseActivo.length === 0"
        class="mt-1 text-xs text-[var(--color-ink)]/50"
      >
        Sin actividad {{ vista === 'coachee' ? 'de coachees' : 'de empresas' }} este mes.
      </p>
      <ul
        v-else
        class="mt-2 space-y-1 text-xs"
      >
        <li
          v-for="c in desgloseActivo"
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
