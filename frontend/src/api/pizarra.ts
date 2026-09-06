import { apiRequest } from './client'

export interface NotaPizarra {
  id: string
  coacheeId: string
  texto: string
  color: string
  posX: number
  posY: number
  createdAt: string
  updatedAt: string
}

export function listarNotas(): Promise<NotaPizarra[]> {
  return apiRequest<NotaPizarra[]>('/pizarra')
}

export function crearNota(input: { posX: number; posY: number; color?: string }): Promise<NotaPizarra> {
  return apiRequest<NotaPizarra>('/pizarra', { method: 'POST', body: input })
}

export function actualizarNota(
  id: string,
  input: Partial<{ texto: string; color: string; posX: number; posY: number }>,
): Promise<NotaPizarra> {
  return apiRequest<NotaPizarra>(`/pizarra/${id}`, { method: 'PATCH', body: input })
}

export function eliminarNota(id: string): Promise<{ success: boolean }> {
  return apiRequest<{ success: boolean }>(`/pizarra/${id}`, { method: 'DELETE' })
}
