import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { usePersonas, useCreatePersona, useDeletePersona } from '../usePersonas'

vi.mock('../../services/personas', () => ({
  listPersonas: vi.fn(),
  createPersona: vi.fn(),
  updatePersona: vi.fn(),
  deletePersona: vi.fn(),
}))

const mockPersonas = [
  { id: '1', name: 'Bot A', systemPrompt: 'You are Bot A.', isDefault: false, createdAt: 1000, updatedAt: 1001 },
  { id: '2', name: 'Bot B', systemPrompt: 'You are Bot B.', isDefault: true, createdAt: 1002, updatedAt: 1003 },
]

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('usePersonas', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns a list of personas on success', async () => {
    const { listPersonas } = await import('../../services/personas')
    vi.mocked(listPersonas).mockResolvedValueOnce(mockPersonas)

    const { result } = renderHook(() => usePersonas(), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(mockPersonas)
  })

  it('returns isError true on fetch failure', async () => {
    const { listPersonas } = await import('../../services/personas')
    vi.mocked(listPersonas).mockRejectedValueOnce(new Error('Network error'))

    const { result } = renderHook(() => usePersonas(), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})

describe('useCreatePersona', () => {
  it('calls createPersona and returns the new persona', async () => {
    const { createPersona } = await import('../../services/personas')
    const newPersona = { id: '3', name: 'Bot C', systemPrompt: 'You are Bot C.', isDefault: false, createdAt: 2000, updatedAt: 2001 }
    vi.mocked(createPersona).mockResolvedValueOnce(newPersona)
    vi.mocked((await import('../../services/personas')).listPersonas).mockResolvedValue([])

    const { result } = renderHook(() => useCreatePersona(), { wrapper: createWrapper() })

    await result.current.mutateAsync({ name: 'Bot C', systemPrompt: 'You are Bot C.' })

    expect(vi.mocked(createPersona)).toHaveBeenCalledWith({ name: 'Bot C', systemPrompt: 'You are Bot C.' })
  })
})

describe('useDeletePersona', () => {
  it('calls deletePersona with the given id', async () => {
    const { deletePersona } = await import('../../services/personas')
    vi.mocked(deletePersona).mockResolvedValueOnce(undefined)
    vi.mocked((await import('../../services/personas')).listPersonas).mockResolvedValue([])

    const { result } = renderHook(() => useDeletePersona(), { wrapper: createWrapper() })

    await result.current.mutateAsync('1')

    expect(vi.mocked(deletePersona)).toHaveBeenCalledWith('1')
  })
})
