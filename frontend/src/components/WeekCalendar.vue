<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { cancelarSesion, reagendarSesion, type Sesion } from '../api/sesiones'
import { ApiError } from '../api/client'
import { inicioDeSemana } from '../lib/dateRange'
import { confirmDialog, confirmSerieDialog, notifyError, notifySuccess } from '../lib/notify'
import { iniciales } from '../lib/avatar'
import NavIcon from './NavIcon.vue'

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
  // Igual que el evento homónimo de ReagendarSesionModal: la sesión se movió arrastrando
  // el bloque a otro horario/día, ya guardada en el backend.
  reagendada: [Sesion]
  // La sesión (o, si era de una serie y se eligió "toda la serie", esa y las futuras) ya
  // se eliminó en el backend — el padre debe refrescar su lista de sesiones.
  eliminada: [string]
}>()

// Horario de trabajo típico — pero nada impide agendar una sesión fuera de este rango
// (el formulario de "nueva sesión" no lo restringe), así que HORA_INICIO/HORA_FIN de
// abajo se expanden para siempre cubrir cualquier sesión real de la semana visible. Antes
// una sesión antes de las 07:00 quedaba con un `top` negativo y "se salía" por encima de
// la cabecera de días en vez de mostrarse dentro de la grilla.
const HORA_INICIO_BASE = 7
const HORA_FIN_BASE = 21
const ALTO_HORA = 60 // px por hora — con avatar + hora + nombre, 48px quedaba muy apretado

const diasLabel = ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM']

const semanaBase = ref(inicioDeSemana())

function sumarDias(d: Date, n: number): Date {
  const copia = new Date(d)
  copia.setDate(copia.getDate() + n)
  return copia
}

const diasSemana = computed(() => Array.from({ length: 7 }, (_, i) => sumarDias(semanaBase.value, i)))

function esMismoDia(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

const sesionesDeLaSemana = computed(() =>
  props.sesiones.filter((s) => diasSemana.value.some((d) => esMismoDia(new Date(s.fechaHora), d))),
)

const HORA_INICIO = computed(() =>
  Math.min(HORA_INICIO_BASE, ...sesionesDeLaSemana.value.map((s) => new Date(s.fechaHora).getHours())),
)
const HORA_FIN = computed(() =>
  Math.max(HORA_FIN_BASE, ...sesionesDeLaSemana.value.map((s) => new Date(s.fechaHora).getHours() + 1)),
)
const ALTO_TOTAL = computed(() => (HORA_FIN.value - HORA_INICIO.value) * ALTO_HORA)

const horas = computed(() =>
  Array.from({ length: HORA_FIN.value - HORA_INICIO.value }, (_, i) => HORA_INICIO.value + i),
)

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
  if (esFutura) return 'bg-[var(--color-saltup)] text-white'
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
        const minutosDesdeInicio = (fecha.getHours() - HORA_INICIO.value) * 60 + fecha.getMinutes()
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
  if (seArrastroUltimoClick) {
    seArrastroUltimoClick = false
    return
  }
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
  if (horaDecimal < HORA_INICIO.value || horaDecimal > HORA_FIN.value) return null
  return (horaDecimal - HORA_INICIO.value) * ALTO_HORA
})

// --- Crear sesión con clic/arrastre sobre un slot vacío -----------------------
// Simple a propósito: no hay duración editable (una sesión es un punto en el tiempo, no
// un rango), así que el arrastre solo sirve de feedback visual — la hora que se usa es
// siempre la de donde empezó el gesto, redondeada a los 15 minutos más cercanos.
const arrastre = ref<{ diaIndex: number; inicioY: number; actualY: number } | null>(null)
let contenedorArrastre: HTMLElement | null = null

