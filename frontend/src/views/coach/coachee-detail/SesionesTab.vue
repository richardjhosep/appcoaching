<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch, type ComponentPublicInstance } from 'vue'
import ProgresoCamino from '../../../components/ProgresoCamino.vue'
import WeekCalendar from '../../../components/WeekCalendar.vue'
import AppModal from '../../../components/AppModal.vue'
import ReagendarSesionModal from '../../../components/ReagendarSesionModal.vue'
import SkeletonBlock from '../../../components/SkeletonBlock.vue'
import {
  actualizarAsistencia,
  actualizarRegistroSesion,
  agendarSesion,
  getSesionesDeCoachee,
  type RegistroSesionInput,
  type Sesion,
} from '../../../api/sesiones'
import {
  getLineaProgresoDeCoachee,
  getLogrosDeCoachee,
  type Logro,
  type PuntoProgreso,
} from '../../../api/seguimiento'
import {
  getSolicitudesReagendamiento,
  responderSolicitudReagendamiento,
  type SolicitudReagendamiento,
} from '../../../api/solicitudes-reagendamiento'
import { ApiError } from '../../../api/client'
import { aDatetimeLocal } from '../../../lib/dateRange'

const props = defineProps<{ coacheeId: string }>()

const loading = ref(true)
const puntos = ref<PuntoProgreso[]>([])
const logros = ref<Logro[]>([])
const sesiones = ref<Sesion[]>([])
const solicitudesReagendamiento = ref<SolicitudReagendamiento[]>([])
const error = ref<string | null>(null)
const guardandoAsistencia = ref<string | null>(null)
const guardandoNotas = ref<string | null>(null)
const registroEdit = ref<Record<string, RegistroSesionInput>>({})

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

// `fechaHoraPrefill` viene de elegir un slot vacío en el calendario (clic o arrastre) —
// el botón "+ Nueva sesión" la deja vacía para que el coach escriba la fecha a mano.
function abrirModalAgendar(fechaHoraPrefill?: string) {
  nuevaFecha.value = fechaHoraPrefill ? aDatetimeLocal(new Date(fechaHoraPrefill)) : ''
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
    sembrarRegistro([sesion])
    modalAgendarOpen.value = false
  } catch (err) {
    errorAgendar.value = err instanceof ApiError ? err.message : 'No se pudo agendar la sesión.'
  } finally {
    agendando.value = false
  }
}

const responderModalOpen = ref(false)
const solicitudSeleccionada = ref<SolicitudReagendamiento | null>(null)
const responderForm = reactive({ nuevaFechaHora: '', respuestaCoach: '' })
const guardandoRespuesta = ref(false)
const errorResponder = ref<string | null>(null)

function abrirResponder(s: SolicitudReagendamiento) {
  solicitudSeleccionada.value = s
  responderForm.nuevaFechaHora = ''
  responderForm.respuestaCoach = ''
  errorResponder.value = null
  responderModalOpen.value = true
}

