<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import AppShell from '../../components/AppShell.vue'
import SectionCard from '../../components/SectionCard.vue'
import WeekCalendar from '../../components/WeekCalendar.vue'
import EmptyState from '../../components/EmptyState.vue'
import SkeletonBlock from '../../components/SkeletonBlock.vue'
import { getTodasLasSesiones, type Sesion } from '../../api/sesiones'
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
import { ApiError } from '../../api/client'
import { notifyError, notifySuccess } from '../../lib/notify'

const DIAS_LABEL = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

const loading = ref(true)
const sesiones = ref<Sesion[]>([])
const bloques = ref<BloqueDisponibilidad[]>([])
const solicitudes = ref<SolicitudSesion[]>([])

const bloquesPorDia = computed(() => {
  const grupos: BloqueDisponibilidad[][] = Array.from({ length: 7 }, () => [])
  for (const b of bloques.value) grupos[b.diaSemana]!.push(b)
  return grupos
})

async function load() {
  loading.value = true
  const [s, b, sol] = await Promise.all([
    getTodasLasSesiones(),
    listBloquesDisponibilidad(),
    getSolicitudesSesionPendientes(),
  ])
  sesiones.value = s
  bloques.value = b
  solicitudes.value = sol
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
  </AppShell>
</template>
