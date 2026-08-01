<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import AppShell from '../../components/AppShell.vue'
import AppModal from '../../components/AppModal.vue'
import {
  atenderSolicitud,
  getSolicitudes,
  type SolicitudProceso,
} from '../../api/satisfaccion'
import { getCiclosCerrados, type CicloCerrado } from '../../api/ciclos'
import {
  getSolicitudesReagendamiento,
  responderSolicitudReagendamiento,
  type SolicitudReagendamiento,
} from '../../api/solicitudes-reagendamiento'
import { ApiError } from '../../api/client'
import { notifySuccess, notifyError } from '../../lib/notify'

const router = useRouter()

const loading = ref(true)
const solicitudesPendientes = ref<SolicitudProceso[]>([])
const ciclosCerrados = ref<CicloCerrado[]>([])
const solicitudesReagendamientoPendientes = ref<SolicitudReagendamiento[]>([])
const error = ref<string | null>(null)
const atendiendo = ref<string | null>(null)

async function load() {
  loading.value = true
  const [solicitudes, cerrados, reagendamientos] = await Promise.all([
    getSolicitudes('pendiente'),
    getCiclosCerrados(),
    getSolicitudesReagendamiento(),
  ])
  solicitudesPendientes.value = solicitudes
  ciclosCerrados.value = cerrados
  solicitudesReagendamientoPendientes.value = reagendamientos
  loading.value = false
}

onMounted(load)

async function marcarAtendida(id: string) {
  error.value = null
  atendiendo.value = id
  try {
    await atenderSolicitud(id)
    solicitudesPendientes.value = solicitudesPendientes.value.filter((s) => s.id !== id)
  } catch (err) {
    error.value = err instanceof ApiError ? err.message : 'No se pudo marcar la solicitud como atendida.'
  } finally {
    atendiendo.value = null
  }
}

function abrirNuevoProceso(coacheeId: string) {
  void router.push({ name: 'coach-coachee-detail', params: { coacheeId }, query: { tab: 'ciclo' } })
}

const responderModalOpen = ref(false)
const solicitudSeleccionada = ref<SolicitudReagendamiento | null>(null)
const responderForm = reactive({ nuevaFechaHora: '', respuestaCoach: '' })
const guardandoRespuesta = ref(false)

function abrirResponder(s: SolicitudReagendamiento) {
  solicitudSeleccionada.value = s
  responderForm.nuevaFechaHora = ''
  responderForm.respuestaCoach = ''
  responderModalOpen.value = true
}

async function guardarRespuesta() {
  const solicitud = solicitudSeleccionada.value
  if (!solicitud) return
  guardandoRespuesta.value = true
  try {
    await responderSolicitudReagendamiento(solicitud.id, {
      nuevaFechaHora: responderForm.nuevaFechaHora
        ? new Date(responderForm.nuevaFechaHora).toISOString()
        : undefined,
      respuestaCoach: responderForm.respuestaCoach || undefined,
    })
    solicitudesReagendamientoPendientes.value = solicitudesReagendamientoPendientes.value.filter(
      (s) => s.id !== solicitud.id,
    )
    responderModalOpen.value = false
    await notifySuccess('Respuesta enviada')
  } catch (err) {
    await notifyError(
      'No se pudo enviar la respuesta',
      err instanceof ApiError ? err.message : 'Ocurrió un error inesperado.',
    )
  } finally {
    guardandoRespuesta.value = false
  }
}
</script>

