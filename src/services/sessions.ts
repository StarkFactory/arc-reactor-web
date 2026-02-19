import type { SessionPageResponse, SessionDetailResponse, SessionParams } from '../types/api'
import { api } from '../lib/http'

export function fetchSessions(params: SessionParams = {}): Promise<SessionPageResponse> {
  const searchParams: Record<string, string> = {}
  if (params.page !== undefined) searchParams['page'] = String(params.page)
  if (params.size !== undefined) searchParams['size'] = String(params.size)
  if (params.userId) searchParams['userId'] = params.userId
  if (params.search) searchParams['search'] = params.search
  return api.get('sessions', { searchParams }).json()
}

export function fetchSessionDetail(id: string): Promise<SessionDetailResponse> {
  return api.get(`sessions/${id}`).json()
}

export function deleteSession(id: string): Promise<void> {
  return api.delete(`sessions/${id}`).then(() => undefined)
}

export function exportSession(id: string, format: 'json' | 'markdown'): Promise<string> {
  return api.get(`sessions/${id}/export`, { searchParams: { format } }).text()
}
