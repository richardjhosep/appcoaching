<script setup lang="ts">
import { computed, onMounted, reactive, ref, type ComponentPublicInstance } from 'vue'
import AppShell from '../../components/AppShell.vue'
import AppModal from '../../components/AppModal.vue'
import WeekCalendar from '../../components/WeekCalendar.vue'
import DisponibilidadCalendar from '../../components/DisponibilidadCalendar.vue'
import EmptyState from '../../components/EmptyState.vue'
import NavIcon from '../../components/NavIcon.vue'
import SkeletonBlock from '../../components/SkeletonBlock.vue'
import ErrorState from '../../components/ErrorState.vue'
import AppButton from '../../components/AppButton.vue'
import StatusBadge from '../../components/StatusBadge.vue'
import RatingSelector from '../../components/RatingSelector.vue'
import FormField from '../../components/FormField.vue'
import {
  getMisSesiones,
  guardarPostSesion,
  publicarPostSesion,
  solicitarReagendamiento,
  confirmarSesion,
  getMisReagendamientos,
  type Sesion,
  type SolicitudReagendamientoMia,
} from '../../api/sesiones'
import { getSlotsLibres } from '../../api/disponibilidad'
import { getMiCicloActual, type Ciclo } from '../../api/ciclos'
import { crearSolicitudSesion } from '../../api/solicitudes-sesion'
import { ApiError } from '../../api/client'
import { notifySuccess, notifyError, confirmDialog } from '../../lib/notify'
import { useCarga } from '../../lib/useCarga'
import { nivelProgreso, coloresNivel } from '../../lib/nivelProgreso'

function coloresCercania(valor: number) {
  return coloresNivel[nivelProgreso(valor * 10)]
}

const sesiones = ref<Sesion[]>([])
const savingId = ref<string | null>(null)
const errorPorSesion = reactive<Record<string, string>>({})

// Estado de mis solicitudes de reagendamiento: una sesión con solicitud pendiente muestra el
// chip y no deja pedir otra (el backend también lo rechaza).
const solicitudesReagendamiento = ref<SolicitudReagendamientoMia[]>([])
const sesionIdsConSolicitudPendiente = computed(
  () => new Set(solicitudesReagendamiento.value.filter((r) => r.estado === 'pendiente').map((r) => r.sesionId)),
)
const tieneSolicitudPendiente = (sesion: Sesion) => sesionIdsConSolicitudPendiente.value.has(sesion.id)

const reagendarModalOpen = ref(false)
const sesionParaReagendar = ref<Sesion | null>(null)
const motivoReagendamiento = ref('')
const enviandoReagendamiento = ref(false)

function abrirSolicitarReagendamiento(sesion: Sesion) {
  sesionParaReagendar.value = sesion
  motivoReagendamiento.value = ''
  reagendarModalOpen.value = true
}

async function enviarSolicitudReagendamiento() {
  const sesion = sesionParaReagendar.value
  if (!sesion) return
  enviandoReagendamiento.value = true
  try {
    await solicitarReagendamiento(sesion.id, motivoReagendamiento.value || undefined)
    reagendarModalOpen.value = false
    solicitudesReagendamiento.value = await getMisReagendamientos().catch(() => solicitudesReagendamiento.value)
    await notifySuccess('Solicitud enviada', 'Tu coach recibió tu solicitud de reagendamiento.')
  } catch (err) {
    await notifyError(
      'No se pudo enviar la solicitud',
      err instanceof ApiError ? err.message : 'Ocurrió un error inesperado.',
    )
  } finally {
    enviandoReagendamiento.value = false
  }
}

const confirmandoId = ref<string | null>(null)

async function confirmar(sesion: Sesion) {
  confirmandoId.value = sesion.id
  try {
    sesion.confirmada = (await confirmarSesion(sesion.id)).confirmada
  } catch (err) {
    await notifyError('No se pudo confirmar', err instanceof ApiError ? err.message : 'Ocurrió un error inesperado.')
  } finally {
    confirmandoId.value = null
  }
}

const slotsLibres = ref<string[]>([])

async function onCambioSemanaDisponibilidad(desde: string, hasta: string) {
  slotsLibres.value = await getSlotsLibres(desde, hasta)
}

const solicitarSesionModalOpen = ref(false)
const slotSeleccionado = ref<string | null>(null)
const motivoSolicitud = ref('')
const enviandoSolicitud = ref(false)

