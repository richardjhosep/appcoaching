import { apiRequest } from './client'

export type EstadoVersionEjercicio = 'enviada' | 'con_feedback'

export interface Ejercicio {
  id: string
  titulo: string
  consigna: string
  competenciaId: string | null
  competencia?: { id: string; nombre: string }
  activo: boolean
  createdAt: string
  updatedAt: string
}

export interface VersionEjercicio {
  id: string
  ejercicioId: string
  coacheeId: string
  coachee?: { id: string; nombre: string }
  numeroVersion: number
  sabe: string
  siente: string
  haga: string
  comentarioCoach: string | null
  estado: EstadoVersionEjercicio
  createdAt: string
  updatedAt: string
}

export interface EjercicioConVersiones extends Ejercicio {
  versiones: VersionEjercicio[]
}

export interface EjercicioResumen {
  id: string
  titulo: string
  consigna: string
  competenciaId: string | null
  competencia?: { id: string; nombre: string }
  activo: boolean
  createdAt: string
  numeroVersiones: number
  ultimoEstado: EstadoVersionEjercicio | null
}

// --- Coach ---

export function createEjercicio(input: {
  titulo: string
  consigna: string
  competenciaId?: string
}): Promise<Ejercicio> {
  return apiRequest<Ejercicio>('/ejercicios', { method: 'POST', body: input })
}

export function listEjercicios(): Promise<Ejercicio[]> {
  return apiRequest<Ejercicio[]>('/ejercicios')
}

export function getEjercicioParaCoach(id: string): Promise<EjercicioConVersiones> {
  return apiRequest<EjercicioConVersiones>(`/ejercicios/${id}`)
}

export function updateEjercicio(
  id: string,
  input: Partial<{ titulo: string; consigna: string; competenciaId: string }>,
): Promise<Ejercicio> {
  return apiRequest<Ejercicio>(`/ejercicios/${id}`, { method: 'PATCH', body: input })
}

export function setEjercicioActivo(id: string, isActive: boolean): Promise<Ejercicio> {
  return apiRequest<Ejercicio>(`/ejercicios/${id}/estado`, {
    method: 'PATCH',
    body: { isActive },
  })
}

export function deleteEjercicio(id: string): Promise<{ success: boolean }> {
  return apiRequest<{ success: boolean }>(`/ejercicios/${id}`, { method: 'DELETE' })
}

export function dejarFeedback(versionId: string, comentarioCoach: string): Promise<VersionEjercicio> {
  return apiRequest<VersionEjercicio>(`/ejercicios/versiones/${versionId}/feedback`, {
    method: 'PATCH',
    body: { comentarioCoach },
  })
}

// --- Coachee ---

export function listEjerciciosDisponibles(): Promise<EjercicioResumen[]> {
  return apiRequest<EjercicioResumen[]>('/ejercicios/disponibles')
}

export function getEjercicioParaResponder(id: string): Promise<Ejercicio> {
  return apiRequest<Ejercicio>(`/ejercicios/${id}`)
}

export function misVersiones(ejercicioId: string): Promise<VersionEjercicio[]> {
  return apiRequest<VersionEjercicio[]>(`/ejercicios/${ejercicioId}/mis-versiones`)
}

export function crearVersion(
  ejercicioId: string,
  input: { sabe: string; siente: string; haga: string },
): Promise<VersionEjercicio> {
  return apiRequest<VersionEjercicio>(`/ejercicios/${ejercicioId}/versiones`, {
    method: 'POST',
    body: input,
  })
}
