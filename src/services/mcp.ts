import type {
  McpServerResponse,
  McpServerDetailResponse,
  RegisterMcpServerRequest,
  UpdateMcpServerRequest,
  McpConnectResponse,
} from '../types/api'
import { API_BASE } from '../utils/constants'
import { fetchWithAuth } from '../utils/api-client'

export async function listMcpServers(): Promise<McpServerResponse[]> {
  const res = await fetchWithAuth(`${API_BASE}/api/mcp/servers`)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export async function getMcpServer(name: string): Promise<McpServerDetailResponse> {
  const res = await fetchWithAuth(`${API_BASE}/api/mcp/servers/${encodeURIComponent(name)}`)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export async function registerMcpServer(request: RegisterMcpServerRequest): Promise<McpServerResponse> {
  const res = await fetchWithAuth(`${API_BASE}/api/mcp/servers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  })
  if (res.status === 409) throw new Error('CONFLICT')
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export async function updateMcpServer(name: string, request: UpdateMcpServerRequest): Promise<McpServerResponse> {
  const res = await fetchWithAuth(`${API_BASE}/api/mcp/servers/${encodeURIComponent(name)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export async function deleteMcpServer(name: string): Promise<void> {
  const res = await fetchWithAuth(`${API_BASE}/api/mcp/servers/${encodeURIComponent(name)}`, {
    method: 'DELETE',
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
}

export async function connectMcpServer(name: string): Promise<McpConnectResponse> {
  const res = await fetchWithAuth(`${API_BASE}/api/mcp/servers/${encodeURIComponent(name)}/connect`, {
    method: 'POST',
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)
  return data
}

export async function disconnectMcpServer(name: string): Promise<void> {
  const res = await fetchWithAuth(`${API_BASE}/api/mcp/servers/${encodeURIComponent(name)}/disconnect`, {
    method: 'POST',
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
}
