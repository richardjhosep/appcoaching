<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import AppShell from '../../components/AppShell.vue'
import SectionCard from '../../components/SectionCard.vue'
import WeekCalendar from '../../components/WeekCalendar.vue'
import EmptyState from '../../components/EmptyState.vue'
import SkeletonBlock from '../../components/SkeletonBlock.vue'
import ErrorState from '../../components/ErrorState.vue'
import AppButton from '../../components/AppButton.vue'
import ReagendarSesionModal from '../../components/ReagendarSesionModal.vue'
import AppModal from '../../components/AppModal.vue'
import { agendarSesion, agendarSerieSesiones, getTodasLasSesiones, type FrecuenciaSerie, type Sesion } from '../../api/sesiones'
import {
  crearBloqueDisponibilidad,
  eliminarBloqueDisponibilidad,
  listBloquesDisponibilidad,
  type BloqueDisponibilidad,
} from '../../api/disponibilidad'
import {
  getSolicitudesSesionPendientes,
  responderSolicitudSesion,
  type SolicitudSesion,
} from '../../api/solicitudes-sesion'
import { listCoachees, type CoacheeListItem } from '../../api/coachees'
import { ApiError } from '../../api/client'
import { notifyError, notifySuccess } from '../../lib/notify'
import { aDatetimeLocal, inicioDeSemana } from '../../lib/dateRange'
import { useCarga } from '../../lib/useCarga'

const DIAS_LABEL = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

const sesiones = ref<Sesion[]>([])
const bloques = ref<BloqueDisponibilidad[]>([])
const solicitudes = ref<SolicitudSesion[]>([])
const coachees = ref<CoacheeListItem[]>([])

const coacheesActivos = computed(() =>
  [...coachees.value].filter((c) => c.activo !== false).sort((a, b) => a.nombre.localeCompare(b.nombre)),
)

const bloquesPorDia = computed(() => {
  const grupos: BloqueDisponibilidad[][] = Array.from({ length: 7 }, () => [])
  for (const b of bloques.value) grupos[b.diaSemana]!.push(b)
  return grupos
})

// Lunes primero para que el orden visual coincida con la grilla de arriba (WeekCalendar
// también empieza en lunes) — bloquesPorDia sigue indexado 0=domingo..6=sábado porque así
// codifica diaSemana el backend, esto solo cambia el orden en que se recorre al pintar.
const ORDEN_DIAS_LUNES_PRIMERO = [1, 2, 3, 4, 5, 6, 0]

// --- KPIs de la cabecera ------------------------------------------------------
// Se derivan de `sesiones` (ya cargado para la grilla) en vez de pedir datos nuevos al
// backend — "agendadas"/"clientes" cuentan sesiones futuras; "esta semana" acota además a
// la semana calendario (lunes-domingo) que contiene hoy.
const sesionesFuturas = computed(() => sesiones.value.filter((s) => new Date(s.fechaHora).getTime() > Date.now()))

const sesionesEstaSemana = computed(() => {
  const desde = inicioDeSemana()
  const hasta = new Date(desde)
  hasta.setDate(hasta.getDate() + 7)
  return sesionesFuturas.value.filter((s) => {
    const t = new Date(s.fechaHora).getTime()
    return t >= desde.getTime() && t < hasta.getTime()
  })
})

const clientesConSesionAgendada = computed(() => new Set(sesionesFuturas.value.map((s) => s.coacheeId)).size)

async function load() {
  // Críticas: sesiones y disponibilidad (la grilla). Solicitudes y coachees se toleran:
  // si fallan se avisa en vez de mostrar "sin solicitudes" como si fuera cierto.
  const [s, b, sol, cc] = await Promise.all([
    getTodasLasSesiones(),
    listBloquesDisponibilidad(),
    tolerar(getSolicitudesSesionPendientes()),
    tolerar(listCoachees()),
  ])
  sesiones.value = s
  bloques.value = b
  solicitudes.value = sol ?? []
  coachees.value = cc ?? []
}

