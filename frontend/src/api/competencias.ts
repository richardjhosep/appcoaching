import { apiRequest } from './client'

export interface NivelCompetencia {
  nivel: number
  descripcion: string
  comportamientos?: string[]
}

export interface Competencia {
  id: string
  nombre: string
  definicion: string
  niveles: NivelCompetencia[]
  // NULL = catálogo global. No nulo = propia de esa empresa (ver
  // project_competencias_por_empresa).
  empresaId: string | null
}

export interface CompetenciaInput {
  nombre: string
  definicion: string
  niveles: NivelCompetencia[]
}

export function listCompetencias(): Promise<Competencia[]> {
  return apiRequest<Competencia[]>('/competencias')
}

// --- Empresa: sus propias competencias ---

export function listMisCompetenciasEmpresa(): Promise<Competencia[]> {
  return apiRequest<Competencia[]>('/competencias/empresa/me')
}

export function createCompetenciaEmpresa(input: CompetenciaInput): Promise<Competencia> {
  return apiRequest<Competencia>('/competencias/empresa/me', { method: 'POST', body: input })
}

export function updateCompetenciaEmpresa(
  id: string,
  input: Partial<CompetenciaInput>,
): Promise<Competencia> {
  return apiRequest<Competencia>(`/competencias/empresa/me/${id}`, {
    method: 'PATCH',
    body: input,
  })
}

export function deleteCompetenciaEmpresa(id: string): Promise<{ success: boolean }> {
  return apiRequest<{ success: boolean }>(`/competencias/empresa/me/${id}`, {
    method: 'DELETE',
  })
}

// --- Coach: catálogo visible para un coachee puntual (global + su empresa) ---

export function listCompetenciasParaCoachee(coacheeId: string): Promise<Competencia[]> {
  return apiRequest<Competencia[]>(`/competencias/coachee/${coacheeId}`)
}
