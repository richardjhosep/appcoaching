<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import type { Sesion } from '../api/sesiones'
import { inicioDeSemana } from '../lib/dateRange'
import { notifyError } from '../lib/notify'

const props = defineProps<{
  sesiones: Sesion[]
  // También habilita crear una sesión con un clic (o clic sostenido) sobre un slot vacío
  // de la grilla, además del botón "+ Nueva sesión".
  puedeAgendar?: boolean
  // Habilita el lápiz de "reagendar" en cada bloque. Independiente de `puedeAgendar`
  // (crear sesiones nuevas) porque la agenda general del coach permite editar las sesiones
  // ya fijadas pero no crear una desde ahí — eso sigue viviendo en el detalle del coachee.
  puedeEditar?: boolean
  // Agenda global del coach (todos los coachees a la vez): muestra el nombre del coachee
  // dentro de cada bloque en vez de solo la hora.
  mostrarCoachee?: boolean
}>()
const emit = defineEmits<{
  select: [string]
  'nueva-sesion': []
  reagendar: [string]
  // Fecha/hora (ISO) elegida al hacer clic o arrastrar sobre un slot vacío de la grilla.
  'crear-en': [string]
}>()

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
  nombreCoachee: string | null
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
          nombreCoachee: props.mostrarCoachee ? (s.coachee?.nombre ?? null) : null,
        }
      }),
  ),
)

// Una sesión futura sin link no tiene nada útil que "seleccionar" (las vistas que escuchan
// @select solo hacen scroll a la lista de sesiones pasadas) — antes eso hacía que el clic no
// tuviera ningún efecto visible ni mensaje. Ahora se avisa explícitamente en vez de fallar en
// silencio.
function onClickBloque(bloque: Bloque) {
  if (bloque.esFutura) {
    if (bloque.linkVideollamada) {
      window.open(bloque.linkVideollamada, '_blank', 'noopener')
      return
    }
    void notifyError('Sin enlace de videollamada', 'Esta sesión todavía no tiene un enlace de videollamada registrado.')
    return
  }
  emit('select', bloque.id)
}

// --- Línea de "ahora" --------------------------------------------------------
const ahora = ref(new Date())
let tickAhora: ReturnType<typeof setInterval> | undefined

onMounted(() => {
  tickAhora = setInterval(() => {
    ahora.value = new Date()
  }, 60_000)
})
onUnmounted(() => {
  if (tickAhora) clearInterval(tickAhora)
})

const topAhora = computed(() => {
  const horaDecimal = ahora.value.getHours() + ahora.value.getMinutes() / 60
  if (horaDecimal < HORA_INICIO || horaDecimal > HORA_FIN) return null
  return (horaDecimal - HORA_INICIO) * ALTO_HORA
})

// --- Crear sesión con clic/arrastre sobre un slot vacío -----------------------
// Simple a propósito: no hay duración editable (una sesión es un punto en el tiempo, no
// un rango), así que el arrastre solo sirve de feedback visual — la hora que se usa es
// siempre la de donde empezó el gesto, redondeada a los 15 minutos más cercanos.
const arrastre = ref<{ diaIndex: number; inicioY: number; actualY: number } | null>(null)
let contenedorArrastre: HTMLElement | null = null

function fechaDesdeY(dia: Date, y: number): Date {
  const minutosSnap = Math.round(((y / ALTO_HORA) * 60) / 15) * 15
  const totalMin = Math.min(Math.max(minutosSnap, 0), (HORA_FIN - HORA_INICIO) * 60) + HORA_INICIO * 60
  const fecha = new Date(dia)
  fecha.setHours(Math.floor(totalMin / 60), totalMin % 60, 0, 0)
  return fecha
}

