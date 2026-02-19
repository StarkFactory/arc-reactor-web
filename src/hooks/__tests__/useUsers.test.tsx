import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { type ReactNode } from 'react'
import { useUsers } from '../useUsers'

vi.mock('../../lib/http', () => ({
  api: {
    get: vi.fn().mockReturnValue({ json: vi.fn() }),
    put: vi.fn().mockReturnValue({ json: vi.fn() }),
    post: vi.fn().mockReturnValue({ json: vi.fn() }),
  },
}))

vi.mock('../../services/users', () => ({
  fetchUsers: vi.fn(),
  updateUserRole: vi.fn(),
  updateUserStatus: vi.fn(),
  resetUserPassword: vi.fn(),
}))

import { fetchUsers } from '../../services/users'

const mockPage = {
  content: [
    {
      id: 'u1',
      email: 'admin@example.com',
      name: 'Admin User',
      role: 'ADMIN' as const,
      active: true,
      createdAt: Date.now(),
    },
    {
      id: 'u2',
      email: 'user@example.com',
      name: 'Regular User',
      role: 'USER' as const,
      active: true,
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
  vi.mocked(fetchUsers).mockResolvedValue(mockPage)
})

describe('useUsers', () => {
  it('fetches and returns user list', async () => {
    const { result } = renderHook(() => useUsers({ page: 0, size: 20 }), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.content).toHaveLength(2)
    expect(result.current.data?.content[0].role).toBe('ADMIN')
  })

  it('passes filter params to fetchUsers', async () => {
    const { result } = renderHook(
      () => useUsers({ role: 'ADMIN', search: 'admin@example.com' }),
      { wrapper }
    )
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(fetchUsers).toHaveBeenCalledWith(
      expect.objectContaining({ role: 'ADMIN', search: 'admin@example.com' })
    )
  })

  it('exposes isError on failure', async () => {
    vi.mocked(fetchUsers).mockRejectedValue(new Error('forbidden'))
    const { result } = renderHook(() => useUsers(), { wrapper })
    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})
