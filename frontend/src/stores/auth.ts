import { defineStore } from 'pinia'
import { login as apiLogin, refreshTokens, me as apiMe, logoutRequest, type CurrentUser } from '../api/auth'

const ACCESS_KEY = 'coaching.accessToken'
const REFRESH_KEY = 'coaching.refreshToken'

interface AuthState {
  accessToken: string | null
  refreshToken: string | null
  user: CurrentUser | null
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    accessToken: localStorage.getItem(ACCESS_KEY),
    refreshToken: localStorage.getItem(REFRESH_KEY),
    user: null,
  }),

  getters: {
    isAuthenticated: (state): boolean => !!state.accessToken && !!state.user,
  },

  actions: {
    setTokens(accessToken: string, refreshToken: string) {
      this.accessToken = accessToken
      this.refreshToken = refreshToken
      localStorage.setItem(ACCESS_KEY, accessToken)
      localStorage.setItem(REFRESH_KEY, refreshToken)
    },

    clear() {
      this.accessToken = null
      this.refreshToken = null
      this.user = null
      localStorage.removeItem(ACCESS_KEY)
      localStorage.removeItem(REFRESH_KEY)
    },

    async login(email: string, password: string) {
      const tokens = await apiLogin(email, password)
      this.setTokens(tokens.accessToken, tokens.refreshToken)
      this.user = await apiMe()
    },

    async restoreSession() {
      if (!this.accessToken) {
        return
      }
      try {
        this.user = await apiMe()
      } catch {
        this.clear()
      }
    },

    async refresh(): Promise<boolean> {
      if (!this.refreshToken) {
        return false
      }
      try {
        const tokens = await refreshTokens(this.refreshToken)
        this.setTokens(tokens.accessToken, tokens.refreshToken)
        return true
      } catch {
        this.clear()
        return false
      }
    },

    async logout() {
      if (this.refreshToken) {
        await logoutRequest(this.refreshToken).catch(() => undefined)
      }
      this.clear()
    },
  },
})
