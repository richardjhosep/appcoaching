<script setup lang="ts">
import { computed, ref } from 'vue'
import type { PuntoProgreso } from '../api/seguimiento'
import { coloresNivel } from '../lib/nivelProgreso'
import {
  escaparHtml,
  fechaCorta,
  fechaLarga,
  nivelDePunto,
  ordenarPorFecha,
  resumenAccesible,
  textos,
  variacion,
  type Audiencia,
} from '../lib/progresoCamino'
import { VChart, ECHARTS_INIT_OPTIONS } from '../lib/echartsCore'
import { resolveColor, baseOption } from '../lib/echartsTheme'
import EscalaProgreso from './EscalaProgreso.vue'
import ProgresoActual from './ProgresoActual.vue'

// "Camino de crecimiento": una sola lectura en vez de tres vistas del mismo número.
//  1) Dónde está HOY (aro + frase + cambio respecto a la sesión anterior).
//  2) Cómo ha evolucionado (gráfico 0-10 con la línea de Objetivo; con una sola sesión no se
//     dibuja un punto suelto: se muestra el punto de partida sobre la escala).
//  3) El detalle sesión a sesión (qué aprendió y qué nota se puso).
// `audiencia` cambia el texto ("tu" / "su") para el coach; `compacto` es el resumen de Mi
// Aprendizaje (aro chico + gráfico bajo, sin historial).
const props = withDefaults(defineProps<{
  puntos: PuntoProgreso[]
  audiencia?: Audiencia
  compacto?: boolean
}>(), { audiencia: 'propio', compacto: false })

const VISIBLES = 3

const t = computed(() => textos(props.audiencia))
const ascendente = computed(() => ordenarPorFecha(props.puntos))
const historial = computed(() => [...ascendente.value].reverse())
const ultimo = computed(() => ascendente.value[ascendente.value.length - 1] ?? null)
const cambio = computed(() => variacion(props.puntos))
const aria = computed(() => resumenAccesible(props.puntos, props.audiencia))

const verTodas = ref(false)
const historialVisible = computed(() => (verTodas.value ? historial.value : historial.value.slice(0, VISIBLES)))

const option = computed(() => {
  const asc = ascendente.value
  const sage = resolveColor('--color-sage')
  const line = resolveColor('--color-line')
  const muted = resolveColor('--color-muted')
  return {
    ...baseOption(),
    grid: { left: 8, right: 72, top: 28, bottom: 8, containLabel: true },
    xAxis: {
      type: 'category' as const,
      data: asc.map((p) => fechaCorta(p.fecha)),
      boundaryGap: false,
      axisLine: { lineStyle: { color: line } },
      axisTick: { show: false },
      axisLabel: { color: muted, fontSize: 12 },
    },
    yAxis: {
      type: 'value' as const,
      min: 0,
      max: 10,
      interval: 2,
      axisLabel: { color: muted, fontSize: 12 },
      splitLine: { lineStyle: { color: line } },
    },
    tooltip: {
      ...baseOption().tooltip,
      trigger: 'axis' as const,
      formatter: (params: Array<{ dataIndex: number }>) => {
        const p = asc[params[0]!.dataIndex]!
        const aprendizaje = p.aprendizaje ? `<br/>${escaparHtml(p.aprendizaje)}` : ''
        return `<strong>${fechaLarga(p.fecha)}</strong><br/>Cercanía al objetivo: ${p.cercaniaObjetivo}/10${aprendizaje}`
      },
    },
    series: [
      {
        name: 'Cercanía',
        type: 'line' as const,
        data: asc.map((p) => p.cercaniaObjetivo),
        smooth: 0.25,
        symbol: 'circle',
        symbolSize: 12,
        lineStyle: { color: sage, width: 3 },
        itemStyle: {
          borderColor: '#ffffff',
          borderWidth: 2,
          color: (p: { dataIndex: number }) => coloresNivel[nivelDePunto(asc[p.dataIndex]!)].fuerte,
        },
        label: { show: true, position: 'top' as const, fontSize: 12, fontWeight: 600, color: resolveColor('--color-ink') },
        areaStyle: { color: `color-mix(in srgb, ${sage} 12%, white)` },
        z: 3,
      },
      {
        name: 'Objetivo',
        type: 'line' as const,
        data: asc.map(() => 10),
        symbol: 'none',
        silent: true,
        lineStyle: { color: muted, width: 1.5, type: 'dashed' as const },
        endLabel: { show: true, formatter: 'Objetivo', color: muted, fontSize: 12, distance: 6 },
        z: 1,
      },
    ],
  }
})
</script>

