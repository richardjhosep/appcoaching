import { apiRequest } from './client'
import type { Empresa } from './empresas'
import type { CreateCoacheeResult } from './coachees'

export type TipoProspecto = 'persona' | 'empresa'
export type EtapaProspecto = 'contactado' | 'propuesta_enviada' | 'negociacion' | 'ganado' | 'perdido'

export interface Prospecto {
  id: string
  nombre: string
  tipo: TipoProspecto
  contactoNombre: string | null
  email: string | null
  telefono: string | null
  fuente: string | null
  valorEstimado: number | null
  etapa: EtapaProspecto
  notas: string | null
  convertidoEmpresaId: string | null
  convertidoCoacheeId: string | null
  createdAt: string
  updatedAt: string
  // Solo viene resuelto en la lista (GET /prospectos) — la fecha de la última entrada de la
  // bitácora, si tiene alguna. Ausente (undefined) en las respuestas de crear/actualizar.
  proximoSeguimiento?: string | null
}

export interface CreateProspectoInput {
  nombre: string
  tipo: TipoProspecto
  contactoNombre?: string
  email?: string
  telefono?: string
  fuente?: string
  valorEstimado?: number
  notas?: string
}

export interface UpdateProspectoInput extends Partial<CreateProspectoInput> {
  etapa?: EtapaProspecto
}

export interface GestionProspecto {
  id: string
  prospectoId: string
  nota: string
  proximoSeguimiento: string | null
  createdAt: string
}

export function listProspectos(etapa?: EtapaProspecto): Promise<Prospecto[]> {
  const query = etapa ? `?etapa=${encodeURIComponent(etapa)}` : ''
  return apiRequest<Prospecto[]>(`/prospectos${query}`)
}

export function getProspecto(id: string): Promise<Prospecto> {
  return apiRequest<Prospecto>(`/prospectos/${id}`)
}

export function createProspecto(input: CreateProspectoInput): Promise<Prospecto> {
  return apiRequest<Prospecto>('/prospectos', { method: 'POST', body: input })
}

export function updateProspecto(id: string, input: UpdateProspectoInput): Promise<Prospecto> {
  return apiRequest<Prospecto>(`/prospectos/${id}`, { method: 'PATCH', body: input })
}

export function deleteProspecto(id: string): Promise<{ success: boolean }> {
  return apiRequest<{ success: boolean }>(`/prospectos/${id}`, { method: 'DELETE' })
}

export function crearGestionProspecto(
  prospectoId: string,
  nota: string,
  proximoSeguimiento?: string,
): Promise<GestionProspecto> {
  return apiRequest<GestionProspecto>(`/prospectos/${prospectoId}/gestion`, {
    method: 'POST',
    body: { nota, proximoSeguimiento },
  })
}

export function getGestionDeProspecto(prospectoId: string): Promise<GestionProspecto[]> {
  return apiRequest<GestionProspecto[]>(`/prospectos/${prospectoId}/gestion`)
}

export function convertirAEmpresa(
  prospectoId: string,
  input: { nombre: string; tarifaHora: number; fechaInicio?: string; fechaFin?: string },
): Promise<Empresa> {
  return apiRequest<Empresa>(`/prospectos/${prospectoId}/convertir-empresa`, {
    method: 'POST',
    body: input,
  })
}

export function convertirACoachee(
  prospectoId: string,
  input: { nombre: string; email: string; jefeDirecto?: string; objetivoProceso?: string; tarifaPropia?: number },
): Promise<CreateCoacheeResult> {
  return apiRequest<CreateCoacheeResult>(`/prospectos/${prospectoId}/convertir-coachee`, {
    method: 'POST',
    body: input,
  })
}

export function marcarPerdido(prospectoId: string, motivo?: string): Promise<Prospecto> {
  return apiRequest<Prospecto>(`/prospectos/${prospectoId}/marcar-perdido`, {
    method: 'POST',
    body: { motivo },
  })
}

export function getPipelinePonderado(): Promise<number> {
  return apiRequest<number>('/prospectos/pipeline-ponderado')
}
