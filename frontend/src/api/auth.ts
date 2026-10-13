import { publicRequest, apiRequest } from './client'

export type Role = 'coach' | 'coachee' | 'empresa'

export interface TokenPair {
  accessToken: string
  refreshToken: string
}

export interface CurrentUser {
  id: string
  email: string
  role: Role
  empresaId: string | null
  nombre: string | null
  mustChangePassword: boolean
  // Solo para los correos de SUPERADMIN_EMAILS (backend): habilita "Ver como".
  superadmin?: boolean
  // Presente solo dentro de una sesión "Ver como" (solo lectura).
  impersonadoPor?: string
}

export function login(email: string, password: string): Promise<TokenPair> {
  return publicRequest<TokenPair>('/auth/login', { method: 'POST', body: { email, password } })
}

export function refreshTokens(refreshToken: string): Promise<TokenPair> {
  return publicRequest<TokenPair>('/auth/refresh', { method: 'POST', body: { refreshToken } })
}

export function me(): Promise<CurrentUser> {
  return apiRequest<CurrentUser>('/auth/me')
}

export function verComo(userId: string): Promise<{ accessToken: string }> {
  return apiRequest<{ accessToken: string }>(`/auth/ver-como/${userId}`, { method: 'POST' })
}

export function logoutRequest(refreshToken: string): Promise<{ success: boolean }> {
  return apiRequest<{ success: boolean }>('/auth/logout', { method: 'POST', body: { refreshToken } })
}

export function forgotPassword(email: string): Promise<{ success: boolean }> {
  return publicRequest<{ success: boolean }>('/auth/forgot-password', { method: 'POST', body: { email } })
}

export function resetPassword(token: string, newPassword: string): Promise<{ success: boolean }> {
  return publicRequest<{ success: boolean }>('/auth/reset-password', { method: 'POST', body: { token, newPassword } })
}