function abrirSolicitarSesion(iso: string) {
  slotSeleccionado.value = iso
  motivoSolicitud.value = ''
  solicitarSesionModalOpen.value = true
}

async function enviarSolicitudSesion() {
  const iso = slotSeleccionado.value
  if (!iso) return
  enviandoSolicitud.value = true
  try {
    await crearSolicitudSesion(iso, motivoSolicitud.value || undefined)
    solicitarSesionModalOpen.value = false
    // El slot recién pedido deja de estar disponible hasta que el coach responda.
    slotsLibres.value = slotsLibres.value.filter((s) => s !== iso)
    await notifySuccess('Solicitud enviada', 'Tu coach recibió tu pedido de sesión.')
  } catch (err) {
    await notifyError(
      'No se pudo enviar la solicitud',
      err instanceof ApiError ? err.message : 'Ocurrió un error inesperado.',
    )
  } finally {
    enviandoSolicitud.value = false
  }
}

const forms = reactive<
  Record<string, { aprendizaje: string; utilidad: number | null; cercaniaObjetivo: number | null; recomendacion: string; temasProximaSesion: string }>
>({})

function formFor(sesion: Sesion) {
  if (!forms[sesion.id]) {
    const p = sesion.postSesion
    forms[sesion.id] = {
      aprendizaje: p?.aprendizaje ?? '',
      utilidad: p?.utilidad ?? null,
      cercaniaObjetivo: p?.cercaniaObjetivo ?? null,
      recomendacion: p?.recomendacion ?? '',
      temasProximaSesion: p?.temasProximaSesion ?? '',
    }
  }
  return forms[sesion.id]
}

const sesionesOrdenadas = computed(() =>
  [...sesiones.value].sort(
    (a, b) => new Date(b.fechaHora).getTime() - new Date(a.fechaHora).getTime(),
  ),
)

function yaRealizada(sesion: Sesion): boolean {
  return new Date(sesion.fechaHora).getTime() <= Date.now()
}

const cicloActual = ref<Ciclo | null>(null)

const { loading, error, recargar, tolerar } = useCarga(async () => {
  // Las sesiones son críticas; ciclo y solicitudes de reagendamiento son complementarios.
  const [s, c, r] = await Promise.all([
    getMisSesiones(),
    tolerar(getMiCicloActual()),
    tolerar(getMisReagendamientos()),
  ])
  sesiones.value = s
  cicloActual.value = c ?? null
  solicitudesReagendamiento.value = r ?? []
})

// Resumen rápido de lo que falta: las agendadas a futuro (más próxima primero) y, si hay ciclo
// abierto, cuántas del total contratado todavía no tienen fecha.
const proximasSesiones = computed(() =>
  sesiones.value
    .filter((s) => !yaRealizada(s))
    .sort((a, b) => new Date(a.fechaHora).getTime() - new Date(b.fechaHora).getTime()),
)
const sesionesPorAgendar = computed(() =>
  cicloActual.value ? Math.max(0, cicloActual.value.sesionesRestantes - proximasSesiones.value.length) : 0,
)

const calendarioRef = ref<InstanceType<typeof WeekCalendar> | null>(null)
const calendarioContenedor = ref<HTMLElement | null>(null)

// Clic en una próxima sesión: lleva el calendario a esa semana y lo muestra, y además resalta
// su tarjeta de detalle (mismo efecto que hacer clic en el bloque dentro del calendario).
function irASesion(sesion: Sesion) {
  calendarioRef.value?.irASemanaDe(new Date(sesion.fechaHora))
  calendarioContenedor.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  highlightedId.value = sesion.id
  setTimeout(() => {
    if (highlightedId.value === sesion.id) highlightedId.value = null
  }, 2000)
}

