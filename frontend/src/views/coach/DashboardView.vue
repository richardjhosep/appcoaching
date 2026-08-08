<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import AppShell from '../../components/AppShell.vue'
import NavIcon from '../../components/NavIcon.vue'
import { getResumenNegocio, getAlertas, enviarRecordatorioSesion, enviarRecordatorioLogro, type ResumenNegocio, type Alertas } from '../../api/negocio'
import { listPlanes, enviarRecordatorio, type PlanDesarrollo } from '../../api/planesDesarrollo'
import { getSolicitudes, type SolicitudProceso } from '../../api/satisfaccion'
import { listCoachees } from '../../api/coachees'
import { getResumenLegal, type ResumenLegal } from '../../api/legal'
import { estadoVisual } from '../../lib/legalFormat'
import { coacheesQueNecesitanAlgo, type CoacheeAtencion } from '../../lib/dashboardAtencion'
import { ApiError } from '../../api/client'
import { notifySuccess, notifyError } from '../../lib/notify'

const router = useRouter()
const loading = ref(true)
const resumen = ref<ResumenNegocio | null>(null)
const alertas = ref<Alertas | null>(null)
const planesSinEnviar = ref<PlanDesarrollo[]>([])
const planesPendientesAprobacion = ref<PlanDesarrollo[]>([])
const solicitudesPendientes = ref<SolicitudProceso[]>([])
const resumenLegal = ref<ResumenLegal>({ empresas: [], independientes: [] })
const sinCoacheesAun = ref(false)

type Tab = 'coachees' | 'empresas' | 'solicitudes'
const tab = ref<Tab>('coachees')

const formatoCLP = new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 })

const coacheesAtencion = computed<CoacheeAtencion[]>(() =>
  alertas.value
    ? coacheesQueNecesitanAlgo({
      planesSinEnviar: planesSinEnviar.value,
      planesPendientesAprobacion: planesPendientesAprobacion.value,
      alertas: alertas.value,
      independientesLegal: resumenLegal.value.independientes,
    })
    : [],
)

const empresasLegalPendientes = computed(() =>
  resumenLegal.value.empresas.filter(
    (e) => estadoVisual(e.contrato) !== 'firmado' || estadoVisual(e.nda) !== 'firmado',
  ),
)

async function load() {
  loading.value = true
  const [r, a, sinEnviar, pendientesAprobacion, solicitudes, coachees, legal] = await Promise.all([
    getResumenNegocio(),
    getAlertas(),
    listPlanes('sin_enviar'),
    listPlanes('pendiente_aprobacion'),
    getSolicitudes('pendiente'),
    listCoachees(),
    getResumenLegal(),
  ])
  resumen.value = r
  alertas.value = a
  planesSinEnviar.value = sinEnviar
  planesPendientesAprobacion.value = pendientesAprobacion
  solicitudesPendientes.value = solicitudes
  resumenLegal.value = legal
  sinCoacheesAun.value = coachees.length === 0
  loading.value = false
}

onMounted(load)

function verPerfil(coacheeId: string) {
  void router.push({ name: 'coach-coachee-detail', params: { coacheeId } })
}

function verPlan(coacheeId: string) {
  void router.push({ name: 'coach-coachee-detail', params: { coacheeId }, query: { tab: 'plan' } })
}

async function recordar(accion: () => Promise<unknown>, nombre: string, mensaje: string) {
  try {
    await accion()
    await notifySuccess('Recordatorio enviado', `Le enviamos un correo a ${nombre} para que ${mensaje}.`)
  } catch (err) {
    const texto = err instanceof ApiError ? err.message : 'No se pudo enviar el recordatorio.'
    await notifyError('No se pudo enviar', texto)
  }
}

function recordarPlan(c: CoacheeAtencion) {
  void recordar(() => enviarRecordatorio(c.coacheeId), c.nombre, 'envíe su plan de desarrollo')
}

function recordarSesionAction(c: CoacheeAtencion) {
  void recordar(() => enviarRecordatorioSesion(c.coacheeId), c.nombre, 'agende su próxima sesión')
}

function recordarLogroAction(c: CoacheeAtencion) {
  void recordar(() => enviarRecordatorioLogro(c.coacheeId), c.nombre, 'registre su progreso')
}

type Severidad = 'danger' | 'bronze' | 'sage'

interface ItemAtencion {
  id: string
  label: string
  severidad: Severidad
  accionLabel?: string
  accion?: () => void
}