async function guardarRespuesta() {
  const solicitud = solicitudSeleccionada.value
  if (!solicitud) return
  errorResponder.value = null
  guardandoRespuesta.value = true
  try {
    await responderSolicitudReagendamiento(solicitud.id, {
      nuevaFechaHora: responderForm.nuevaFechaHora
        ? new Date(responderForm.nuevaFechaHora).toISOString()
        : undefined,
      respuestaCoach: responderForm.respuestaCoach || undefined,
    })
    solicitudesReagendamiento.value = solicitudesReagendamiento.value.filter(
      (s) => s.id !== solicitud.id,
    )
    responderModalOpen.value = false
  } catch (err) {
    errorResponder.value = err instanceof ApiError ? err.message : 'No se pudo enviar la respuesta.'
  } finally {
    guardandoRespuesta.value = false
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

// registroEdit se siembra completo en load(), pero sesiones.value se sigue mutando
// después (agendar, recarga tras eliminar) — sin esto, una sesión nueva que caiga en el
// pasado no tiene entrada en registroEdit y el template revienta al hacer
// `registroEdit[s.id]!.resumenCompartido` sobre undefined (la sección entera dejaba de
// renderizar). Aditivo a propósito: nunca pisa una edición local ya en curso.
function sembrarRegistro(lista: Sesion[]) {
  for (const sesion of lista) {
    if (registroEdit.value[sesion.id]) continue
    registroEdit.value[sesion.id] = {
      resumenCompartido: sesion.resumenCompartido ?? '',
      notasPrivadas: sesion.notasPrivadas ?? '',
      temaTratado: sesion.temaTratado ?? '',
      ejerciciosAplicados: sesion.ejerciciosAplicados ?? '',
      acuerdos: sesion.acuerdos ?? '',
    }
  }
}

async function guardarRegistro(sesion: Sesion) {
  const registro = registroEdit.value[sesion.id]
  if (!registro) return
  error.value = null
  guardandoNotas.value = sesion.id
  try {
    const actualizada = await actualizarRegistroSesion(sesion.id, registro)
    const idx = sesiones.value.findIndex((s) => s.id === sesion.id)
    if (idx !== -1) sesiones.value[idx] = actualizada
  } catch (err) {
    error.value = err instanceof ApiError ? err.message : 'No se pudo guardar el registro de la sesión.'
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
  const [p, l, s, r] = await Promise.all([
    getLineaProgresoDeCoachee(props.coacheeId),
    getLogrosDeCoachee(props.coacheeId),
    getSesionesDeCoachee(props.coacheeId),
    getSolicitudesReagendamiento(),
  ])
  puntos.value = p
  logros.value = l
  sesiones.value = s
  // Reset completo (no aditivo) acá: al cambiar de coachee (watch más abajo) no debe
  // arrastrarse ninguna edición sin guardar del coachee anterior.
  registroEdit.value = {}
  sembrarRegistro(s)
  solicitudesReagendamiento.value = r.filter((sol) => sol.coacheeId === props.coacheeId)
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

// --- Reagendar sesión directamente desde el calendario ----------------------
const sesionAReagendar = ref<Sesion | null>(null)

function abrirReagendar(sesionId: string) {
  sesionAReagendar.value = sesiones.value.find((s) => s.id === sesionId) ?? null
}

function onReagendada(actualizada: Sesion) {
  const idx = sesiones.value.findIndex((s) => s.id === actualizada.id)
  if (idx !== -1) sesiones.value[idx] = actualizada
  sembrarRegistro([actualizada])
  sesionAReagendar.value = null
}

// Igual que en AgendaView: "toda la serie" puede borrar más de una sesión a la vez, así
// que se recarga desde el backend en vez de adivinar cuáles quitar del arreglo local.
async function onSesionEliminada() {
  sesiones.value = await getSesionesDeCoachee(props.coacheeId)
  sembrarRegistro(sesiones.value)
}
</script>

<template>
  <SkeletonBlock v-if="loading" />
  <div v-else>
    <div class="items-start mt-6 lg:grid lg:grid-cols-12 lg:gap-6">
      <!-- Columna principal: operativa y progreso -->
      <div class="space-y-6 lg:col-span-8">
        <div class="rounded-2xl border border-[var(--color-line)] bg-white p-6 shadow-sm">
          <h2 class="mb-3 text-sm font-medium">
            Camino de crecimiento
          </h2>
          <ProgresoCamino
            :puntos="puntos"
            audiencia="coachee"
          />
        </div>

        <div
          v-if="ultimaPostSesionPublicada"
          class="rounded-2xl border border-[var(--color-line)] bg-white p-4 text-sm shadow-sm"
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
          :sesiones="sesiones"
          puede-agendar
          puede-editar
          @select="onSelectSesion"
          @nueva-sesion="abrirModalAgendar()"
          @crear-en="abrirModalAgendar"
          @reagendar="abrirReagendar"
          @reagendada="onReagendada"
          @eliminada="onSesionEliminada"
        />

        <div class="space-y-3 rounded-2xl border border-[var(--color-line)] bg-white p-6 shadow-sm">
          <h2 class="text-sm font-medium">
            Sesiones pasadas — registro de la sesión
          </h2>
          <p class="text-xs text-[var(--color-muted)]">
            Todo lo de abajo es visible para el coachee, salvo las notas privadas.
          </p>
          <p
            v-if="error"
            class="text-sm text-[var(--color-danger)]"
          >
            {{ error }}
          </p>
          <p
            v-if="sesionesPasadas.length === 0"
            class="text-sm text-[var(--color-muted)]"
          >
            Todavía no hay sesiones pasadas.
          </p>
          <ul
            v-else
            class="divide-y divide-[var(--color-line)] text-sm"
          >
            <li
              v-for="s in sesionesPasadas"
              :key="s.id"
              :ref="(el) => setSesionRef(s.id, el)"
              class="-mx-1 px-1 py-4 transition-shadow first:pt-0 last:pb-0"
              :class="highlightedId === s.id ? 'rounded-xl ring-2 ring-[var(--color-sage)]' : ''"
            >
              <div class="mb-2 flex items-center justify-between gap-3">
                <span class="cifra text-[var(--color-muted)]">
                  {{ new Date(s.fechaHora).toLocaleDateString('es-CL') }}
                </span>
                <select
                  :value="s.asistio === null || s.asistio === undefined ? '' : String(s.asistio)"
                  :disabled="guardandoAsistencia === s.id"
                  class="rounded border border-[var(--color-line)] px-2 py-1 text-xs focus:border-[var(--color-sage)] focus:outline-none focus:ring-2 focus:ring-[var(--color-sage)]/30"
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
                  class="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-saltup)]/10 px-3 py-1 text-xs text-[var(--color-saltup)] hover:bg-[var(--color-saltup)]/20"
                >
                  <svg
                    width="11"
                    height="11"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  ><path d="M8 5v14l11-7z" /></svg>
                  Ver grabación de la sesión
                </a>
                <span
                  v-else
                  class="inline-flex items-center rounded-full border border-[var(--color-danger)]/10 bg-[var(--color-danger)]/5 px-2.5 py-1 text-xs font-medium text-[var(--color-danger)]"
                >Esta sesión no fue grabada.</span>
              </p>
              <div class="mb-2 grid gap-2 sm:grid-cols-2">
                <label class="block text-xs">
                  Resumen compartido
                  <textarea
                    v-model="registroEdit[s.id]!.resumenCompartido"
                    rows="2"
                    placeholder="Lo que el coachee puede ver de esta sesión…"
                    class="mt-1 block w-full rounded-xl border border-[var(--color-line)] p-3 text-xs focus:border-[var(--color-saltup)] focus:outline-none focus:ring-2 focus:ring-[var(--color-saltup)]/30"
                  />
                </label>
                <label class="block text-xs">
                  Tema tratado
                  <textarea
                    v-model="registroEdit[s.id]!.temaTratado"
                    rows="2"
                    placeholder="Tema principal de la sesión…"
                    class="mt-1 block w-full rounded-xl border border-[var(--color-line)] p-3 text-xs focus:border-[var(--color-saltup)] focus:outline-none focus:ring-2 focus:ring-[var(--color-saltup)]/30"
                  />
                </label>
                <label class="block text-xs">
                  Ejercicios/assessments aplicados
                  <textarea
                    v-model="registroEdit[s.id]!.ejerciciosAplicados"
                    rows="2"
                    placeholder="Ejercicios o assessments usados en la sesión…"
                    class="mt-1 block w-full rounded-xl border border-[var(--color-line)] p-3 text-xs focus:border-[var(--color-saltup)] focus:outline-none focus:ring-2 focus:ring-[var(--color-saltup)]/30"
                  />
                </label>
                <label class="block text-xs">
                  Acuerdos
                  <textarea
                    v-model="registroEdit[s.id]!.acuerdos"
                    rows="2"
                    placeholder="Acuerdos alcanzados en la sesión…"
                    class="mt-1 block w-full rounded-xl border border-[var(--color-line)] p-3 text-xs focus:border-[var(--color-saltup)] focus:outline-none focus:ring-2 focus:ring-[var(--color-saltup)]/30"
                  />
                </label>
                <label class="block text-xs sm:col-span-2">
                  Notas privadas <span class="text-[var(--color-muted)]">(nunca visibles para el coachee ni la empresa)</span>
                  <textarea
                    v-model="registroEdit[s.id]!.notasPrivadas"
                    rows="2"
                    placeholder="Notas privadas de esta sesión…"
                    class="mt-1 block w-full rounded-xl border border-[var(--color-line)] p-3 text-xs focus:border-[var(--color-saltup)] focus:outline-none focus:ring-2 focus:ring-[var(--color-saltup)]/30"
                  />
                </label>
              </div>
              <button
                class="rounded-lg border border-[var(--color-line)] px-3 py-1.5 text-xs hover:bg-[var(--color-parchment)]/50 disabled:opacity-60"
                :disabled="guardandoNotas === s.id"
                @click="guardarRegistro(s)"
              >
                Guardar registro
              </button>
            </li>
          </ul>
        </div>
      </div>

      <!-- Columna lateral: alertas y contexto -->
      <div class="mt-6 space-y-6 lg:col-span-4 lg:mt-0">
        <div
          v-if="solicitudesReagendamiento.length"
          class="rounded-2xl border border-[var(--color-bronze)]/20 bg-[var(--color-bronze)]/5 p-5"
        >
          <h2 class="mb-3 text-sm font-medium">
            Solicitudes de reagendamiento ({{ solicitudesReagendamiento.length }})
          </h2>
          <ul class="space-y-2 text-sm">
            <li
              v-for="s in solicitudesReagendamiento"
              :key="s.id"
              class="rounded-xl border border-[var(--color-line)] bg-white p-3"
            >
              <p class="font-medium">
                Sesión del {{ s.sesion ? new Date(s.sesion.fechaHora).toLocaleString('es-CL') : '—' }}
              </p>
              <p
                v-if="s.motivo"
                class="text-[var(--color-muted)]"
              >
                {{ s.motivo }}
              </p>
              <button
                class="mt-2 w-full rounded-lg bg-[var(--color-primary)] px-3 py-2 text-xs text-[var(--color-on-primary)]"
                @click="abrirResponder(s)"
              >
                Responder
              </button>
            </li>
          </ul>
        </div>

        <div class="rounded-2xl border border-[var(--color-line)] bg-white p-5 shadow-sm">
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
              <span class="cifra text-[var(--color-muted)]">{{ logro.fecha }}</span>
              — {{ logro.descripcion }}
              <span
                v-if="logro.situacion"
                class="block text-xs text-[var(--color-muted)]"
              >
                Situación: {{ logro.situacion }}
              </span>
            </li>
          </ul>
          <p
            v-else
            class="text-sm text-[var(--color-muted)]"
          >
            Sin logros registrados todavía.
          </p>
        </div>
      </div>
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
            class="rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm text-[var(--color-on-primary)] disabled:opacity-60"
          >
            {{ agendando ? 'Agendando…' : 'Agendar sesión' }}
          </button>
        </div>
      </form>
    </AppModal>

    <AppModal
      v-if="responderModalOpen"
      title="Responder solicitud de reagendamiento"
      @close="responderModalOpen = false"
    >
      <form
        class="space-y-4"
        @submit.prevent="guardarRespuesta"
      >
        <p
          v-if="errorResponder"
          class="text-sm text-[var(--color-danger)]"
        >
          {{ errorResponder }}
        </p>
        <div
          v-if="solicitudSeleccionada"
          class="rounded-lg bg-[var(--color-parchment)]/50 p-3 text-sm"
        >
          <p class="text-[var(--color-muted)]">
            Sesión actual: {{ solicitudSeleccionada.sesion ? new Date(solicitudSeleccionada.sesion.fechaHora).toLocaleString('es-CL') : '—' }}
          </p>
          <p
            v-if="solicitudSeleccionada.motivo"
            class="text-[var(--color-muted)]"
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
            class="rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm text-[var(--color-on-primary)] disabled:opacity-60"
          >
            {{ guardandoRespuesta ? 'Guardando…' : 'Guardar' }}
          </button>
        </div>
      </form>
    </AppModal>

    <ReagendarSesionModal
      v-if="sesionAReagendar"
      :sesion="sesionAReagendar"
      @close="sesionAReagendar = null"
      @reagendada="onReagendada"
    />
  </div>
</template>
