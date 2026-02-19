import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { type ReactNode } from 'react'
import { useRagPolicy, useRagCandidates } from '../useRag'

vi.mock('../../lib/http', () => ({
  api: {
    get: vi.fn().mockReturnValue({ json: vi.fn() }),
    put: vi.fn().mockReturnValue({ json: vi.fn() }),
    post: vi.fn().mockReturnValue({ json: vi.fn() }),
  },
}))

vi.mock('../../services/rag', () => ({
  fetchRagPolicy: vi.fn(),
  updateRagPolicy: vi.fn(),
  fetchRagCandidates: vi.fn(),
  approveRagCandidate: vi.fn(),
  rejectRagCandidate: vi.fn(),
}))

import { fetchRagPolicy, fetchRagCandidates } from '../../services/rag'

const mockPolicy = {
  enabled: true,
  requireReview: true,
  allowedChannels: ['#dev'],
  minQueryLength: 20,
  blockPatterns: [],
}

const mockCandidatesPage = {
  content: [
    {
      id: 'c1',
      query: 'How to deploy?',
      answer: 'Use kubectl.',
      channel: '#dev',
      status: 'PENDING' as const,
      rejectionReason: null,
      createdAt: Date.now(),
    },
  ],
  totalElements: 1,
  totalPages: 1,
  page: 0,
  size: 20,
}

function wrapper({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      {children}
    </QueryClientProvider>
  )
}

beforeEach(() => {
  vi.mocked(fetchRagPolicy).mockResolvedValue(mockPolicy)
  vi.mocked(fetchRagCandidates).mockResolvedValue(mockCandidatesPage)
})

describe('useRagPolicy', () => {
  it('fetches and returns RAG policy', async () => {
    const { result } = renderHook(() => useRagPolicy(), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.enabled).toBe(true)
    expect(result.current.data?.requireReview).toBe(true)
  })

  it('exposes isError on failure', async () => {
    vi.mocked(fetchRagPolicy).mockRejectedValue(new Error('server error'))
    const { result } = renderHook(() => useRagPolicy(), { wrapper })
    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})

describe('useRagCandidates', () => {
  it('fetches candidates with status filter', async () => {
    const { result } = renderHook(() => useRagCandidates({ status: 'PENDING' }), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.content[0].status).toBe('PENDING')
    expect(fetchRagCandidates).toHaveBeenCalledWith(expect.objectContaining({ status: 'PENDING' }))
  })
})
