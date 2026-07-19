<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import AppShell from '../../components/AppShell.vue'
import {
  atenderSolicitud,
  getSolicitudes,
  type SolicitudProceso,
} from '../../api/satisfaccion'
import { getCiclosCerrados, type CicloCerrado } from '../../api/ciclos'
import { ApiError } from '../../api/client'

const router = useRouter()

const loading = ref(true)
const solicitudesPendientes = ref<SolicitudProceso[]>([])
const ciclosCerrados = ref<CicloCerrado[]>([])
const error = ref<string | null>(null)
const atendiendo = ref<string | null>(null)

async function load() {
  loading.value = true
  const [solicitudes, cerrados] = await Promise.all([
    getSolicitudes('pendiente'),
    getCiclosCerrados(),
  ])
  solicitudesPendientes.value = solicitudes
  ciclosCerrados.value = cerrados
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
  void router.push({ name: 'coach-ciclo', params: { coacheeId } })
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
        class="text-sm text-[var(--color-bronze)]"
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
  </AppShell>
</template>
