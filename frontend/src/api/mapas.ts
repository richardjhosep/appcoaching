import { apiRequest } from './client'

export interface NodoMapa {
  id: string
  mapaId: string
  parentId: string | null
  label: string
  detalle: string | null
  orden: number
  createdAt: string
}

export interface Mapa {
  id: string
  titulo: string
  competenciaId: string
  competencia?: { id: string; nombre: string }
  recursoId: string | null
  recurso?: { id: string; titulo: string } | null
  activo: boolean
  createdAt: string
  updatedAt: string
}

export interface MapaConNodos extends Mapa {
  nodos: NodoMapa[]
}

export interface MapaResumen {
  id: string
  titulo: string
  competenciaId: string
  competencia?: { id: string; nombre: string }
  recursoId: string | null
  activo: boolean
  createdAt: string
  totalNodos: number
}

// --- Coach ---

export function createMapa(input: {
  titulo: string
  competenciaId: string
  recursoId?: string
}): Promise<Mapa> {
  return apiRequest<Mapa>('/mapas', { method: 'POST', body: input })
}

export function listMapas(): Promise<Mapa[]> {
  return apiRequest<Mapa[]>('/mapas')
}

export function updateMapa(
  id: string,
  input: Partial<{ titulo: string; competenciaId: string; recursoId: string }>,
): Promise<Mapa> {
  return apiRequest<Mapa>(`/mapas/${id}`, { method: 'PATCH', body: input })
}

export function setMapaActivo(id: string, isActive: boolean): Promise<Mapa> {
  return apiRequest<Mapa>(`/mapas/${id}/estado`, { method: 'PATCH', body: { isActive } })
}

export function deleteMapa(id: string): Promise<{ success: boolean }> {
  return apiRequest<{ success: boolean }>(`/mapas/${id}`, { method: 'DELETE' })
}

export function addNodo(
  mapaId: string,
  input: { label: string; detalle?: string; parentId?: string },
): Promise<NodoMapa> {
  return apiRequest<NodoMapa>(`/mapas/${mapaId}/nodos`, { method: 'POST', body: input })
}

export function updateNodo(
  nodoId: string,
  input: Partial<{ label: string; detalle: string; parentId: string }>,
): Promise<NodoMapa> {
  return apiRequest<NodoMapa>(`/mapas/nodos/${nodoId}`, { method: 'PATCH', body: input })
}

export function deleteNodo(nodoId: string): Promise<void> {
  return apiRequest<void>(`/mapas/nodos/${nodoId}`, { method: 'DELETE' })
}

// --- Compartido coach/coachee ---

export function getMapa(id: string): Promise<MapaConNodos> {
  return apiRequest<MapaConNodos>(`/mapas/${id}`)
}

// --- Coachee ---

export function listMapasDisponibles(): Promise<MapaResumen[]> {
  return apiRequest<MapaResumen[]>('/mapas/disponibles')
}
