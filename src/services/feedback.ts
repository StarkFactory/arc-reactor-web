import type { FeedbackPageResponse, FeedbackParams, FeedbackResponse } from '../types/api'
import { api } from '../lib/http'

export function fetchFeedback(params: FeedbackParams = {}): Promise<FeedbackPageResponse> {
  const searchParams: Record<string, string> = {}
  if (params.page !== undefined) searchParams['page'] = String(params.page)
  if (params.size !== undefined) searchParams['size'] = String(params.size)
  if (params.rating) searchParams['rating'] = params.rating
  if (params.intentName) searchParams['intentName'] = params.intentName
  if (params.from) searchParams['from'] = params.from
  if (params.to) searchParams['to'] = params.to
  return api.get('feedback', { searchParams }).json()
}

export function fetchFeedbackDetail(id: string): Promise<FeedbackResponse> {
  return api.get(`feedback/${id}`).json()
}

export function deleteFeedback(id: string): Promise<void> {
  return api.delete(`feedback/${id}`).then(() => undefined)
}
