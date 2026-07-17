import { apiRequest } from './client'

export interface CoacheeListItem {
  id: string
  nombre: string
}

export function listCoachees(): Promise<CoacheeListItem[]> {
  return apiRequest<CoacheeListItem[]>('/coachees')
}
