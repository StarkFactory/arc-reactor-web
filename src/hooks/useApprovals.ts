import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '../lib/queryKeys'
import { fetchPendingApprovals, approveToolCall, rejectToolCall } from '../services/approval'

export function usePendingApprovals(pollingInterval = 2000) {
  return useQuery({
    queryKey: queryKeys.approval.list(),
    queryFn: fetchPendingApprovals,
    refetchInterval: pollingInterval,
  })
}

export function useApproveToolCall() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => approveToolCall(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.approval.all() }),
  })
}

export function useRejectToolCall() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      rejectToolCall(id, reason),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.approval.all() }),
  })
}
