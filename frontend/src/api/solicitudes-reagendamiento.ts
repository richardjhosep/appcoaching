import { apiRequest } from './client'

export type EstadoSolicitudReagendamiento = 'pendiente' | 'resuelta'

export interface SolicitudReagendamiento {
  id: string
  sesionId: string
  coacheeId: string
  motivo: string | null
  estado: EstadoSolicitudReagendamiento
  respuestaCoach: string | null
  createdAt: string
  resolvedAt: string | null
  sesion?: { id: string; fechaHora: string }
  coachee?: { id: string; nombre: string }
}

export interface ResponderSolicitudInput {
  nuevaFechaHora?: string
  respuestaCoach?: string
}

export function getSolicitudesReagendamiento(): Promise<SolicitudReagendamiento[]> {
  return apiRequest<SolicitudReagendamiento[]>('/solicitudes-reagendamiento')
}

export function responderSolicitudReagendamiento(
  id: string,
  dto: ResponderSolicitudInput,
): Promise<SolicitudReagendamiento> {
  return apiRequest<SolicitudReagendamiento>(`/solicitudes-reagendamiento/${id}/responder`, {
    method: 'POST',
    body: dto,
  })
}
