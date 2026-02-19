import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { useIntents, useCreateIntent, useDeleteIntent } from '../useIntents'

vi.mock('../../services/intents', () => ({
  listIntents: vi.fn(),
  createIntent: vi.fn(),
  updateIntent: vi.fn(),
  deleteIntent: vi.fn(),
}))

const mockIntents = [
  {
    name: 'greet',
    description: 'Greet the user',
    examples: ['hello'],
    keywords: ['hi'],
    profile: { model: null, temperature: null, maxToolCalls: null, allowedTools: null, systemPrompt: null, responseFormat: null },
    enabled: true,
    createdAt: 1000,
    updatedAt: 1001,
  },
]

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('useIntents', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns intents on success', async () => {
    const { listIntents } = await import('../../services/intents')
    vi.mocked(listIntents).mockResolvedValueOnce(mockIntents)

    const { result } = renderHook(() => useIntents(), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(mockIntents)
  })

  it('returns isError true on fetch failure', async () => {
    const { listIntents } = await import('../../services/intents')
    vi.mocked(listIntents).mockRejectedValueOnce(new Error('Network error'))

    const { result } = renderHook(() => useIntents(), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})

describe('useCreateIntent', () => {
  it('calls createIntent with the provided data', async () => {
    const { createIntent, listIntents } = await import('../../services/intents')
    vi.mocked(createIntent).mockResolvedValueOnce(mockIntents[0])
    vi.mocked(listIntents).mockResolvedValue([])

    const { result } = renderHook(() => useCreateIntent(), { wrapper: createWrapper() })

    await result.current.mutateAsync({ name: 'greet', description: 'Greet the user' })

    expect(vi.mocked(createIntent)).toHaveBeenCalledWith({ name: 'greet', description: 'Greet the user' })
  })
})

describe('useDeleteIntent', () => {
  it('calls deleteIntent with the given name', async () => {
    const { deleteIntent, listIntents } = await import('../../services/intents')
    vi.mocked(deleteIntent).mockResolvedValueOnce(undefined)
    vi.mocked(listIntents).mockResolvedValue([])

    const { result } = renderHook(() => useDeleteIntent(), { wrapper: createWrapper() })

    await result.current.mutateAsync('greet')

    expect(vi.mocked(deleteIntent)).toHaveBeenCalledWith('greet')
  })
})
