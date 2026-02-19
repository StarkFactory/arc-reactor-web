import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { type ReactNode } from 'react'
import { useSessions } from '../useSessions'

vi.mock('../../lib/http', () => ({
  api: {
    get: vi.fn().mockReturnValue({ json: vi.fn(), text: vi.fn() }),
    delete: vi.fn().mockReturnValue(Promise.resolve()),
  },
}))

vi.mock('../../services/sessions', () => ({
  fetchSessions: vi.fn(),
  fetchSessionDetail: vi.fn(),
  deleteSession: vi.fn(),
  exportSession: vi.fn(),
}))

import { fetchSessions } from '../../services/sessions'

const mockPage = {
  content: [
    {
      id: 's1',
      userId: 'u1',
      userEmail: 'user@example.com',
      title: 'Help with deployment',
      messageCount: 5,
      lastMessage: 'Thanks!',
      createdAt: Date.now(),
      updatedAt: Date.now(),
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
  vi.mocked(fetchSessions).mockResolvedValue(mockPage)
})

describe('useSessions', () => {
  it('fetches and returns session list', async () => {
    const { result } = renderHook(() => useSessions({ page: 0, size: 20 }), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.content).toHaveLength(1)
    expect(result.current.data?.content[0].userEmail).toBe('user@example.com')
  })

  it('passes filter params to fetchSessions', async () => {
    const { result } = renderHook(() => useSessions({ search: 'deploy' }), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(fetchSessions).toHaveBeenCalledWith(expect.objectContaining({ search: 'deploy' }))
  })

  it('exposes isError on failure', async () => {
    vi.mocked(fetchSessions).mockRejectedValue(new Error('server error'))
    const { result } = renderHook(() => useSessions(), { wrapper })
    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})
