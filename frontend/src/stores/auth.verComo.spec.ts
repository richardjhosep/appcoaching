import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useAuthStore } from './auth'

vi.mock('../api/auth', () => ({
  login: vi.fn(),
  refreshTokens: vi.fn(),
  logoutRequest: vi.fn(),
  verComo: vi.fn().mockResolvedValue({ accessToken: 'token-ver-como' }),
  me: vi.fn(),
}))

import { me, logoutRequest } from '../api/auth'

describe('auth store — Ver como', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it('swaps to the read-only token, keeps the own session aside, and restores it on exit', async () => {
    const auth = useAuthStore()
    auth.setTokens('mi-access', 'mi-refresh')
    vi.mocked(me).mockResolvedValueOnce({ id: 'u-coachee', email: 'ana@x.cl', role: 'coachee', empresaId: null, nombre: 'Ana', mustChangePassword: false, impersonadoPor: 'u-super' })

    await auth.iniciarVerComo('u-coachee')

    expect(auth.enVerComo).toBe(true)
    expect(auth.accessToken).toBe('token-ver-como')
    expect(auth.refreshToken).toBeNull()
    expect(auth.user?.role).toBe('coachee')

    vi.mocked(me).mockResolvedValueOnce({ id: 'u-super', email: 's@x.cl', role: 'coach', empresaId: null, nombre: null, mustChangePassword: false, superadmin: true })
    // logout() dentro de un Ver como (o un 401 al vencer el token) vuelve a la sesión propia.
    await auth.logout()

    expect(logoutRequest).not.toHaveBeenCalled()
    expect(auth.enVerComo).toBe(false)
    expect(auth.accessToken).toBe('mi-access')
    expect(auth.refreshToken).toBe('mi-refresh')
    expect(auth.user?.superadmin).toBe(true)
  })

  it('survives a page reload: the saved own session is read back from localStorage', async () => {
    const auth = useAuthStore()
    auth.setTokens('mi-access', 'mi-refresh')
    vi.mocked(me).mockResolvedValueOnce({ id: 'u-emp', email: 'e@x.cl', role: 'empresa', empresaId: 'e1', nombre: null, mustChangePassword: false })
    await auth.iniciarVerComo('u-emp')

    setActivePinia(createPinia())
    expect(useAuthStore().enVerComo).toBe(true)
  })
})