const { loading, error, fallos, recargar, tolerar } = useCarga(load)

onMounted(recargar)

// --- Solicitudes pendientes ---
const respondiendoId = ref<string | null>(null)
const respuestaPorSolicitud = ref<Record<string, string>>({})

async function responder(solicitud: SolicitudSesion, aprobar: boolean) {
  respondiendoId.value = solicitud.id
  try {
    await responderSolicitudSesion(solicitud.id, {
      aprobar,
      respuestaCoach: respuestaPorSolicitud.value[solicitud.id] || undefined,
    })
    solicitudes.value = solicitudes.value.filter((s) => s.id !== solicitud.id)
    if (aprobar) {
      sesiones.value = await getTodasLasSesiones()
    }
    await notifySuccess(
      aprobar ? 'Sesión confirmada' : 'Solicitud rechazada',
      aprobar
        ? 'La sesión quedó agendada y el coachee fue notificado.'
        : 'El coachee fue notificado.',
    )
  } catch (err) {
    await notifyError(
      'No se pudo responder la solicitud',
      err instanceof ApiError ? err.message : 'Ocurrió un error inesperado.',
    )
  } finally {
    respondiendoId.value = null
  }
}

// --- Disponibilidad ---
const nuevoBloque = ref({ diaSemana: 1, horaInicio: '09:00', horaFin: '18:00' })
const agregandoBloque = ref(false)
const errorBloque = ref<string | null>(null)

async function agregarBloque() {
  errorBloque.value = null
  agregandoBloque.value = true
  try {
    const bloque = await crearBloqueDisponibilidad(
      nuevoBloque.value.diaSemana,
      nuevoBloque.value.horaInicio,
      nuevoBloque.value.horaFin,
    )
    bloques.value = [...bloques.value, bloque]
  } catch (err) {
    errorBloque.value = err instanceof ApiError ? err.message : 'No se pudo crear el bloque.'
  } finally {
    agregandoBloque.value = false
  }
}

async function quitarBloque(id: string) {
  await eliminarBloqueDisponibilidad(id)
  bloques.value = bloques.value.filter((b) => b.id !== id)
}

// --- Reagendar sesión desde la agenda general -------------------------------
const sesionAReagendar = ref<Sesion | null>(null)

function abrirReagendar(sesionId: string) {
  sesionAReagendar.value = sesiones.value.find((s) => s.id === sesionId) ?? null
}

function onReagendada(actualizada: Sesion) {
  sesiones.value = sesiones.value.map((s) => (s.id === actualizada.id ? actualizada : s))
  sesionAReagendar.value = null
}

// Cuando se elimina "toda la serie" se borra más de una fila (todas las futuras de esa
// recurrencia, no solo la que se arrastró/clickeó), así que se recarga desde el backend
// en vez de intentar adivinar cuáles quitar del arreglo local.
async function onSesionEliminada() {
  sesiones.value = await getTodasLasSesiones()
}

// --- Nueva sesión desde la agenda general -----------------------------------
// A diferencia del detalle de un coachee (donde el coachee es implícito), acá hay que
// elegir a quién es la sesión — se puede abrir vacío ("+ Nueva sesión") o prellenado con
// la fecha/hora elegida con un clic o arrastre sobre la grilla.
const modalNuevaSesionOpen = ref(false)
const nuevaSesionForm = ref({
  coacheeId: '',
  fechaHora: '',
  link: '',
  repetir: false,
  frecuencia: 'semanal' as FrecuenciaSerie,
  intervaloSemanas: 3,
  cantidadSesiones: 4,
})
const agendandoNueva = ref(false)
const errorNuevaSesion = ref<string | null>(null)

function abrirNuevaSesion(fechaHoraPrefill?: string) {
  nuevaSesionForm.value = {
    coacheeId: '',
    fechaHora: fechaHoraPrefill ? aDatetimeLocal(new Date(fechaHoraPrefill)) : '',
    link: '',
    repetir: false,
    frecuencia: 'semanal',
    intervaloSemanas: 3,
    cantidadSesiones: 4,
  }
  errorNuevaSesion.value = null
  modalNuevaSesionOpen.value = true
}