const textoSeveridad: Record<Severidad, string> = {
  danger: 'text-[var(--color-danger)]',
  bronze: 'text-[var(--color-bronze)]',
  sage: 'text-[var(--color-sage)]',
}

// Un renglón por bandera, no una nube de chips de colores distintos — el color queda
// reservado al texto (severidad), y la acción siempre es un botón neutro, para que la
// tarjeta se pueda escanear de un vistazo. Orden: lo urgente para el coachee primero
// (riesgo de que la relación se enfríe), luego lo que sólo necesita un empujón, y al final
// lo que ya está en tu cancha (revisar un plan que el coachee sí envió).
function itemsDe(c: CoacheeAtencion): ItemAtencion[] {
  const items: ItemAtencion[] = []
  if (c.sinProximaSesion) {
    items.push({ id: 'sesion', label: 'Sin próxima sesión', severidad: 'danger', accionLabel: 'Recordar sesión', accion: () => recordarSesionAction(c) })
  }
  if (c.sinLogros) {
    items.push({ id: 'logros', label: 'Sin logros recientes', severidad: 'danger', accionLabel: 'Recordar progreso', accion: () => recordarLogroAction(c) })
  }
  if (c.legalPendiente) {
    items.push({ id: 'legal', label: 'Legal pendiente', severidad: 'danger' })
  }
  if (c.planSinEnviar) {
    items.push({ id: 'plan-sin-enviar', label: 'Plan sin enviar', severidad: 'bronze', accionLabel: 'Recordar plan', accion: () => recordarPlan(c) })
  }
  if (c.cicloPorVencer) {
    items.push({ id: 'ciclo', label: `Ciclo por vencer (${c.cicloPorVencer.sesionesRestantes} sesiones)`, severidad: 'bronze' })
  }
  if (c.planPendienteAprobacion) {
    items.push({ id: 'plan-revisar', label: 'Plan por revisar', severidad: 'sage', accionLabel: 'Revisar →', accion: () => verPlan(c.coacheeId) })
  }
  return items
}
</script>

