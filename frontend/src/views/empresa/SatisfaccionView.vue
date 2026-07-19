<script setup lang="ts">
import { onMounted, ref } from 'vue'
import AppShell from '../../components/AppShell.vue'
import {
  crearEncuesta,
  crearSolicitud,
  getMisEncuestas,
  getMisKpis,
  getMisSolicitudes,
  type Encuesta,
  type KpisEmpresa,
  type SolicitudProceso,
} from '../../api/satisfaccion'
import { ApiError } from '../../api/client'

const loading = ref(true)
const kpis = ref<KpisEmpresa | null>(null)
const encuestas = ref<Encuesta[]>([])
const solicitudes = ref<SolicitudProceso[]>([])
const error = ref<string | null>(null)

const nuevaCalificacion = ref(5)
const nuevoComentario = ref('')
const enviandoEncuesta = ref(false)

const nombreSugerido = ref('')
const mensajeSolicitud = ref('')
const enviandoSolicitud = ref(false)

async function load() {
  loading.value = true
  const [k, e, s] = await Promise.all([getMisKpis(), getMisEncuestas(), getMisSolicitudes()])
  kpis.value = k
  encuestas.value = e
  solicitudes.value = s
  loading.value = false
}

onMounted(load)

async function enviarEncuesta() {
  error.value = null
  enviandoEncuesta.value = true
  try {
    await crearEncuesta(nuevaCalificacion.value, nuevoComentario.value || undefined)
    nuevoComentario.value = ''
    nuevaCalificacion.value = 5
    encuestas.value = await getMisEncuestas()
    kpis.value = await getMisKpis()
  } catch (err) {
    error.value = err instanceof ApiError ? err.message : 'No se pudo enviar la encuesta.'
  } finally {
    enviandoEncuesta.value = false
  }
}

async function enviarSolicitud() {
  if (!nombreSugerido.value.trim()) return
  error.value = null
  enviandoSolicitud.value = true
  try {
    await crearSolicitud(nombreSugerido.value, mensajeSolicitud.value || undefined)
    nombreSugerido.value = ''
    mensajeSolicitud.value = ''
    solicitudes.value = await getMisSolicitudes()
  } catch (err) {
    error.value = err instanceof ApiError ? err.message : 'No se pudo enviar la solicitud.'
  } finally {
    enviandoSolicitud.value = false
  }
}
</script>

