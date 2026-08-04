import { apiRequest } from './client'

export interface Carpeta {
  id: string
  nombre: string
  parentId: string | null
  publica: boolean
  createdAt: string
  updatedAt: string
}

export interface AsignacionCarpeta {
  id: string
  carpetaId: string
  coacheeId: string
  activa: boolean
  expiraEn: string | null
  coachee?: { id: string; nombre: string; user?: { email: string } }
}

export function crearCarpeta(nombre: string, parentId?: string): Promise<Carpeta> {
  return apiRequest<Carpeta>('/carpetas', { method: 'POST', body: { nombre, parentId } })
}

export function listCarpetas(): Promise<Carpeta[]> {
  return apiRequest<Carpeta[]>('/carpetas')
}

export function getMisCarpetas(): Promise<Carpeta[]> {
  return apiRequest<Carpeta[]>('/carpetas/mias')
}

export function renombrarCarpeta(id: string, nombre: string): Promise<Carpeta> {
  return apiRequest<Carpeta>(`/carpetas/${id}`, { method: 'PATCH', body: { nombre } })
}

export function setCarpetaPublica(id: string, publica: boolean): Promise<Carpeta> {
  return apiRequest<Carpeta>(`/carpetas/${id}/publica`, { method: 'PATCH', body: { publica } })
}

export function removeCarpeta(id: string): Promise<void> {
  return apiRequest<void>(`/carpetas/${id}`, { method: 'DELETE' })
}

export function asignarCarpeta(
  carpetaId: string,
  coacheeId: string,
  activa: boolean,
  expiraEn?: string | null,
): Promise<AsignacionCarpeta> {
  return apiRequest<AsignacionCarpeta>(`/carpetas/${carpetaId}/asignaciones/${coacheeId}`, {
    method: 'PUT',
    body: { activa, expiraEn },
  })
}

export function getAsignacionesDeCarpeta(carpetaId: string): Promise<AsignacionCarpeta[]> {
  return apiRequest<AsignacionCarpeta[]>(`/carpetas/${carpetaId}/asignaciones`)
}

export function revocarCarpeta(carpetaId: string, coacheeId: string): Promise<void> {
  return apiRequest<void>(`/carpetas/${carpetaId}/asignaciones/${coacheeId}`, {
    method: 'DELETE',
  })
}
