<script setup lang="ts">
import { computed, ref } from 'vue'
import type { PuntoProgreso } from '../api/seguimiento'
import { coloresNivel } from '../lib/nivelProgreso'
import {
  FRASE_NIVEL,
  escaparHtml,
  formatoDelta,
  nivelDePunto,
  ordenarPorFecha,
  resumenAccesible,
  variacion,
} from '../lib/progresoCamino'
import { VChart, ECHARTS_INIT_OPTIONS } from '../lib/echartsCore'
import { resolveColor, baseOption } from '../lib/echartsTheme'
import EscalaProgreso from './EscalaProgreso.vue'

// "Tu camino de crecimiento": una sola lectura en vez de tres vistas del mismo número.
//  1) Dónde estás HOY (aro grande + frase + cambio respecto a la sesión anterior).
//  2) Cómo has evolucionado (gráfico 0-10 con la línea de Objetivo; con una sola sesión no se
//     dibuja un punto suelto: se muestra el punto de partida sobre la escala).
//  3) El detalle sesión a sesión (qué aprendiste y qué nota te pusiste).
const props = defineProps<{ puntos: PuntoProgreso[] }>()

const RADIO = 52
const CIRCUNFERENCIA = 2 * Math.PI * RADIO
const VISIBLES = 3

const ascendente = computed(() => ordenarPorFecha(props.puntos))
const historial = computed(() => [...ascendente.value].reverse())
const ultimo = computed(() => ascendente.value[ascendente.value.length - 1] ?? null)
const nivel = computed(() => (ultimo.value ? nivelDePunto(ultimo.value) : 'bajo'))
const colores = computed(() => coloresNivel[nivel.value])
const arco = computed(() => ((ultimo.value?.cercaniaObjetivo ?? 0) / 10) * CIRCUNFERENCIA)
const cambio = computed(() => variacion(props.puntos))
const aria = computed(() => resumenAccesible(props.puntos))

const verTodas = ref(false)
const historialVisible = computed(() => (verTodas.value ? historial.value : historial.value.slice(0, VISIBLES)))

function fechaCorta(iso: string): string {
  return new Date(iso).toLocaleDateString('es-CL', { day: 'numeric', month: 'short' })
}
function fechaLarga(iso: string): string {
  return new Date(iso).toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' })
}

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
        name: 'Tu cercanía',
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
    class="space-y-6"
  >
    <div class="grid gap-6 lg:grid-cols-[17rem_1fr]">
      <!-- 1) Dónde estás hoy -->
      <div class="flex flex-col items-center text-center">
        <svg
          width="136"
          height="136"
          viewBox="0 0 136 136"
          role="img"
          :aria-label="`Cercanía al objetivo: ${ultimo.cercaniaObjetivo} de 10`"
        >
          <g transform="rotate(-90 68 68)">
            <circle
              cx="68"
              cy="68"
              :r="RADIO"
              fill="none"
              :stroke="colores.suave"
              stroke-width="11"
            />
            <circle
              cx="68"
              cy="68"
              :r="RADIO"
              fill="none"
              :stroke="colores.fuerte"
              stroke-width="11"
              stroke-linecap="round"
              :stroke-dasharray="`${arco} ${CIRCUNFERENCIA}`"
            />
          </g>
          <text
            x="68"
            y="64"
            text-anchor="middle"
            dominant-baseline="middle"
            font-size="40"
            font-weight="700"
            fill="var(--color-ink)"
          >{{ ultimo.cercaniaObjetivo }}</text>
          <text
            x="68"
            y="92"
            text-anchor="middle"
            font-size="13"
            fill="var(--color-muted)"
          >de 10</text>
        </svg>

        <p
          class="mt-3 font-[family-name:var(--font-heading)] text-base font-semibold"
          :class="colores.texto"
        >
          {{ FRASE_NIVEL[nivel] }}
        </p>
        <p class="mt-1 text-sm text-[var(--color-muted)]">
          Tu autoevaluación al cerrar la sesión del {{ fechaLarga(ultimo.fecha) }}.
        </p>

        <p
          v-if="cambio.respectoAnterior !== null"
          class="mt-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium"
          :class="cambio.respectoAnterior > 0
            ? 'bg-[color-mix(in_srgb,var(--color-sage)_15%,white)] text-[var(--color-sage)]'
            : cambio.respectoAnterior < 0
              ? 'bg-[color-mix(in_srgb,var(--color-bronze)_15%,white)] text-[var(--color-bronze)]'
              : 'bg-[var(--color-parchment)] text-[var(--color-muted)]'"
        >
          <span aria-hidden="true">{{ cambio.respectoAnterior > 0 ? '▲' : cambio.respectoAnterior < 0 ? '▼' : '=' }}</span>
          <span v-if="cambio.respectoAnterior === 0">Igual que en tu sesión anterior</span>
          <span v-else>{{ formatoDelta(cambio.respectoAnterior) }} respecto a tu sesión anterior</span>
        </p>
        <p
          v-if="cambio.desdeInicio !== null"
          class="mt-2 text-sm text-[var(--color-muted)]"
        >
          Desde tu primera sesión:
          <strong class="font-semibold text-[var(--color-ink)]">{{ formatoDelta(cambio.desdeInicio) }}</strong>
        </p>
      </div>

      <!-- 2) Cómo has evolucionado -->
      <div class="min-w-0">
        <h3 class="mb-2 text-sm font-medium text-[var(--color-ink)]">
          Tu evolución
        </h3>

        <div
          v-if="ascendente.length >= 2"
          role="img"
          :aria-label="aria"
          class="h-56 w-full sm:h-64"
        >
          <!-- El tamaño va en este div, no en <VChart> (ver TendenciaChart.vue). -->
          <VChart
            class="h-full w-full"
            :option="option"
            :init-options="ECHARTS_INIT_OPTIONS"
            autoresize
          />
        </div>

        <div
          v-else
          class="flex min-h-48 flex-col justify-center gap-4 rounded-2xl border border-dashed border-[var(--color-line)] bg-[var(--color-parchment)]/30 p-5"
        >
          <p class="font-[family-name:var(--font-heading)] text-sm font-semibold text-[var(--color-ink)]">
            Este es tu punto de partida
          </p>
          <EscalaProgreso :valor="ultimo.cercaniaObjetivo" />
          <p class="text-sm text-[var(--color-muted)]">
            Con tu próxima sesión empezaremos a dibujar tu evolución y podrás ver cuánto avanzas.
          </p>
        </div>
      </div>
    </div>

    <!-- 3) Detalle sesión a sesión -->
    <div class="border-t border-[var(--color-line)] pt-4">
      <div class="mb-2 flex items-center justify-between gap-3">
        <h3 class="text-sm font-medium text-[var(--color-ink)]">
          Sesión a sesión
        </h3>
        <button
          v-if="historial.length > VISIBLES"
          type="button"
          class="text-sm font-medium text-[var(--color-saltup)] hover:underline"
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
              class="font-[family-name:var(--font-mono)] text-base font-semibold leading-none"
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
    Tu progreso empieza en tu próxima sesión: al publicar tu post-sesión verás aquí cómo avanzas.
  </p>
</template>
