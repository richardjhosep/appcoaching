<script setup lang="ts">
import { computed, onMounted, ref, watch, type ComponentPublicInstance } from 'vue'
import ProgresoLineaTiempo from '../../../components/ProgresoLineaTiempo.vue'
import WeekCalendar from '../../../components/WeekCalendar.vue'
import AppModal from '../../../components/AppModal.vue'
import {
  actualizarAsistencia,
  actualizarNotasPrivadas,
  agendarSesion,
  getSesionesDeCoachee,
  type Sesion,
} from '../../../api/sesiones'
import {
  getAvanceDeCoachee,
  getLineaProgresoDeCoachee,
  getLogrosDeCoachee,
  type Logro,
  type PuntoProgreso,
} from '../../../api/seguimiento'
import { ApiError } from '../../../api/client'
import { nivelProgreso, coloresNivel } from '../../../lib/nivelProgreso'

const props = defineProps<{ coacheeId: string }>()

const loading = ref(true)
const avance = ref<number | null>(null)
const puntos = ref<PuntoProgreso[]>([])
const logros = ref<Logro[]>([])
const sesiones = ref<Sesion[]>([])
const error = ref<string | null>(null)
const guardandoAsistencia = ref<string | null>(null)
const guardandoNotas = ref<string | null>(null)
const notasEdit = ref<Record<string, string>>({})

const coloresAvance = computed(() => coloresNivel[nivelProgreso(avance.value ?? 0)])

const sesionesPasadas = computed(() => {
  const ahora = Date.now()
  return [...sesiones.value]
    .filter((s) => new Date(s.fechaHora).getTime() <= ahora)
    .sort((a, b) => new Date(b.fechaHora).getTime() - new Date(a.fechaHora).getTime())
})

const nuevaFecha = ref('')
const nuevoLink = ref('')
const agendando = ref(false)
const modalAgendarOpen = ref(false)
const errorAgendar = ref<string | null>(null)

function abrirModalAgendar() {
  nuevaFecha.value = ''
  nuevoLink.value = ''
  errorAgendar.value = null
  modalAgendarOpen.value = true
}

