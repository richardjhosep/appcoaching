import { apiRequest } from './client'

export type EstadoSolicitudSesion = 'pendiente' | 'aprobada' | 'rechazada'

export interface SolicitudSesion {
  id: string
  coacheeId: string
  fechaHoraPropuesta: string
  motivo: string | null
  estado: EstadoSolicitudSesion
  respuestaCoach: string | null
  sesionCreadaId: string | null
  createdAt: string
  resolvedAt: string | null
  coachee?: { id: string; nombre: string }
}

export function crearSolicitudSesion(
  fechaHoraPropuesta: string,
  motivo?: string,
): Promise<SolicitudSesion> {
  return apiRequest<SolicitudSesion>('/solicitudes-sesion', {
    method: 'POST',
    body: { fechaHoraPropuesta, motivo: motivo || undefined },
  })
}

export function getSolicitudesSesionPendientes(): Promise<SolicitudSesion[]> {
  return apiRequest<SolicitudSesion[]>('/solicitudes-sesion')
}

export interface ResponderSolicitudSesionInput {
  aprobar: boolean
  respuestaCoach?: string
}

export function responderSolicitudSesion(
  id: string,
  dto: ResponderSolicitudSesionInput,
): Promise<SolicitudSesion> {
  return apiRequest<SolicitudSesion>(`/solicitudes-sesion/${id}/responder`, {
    method: 'POST',
    body: dto,
  })
}
