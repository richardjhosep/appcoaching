import { apiRequest } from './client'

export interface AuditLog {
  id: string
  userId: string | null
  action: string
  targetType: string | null
  targetId: string | null
  actorLabel: string | null
  targetLabel: string | null
  metadata: Record<string, unknown> | null
  createdAt: string
}

export function getAuditLog(
  filtros: {
    targetId?: string
    action?: string
    scope?: 'coaching' | 'todo'
    desde?: string
    hasta?: string
  } = {},
): Promise<AuditLog[]> {
  const params = new URLSearchParams()
  if (filtros.targetId) params.set('targetId', filtros.targetId)
  if (filtros.action) params.set('action', filtros.action)
  if (filtros.scope) params.set('scope', filtros.scope)
  if (filtros.desde) params.set('desde', filtros.desde)
  if (filtros.hasta) params.set('hasta', filtros.hasta)
  const query = params.toString() ? `?${params.toString()}` : ''
  return apiRequest<AuditLog[]>(`/audit${query}`)
}
