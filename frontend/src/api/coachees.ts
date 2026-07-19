import { apiRequest } from './client'

export interface CoacheeListItem {
  id: string
  nombre: string
  empresaId: string | null
  empresa?: { id: string; nombre: string } | null
  consentimientoInformado: boolean
  consentimientoFecha: string | null
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
