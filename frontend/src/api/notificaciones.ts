import { apiRequest } from './client'

export type TipoNotificacion = 'reagendamiento_solicitado' | 'reagendamiento_resuelto'

export interface Notificacion {
  id: string
  tipo: TipoNotificacion
  mensaje: string
  link: string | null
  leida: boolean
  createdAt: string
}

export function getMisNotificaciones(): Promise<Notificacion[]> {
  return apiRequest<Notificacion[]>('/notificaciones/me')
}

export function getNoLeidasCount(): Promise<{ count: number }> {
  return apiRequest<{ count: number }>('/notificaciones/me/no-leidas')
}

export function marcarNotificacionLeida(id: string): Promise<Notificacion> {
  return apiRequest<Notificacion>(`/notificaciones/${id}/leida`, { method: 'PATCH' })
}
