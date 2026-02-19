import type {
  RagIngestionPolicy,
  RagCandidatePageResponse,
  RagCandidateParams,
} from '../types/api'
import { api } from '../lib/http'

export function fetchRagPolicy(): Promise<RagIngestionPolicy> {
  return api.get('rag-ingestion/policy').json()
}

export function updateRagPolicy(policy: RagIngestionPolicy): Promise<RagIngestionPolicy> {
  return api.put('rag-ingestion/policy', { json: policy }).json()
}

export function fetchRagCandidates(params: RagCandidateParams = {}): Promise<RagCandidatePageResponse> {
  const searchParams: Record<string, string> = {}
  if (params.page !== undefined) searchParams['page'] = String(params.page)
  if (params.size !== undefined) searchParams['size'] = String(params.size)
  if (params.status) searchParams['status'] = params.status
  if (params.channel) searchParams['channel'] = params.channel
  return api.get('rag-ingestion/candidates', { searchParams }).json()
}

export function approveRagCandidate(id: string): Promise<void> {
  return api.post(`rag-ingestion/candidates/${id}/approve`, { json: {} }).then(() => undefined)
}

export function rejectRagCandidate(id: string, reason: string): Promise<void> {
  return api.post(`rag-ingestion/candidates/${id}/reject`, { json: { reason } }).then(() => undefined)
}
