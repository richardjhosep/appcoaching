<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Sesion } from '../api/sesiones'
import { inicioDeSemana } from '../lib/dateRange'

const props = defineProps<{ sesiones: Sesion[]; puedeAgendar?: boolean }>()
const emit = defineEmits<{ select: [string]; 'nueva-sesion': [] }>()

const HORA_INICIO = 7
const HORA_FIN = 21
const ALTO_HORA = 48 // px por hora
const ALTO_TOTAL = (HORA_FIN - HORA_INICIO) * ALTO_HORA

const diasLabel = ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM']

const semanaBase = ref(inicioDeSemana())

function sumarDias(d: Date, n: number): Date {
  const copia = new Date(d)
  copia.setDate(copia.getDate() + n)
  return copia
}

const diasSemana = computed(() => Array.from({ length: 7 }, (_, i) => sumarDias(semanaBase.value, i)))

const horas = computed(() => Array.from({ length: HORA_FIN - HORA_INICIO }, (_, i) => HORA_INICIO + i))

function esMismoDia(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

interface Bloque {
  id: string
  top: number
  fechaHora: string
  color: string
  esFutura: boolean
  linkVideollamada: string | null
}

function colorPara(sesion: Sesion, esFutura: boolean): string {
  if (esFutura) return 'bg-[var(--color-sage)]/15 border border-[var(--color-sage)] text-[var(--color-ink)]'
  if (sesion.asistio === true) return 'bg-[var(--color-sage)] text-white'
  if (sesion.asistio === false) return 'bg-[var(--color-danger)] text-white'
  return 'bg-[var(--color-bronze)] text-white'
}

const bloquesPorDia = computed<Bloque[][]>(() =>
  diasSemana.value.map((dia) =>
    props.sesiones
      .filter((s) => esMismoDia(new Date(s.fechaHora), dia))
      .map((s) => {
        const fecha = new Date(s.fechaHora)
        const minutosDesdeInicio = (fecha.getHours() - HORA_INICIO) * 60 + fecha.getMinutes()
        const top = (minutosDesdeInicio / 60) * ALTO_HORA
        const esFutura = fecha.getTime() > Date.now()
        return {
          id: s.id,
          top,
          fechaHora: s.fechaHora,
          color: colorPara(s, esFutura),
          esFutura,
          linkVideollamada: s.linkVideollamada,
        }
      }),
  ),
)

function onClickBloque(bloque: Bloque) {
  if (bloque.esFutura && bloque.linkVideollamada) {
    window.open(bloque.linkVideollamada, '_blank', 'noopener')
    return
  }
  emit('select', bloque.id)
}

function semanaAnterior() {
  semanaBase.value = sumarDias(semanaBase.value, -7)
}
function semanaSiguiente() {
  semanaBase.value = sumarDias(semanaBase.value, 7)
}
function irAHoy() {
  semanaBase.value = inicioDeSemana()
}

const horaLabel = (h: number) => `${String(h).padStart(2, '0')}:00`
const diaLabel = (d: Date) => d.getDate()
const esHoy = (d: Date) => esMismoDia(d, new Date())
</script>

<template>
  <div class="rounded-2xl border border-[var(--color-line)] bg-white p-4">
    <div class="mb-3 flex items-center justify-between">
      <h2 class="text-sm font-medium">
        Calendario de sesiones
      </h2>
      <div class="flex items-center gap-2">
        <div class="flex items-center gap-1 text-sm">
          <button
            class="rounded-lg border border-[var(--color-line)] px-2 py-1 hover:bg-[var(--color-parchment)]/50"
            @click="semanaAnterior"
          >
            ←
          </button>
          <button
            class="rounded-lg border border-[var(--color-line)] px-2 py-1 hover:bg-[var(--color-parchment)]/50"
            @click="irAHoy"
          >
            Hoy
          </button>
          <button
            class="rounded-lg border border-[var(--color-line)] px-2 py-1 hover:bg-[var(--color-parchment)]/50"
            @click="semanaSiguiente"
          >
            →
          </button>
        </div>
        <button
          v-if="puedeAgendar"
          class="rounded-lg bg-[var(--color-ink)] px-3 py-1.5 text-xs font-medium text-[var(--color-parchment)]"
          @click="emit('nueva-sesion')"
        >
          + Nueva sesión
        </button>
      </div>
    </div>

    <div class="overflow-x-auto">
      <div class="flex min-w-[640px]">
        <div class="w-12 shrink-0">
          <div class="h-8" />
          <div
            v-for="h in horas"
            :key="h"
            class="pr-1 text-right text-[11px] font-medium text-[var(--color-ink)]/60"
            :style="{ height: `${ALTO_HORA}px` }"
          >
            {{ horaLabel(h) }}
          </div>
        </div>

        <div
          v-for="(dia, i) in diasSemana"
          :key="i"
          class="flex-1 border-l border-[var(--color-line)]"
        >
          <div
            class="flex h-8 flex-col items-center justify-center text-[11px] font-medium"
            :class="esHoy(dia) ? 'text-[var(--color-sage)]' : 'text-[var(--color-ink)]/70'"
          >
            <span>{{ diasLabel[i] }} {{ diaLabel(dia) }}</span>
          </div>
          <div
            class="relative border-t border-[var(--color-line)]"
            :style="{ height: `${ALTO_TOTAL}px` }"
          >
            <div
              v-for="h in horas"
              :key="h"
              class="border-b border-[var(--color-line)]/50"
              :style="{ height: `${ALTO_HORA}px` }"
            />
            <button
              v-for="bloque in bloquesPorDia[i]"
              :key="bloque.id"
              class="absolute left-0.5 right-0.5 rounded px-1 py-0.5 text-left text-[11px] font-semibold leading-tight"
              :class="bloque.color"
              :style="{ top: `${bloque.top}px`, height: `${ALTO_HORA}px` }"
              :title="bloque.esFutura && bloque.linkVideollamada ? 'Abrir enlace de la videollamada' : undefined"
              @click="onClickBloque(bloque)"
            >
              {{ new Date(bloque.fechaHora).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }) }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
