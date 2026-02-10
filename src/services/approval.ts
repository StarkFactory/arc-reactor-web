import type { ApprovalSummary, ApprovalActionResponse } from '../types/api'
import { fetchWithAuth } from '../utils/api-client'
import { API_BASE } from '../utils/constants'

export async function fetchPendingApprovals(): Promise<ApprovalSummary[]> {
  try {
    const res = await fetchWithAuth(`${API_BASE}/api/approvals`)
    if (!res.ok) return []
    return await res.json()
  } catch {
    return []
  }
}

export async function approveToolCall(id: string): Promise<ApprovalActionResponse> {
  const res = await fetchWithAuth(`${API_BASE}/api/approvals/${id}/approve`, {
    method: 'POST',
    body: JSON.stringify({}),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return await res.json()
}

export async function rejectToolCall(id: string, reason?: string): Promise<ApprovalActionResponse> {
  const res = await fetchWithAuth(`${API_BASE}/api/approvals/${id}/reject`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return await res.json()
}