<template>
  <AppShell>
    <h1 class="mb-4 font-[family-name:var(--font-heading)] text-xl font-semibold">
      Gestión comercial
    </h1>

    <div
      v-if="loading"
      class="text-sm text-[var(--color-ink)]/60"
    >
      Cargando…
    </div>
    <div
      v-else
      class="space-y-4"
    >
      <p
        v-if="error"
        class="text-sm text-[var(--color-danger)]"
      >
        {{ error }}
      </p>

      <div class="rounded-2xl border border-[var(--color-line)] bg-white p-4">
        <h2 class="mb-3 text-sm font-medium">
          Solicitudes de nuevos procesos ({{ solicitudesPendientes.length }})
        </h2>
        <p
          v-if="solicitudesPendientes.length === 0"
          class="text-sm text-[var(--color-ink)]/60"
        >
          No hay solicitudes pendientes.
        </p>
        <ul
          v-else
          class="space-y-2 text-sm"
        >
          <li
            v-for="s in solicitudesPendientes"
            :key="s.id"
            class="flex items-center justify-between gap-3 rounded-xl border border-[var(--color-line)] p-3"
          >
            <div>
              <p class="font-medium">
                {{ s.nombreSugerido }}
                <span
                  v-if="s.empresa"
                  class="text-[var(--color-ink)]/60"
                >— {{ s.empresa.nombre }}</span>
              </p>
              <p
                v-if="s.mensaje"
                class="text-[var(--color-ink)]/60"
              >
                {{ s.mensaje }}
              </p>
            </div>
            <button
              :disabled="atendiendo === s.id"
              class="shrink-0 rounded-lg bg-[var(--color-ink)] px-3 py-2 text-xs text-[var(--color-parchment)] disabled:opacity-50"
              @click="marcarAtendida(s.id)"
            >
              Atender
            </button>
          </li>
        </ul>
      </div>

      <div class="rounded-2xl border border-[var(--color-line)] bg-white p-4">
        <h2 class="mb-3 text-sm font-medium">
          Solicitudes de reagendamiento ({{ solicitudesReagendamientoPendientes.length }})
        </h2>
        <p
          v-if="solicitudesReagendamientoPendientes.length === 0"
          class="text-sm text-[var(--color-ink)]/60"
        >
          No hay solicitudes de reagendamiento pendientes.
        </p>
        <ul
          v-else
          class="space-y-2 text-sm"
        >
          <li
            v-for="s in solicitudesReagendamientoPendientes"
            :key="s.id"
            class="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--color-line)] p-3"
          >
            <div>
              <p class="font-medium">
                {{ s.coachee?.nombre }}
              </p>
              <p class="text-[var(--color-ink)]/60">
                Sesión del {{ s.sesion ? new Date(s.sesion.fechaHora).toLocaleString('es-CL') : '—' }}
              </p>
              <p
                v-if="s.motivo"
                class="text-[var(--color-ink)]/60"
              >
                {{ s.motivo }}
              </p>
            </div>
            <button
              class="shrink-0 rounded-lg bg-[var(--color-ink)] px-3 py-2 text-xs text-[var(--color-parchment)]"
              @click="abrirResponder(s)"
            >
              Responder
            </button>
          </li>
        </ul>
      </div>

      <div class="rounded-2xl border border-[var(--color-line)] bg-white p-4">
        <h2 class="mb-3 text-sm font-medium">
          Procesos cerrados
        </h2>
        <p
          v-if="ciclosCerrados.length === 0"
          class="text-sm text-[var(--color-ink)]/60"
        >
          Todavía no hay procesos cerrados.
        </p>
        <ul
          v-else
          class="space-y-2 text-sm"
        >
          <li
            v-for="c in ciclosCerrados"
            :key="c.id"
            class="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--color-line)] p-3"
          >
            <div>
              <p class="font-medium">
                {{ c.coachee.nombre }}
              </p>
              <p class="text-[var(--color-ink)]/60">
                Cerrado el {{ c.fechaCierre ? new Date(c.fechaCierre).toLocaleDateString('es-CL') : '—' }}
                <span v-if="c.resultado"> · {{ c.resultado.replace(/_/g, ' ') }}</span>
              </p>
            </div>
            <button
              class="shrink-0 rounded-lg border border-[var(--color-line)] px-3 py-2 text-xs hover:bg-[var(--color-parchment)]/50"
              @click="abrirNuevoProceso(c.coacheeId)"
            >
              Abrir nuevo proceso con {{ c.coachee.nombre }}
            </button>
          </li>
        </ul>
      </div>
    </div>

    <AppModal
      v-if="responderModalOpen"
      title="Responder solicitud de reagendamiento"
      @close="responderModalOpen = false"
    >
      <form
        class="space-y-4"
        @submit.prevent="guardarRespuesta"
      >
        <div
          v-if="solicitudSeleccionada"
          class="rounded-lg bg-[var(--color-parchment)]/50 p-3 text-sm"
        >
          <p class="font-medium">
            {{ solicitudSeleccionada.coachee?.nombre }}
          </p>
          <p class="text-[var(--color-ink)]/60">
            Sesión actual: {{ solicitudSeleccionada.sesion ? new Date(solicitudSeleccionada.sesion.fechaHora).toLocaleString('es-CL') : '—' }}
          </p>
          <p
            v-if="solicitudSeleccionada.motivo"
            class="text-[var(--color-ink)]/60"
          >
            Motivo: {{ solicitudSeleccionada.motivo }}
          </p>
        </div>
        <label class="block text-sm">
          Nueva fecha y hora (opcional)
          <input
            v-model="responderForm.nuevaFechaHora"
            type="datetime-local"
            class="mt-1 w-full rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm"
          >
        </label>
        <label class="block text-sm">
          Mensaje para el coachee (opcional)
          <textarea
            v-model="responderForm.respuestaCoach"
            rows="3"
            class="mt-1 w-full rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm"
          />
        </label>
        <div class="flex justify-end gap-2 pt-2">
          <button
            type="button"
            class="rounded-lg border border-[var(--color-line)] px-4 py-2 text-sm"
            @click="responderModalOpen = false"
          >
            Cancelar
          </button>
          <button
            type="submit"
            :disabled="guardandoRespuesta"
            class="rounded-lg bg-[var(--color-ink)] px-4 py-2 text-sm text-[var(--color-parchment)] disabled:opacity-60"
          >
            {{ guardandoRespuesta ? 'Guardando…' : 'Guardar' }}
          </button>
        </div>
      </form>
    </AppModal>
  </AppShell>
</template>
