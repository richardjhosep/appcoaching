<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import AppShell from '../../components/AppShell.vue'
import NavIcon from '../../components/NavIcon.vue'
import SkeletonBlock from '../../components/SkeletonBlock.vue'
import AppModal from '../../components/AppModal.vue'
import ProyeccionIngresosChart from '../../components/ProyeccionIngresosChart.vue'
import {
  getResumenNegocio,
  getAlertas,
  getCarteraEmpresas,
  getResumenComercial,
  getProyeccionMensual,
  getAtencionInmediata,
  getComparativo,
  enviarRecordatorioSesion,
  enviarRecordatorioLogro,
  type ResumenNegocio,
  type Alertas,
  type ResumenCartera,
  type EstadoCartera,
  type ResumenComercial,
  type ProyeccionMes,
  type AtencionInmediata,
  type ComparativoYCapacidad,
} from '../../api/negocio'
import { crearGestion, getGestionDeEmpresa, type GestionRenovacion } from '../../api/empresas'
import { listPlanes, enviarRecordatorio, type PlanDesarrollo } from '../../api/planesDesarrollo'
import { getSolicitudes, type SolicitudProceso } from '../../api/satisfaccion'
import { listCoachees, type CoacheeListItem } from '../../api/coachees'
import { getResumenLegal, type ResumenLegal } from '../../api/legal'
import { getSesionesSemana, type Sesion } from '../../api/sesiones'
import { estadoVisual } from '../../lib/legalFormat'
import { coacheesQueNecesitanAlgo, type CoacheeAtencion } from '../../lib/dashboardAtencion'
import { buscarAproximado } from '../../lib/busquedaAproximada'
import { iniciales } from '../../lib/avatar'
import { agruparPorDia } from '../../lib/sesionesPorDia'
import { semaforoCartera, type Semaforo } from '../../lib/semaforoCartera'
import { inicioDeSemana, aFechaLocal } from '../../lib/dateRange'
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
const coacheesLista = ref<CoacheeListItem[]>([])
const sinCoacheesAun = ref(false)
const cartera = ref<ResumenCartera | null>(null)
const sesionesSemana = ref<Sesion[]>([])
const comercialMes = ref<ResumenComercial | null>(null)
const proyeccionMensual = ref<ProyeccionMes[]>([])
const atencion = ref<AtencionInmediata | null>(null)
const comparativo = ref<ComparativoYCapacidad | null>(null)

type Tab = 'coachees' | 'empresas' | 'solicitudes'
const tab = ref<Tab>('coachees')

const formatoCLP = new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 })

async function load() {
  loading.value = true
  const lunes = inicioDeSemana()
  const finSemana = new Date(lunes)
  finSemana.setDate(finSemana.getDate() + 7)

  const [
    r,
    a,
    sinEnviar,
    pendientesAprobacion,
    solicitudes,
    coachees,
    legal,
    carteraData,
    semana,
    comercial,
    proyeccion,
    atencionData,
    comparativoData,
  ] = await Promise.all([
    getResumenNegocio(),
    getAlertas(),
    listPlanes('sin_enviar'),
    listPlanes('pendiente_aprobacion'),
    getSolicitudes('pendiente'),
    listCoachees(),
    getResumenLegal(),
    getCarteraEmpresas(),
    getSesionesSemana(aFechaLocal(lunes), aFechaLocal(finSemana)),
    getResumenComercial('mes'),
    getProyeccionMensual(),
    getAtencionInmediata(),
    getComparativo(),
  ])
  resumen.value = r
  alertas.value = a
  planesSinEnviar.value = sinEnviar
  planesPendientesAprobacion.value = pendientesAprobacion
  solicitudesPendientes.value = solicitudes
  resumenLegal.value = legal
  coacheesLista.value = coachees
  sinCoacheesAun.value = coachees.length === 0
  cartera.value = carteraData
  sesionesSemana.value = semana
  comercialMes.value = comercial
  proyeccionMensual.value = proyeccion
  atencion.value = atencionData
  comparativo.value = comparativoData
  loading.value = false
}

onMounted(load)

function verPerfil(coacheeId: string) {
  void router.push({ name: 'coach-coachee-detail', params: { coacheeId } })
}

