<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import AppShell from '../../components/AppShell.vue'
import ProgresoLineaTiempo from '../../components/ProgresoLineaTiempo.vue'
import { getCoachee } from '../../api/coachees'
import {
  actualizarAsistencia,
  agendarSesion,
  getSesionesDeCoachee,
  type Sesion,
} from '../../api/sesiones'
import {
  getAvanceDeCoachee,
  getLineaProgresoDeCoachee,
  getLogrosDeCoachee,
  type Logro,
  type PuntoProgreso,
} from '../../api/seguimiento'
import { ApiError } from '../../api/client'

const props = defineProps<{ coacheeId: string }>()

const loading = ref(true)
const nombreCoachee = ref('')
const avance = ref<number | null>(null)
const puntos = ref<PuntoProgreso[]>([])
const logros = ref<Logro[]>([])
const sesiones = ref<Sesion[]>([])
const error = ref<string | null>(null)
const guardandoAsistencia = ref<string | null>(null)

const sesionesPasadas = computed(() => {
  const ahora = Date.now()
  return [...sesiones.value]
    .filter((s) => new Date(s.fechaHora).getTime() <= ahora)
    .sort((a, b) => new Date(b.fechaHora).getTime() - new Date(a.fechaHora).getTime())
})

const sesionesProximas = computed(() => {
  const ahora = Date.now()
  return [...sesiones.value]
    .filter((s) => new Date(s.fechaHora).getTime() > ahora)
    .sort((a, b) => new Date(a.fechaHora).getTime() - new Date(b.fechaHora).getTime())
})

const nuevaFecha = ref('')
const nuevoLink = ref('')
const agendando = ref(false)

async function agendar() {
  if (!nuevaFecha.value) return
  error.value = null
  agendando.value = true
  try {
    const sesion = await agendarSesion(
      props.coacheeId,
      new Date(nuevaFecha.value).toISOString(),
      nuevoLink.value || undefined,
    )
    sesiones.value = [...sesiones.value, sesion]
    nuevaFecha.value = ''
    nuevoLink.value = ''
  } catch (err) {
    error.value = err instanceof ApiError ? err.message : 'No se pudo agendar la sesión.'
  } finally {
    agendando.value = false
  }
}

async function cambiarAsistencia(sesion: Sesion, valor: string) {
  if (valor === '') return
  error.value = null
  guardandoAsistencia.value = sesion.id
  try {
    const actualizada = await actualizarAsistencia(sesion.id, valor === 'true')
    const idx = sesiones.value.findIndex((s) => s.id === sesion.id)
    if (idx !== -1) sesiones.value[idx] = actualizada
  } catch (err) {
    error.value = err instanceof ApiError ? err.message : 'No se pudo guardar la asistencia.'
  } finally {
    guardandoAsistencia.value = null
  }
}

const ultimaPostSesionPublicada = computed(() => {
  return [...sesiones.value]
    .filter((s) => s.postSesion?.publicada)
    .sort((a, b) => new Date(b.fechaHora).getTime() - new Date(a.fechaHora).getTime())[0]
    ?.postSesion ?? null
})

async function load() {
  loading.value = true
  const [coachee, a, p, l, s] = await Promise.all([
    getCoachee(props.coacheeId),
    getAvanceDeCoachee(props.coacheeId),
    getLineaProgresoDeCoachee(props.coacheeId),
    getLogrosDeCoachee(props.coacheeId),
    getSesionesDeCoachee(props.coacheeId),
  ])
  nombreCoachee.value = coachee.nombre
  avance.value = a.avance
  puntos.value = p
  logros.value = l
  sesiones.value = s
  loading.value = false
}

onMounted(load)
</script>