function iniciarArrastre(event: MouseEvent, diaIndex: number) {
  if (!props.puedeAgendar) return
  // No interferir con el clic de una sesión existente (bloque) ni su lápiz de editar.
  if ((event.target as HTMLElement).closest('button')) return
  const contenedor = event.currentTarget as HTMLElement
  contenedorArrastre = contenedor
  const y = event.clientY - contenedor.getBoundingClientRect().top
  arrastre.value = { diaIndex, inicioY: y, actualY: y }
  window.addEventListener('mousemove', moverArrastre)
  window.addEventListener('mouseup', soltarArrastre)
}

function moverArrastre(event: MouseEvent) {
  if (!arrastre.value || !contenedorArrastre) return
  const y = event.clientY - contenedorArrastre.getBoundingClientRect().top
  arrastre.value = { ...arrastre.value, actualY: Math.min(Math.max(y, 0), ALTO_TOTAL) }
}

function soltarArrastre() {
  window.removeEventListener('mousemove', moverArrastre)
  window.removeEventListener('mouseup', soltarArrastre)
  if (!arrastre.value) return
  const { diaIndex, inicioY } = arrastre.value
  const fecha = fechaDesdeY(diasSemana.value[diaIndex]!, inicioY)
  arrastre.value = null
  contenedorArrastre = null
  emit('crear-en', fecha.toISOString())
}

const horaVistaPrevia = computed(() => {
  if (!arrastre.value) return ''
  const fecha = fechaDesdeY(diasSemana.value[arrastre.value.diaIndex]!, arrastre.value.inicioY)
  return fecha.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })
})

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
            :data-testid="`columna-dia-${i}`"
            class="relative border-t border-[var(--color-line)]"
            :class="puedeAgendar ? 'cursor-crosshair' : ''"
            :style="{ height: `${ALTO_TOTAL}px` }"
            @mousedown="iniciarArrastre($event, i)"
          >
            <div
              v-for="h in horas"
              :key="h"
              class="border-b border-[var(--color-line)]/50"
              :style="{ height: `${ALTO_HORA}px` }"
            />
            <div
              v-if="esHoy(dia) && topAhora !== null"
              data-testid="linea-ahora"
              class="pointer-events-none absolute left-0 right-0 z-10 border-t-2 border-[var(--color-danger)]"
              :style="{ top: `${topAhora}px` }"
            >
              <span class="absolute -left-1 -top-[3px] h-[7px] w-[7px] rounded-full bg-[var(--color-danger)]" />
            </div>
            <div
              v-if="arrastre && arrastre.diaIndex === i"
              class="pointer-events-none absolute left-0.5 right-0.5 z-10 rounded border-2 border-dashed border-[var(--color-sage)] bg-[var(--color-sage)]/10"
              :style="{
                top: `${Math.min(arrastre.inicioY, arrastre.actualY)}px`,
                height: `${Math.max(16, Math.abs(arrastre.actualY - arrastre.inicioY))}px`,
              }"
            >
              <span class="block px-1 py-0.5 text-[10px] font-medium text-[var(--color-sage)]">
                {{ horaVistaPrevia }}
              </span>
            </div>
            <div
              v-for="bloque in bloquesPorDia[i]"
              :key="bloque.id"
              class="group absolute left-0.5 right-0.5"
              :style="{ top: `${bloque.top}px`, height: `${ALTO_HORA}px` }"
            >
              <button
                class="h-full w-full rounded px-1 py-0.5 text-left text-[11px] font-semibold leading-tight"
                :class="bloque.color"
                :title="bloque.esFutura ? (bloque.linkVideollamada ? 'Abrir enlace de la videollamada' : 'Sin enlace de videollamada registrado') : undefined"
                @click="onClickBloque(bloque)"
              >
                {{ new Date(bloque.fechaHora).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }) }}
                <span
                  v-if="bloque.nombreCoachee"
                  class="block truncate font-normal"
                >{{ bloque.nombreCoachee }}</span>
              </button>
              <button
                v-if="puedeEditar"
                type="button"
                title="Reagendar esta sesión"
                class="absolute right-0.5 top-0.5 rounded p-0.5 opacity-0 hover:bg-black/10 group-hover:opacity-100"
                @click="emit('reagendar', bloque.id)"
              >
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                ><path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" /></svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
