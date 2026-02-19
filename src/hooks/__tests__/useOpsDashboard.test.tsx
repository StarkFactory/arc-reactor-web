import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { type ReactNode } from 'react'
import { useOpsDashboard } from '../useOpsDashboard'

vi.mock('../../lib/http', () => ({
  api: {
    get: vi.fn().mockReturnValue({ json: vi.fn() }),
  },
}))

vi.mock('../../services/ops-dashboard', () => ({
  fetchOpsDashboard: vi.fn(),
}))

import { fetchOpsDashboard } from '../../services/ops-dashboard'

const mockMetrics = {
  totalChats: 1200,
  activeUsers: 42,
  successRate: 97.5,
  avgLatencyMs: 310,
  schedulerJobSummary: { successCount: 5, failedCount: 1, disabledCount: 2 },
  recentAuditLogs: [],
}

function wrapper({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      {children}
    </QueryClientProvider>
  )
}

beforeEach(() => {
  vi.mocked(fetchOpsDashboard).mockResolvedValue(mockMetrics)
})

describe('useOpsDashboard', () => {
  it('fetches and returns ops dashboard metrics', async () => {
    const { result } = renderHook(() => useOpsDashboard(), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.totalChats).toBe(1200)
    expect(result.current.data?.successRate).toBe(97.5)
  })

  it('exposes isLoading while fetching', () => {
    vi.mocked(fetchOpsDashboard).mockImplementation(() => new Promise(() => {}))
    const { result } = renderHook(() => useOpsDashboard(), { wrapper })
    expect(result.current.isLoading).toBe(true)
  })

  it('exposes isError on failure', async () => {
    vi.mocked(fetchOpsDashboard).mockRejectedValue(new Error('network error'))
    const { result } = renderHook(() => useOpsDashboard(), { wrapper })
    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})
