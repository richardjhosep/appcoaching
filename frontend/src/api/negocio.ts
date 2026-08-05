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

export interface ResumenNegocio {
  porEmpresa: EmpresaCobro[]
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

export interface CoacheeCobro {
  coacheeId: string
  nombre: string
  empresaNombre: string | null
  horasRealizadas: number
  ingresoDelPeriodo: number
  ingresoProyectado: number
}

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
