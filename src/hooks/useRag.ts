import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '../lib/queryKeys'
import {
  fetchRagPolicy,
  updateRagPolicy,
  fetchRagCandidates,
  approveRagCandidate,
  rejectRagCandidate,
} from '../services/rag'
import type { RagIngestionPolicy, RagCandidateParams } from '../types/api'

export function useRagPolicy() {
  return useQuery({
    queryKey: queryKeys.rag.policy(),
    queryFn: fetchRagPolicy,
  })
}

export function useUpdateRagPolicy() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (policy: RagIngestionPolicy) => updateRagPolicy(policy),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.rag.all() }),
  })
}

export function useRagCandidates(params: RagCandidateParams = {}) {
  return useQuery({
    queryKey: queryKeys.rag.candidates(params as Record<string, unknown>),
    queryFn: () => fetchRagCandidates(params),
    placeholderData: (prev) => prev,
  })
}

export function useApproveRagCandidate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => approveRagCandidate(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.rag.all() }),
  })
}

export function useRejectRagCandidate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      rejectRagCandidate(id, reason),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.rag.all() }),
  })
}
