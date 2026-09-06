import { apiRequest } from './client'
import type { NodoMapa } from './mapas'

export interface MapaPersonal {
  id: string
  coacheeId: string
  titulo: string
  createdAt: string
  updatedAt: string
}

// Mismo shape que NodoMapa (api/mapas.ts) — MapaCanvas.vue es agnóstico de quién es dueño
// del mapa, se reutiliza tal cual.
export type NodoMapaPersonal = NodoMapa

export interface MapaPersonalConNodos extends MapaPersonal {
  nodos: NodoMapaPersonal[]
}

export function listMapasPersonales(): Promise<MapaPersonal[]> {
  return apiRequest<MapaPersonal[]>('/mapas-personales')
}

export function createMapaPersonal(titulo: string): Promise<MapaPersonal> {
  return apiRequest<MapaPersonal>('/mapas-personales', { method: 'POST', body: { titulo } })
}

export function getMapaPersonal(id: string): Promise<MapaPersonalConNodos> {
  return apiRequest<MapaPersonalConNodos>(`/mapas-personales/${id}`)
}

export function deleteMapaPersonal(id: string): Promise<{ success: boolean }> {
  return apiRequest<{ success: boolean }>(`/mapas-personales/${id}`, { method: 'DELETE' })
}

export function addNodoPersonal(
  mapaId: string,
  input: { label: string; detalle?: string; parentId?: string },
): Promise<NodoMapaPersonal> {
  return apiRequest<NodoMapaPersonal>(`/mapas-personales/${mapaId}/nodos`, { method: 'POST', body: input })
}

export function updateNodoPersonal(
  nodoId: string,
  input: Partial<{ label: string; detalle: string; parentId: string }>,
): Promise<NodoMapaPersonal> {
  return apiRequest<NodoMapaPersonal>(`/mapas-personales/nodos/${nodoId}`, { method: 'PATCH', body: input })
}

export function deleteNodoPersonal(nodoId: string): Promise<{ success: boolean }> {
  return apiRequest<{ success: boolean }>(`/mapas-personales/nodos/${nodoId}`, { method: 'DELETE' })
}
