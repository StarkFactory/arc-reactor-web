import { create } from 'zustand'
import type { User } from '../types/auth'
import * as authApi from '../services/auth'
import { getAuthToken, setAuthToken, removeAuthToken } from '../utils/api-client'
import i18n from '../i18n/index'

interface AuthState {
  user: User | null
  isAuthRequired: boolean
  isLoading: boolean
  error: string | null
}

interface AuthActions {
  initialize: () => Promise<void>
  login: (email: string, password: string) => Promise<boolean>
  register: (email: string, password: string, name: string) => Promise<boolean>
  logout: () => void
  clearError: () => void
}

export const useAuthStore = create<AuthState & AuthActions>()((set) => ({
  user: null,
  isAuthRequired: false,
  isLoading: true,
  error: null,

  initialize: async () => {
    try {
      await authApi.checkAuthRequired()
      set({ isAuthRequired: true })

      const token = getAuthToken()
      if (token) {
        try {
          const me = await authApi.getMe()
          set({ user: me })
        } catch {
          // Token expired or invalid — clear it silently
          removeAuthToken()
        }
      }
    } finally {
      set({ isLoading: false })
    }
  },

  login: async (email, password) => {
    set({ error: null, isLoading: true })
    try {
      const response = await authApi.login({ email, password })
      if (response.error || !response.token || !response.user) {
        set({ error: response.error || i18n.t('auth.loginFailed') })
        return false
      }
      setAuthToken(response.token)
      set({ user: response.user })
      return true
    } catch {
      set({ error: i18n.t('auth.serverError') })
      return false
    } finally {
      set({ isLoading: false })
    }
  },

  register: async (email, password, name) => {
    set({ error: null, isLoading: true })
    try {
      const response = await authApi.register({ email, password, name })
      if (response.error || !response.token || !response.user) {
        set({ error: response.error || i18n.t('auth.registerFailed') })
        return false
      }
      setAuthToken(response.token)
      set({ user: response.user })
      return true
    } catch {
      set({ error: i18n.t('auth.serverError') })
      return false
    } finally {
      set({ isLoading: false })
    }
  },

  logout: () => {
    removeAuthToken()
    set({ user: null, error: null })
  },

  clearError: () => set({ error: null }),
}))
