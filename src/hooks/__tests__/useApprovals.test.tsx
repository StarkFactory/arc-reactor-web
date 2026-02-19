import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { type ReactNode } from 'react'
import { usePendingApprovals } from '../useApprovals'

vi.mock('../../lib/http', () => ({
  api: {
    get: vi.fn().mockReturnValue({ json: vi.fn() }),
    post: vi.fn().mockReturnValue({ json: vi.fn() }),
  },
}))

vi.mock('../../services/approval', () => ({
  fetchPendingApprovals: vi.fn(),
  approveToolCall: vi.fn(),
  rejectToolCall: vi.fn(),
}))

import { fetchPendingApprovals } from '../../services/approval'

const mockApprovals = [
  {
    id: 'a1',
    runId: 'run-1',
    userId: 'u1',
    toolName: 'jira_create_issue',
    arguments: { summary: 'Fix bug' },
    requestedAt: new Date().toISOString(),
    status: 'PENDING' as const,
  },
]

function wrapper({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      {children}
    </QueryClientProvider>
  )
}

beforeEach(() => {
  vi.mocked(fetchPendingApprovals).mockResolvedValue(mockApprovals)
})

describe('usePendingApprovals', () => {
  it('fetches and returns pending approvals', async () => {
    // Disable polling for the test
    const { result } = renderHook(() => usePendingApprovals(0), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toHaveLength(1)
    expect(result.current.data?.[0].toolName).toBe('jira_create_issue')
  })

  it('returns empty list when service throws', async () => {
    vi.mocked(fetchPendingApprovals).mockResolvedValue([])
    const { result } = renderHook(() => usePendingApprovals(0), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toHaveLength(0)
  })
})
