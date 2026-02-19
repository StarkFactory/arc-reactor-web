import { createContext, useContext, useState, useEffect } from 'react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import type { User } from '../types/auth'
import * as authApi from '../services/auth'
import { getAuthToken, setAuthToken, removeAuthToken, setOnUnauthorized } from '../utils/api-client'

interface AuthContextValue {
  user: User | null
  isAuthenticated: boolean
  isAdmin: boolean
  isAuthRequired: boolean
  isLoading: boolean
  error: string | null
  login: (email: string, password: string) => Promise<boolean>
  register: (email: string, password: string, name: string) => Promise<boolean>
  logout: () => void
  clearError: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { t } = useTranslation()
  const [user, setUser] = useState<User | null>(null)
  const [isAuthRequired, setIsAuthRequired] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // On mount: check if auth is required and validate existing token
  useEffect(() => {
    let cancelled = false

    async function init() {
      try {
        await authApi.checkAuthRequired()
        if (cancelled) return

        setIsAuthRequired(true)

        const token = getAuthToken()
        if (token) {
          try {
            const me = await authApi.getMe()
            if (!cancelled) setUser(me)
          } catch {
            // Token expired or invalid
            removeAuthToken()
          }
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    init()
    return () => { cancelled = true }
  }, [])

  const login = async (email: string, password: string): Promise<boolean> => {
    setError(null)
    setIsLoading(true)
    try {
      const response = await authApi.login({ email, password })
      if (response.error || !response.token || !response.user) {
        setError(response.error || t('auth.loginFailed'))
        return false
      }
      setAuthToken(response.token)
      setUser(response.user)
      return true
    } catch {
      setError(t('auth.serverError'))
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const register = async (email: string, password: string, name: string): Promise<boolean> => {
    setError(null)
    setIsLoading(true)
    try {
      const response = await authApi.register({ email, password, name })
      if (response.error || !response.token || !response.user) {
        setError(response.error || t('auth.registerFailed'))
        return false
      }
      setAuthToken(response.token)
      setUser(response.user)
      return true
    } catch {
      setError(t('auth.serverError'))
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    removeAuthToken()
    setUser(null)
    setError(null)
  }

  // Register auto-logout callback for 401 responses.
  // Inline the logout logic so the effect only depends on stable setState
  // functions (guaranteed stable by React) — no eslint-disable needed.
  useEffect(() => {
    setOnUnauthorized(() => {
      removeAuthToken()
      setUser(null)
      setError(null)
    })
    return () => setOnUnauthorized(null)
  }, [])

  const clearError = () => setError(null)

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'ADMIN',
        isAuthRequired,
        isLoading,
        error,
        login,
        register,
        logout,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
