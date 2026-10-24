<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import AppShell from '../../components/AppShell.vue'
import NavIcon from '../../components/NavIcon.vue'
import SkeletonBlock from '../../components/SkeletonBlock.vue'
import ErrorState from '../../components/ErrorState.vue'
import TabBar from '../../components/TabBar.vue'
import StatusBadge from '../../components/StatusBadge.vue'
import AppButton from '../../components/AppButton.vue'
import GestionModal from '../../components/GestionModal.vue'
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
import { listProspectos, type Prospecto } from '../../api/prospectos'
import { etapaEsCerrada } from '../../lib/etapaProspecto'
import { listPlanes, enviarRecordatorio, type PlanDesarrollo } from '../../api/planesDesarrollo'
import { getSolicitudes, type SolicitudProceso } from '../../api/satisfaccion'
import { listCoachees, type CoacheeListItem } from '../../api/coachees'
import { getResumenLegal, type ResumenLegal } from '../../api/legal'
import { getSesionesSemana, type Sesion } from '../../api/sesiones'
import { estadoVisual, ESTADO_VISUAL_LABEL, type EstadoVisualDocumento } from '../../lib/legalFormat'
import { coacheesQueNecesitanAlgo, type CoacheeAtencion } from '../../lib/dashboardAtencion'
import { buscarAproximado } from '../../lib/busquedaAproximada'
import { iniciales } from '../../lib/avatar'
import { agruparPorDia } from '../../lib/sesionesPorDia'
import { semaforoCartera, type Semaforo } from '../../lib/semaforoCartera'
import { inicioDeSemana, aFechaLocal } from '../../lib/dateRange'
import { ApiError } from '../../api/client'
import { notifySuccess, notifyError } from '../../lib/notify'
import { useCarga } from '../../lib/useCarga'

const router = useRouter()
const resumen = ref<ResumenNegocio | null>(null)
const alertas = ref<Alertas | null>(null)
const planesSinEnviar = ref<PlanDesarrollo[]>([])
const planesConCambiosSolicitados = ref<PlanDesarrollo[]>([])
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
const prospectosLista = ref<Prospecto[]>([])
// null = no se pudo determinar (la llamada falló): el checklist no lo da por pendiente.
const hayPlanes = ref<boolean | null>(null)

type Tab = 'coachees' | 'empresas' | 'solicitudes' | 'prospectos'
const tab = ref<Tab>('coachees')

const formatoCLP = new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 })

async function load() {
  const lunes = inicioDeSemana()
  const finSemana = new Date(lunes)
  finSemana.setDate(finSemana.getDate() + 7)

  // Críticas (sin ellas el panorama no tiene sentido): resumen, alertas y coachees.
  // El resto se tolera: si falla, el panel avisa en vez de mostrar un "todo al día" falso.
  const [
    r,
    a,
    coachees,
    sinEnviar,
    conCambiosSolicitados,
    solicitudes,
    legal,
    carteraData,
    semana,
    comercial,
    proyeccion,
    atencionData,
    comparativoData,
    prospectos,
    todosLosPlanes,
  ] = await Promise.all([
    getResumenNegocio(),
    getAlertas(),
    listCoachees(),
    tolerar(listPlanes('sin_enviar')),
    tolerar(listPlanes('cambios_solicitados')),
    tolerar(getSolicitudes('pendiente')),
    tolerar(getResumenLegal()),
    tolerar(getCarteraEmpresas()),
    tolerar(getSesionesSemana(aFechaLocal(lunes), aFechaLocal(finSemana))),
    tolerar(getResumenComercial('mes')),
    tolerar(getProyeccionMensual()),
    tolerar(getAtencionInmediata()),
    tolerar(getComparativo()),
    tolerar(listProspectos()),
    tolerar(listPlanes()),
  ])
  resumen.value = r
  alertas.value = a
  planesSinEnviar.value = sinEnviar ?? []
  planesConCambiosSolicitados.value = conCambiosSolicitados ?? []
  solicitudesPendientes.value = solicitudes ?? []
  resumenLegal.value = legal ?? { empresas: [], independientes: [] }
  coacheesLista.value = coachees
  sinCoacheesAun.value = coachees.length === 0
  cartera.value = carteraData ?? null
  sesionesSemana.value = semana ?? []
  comercialMes.value = comercial ?? null
  proyeccionMensual.value = proyeccion ?? []
  atencion.value = atencionData ?? null
  comparativo.value = comparativoData ?? null
  prospectosLista.value = prospectos ?? []
  hayPlanes.value = todosLosPlanes === undefined ? null : todosLosPlanes.length > 0
}

