import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { type ReactNode } from 'react'
import { useTemplates, useTemplate } from '../usePromptTemplates'

vi.mock('../../lib/http', () => ({
  api: {
    get: vi.fn().mockReturnValue({ json: vi.fn() }),
    post: vi.fn().mockReturnValue({ json: vi.fn() }),
    put: vi.fn().mockReturnValue({ json: vi.fn() }),
    delete: vi.fn().mockReturnValue(Promise.resolve()),
  },
}))

vi.mock('../../services/prompts', () => ({
  listTemplates: vi.fn(),
  getTemplate: vi.fn(),
  createTemplate: vi.fn(),
  updateTemplate: vi.fn(),
  deleteTemplate: vi.fn(),
  createVersion: vi.fn(),
  activateVersion: vi.fn(),
  archiveVersion: vi.fn(),
}))

import { listTemplates, getTemplate } from '../../services/prompts'

const mockTemplates = [
  { id: 't1', name: 'Support', description: 'Customer support', createdAt: Date.now(), updatedAt: Date.now() },
  { id: 't2', name: 'Analysis', description: 'Data analysis', createdAt: Date.now(), updatedAt: Date.now() },
]

const mockDetail = {
  id: 't1',
  name: 'Support',
  description: 'Customer support',
  activeVersion: { id: 'v1', templateId: 't1', version: 1, content: 'Hello', status: 'ACTIVE' as const, changeLog: '', createdAt: Date.now() },
  versions: [],
  createdAt: Date.now(),
  updatedAt: Date.now(),
}

function wrapper({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      {children}
    </QueryClientProvider>
  )
}

beforeEach(() => {
  vi.mocked(listTemplates).mockResolvedValue(mockTemplates)
  vi.mocked(getTemplate).mockResolvedValue(mockDetail)
})

describe('useTemplates', () => {
  it('fetches and returns template list', async () => {
    const { result } = renderHook(() => useTemplates(), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toHaveLength(2)
    expect(result.current.data?.[0].name).toBe('Support')
  })

  it('exposes isError on failure', async () => {
    vi.mocked(listTemplates).mockRejectedValue(new Error('server error'))
    const { result } = renderHook(() => useTemplates(), { wrapper })
    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})

describe('useTemplate', () => {
  it('fetches template detail when id is provided', async () => {
    const { result } = renderHook(() => useTemplate('t1'), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.activeVersion?.status).toBe('ACTIVE')
  })
})
