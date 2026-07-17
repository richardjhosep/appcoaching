import { apiRequest } from './client'

export interface NivelCompetencia {
  nivel: number
  descripcion: string
}

export interface Competencia {
  id: string
  nombre: string
  definicion: string
  niveles: NivelCompetencia[]
}

export function listCompetencias(): Promise<Competencia[]> {
  return apiRequest<Competencia[]>('/competencias')
}
