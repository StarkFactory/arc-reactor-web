import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '../lib/queryKeys'
import { fetchAuditLogs } from '../services/audit-logs'
import type { AuditLogsParams } from '../types/api'

export function useAuditLogs(params: AuditLogsParams = {}) {
  return useQuery({
    queryKey: queryKeys.auditLogs.list(params as Record<string, unknown>),
    queryFn: () => fetchAuditLogs(params),
    placeholderData: (prev) => prev,
  })
}
