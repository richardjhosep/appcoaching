<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import AppShell from '../../components/AppShell.vue'
import SectionCard from '../../components/SectionCard.vue'
import WeekCalendar from '../../components/WeekCalendar.vue'
import EmptyState from '../../components/EmptyState.vue'
import SkeletonBlock from '../../components/SkeletonBlock.vue'
import ReagendarSesionModal from '../../components/ReagendarSesionModal.vue'
import AppModal from '../../components/AppModal.vue'
import { agendarSesion, agendarSerieSesiones, getTodasLasSesiones, type Sesion } from '../../api/sesiones'
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
import { aDatetimeLocal } from '../../lib/dateRange'

const DIAS_LABEL = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

const loading = ref(true)
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

async function load() {
  loading.value = true
  const [s, b, sol, cc] = await Promise.all([
    getTodasLasSesiones(),
    listBloquesDisponibilidad(),
    getSolicitudesSesionPendientes(),
    listCoachees(),
  ])
  sesiones.value = s
  bloques.value = b
  solicitudes.value = sol
  coachees.value = cc
  loading.value = false
}

onMounted(load)

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

// --- Nueva sesión desde la agenda general -----------------------------------
// A diferencia del detalle de un coachee (donde el coachee es implícito), acá hay que
// elegir a quién es la sesión — se puede abrir vacío ("+ Nueva sesión") o prellenado con
// la fecha/hora elegida con un clic o arrastre sobre la grilla.
const modalNuevaSesionOpen = ref(false)
const nuevaSesionForm = ref({
  coacheeId: '',
  fechaHora: '',
  link: '',
  repetirSemanal: false,
  cantidadSesiones: 4,
})
const agendandoNueva = ref(false)
const errorNuevaSesion = ref<string | null>(null)

function abrirNuevaSesion(fechaHoraPrefill?: string) {
  nuevaSesionForm.value = {
    coacheeId: '',
    fechaHora: fechaHoraPrefill ? aDatetimeLocal(new Date(fechaHoraPrefill)) : '',
    link: '',
    repetirSemanal: false,
    cantidadSesiones: 4,
  }
  errorNuevaSesion.value = null
  modalNuevaSesionOpen.value = true
}

async function crearNuevaSesion() {
  const { coacheeId, fechaHora, link, repetirSemanal, cantidadSesiones } = nuevaSesionForm.value
  if (!coacheeId || !fechaHora) return
  errorNuevaSesion.value = null
  agendandoNueva.value = true
  try {
    if (repetirSemanal) {
      const creadas = await agendarSerieSesiones(
        coacheeId,
        new Date(fechaHora).toISOString(),
        cantidadSesiones,
        link || undefined,
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

    <SkeletonBlock v-if="loading" />
    <div
      v-else
      class="space-y-4"
    >
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
              class="mb-2 text-[var(--color-ink)]/60"
            >
              {{ s.motivo }}
            </p>
            <input
              v-model="respuestaPorSolicitud[s.id]"
              type="text"
              placeholder="Mensaje para el coachee (opcional)"
              class="mb-2 w-full rounded-lg border border-[var(--color-line)] px-3 py-1.5 text-xs"
            >
            <div class="flex gap-2">
              <button
                class="rounded-lg bg-[var(--color-sage)] px-3 py-1.5 text-xs font-medium text-white disabled:opacity-60"
                :disabled="respondiendoId === s.id"
                @click="responder(s, true)"
              >
                Aprobar
              </button>
              <button
                class="rounded-lg border border-[var(--color-line)] px-3 py-1.5 text-xs disabled:opacity-60"
                :disabled="respondiendoId === s.id"
                @click="responder(s, false)"
              >
                Rechazar
              </button>
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
        @nueva-sesion="abrirNuevaSesion()"
        @crear-en="abrirNuevaSesion"
      />

      <SectionCard
        title="Disponibilidad semanal"
        icon="habito"
      >
        <p class="mb-3 text-xs text-[var(--color-ink)]/50">
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
          class="mb-4 grid gap-3 sm:grid-cols-2"
        >
          <div
            v-for="(dia, i) in DIAS_LABEL"
            :key="i"
          >
            <p
              v-if="bloquesPorDia[i]!.length > 0"
              class="mb-1 text-xs font-medium text-[var(--color-ink)]/60"
            >
              {{ dia }}
            </p>
            <ul class="space-y-1">
              <li
                v-for="b in bloquesPorDia[i]"
                :key="b.id"
                class="flex items-center justify-between rounded-lg border border-[var(--color-line)] px-3 py-1.5 text-sm"
              >
                {{ b.horaInicio }}–{{ b.horaFin }}
                <button
                  class="text-xs text-[var(--color-danger)] hover:underline"
                  @click="quitarBloque(b.id)"
                >
                  Quitar
                </button>
              </li>
            </ul>
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
            class="h-9 rounded-lg bg-[var(--color-ink)] px-3 text-sm text-[var(--color-parchment)] disabled:opacity-60"
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
            v-model="nuevaSesionForm.repetirSemanal"
            type="checkbox"
          >
          Repetir semanalmente (sesión fija)
        </label>
        <label
          v-if="nuevaSesionForm.repetirSemanal"
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
          <span class="mt-1 block text-xs text-[var(--color-ink)]/50">
            Se crea una sesión por semana, mismo día y hora, desde la fecha elegida arriba.
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
            class="rounded-lg bg-[var(--color-ink)] px-4 py-2 text-sm text-[var(--color-parchment)] disabled:opacity-60"
          >
            {{ agendandoNueva ? 'Agendando…' : 'Agendar sesión' }}
          </button>
        </div>
      </form>
    </AppModal>
  </AppShell>
</template>
