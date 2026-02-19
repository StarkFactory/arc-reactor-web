import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '../lib/queryKeys'
import { fetchSessions, fetchSessionDetail, deleteSession, exportSession } from '../services/sessions'
import type { SessionParams } from '../types/api'

export function useSessions(params: SessionParams = {}) {
  return useQuery({
    queryKey: queryKeys.sessions.list(params as Record<string, unknown>),
    queryFn: () => fetchSessions(params),
    placeholderData: (prev) => prev,
  })
}

export function useSessionDetail(id: string) {
  return useQuery({
    queryKey: queryKeys.sessions.detail(id),
    queryFn: () => fetchSessionDetail(id),
    enabled: !!id,
  })
}

export function useDeleteSession() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteSession(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.sessions.all() }),
  })
}

export function useExportSession() {
  return useMutation({
    mutationFn: ({ id, format }: { id: string; format: 'json' | 'markdown' }) =>
      exportSession(id, format),
  })
}
