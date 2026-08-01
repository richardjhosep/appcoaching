<script setup lang="ts">
import { computed } from 'vue'
import type { Ciclo } from '../api/ciclos'
import type { PlanDesarrollo } from '../api/planesDesarrollo'

const props = defineProps<{
  ciclo: Ciclo | null
  plan: PlanDesarrollo | null
}>()

type EstadoEtapa = 'done' | 'current' | 'pending'
interface Etapa {
  label: string
  estado: EstadoEtapa
}

const etapas = computed<Etapa[]>(() => {
  const ciclo = props.ciclo
  if (!ciclo) return []
  // Un coachee nuevo puede no tener fila en planes_desarrollo todavía (nunca lo tocó) —
  // equivale a estado 'sin_enviar', no a "sin datos".
  const estadoPlan = props.plan?.estado ?? 'sin_enviar'

  const sesionesListas = ciclo.totalSesiones > 0 && ciclo.sesionesRealizadas >= ciclo.totalSesiones

  const done = [
    true,
    estadoPlan !== 'sin_enviar',
    estadoPlan === 'aprobado',
    sesionesListas,
    !!ciclo.informeFinal?.trim(),
    !!ciclo.fechaCierre,
  ]
  const labels = [
    'Ciclo abierto',
    'Plan enviado',
    'Plan aprobado',
    `Sesiones (${ciclo.sesionesRealizadas}/${ciclo.totalSesiones})`,
    'Informe final',
    'Cierre',
  ]

  // Waterfall estricto: una etapa solo puede verse "done" si todas las anteriores
  // también lo están. Por ejemplo, el informe final se puede redactar como borrador
  // antes de que terminen las sesiones — eso no debe mostrarse como si el ciclo
  // hubiera saltado la etapa de sesiones.
  const primeraPendiente = done.findIndex((d) => !d)
  return labels.map((label, i) => {
    if (primeraPendiente === -1 || i < primeraPendiente) return { label, estado: 'done' as const }
    if (i === primeraPendiente) return { label, estado: 'current' as const }
    return { label, estado: 'pending' as const }
  })
})

const completadas = computed(() => etapas.value.filter((e) => e.estado === 'done').length)
const porcentaje = computed(() =>
  etapas.value.length ? Math.round((completadas.value / etapas.value.length) * 100) : 0,
)

const circleClass: Record<EstadoEtapa, string> = {
  done: 'bg-[var(--color-sage)] text-white',
  current: 'bg-[var(--color-bronze)] text-white',
  pending: 'bg-[var(--color-parchment)] text-[var(--color-ink)]/40 border border-[var(--color-line)]',
}
const labelClass: Record<EstadoEtapa, string> = {
  done: 'text-[var(--color-sage)]',
  current: 'text-[var(--color-bronze)] font-medium',
  pending: 'text-[var(--color-ink)]/40',
}
const lineClass: Record<EstadoEtapa, string> = {
  done: 'bg-[var(--color-sage)]',
  current: 'bg-[var(--color-line)]',
  pending: 'bg-[var(--color-line)]',
}
</script>

<template>
  <div
    v-if="!ciclo"
    class="rounded-2xl border border-[var(--color-line)] bg-white p-4 text-sm text-[var(--color-ink)]/50"
  >
    Aún no hay un ciclo abierto.
  </div>
  <div
    v-else
    class="rounded-2xl border border-[var(--color-line)] bg-white p-4"
  >
    <p class="mb-3 text-xs text-[var(--color-ink)]/60">
      {{ completadas }} de {{ etapas.length }} etapas completadas · {{ porcentaje }}%
    </p>
    <div class="flex items-center overflow-x-auto pb-1">
      <template
        v-for="(etapa, i) in etapas"
        :key="etapa.label"
      >
        <div class="flex shrink-0 flex-col items-center gap-1.5 px-1">
          <div
            class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold"
            :class="circleClass[etapa.estado]"
          >
            <svg
              v-if="etapa.estado === 'done'"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="3"
              stroke-linecap="round"
              stroke-linejoin="round"
            ><path d="M5 13l4 4L19 7" /></svg>
            <span v-else>{{ i + 1 }}</span>
          </div>
          <span
            class="w-20 text-center text-[11px] leading-tight"
            :class="labelClass[etapa.estado]"
          >{{ etapa.label }}</span>
        </div>
        <div
          v-if="i < etapas.length - 1"
          class="mb-5 h-0.5 w-6 shrink-0"
          :class="lineClass[etapa.estado]"
        />
      </template>
    </div>
  </div>
</template>