const descripcionSerie = computed(() => {
  const { frecuencia, intervaloSemanas } = nuevaSesionForm.value
  const cada = {
    semanal: 'una por semana',
    quincenal: 'una cada dos semanas',
    mensual: 'una por mes, el mismo día del mes',
    personalizada: `una cada ${intervaloSemanas || '?'} semana${intervaloSemanas === 1 ? '' : 's'}`,
  }[frecuencia]
  return `Se crean ${cada}, a la misma hora, desde la fecha elegida arriba.`
})

async function crearNuevaSesion() {
  const { coacheeId, fechaHora, link, repetir, frecuencia, intervaloSemanas, cantidadSesiones } = nuevaSesionForm.value
  if (!coacheeId || !fechaHora) return
  errorNuevaSesion.value = null
  agendandoNueva.value = true
  try {
    if (repetir) {
      const creadas = await agendarSerieSesiones(
        coacheeId,
        new Date(fechaHora).toISOString(),
        cantidadSesiones,
        link || undefined,
        frecuencia,
        intervaloSemanas,
      )
      sesiones.value = [...sesiones.value, ...creadas]
    } else {
      const sesion = await agendarSesion(coacheeId, new Date(fechaHora).toISOString(), link || undefined)
      sesiones.value = [...sesiones.value, sesion]
    }
    modalNuevaSesionOpen.value = false
  } catch (err) {
    errorNuevaSesion.value = err instanceof ApiError ? err.message : 'No se pudo agendar la sesión.'
  } finally {
    agendandoNueva.value = false
  }
}
</script>