// Buscador aproximado: encuentra un coachee aunque se escriba con errores, sin tildes,
// o solo una parte del nombre — sobre la lista completa (no solo los que necesitan algo),
// para poder saltar directo al detalle de cualquiera.
const buscarTexto = ref('')
const buscarAbierto = ref(false)
const resultadosBusqueda = computed(() =>
  buscarAproximado(buscarTexto.value, coacheesLista.value, (c) => c.nombre).slice(0, 8),
)

function cerrarBusqueda() {
  setTimeout(() => {
    buscarAbierto.value = false
  }, 150)
}

function irACoacheeDesdeBusqueda(coacheeId: string) {
  buscarTexto.value = ''
  buscarAbierto.value = false
  verPerfil(coacheeId)
}

function verPlan(coacheeId: string) {
  void router.push({ name: 'coach-coachee-detail', params: { coacheeId }, query: { tab: 'plan' } })
}

// --- "Esta semana": sesiones agendadas, agrupadas por día ---

const diasSemana = computed(() => agruparPorDia(sesionesSemana.value))

function formatoDia(fecha: string): string {
  const texto = new Date(`${fecha}T00:00:00`).toLocaleDateString('es-CL', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
  })
  return texto.charAt(0).toUpperCase() + texto.slice(1)
}

function formatoHora(fechaHora: string): string {
  return new Date(fechaHora).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })
}

// --- "Cartera de empresas": una lista, ordenada por urgencia ---

const ORDEN_ESTADO: Record<EstadoCartera, number> = {
  vencido: 0,
  vence_este_mes: 1,
  vence_este_semestre: 2,
  sin_fecha: 3,
  vigente: 4,
}

const estadoCarteraLabel: Record<EstadoCartera, string> = {
  vencido: 'Vencido',
  vence_este_mes: 'Vence este mes',
  vence_este_semestre: 'Vence este semestre',
  sin_fecha: 'Sin fecha registrada',
  vigente: 'Vigente',
}

const estadoCarteraColor: Record<EstadoCartera, string> = {
  vencido: 'text-[var(--color-danger)]',
  vence_este_mes: 'text-[var(--color-danger)]',
  vence_este_semestre: 'text-[var(--color-bronze)]',
  sin_fecha: 'text-[var(--color-bronze)]',
  vigente: 'text-[var(--color-sage)]',
}

const empresasOrdenadas = computed(() =>
  [...(cartera.value?.empresas ?? [])].sort(
    (a, b) => ORDEN_ESTADO[a.estado] - ORDEN_ESTADO[b.estado],
  ),
)

