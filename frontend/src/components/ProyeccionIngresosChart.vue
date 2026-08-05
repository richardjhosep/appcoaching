<script setup lang="ts">
import { computed, ref } from 'vue'
import type { ProyeccionMes } from '../api/negocio'

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

const ALTURA_MAX_PX = 88

const maxTotal = computed(() => Math.max(1, ...props.meses.map((m) => m.total)))
const mesActivo = computed(() => props.meses[mesActivoIndex.value] ?? null)
const desgloseActivo = computed(() => {
  if (!mesActivo.value) return []
  return vista.value === 'coachee' ? mesActivo.value.porCoachee : mesActivo.value.porEmpresa
})

function alturaPx(total: number): number {
  return Math.max(3, Math.round((total / maxTotal.value) * ALTURA_MAX_PX))
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

    <div class="overflow-x-auto">
      <div class="flex min-w-[640px] gap-1">
        <button
          v-for="(m, i) in meses"
          :key="m.mes"
          type="button"
          class="flex flex-1 flex-col items-center gap-1.5 rounded-lg px-1 py-1.5 transition-colors"
          :class="i === mesActivoIndex ? 'bg-[var(--color-parchment)]' : 'hover:bg-[var(--color-parchment)]/50'"
          @click="mesActivoIndex = i"
        >
          <div class="flex h-[88px] w-full items-end justify-center">
            <div
              class="w-3 rounded-t transition-all"
              :style="{
                height: `${alturaPx(m.total)}px`,
                backgroundColor: i === mesActivoIndex ? 'var(--color-sage)' : 'color-mix(in srgb, var(--color-sage) 45%, white)',
              }"
            />
          </div>
          <span
            class="text-[10px]"
            :class="i === mesActivoIndex ? 'font-medium text-[var(--color-ink)]' : 'text-[var(--color-ink)]/50'"
          >
            {{ m.etiqueta }}
          </span>
        </button>
      </div>
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
