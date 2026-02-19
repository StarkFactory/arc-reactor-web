import type { ApprovalSummary, ApprovalActionResponse } from '../types/api'
import { api } from '../lib/http'

export async function fetchPendingApprovals(): Promise<ApprovalSummary[]> {
  try {
    return await api.get('approvals').json()
  } catch {
    // Return an empty list on any error so the UI degrades silently
    return []
  }
}

export const approveToolCall = (id: string): Promise<ApprovalActionResponse> =>
  api.post(`approvals/${id}/approve`, { json: {} }).json()

export const rejectToolCall = (id: string, reason?: string): Promise<ApprovalActionResponse> =>
  api.post(`approvals/${id}/reject`, { json: { reason } }).json()
