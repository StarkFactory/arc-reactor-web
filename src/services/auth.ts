import type { LoginRequest, RegisterRequest, AuthResponse, User } from '../types/auth'
import { API_BASE } from '../utils/constants'
import { fetchWithAuth } from '../utils/api-client'

export async function login(request: LoginRequest): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  })
  if (!res.ok && res.status !== 401) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export async function register(request: RegisterRequest): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  })
  if (!res.ok && res.status !== 409) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export async function getMe(): Promise<User> {
  const res = await fetchWithAuth(`${API_BASE}/api/auth/me`)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

/**
 * Probe whether auth is enabled on the backend.
 * Calls /api/models without token — 401 means auth is required.
 */
export async function checkAuthRequired(): Promise<boolean> {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 5000)
    const res = await fetch(`${API_BASE}/api/models`, { signal: controller.signal })
    clearTimeout(timeout)
    return res.status === 401
  } catch {
    return false
  }
}
