import { apiRequest } from './client'

export type Role = 'coach' | 'coachee' | 'empresa'

export interface UserAccount {
  id: string
  email: string
  role: Role
  empresaId: string | null
  empresa?: { id: string; nombre: string } | null
  mustChangePassword: boolean
  isActive: boolean
  createdAt?: string
}

export interface CreateUserResult {
  id: string
  email: string
  role: Role
  temporaryPassword: string
}

export function listUsers(): Promise<UserAccount[]> {
  return apiRequest<UserAccount[]>('/users')
}

export function createEmpresaUser(email: string, empresaId: string): Promise<CreateUserResult> {
  return apiRequest<CreateUserResult>('/users', {
    method: 'POST',
    body: { email, role: 'empresa', empresaId },
  })
}

export function setUserActivo(id: string, isActive: boolean): Promise<UserAccount> {
  return apiRequest<UserAccount>(`/users/${id}/estado`, {
    method: 'PATCH',
    body: { isActive },
  })
}

export function resetPassword(id: string): Promise<{ temporaryPassword: string }> {
  return apiRequest<{ temporaryPassword: string }>(`/users/${id}/reset-password`, {
    method: 'POST',
  })
}

export function deleteUser(id: string): Promise<{ success: boolean }> {
  return apiRequest<{ success: boolean }>(`/users/${id}`, { method: 'DELETE' })
}
