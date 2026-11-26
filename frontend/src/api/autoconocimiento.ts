import { apiRequest } from './client'

export type SeccionAutoconocimiento =
  | 'proposito'
  | 'fortalezas'
  | 'energia'
  | 'logro'
  | 'valores'
  | 'feedback'
  | 'vision'
  | 'fuera_del_trabajo'
  | 'red_de_apoyo'

export interface SeccionAutoconocimientoVista {
  seccion: SeccionAutoconocimiento
  contenido: string
  /** Segunda columna de "energía" (lo que me la quita); vacía en las demás. */
  complemento: string
  compartida: boolean
}

export function getMiAutoconocimiento(): Promise<SeccionAutoconocimientoVista[]> {
  return apiRequest<SeccionAutoconocimientoVista[]>('/autoconocimiento/me')
}

export function guardarSeccionAutoconocimiento(
  seccion: SeccionAutoconocimiento,
  input: Partial<Pick<SeccionAutoconocimientoVista, 'contenido' | 'complemento' | 'compartida'>>,
): Promise<SeccionAutoconocimientoVista> {
  return apiRequest<SeccionAutoconocimientoVista>(`/autoconocimiento/me/${seccion}`, { method: 'PATCH', body: input })
}

/** Solo las secciones que el coachee decidió compartir con su coach. */
export function getAutoconocimientoDeCoachee(coacheeId: string): Promise<SeccionAutoconocimientoVista[]> {
  return apiRequest<SeccionAutoconocimientoVista[]>(`/autoconocimiento/coachee/${coacheeId}`)
}