<template>
  <AppShell>
    <h1 class="mb-4 font-[family-name:var(--font-heading)] text-xl font-semibold">
      Satisfacción y procesos
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

      <div
        v-if="kpis"
        class="grid grid-cols-2 gap-3 sm:grid-cols-4"
      >
        <div class="rounded-2xl border border-[var(--color-line)] bg-white p-4">
          <p class="text-xs text-[var(--color-ink)]/60">
            Procesos terminados
          </p>
          <p class="font-[family-name:var(--font-mono)] text-2xl">
            {{ kpis.procesosTerminados }}
          </p>
        </div>
        <div class="rounded-2xl border border-[var(--color-line)] bg-white p-4">
          <p class="text-xs text-[var(--color-ink)]/60">
            Procesos en curso
          </p>
          <p class="font-[family-name:var(--font-mono)] text-2xl">
            {{ kpis.procesosEnCurso }}
          </p>
        </div>
        <div class="rounded-2xl border border-[var(--color-line)] bg-white p-4">
          <p class="text-xs text-[var(--color-ink)]/60">
            Tasa de asistencia
          </p>
          <p class="font-[family-name:var(--font-mono)] text-2xl text-[var(--color-sage)]">
            {{ kpis.tasaAsistencia !== null ? `${kpis.tasaAsistencia}%` : '—' }}
          </p>
        </div>
        <div class="rounded-2xl border border-[var(--color-line)] bg-white p-4">
          <p class="text-xs text-[var(--color-ink)]/60">
            Satisfacción promedio
          </p>
          <p class="font-[family-name:var(--font-mono)] text-2xl">
            {{ kpis.satisfaccionPromedio !== null ? `${kpis.satisfaccionPromedio} ★` : '—' }}
          </p>
        </div>
      </div>

      <div class="rounded-2xl border border-[var(--color-line)] bg-white p-4">
        <h2 class="mb-3 text-sm font-medium">
          Encuesta de satisfacción
        </h2>
        <form
          class="mb-4 space-y-2"
          @submit.prevent="enviarEncuesta"
        >
          <label class="block text-xs text-[var(--color-ink)]/60">
            Calificación (1 a 5)
            <select
              v-model.number="nuevaCalificacion"
              class="mt-1 block w-24 rounded border border-[var(--color-line)] px-2 py-1 text-sm"
            >
              <option
                v-for="n in [1, 2, 3, 4, 5]"
                :key="n"
                :value="n"
              >
                {{ n }}
              </option>
            </select>
          </label>
          <label class="block text-xs text-[var(--color-ink)]/60">
            Comentario (opcional)
            <textarea
              v-model="nuevoComentario"
              rows="2"
              class="mt-1 block w-full rounded border border-[var(--color-line)] px-2 py-1 text-sm"
            />
          </label>
          <button
            type="submit"
            :disabled="enviandoEncuesta"
            class="rounded-lg bg-[var(--color-ink)] px-3 py-2 text-xs text-[var(--color-parchment)] disabled:opacity-50"
          >
            Enviar encuesta
          </button>
        </form>

        <p
          v-if="encuestas.length === 0"
          class="text-sm text-[var(--color-ink)]/60"
        >
          Todavía no has respondido ninguna encuesta.
        </p>
        <ul
          v-else
          class="space-y-1 text-sm"
        >
          <li
            v-for="e in encuestas"
            :key="e.id"
          >
            <span class="font-[family-name:var(--font-mono)] text-[var(--color-ink)]/50">{{ new Date(e.createdAt).toLocaleDateString('es-CL') }}</span>
            — {{ e.calificacion }} ★<span v-if="e.comentario"> — {{ e.comentario }}</span>
          </li>
        </ul>
      </div>

      <div class="rounded-2xl border border-[var(--color-line)] bg-white p-4">
        <h2 class="mb-3 text-sm font-medium">
          Solicitar un nuevo proceso
        </h2>
        <form
          class="mb-4 space-y-2"
          @submit.prevent="enviarSolicitud"
        >
          <label class="block text-xs text-[var(--color-ink)]/60">
            Nombre de la persona sugerida
            <input
              v-model="nombreSugerido"
              type="text"
              required
              class="mt-1 block w-full rounded border border-[var(--color-line)] px-2 py-1 text-sm"
            >
          </label>
          <label class="block text-xs text-[var(--color-ink)]/60">
            Mensaje (opcional)
            <textarea
              v-model="mensajeSolicitud"
              rows="2"
              class="mt-1 block w-full rounded border border-[var(--color-line)] px-2 py-1 text-sm"
            />
          </label>
          <button
            type="submit"
            :disabled="enviandoSolicitud"
            class="rounded-lg bg-[var(--color-ink)] px-3 py-2 text-xs text-[var(--color-parchment)] disabled:opacity-50"
          >
            Enviar solicitud
          </button>
        </form>

        <p
          v-if="solicitudes.length === 0"
          class="text-sm text-[var(--color-ink)]/60"
        >
          Todavía no has solicitado ningún proceso nuevo.
        </p>
        <ul
          v-else
          class="space-y-1 text-sm"
        >
          <li
            v-for="s in solicitudes"
            :key="s.id"
          >
            <span class="font-[family-name:var(--font-mono)] text-[var(--color-ink)]/50">{{ new Date(s.createdAt).toLocaleDateString('es-CL') }}</span>
            — {{ s.nombreSugerido }}
            <span
              class="rounded-full px-2 py-0.5 text-xs"
              :class="s.estado === 'atendida' ? 'bg-[var(--color-sage)]/20 text-[var(--color-sage)]' : 'bg-[var(--color-bronze)]/20 text-[var(--color-bronze)]'"
            >
              {{ s.estado === 'atendida' ? 'Atendida' : 'Pendiente' }}
            </span>
          </li>
        </ul>
      </div>
    </div>
  </AppShell>
</template>
