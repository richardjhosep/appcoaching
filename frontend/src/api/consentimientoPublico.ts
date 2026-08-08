import { publicRequest } from './client'

export type EstadoSolicitudConsentimiento = 'pendiente' | 'aceptado' | 'rechazado'

export interface SolicitudConsentimientoPublica {
  nombre: string
  estado: EstadoSolicitudConsentimiento
  expirada: boolean
}

export function getSolicitud(token: string): Promise<SolicitudConsentimientoPublica> {
  return publicRequest<SolicitudConsentimientoPublica>(`/consentimiento/${token}`)
}

export function aceptarSolicitud(token: string): Promise<{ success: boolean }> {
  return publicRequest<{ success: boolean }>(`/consentimiento/${token}/aceptar`, { method: 'POST' })
}

export function rechazarSolicitud(token: string): Promise<{ success: boolean }> {
  return publicRequest<{ success: boolean }>(`/consentimiento/${token}/rechazar`, { method: 'POST' })
}
