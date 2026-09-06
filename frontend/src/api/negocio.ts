import { apiRequest } from './client'
import type { ResultadoCiclo } from './ciclos'

export interface EmpresaCobro {
  empresaId: string
  nombre: string
  pagada: boolean
  horasContratadas: number | null
  horasConsumidas: number
  ingresoDelPeriodo: number
  ingresoProyectado: number
}

export interface CoacheeCobro {
  coacheeId: string
  nombre: string
  empresaNombre: string | null
  horasRealizadas: number
  ingresoDelPeriodo: number
  ingresoProyectado: number
}

export interface ResumenNegocio {
  porEmpresa: EmpresaCobro[]
  // El backend ya lo incluye (calcularResumenCobros() completo) — sólo faltaba declararlo acá.
  porCoachee: CoacheeCobro[]
  horasRealizadasTotal: number
  ingresoDelPeriodoTotal: number
  ingresoProyectadoTotal: number
  coacheesActivos: number
  satisfaccionPromedio: number | null
}

export interface AlertaCoachee {
  coacheeId: string
  nombre: string
}

export interface Alertas {
  ciclosPorVencer: Array<AlertaCoachee & { sesionesRestantes: number }>
  coacheesSinLogros: AlertaCoachee[]
  coacheesSinProximaSesion: AlertaCoachee[]
}

export interface AvancePorArea {
  area: string
  avancePromedio: number
  coacheesCount: number
}

export function getResumenNegocio(): Promise<ResumenNegocio> {
  return apiRequest<ResumenNegocio>('/negocio/resumen')
}

export function getAlertas(): Promise<Alertas> {
  return apiRequest<Alertas>('/negocio/alertas')
}

export function getAvancePorArea(): Promise<AvancePorArea[]> {
  return apiRequest<AvancePorArea[]>('/negocio/avance-por-area')
}

export type PeriodoComercial = 'mes' | 'semestre' | 'anio'

export interface ResumenComercial {
  periodo: PeriodoComercial
  ingresoDelPeriodo: number
  ingresoProyectado: number
  horasRealizadas: number
  solicitudesNuevas: number
  solicitudesAtendidas: number
  solicitudesPendientes: number
  procesosIniciados: number
  procesosCerrados: number
  procesosCerradosPorResultado: Record<ResultadoCiclo, number>
  reagendamientosSolicitados: number
  porCoachee: CoacheeCobro[]
}

export function getResumenComercial(periodo: PeriodoComercial): Promise<ResumenComercial> {
  return apiRequest<ResumenComercial>(`/negocio/comercial?periodo=${periodo}`)
}

export interface MiInversion {
  periodo: PeriodoComercial
  horasRealizadas: number
  montoDelPeriodo: number
  montoProyectado: number
  tarifaPropia: number
}

/** Solo aplica a coachees independientes — null si el coachee pertenece a una empresa (ese
 * gasto es de la empresa, no algo que el coachee autogestione). No es un estado de pago: el
 * sistema no rastrea si un independiente "pagó", solo cuánto generó en el período. */
export function getMiInversion(periodo: PeriodoComercial): Promise<MiInversion | null> {
  return apiRequest<MiInversion | null>(`/negocio/mi-inversion?periodo=${periodo}`)
}

export interface ContribuyenteMes {
  nombre: string
  monto: number
}

export interface ProyeccionMes {
  mes: string
  etiqueta: string
  total: number
  porEmpresa: ContribuyenteMes[]
  porCoachee: ContribuyenteMes[]
}

export function getProyeccionMensual(): Promise<ProyeccionMes[]> {
  return apiRequest<ProyeccionMes[]>('/negocio/proyeccion-mensual')
}

export interface CoacheeGastoBruto {
  coacheeId: string
  nombre: string
  empresaNombre: string | null
  horasRealizadas: number
  gastoBrutoDelPeriodo: number
  gastoBrutoProyectado: number
}

export interface ResumenFinanzasEmpresa {
  pagada: boolean
  horasContratadas: number | null
  horasConsumidas: number
  gastoDelPeriodo: number
  gastoProyectado: number
  gastoPendiente: number
  porCoachee: CoacheeGastoBruto[]
}

export interface ProyeccionMesEmpresa {
  mes: string
  etiqueta: string
  total: number
  porCoachee: ContribuyenteMes[]
}