function formatoFechaFin(iso: string | null): string {
  if (!iso) return 'Sin fecha registrada'
  return new Date(`${iso}T00:00:00`).toLocaleDateString('es-CL', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function irAEditarEmpresa() {
  void router.push({ name: 'coach-empresas' })
}

const semaforoColor: Record<Semaforo, string> = {
  rojo: 'bg-[var(--color-danger)]',
  amarillo: 'bg-[var(--color-bronze)]',
  verde: 'bg-[var(--color-sage)]',
}

// --- "Gestionar" (historial de renovación por empresa): el mismo modal se abre desde la
// fila de la cartera y desde "Atención inmediata" — cada bloque termina en una acción
// ejecutable, no solo muestra datos. ---

const gestionModalAbierto = ref(false)
const empresaGestion = ref<{ empresaId: string; nombre: string } | null>(null)
const gestionHistorial = ref<GestionRenovacion[]>([])
const gestionCargando = ref(false)
const gestionGuardando = ref(false)
const notaGestionForm = ref('')
const proximoSeguimientoForm = ref('')

async function abrirGestion(empresaId: string, nombre: string) {
  empresaGestion.value = { empresaId, nombre }
  notaGestionForm.value = ''
  proximoSeguimientoForm.value = ''
  gestionHistorial.value = []
  gestionModalAbierto.value = true
  gestionCargando.value = true
  try {
    gestionHistorial.value = await getGestionDeEmpresa(empresaId)
  } catch (err) {
    await notifyError('No se pudo cargar el historial', err instanceof ApiError ? err.message : 'Ocurrió un error inesperado.')
  } finally {
    gestionCargando.value = false
  }
}

function cerrarGestion() {
  gestionModalAbierto.value = false
  empresaGestion.value = null
}

async function guardarGestion() {
  if (!empresaGestion.value || !notaGestionForm.value.trim()) return
  gestionGuardando.value = true
  try {
    await crearGestion(
      empresaGestion.value.empresaId,
      notaGestionForm.value.trim(),
      proximoSeguimientoForm.value || undefined,
    )
    await notifySuccess('Gestión registrada')
    notaGestionForm.value = ''
    proximoSeguimientoForm.value = ''
    const [historial, carteraData, atencionData] = await Promise.all([
      getGestionDeEmpresa(empresaGestion.value.empresaId),
      getCarteraEmpresas(),
      getAtencionInmediata(),
    ])
    gestionHistorial.value = historial
    cartera.value = carteraData
    atencion.value = atencionData
  } catch (err) {
    await notifyError('No se pudo guardar', err instanceof ApiError ? err.message : 'Ocurrió un error inesperado.')
  } finally {
    gestionGuardando.value = false
  }
}

function formatoFechaHora(iso: string): string {
  return new Date(iso).toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric' })
}

// --- "Atención inmediata": "¿qué necesito hacer hoy?" antes que cualquier métrica general ---

const nadaUrgente = computed(
  () =>
    !!atencion.value &&
    atencion.value.sesionesSinConfirmar.length === 0 &&
    atencion.value.contratosUrgentes.length === 0 &&
    atencion.value.pagosPendientes.length === 0,
)

function textoVencimiento(dias: number | null): string {
  if (dias === null) return 'sin fecha registrada'
  if (dias < 0) return `venció hace ${Math.abs(dias)} día${Math.abs(dias) === 1 ? '' : 's'}`
  if (dias === 0) return 'vence hoy'
  return `vence en ${dias} día${dias === 1 ? '' : 's'}`
}

// --- KPIs de arriba: responden directo el "criterio de éxito" del rediseño ---

const empresasPorAccion = computed(
  () => empresasOrdenadas.value.filter((e) => e.estado === 'vencido' || e.estado === 'vence_este_mes').length,
)
const empresasSinFecha = computed(
  () => empresasOrdenadas.value.filter((e) => e.estado === 'sin_fecha').length,
)
const ingresoEsperadoMes = computed(() =>
  comercialMes.value ? comercialMes.value.ingresoDelPeriodo + comercialMes.value.ingresoProyectado : 0,
)

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

// Nombre de empresa (o "Independiente") por coachee, disponible aunque no haya facturado
// nada este período — a diferencia de porCoachee, que solo trae actividad con cobro.
const empresaDeCoachee = computed(() => new Map(coacheesLista.value.map((c) => [c.id, c.empresa?.nombre ?? null])))
const cobroPorCoachee = computed(() => new Map((resumen.value?.porCoachee ?? []).map((c) => [c.coacheeId, c])))
const empresaPagadaPorNombre = computed(() => new Map((resumen.value?.porEmpresa ?? []).map((e) => [e.nombre, e.pagada])))

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

// Lo más urgente/accionable va arriba con su botón (así siempre hay un único CTA claro
// por tarjeta); el resto queda como recordatorio compacto debajo, sin repetir botones —
// para eso ya está el perfil completo a un clic.
function desglose(c: CoacheeAtencion): { primario: ItemAtencion | null; secundarios: ItemAtencion[] } {
  const items = itemsDe(c)
  const primario = items.find((i) => i.accion) ?? items[0] ?? null
  return { primario, secundarios: items.filter((i) => i !== primario) }
}

interface InfoCobro {
  texto: string
  severidad: 'danger' | 'sage' | 'neutral'
}

// Sólo dice lo que la plataforma realmente sabe: si el coachee es de una empresa que no
// ha marcado como pagada, eso es literalmente "me deben". Para independientes no existe
// (todavía) un registro de cobro por sesión — se muestra el ingreso generado o agendado,
// sin inventar un estado de pago que el sistema no rastrea.
function cobroDe(c: CoacheeAtencion): InfoCobro | null {
  const cobro = cobroPorCoachee.value.get(c.coacheeId)
  if (!cobro) return null
  const empresaSinPagar = cobro.empresaNombre !== null && empresaPagadaPorNombre.value.get(cobro.empresaNombre) === false

  if (cobro.ingresoDelPeriodo > 0) {
    return empresaSinPagar
      ? { texto: `${formatoCLP.format(cobro.ingresoDelPeriodo)} sin pagar`, severidad: 'danger' }
      : { texto: `${formatoCLP.format(cobro.ingresoDelPeriodo)} este mes`, severidad: 'sage' }
  }
  if (cobro.ingresoProyectado > 0) {
    return { texto: `${formatoCLP.format(cobro.ingresoProyectado)} agendado`, severidad: 'neutral' }
  }
  return null
}

interface FilaAtencion {
  coachee: CoacheeAtencion
  empresaNombre: string | null
  cobro: InfoCobro | null
  primario: ItemAtencion | null
  secundarios: ItemAtencion[]
}

// Una sola pasada por coachee con todo lo que la tarjeta necesita — evita recalcular
// desglose()/cobroDe() varias veces dentro del template.
const filasAtencion = computed<FilaAtencion[]>(() =>
  coacheesAtencion.value.map((c) => {
    const { primario, secundarios } = desglose(c)
    return {
      coachee: c,
      empresaNombre: empresaDeCoachee.value.get(c.coacheeId) ?? null,
      cobro: cobroDe(c),
      primario,
      secundarios,
    }
  }),
)
</script>

<template>
  <AppShell>
    <div class="mb-5 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 class="font-[family-name:var(--font-heading)] text-xl font-semibold">
          Panorama
        </h1>
        <p class="text-sm text-[var(--color-ink)]/60">
          Tu semana, tu cartera y tu proyección — de un vistazo.
        </p>
      </div>

      <div class="relative w-full sm:w-72">
        <span class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-ink)]/40">
          <NavIcon
            name="buscar"
            :size="16"
          />
        </span>
        <input
          v-model="buscarTexto"
          type="search"
          placeholder="Buscar un coachee…"
          class="w-full rounded-full border border-[var(--color-line)] bg-white py-2 pl-9 pr-3 text-sm focus:border-[var(--color-sage)] focus:outline-none focus:ring-2 focus:ring-[var(--color-sage)]/30"
          @focus="buscarAbierto = true"
          @blur="cerrarBusqueda"
        >
        <div
          v-if="buscarAbierto && buscarTexto.trim()"
          class="absolute left-0 right-0 z-10 mt-1.5 max-h-72 overflow-y-auto rounded-xl border border-[var(--color-line)] bg-white p-1.5 shadow-lg"
        >
          <p
            v-if="resultadosBusqueda.length === 0"
            class="px-2 py-2 text-xs text-[var(--color-ink)]/50"
          >
            Sin coincidencias para "{{ buscarTexto }}".
          </p>
          <button
            v-for="c in resultadosBusqueda"
            :key="c.id"
            type="button"
            class="flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left hover:bg-[var(--color-parchment)]/60"
            @mousedown.prevent="irACoacheeDesdeBusqueda(c.id)"
          >
            <div
              class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--color-ink)] text-[10px] font-semibold text-[var(--color-parchment)]"
              aria-hidden="true"
            >
              {{ iniciales(c.nombre) }}
            </div>
            <div class="min-w-0">
              <p class="truncate text-sm">
                {{ c.nombre }}
              </p>
              <p class="truncate text-xs text-[var(--color-ink)]/50">
                {{ c.empresa?.nombre ?? 'Independiente' }}
              </p>
            </div>
          </button>
        </div>
      </div>
    </div>

    <SkeletonBlock v-if="loading" />
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
      <!-- Atención inmediata: "¿qué necesito hacer hoy?" — responde esto antes que cualquier
           métrica general (va primero en la página, no las KPIs). -->
      <div class="rounded-2xl border border-[var(--color-line)] bg-white p-4">
        <h2 class="mb-3 text-sm font-medium">
          Atención inmediata
        </h2>
        <p
          v-if="nadaUrgente"
          class="text-sm text-[var(--color-sage)]"
        >
          ✓ Nada urgente ahora mismo.
        </p>
        <div
          v-else-if="atencion"
          class="space-y-4"
        >
          <div v-if="atencion.sesionesSinConfirmar.length > 0">
            <p class="mb-1.5 text-xs font-medium uppercase tracking-wide text-[var(--color-ink)]/50">
              Sesiones sin confirmar (hoy/mañana)
            </p>
            <ul class="space-y-1.5 text-sm">
              <li
                v-for="s in atencion.sesionesSinConfirmar"
                :key="s.sesionId"
                class="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[var(--color-line)]/60 px-3 py-2"
              >
                <span>
                  {{ s.nombre }}
                  <span class="text-[var(--color-ink)]/50">— {{ formatoHora(s.fechaHora) }}</span>
                </span>
                <button
                  type="button"
                  class="rounded-full border border-[var(--color-line)] px-2 py-0.5 text-xs text-[var(--color-ink)]/70 hover:bg-[var(--color-parchment)]"
                  @click="verPerfil(s.coacheeId)"
                >
                  Ver coachee
                </button>
              </li>
            </ul>
          </div>

          <div v-if="atencion.contratosUrgentes.length > 0">
            <p class="mb-1.5 text-xs font-medium uppercase tracking-wide text-[var(--color-ink)]/50">
              Contratos por vencer sin gestión
            </p>
            <ul class="space-y-1.5 text-sm">
              <li
                v-for="e in atencion.contratosUrgentes"
                :key="e.empresaId"
                class="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[var(--color-line)]/60 px-3 py-2"
              >
                <span>
                  {{ e.nombre }}
                  <span class="text-[var(--color-danger)]">— {{ textoVencimiento(e.diasParaVencer) }}</span>
                </span>
                <button
                  type="button"
                  class="rounded-full border border-[var(--color-line)] px-2 py-0.5 text-xs text-[var(--color-ink)]/70 hover:bg-[var(--color-parchment)]"
                  @click="abrirGestion(e.empresaId, e.nombre)"
                >
                  Gestionar
                </button>
              </li>
            </ul>
          </div>

          <div v-if="atencion.pagosPendientes.length > 0">
            <p class="mb-1.5 text-xs font-medium uppercase tracking-wide text-[var(--color-ink)]/50">
              Pagos pendientes
            </p>
            <ul class="space-y-1.5 text-sm">
              <li
                v-for="e in atencion.pagosPendientes"
                :key="e.empresaId"
                class="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[var(--color-line)]/60 px-3 py-2"
              >
                <span>
                  {{ e.nombre }}
                  <span class="text-[var(--color-danger)]">— {{ formatoCLP.format(e.gastoDelPeriodo) }}</span>
                </span>
                <button
                  type="button"
                  class="rounded-full border border-[var(--color-line)] px-2 py-0.5 text-xs text-[var(--color-ink)]/70 hover:bg-[var(--color-parchment)]"
                  @click="irAEditarEmpresa"
                >
                  Ver empresa
                </button>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <!-- KPIs: responden directo "¿qué tengo esta semana, qué se me vence, cuánto voy a
           facturar, qué me falta completar?" -->
      <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div class="rounded-2xl border border-[var(--color-line)] bg-white p-4">
          <p class="text-xs text-[var(--color-ink)]/60">
            Horas esta semana
          </p>
          <p class="font-[family-name:var(--font-mono)] text-2xl">
            {{ comparativo ? `${comparativo.horasComprometidasSemana}/${comparativo.horasDisponiblesSemana}` : sesionesSemana.length }} <span class="text-sm font-normal text-[var(--color-ink)]/50">hrs</span>
          </p>
        </div>
        <div class="rounded-2xl border border-[var(--color-line)] bg-white p-4">
          <p class="text-xs text-[var(--color-ink)]/60">
            Empresas por renovar este mes
          </p>
          <p
            class="font-[family-name:var(--font-mono)] text-2xl"
            :class="empresasPorAccion > 0 ? 'text-[var(--color-danger)]' : 'text-[var(--color-sage)]'"
          >
            {{ empresasPorAccion }}
          </p>
        </div>
        <div class="rounded-2xl border border-[var(--color-line)] bg-white p-4">
          <p class="text-xs text-[var(--color-ink)]/60">
            Ingreso esperado este mes
          </p>
          <p class="font-[family-name:var(--font-mono)] text-2xl">
            {{ formatoCLP.format(ingresoEsperadoMes) }}
          </p>
        </div>
        <div class="rounded-2xl border border-[var(--color-line)] bg-white p-4">
          <p class="text-xs text-[var(--color-ink)]/60">
            Empresas sin fecha de contrato
          </p>
          <p
            class="font-[family-name:var(--font-mono)] text-2xl"
            :class="empresasSinFecha > 0 ? 'text-[var(--color-bronze)]' : 'text-[var(--color-sage)]'"
          >
            {{ empresasSinFecha }}
          </p>
        </div>
      </div>

      <!-- Esta semana -->
      <div class="rounded-2xl border border-[var(--color-line)] bg-white p-4">
        <div class="mb-3 flex items-center justify-between">
          <h2 class="text-sm font-medium">
            Esta semana
          </h2>
          <RouterLink
            to="/coach/agenda"
            class="text-xs text-[var(--color-sage)] hover:underline"
          >
            Ver mi agenda completa →
          </RouterLink>
        </div>
        <p
          v-if="diasSemana.length === 0"
          class="text-sm text-[var(--color-ink)]/60"
        >
          No tienes sesiones agendadas esta semana.
        </p>
        <div
          v-else
          class="space-y-3"
        >
          <div
            v-for="dia in diasSemana"
            :key="dia.fecha"
          >
            <p class="mb-1.5 text-xs font-medium uppercase tracking-wide text-[var(--color-ink)]/50">
              {{ formatoDia(dia.fecha) }}
            </p>
            <ul class="space-y-1.5">
              <li
                v-for="sesion in dia.sesiones"
                :key="sesion.id"
              >
                <button
                  type="button"
                  class="flex w-full items-center gap-3 rounded-lg border border-[var(--color-line)]/60 px-3 py-2 text-left text-sm hover:border-[var(--color-sage)] hover:bg-[var(--color-parchment)]/30"
                  @click="verPerfil(sesion.coacheeId)"
                >
                  <span class="shrink-0 font-[family-name:var(--font-mono)] text-xs text-[var(--color-ink)]/60">
                    {{ formatoHora(sesion.fechaHora) }}
                  </span>
                  <span class="min-w-0 flex-1 truncate">
                    {{ sesion.coachee?.nombre ?? 'Coachee' }}
                    <span class="text-[var(--color-ink)]/50">
                      — {{ sesion.coachee?.empresa?.nombre ?? 'Independiente' }}
                    </span>
                  </span>
                  <span
                    v-if="!sesion.confirmada"
                    class="shrink-0 rounded-full bg-[var(--color-bronze)]/15 px-2 py-0.5 text-[10px] font-medium text-[var(--color-bronze)]"
                  >
                    Sin confirmar
                  </span>
                </button>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <!-- Cartera de empresas -->
      <div class="rounded-2xl border border-[var(--color-line)] bg-white p-4">
        <h2 class="mb-3 text-sm font-medium">
          Cartera de empresas
        </h2>
        <p
          v-if="empresasOrdenadas.length === 0"
          class="text-sm text-[var(--color-ink)]/60"
        >
          Todavía no tienes ninguna empresa activa.
        </p>
        <ul
          v-else
          class="space-y-1.5 text-sm"
        >
          <li
            v-for="empresa in empresasOrdenadas"
            :key="empresa.empresaId"
            class="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[var(--color-line)]/60 px-3 py-2"
          >
            <span class="flex min-w-0 items-center gap-2 font-medium">
              <span
                class="inline-block h-2 w-2 shrink-0 rounded-full"
                :class="semaforoColor[semaforoCartera(empresa)]"
                aria-hidden="true"
              />
              {{ empresa.nombre }}
            </span>
            <span class="flex items-center gap-3 text-xs">
              <span class="text-[var(--color-ink)]/50">{{ formatoFechaFin(empresa.fechaFin) }}</span>
              <span
                class="font-semibold"
                :class="estadoCarteraColor[empresa.estado]"
              >{{ estadoCarteraLabel[empresa.estado] }}</span>
              <button
                v-if="empresa.estado === 'sin_fecha'"
                type="button"
                class="rounded-full border border-[var(--color-line)] px-2 py-0.5 text-[var(--color-ink)]/70 hover:bg-[var(--color-parchment)]"
                @click="irAEditarEmpresa"
              >
                Completar fecha
              </button>
              <button
                v-else
                type="button"
                class="rounded-full border border-[var(--color-line)] px-2 py-0.5 text-[var(--color-ink)]/70 hover:bg-[var(--color-parchment)]"
                @click="abrirGestion(empresa.empresaId, empresa.nombre)"
              >
                Gestionar
              </button>
            </span>
          </li>
        </ul>

        <template v-if="cartera && cartera.independientesPorVencer.length > 0">
          <p class="mb-1.5 mt-4 text-xs font-medium uppercase tracking-wide text-[var(--color-ink)]/50">
            Independientes con el ciclo por terminar
          </p>
          <ul class="space-y-1.5 text-sm">
            <li
              v-for="ind in cartera.independientesPorVencer"
              :key="ind.coacheeId"
            >
              <button
                type="button"
                class="flex w-full items-center justify-between rounded-lg border border-[var(--color-line)]/60 px-3 py-2 text-left hover:border-[var(--color-sage)] hover:bg-[var(--color-parchment)]/30"
                @click="verPerfil(ind.coacheeId)"
              >
                <span>{{ ind.nombre }}</span>
                <span class="text-xs font-semibold text-[var(--color-bronze)]">{{ ind.sesionesRestantes }} sesiones restantes</span>
              </button>
            </li>
          </ul>
        </template>
      </div>

      <!-- Proyección económica -->
      <div class="rounded-2xl border border-[var(--color-line)] bg-white p-4">
        <div class="mb-3 flex items-center justify-between">
          <h2 class="text-sm font-medium">
            Proyección económica
          </h2>
          <RouterLink
            to="/coach/negocio"
            class="text-xs text-[var(--color-sage)] hover:underline"
          >
            Ver detalle completo →
          </RouterLink>
        </div>
        <div
          v-if="comercialMes"
          class="mb-4 grid grid-cols-3 gap-3"
        >
          <div>
            <p class="text-xs text-[var(--color-ink)]/60">
              Ingreso del mes
            </p>
            <p class="font-[family-name:var(--font-mono)] text-lg text-[var(--color-sage)]">
              {{ formatoCLP.format(comercialMes.ingresoDelPeriodo) }}
            </p>
            <p
              v-if="comparativo && comparativo.variacionIngresoPct !== null"
              class="text-xs font-medium"
              :class="comparativo.variacionIngresoPct >= 0 ? 'text-[var(--color-sage)]' : 'text-[var(--color-bronze)]'"
            >
              {{ comparativo.variacionIngresoPct >= 0 ? '↑' : '↓' }} {{ Math.abs(comparativo.variacionIngresoPct) }}% vs. mes anterior
            </p>
          </div>
          <div>
            <p class="text-xs text-[var(--color-ink)]/60">
              Proyectado
            </p>
            <p class="font-[family-name:var(--font-mono)] text-lg text-[var(--color-bronze)]">
              {{ formatoCLP.format(comercialMes.ingresoProyectado) }}
            </p>
          </div>
          <div>
            <p class="text-xs text-[var(--color-ink)]/60">
              Horas realizadas
            </p>
            <p class="font-[family-name:var(--font-mono)] text-lg">
              {{ comercialMes.horasRealizadas }}
            </p>
          </div>
        </div>
        <ProyeccionIngresosChart :meses="proyeccionMensual" />
      </div>

      <!-- Coachees que necesitan atención (operativo día a día — nivel distinto al resto) -->
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
            class="grid gap-3 text-sm md:grid-cols-2 2xl:grid-cols-3"
          >
            <li
              v-for="fila in filasAtencion"
              :key="fila.coachee.coacheeId"
              class="rounded-xl border border-[var(--color-line)] p-3"
            >
              <div class="mb-2 flex items-start gap-2.5">
                <div
                  class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-ink)] text-xs font-semibold text-[var(--color-parchment)]"
                  aria-hidden="true"
                >
                  {{ iniciales(fila.coachee.nombre) }}
                </div>
                <div class="min-w-0 flex-1">
                  <button
                    type="button"
                    class="block truncate text-left font-medium transition-colors hover:text-[var(--color-sage)] hover:underline"
                    @click="verPerfil(fila.coachee.coacheeId)"
                  >
                    {{ fila.coachee.nombre }}
                  </button>
                  <p class="truncate text-xs text-[var(--color-ink)]/50">
                    {{ fila.empresaNombre ?? 'Independiente' }}
                    <template v-if="fila.cobro">
                      ·
                      <span
                        :class="{
                          'text-[var(--color-danger)]': fila.cobro.severidad === 'danger',
                          'text-[var(--color-sage)]': fila.cobro.severidad === 'sage',
                        }"
                      >{{ fila.cobro.texto }}</span>
                    </template>
                  </p>
                </div>
              </div>

              <div
                v-if="fila.primario"
                class="flex items-center justify-between gap-2 rounded-lg bg-[var(--color-parchment)]/50 px-2.5 py-1.5"
              >
                <span
                  class="text-xs font-medium"
                  :class="textoSeveridad[fila.primario.severidad]"
                >
                  {{ fila.primario.label }}
                </span>
                <button
                  v-if="fila.primario.accion"
                  type="button"
                  class="inline-flex shrink-0 items-center gap-1 rounded-full border border-[var(--color-line)] bg-white px-2 py-0.5 text-xs text-[var(--color-ink)]/70 hover:bg-[var(--color-parchment)] hover:text-[var(--color-ink)]"
                  @click="fila.primario.accion"
                >
                  <NavIcon
                    v-if="fila.primario.id !== 'plan-revisar'"
                    name="correo"
                    :size="11"
                  /> {{ fila.primario.accionLabel }}
                </button>
              </div>

              <div
                v-if="fila.secundarios.length > 0"
                class="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 px-0.5"
              >
                <button
                  v-for="item in fila.secundarios"
                  :key="item.id"
                  type="button"
                  class="text-[11px] font-medium disabled:cursor-default"
                  :class="[textoSeveridad[item.severidad], item.accion ? 'hover:underline' : '']"
                  :disabled="!item.accion"
                  @click="item.accion"
                >
                  {{ item.label }}
                </button>
              </div>
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
                class="font-medium transition-colors hover:text-[var(--color-sage)] hover:underline"
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

    <AppModal
      v-if="gestionModalAbierto && empresaGestion"
      :title="`Gestión de renovación — ${empresaGestion.nombre}`"
      @close="cerrarGestion"
    >
      <div class="space-y-4">
        <div>
          <p class="mb-1.5 text-xs font-medium uppercase tracking-wide text-[var(--color-ink)]/50">
            Historial
          </p>
          <p
            v-if="gestionCargando"
            class="text-sm text-[var(--color-ink)]/60"
          >
            Cargando…
          </p>
          <p
            v-else-if="gestionHistorial.length === 0"
            class="text-sm text-[var(--color-ink)]/60"
          >
            Todavía no hay gestión registrada para esta empresa.
          </p>
          <ul
            v-else
            class="max-h-56 space-y-2 overflow-y-auto text-sm"
          >
            <li
              v-for="g in gestionHistorial"
              :key="g.id"
              class="rounded-lg border border-[var(--color-line)]/60 px-3 py-2"
            >
              <p class="text-xs text-[var(--color-ink)]/50">
                {{ formatoFechaHora(g.createdAt) }}
                <template v-if="g.proximoSeguimiento">
                  · Próximo seguimiento: {{ formatoFechaFin(g.proximoSeguimiento) }}
                </template>
              </p>
              <p>{{ g.nota }}</p>
            </li>
          </ul>
        </div>

        <div class="border-t border-[var(--color-line)] pt-4">
          <p class="mb-1.5 text-xs font-medium uppercase tracking-wide text-[var(--color-ink)]/50">
            Nueva gestión
          </p>
          <textarea
            v-model="notaGestionForm"
            rows="3"
            placeholder="¿Qué se conversó? ¿En qué quedó?"
            class="mb-2 w-full rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm focus:border-[var(--color-sage)] focus:outline-none focus:ring-2 focus:ring-[var(--color-sage)]/30"
          />
          <label class="mb-3 block text-xs text-[var(--color-ink)]/60">
            Próximo seguimiento (opcional)
            <input
              v-model="proximoSeguimientoForm"
              type="date"
              class="mt-1 w-full rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm focus:border-[var(--color-sage)] focus:outline-none focus:ring-2 focus:ring-[var(--color-sage)]/30"
            >
          </label>
          <button
            type="button"
            class="w-full rounded-lg bg-[var(--color-ink)] px-3 py-2 text-sm text-[var(--color-parchment)] disabled:opacity-50"
            :disabled="gestionGuardando || !notaGestionForm.trim()"
            @click="guardarGestion"
          >
            {{ gestionGuardando ? 'Guardando…' : 'Registrar gestión' }}
          </button>
        </div>
      </div>
    </AppModal>
  </AppShell>
</template>
