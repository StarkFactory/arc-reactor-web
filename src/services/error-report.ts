import type { ErrorReportRequest, ErrorReportResponse } from '../types/api'
import { API_BASE } from '../utils/constants'
import { fetchWithAuth } from '../utils/api-client'

export async function submitErrorReport(
  request: ErrorReportRequest,
  apiKey?: string,
): Promise<ErrorReportResponse> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  if (apiKey) {
    headers['X-API-Key'] = apiKey
  }

  const res = await fetchWithAuth(`${API_BASE}/api/error-report`, {
    method: 'POST',
    headers,
    body: JSON.stringify(request),
  })

  if (res.status === 401) throw new Error('UNAUTHORIZED')
  if (res.status === 400) {
    const body = await res.json().catch(() => null)
    throw new Error(body?.message || 'Validation failed')
  }
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}
