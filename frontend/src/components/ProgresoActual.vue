<script setup lang="ts">
import { computed } from 'vue'
import { nivelProgreso, coloresNivel } from '../lib/nivelProgreso'
import { formatoDelta, textos, type Audiencia, type VariacionProgreso } from '../lib/progresoCamino'

// "Dónde estás hoy": aro con la nota 0-10, frase de nivel, de dónde sale el número y, si se
// conoce, cuánto cambió. Es la pieza que comparten el camino de crecimiento del coachee, el
// detalle del coach, el modal de la empresa y el resumen imprimible.
const props = withDefaults(defineProps<{
  /** Nota sobre 10 (la cercanía al objetivo de la última sesión). */
  valor: number
  /** ISO de la sesión evaluada; sin ella se usa un texto genérico. */
  fecha?: string | null
  cambio?: VariacionProgreso | null
  audiencia?: Audiencia
  /** Aro chico en horizontal (tarjetas, modales) en vez de columna centrada. */
  compacto?: boolean
}>(), { fecha: null, cambio: null, audiencia: 'propio', compacto: false })

const RADIO = 52
const CIRCUNFERENCIA = 2 * Math.PI * RADIO

const t = computed(() => textos(props.audiencia))
const nivel = computed(() => nivelProgreso(props.valor * 10))
const colores = computed(() => coloresNivel[nivel.value])
const arco = computed(() => (Math.max(0, Math.min(10, props.valor)) / 10) * CIRCUNFERENCIA)
const caption = computed(() =>
  props.fecha
    ? t.value.captionConFecha(new Date(props.fecha).toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' }))
    : t.value.captionSinFecha,
)
const tamano = computed(() => (props.compacto ? 84 : 136))
</script>

<template>
  <div
    class="flex"
    :class="compacto ? 'flex-row items-center gap-4 text-left' : 'flex-col items-center text-center'"
  >
    <svg
      :width="tamano"
      :height="tamano"
      viewBox="0 0 136 136"
      class="shrink-0"
      role="img"
      :aria-label="`Cercanía al objetivo: ${valor} de 10`"
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
      >{{ valor }}</text>
      <text
        x="68"
        y="92"
        text-anchor="middle"
        font-size="13"
        fill="var(--color-muted)"
      >de 10</text>
    </svg>

    <div class="min-w-0">
      <p
        class="font-[family-name:var(--font-heading)] font-semibold"
        :class="[colores.texto, compacto ? 'text-sm' : 'mt-3 text-base']"
      >
        {{ t.frase[nivel] }}
      </p>
      <p
        class="mt-1 text-[var(--color-muted)]"
        :class="compacto ? 'text-xs' : 'text-sm'"
      >
        {{ caption }}
      </p>

      <p
        v-if="cambio && cambio.respectoAnterior !== null"
        class="inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-medium"
        :class="[
          compacto ? 'mt-2 text-xs' : 'mt-3 text-sm',
          cambio.respectoAnterior > 0
            ? 'bg-[color-mix(in_srgb,var(--color-sage)_15%,white)] text-[var(--color-sage)]'
            : cambio.respectoAnterior < 0
              ? 'bg-[color-mix(in_srgb,var(--color-bronze)_15%,white)] text-[var(--color-bronze)]'
              : 'bg-[var(--color-parchment)] text-[var(--color-muted)]',
        ]"
      >
        <span aria-hidden="true">{{ cambio.respectoAnterior > 0 ? '▲' : cambio.respectoAnterior < 0 ? '▼' : '=' }}</span>
        <span v-if="cambio.respectoAnterior === 0">{{ t.igual }}</span>
        <span v-else>{{ formatoDelta(cambio.respectoAnterior) }} {{ t.anterior }}</span>
      </p>
      <p
        v-if="cambio && cambio.desdeInicio !== null"
        class="mt-2 text-[var(--color-muted)]"
        :class="compacto ? 'text-xs' : 'text-sm'"
      >
        {{ t.desdeInicio }}
        <strong class="font-semibold text-[var(--color-ink)]">{{ formatoDelta(cambio.desdeInicio) }}</strong>
      </p>
    </div>
  </div>
</template>