<template>
  <AppShell>
    <h1 class="mb-4 font-[family-name:var(--font-heading)] text-xl font-semibold">
      Mi agenda
    </h1>

    <div
      v-if="!loading"
      class="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3"
    >
      <div class="rounded-2xl border border-[var(--color-line)] bg-white p-4">
        <p class="text-xs text-[var(--color-muted)]">
          Sesiones agendadas
        </p>
        <p class="cifra text-2xl font-semibold">
          {{ sesionesFuturas.length }}
        </p>
      </div>
      <div class="rounded-2xl border border-[var(--color-line)] bg-white p-4">
        <p class="text-xs text-[var(--color-muted)]">
          Esta semana
        </p>
        <p class="cifra text-2xl font-semibold">
          {{ sesionesEstaSemana.length }}
        </p>
      </div>
      <div class="rounded-2xl border border-[var(--color-line)] bg-white p-4">
        <p class="text-xs text-[var(--color-muted)]">
          Clientes con sesión agendada
        </p>
        <p class="cifra text-2xl font-semibold">
          {{ clientesConSesionAgendada }}
        </p>
      </div>
    </div>

    <SkeletonBlock
      v-if="loading"
      variant="cards"
    />
    <ErrorState
      v-else-if="error"
      @retry="recargar"
    />
    <div
      v-else
      class="space-y-4"
    >
      <div
        v-if="fallos > 0"
        role="status"
        class="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[var(--color-bronze)]/40 bg-[var(--color-bronze)]/10 px-4 py-3 text-sm"
      >
        <span>No pudimos cargar las solicitudes de sesión o la lista de coachees: la agenda puede estar incompleta.</span>
        <AppButton
          variant="secondary"
          size="sm"
          @click="recargar"
        >
          Reintentar
        </AppButton>
      </div>
      <SectionCard
        v-if="solicitudes.length > 0"
        title="Solicitudes de sesión pendientes"
        icon="sesiones"
      >
        <ul class="space-y-3 text-sm">
          <li
            v-for="s in solicitudes"
            :key="s.id"
            class="rounded-xl border border-[var(--color-bronze)]/40 p-3"
          >
            <p class="mb-1 font-medium">
              {{ s.coachee?.nombre ?? 'Coachee' }} —
              {{ new Date(s.fechaHoraPropuesta).toLocaleString('es-CL', { dateStyle: 'medium', timeStyle: 'short' }) }}
            </p>
            <p
              v-if="s.motivo"
              class="mb-2 text-[var(--color-muted)]"
            >
              {{ s.motivo }}
            </p>
            <input
              v-model="respuestaPorSolicitud[s.id]"
              type="text"
              placeholder="Mensaje para el coachee (opcional)"
              aria-label="Mensaje para el coachee"
              class="field-input mb-2"
            >
            <div class="flex gap-2">
              <AppButton
                size="sm"
                :disabled="respondiendoId === s.id"
                @click="responder(s, true)"
              >
                Aprobar
              </AppButton>
              <AppButton
                variant="secondary"
                size="sm"
                :disabled="respondiendoId === s.id"
                @click="responder(s, false)"
              >
                Rechazar
              </AppButton>
            </div>
          </li>
        </ul>
      </SectionCard>

      <WeekCalendar
        :sesiones="sesiones"
        mostrar-coachee
        puede-agendar
        puede-editar
        @reagendar="abrirReagendar"
        @reagendada="onReagendada"
        @eliminada="onSesionEliminada"
        @nueva-sesion="abrirNuevaSesion()"
        @crear-en="abrirNuevaSesion"
      />

      <SectionCard
        title="Disponibilidad semanal"
        icon="habito"
      >
        <p class="mb-3 text-xs text-[var(--color-muted)]">
          Estos horarios son los que ven tus coachees para pedir una sesión — se repiten todas
          las semanas.
        </p>
        <EmptyState
          v-if="bloques.length === 0"
          icon="habito"
          title="Todavía no configuraste tu disponibilidad"
          description="Agrega al menos un bloque para que tus coachees puedan pedir horas."
        />
        <div
          v-else
          class="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
        >
          <div
            v-for="i in ORDEN_DIAS_LUNES_PRIMERO"
            :key="i"
            class="rounded-2xl border border-[var(--color-line)] bg-white p-4"
          >
            <h4 class="mb-3 border-b border-[var(--color-line)] pb-2 font-[family-name:var(--font-heading)] text-sm font-semibold">
              {{ DIAS_LABEL[i] }}
            </h4>
            <div
              v-if="bloquesPorDia[i]!.length > 0"
              class="space-y-2"
            >
              <div
                v-for="b in bloquesPorDia[i]"
                :key="b.id"
                class="flex items-center justify-between gap-2 rounded-lg border border-[var(--color-line)] bg-[var(--color-parchment)]/30 px-3 py-2 text-sm"
              >
                <span class="cifra">{{ b.horaInicio }}–{{ b.horaFin }}</span>
                <button
                  class="text-xs text-[var(--color-danger)] hover:underline"
                  @click="quitarBloque(b.id)"
                >
                  Quitar
                </button>
              </div>
            </div>
            <p
              v-else
              class="rounded-lg border border-dashed border-[var(--color-line)] px-3 py-4 text-center text-xs text-[var(--color-muted)]"
            >
              Sin disponibilidad
            </p>
          </div>
        </div>

        <p
          v-if="errorBloque"
          class="mb-2 text-sm text-[var(--color-danger)]"
        >
          {{ errorBloque }}
        </p>
        <div class="flex flex-wrap items-end gap-2">
          <label class="text-xs">
            Día
            <select
              v-model.number="nuevoBloque.diaSemana"
              class="mt-1 block h-9 w-32 rounded-lg border border-[var(--color-line)] px-2 text-sm"
            >
              <option
                v-for="(dia, i) in DIAS_LABEL"
                :key="i"
                :value="i"
              >
                {{ dia }}
              </option>
            </select>
          </label>
          <label class="text-xs">
            Desde
            <input
              v-model="nuevoBloque.horaInicio"
              type="time"
              class="mt-1 block h-9 w-32 rounded-lg border border-[var(--color-line)] px-2 text-sm"
            >
          </label>
          <label class="text-xs">
            Hasta
            <input
              v-model="nuevoBloque.horaFin"
              type="time"
              class="mt-1 block h-9 w-32 rounded-lg border border-[var(--color-line)] px-2 text-sm"
            >
          </label>
          <button
            class="h-9 rounded-lg bg-[var(--color-primary)] px-3 text-sm text-[var(--color-on-primary)] disabled:opacity-60"
            :disabled="agregandoBloque"
            @click="agregarBloque"
          >
            Agregar bloque
          </button>
        </div>
      </SectionCard>
    </div>

    <ReagendarSesionModal
      v-if="sesionAReagendar"
      :sesion="sesionAReagendar"
      @close="sesionAReagendar = null"
      @reagendada="onReagendada"
    />

    <AppModal
      v-if="modalNuevaSesionOpen"
      title="Agendar sesión"
      @close="modalNuevaSesionOpen = false"
    >
      <form
        class="space-y-4"
        @submit.prevent="crearNuevaSesion"
      >
        <p
          v-if="errorNuevaSesion"
          class="text-sm text-[var(--color-danger)]"
        >
          {{ errorNuevaSesion }}
        </p>
        <label class="block text-sm">
          Coachee
          <select
            v-model="nuevaSesionForm.coacheeId"
            required
            class="mt-1 w-full rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm"
          >
            <option
              value=""
              disabled
            >
              Elige un coachee
            </option>
            <option
              v-for="c in coacheesActivos"
              :key="c.id"
              :value="c.id"
            >
              {{ c.nombre }}
            </option>
          </select>
        </label>
        <label class="block text-sm">
          Fecha y hora
          <input
            v-model="nuevaSesionForm.fechaHora"
            type="datetime-local"
            required
            class="mt-1 w-full rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm"
          >
        </label>
        <label class="block text-sm">
          Link de videollamada (opcional)
          <input
            v-model="nuevaSesionForm.link"
            type="url"
            placeholder="https://…"
            class="mt-1 w-full rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm"
          >
        </label>
        <label class="flex items-center gap-2 text-sm">
          <input
            v-model="nuevaSesionForm.repetir"
            type="checkbox"
          >
          Repetir (sesión fija)
        </label>
        <div
          v-if="nuevaSesionForm.repetir"
          class="grid gap-2 sm:grid-cols-2"
        >
          <label class="block text-sm">
            Periodicidad
            <select
              v-model="nuevaSesionForm.frecuencia"
              class="mt-1 w-full rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm"
            >
              <option value="semanal">
                Cada semana
              </option>
              <option value="quincenal">
                Cada dos semanas
              </option>
              <option value="mensual">
                Una vez al mes (mismo día)
              </option>
              <option value="personalizada">
                Personalizada…
              </option>
            </select>
          </label>
          <label
            v-if="nuevaSesionForm.frecuencia === 'personalizada'"
            class="block text-sm"
          >
            Cada cuántas semanas
            <input
              v-model.number="nuevaSesionForm.intervaloSemanas"
              type="number"
              min="1"
              max="12"
              class="mt-1 w-full rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm"
            >
          </label>
        </div>
        <label
          v-if="nuevaSesionForm.repetir"
          class="block text-sm"
        >
          Número de sesiones
          <input
            v-model.number="nuevaSesionForm.cantidadSesiones"
            type="number"
            min="2"
            max="52"
            class="mt-1 w-full rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm"
          >
          <span class="mt-1 block text-xs text-[var(--color-muted)]">
            {{ descripcionSerie }}
          </span>
        </label>
        <div class="flex justify-end gap-2 pt-2">
          <button
            type="button"
            class="rounded-lg border border-[var(--color-line)] px-4 py-2 text-sm"
            @click="modalNuevaSesionOpen = false"
          >
            Cancelar
          </button>
          <button
            type="submit"
            :disabled="agendandoNueva"
            class="rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm text-[var(--color-on-primary)] disabled:opacity-60"
          >
            {{ agendandoNueva ? 'Agendando…' : 'Agendar sesión' }}
          </button>
        </div>
      </form>
    </AppModal>
  </AppShell>
</template>
