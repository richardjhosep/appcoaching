import { apiRequest } from './client'

export interface Empresa {
  id: string
  nombre: string
  tarifaHora: number
  isActive: boolean
  pagada: boolean
  horasContratadas: number | null
  createdAt?: string
}

export function listEmpresas(): Promise<Empresa[]> {
  return apiRequest<Empresa[]>('/empresas')
}

export function createEmpresa(nombre: string, tarifaHora: number): Promise<Empresa> {
  return apiRequest<Empresa>('/empresas', { method: 'POST', body: { nombre, tarifaHora } })
}

export function updateEmpresa(
  id: string,
  input: Partial<Pick<Empresa, 'nombre' | 'tarifaHora' | 'pagada' | 'horasContratadas' | 'isActive'>>,
): Promise<Empresa> {
  return apiRequest<Empresa>(`/empresas/${id}`, { method: 'PATCH', body: input })
}