<template>
  <AppShell>
    <div class="mb-5">
      <h1 class="font-[family-name:var(--font-heading)] text-xl font-semibold">
        Dashboard
      </h1>
      <p class="text-sm text-[var(--color-ink)]/60">
        Vista general de tu práctica de coaching.
      </p>
    </div>

    <div
      v-if="loading"
      class="text-sm text-[var(--color-ink)]/60"
    >
      Cargando…
    </div>
    <div
      v-else-if="sinCoacheesAun"
      class="rounded-2xl border border-[var(--color-sage)] bg-[var(--color-sage)]/10 p-4 text-sm"
    >
      <p class="mb-2 font-medium">
        Todavía no tienes ningún coachee.
      </p>
      <p class="mb-3 text-[var(--color-ink)]/70">
        Crea tu primera empresa y coachee para empezar a usar la plataforma.
      </p>
      <RouterLink
        to="/coach/coachees"
        class="inline-block rounded-lg bg-[var(--color-ink)] px-3 py-2 text-xs text-[var(--color-parchment)]"
      >
        Ir a Coachees
      </RouterLink>
    </div>
    <div
      v-else-if="resumen && alertas"
      class="space-y-5"
    >
      <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div class="rounded-2xl border border-[var(--color-line)] bg-white p-4">
          <p class="text-xs text-[var(--color-ink)]/60">
            Coachees activos
          </p>
          <p class="font-[family-name:var(--font-mono)] text-2xl">
            {{ resumen.coacheesActivos }}
          </p>
        </div>
        <div class="rounded-2xl border border-[var(--color-line)] bg-white p-4">
          <p class="text-xs text-[var(--color-ink)]/60">
            Coachees que necesitan algo
          </p>
          <p
            class="font-[family-name:var(--font-mono)] text-2xl"
            :class="coacheesAtencion.length > 0 ? 'text-[var(--color-bronze)]' : 'text-[var(--color-sage)]'"
          >
            {{ coacheesAtencion.length }}
          </p>
        </div>
        <div class="rounded-2xl border border-[var(--color-line)] bg-white p-4">
          <p class="text-xs text-[var(--color-ink)]/60">
            Ingreso del período
          </p>
          <p class="font-[family-name:var(--font-mono)] text-2xl">
            {{ formatoCLP.format(resumen.ingresoDelPeriodoTotal) }}
          </p>
        </div>
        <div class="rounded-2xl border border-[var(--color-line)] bg-white p-4">
          <p class="text-xs text-[var(--color-ink)]/60">
            Satisfacción promedio
          </p>
          <p class="font-[family-name:var(--font-mono)] text-2xl">
            {{ resumen.satisfaccionPromedio !== null ? `${resumen.satisfaccionPromedio} ★` : '—' }}
          </p>
        </div>
      </div>

      <div class="rounded-2xl border border-[var(--color-line)] bg-white p-4">
        <div class="mb-3 flex gap-1 border-b border-[var(--color-line)]">
          <button
            class="border-b-2 px-3 py-2 text-sm"
            :class="tab === 'coachees' ? 'border-[var(--color-sage)] font-medium text-[var(--color-sage)]' : 'border-transparent text-[var(--color-ink)]/60'"
            @click="tab = 'coachees'"
          >
            Coachees ({{ coacheesAtencion.length }})
          </button>
          <button
            class="border-b-2 px-3 py-2 text-sm"
            :class="tab === 'empresas' ? 'border-[var(--color-sage)] font-medium text-[var(--color-sage)]' : 'border-transparent text-[var(--color-ink)]/60'"
            @click="tab = 'empresas'"
          >
            Empresas ({{ empresasLegalPendientes.length }})
          </button>
          <button
            class="border-b-2 px-3 py-2 text-sm"
            :class="tab === 'solicitudes' ? 'border-[var(--color-sage)] font-medium text-[var(--color-sage)]' : 'border-transparent text-[var(--color-ink)]/60'"
            @click="tab = 'solicitudes'"
          >
            Solicitudes comerciales ({{ solicitudesPendientes.length }})
          </button>
        </div>

        <div v-if="tab === 'coachees'">
          <p
            v-if="coacheesAtencion.length === 0"
            class="text-sm text-[var(--color-sage)]"
          >
            ✓ Todo al día — ningún coachee necesita algo de ti ahora mismo.
          </p>
          <ul
            v-else
            class="space-y-2 text-sm"
          >
            <li
              v-for="c in coacheesAtencion"
              :key="c.coacheeId"
              class="rounded-lg border border-[var(--color-line)] p-3"
            >
              <button
                type="button"
                class="font-medium hover:underline"
                @click="verPerfil(c.coacheeId)"
              >
                {{ c.nombre }}
              </button>

              <ul class="mt-1 divide-y divide-[var(--color-line)]/70">
                <li
                  v-for="item in itemsDe(c)"
                  :key="item.id"
                  class="flex items-center justify-between gap-3 py-1.5"
                >
                  <span
                    class="text-xs font-medium"
                    :class="textoSeveridad[item.severidad]"
                  >
                    {{ item.label }}
                  </span>
                  <button
                    v-if="item.accion"
                    type="button"
                    class="inline-flex shrink-0 items-center gap-1 rounded-full border border-[var(--color-line)] px-2 py-0.5 text-xs text-[var(--color-ink)]/70 hover:bg-[var(--color-parchment)]/60 hover:text-[var(--color-ink)]"
                    @click="item.accion"
                  >
                    <NavIcon
                      v-if="item.id !== 'plan-revisar'"
                      name="correo"
                      :size="11"
                    /> {{ item.accionLabel }}
                  </button>
                </li>
              </ul>
            </li>
          </ul>
        </div>

        <div v-else-if="tab === 'empresas'">
          <p
            v-if="empresasLegalPendientes.length === 0"
            class="text-sm text-[var(--color-sage)]"
          >
            ✓ Todo al día — sin contratos ni NDA pendientes.
          </p>
          <ul
            v-else
            class="space-y-1 text-sm"
          >
            <li
              v-for="e in empresasLegalPendientes"
              :key="e.empresaId"
            >
              <RouterLink
                to="/coach/legal"
                class="hover:underline"
              >
                {{ e.nombre }}
              </RouterLink>
              <span class="text-[var(--color-ink)]/60">
                —
                <template v-if="estadoVisual(e.contrato) !== 'firmado'">Contrato </template>
                <template v-if="estadoVisual(e.nda) !== 'firmado'">NDA</template>
                pendiente
              </span>
            </li>
          </ul>
        </div>

        <div v-else>
          <p
            v-if="solicitudesPendientes.length === 0"
            class="text-sm text-[var(--color-ink)]/60"
          >
            No hay solicitudes de nuevos procesos pendientes.
          </p>
          <ul
            v-else
            class="space-y-1 text-sm"
          >
            <li
              v-for="s in solicitudesPendientes"
              :key="s.id"
            >
              {{ s.nombreSugerido }}
              <span
                v-if="s.empresa"
                class="text-[var(--color-ink)]/60"
              >— {{ s.empresa.nombre }}</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </AppShell>
</template>
