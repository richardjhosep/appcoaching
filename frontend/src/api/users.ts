import { apiRequest } from './client'

export type Role = 'coach' | 'coachee' | 'empresa'

export interface UserAccount {
  id: string
  email: string
  role: Role
  empresaId: string | null
  mustChangePassword: boolean
  isActive: boolean
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

export function resetPassword(id: string): Promise<{ temporaryPassword: string }> {
  return apiRequest<{ temporaryPassword: string }>(`/users/${id}/reset-password`, {
    method: 'POST',
  })
}
