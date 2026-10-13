import { defineStore } from 'pinia'
import { login as apiLogin, refreshTokens, me as apiMe, logoutRequest, verComo as apiVerComo, type CurrentUser } from '../api/auth'

const ACCESS_KEY = 'coaching.accessToken'
const REFRESH_KEY = 'coaching.refreshToken'
// Sesión propia del superadmin guardada mientras dura un "Ver como" — se restaura al salir
// (o cuando el token de 30 min vence, ver logout()).
const VER_COMO_ORIGINAL_KEY = 'coaching.verComo.original'

interface TokensGuardados {
  accessToken: string | null
  refreshToken: string | null
  // Ruta del coach desde la que se entró, para volver ahí al salir.
  volverA?: string
}

function leerOriginal(): TokensGuardados | null {
  try {
    const raw = localStorage.getItem(VER_COMO_ORIGINAL_KEY)
    return raw ? (JSON.parse(raw) as TokensGuardados) : null
  } catch {
    return null
  }
}

interface AuthState {
  accessToken: string | null
  refreshToken: string | null
  user: CurrentUser | null
  verComoOriginal: TokensGuardados | null
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    accessToken: localStorage.getItem(ACCESS_KEY),
    refreshToken: localStorage.getItem(REFRESH_KEY),
    user: null,
    verComoOriginal: leerOriginal(),
  }),

  getters: {
    isAuthenticated: (state): boolean => !!state.accessToken && !!state.user,
    enVerComo: (state): boolean => !!state.verComoOriginal,
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
      this.verComoOriginal = null
      localStorage.removeItem(ACCESS_KEY)
      localStorage.removeItem(REFRESH_KEY)
      localStorage.removeItem(VER_COMO_ORIGINAL_KEY)
    },

    async iniciarVerComo(userId: string, volverA?: string) {
      const { accessToken } = await apiVerComo(userId)
      const original = { accessToken: this.accessToken, refreshToken: this.refreshToken, volverA }
      localStorage.setItem(VER_COMO_ORIGINAL_KEY, JSON.stringify(original))
      this.verComoOriginal = original
      // Sin refresh token: la sesión "Ver como" dura lo que dura su access token (30 min).
      this.accessToken = accessToken
      this.refreshToken = null
      localStorage.setItem(ACCESS_KEY, accessToken)
      localStorage.removeItem(REFRESH_KEY)
      this.user = await apiMe()
    },

    // Devuelve la ruta a la que conviene volver (la de origen del "Ver como").
    async salirVerComo(): Promise<string> {
      const original = this.verComoOriginal
      const volverA = original?.volverA ?? '/coach/usuarios'
      localStorage.removeItem(VER_COMO_ORIGINAL_KEY)
      this.verComoOriginal = null
      if (!original?.accessToken || !original.refreshToken) {
        this.clear()
        return '/login'
      }
      this.setTokens(original.accessToken, original.refreshToken)
      try {
        this.user = await apiMe()
      } catch {
        // El access token propio pudo haber vencido durante el "Ver como".
        if (await this.refresh()) this.user = await apiMe()
      }
      return volverA
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
      // Dentro de un "Ver como", "salir" (o un 401 al vencer el token) vuelve a la sesión
      // propia del superadmin en vez de cerrarla.
      if (this.verComoOriginal) {
        await this.salirVerComo()
        return
      }
      if (this.refreshToken) {
        await logoutRequest(this.refreshToken).catch(() => undefined)
      }
      this.clear()
    },
  },
})
