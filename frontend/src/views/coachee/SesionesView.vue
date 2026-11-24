<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'
import AppShell from '../../components/AppShell.vue'
import AppModal from '../../components/AppModal.vue'
import TabBar from '../../components/TabBar.vue'
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
  guardarCompromisos,
  publicarPostSesion,
  solicitarReagendamiento,
  confirmarSesion,
  getMisReagendamientos,
  type Sesion,
  type SolicitudReagendamientoMia,
} from '../../api/sesiones'
import { getSlotsLibres } from '../../api/disponibilidad'
import { getMiCicloActual, type Ciclo } from '../../api/ciclos'
import {
  crearSolicitudSesion,
  getMisSolicitudesSesion,
  resolverContrapropuesta,
  type SolicitudSesion,
} from '../../api/solicitudes-sesion'
import { getOwnPlan } from '../../api/planesDesarrollo'
import { ApiError } from '../../api/client'
import { notifySuccess, notifyError, confirmDialog } from '../../lib/notify'
import { useCarga } from '../../lib/useCarga'
import { nivelProgreso, coloresNivel } from '../../lib/nivelProgreso'

function coloresCercania(valor: number) {
  return coloresNivel[nivelProgreso(valor * 10)]
}

type TabKey = 'sesiones' | 'solicitar'
const tabs: Array<{ key: TabKey; label: string; icon: string }> = [
  { key: 'sesiones', label: 'Mis sesiones', icon: 'sesiones' },
  { key: 'solicitar', label: 'Solicitar sesión', icon: 'lista' },
]
// Otras pantallas enlazan directo a la solicitud con ?tab=solicitar.
const activeTab = ref<TabKey>(useRoute().query.tab === 'solicitar' ? 'solicitar' : 'sesiones')

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

// Solicitudes de hora que siguen "en espera": pendientes de respuesta o con un horario que el
// coach contrapropuso y que el coachee debe aceptar o rechazar.
const solicitudesAbiertas = ref<SolicitudSesion[]>([])
const resolviendoSolicitudId = ref<string | null>(null)

const formatoSolicitud = (iso: string) =>
  new Date(iso).toLocaleString('es-CL', { dateStyle: 'medium', timeStyle: 'short' })

async function responderContrapropuesta(solicitud: SolicitudSesion, aceptar: boolean) {
  resolviendoSolicitudId.value = solicitud.id
  try {
    await resolverContrapropuesta(solicitud.id, aceptar)
    solicitudesAbiertas.value = solicitudesAbiertas.value.filter((x) => x.id !== solicitud.id)
    if (aceptar) sesiones.value = await getMisSesiones()
    await notifySuccess(aceptar ? 'Sesión agendada' : 'Propuesta rechazada', aceptar ? 'Quedó en tu agenda.' : 'Tu coach fue avisado.')
  } catch (err) {
    await notifyError('No se pudo responder', err instanceof ApiError ? err.message : 'Ocurrió un error inesperado.')
  } finally {
    resolviendoSolicitudId.value = null
  }
}

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
    solicitudesAbiertas.value = await getMisSolicitudesSesion().catch(() => solicitudesAbiertas.value)
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

