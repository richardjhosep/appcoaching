import { apiRequest } from './client'

export interface AuditLog {
  id: string
  userId: string | null
  action: string
  targetType: string | null
  targetId: string | null
  metadata: Record<string, unknown> | null
  createdAt: string
}

export function getAuditLog(filtros: { targetId?: string; action?: string } = {}): Promise<AuditLog[]> {
  const params = new URLSearchParams()
  if (filtros.targetId) params.set('targetId', filtros.targetId)
  if (filtros.action) params.set('action', filtros.action)
  const query = params.toString() ? `?${params.toString()}` : ''
  return apiRequest<AuditLog[]>(`/audit${query}`)
}
