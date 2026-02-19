import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { type ReactNode } from 'react'
import { useFeedback } from '../useFeedback'

vi.mock('../../lib/http', () => ({
  api: {
    get: vi.fn().mockReturnValue({ json: vi.fn() }),
    delete: vi.fn().mockReturnValue(Promise.resolve()),
  },
}))

vi.mock('../../services/feedback', () => ({
  fetchFeedback: vi.fn(),
  fetchFeedbackDetail: vi.fn(),
  deleteFeedback: vi.fn(),
}))

import { fetchFeedback } from '../../services/feedback'

const mockPage = {
  content: [
    {
      id: 'f1',
      rating: 'POSITIVE' as const,
      userId: 'u1',
      intentName: 'tech-support',
      model: 'claude-3-5-sonnet',
      durationMs: 1200,
      query: 'How to fix this?',
      answer: 'Try this solution.',
      toolsUsed: [],
      createdAt: Date.now(),
    },
    {
      id: 'f2',
      rating: 'NEGATIVE' as const,
      userId: 'u2',
      intentName: null,
      model: null,
      durationMs: null,
      query: 'Bad answer',
      answer: null,
      toolsUsed: [],
      createdAt: Date.now(),
    },
  ],
  totalElements: 2,
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
  vi.mocked(fetchFeedback).mockResolvedValue(mockPage)
})

describe('useFeedback', () => {
  it('fetches and returns feedback list', async () => {
    const { result } = renderHook(() => useFeedback({ page: 0, size: 20 }), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.content).toHaveLength(2)
    expect(result.current.data?.content[0].rating).toBe('POSITIVE')
  })

  it('passes filter params to fetchFeedback', async () => {
    const { result } = renderHook(() => useFeedback({ rating: 'NEGATIVE' }), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(fetchFeedback).toHaveBeenCalledWith(expect.objectContaining({ rating: 'NEGATIVE' }))
  })

  it('exposes isError on failure', async () => {
    vi.mocked(fetchFeedback).mockRejectedValue(new Error('server error'))
    const { result } = renderHook(() => useFeedback(), { wrapper })
    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})
