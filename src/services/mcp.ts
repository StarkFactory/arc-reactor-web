import type {
  McpServerResponse,
  McpServerDetailResponse,
  RegisterMcpServerRequest,
  UpdateMcpServerRequest,
  McpConnectResponse,
} from '../types/api'
import { api, isHttpError } from '../lib/http'

export const listMcpServers = (): Promise<McpServerResponse[]> =>
  api.get('mcp/servers').json()

export const getMcpServer = (name: string): Promise<McpServerDetailResponse> =>
  api.get(`mcp/servers/${encodeURIComponent(name)}`).json()

export async function registerMcpServer(request: RegisterMcpServerRequest): Promise<McpServerResponse> {
  try {
    return await api.post('mcp/servers', { json: request }).json()
  } catch (error) {
    if (isHttpError(error, 409)) throw new Error('CONFLICT')
    throw error
  }
}

export const updateMcpServer = (name: string, request: UpdateMcpServerRequest): Promise<McpServerResponse> =>
  api.put(`mcp/servers/${encodeURIComponent(name)}`, { json: request }).json()

export const deleteMcpServer = (name: string): Promise<void> =>
  api.delete(`mcp/servers/${encodeURIComponent(name)}`).then(() => undefined)

// ky throws HTTPError on non-2xx, so .json() is called only on success responses.
// The beforeError hook in lib/http attaches "HTTP <status> <url>" as the error message.
export const connectMcpServer = (name: string): Promise<McpConnectResponse> =>
  api.post(`mcp/servers/${encodeURIComponent(name)}/connect`).json()

export const disconnectMcpServer = (name: string): Promise<void> =>
  api.post(`mcp/servers/${encodeURIComponent(name)}/disconnect`).then(() => undefined)
