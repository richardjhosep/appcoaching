import { apiRequest } from './client'

export interface Empresa {
  id: string
  nombre: string
  tarifaHora: number
  isActive: boolean
  pagada: boolean
  horasContratadas: number | null
  fechaInicio: string | null
  fechaFin: string | null
  createdAt?: string
}

export function listEmpresas(): Promise<Empresa[]> {
  return apiRequest<Empresa[]>('/empresas')
}

export function getMyEmpresa(): Promise<Empresa> {
  return apiRequest<Empresa>('/empresas/me')
}

export function createEmpresa(
  nombre: string,
  tarifaHora: number,
  fechaInicio?: string,
  fechaFin?: string,
): Promise<Empresa> {
  return apiRequest<Empresa>('/empresas', {
    method: 'POST',
    body: { nombre, tarifaHora, fechaInicio, fechaFin },
  })
}

export function updateEmpresa(
  id: string,
  input: Partial<
    Pick<
      Empresa,
      'nombre' | 'tarifaHora' | 'pagada' | 'horasContratadas' | 'isActive' | 'fechaInicio' | 'fechaFin'
    >
  >,
): Promise<Empresa> {
  return apiRequest<Empresa>(`/empresas/${id}`, { method: 'PATCH', body: input })
}

export function deleteEmpresa(id: string): Promise<{ success: boolean }> {
  return apiRequest<{ success: boolean }>(`/empresas/${id}`, { method: 'DELETE' })
}

export interface GestionRenovacion {
  id: string
  empresaId: string
  nota: string
  proximoSeguimiento: string | null
  createdAt: string
}

export function crearGestion(
  empresaId: string,
  nota: string,
  proximoSeguimiento?: string,
): Promise<GestionRenovacion> {
  return apiRequest<GestionRenovacion>(`/empresas/${empresaId}/gestion`, {
    method: 'POST',
    body: { nota, proximoSeguimiento },
  })
}

export function getGestionDeEmpresa(empresaId: string): Promise<GestionRenovacion[]> {
  return apiRequest<GestionRenovacion[]>(`/empresas/${empresaId}/gestion`)
}