async function agendar() {
  if (!nuevaFecha.value) return
  errorAgendar.value = null
  agendando.value = true
  try {
    const sesion = await agendarSesion(
      props.coacheeId,
      new Date(nuevaFecha.value).toISOString(),
      nuevoLink.value || undefined,
    )
    sesiones.value = [...sesiones.value, sesion]
    modalAgendarOpen.value = false
  } catch (err) {
    errorAgendar.value = err instanceof ApiError ? err.message : 'No se pudo agendar la sesión.'
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

async function guardarNotas(sesion: Sesion) {
  const texto = notasEdit.value[sesion.id] ?? ''
  error.value = null
  guardandoNotas.value = sesion.id
  try {
    const actualizada = await actualizarNotasPrivadas(sesion.id, texto)
    const idx = sesiones.value.findIndex((s) => s.id === sesion.id)
    if (idx !== -1) sesiones.value[idx] = actualizada
  } catch (err) {
    error.value = err instanceof ApiError ? err.message : 'No se pudieron guardar las notas.'
  } finally {
    guardandoNotas.value = null
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
  const [a, p, l, s] = await Promise.all([
    getAvanceDeCoachee(props.coacheeId),
    getLineaProgresoDeCoachee(props.coacheeId),
    getLogrosDeCoachee(props.coacheeId),
    getSesionesDeCoachee(props.coacheeId),
  ])
  avance.value = a.avance
  puntos.value = p
  logros.value = l
  sesiones.value = s
  notasEdit.value = Object.fromEntries(s.map((sesion) => [sesion.id, sesion.notasPrivadas ?? '']))
  loading.value = false
}

onMounted(load)
watch(() => props.coacheeId, load)

const sesionRefs = ref<Record<string, HTMLElement | null>>({})
const highlightedId = ref<string | null>(null)

function setSesionRef(id: string, el: Element | ComponentPublicInstance | null) {
  sesionRefs.value[id] = el as HTMLElement | null
}

function onSelectSesion(id: string) {
  sesionRefs.value[id]?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  highlightedId.value = id
  setTimeout(() => {
    if (highlightedId.value === id) highlightedId.value = null
  }, 2000)
}
</script>

<template>
  <div
    v-if="loading"
    class="text-sm text-[var(--color-ink)]/60"
  >
    Cargando…
  </div>
  <div v-else>
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
      <template v-else>
        <p
          class="mb-2 font-[family-name:var(--font-mono)] text-3xl"
          :class="coloresAvance.texto"
        >
          {{ avance }}%
        </p>
        <div
          class="h-2.5 w-full overflow-hidden rounded-full"
          :style="{ backgroundColor: coloresAvance.suave }"
          role="progressbar"
          :aria-valuenow="avance ?? 0"
          aria-valuemin="0"
          aria-valuemax="100"
        >
          <div
            class="h-full rounded-full transition-all"
            :style="{ width: `${avance}%`, backgroundColor: coloresAvance.fuerte }"
          />
        </div>
      </template>
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

    <WeekCalendar
      class="mb-4"
      :sesiones="sesiones"
      puede-agendar
      @select="onSelectSesion"
      @nueva-sesion="abrirModalAgendar"
    />

    <div class="mb-4 rounded-2xl border border-[var(--color-line)] bg-white p-4">
      <h2 class="mb-3 text-sm font-medium">
        Sesiones pasadas — asistencia y notas privadas
      </h2>
      <p class="mb-3 text-xs text-[var(--color-ink)]/50">
        Las notas privadas nunca son visibles para el coachee ni la empresa.
      </p>
      <p
        v-if="error"
        class="mb-3 text-sm text-[var(--color-danger)]"
      >
        {{ error }}
      </p>
      <p
        v-if="sesionesPasadas.length === 0"
        class="text-sm text-[var(--color-ink)]/60"
      >
        Todavía no hay sesiones pasadas.
      </p>
      <ul
        v-else
        class="space-y-3 text-sm"
      >
        <li
          v-for="s in sesionesPasadas"
          :key="s.id"
          :ref="(el) => setSesionRef(s.id, el)"
          class="rounded-xl border border-[var(--color-line)]/60 p-3 transition-shadow"
          :class="highlightedId === s.id ? 'ring-2 ring-[var(--color-sage)]' : ''"
        >
          <div class="mb-2 flex items-center justify-between gap-3">
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
          </div>
          <p class="mb-2">
            <a
              v-if="s.linkVideollamada"
              :href="s.linkVideollamada"
              target="_blank"
              rel="noopener"
              class="text-[var(--color-sage)] underline"
            >Ver grabación de la sesión</a>
            <span
              v-else
              class="text-[var(--color-ink)]/50"
            >Esta sesión no fue grabada.</span>
          </p>
          <textarea
            v-model="notasEdit[s.id]"
            rows="2"
            placeholder="Notas privadas de esta sesión…"
            class="mb-2 block w-full rounded border border-[var(--color-line)] px-2 py-1 text-xs"
          />
          <button
            class="rounded-lg border border-[var(--color-line)] px-3 py-1.5 text-xs hover:bg-[var(--color-parchment)]/50 disabled:opacity-60"
            :disabled="guardandoNotas === s.id"
            @click="guardarNotas(s)"
          >
            Guardar notas
          </button>
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

    <AppModal
      v-if="modalAgendarOpen"
      title="Agendar sesión"
      @close="modalAgendarOpen = false"
    >
      <form
        class="space-y-4"
        @submit.prevent="agendar"
      >
        <p
          v-if="errorAgendar"
          class="text-sm text-[var(--color-danger)]"
        >
          {{ errorAgendar }}
        </p>
        <label class="block text-sm">
          Fecha y hora
          <input
            v-model="nuevaFecha"
            type="datetime-local"
            required
            class="mt-1 w-full rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm"
          >
        </label>
        <label class="block text-sm">
          Link de videollamada (opcional)
          <input
            v-model="nuevoLink"
            type="url"
            placeholder="https://…"
            class="mt-1 w-full rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm"
          >
        </label>
        <div class="flex justify-end gap-2 pt-2">
          <button
            type="button"
            class="rounded-lg border border-[var(--color-line)] px-4 py-2 text-sm"
            @click="modalAgendarOpen = false"
          >
            Cancelar
          </button>
          <button
            type="submit"
            :disabled="agendando"
            class="rounded-lg bg-[var(--color-ink)] px-4 py-2 text-sm text-[var(--color-parchment)] disabled:opacity-60"
          >
            {{ agendando ? 'Agendando…' : 'Agendar sesión' }}
          </button>
        </div>
      </form>
    </AppModal>
  </div>
</template>
