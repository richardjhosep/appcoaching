import { apiRequest } from './client'

export type EstadoSolicitudProceso = 'pendiente' | 'atendida'

export interface RespuestaSatisfaccion {
  categoria: string
  valor: number
}

export interface Encuesta {
  id: string
  empresaId: string
  cicloId: string | null
  respuestas: RespuestaSatisfaccion[] | null
  calificacion: number
  comentario: string | null
  createdAt: string
  ciclo?: {
    id: string
    fechaCierre: string | null
    coachee?: { id: string; nombre: string }
  }
}

export interface SolicitudProceso {
  id: string
  empresaId: string
  nombreSugerido: string
  mensaje: string | null
  estado: EstadoSolicitudProceso
  createdAt: string
  empresa?: { id: string; nombre: string }
}

export interface KpisEmpresa {
  procesosTerminados: number
  procesosEnCurso: number
  tasaAsistencia: number | null
  satisfaccionPromedio: number | null
}

export function crearEncuesta(
  cicloId: string,
  respuestas: RespuestaSatisfaccion[],
  comentario?: string,
): Promise<Encuesta> {
  return apiRequest<Encuesta>('/satisfaccion/encuestas', {
    method: 'POST',
    body: { cicloId, respuestas, comentario },
  })
}

export function getMisEncuestas(): Promise<Encuesta[]> {
  return apiRequest<Encuesta[]>('/satisfaccion/encuestas/me')
}

export function getEncuestasDeEmpresa(empresaId: string): Promise<Encuesta[]> {
  return apiRequest<Encuesta[]>(`/satisfaccion/encuestas/${empresaId}`)
}

export function crearSolicitud(nombreSugerido: string, mensaje?: string): Promise<SolicitudProceso> {
  return apiRequest<SolicitudProceso>('/satisfaccion/solicitudes', {
    method: 'POST',
    body: { nombreSugerido, mensaje },
  })
}

export function getMisSolicitudes(): Promise<SolicitudProceso[]> {
  return apiRequest<SolicitudProceso[]>('/satisfaccion/solicitudes/me')
}

export function getSolicitudes(estado?: EstadoSolicitudProceso): Promise<SolicitudProceso[]> {
  const query = estado ? `?estado=${estado}` : ''
  return apiRequest<SolicitudProceso[]>(`/satisfaccion/solicitudes${query}`)
}

export function atenderSolicitud(id: string): Promise<SolicitudProceso> {
  return apiRequest<SolicitudProceso>(`/satisfaccion/solicitudes/${id}/atender`, {
    method: 'PATCH',
  })
}

export function getMisKpis(): Promise<KpisEmpresa> {
  return apiRequest<KpisEmpresa>('/satisfaccion/kpis/me')
}

export function getKpisDeEmpresa(empresaId: string): Promise<KpisEmpresa> {
  return apiRequest<KpisEmpresa>(`/satisfaccion/kpis/${empresaId}`)
}

export interface PuntoTendencia {
  mes: string
  etiqueta: string
  satisfaccionPromedio: number | null
  pctLogrado: number | null
  tasaAsistencia: number | null
}

export function getMiTendencia(): Promise<PuntoTendencia[]> {
  return apiRequest<PuntoTendencia[]>('/satisfaccion/tendencia/me')
}
