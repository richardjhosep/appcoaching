import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from './auth'
import * as authApi from '../api/auth'

vi.mock('../api/auth', () => ({
  login: vi.fn(),
  refreshTokens: vi.fn(),
  me: vi.fn(),
  logoutRequest: vi.fn(),
}))

describe('useAuthStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('stores tokens and the current user on successful login', async () => {
    vi.mocked(authApi.login).mockResolvedValue({ accessToken: 'access-1', refreshToken: 'refresh-1' })
    vi.mocked(authApi.me).mockResolvedValue({
      id: 'user-1',
      email: 'coach@example.com',
      role: 'coach',
      empresaId: null,
    })

    const store = useAuthStore()
    await store.login('coach@example.com', 'secret')

    expect(store.accessToken).toBe('access-1')
    expect(store.refreshToken).toBe('refresh-1')
    expect(store.user?.role).toBe('coach')
    expect(store.isAuthenticated).toBe(true)
    expect(localStorage.getItem('coaching.accessToken')).toBe('access-1')
  })

  it('clears the session when the refresh token is also invalid', async () => {
    const store = useAuthStore()
    store.setTokens('old-access', 'old-refresh')
    vi.mocked(authApi.refreshTokens).mockRejectedValue(new Error('expired'))

    const result = await store.refresh()

    expect(result).toBe(false)
    expect(store.accessToken).toBeNull()
    expect(store.refreshToken).toBeNull()
    expect(localStorage.getItem('coaching.accessToken')).toBeNull()
  })

  it('clears local state on logout even if the API call fails', async () => {
    const store = useAuthStore()
    store.setTokens('access-1', 'refresh-1')
    vi.mocked(authApi.logoutRequest).mockRejectedValue(new Error('network error'))

    await store.logout()

    expect(store.accessToken).toBeNull()
    expect(store.user).toBeNull()
  })
})
