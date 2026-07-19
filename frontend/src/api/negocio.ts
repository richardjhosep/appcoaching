import { apiRequest } from './client'

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