<template>
  <div
    v-if="ultimo"
    :class="compacto ? 'space-y-3' : 'space-y-6'"
  >
    <div
      class="grid"
      :class="compacto ? 'gap-1' : 'gap-6 lg:grid-cols-[17rem_1fr]'"
    >
      <!-- 1) Dónde está hoy -->
      <ProgresoActual
        :valor="ultimo.cercaniaObjetivo"
        :fecha="ultimo.fecha"
        :cambio="cambio"
        :audiencia="audiencia"
        :compacto="compacto"
      />

      <!-- 2) Cómo ha evolucionado -->
      <div class="min-w-0">
        <h3
          v-if="!compacto"
          class="mb-2 text-sm font-medium text-[var(--color-ink)]"
        >
          {{ audiencia === 'propio' ? 'Tu evolución' : 'Evolución' }}
        </h3>

        <div
          v-if="ascendente.length >= 2"
          role="img"
          :aria-label="aria"
          class="w-full"
          :class="compacto ? 'h-40' : 'h-56 sm:h-64'"
        >
          <!-- El tamaño va en este div, no en <VChart> (ver TendenciaChart.vue). -->
          <VChart
            class="h-full w-full"
            :option="option"
            :init-options="ECHARTS_INIT_OPTIONS"
            autoresize
          />
        </div>

        <p
          v-else-if="compacto"
          class="text-xs text-[var(--color-muted)]"
        >
          {{ t.partidaAyuda }}
        </p>

        <div
          v-else
          class="flex min-h-48 flex-col justify-center gap-4 rounded-2xl border border-dashed border-[var(--color-line)] bg-[var(--color-parchment)]/30 p-5"
        >
          <p class="font-[family-name:var(--font-heading)] text-sm font-semibold text-[var(--color-ink)]">
            {{ t.partida }}
          </p>
          <EscalaProgreso :valor="ultimo.cercaniaObjetivo" />
          <p class="text-sm text-[var(--color-muted)]">
            {{ t.partidaAyuda }}
          </p>
        </div>
      </div>
    </div>

    <!-- 3) Detalle sesión a sesión -->
    <div
      v-if="!compacto"
      class="border-t border-[var(--color-line)] pt-4"
    >
      <div class="mb-2 flex items-center justify-between gap-3">
        <h3 class="text-sm font-medium text-[var(--color-ink)]">
          Sesión a sesión
        </h3>
        <button
          v-if="historial.length > VISIBLES"
          type="button"
          class="text-sm font-medium text-[var(--color-saltup-ink)] hover:underline"
          :aria-expanded="verTodas"
          @click="verTodas = !verTodas"
        >
          {{ verTodas ? 'Ver menos' : `Ver todas (${historial.length})` }}
        </button>
      </div>
      <ul class="divide-y divide-[var(--color-line)]/70">
        <li
          v-for="p in historialVisible"
          :key="p.sesionId"
          class="flex items-start gap-3 py-3"
        >
          <div
            class="flex h-10 min-w-12 shrink-0 flex-col items-center justify-center rounded-lg px-2"
            :style="{ backgroundColor: coloresNivel[nivelDePunto(p)].suave }"
          >
            <span
              class="cifra text-base font-semibold leading-none"
              :class="coloresNivel[nivelDePunto(p)].texto"
            >{{ p.cercaniaObjetivo }}<span class="text-xs font-normal">/10</span></span>
          </div>
          <div class="min-w-0 flex-1">
            <p class="text-xs font-medium text-[var(--color-muted)]">
              {{ fechaLarga(p.fecha) }}
            </p>
            <p
              v-if="p.aprendizaje"
              class="mt-0.5 line-clamp-2 text-sm text-[var(--color-ink)]"
              :title="p.aprendizaje"
            >
              {{ p.aprendizaje }}
            </p>
            <p
              v-else
              class="mt-0.5 text-sm text-[var(--color-subtle)]"
            >
              Sin aprendizaje registrado.
            </p>
          </div>
        </li>
      </ul>
    </div>
  </div>
  <p
    v-else
    class="text-sm text-[var(--color-muted)]"
  >
    {{ t.vacio }}
  </p>
</template>
