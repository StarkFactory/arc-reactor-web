import { useEffect } from 'react'
import type { ReactNode } from 'react'
import { useAuthStore } from '../stores/authStore'
import { setOnUnauthorized } from '../utils/api-client'

// Re-export the store's state shape as the public hook API so existing
// call-sites (useAuth()) do not need to change.
// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const store = useAuthStore()
  return {
    user: store.user,
    isAuthenticated: !!store.user,
    isAdmin: store.user?.role === 'ADMIN',
    isAuthRequired: store.isAuthRequired,
    isLoading: store.isLoading,
    error: store.error,
    login: store.login,
    register: store.register,
    logout: store.logout,
    clearError: store.clearError,
  }
}

interface AuthProviderProps {
  children: ReactNode
}

// AuthProvider is now a thin initializer — it bootstraps auth state and
// registers the 401 auto-logout handler. State lives in useAuthStore.
export function AuthProvider({ children }: AuthProviderProps) {
  const initialize = useAuthStore((state) => state.initialize)
  const logout = useAuthStore((state) => state.logout)

  // Bootstrap: check auth requirement and validate existing JWT on mount
  useEffect(() => {
    initialize()
  }, [initialize])

  // Wire the 401 auto-logout callback used by the HTTP layer
  useEffect(() => {
    setOnUnauthorized(logout)
    return () => setOnUnauthorized(null)
  }, [logout])

  return <>{children}</>
}
