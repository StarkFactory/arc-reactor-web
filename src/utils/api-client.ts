const TOKEN_KEY = 'arc-reactor-auth-token'

export function getAuthToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function setAuthToken(token: string): void {
  try {
    localStorage.setItem(TOKEN_KEY, token)
  } catch {
    // localStorage unavailable
  }
}

export function removeAuthToken(): void {
  try {
    localStorage.removeItem(TOKEN_KEY)
  } catch {
    // localStorage unavailable
  }
}

// Callback for 401 auto-logout (set by AuthContext)
let onUnauthorized: (() => void) | null = null

export function setOnUnauthorized(callback: (() => void) | null): void {
  onUnauthorized = callback
}

/**
 * Fetch wrapper that automatically adds the Authorization header
 * when a JWT token exists in localStorage.
 * On 401 response, triggers auto-logout if registered.
 */
export async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
  const token = getAuthToken()
  const headers = new Headers(options.headers)
  headers.set('Content-Type', headers.get('Content-Type') || 'application/json')
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }
  const response = await fetch(url, { ...options, headers })

  // Auto-logout on 401 (expired/invalid JWT)
  if (response.status === 401 && token && onUnauthorized) {
    onUnauthorized()
  }

  return response
}
