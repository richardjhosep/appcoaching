<script setup lang="ts">
import { computed } from 'vue'
import type { PuntoProgreso } from '../api/seguimiento'
import { nivelProgreso, coloresNivel } from '../lib/nivelProgreso'

const props = defineProps<{ puntos: PuntoProgreso[] }>()

const RADIO = 22
const CIRCUNFERENCIA = 2 * Math.PI * RADIO

const entradas = computed(() =>
  [...props.puntos]
    .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
    .map((p) => {
      const colores = coloresNivel[nivelProgreso(p.cercaniaObjetivo * 10)]
      return {
        ...p,
        colores,
        arcoLength: (p.cercaniaObjetivo / 10) * CIRCUNFERENCIA,
      }
    }),
)
</script>

<template>
  <div
    v-if="puntos.length === 0"
    class="text-sm text-[var(--color-ink)]/60"
  >
    Aún no hay datos de progreso (se completan al publicar un post-sesión).
  </div>
  <ul
    v-else
    class="space-y-3"
  >
    <li
      v-for="entrada in entradas"
      :key="entrada.sesionId"
      class="flex items-center gap-4 rounded-xl border border-[var(--color-line)]/60 bg-[var(--color-parchment)]/40 p-3"
    >
      <div class="flex shrink-0 flex-col items-center gap-1">
        <svg
          width="56"
          height="56"
          viewBox="0 0 56 56"
          class="-rotate-90"
          role="img"
          :aria-label="`Cercanía al objetivo: ${entrada.cercaniaObjetivo} de 10`"
        >
          <circle
            cx="28"
            cy="28"
            :r="RADIO"
            fill="none"
            :stroke="entrada.colores.suave"
            stroke-width="6"
          />
          <circle
            cx="28"
            cy="28"
            :r="RADIO"
            fill="none"
            :stroke="entrada.colores.fuerte"
            stroke-width="6"
            stroke-linecap="round"
            :stroke-dasharray="`${entrada.arcoLength} ${CIRCUNFERENCIA}`"
          />
          <text
            x="28"
            y="28"
            text-anchor="middle"
            dominant-baseline="middle"
            transform="rotate(90 28 28)"
            font-size="15"
            font-weight="700"
            fill="var(--color-ink)"
          >{{ entrada.cercaniaObjetivo }}</text>
        </svg>
        <span
          class="rounded-full px-2 py-0.5 text-[9px] font-semibold"
          :class="entrada.colores.texto"
          :style="{ backgroundColor: entrada.colores.suave }"
        >Puntaje {{ entrada.cercaniaObjetivo }}/10</span>
      </div>
      <div class="min-w-0 flex-1">
        <p
          class="text-xs font-medium"
          :class="entrada.colores.texto"
        >
          {{ new Date(entrada.fecha).toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' }) }}
        </p>
        <p
          v-if="entrada.aprendizaje"
          class="mt-0.5 truncate text-sm text-[var(--color-ink)]/70"
          :title="entrada.aprendizaje"
        >
          {{ entrada.aprendizaje }}
        </p>
      </div>
    </li>
  </ul>
</template>
