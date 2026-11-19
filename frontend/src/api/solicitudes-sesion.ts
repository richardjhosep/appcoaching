import { apiRequest } from './client'

export type EstadoSolicitudSesion = 'pendiente' | 'aprobada' | 'rechazada' | 'contrapropuesta'

export interface SolicitudSesion {
  id: string
  coacheeId: string
  fechaHoraPropuesta: string
  motivo: string | null
  estado: EstadoSolicitudSesion
  respuestaCoach: string | null
  fechaHoraContrapropuesta: string | null
  linkVideollamada: string | null
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
  linkVideollamada?: string
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

export function getMisSolicitudesSesion(): Promise<SolicitudSesion[]> {
  return apiRequest<SolicitudSesion[]>('/solicitudes-sesion/mias')
}

export function contraproponerSolicitudSesion(
  id: string,
  dto: { fechaHora: string; respuestaCoach?: string; linkVideollamada?: string },
): Promise<SolicitudSesion> {
  return apiRequest<SolicitudSesion>(`/solicitudes-sesion/${id}/contraproponer`, {
    method: 'POST',
    body: dto,
  })
}

export function resolverContrapropuesta(id: string, aceptar: boolean): Promise<SolicitudSesion> {
  return apiRequest<SolicitudSesion>(
    `/solicitudes-sesion/${id}/${aceptar ? 'aceptar' : 'rechazar'}-contrapropuesta`,
    { method: 'POST' },
  )
}
