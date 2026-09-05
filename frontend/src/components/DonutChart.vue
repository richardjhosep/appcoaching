<script setup lang="ts">
import { computed } from 'vue'
import { VChart, ECHARTS_INIT_OPTIONS } from '../lib/echartsCore'
import { baseOption } from '../lib/echartsTheme'

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

const option = computed(() => ({
  ...baseOption(),
  tooltip: { ...baseOption().tooltip, formatter: (p: { name: string; value: number; percent: number }) => `${p.name}: ${p.value} · ${p.percent}%` },
  series: [
    {
      type: 'pie',
      radius: ['70%', '100%'],
      avoidLabelOverlap: false,
      label: { show: false },
      emphasis: { scale: false },
      data: props.segments.map((s) => ({ name: s.label, value: s.count, itemStyle: { color: s.color } })),
    },
  ],
}))
</script>

<template>
  <div class="flex items-center gap-6">
    <div class="relative h-[120px] w-[120px] shrink-0">
      <VChart
        class="h-full w-full"
        :option="option"
        :init-options="ECHARTS_INIT_OPTIONS"
        autoresize
      />
      <!-- Texto central superpuesto — ECharts no tiene forma nativa limpia de centrar texto
           enriquecido (dos tamaños/pesos distintos) dentro de una dona. -->
      <div class="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span class="text-xl font-semibold text-[var(--color-ink)]">{{ centerValue }}</span>
        <span class="text-[9px] text-[var(--color-ink)]/60">{{ centerLabel }}</span>
      </div>
    </div>
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
