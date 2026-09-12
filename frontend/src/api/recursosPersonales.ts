import { apiRequest } from './client'

export type CategoriaRecursoPersonal = 'libro' | 'articulo' | 'video' | 'podcast' | 'practica_guiada'

export interface RecursoPersonal {
  id: string
  coacheeId: string
  categoria: CategoriaRecursoPersonal
  titulo: string
  url: string | null
  notas: string | null
  createdAt: string
}

export function listarRecursosPersonales(): Promise<RecursoPersonal[]> {
  return apiRequest<RecursoPersonal[]>('/recursos-personales')
}

export function crearRecursoPersonal(input: {
  categoria: CategoriaRecursoPersonal
  titulo: string
  url?: string
  notas?: string
}): Promise<RecursoPersonal> {
  return apiRequest<RecursoPersonal>('/recursos-personales', { method: 'POST', body: input })
}

export function actualizarRecursoPersonal(
  id: string,
  input: Partial<{ categoria: CategoriaRecursoPersonal; titulo: string; url: string; notas: string }>,
): Promise<RecursoPersonal> {
  return apiRequest<RecursoPersonal>(`/recursos-personales/${id}`, { method: 'PATCH', body: input })
}

export function eliminarRecursoPersonal(id: string): Promise<{ success: boolean }> {
  return apiRequest<{ success: boolean }>(`/recursos-personales/${id}`, { method: 'DELETE' })
}