<template>
  <AppShell>
    <div
      v-if="loading"
      class="text-sm text-[var(--color-ink)]/60"
    >
      Cargando…
    </div>
    <div v-else>
      <div class="mb-4 flex items-center justify-between">
        <h1 class="font-[family-name:var(--font-heading)] text-xl font-semibold">
          Seguimiento de {{ nombreCoachee }}
        </h1>
        <RouterLink
          :to="{ name: 'coach-ciclo', params: { coacheeId: props.coacheeId } }"
          class="text-sm text-[var(--color-sage)] underline"
        >
          Ver ciclo
        </RouterLink>
      </div>

      <div class="mb-4 rounded-2xl border border-[var(--color-line)] bg-white p-4">
        <h2 class="mb-1 text-sm font-medium">
          Avance general
        </h2>
        <p
          v-if="avance === null"
          class="text-sm text-[var(--color-ink)]/60"
        >
          El coachee aún no se ha autoevaluado en ningún post-sesión.
        </p>
        <p
          v-else
          class="font-[family-name:var(--font-mono)] text-3xl text-[var(--color-sage)]"
        >
          {{ avance }}%
        </p>
      </div>

      <div class="mb-4 rounded-2xl border border-[var(--color-line)] bg-white p-4">
        <h2 class="mb-3 text-sm font-medium">
          Línea de tiempo (cercanía al objetivo por sesión)
        </h2>
        <ProgresoLineaTiempo :puntos="puntos" />
      </div>

      <div
        v-if="ultimaPostSesionPublicada"
        class="mb-4 rounded-2xl border border-[var(--color-line)] bg-white p-4 text-sm"
      >
        <h2 class="mb-2 text-sm font-medium">
          Recomendación y temas de la última sesión
        </h2>
        <p v-if="ultimaPostSesionPublicada.recomendacion">
          <strong>Recomendación del coachee:</strong> {{ ultimaPostSesionPublicada.recomendacion }}
        </p>
        <p v-if="ultimaPostSesionPublicada.temasProximaSesion">
          <strong>Temas propuestos:</strong> {{ ultimaPostSesionPublicada.temasProximaSesion }}
        </p>
      </div>

      <div class="mb-4 rounded-2xl border border-[var(--color-line)] bg-white p-4">
        <h2 class="mb-3 text-sm font-medium">
          Próximas sesiones
        </h2>
        <p
          v-if="error"
          class="mb-2 text-sm text-[var(--color-bronze)]"
        >
          {{ error }}
        </p>
        <p
          v-if="sesionesProximas.length === 0"
          class="mb-3 text-sm text-[var(--color-ink)]/60"
        >
          No hay sesiones agendadas.
        </p>
        <ul
          v-else
          class="mb-3 space-y-1 text-sm"
        >
          <li
            v-for="s in sesionesProximas"
            :key="s.id"
          >
            {{ new Date(s.fechaHora).toLocaleString('es-CL') }}
            <a
              v-if="s.linkVideollamada"
              :href="s.linkVideollamada"
              target="_blank"
              rel="noopener"
              class="text-[var(--color-sage)] underline"
            >enlace</a>
          </li>
        </ul>
        <form
          class="flex flex-wrap items-end gap-2"
          @submit.prevent="agendar"
        >
          <label class="text-xs text-[var(--color-ink)]/60">
            Fecha y hora
            <input
              v-model="nuevaFecha"
              type="datetime-local"
              required
              class="mt-1 block rounded border border-[var(--color-line)] px-2 py-1 text-sm"
            >
          </label>
          <label class="text-xs text-[var(--color-ink)]/60">
            Link de videollamada (opcional)
            <input
              v-model="nuevoLink"
              type="url"
              placeholder="https://…"
              class="mt-1 block w-56 rounded border border-[var(--color-line)] px-2 py-1 text-sm"
            >
          </label>
          <button
            type="submit"
            :disabled="agendando"
            class="rounded-lg bg-[var(--color-ink)] px-3 py-2 text-xs text-[var(--color-parchment)] disabled:opacity-50"
          >
            Agendar sesión
          </button>
        </form>
      </div>

      <div class="mb-4 rounded-2xl border border-[var(--color-line)] bg-white p-4">
        <h2 class="mb-3 text-sm font-medium">
          Asistencia a sesiones
        </h2>
        <p
          v-if="sesionesPasadas.length === 0"
          class="text-sm text-[var(--color-ink)]/60"
        >
          Todavía no hay sesiones pasadas.
        </p>
        <ul
          v-else
          class="space-y-2 text-sm"
        >
          <li
            v-for="s in sesionesPasadas"
            :key="s.id"
            class="flex items-center justify-between gap-3"
          >
            <span class="font-[family-name:var(--font-mono)] text-[var(--color-ink)]/60">
              {{ new Date(s.fechaHora).toLocaleDateString('es-CL') }}
            </span>
            <select
              :value="s.asistio === null || s.asistio === undefined ? '' : String(s.asistio)"
              :disabled="guardandoAsistencia === s.id"
              class="rounded border border-[var(--color-line)] px-2 py-1 text-xs"
              @change="cambiarAsistencia(s, ($event.target as HTMLSelectElement).value)"
            >
              <option value="">
                Sin registrar
              </option>
              <option value="true">
                Asistió
              </option>
              <option value="false">
                No asistió
              </option>
            </select>
          </li>
        </ul>
      </div>

      <div class="rounded-2xl border border-[var(--color-line)] bg-white p-4">
        <h2 class="mb-3 text-sm font-medium">
          Logros
        </h2>
        <ul
          v-if="logros.length"
          class="space-y-1 text-sm"
        >
          <li
            v-for="logro in logros"
            :key="logro.id"
          >
            <span class="font-[family-name:var(--font-mono)] text-[var(--color-ink)]/50">{{ logro.fecha }}</span>
            — {{ logro.descripcion }}
          </li>
        </ul>
        <p
          v-else
          class="text-sm text-[var(--color-ink)]/60"
        >
          Sin logros registrados todavía.
        </p>
      </div>
    </div>
  </AppShell>
</template>
