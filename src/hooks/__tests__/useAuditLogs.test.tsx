import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { type ReactNode } from 'react'
import { useAuditLogs } from '../useAuditLogs'

vi.mock('../../lib/http', () => ({
  api: {
    get: vi.fn().mockReturnValue({ json: vi.fn() }),
  },
}))

vi.mock('../../services/audit-logs', () => ({
  fetchAuditLogs: vi.fn(),
}))

import { fetchAuditLogs } from '../../services/audit-logs'

const mockPage = {
  content: [
    {
      id: '1',
      category: 'PERSONA',
      action: 'UPDATE',
      actor: 'admin@example.com',
      resourceId: 'persona:3',
      detail: { name: 'New name' },
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
  vi.mocked(fetchAuditLogs).mockResolvedValue(mockPage)
})

describe('useAuditLogs', () => {
  it('fetches audit logs and returns page data', async () => {
    const { result } = renderHook(() => useAuditLogs({ page: 0, size: 20 }), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.content).toHaveLength(1)
    expect(result.current.data?.content[0].category).toBe('PERSONA')
  })

  it('passes filter params to fetchAuditLogs', async () => {
    const { result } = renderHook(
      () => useAuditLogs({ category: 'MCP', actor: 'admin@example.com' }),
      { wrapper }
    )
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(fetchAuditLogs).toHaveBeenCalledWith(
      expect.objectContaining({ category: 'MCP', actor: 'admin@example.com' })
    )
  })

  it('exposes isError on failure', async () => {
    vi.mocked(fetchAuditLogs).mockRejectedValue(new Error('server error'))
    const { result } = renderHook(() => useAuditLogs(), { wrapper })
    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})
