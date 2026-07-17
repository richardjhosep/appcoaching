import { apiRequest } from './client'

export interface Logro {
  id: string
  coacheeId: string
  fecha: string
  descripcion: string
  createdAt: string
}

export interface Diario {
  id: string
  coacheeId: string
  contenido: string
  updatedAt: string
}

export interface PuntoProgreso {
  sesionId: string
  fecha: string
  cercaniaObjetivo: number
}

export function addLogro(fecha: string, descripcion: string): Promise<Logro> {
  return apiRequest<Logro>('/seguimiento/logros', {
    method: 'POST',
    body: { fecha, descripcion },
  })
}

export function getMisLogros(): Promise<Logro[]> {
  return apiRequest<Logro[]>('/seguimiento/logros/me')
}

export function getLogrosDeCoachee(coacheeId: string): Promise<Logro[]> {
  return apiRequest<Logro[]>(`/seguimiento/logros/${coacheeId}`)
}

export function removeLogro(id: string): Promise<void> {
  return apiRequest<void>(`/seguimiento/logros/me/${id}`, { method: 'DELETE' })
}

export function getMiDiario(): Promise<Diario> {
  return apiRequest<Diario>('/seguimiento/diario/me')
}

export function updateMiDiario(contenido: string): Promise<Diario> {
  return apiRequest<Diario>('/seguimiento/diario/me', {
    method: 'PATCH',
    body: { contenido },
  })
}

export function getMiAvance(): Promise<{ avance: number | null }> {
  return apiRequest<{ avance: number | null }>('/seguimiento/avance/me')
}

export function getAvanceDeCoachee(coacheeId: string): Promise<{ avance: number | null }> {
  return apiRequest<{ avance: number | null }>(`/seguimiento/avance/${coacheeId}`)
}

export function getMiLineaProgreso(): Promise<PuntoProgreso[]> {
  return apiRequest<PuntoProgreso[]>('/seguimiento/linea-progreso/me')
}

export function getLineaProgresoDeCoachee(coacheeId: string): Promise<PuntoProgreso[]> {
  return apiRequest<PuntoProgreso[]>(`/seguimiento/linea-progreso/${coacheeId}`)
}
