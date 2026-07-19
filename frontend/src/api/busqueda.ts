import { apiRequest } from './client'

export interface ResultadoBusqueda {
  coachees: Array<{ id: string; nombre: string }>
  empresas: Array<{ id: string; nombre: string }>
  competencias: Array<{ id: string; nombre: string }>
  recursos: Array<{ id: string; titulo: string }>
}

export function buscarGlobal(q: string): Promise<ResultadoBusqueda> {
  return apiRequest<ResultadoBusqueda>(`/busqueda?q=${encodeURIComponent(q)}`)
}