const LEYENDAS_UTILIDAD: Record<number, string> = {
  5: 'Muy útil: salí con claridad y acciones concretas',
  4: 'Útil',
  3: 'Medianamente útil',
  2: 'Poco útil',
  1: 'Nada útil',
}
const LEYENDAS_CERCANIA: Record<number, string> = {
  10: 'Logré mi objetivo',
  5: 'A mitad de camino',
  1: 'Recién comienzo',
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

const sesionesRealizadas = computed(() =>
  sesiones.value
    .filter(yaRealizada)
    .sort((a, b) => new Date(b.fechaHora).getTime() - new Date(a.fechaHora).getTime()),
)

function yaRealizada(sesion: Sesion): boolean {
  return new Date(sesion.fechaHora).getTime() <= Date.now()
}

const cicloActual = ref<Ciclo | null>(null)
const objetivoGeneral = ref<string | null>(null)

const { loading, error, recargar, tolerar } = useCarga(async () => {
  // Las sesiones son críticas; ciclo, solicitudes y objetivo son complementarios.
  const [s, c, r, sol, plan] = await Promise.all([
    getMisSesiones(),
    tolerar(getMiCicloActual()),
    tolerar(getMisReagendamientos()),
    tolerar(getMisSolicitudesSesion()),
    tolerar(getOwnPlan()),
  ])
  objetivoGeneral.value = plan?.objetivoGeneral ?? null
  solicitudesAbiertas.value = sol ?? []
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

const MAX_PROXIMAS = 3
const verTodasProximas = ref(false)
const proximasVisibles = computed(() =>
  verTodasProximas.value ? proximasSesiones.value : proximasSesiones.value.slice(0, MAX_PROXIMAS),
)

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

// Compromisos: aparte del post-sesión porque se pueden seguir editando después de publicarlo.
const compromisosEdit = reactive<Record<string, string>>({})
const guardandoCompromisosId = ref<string | null>(null)

function compromisosDe(sesion: Sesion): string {
  return compromisosEdit[sesion.id] ?? sesion.postSesion?.compromisos ?? ''
}

async function guardarMisCompromisos(sesion: Sesion) {
  guardandoCompromisosId.value = sesion.id
  try {
    sesion.postSesion = await guardarCompromisos(sesion.id, compromisosDe(sesion))
    await notifySuccess('Compromisos guardados')
  } catch (err) {
    await notifyError('No se pudieron guardar', err instanceof ApiError ? err.message : 'Ocurrió un error inesperado.')
  } finally {
    guardandoCompromisosId.value = null
  }
}
</script>

<template>
  <AppShell>
    <h1 class="mb-4 font-[family-name:var(--font-heading)] text-xl font-semibold">
      Mis sesiones
    </h1>
    <details
      v-if="objetivoGeneral"
      class="mb-4 text-sm"
    >
      <summary class="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-[var(--color-line)] bg-white px-3 py-1.5 text-xs font-medium hover:bg-[var(--color-parchment)]/60">
        <NavIcon
          name="objetivo"
          :size="14"
          aria-hidden="true"
        />
        Ver mi objetivo general
      </summary>
      <p class="mt-2 whitespace-pre-line rounded-xl border border-[var(--color-line)] bg-white p-3">
        {{ objetivoGeneral }}
      </p>
    </details>
    <TabBar
      v-model="activeTab"
      class="mb-4"
      :tabs="tabs"
    />
    <template v-if="activeTab === 'solicitar'">
      <p class="mb-3 text-sm text-[var(--color-muted)]">
        Elige una hora disponible. Es una solicitud: tu coach la revisa y la sesión queda agendada cuando la aprueba.
      </p>
      <DisponibilidadCalendar
        :slots="slotsLibres"
        @cambio-semana="onCambioSemanaDisponibilidad"
        @solicitar="abrirSolicitarSesion"
      />
    </template>
    <template v-else>
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
          class="space-y-2"
        >
          <li
            v-for="s in proximasVisibles"
            :key="s.id"
            class="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[var(--color-line)]/60 px-3 py-2 text-sm"
          >
            <span class="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span class="font-medium">{{ formatoProxima(s.fechaHora) }}</span>
              <a
                v-if="s.linkVideollamada"
                :href="s.linkVideollamada"
                target="_blank"
                rel="noopener noreferrer"
                class="text-xs text-[var(--color-sage)] underline"
              >Link de la videollamada</a>
            </span>
            <span class="flex flex-wrap items-center gap-2">
              <StatusBadge
                v-if="s.confirmada"
                tone="sage"
              >
                <NavIcon
                  name="check"
                  :size="14"
                  class="inline-block align-[-0.15em]"
                  aria-hidden="true"
                /> Confirmada
              </StatusBadge>
              <AppButton
                v-else
                size="sm"
                :loading="confirmandoId === s.id"
                @click="confirmar(s)"
              >
                {{ confirmandoId === s.id ? 'Confirmando…' : 'Confirmar asistencia' }}
              </AppButton>
              <StatusBadge
                v-if="tieneSolicitudPendiente(s)"
                tone="bronze"
              >
                Solicitud pendiente
              </StatusBadge>
              <AppButton
                variant="secondary"
                size="sm"
                :disabled="tieneSolicitudPendiente(s)"
                :title="tieneSolicitudPendiente(s) ? 'Ya enviaste una solicitud; tu coach la responderá' : undefined"
                @click="abrirSolicitarReagendamiento(s)"
              >
                Solicitar reagendamiento
              </AppButton>
            </span>
          </li>
        </ul>
        <p
          v-else
          class="text-xs text-[var(--color-muted)]"
        >
          No tienes sesiones agendadas a futuro.
        </p>
        <div class="mt-3 flex flex-wrap gap-2">
          <AppButton
            variant="secondary"
            size="sm"
            @click="activeTab = 'solicitar'"
          >
            Solicitar una sesión
          </AppButton>
          <AppButton
            v-if="proximasSesiones.length > MAX_PROXIMAS"
            variant="ghost"
            size="sm"
            @click="verTodasProximas = !verTodasProximas"
          >
            {{ verTodasProximas ? 'Ver menos' : `Ver todas (${proximasSesiones.length})` }}
          </AppButton>
        </div>
      </section>
      <section
        v-if="solicitudesAbiertas.length > 0"
        class="mb-4 rounded-2xl border border-[var(--color-line)] bg-white p-4"
        aria-label="Mis solicitudes de sesión"
      >
        <h2 class="mb-2 text-sm font-semibold">
          Mis solicitudes de sesión
        </h2>
        <ul class="space-y-2 text-sm">
          <li
            v-for="sol in solicitudesAbiertas"
            :key="sol.id"
            class="rounded-xl border border-[var(--color-line)] p-3"
          >
            <div class="flex flex-wrap items-center gap-2">
              <span class="font-medium">{{ formatoSolicitud(sol.fechaHoraPropuesta) }}</span>
              <StatusBadge :tone="sol.estado === 'contrapropuesta' ? 'bronze' : 'neutral'">
                {{ sol.estado === 'contrapropuesta' ? 'Tu coach propone otro horario' : 'En espera' }}
              </StatusBadge>
            </div>
            <template v-if="sol.estado === 'contrapropuesta' && sol.fechaHoraContrapropuesta">
              <p class="mt-1">
                Horario propuesto: <strong>{{ formatoSolicitud(sol.fechaHoraContrapropuesta) }}</strong>
              </p>
              <p
                v-if="sol.respuestaCoach"
                class="mt-1 text-[var(--color-muted)]"
              >
                {{ sol.respuestaCoach }}
              </p>
              <div class="mt-2 flex gap-2">
                <AppButton
                  size="sm"
                  :disabled="resolviendoSolicitudId === sol.id"
                  @click="responderContrapropuesta(sol, true)"
                >
                  Aceptar
                </AppButton>
                <AppButton
                  variant="secondary"
                  size="sm"
                  :disabled="resolviendoSolicitudId === sol.id"
                  @click="responderContrapropuesta(sol, false)"
                >
                  Rechazar
                </AppButton>
              </div>
            </template>
            <p
              v-else-if="sol.motivo"
              class="mt-1 text-[var(--color-muted)]"
            >
              {{ sol.motivo }}
            </p>
          </li>
        </ul>
      </section>
      <SkeletonBlock v-if="loading" />
      <ErrorState
        v-else-if="error"
        :description="error"
        @retry="recargar"
      />
      <EmptyState
        v-else-if="sesiones.length === 0"
        icon="sesiones"
        title="Todavía no tienes sesiones agendadas"
        description="Pide una hora en «Solicitar sesión»: tu coach recibe la solicitud y, cuando la aprueba, la sesión aparece acá. También puede agendarla él directamente."
      />
      <TransitionGroup
        v-else
        name="fade-slide"
        tag="div"
        class="space-y-4"
      >
        <div
          v-for="sesion in sesionesRealizadas"
          :key="sesion.id"
          class="rounded-2xl border border-[var(--color-line)] bg-white p-4"
        >
          <div class="mb-3 flex items-center justify-between">
            <span class="text-sm font-medium text-[var(--color-ink)]">
              {{ new Date(sesion.fechaHora).toLocaleString('es-CL', { dateStyle: 'medium', timeStyle: 'short' }) }}
            </span>
            <StatusBadge tone="sage">
              <NavIcon
                name="check"
                :size="14"
                aria-hidden="true"
              />
              Realizada
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

          <p class="mb-3 text-sm">
            <a
              v-if="sesion.linkVideollamada"
              :href="sesion.linkVideollamada"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-saltup)]/10 px-3 py-1 text-[var(--color-saltup-ink)] hover:bg-[var(--color-saltup)]/20"
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
            <div v-if="sesion.postSesion.aprendizaje">
              <p class="text-xs font-medium uppercase tracking-wide text-[var(--color-muted)]">
                Mi aprendizaje (privado)
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
                Tema a tratar en la próxima sesión
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
              label="Aprendizaje principal — es confidencial: tu coach no lo ve"
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
            <p
              v-if="objetivoGeneral"
              class="flex items-start gap-1.5 rounded-lg bg-white p-2 text-sm"
            >
              <NavIcon
                name="objetivo"
                :size="14"
                class="mt-0.5 shrink-0 text-[var(--color-bronze)]"
                aria-hidden="true"
              />
              <span><strong>Tu objetivo:</strong> {{ objetivoGeneral }}</span>
            </p>
            <div class="grid gap-3 sm:grid-cols-2">
              <div>
                <p class="text-sm font-medium">
                  Utilidad de la sesión (5 a 1)
                </p>
                <RatingSelector
                  v-model="formFor(sesion).utilidad"
                  class="mt-1"
                  :max="5"
                  :leyendas="LEYENDAS_UTILIDAD"
                  label="Utilidad de la sesión, de 5 a 1"
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
                  Qué tan cerca estás de tu objetivo (10 a 1)
                </p>
                <RatingSelector
                  v-model="formFor(sesion).cercaniaObjetivo"
                  class="mt-1"
                  :max="10"
                  :leyendas="LEYENDAS_CERCANIA"
                  label="Qué tan cerca estás de tu objetivo, de 10 a 1"
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
            <FormField label="Tema a tratar en la próxima sesión">
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
              Para publicar son obligatorios el aprendizaje, la utilidad y la cercanía al objetivo. Tu recomendación y el tema a tratar se comparten con tu coach; el aprendizaje queda solo para ti.
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
          <div class="mt-3 space-y-2 rounded-xl border border-[var(--color-line)]/60 p-4">
            <FormField
              label="Mis compromisos y tareas de esta sesión"
              hint="Solo tú los ves. Puedes actualizarlos cuando quieras."
            >
              <template #default="{ id, describedby }">
                <textarea
                  :id="id"
                  :value="compromisosDe(sesion)"
                  rows="3"
                  maxlength="5000"
                  class="field-input"
                  data-compromisos
                  :aria-describedby="describedby"
                  @input="compromisosEdit[sesion.id] = ($event.target as HTMLTextAreaElement).value"
                />
              </template>
            </FormField>
            <AppButton
              variant="secondary"
              size="sm"
              :loading="guardandoCompromisosId === sesion.id"
              @click="guardarMisCompromisos(sesion)"
            >
              Guardar compromisos
            </AppButton>
          </div>
        </div>
      </TransitionGroup>
    </template>

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
          class="cifra text-sm text-[var(--color-muted)]"
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
          class="cifra text-sm text-[var(--color-muted)]"
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