function formatoProxima(iso: string): string {
  return new Date(iso).toLocaleString('es-CL', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

onMounted(recargar)

function cuerpoPostSesion(sesion: Sesion) {
  const f = formFor(sesion)
  return {
    aprendizaje: f.aprendizaje.trim() || undefined,
    utilidad: f.utilidad ?? undefined,
    cercaniaObjetivo: f.cercaniaObjetivo ?? undefined,
    recomendacion: f.recomendacion.trim() || undefined,
    temasProximaSesion: f.temasProximaSesion.trim() || undefined,
  }
}

// Obligatorios para publicar (los mismos que exige el backend).
const erroresPublicar = reactive<Record<string, { aprendizaje?: string; utilidad?: string; cercania?: string }>>({})

function validarParaPublicar(sesion: Sesion): boolean {
  const f = formFor(sesion)
  const errores = {
    aprendizaje: f.aprendizaje.trim() ? undefined : 'Cuéntanos tu aprendizaje principal.',
    utilidad: f.utilidad ? undefined : 'Elige qué tan útil fue la sesión.',
    cercania: f.cercaniaObjetivo ? undefined : 'Elige qué tan cerca estás de tu objetivo.',
  }
  erroresPublicar[sesion.id] = errores
  return !errores.aprendizaje && !errores.utilidad && !errores.cercania
}

async function guardarBorrador(sesion: Sesion) {
  savingId.value = sesion.id
  errorPorSesion[sesion.id] = ''
  try {
    sesion.postSesion = await guardarPostSesion(sesion.id, cuerpoPostSesion(sesion))
    await notifySuccess('Borrador guardado')
  } catch (err) {
    errorPorSesion[sesion.id] = err instanceof ApiError ? err.message : 'No se pudo guardar.'
  } finally {
    savingId.value = null
  }
}

async function publicar(sesion: Sesion) {
  errorPorSesion[sesion.id] = ''
  if (!validarParaPublicar(sesion)) return
  // Publicar es irreversible: confirmar antes.
  const ok = await confirmDialog({
    title: '¿Publicar tu post-sesión?',
    text: 'Una vez publicado no podrás editarlo y tu coach lo verá.',
    confirmText: 'Publicar',
  })
  if (!ok) return
  savingId.value = sesion.id
  try {
    // El backend publica lo guardado: se guarda lo escrito primero, así no se pierde nada.
    await guardarPostSesion(sesion.id, cuerpoPostSesion(sesion))
    sesion.postSesion = await publicarPostSesion(sesion.id)
    await notifySuccess('Post-sesión publicada')
  } catch (err) {
    errorPorSesion[sesion.id] = err instanceof ApiError ? err.message : 'No se pudo publicar.'
  } finally {
    savingId.value = null
  }
}

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
  <AppShell>
    <h1 class="mb-4 font-[family-name:var(--font-heading)] text-xl font-semibold">
      Mis sesiones
    </h1>
    <section
      v-if="!loading && !error && (proximasSesiones.length > 0 || cicloActual)"
      class="mb-4 rounded-2xl border border-[var(--color-line)] bg-white p-4"
      aria-label="Próximas sesiones"
    >
      <div class="mb-2 flex flex-wrap items-baseline justify-between gap-2">
        <h2 class="text-sm font-semibold">
          Próximas sesiones
        </h2>
        <p
          v-if="cicloActual"
          class="text-xs text-[var(--color-muted)]"
        >
          Te quedan <strong class="text-[var(--color-ink)]">{{ cicloActual.sesionesRestantes }}</strong>
          de {{ cicloActual.totalSesiones }} sesiones del proceso<span v-if="sesionesPorAgendar > 0"> · {{ sesionesPorAgendar }} aún sin fecha</span>
        </p>
      </div>
      <ul
        v-if="proximasSesiones.length > 0"
        class="flex flex-wrap gap-2"
      >
        <li
          v-for="(s, i) in proximasSesiones"
          :key="s.id"
        >
          <button
            type="button"
            class="flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition-colors hover:bg-[var(--color-sage)]/10"
            :class="i === 0 ? 'border-[var(--color-sage)] font-semibold text-[var(--color-sage)]' : 'border-[var(--color-line)] text-[var(--color-ink)]/80'"
            :title="s.confirmada ? 'Confirmada — ver en la agenda' : 'Ver en la agenda'"
            @click="irASesion(s)"
          >
            <span class="font-[family-name:var(--font-mono)]">{{ i + 1 }}</span>
            {{ formatoProxima(s.fechaHora) }}
            <span
              v-if="s.confirmada"
              aria-label="confirmada"
            >✓</span>
          </button>
        </li>
      </ul>
      <p
        v-else
        class="text-xs text-[var(--color-muted)]"
      >
        No tienes sesiones agendadas a futuro. Puedes solicitar una hora en el calendario de disponibilidad; tu coach la aprueba.
      </p>
    </section>
    <DisponibilidadCalendar
      class="mb-4"
      :slots="slotsLibres"
      @cambio-semana="onCambioSemanaDisponibilidad"
      @solicitar="abrirSolicitarSesion"
    />
    <div
      ref="calendarioContenedor"
      class="scroll-mt-4"
    >
      <WeekCalendar
        v-if="!loading && !error"
        ref="calendarioRef"
        class="mb-4"
        :sesiones="sesiones"
        @select="onSelectSesion"
      />
    </div>
    <SkeletonBlock v-if="loading" />
    <ErrorState
      v-else-if="error"
      :description="error"
      @retry="recargar"
    />
    <EmptyState
      v-else-if="sesionesOrdenadas.length === 0"
      icon="sesiones"
      title="Todavía no tienes sesiones agendadas"
      description="Pide una hora en el calendario de disponibilidad: tu coach recibe la solicitud y, cuando la aprueba, la sesión aparece acá. También puede agendarla él directamente."
    />
    <TransitionGroup
      v-else
      name="fade-slide"
      tag="div"
      class="space-y-4"
    >
      <div
        v-for="sesion in sesionesOrdenadas"
        :key="sesion.id"
        :ref="(el) => setSesionRef(sesion.id, el)"
        class="rounded-2xl border border-[var(--color-line)] bg-white p-4 transition-shadow"
        :class="highlightedId === sesion.id ? 'ring-2 ring-[var(--color-sage)]' : ''"
      >
        <div class="mb-3 flex items-center justify-between">
          <span class="text-sm font-medium text-[var(--color-ink)]">
            {{ new Date(sesion.fechaHora).toLocaleString('es-CL', { dateStyle: 'medium', timeStyle: 'short' }) }}
          </span>
          <StatusBadge :tone="yaRealizada(sesion) ? 'sage' : 'neutral'">
            <span
              v-if="yaRealizada(sesion)"
              aria-hidden="true"
            >✓</span>
            {{ yaRealizada(sesion) ? 'Realizada' : 'Programada' }}
          </StatusBadge>
        </div>

        <div
          v-if="sesion.resumenCompartido || sesion.temaTratado || sesion.ejerciciosAplicados || sesion.acuerdos"
          class="mb-3 space-y-1 text-sm text-[var(--color-ink)]/80"
        >
          <p v-if="sesion.resumenCompartido">
            <strong>Resumen del coach:</strong> {{ sesion.resumenCompartido }}
          </p>
          <p v-if="sesion.temaTratado">
            <strong>Tema tratado:</strong> {{ sesion.temaTratado }}
          </p>
          <p v-if="sesion.ejerciciosAplicados">
            <strong>Ejercicios/assessments aplicados:</strong> {{ sesion.ejerciciosAplicados }}
          </p>
          <p v-if="sesion.acuerdos">
            <strong>Acuerdos:</strong> {{ sesion.acuerdos }}
          </p>
        </div>

        <template v-if="yaRealizada(sesion)">
          <p class="mb-3 text-sm">
            <a
              v-if="sesion.linkVideollamada"
              :href="sesion.linkVideollamada"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-saltup)]/10 px-3 py-1 text-[var(--color-saltup)] hover:bg-[var(--color-saltup)]/20"
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="currentColor"
              ><path d="M8 5v14l11-7z" /></svg>
              Ver grabación de la sesión
            </a>
            <span
              v-else
              class="text-[var(--color-muted)]"
            >Esta sesión no fue grabada.</span>
          </p>
          <div
            v-if="sesion.postSesion?.publicada"
            class="space-y-4 rounded-xl border border-[var(--color-line)]/60 bg-[var(--color-parchment)]/40 p-4 text-sm"
          >
            <div class="flex flex-wrap gap-2">
              <span
                class="flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold"
                :class="coloresCercania(sesion.postSesion.cercaniaObjetivo ?? 0).texto"
                :style="{ backgroundColor: coloresCercania(sesion.postSesion.cercaniaObjetivo ?? 0).suave }"
              >
                <NavIcon
                  v-if="(sesion.postSesion.cercaniaObjetivo ?? 0) >= 8"
                  name="trofeo"
                  :size="12"
                  class="text-[var(--color-spark)]"
                />
                Cercanía al objetivo: {{ sesion.postSesion.cercaniaObjetivo ?? '—' }}<template v-if="sesion.postSesion.cercaniaObjetivo != null">/10</template></span>
              <span class="rounded-full bg-[var(--color-ink)]/5 px-3 py-1 text-xs font-semibold text-[var(--color-muted)]">
                Utilidad: {{ sesion.postSesion.utilidad ?? '—' }}<template v-if="sesion.postSesion.utilidad != null">/5</template>
              </span>
            </div>
            <div>
              <p class="text-xs font-medium uppercase tracking-wide text-[var(--color-muted)]">
                Aprendizaje
              </p>
              <p class="mt-0.5 text-[var(--color-ink)]/90">
                {{ sesion.postSesion.aprendizaje }}
              </p>
            </div>
            <div v-if="sesion.postSesion.recomendacion">
              <p class="text-xs font-medium uppercase tracking-wide text-[var(--color-muted)]">
                Mi recomendación
              </p>
              <p class="mt-0.5 text-[var(--color-ink)]/90">
                {{ sesion.postSesion.recomendacion }}
              </p>
            </div>
            <div v-if="sesion.postSesion.temasProximaSesion">
              <p class="text-xs font-medium uppercase tracking-wide text-[var(--color-muted)]">
                Temas para la próxima sesión
              </p>
              <p class="mt-0.5 text-[var(--color-ink)]/90">
                {{ sesion.postSesion.temasProximaSesion }}
              </p>
            </div>
          </div>
          <div
            v-else
            class="space-y-3 rounded-xl border border-[var(--color-line)]/60 bg-[var(--color-parchment)]/30 p-4"
          >
            <p class="flex items-center gap-1.5 text-xs font-medium text-[var(--color-muted)]">
              <NavIcon
                name="lista"
                :size="14"
              />
              Post-sesión (una vez publicado no se puede editar)
            </p>
            <p
              v-if="errorPorSesion[sesion.id]"
              class="text-sm text-[var(--color-danger)]"
            >
              {{ errorPorSesion[sesion.id] }}
            </p>
            <FormField
              label="Aprendizaje principal"
              :error="erroresPublicar[sesion.id]?.aprendizaje"
            >
              <template #default="{ id, describedby, invalid }">
                <textarea
                  :id="id"
                  v-model="formFor(sesion).aprendizaje"
                  rows="2"
                  class="field-input"
                  :aria-describedby="describedby"
                  :aria-invalid="invalid"
                />
              </template>
            </FormField>
            <div class="grid gap-3 sm:grid-cols-2">
              <div>
                <p class="text-sm font-medium">
                  Utilidad de la sesión (1-5)
                </p>
                <RatingSelector
                  v-model="formFor(sesion).utilidad"
                  class="mt-1"
                  :max="5"
                  label="Utilidad de la sesión, de 1 a 5"
                  :invalid="!!erroresPublicar[sesion.id]?.utilidad"
                />
                <p
                  v-if="erroresPublicar[sesion.id]?.utilidad"
                  role="alert"
                  class="mt-1 text-xs text-[var(--color-danger)]"
                >
                  {{ erroresPublicar[sesion.id]?.utilidad }}
                </p>
              </div>
              <div>
                <p class="text-sm font-medium">
                  Qué tan cerca estás de tu objetivo (1-10)
                </p>
                <RatingSelector
                  v-model="formFor(sesion).cercaniaObjetivo"
                  class="mt-1"
                  :max="10"
                  label="Qué tan cerca estás de tu objetivo, de 1 a 10"
                  :invalid="!!erroresPublicar[sesion.id]?.cercania"
                />
                <p
                  v-if="erroresPublicar[sesion.id]?.cercania"
                  role="alert"
                  class="mt-1 text-xs text-[var(--color-danger)]"
                >
                  {{ erroresPublicar[sesion.id]?.cercania }}
                </p>
              </div>
            </div>
            <FormField label="Mi recomendación para seguir mejorando el proceso de coaching es...">
              <template #default="{ id }">
                <textarea
                  :id="id"
                  v-model="formFor(sesion).recomendacion"
                  rows="2"
                  class="field-input"
                />
              </template>
            </FormField>
            <FormField label="Temas propuestos para la próxima sesión">
              <template #default="{ id }">
                <textarea
                  :id="id"
                  v-model="formFor(sesion).temasProximaSesion"
                  rows="2"
                  class="field-input"
                />
              </template>
            </FormField>
            <p class="text-xs text-[var(--color-muted)]">
              Para publicar son obligatorios el aprendizaje, la utilidad y la cercanía al objetivo.
            </p>
            <div class="flex flex-wrap gap-2">
              <AppButton
                variant="secondary"
                :disabled="savingId === sesion.id"
                @click="guardarBorrador(sesion)"
              >
                Guardar borrador
              </AppButton>
              <AppButton
                :loading="savingId === sesion.id"
                @click="publicar(sesion)"
              >
                Publicar
              </AppButton>
            </div>
          </div>
        </template>
        <div
          v-else
          class="space-y-2"
        >
          <p
            v-if="sesion.linkVideollamada"
            class="text-sm"
          >
            <a
              :href="sesion.linkVideollamada"
              target="_blank"
              rel="noopener noreferrer"
              class="text-[var(--color-sage)] underline"
            >Link de la videollamada</a>
          </p>
          <div class="flex flex-wrap items-center gap-2">
            <StatusBadge
              v-if="sesion.confirmada"
              tone="sage"
            >
              ✓ Confirmada
            </StatusBadge>
            <AppButton
              v-else
              size="sm"
              :loading="confirmandoId === sesion.id"
              @click="confirmar(sesion)"
            >
              {{ confirmandoId === sesion.id ? 'Confirmando…' : 'Confirmar asistencia' }}
            </AppButton>
            <StatusBadge
              v-if="tieneSolicitudPendiente(sesion)"
              tone="bronze"
            >
              Solicitud pendiente
            </StatusBadge>
            <AppButton
              variant="secondary"
              size="sm"
              :disabled="tieneSolicitudPendiente(sesion)"
              :title="tieneSolicitudPendiente(sesion) ? 'Ya enviaste una solicitud; tu coach la responderá' : undefined"
              @click="abrirSolicitarReagendamiento(sesion)"
            >
              Solicitar reagendamiento
            </AppButton>
          </div>
        </div>
      </div>
    </TransitionGroup>

    <AppModal
      v-if="reagendarModalOpen"
      title="Solicitar reagendamiento"
      @close="reagendarModalOpen = false"
    >
      <form
        class="space-y-4"
        @submit.prevent="enviarSolicitudReagendamiento"
      >
        <p
          v-if="sesionParaReagendar"
          class="font-[family-name:var(--font-mono)] text-sm text-[var(--color-muted)]"
        >
          Sesión actual: {{ new Date(sesionParaReagendar.fechaHora).toLocaleString('es-CL') }}
        </p>
        <FormField label="Motivo (opcional)">
          <template #default="{ id }">
            <textarea
              :id="id"
              v-model="motivoReagendamiento"
              rows="3"
              class="field-input"
            />
          </template>
        </FormField>
        <div class="flex justify-end gap-2 pt-2">
          <AppButton
            variant="secondary"
            @click="reagendarModalOpen = false"
          >
            Cancelar
          </AppButton>
          <AppButton
            type="submit"
            :loading="enviandoReagendamiento"
          >
            {{ enviandoReagendamiento ? 'Enviando…' : 'Enviar' }}
          </AppButton>
        </div>
      </form>
    </AppModal>

    <AppModal
      v-if="solicitarSesionModalOpen"
      title="Solicitar esta hora"
      @close="solicitarSesionModalOpen = false"
    >
      <form
        class="space-y-4"
        @submit.prevent="enviarSolicitudSesion"
      >
        <p
          v-if="slotSeleccionado"
          class="font-[family-name:var(--font-mono)] text-sm text-[var(--color-muted)]"
        >
          Horario: {{ new Date(slotSeleccionado).toLocaleString('es-CL', { dateStyle: 'medium', timeStyle: 'short' }) }}
        </p>
        <p class="text-xs text-[var(--color-muted)]">
          Es una solicitud: tu coach la revisa y la sesión queda agendada cuando la aprueba.
        </p>
        <FormField label="Motivo (opcional)">
          <template #default="{ id }">
            <textarea
              :id="id"
              v-model="motivoSolicitud"
              rows="3"
              class="field-input"
            />
          </template>
        </FormField>
        <div class="flex justify-end gap-2 pt-2">
          <AppButton
            variant="secondary"
            @click="solicitarSesionModalOpen = false"
          >
            Cancelar
          </AppButton>
          <AppButton
            type="submit"
            :loading="enviandoSolicitud"
          >
            {{ enviandoSolicitud ? 'Enviando…' : 'Solicitar esta hora' }}
          </AppButton>
        </div>
      </form>
    </AppModal>
  </AppShell>
</template>