export function getMiResumenFinanciero(): Promise<ResumenFinanzasEmpresa> {
  return apiRequest<ResumenFinanzasEmpresa>('/negocio/empresa/resumen')
}

export function getMiProyeccionFinanciera(): Promise<ProyeccionMesEmpresa[]> {
  return apiRequest<ProyeccionMesEmpresa[]>('/negocio/empresa/proyeccion')
}

export interface ResumenAcumuladoEmpresa {
  anio: number
  semestre: 1 | 2
  gastoEjecutadoSemestre: number
  gastoAgendadoSemestre: number
  gastoEjecutadoAnio: number
  gastoAgendadoAnio: number
}

export function getMiResumenAcumulado(): Promise<ResumenAcumuladoEmpresa> {
  return apiRequest<ResumenAcumuladoEmpresa>('/negocio/empresa/acumulado')
}

export interface ProcesoConRetorno {
  coacheeNombre: string
  cicloId: string
  fechaApertura: string
  fechaCierre: string
  costo: number
  resultado: ResultadoCiclo
  impactoNegocio: string | null
}

export interface RetornoInversionEmpresa {
  costoTotalProcesosCerrados: number
  costoPromedioPorProceso: number | null
  distribucionResultados: Record<ResultadoCiclo, number>
  procesos: ProcesoConRetorno[]
}

export function getMiRetornoInversion(): Promise<RetornoInversionEmpresa> {
  return apiRequest<RetornoInversionEmpresa>('/negocio/empresa/retorno')
}

export type EstadoCartera = 'sin_fecha' | 'vencido' | 'vence_este_mes' | 'vence_este_semestre' | 'vigente'

export interface UltimaGestionCartera {
  nota: string
  fecha: string
  proximoSeguimiento: string | null
}

export interface EmpresaCartera {
  empresaId: string
  nombre: string
  fechaFin: string | null
  pagada: boolean
  horasContratadas: number | null
  horasConsumidasEsteMes: number
  estado: EstadoCartera
  diasParaVencer: number | null
  ultimaGestion: UltimaGestionCartera | null
}

export interface IndependientePorVencer {
  coacheeId: string
  nombre: string
  sesionesRestantes: number
}

export interface ResumenCartera {
  empresas: EmpresaCartera[]
  independientesPorVencer: IndependientePorVencer[]
}

export function getCarteraEmpresas(): Promise<ResumenCartera> {
  return apiRequest<ResumenCartera>('/negocio/cartera')
}

export interface SesionSinConfirmar {
  sesionId: string
  coacheeId: string
  nombre: string
  fechaHora: string
}

export interface ContratoUrgente {
  empresaId: string
  nombre: string
  diasParaVencer: number | null
  ultimaGestion: UltimaGestionCartera | null
}

export interface PagoPendiente {
  empresaId: string
  nombre: string
  gastoDelPeriodo: number
}

export interface AtencionInmediata {
  sesionesSinConfirmar: SesionSinConfirmar[]
  contratosUrgentes: ContratoUrgente[]
  pagosPendientes: PagoPendiente[]
}

export function getAtencionInmediata(): Promise<AtencionInmediata> {
  return apiRequest<AtencionInmediata>('/negocio/atencion')
}

export interface ComparativoYCapacidad {
  ingresoMesActual: number
  ingresoMesAnterior: number
  variacionIngresoPct: number | null
  coachingsIniciadosMesActual: number
  coachingsIniciadosMesAnterior: number
  horasComprometidasSemana: number
  horasDisponiblesSemana: number
}

export function getComparativo(): Promise<ComparativoYCapacidad> {
  return apiRequest<ComparativoYCapacidad>('/negocio/comparativo')
}

export function enviarRecordatorioSesion(coacheeId: string): Promise<{ success: boolean }> {
  return apiRequest<{ success: boolean }>(`/negocio/coachees/${coacheeId}/recordatorio-sesion`, {
    method: 'POST',
  })
}

export function enviarRecordatorioLogro(coacheeId: string): Promise<{ success: boolean }> {
  return apiRequest<{ success: boolean }>(`/negocio/coachees/${coacheeId}/recordatorio-logro`, {
    method: 'POST',
  })
}