const { loading, error, fallos, recargar, tolerar } = useCarga(load)

onMounted(recargar)

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

const estadoCarteraTono: Record<EstadoCartera, 'danger' | 'bronze' | 'sage'> = {
  vencido: 'danger',
  vence_este_mes: 'danger',
  vence_este_semestre: 'bronze',
  sin_fecha: 'bronze',
  vigente: 'sage',
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

async function abrirGestion(empresaId: string, nombre: string) {
  empresaGestion.value = { empresaId, nombre }
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

async function guardarGestion(nota: string, proximoSeguimiento: string | undefined) {
  if (!empresaGestion.value) return
  gestionGuardando.value = true
  try {
    await crearGestion(empresaGestion.value.empresaId, nota, proximoSeguimiento)
    await notifySuccess('Gestión registrada')
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

// --- Prospectos con seguimiento vencido o para hoy — mismo criterio de "qué necesito hacer
// hoy" del resto del Panorama, calculado en el cliente (proximoSeguimiento ya viene resuelto
// desde el backend, ver ProspectosService.findAll). ---

function diasHastaSeguimiento(iso: string): number {
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  const fecha = new Date(`${iso}T00:00:00`)
  return Math.round((fecha.getTime() - hoy.getTime()) / 86400000)
}

const prospectosPorSeguir = computed(() =>
  prospectosLista.value
    .filter((p) => !etapaEsCerrada(p.etapa) && p.proximoSeguimiento && diasHastaSeguimiento(p.proximoSeguimiento) <= 0)
    .sort((a, b) => (a.proximoSeguimiento ?? '').localeCompare(b.proximoSeguimiento ?? '')),
)

function irAProspectos() {
  void router.push('/coach/prospectos')
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
      planesConCambiosSolicitados: planesConCambiosSolicitados.value,
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

// 2026-10-10: los chips con fondo+borde se reemplazan por texto con un punto de color — con
// varias banderas por coachee, tarjeta + chips + botón con borde daba "demasiadas cajas".
const textoSeveridad: Record<Severidad, string> = {
  danger: 'text-[var(--color-danger)]',
  bronze: 'text-[var(--color-bronze)]',
  sage: 'text-[var(--color-sage)]',
}
const textoEstadoLegal: Record<EstadoVisualDocumento, string> = {
  firmado: 'text-[var(--color-sage)]',
  pendiente: 'text-[var(--color-danger)]',
  vencido: 'text-[var(--color-bronze)]',
}
const puntoEstadoLegal: Record<EstadoVisualDocumento, string> = {
  firmado: 'bg-[var(--color-sage)]',
  pendiente: 'bg-[var(--color-danger)]',
  vencido: 'bg-[var(--color-bronze)]',
}
const puntoSeveridad: Record<Severidad, string> = {
  danger: 'bg-[var(--color-danger)]',
  bronze: 'bg-[var(--color-bronze)]',
  sage: 'bg-[var(--color-sage)]',
}

// Orden de las banderas: lo urgente para el coachee primero (riesgo de que la relación se
// enfríe), luego lo que sólo necesita un empujón, y al final lo que ya está en tu cancha
// (esperar a que el coachee responda a un comentario que ya dejaste en su plan).
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
  if (c.planCambiosSolicitados) {
    items.push({ id: 'plan-revisar', label: 'Esperando respuesta a tus cambios', severidad: 'sage', accionLabel: 'Ver plan →', accion: () => verPlan(c.coacheeId) })
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

const tabsAtencion = computed(() => [
  { key: 'coachees' as Tab, label: 'Coachees', badge: coacheesAtencion.value.length },
  { key: 'empresas' as Tab, label: 'Empresas', badge: empresasLegalPendientes.value.length },
  { key: 'solicitudes' as Tab, label: 'Solicitudes comerciales', badge: solicitudesPendientes.value.length },
  { key: 'prospectos' as Tab, label: 'Prospectos por seguir', badge: prospectosPorSeguir.value.length },
])

// --- Primeros pasos: empresa → coachee → ciclo → plan → sesión, calculado con datos reales.
// Un paso cuya fuente falló (null) no se da por pendiente, para no mostrar un falso "te falta". ---

const CLAVE_PASOS_OCULTOS = 'coachnexus:primeros-pasos-ocultos'

function leerPasosOcultos(): boolean {
  try {
    return localStorage.getItem(CLAVE_PASOS_OCULTOS) === '1'
  } catch {
    return false
  }
}

const pasosOcultos = ref(leerPasosOcultos())

function descartarPrimerosPasos() {
  pasosOcultos.value = true
  try {
    localStorage.setItem(CLAVE_PASOS_OCULTOS, '1')
  } catch {
    // sin almacenamiento: se oculta solo en esta visita
  }
}

const pasosIniciales = computed(() => [
  { key: 'empresa', label: 'Crear una empresa', to: '/coach/empresas', hecho: cartera.value === null ? null : cartera.value.empresas.length > 0 },
  { key: 'coachee', label: 'Crear un coachee', to: '/coach/coachees', hecho: coacheesLista.value.length > 0 },
  {
    key: 'ciclo',
    label: 'Definir un ciclo de sesiones',
    to: '/coach/coachees',
    hecho: resumen.value ? resumen.value.carteraCoachees.some((c) => c.totalSesiones !== null) : null,
  },
  { key: 'plan', label: 'Crear un plan de desarrollo', to: '/coach/coachees', hecho: hayPlanes.value },
  {
    key: 'sesion',
    label: 'Agendar una sesión',
    to: '/coach/agenda',
    hecho: resumen.value
      ? sesionesSemana.value.length > 0 || resumen.value.carteraCoachees.some((c) => c.sesionesRealizadas > 0)
      : null,
  },
])
const pasosHechos = computed(() => pasosIniciales.value.filter((p) => p.hecho).length)
const mostrarPrimerosPasos = computed(
  () => !pasosOcultos.value && pasosIniciales.value.some((p) => p.hecho === false),
)
</script>

<template>
  <AppShell>
    <div class="mb-5 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 class="font-[family-name:var(--font-heading)] text-xl font-semibold">
          Panorama
        </h1>
        <p class="text-sm text-[var(--color-muted)]">
          Tu semana, tu cartera y tu proyección — de un vistazo.
        </p>
      </div>

      <div class="relative w-full sm:w-72">
        <span class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-muted)]">
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
            class="px-2 py-2 text-xs text-[var(--color-muted)]"
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
              class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)] text-xs font-semibold text-[var(--color-on-primary)]"
              aria-hidden="true"
            >
              {{ iniciales(c.nombre) }}
            </div>
            <div class="min-w-0">
              <p class="truncate text-sm">
                {{ c.nombre }}
              </p>
              <p class="truncate text-xs text-[var(--color-muted)]">
                {{ c.empresa?.nombre ?? 'Independiente' }}
              </p>
            </div>
          </button>
        </div>
      </div>
    </div>

    <template v-if="!loading && !error">
      <div
        v-if="fallos > 0"
        role="status"
        class="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[var(--color-bronze)]/40 bg-[var(--color-bronze)]/10 px-4 py-3 text-sm"
      >
        <span>
          No pudimos cargar {{ fallos === 1 ? 'una sección' : `${fallos} secciones` }} del panorama: lo que ves puede estar incompleto.
        </span>
        <AppButton
          variant="secondary"
          size="sm"
          @click="recargar"
        >
          Reintentar
        </AppButton>
      </div>

      <!-- Primeros pasos: derivado de datos reales, solo mientras falte algo. -->
      <section
        v-if="mostrarPrimerosPasos"
        aria-labelledby="primeros-pasos-titulo"
        class="mb-5 rounded-2xl border border-[var(--color-sage)]/40 bg-[var(--color-sage)]/5 p-4"
      >
        <div class="mb-2 flex items-start justify-between gap-3">
          <div>
            <h2
              id="primeros-pasos-titulo"
              class="text-sm font-medium"
            >
              Primeros pasos
            </h2>
            <p class="text-xs text-[var(--color-muted)]">
              {{ pasosHechos }} de {{ pasosIniciales.length }} completados.
            </p>
          </div>
          <AppButton
            variant="ghost"
            size="sm"
            @click="descartarPrimerosPasos"
          >
            Ocultar
          </AppButton>
        </div>
        <ol class="grid gap-1.5 text-sm sm:grid-cols-2 lg:grid-cols-5">
          <li
            v-for="paso in pasosIniciales"
            :key="paso.key"
            class="flex items-center gap-2"
          >
            <span
              class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs"
              :class="paso.hecho ? 'bg-[var(--color-sage)] text-white' : 'border border-[var(--color-line)] bg-white text-[var(--color-muted)]'"
              aria-hidden="true"
            >{{ paso.hecho ? '✓' : '' }}</span>
            <span v-if="paso.hecho">
              <span class="sr-only">Hecho: </span>{{ paso.label }}
            </span>
            <RouterLink
              v-else
              :to="paso.to"
              class="font-medium text-[var(--color-sage)] hover:underline"
            >
              {{ paso.label }}
            </RouterLink>
          </li>
        </ol>
      </section>
    </template>

    <SkeletonBlock
      v-if="loading"
      variant="cards"
    />
    <ErrorState
      v-else-if="error"
      @retry="recargar"
    />
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
        class="inline-block rounded-lg bg-[var(--color-primary)] px-3 py-2 text-xs text-[var(--color-on-primary)]"
      >
        Ir a Coachees
      </RouterLink>
    </div>
    <div
      v-else-if="resumen && alertas"
      class="flex flex-col gap-5 lg:flex-row lg:items-start"
    >
      <!-- Columna derecha (Atención inmediata + Proyección): va primero en el DOM para que en
           mobile (flex-col, sin "lg:") aparezca primero — es la prioridad #1 del día, no las
           KPIs — y en desktop se manda a la derecha con lg:order-2. Flexbox con `order` en vez
           de un grid con posiciones (col-start/row-start) explícitas: con filas dispersas (la
           derecha tiene 2 secciones, la izquierda 4) algunos navegadores calculaban mal la
           altura de esas filas y dejaban huecos enormes / perdían el padding de la página. -->
      <aside class="space-y-5 lg:order-2 lg:w-[34%] lg:shrink-0">
        <!-- Atención inmediata: "¿qué necesito hacer hoy?" — responde esto antes que
             cualquier métrica general. -->
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
              <p class="mb-1 text-xs font-medium uppercase tracking-wide text-[var(--color-muted)]">
                Sesiones sin confirmar (hoy/mañana)
              </p>
              <ul class="divide-y divide-[var(--color-line)] text-sm">
                <li
                  v-for="s in atencion.sesionesSinConfirmar"
                  :key="s.sesionId"
                  class="flex flex-wrap items-center justify-between gap-2 py-2 first:pt-0 last:pb-0"
                >
                  <span>
                    {{ s.nombre }}
                    <span class="text-[var(--color-muted)]">— {{ formatoHora(s.fechaHora) }}</span>
                  </span>
                  <AppButton
                    variant="secondary"
                    size="sm"
                    @click="verPerfil(s.coacheeId)"
                  >
                    Ver coachee
                  </AppButton>
                </li>
              </ul>
            </div>

            <div v-if="atencion.contratosUrgentes.length > 0">
              <p class="mb-1 text-xs font-medium uppercase tracking-wide text-[var(--color-muted)]">
                Contratos por vencer sin gestión
              </p>
              <ul class="divide-y divide-[var(--color-line)] text-sm">
                <li
                  v-for="e in atencion.contratosUrgentes"
                  :key="e.empresaId"
                  class="flex flex-wrap items-center justify-between gap-2 py-2 first:pt-0 last:pb-0"
                >
                  <span>
                    {{ e.nombre }}
                    <span class="text-[var(--color-danger)]">— {{ textoVencimiento(e.diasParaVencer) }}</span>
                  </span>
                  <AppButton
                    variant="secondary"
                    size="sm"
                    @click="abrirGestion(e.empresaId, e.nombre)"
                  >
                    Gestionar
                  </AppButton>
                </li>
              </ul>
            </div>

            <div v-if="atencion.pagosPendientes.length > 0">
              <p class="mb-1 text-xs font-medium uppercase tracking-wide text-[var(--color-muted)]">
                Pagos pendientes
              </p>
              <ul class="divide-y divide-[var(--color-line)] text-sm">
                <li
                  v-for="e in atencion.pagosPendientes"
                  :key="e.empresaId"
                  class="flex flex-wrap items-center justify-between gap-2 py-2 first:pt-0 last:pb-0"
                >
                  <span>
                    {{ e.nombre }}
                    <span class="text-[var(--color-danger)]">— {{ formatoCLP.format(e.gastoDelPeriodo) }}</span>
                  </span>
                  <AppButton
                    variant="secondary"
                    size="sm"
                    @click="irAEditarEmpresa"
                  >
                    Ver empresa
                  </AppButton>
                </li>
              </ul>
            </div>
          </div>
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
              <p class="text-xs text-[var(--color-muted)]">
                Ingreso del mes
              </p>
              <p class="cifra text-lg text-[var(--color-sage)]">
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
              <p class="text-xs text-[var(--color-muted)]">
                Proyectado
              </p>
              <p class="cifra text-lg text-[var(--color-bronze)]">
                {{ formatoCLP.format(comercialMes.ingresoProyectado) }}
              </p>
            </div>
            <div>
              <p class="text-xs text-[var(--color-muted)]">
                Horas realizadas
              </p>
              <p class="cifra text-lg font-semibold">
                {{ comercialMes.horasRealizadas }}
              </p>
            </div>
          </div>
          <ProyeccionIngresosChart :meses="proyeccionMensual" />
        </div>
      </aside>

      <!-- Columna izquierda: KPIs, esta semana, cartera de empresas y coachees/empresas que
           necesitan seguimiento. -->
      <main class="min-w-0 space-y-5 lg:order-1 lg:flex-1">
        <!-- KPIs: responden directo "¿qué tengo esta semana, qué se me vence, cuánto voy a
           facturar, qué me falta completar?" -->
        <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div class="rounded-2xl border border-[var(--color-line)] bg-white p-4">
            <p class="text-xs text-[var(--color-muted)]">
              Horas esta semana
            </p>
            <p class="cifra text-2xl font-semibold">
              {{ comparativo ? `${comparativo.horasComprometidasSemana}/${comparativo.horasDisponiblesSemana}` : sesionesSemana.length }} <span class="text-sm font-normal text-[var(--color-muted)]">hrs</span>
            </p>
          </div>
          <div class="rounded-2xl border border-[var(--color-line)] bg-white p-4">
            <p class="text-xs text-[var(--color-muted)]">
              Empresas por renovar este mes
            </p>
            <p
              class="cifra text-2xl font-semibold"
              :class="empresasPorAccion > 0 ? 'text-[var(--color-danger)]' : 'text-[var(--color-sage)]'"
            >
              {{ empresasPorAccion }}
            </p>
          </div>
          <div class="rounded-2xl border border-[var(--color-line)] bg-white p-4">
            <p class="text-xs text-[var(--color-muted)]">
              Ingreso esperado este mes
            </p>
            <p class="cifra text-2xl font-semibold">
              {{ formatoCLP.format(ingresoEsperadoMes) }}
            </p>
          </div>
          <div class="rounded-2xl border border-[var(--color-line)] bg-white p-4">
            <p class="text-xs text-[var(--color-muted)]">
              Empresas sin fecha de contrato
            </p>
            <p
              class="cifra text-2xl font-semibold"
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
            class="text-sm text-[var(--color-muted)]"
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
              <p class="mb-1.5 text-xs font-medium uppercase tracking-wide text-[var(--color-muted)]">
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
                    <span class="shrink-0 cifra text-xs text-[var(--color-muted)]">
                      {{ formatoHora(sesion.fechaHora) }}
                    </span>
                    <span class="min-w-0 flex-1 truncate">
                      {{ sesion.coachee?.nombre ?? 'Coachee' }}
                      <span class="text-[var(--color-muted)]">
                        — {{ sesion.coachee?.empresa?.nombre ?? 'Independiente' }}
                      </span>
                    </span>
                    <StatusBadge
                      v-if="!sesion.confirmada"
                      tone="bronze"
                      class="shrink-0"
                    >
                      Sin confirmar
                    </StatusBadge>
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
            class="text-sm text-[var(--color-muted)]"
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
                <span class="text-[var(--color-muted)]">{{ formatoFechaFin(empresa.fechaFin) }}</span>
                <StatusBadge :tone="estadoCarteraTono[empresa.estado]">{{ estadoCarteraLabel[empresa.estado] }}</StatusBadge>
                <AppButton
                  v-if="empresa.estado === 'sin_fecha'"
                  variant="secondary"
                  size="sm"
                  @click="irAEditarEmpresa"
                >Completar fecha</AppButton>
                <AppButton
                  v-else
                  variant="secondary"
                  size="sm"
                  @click="abrirGestion(empresa.empresaId, empresa.nombre)"
                >Gestionar</AppButton>
              </span>
            </li>
          </ul>

          <template v-if="cartera && cartera.independientesPorVencer.length > 0">
            <p class="mb-1.5 mt-4 text-xs font-medium uppercase tracking-wide text-[var(--color-muted)]">
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

        <!-- Coachees que necesitan atención (operativo día a día — nivel distinto al resto) -->
        <div class="rounded-2xl border border-[var(--color-line)] bg-white p-4">
          <div class="mb-3 overflow-x-auto">
            <TabBar
              v-model="tab"
              :tabs="tabsAtencion"
            />
          </div>

          <div v-if="tab === 'coachees'">
            <p
              v-if="coacheesAtencion.length === 0"
              class="text-sm text-[var(--color-sage)]"
            >
              ✓ Todo al día — ningún coachee necesita algo de ti ahora mismo.
            </p>
            <!-- Lista plana (sin tarjeta por coachee ni chips con fondo): cada fila es avatar +
               nombre + banderas como texto con un punto de color, y una sola acción como enlace.
               Pedido del usuario 2026-10-10: "se ve mal con tantas cajas". -->
            <ul
              v-else
              class="grid text-sm md:grid-cols-2 md:gap-x-8 2xl:grid-cols-3"
            >
              <li
                v-for="fila in filasAtencion"
                :key="fila.coachee.coacheeId"
                class="flex items-start gap-3 border-b border-[var(--color-line)]/70 py-3"
              >
                <div
                  class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)] text-xs font-semibold text-[var(--color-on-primary)]"
                  aria-hidden="true"
                >
                  {{ iniciales(fila.coachee.nombre) }}
                </div>
                <div class="min-w-0 flex-1">
                  <div class="flex items-baseline justify-between gap-2">
                    <button
                      type="button"
                      class="truncate text-left font-medium transition-colors hover:text-[var(--color-sage)] hover:underline"
                      @click="verPerfil(fila.coachee.coacheeId)"
                    >
                      {{ fila.coachee.nombre }}
                    </button>
                    <button
                      v-if="fila.primario?.accion"
                      type="button"
                      class="group inline-flex shrink-0 items-center gap-1 text-xs font-medium text-[var(--color-sage)] hover:underline"
                      @click="fila.primario.accion"
                    >
                      {{ fila.primario.accionLabel?.replace(' →', '') }}
                      <span
                        aria-hidden="true"
                        class="transition-transform group-hover:translate-x-0.5"
                      >→</span>
                    </button>
                  </div>
                  <p class="truncate text-xs text-[var(--color-muted)]">
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
                  <ul
                    v-if="fila.primario"
                    class="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-xs"
                  >
                    <li
                      v-for="item in [fila.primario, ...fila.secundarios]"
                      :key="item.id"
                      class="inline-flex items-center gap-1.5"
                      :class="textoSeveridad[item.severidad]"
                    >
                      <span
                        class="h-1.5 w-1.5 shrink-0 rounded-full"
                        :class="puntoSeveridad[item.severidad]"
                        aria-hidden="true"
                      />
                      <button
                        v-if="item !== fila.primario && item.accion"
                        type="button"
                        class="hover:underline"
                        :title="item.accionLabel"
                        @click="item.accion"
                      >
                        {{ item.label }}
                      </button>
                      <span v-else>{{ item.label }}</span>
                    </li>
                  </ul>
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
            <!-- Mismo lenguaje visual que la lista de coachees: fila plana con ícono, el estado de
               cada documento como texto + punto de color, y la acción como enlace. -->
            <ul
              v-else
              class="grid text-sm md:grid-cols-2 md:gap-x-8 2xl:grid-cols-3"
            >
              <li
                v-for="e in empresasLegalPendientes"
                :key="e.empresaId"
                class="flex items-start gap-3 border-b border-[var(--color-line)]/70 py-3"
              >
                <div
                  class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-sage)]/12 text-[var(--color-sage)]"
                  aria-hidden="true"
                >
                  <NavIcon
                    name="empresas"
                    :size="15"
                  />
                </div>
                <div class="min-w-0 flex-1">
                  <div class="flex items-baseline justify-between gap-2">
                    <RouterLink
                      to="/coach/legal"
                      class="truncate font-medium transition-colors hover:text-[var(--color-sage)] hover:underline"
                    >
                      {{ e.nombre }}
                    </RouterLink>
                    <RouterLink
                      to="/coach/legal"
                      class="group inline-flex shrink-0 items-center gap-1 text-xs font-medium text-[var(--color-sage)] hover:underline"
                    >
                      Revisar
                      <span
                        aria-hidden="true"
                        class="transition-transform group-hover:translate-x-0.5"
                      >→</span>
                    </RouterLink>
                  </div>
                  <ul class="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-xs">
                    <li
                      v-for="d in [{ label: 'Contrato', doc: e.contrato }, { label: 'NDA', doc: e.nda }]"
                      :key="d.label"
                      class="inline-flex items-center gap-1.5"
                      :class="textoEstadoLegal[estadoVisual(d.doc)]"
                    >
                      <span
                        v-if="estadoVisual(d.doc) === 'firmado'"
                        aria-hidden="true"
                      >✓</span>
                      <span
                        v-else
                        class="h-1.5 w-1.5 shrink-0 rounded-full"
                        :class="puntoEstadoLegal[estadoVisual(d.doc)]"
                        aria-hidden="true"
                      />
                      {{ d.label }} {{ ESTADO_VISUAL_LABEL[estadoVisual(d.doc)].toLowerCase() }}
                    </li>
                  </ul>
                </div>
              </li>
            </ul>
          </div>

          <div v-else-if="tab === 'solicitudes'">
            <p
              v-if="solicitudesPendientes.length === 0"
              class="text-sm text-[var(--color-muted)]"
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
                  class="text-[var(--color-muted)]"
                >— {{ s.empresa.nombre }}</span>
              </li>
            </ul>
          </div>

          <div v-else>
            <p
              v-if="prospectosPorSeguir.length === 0"
              class="text-sm text-[var(--color-sage)]"
            >
              ✓ Ningún prospecto necesita seguimiento ahora mismo.
            </p>
            <ul
              v-else
              class="space-y-1.5 text-sm"
            >
              <li
                v-for="p in prospectosPorSeguir"
                :key="p.id"
                class="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[var(--color-line)]/60 px-3 py-2"
              >
                <span>
                  {{ p.nombre }}
                  <span class="text-[var(--color-danger)]">— {{ textoVencimiento(diasHastaSeguimiento(p.proximoSeguimiento!)) }}</span>
                </span>
                <AppButton
                  variant="secondary"
                  size="sm"
                  @click="irAProspectos"
                >
                  Ver prospectos
                </AppButton>
              </li>
            </ul>
          </div>
        </div>
      </main>
    </div>

    <GestionModal
      v-if="gestionModalAbierto && empresaGestion"
      :title="`Gestión de renovación — ${empresaGestion.nombre}`"
      :historial="gestionHistorial"
      :cargando="gestionCargando"
      :guardando="gestionGuardando"
      @guardar="guardarGestion"
      @close="cerrarGestion"
    />
  </AppShell>
</template>
