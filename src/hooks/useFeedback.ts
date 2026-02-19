import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '../lib/queryKeys'
import { fetchFeedback, fetchFeedbackDetail, deleteFeedback } from '../services/feedback'
import type { FeedbackParams } from '../types/api'

export function useFeedback(params: FeedbackParams = {}) {
  return useQuery({
    queryKey: queryKeys.feedback.list(params as Record<string, unknown>),
    queryFn: () => fetchFeedback(params),
    placeholderData: (prev) => prev,
  })
}

export function useFeedbackDetail(id: string) {
  return useQuery({
    queryKey: queryKeys.feedback.detail(id),
    queryFn: () => fetchFeedbackDetail(id),
    enabled: !!id,
  })
}

export function useDeleteFeedback() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteFeedback(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.feedback.all() }),
  })
}
