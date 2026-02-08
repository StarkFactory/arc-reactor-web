import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import type { ReactNode } from 'react'
import type { User } from '../types/auth'
import * as authApi from '../services/auth'
import { getAuthToken, setAuthToken, removeAuthToken, setOnUnauthorized } from '../utils/api-client'

interface AuthContextValue {
  user: User | null
  isAuthenticated: boolean
  isAuthRequired: boolean
  isLoading: boolean
  error: string | null
  login: (email: string, password: string) => Promise<boolean>
  register: (email: string, password: string, name: string) => Promise<boolean>
  logout: () => void
  clearError: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [isAuthRequired, setIsAuthRequired] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // On mount: check if auth is required and validate existing token
  useEffect(() => {
    let cancelled = false

    async function init() {
      try {
        const required = await authApi.checkAuthRequired()
        if (cancelled) return

        setIsAuthRequired(required)

        if (required) {
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
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    init()
    return () => { cancelled = true }
  }, [])

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    setError(null)
    setIsLoading(true)
    try {
      const response = await authApi.login({ email, password })
      if (response.error || !response.token || !response.user) {
        setError(response.error || '로그인에 실패했습니다.')
        return false
      }
      setAuthToken(response.token)
      setUser(response.user)
      return true
    } catch {
      setError('서버에 연결할 수 없습니다.')
      return false
    } finally {
      setIsLoading(false)
    }
  }, [])

  const register = useCallback(async (email: string, password: string, name: string): Promise<boolean> => {
    setError(null)
    setIsLoading(true)
    try {
      const response = await authApi.register({ email, password, name })
      if (response.error || !response.token || !response.user) {
        setError(response.error || '회원가입에 실패했습니다.')
        return false
      }
      setAuthToken(response.token)
      setUser(response.user)
      return true
    } catch {
      setError('서버에 연결할 수 없습니다.')
      return false
    } finally {
      setIsLoading(false)
    }
  }, [])

  const logout = useCallback(() => {
    removeAuthToken()
    setUser(null)
    setError(null)
  }, [])

  // Register auto-logout callback for 401 responses
  useEffect(() => {
    setOnUnauthorized(logout)
    return () => setOnUnauthorized(null)
  }, [logout])

  const clearError = useCallback(() => setError(null), [])

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
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
