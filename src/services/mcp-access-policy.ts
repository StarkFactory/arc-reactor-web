import type { McpAccessPolicyResponse, UpdateMcpAccessPolicyRequest } from '../types/api'
import { api } from '../lib/http'

export const getMcpAccessPolicy = (serverName: string): Promise<McpAccessPolicyResponse> =>
  api.get(`mcp/servers/${encodeURIComponent(serverName)}/access-policy`).json()

export const updateMcpAccessPolicy = (
  serverName: string,
  request: UpdateMcpAccessPolicyRequest,
): Promise<McpAccessPolicyResponse> =>
  api.put(`mcp/servers/${encodeURIComponent(serverName)}/access-policy`, { json: request }).json()

export const clearMcpAccessPolicy = (serverName: string): Promise<{ ok: boolean; message?: string }> =>
  api.delete(`mcp/servers/${encodeURIComponent(serverName)}/access-policy`).json()
