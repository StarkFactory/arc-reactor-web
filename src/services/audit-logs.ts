import { api } from '../lib/http'
import type { AuditLogsPageResponse, AuditLogsParams } from '../types/api'

export function fetchAuditLogs(params: AuditLogsParams = {}): Promise<AuditLogsPageResponse> {
  const searchParams: Record<string, string> = {}
  if (params.page !== undefined) searchParams.page = String(params.page)
  if (params.size !== undefined) searchParams.size = String(params.size)
  if (params.category) searchParams.category = params.category
  if (params.actor) searchParams.actor = params.actor
  if (params.from) searchParams.from = params.from
  if (params.to) searchParams.to = params.to
  return api.get('admin/audits', { searchParams }).json()
}
