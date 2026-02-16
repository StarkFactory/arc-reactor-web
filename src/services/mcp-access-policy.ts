import type { McpAccessPolicyResponse, UpdateMcpAccessPolicyRequest } from '../types/api'
import { API_BASE } from '../utils/constants'
import { fetchWithAuth } from '../utils/api-client'

export async function getMcpAccessPolicy(serverName: string): Promise<McpAccessPolicyResponse> {
  const res = await fetchWithAuth(`${API_BASE}/api/mcp/servers/${encodeURIComponent(serverName)}/access-policy`)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export async function updateMcpAccessPolicy(
  serverName: string,
  request: UpdateMcpAccessPolicyRequest
): Promise<McpAccessPolicyResponse> {
  const res = await fetchWithAuth(`${API_BASE}/api/mcp/servers/${encodeURIComponent(serverName)}/access-policy`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export async function clearMcpAccessPolicy(serverName: string): Promise<{ ok: boolean; message?: string }> {
  const res = await fetchWithAuth(`${API_BASE}/api/mcp/servers/${encodeURIComponent(serverName)}/access-policy`, {
    method: 'DELETE',
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