function fechaDesdeY(dia: Date, y: number): Date {
  const minutosSnap = Math.round(((y / ALTO_HORA) * 60) / 15) * 15
  const totalMin =
    Math.min(Math.max(minutosSnap, 0), (HORA_FIN.value - HORA_INICIO.value) * 60) + HORA_INICIO.value * 60
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
  arrastre.value = { ...arrastre.value, actualY: Math.min(Math.max(y, 0), ALTO_TOTAL.value) }
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

// --- Mover una sesión existente arrastrando su bloque --------------------------
// Distinto del arrastre "crear sesión" de arriba: acá el bloque puede cruzar de día
// (se detecta la columna bajo el puntero con elementFromPoint) y, al soltar, se guarda
// de inmediato reusando la misma API que ReagendarSesionModal — salvo que la sesión sea
// de una serie ("repetir semanalmente"), donde se pregunta antes si aplica solo a esta
// o a toda la serie, igual que hoy hace el modal.
const UMBRAL_ARRASTRE_PX = 5

interface InicioArrastreSesion {
  bloque: Bloque
  diaIndexOrigen: number
  mouseStartX: number
  mouseStartY: number
  topOrigen: number
}
let inicioArrastreSesion: InicioArrastreSesion | null = null
let seArrastroUltimoClick = false

const arrastreSesion = ref<{ bloqueId: string; diaIndex: number; top: number; color: string } | null>(null)
const moviendoSesion = ref(false)

function iniciarPosibleArrastreSesion(event: MouseEvent, bloque: Bloque, diaIndex: number) {
  if (!props.puedeEditar) return
  inicioArrastreSesion = {
    bloque,
    diaIndexOrigen: diaIndex,
    mouseStartX: event.clientX,
    mouseStartY: event.clientY,
    topOrigen: bloque.top,
  }
  window.addEventListener('mousemove', moverArrastreSesion)
  window.addEventListener('mouseup', soltarArrastreSesion)
}

function diaIndexBajoPuntero(event: MouseEvent, fallback: number): number {
  const columna = document
    .elementFromPoint(event.clientX, event.clientY)
    ?.closest('[data-testid^="columna-dia-"]') as HTMLElement | null
  const indice = columna?.dataset.testid?.replace('columna-dia-', '')
  return indice !== undefined ? Number(indice) : fallback
}

function moverArrastreSesion(event: MouseEvent) {
  if (!inicioArrastreSesion) return
  const deltaX = event.clientX - inicioArrastreSesion.mouseStartX
  const deltaY = event.clientY - inicioArrastreSesion.mouseStartY
  if (!arrastreSesion.value && Math.hypot(deltaX, deltaY) < UMBRAL_ARRASTRE_PX) return
  seArrastroUltimoClick = true
  const diaIndex = diaIndexBajoPuntero(event, inicioArrastreSesion.diaIndexOrigen)
  const top = Math.min(Math.max(inicioArrastreSesion.topOrigen + deltaY, 0), ALTO_TOTAL.value - ALTO_HORA)
  arrastreSesion.value = { bloqueId: inicioArrastreSesion.bloque.id, diaIndex, top, color: inicioArrastreSesion.bloque.color }
}

async function soltarArrastreSesion(event: MouseEvent) {
  window.removeEventListener('mousemove', moverArrastreSesion)
  window.removeEventListener('mouseup', soltarArrastreSesion)
  const inicio = inicioArrastreSesion
  const arrastrado = arrastreSesion.value
  inicioArrastreSesion = null
  arrastreSesion.value = null
  if (!inicio || !arrastrado) return

  const diaIndex = diaIndexBajoPuntero(event, arrastrado.diaIndex)
  const nuevaFecha = fechaDesdeY(diasSemana.value[diaIndex]!, arrastrado.top)
  if (nuevaFecha.getTime() === new Date(inicio.bloque.fechaHora).getTime()) return

  const sesion = props.sesiones.find((s) => s.id === inicio.bloque.id)
  if (sesion?.recurrenciaId) {
    const eleccion = await confirmSerieDialog({
      title: 'Mover sesión de una serie',
      text: 'Esta sesión es parte de una serie fija. ¿Aplicamos el nuevo horario solo a esta sesión o a todas las futuras de la serie?',
      soloEstaText: 'Solo esta sesión',
      todaSerieText: 'Toda la serie',
    })
    if (!eleccion) return
    await aplicarReagendarPorArrastre(inicio.bloque.id, nuevaFecha.toISOString(), eleccion === 'toda-serie')
    return
  }
  await aplicarReagendarPorArrastre(inicio.bloque.id, nuevaFecha.toISOString())
}

async function aplicarReagendarPorArrastre(id: string, nuevaFecha: string, aplicarASerie?: boolean) {
  moviendoSesion.value = true
  try {
    const actualizada = await reagendarSesion(id, nuevaFecha, undefined, aplicarASerie)
    emit('reagendada', actualizada)
  } catch (err) {
    void notifyError('No se pudo mover la sesión', err instanceof ApiError ? err.message : 'Intenta de nuevo.')
  } finally {
    moviendoSesion.value = false
  }
}

// --- Eliminar una sesión desde el calendario ------------------------------------
// Reusa cancelarSesion() (ya existía en api/sesiones.ts pero ningún componente la
// llamaba todavía). Como eliminar es irreversible, siempre pasa por confirmDialog —
// o confirmSerieDialog si la sesión es de una serie, igual que el reagendo por arrastre.
const eliminando = ref(false)

async function pedirEliminar(bloque: Bloque) {
  const sesion = props.sesiones.find((s) => s.id === bloque.id)
  if (sesion?.recurrenciaId) {
    const eleccion = await confirmSerieDialog({
      title: 'Eliminar sesión de una serie',
      text: 'Esta sesión es parte de una serie fija y no se puede deshacer. ¿Eliminamos solo esta sesión o esta y todas las futuras de la serie?',
      soloEstaText: 'Solo esta sesión',
      todaSerieText: 'Esta y las futuras',
      danger: true,
    })
    if (!eleccion) return
    await aplicarEliminar(bloque.id, eleccion === 'toda-serie')
    return
  }
  const confirmado = await confirmDialog({
    title: '¿Eliminar esta sesión?',
    text: 'Esta acción no se puede deshacer.',
    confirmText: 'Eliminar',
    danger: true,
  })
  if (!confirmado) return
  await aplicarEliminar(bloque.id, false)
}

async function aplicarEliminar(sesionId: string, aplicarASerie: boolean) {
  eliminando.value = true
  try {
    await cancelarSesion(sesionId, aplicarASerie)
    void notifySuccess(aplicarASerie ? 'Sesiones eliminadas' : 'Sesión eliminada')
    emit('eliminada', sesionId)
  } catch (err) {
    void notifyError('No se pudo eliminar la sesión', err instanceof ApiError ? err.message : 'Intenta de nuevo.')
  } finally {
    eliminando.value = false
  }
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
// Para que la vista contenedora pueda saltar a la semana de una sesión puntual (ej. el resumen
// de "próximas sesiones" del coachee).
function irASemanaDe(fecha: Date) {
  semanaBase.value = inicioDeSemana(fecha)
}
defineExpose({ irASemanaDe })

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
            <NavIcon name="flecha-izquierda" :size="16" />
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
            <NavIcon name="flecha-derecha" :size="16" />
          </button>
        </div>
        <button
          v-if="puedeAgendar"
          class="rounded-lg bg-[var(--color-primary)] px-3 py-1.5 text-xs font-medium text-[var(--color-on-primary)]"
          @click="emit('nueva-sesion')"
        >
          + Nueva sesión
        </button>
      </div>
    </div>

    <div class="overflow-x-auto">
      <div class="flex min-w-[840px]">
        <div class="w-12 shrink-0">
          <div class="h-8" />
          <div
            class="overflow-hidden rounded-l-lg bg-[var(--color-sage)]"
            :style="{ height: `${ALTO_TOTAL}px` }"
          >
            <div
              v-for="h in horas"
              :key="h"
              class="pr-1.5 text-right text-xs font-medium text-white/90"
              :style="{ height: `${ALTO_HORA}px` }"
            >
              {{ horaLabel(h) }}
            </div>
          </div>
        </div>

        <div
          v-for="(dia, i) in diasSemana"
          :key="i"
          class="flex-1 border-l border-[var(--color-line)]"
          :class="i >= 5 ? 'bg-[var(--color-parchment)]/50' : ''"
        >
          <div
            class="flex h-8 flex-col items-center justify-center text-xs font-medium"
            :class="esHoy(dia) ? 'text-[var(--color-sage)]' : 'text-[var(--color-ink)]/70'"
          >
            <span>{{ diasLabel[i] }} {{ diaLabel(dia) }}</span>
          </div>
          <div
            :data-testid="`columna-dia-${i}`"
            class="relative border-t border-[var(--color-line)]"
            :class="
              puedeAgendar
                ? arrastre && arrastre.diaIndex === i
                  ? 'cursor-grabbing'
                  : 'cursor-grab'
                : ''
            "
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
              <span class="block px-1 py-0.5 text-xs font-medium text-[var(--color-sage)]">
                {{ horaVistaPrevia }}
              </span>
            </div>
            <div
              v-if="arrastreSesion && arrastreSesion.diaIndex === i"
              data-testid="ghost-arrastre-sesion"
              class="pointer-events-none absolute left-0.5 right-0.5 z-20 rounded px-1.5 py-1 text-xs font-semibold leading-tight shadow-lg"
              :class="arrastreSesion.color"
              :style="{ top: `${arrastreSesion.top}px`, height: `${ALTO_HORA}px` }"
            >
              {{ fechaDesdeY(diasSemana[arrastreSesion.diaIndex]!, arrastreSesion.top).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }) }}
            </div>
            <div
              v-for="bloque in bloquesPorDia[i]"
              :key="bloque.id"
              class="group absolute left-0.5 right-0.5"
              :class="arrastreSesion?.bloqueId === bloque.id ? 'opacity-30' : ''"
              :style="{ top: `${bloque.top}px`, height: `${ALTO_HORA}px` }"
            >
              <button
                class="flex h-full w-full items-start gap-1.5 rounded px-1.5 py-1 text-left text-xs font-semibold leading-tight"
                :class="[bloque.color, puedeEditar ? (arrastreSesion?.bloqueId === bloque.id ? 'cursor-grabbing' : 'cursor-grab') : '']"
                :title="bloque.esFutura ? (bloque.linkVideollamada ? 'Abrir enlace de la videollamada' : 'Sin enlace de videollamada registrado') : undefined"
                @mousedown="iniciarPosibleArrastreSesion($event, bloque, i)"
                @click="onClickBloque(bloque)"
              >
                <span
                  v-if="bloque.nombreCoachee"
                  class="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-white/70 text-xs font-bold text-[var(--color-ink)]"
                  aria-hidden="true"
                >{{ iniciales(bloque.nombreCoachee) }}</span>
                <span class="min-w-0 flex-1 truncate">
                  {{ new Date(bloque.fechaHora).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }) }}
                  <span
                    v-if="bloque.nombreCoachee"
                    class="block truncate text-xs font-normal opacity-90"
                  >{{ bloque.nombreCoachee }}</span>
                </span>
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
                ><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" /></svg>
              </button>
              <button
                v-if="puedeEditar"
                type="button"
                title="Eliminar esta sesión"
                class="absolute right-4 top-0.5 rounded p-0.5 opacity-0 hover:bg-black/10 group-hover:opacity-100"
                @click="pedirEliminar(bloque)"
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
                ><path d="M3 6h18" /><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6M14 11v6" /></svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
