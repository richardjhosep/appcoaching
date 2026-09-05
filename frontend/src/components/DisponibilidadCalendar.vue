<script setup lang="ts">
// Grilla semanal de horas libres del coach, para que el coachee pida una sesión — hermano de
// WeekCalendar.vue pero con un modo de interacción distinto (acá el click siempre pide un
// horario, nunca abre un link ni hace scroll), así que se mantiene como componente separado
// en vez de agregarle un tercer modo a WeekCalendar.
import { computed, ref, watch } from 'vue'
import { inicioDeSemana } from '../lib/dateRange'

const props = defineProps<{ slots: string[] }>()
const emit = defineEmits<{ 'cambio-semana': [desde: string, hasta: string]; solicitar: [string] }>()

const HORA_INICIO = 7
const HORA_FIN = 21
const ALTO_HORA = 48
const ALTO_TOTAL = (HORA_FIN - HORA_INICIO) * ALTO_HORA

const diasLabel = ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM']

const semanaBase = ref(inicioDeSemana())

function sumarDias(d: Date, n: number): Date {
  const copia = new Date(d)
  copia.setDate(copia.getDate() + n)
  return copia
}

function aFechaCalendario(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const diasSemana = computed(() => Array.from({ length: 7 }, (_, i) => sumarDias(semanaBase.value, i)))
const horas = computed(() => Array.from({ length: HORA_FIN - HORA_INICIO }, (_, i) => HORA_INICIO + i))

function esMismoDia(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

function emitirRango() {
  emit(
    'cambio-semana',
    aFechaCalendario(semanaBase.value),
    aFechaCalendario(sumarDias(semanaBase.value, 6)),
  )
}
watch(semanaBase, emitirRango, { immediate: true })

interface Bloque {
  iso: string
  top: number
}

const bloquesPorDia = computed<Bloque[][]>(() =>
  diasSemana.value.map((dia) =>
    props.slots
      .filter((iso) => esMismoDia(new Date(iso), dia))
      .map((iso) => {
        const fecha = new Date(iso)
        const minutosDesdeInicio = (fecha.getHours() - HORA_INICIO) * 60 + fecha.getMinutes()
        return { iso, top: (minutosDesdeInicio / 60) * ALTO_HORA }
      }),
  ),
)

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
        Horas disponibles
      </h2>
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
              :key="bloque.iso"
              class="absolute left-0.5 right-0.5 rounded border border-[var(--color-sage)] bg-[var(--color-sage)]/15 px-1 py-0.5 text-left text-[11px] font-semibold leading-tight text-[var(--color-sage)] hover:bg-[var(--color-sage)]/25"
              :style="{ top: `${bloque.top}px`, height: `${ALTO_HORA}px` }"
              title="Pedir esta hora"
              @click="emit('solicitar', bloque.iso)"
            >
              {{ new Date(bloque.iso).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }) }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
