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

export function logoutRequest(refreshToken: string): Promise<{ success: boolean }> {
  return apiRequest<{ success: boolean }>('/auth/logout', { method: 'POST', body: { refreshToken } })
}
