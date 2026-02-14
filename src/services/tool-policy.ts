import type {
  ToolPolicyStateResponse,
  ToolPolicyResponse,
  UpdateToolPolicyRequest,
} from '../types/api'
import { API_BASE } from '../utils/constants'
import { fetchWithAuth } from '../utils/api-client'

const BASE = `${API_BASE}/api/tool-policy`

export async function getToolPolicy(): Promise<ToolPolicyStateResponse> {
  const res = await fetchWithAuth(BASE)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export async function updateToolPolicy(request: UpdateToolPolicyRequest): Promise<ToolPolicyResponse> {
  const res = await fetchWithAuth(BASE, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export async function deleteToolPolicy(): Promise<void> {
  const res = await fetchWithAuth(BASE, { method: 'DELETE' })
  if (!res.ok && res.status !== 204) throw new Error(`HTTP ${res.status}`)
}
