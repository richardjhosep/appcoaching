import { apiRequest } from './client'

export interface CoacheeListItem {
  id: string
  nombre: string
  empresaId: string | null
  empresa?: { id: string; nombre: string } | null
  user?: { id: string; email: string } | null
  tarifaPropia?: number | null
  jefeDirecto?: string | null
  objetivoProceso?: string | null
  areaGerencia?: string | null
  activo?: boolean
  consentimientoInformado: boolean
  consentimientoFecha: string | null
  createdAt?: string
}

export interface CreateCoacheeInput {
  nombre: string
  email: string
  empresaId?: string
  jefeDirecto?: string
  objetivoProceso?: string
  tarifaPropia?: number
  areaGerencia?: string
}

export interface UpdateCoacheeInput {
  nombre?: string
  empresaId?: string | null
  jefeDirecto?: string
  objetivoProceso?: string
  tarifaPropia?: number
  areaGerencia?: string
}

export interface CreateCoacheeResult {
  coachee: CoacheeListItem
  temporaryPassword: string | null
}

export interface Coachee {
  id: string
  nombre: string
  empresaId: string | null
  empresa?: { id: string; nombre: string } | null
  telefono: string | null
  emailContacto: string | null
}

export function listCoachees(): Promise<CoacheeListItem[]> {
  return apiRequest<CoacheeListItem[]>('/coachees')
}

export function createCoachee(input: CreateCoacheeInput): Promise<CreateCoacheeResult> {
  return apiRequest<CreateCoacheeResult>('/coachees', { method: 'POST', body: input })
}

export function updateCoachee(id: string, input: UpdateCoacheeInput): Promise<CoacheeListItem> {
  return apiRequest<CoacheeListItem>(`/coachees/${id}`, { method: 'PATCH', body: input })
}

export function setCoacheeActivo(id: string, activo: boolean): Promise<CoacheeListItem> {
  return apiRequest<CoacheeListItem>(`/coachees/${id}/estado`, { method: 'PATCH', body: { activo } })
}

export function deleteCoachee(id: string): Promise<{ success: boolean }> {
  return apiRequest<{ success: boolean }>(`/coachees/${id}`, { method: 'DELETE' })
}

export function getMyCoachee(): Promise<Coachee> {
  return apiRequest<Coachee>('/coachees/me')
}

export function getCoachee(id: string): Promise<Coachee> {
  return apiRequest<Coachee>(`/coachees/${id}`)
}

export function setConsentimiento(id: string, informado: boolean): Promise<CoacheeListItem> {
  return apiRequest<CoacheeListItem>(`/coachees/${id}/consentimiento`, {
    method: 'PATCH',
    body: { informado },
  })
}
