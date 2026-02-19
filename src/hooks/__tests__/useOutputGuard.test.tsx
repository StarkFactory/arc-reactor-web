import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import {
  useOutputGuardRules,
  useCreateOutputGuardRule,
  useDeleteOutputGuardRule,
} from '../useOutputGuard'
import * as outputGuardService from '../../services/output-guard'

vi.mock('../../services/output-guard')

const mockRule = {
  id: 'rule-1',
  name: 'test-rule',
  pattern: 'secret\\d+',
  action: 'MASK',
  priority: 100,
  enabled: true,
  createdAt: 0,
  updatedAt: 0,
}

function makeWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  )
}

describe('useOutputGuardRules', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns rules on success', async () => {
    vi.mocked(outputGuardService.listOutputGuardRules).mockResolvedValue([mockRule])

    const { result } = renderHook(() => useOutputGuardRules(), { wrapper: makeWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual([mockRule])
  })

  it('returns error on failure', async () => {
    vi.mocked(outputGuardService.listOutputGuardRules).mockRejectedValue(new Error('fail'))

    const { result } = renderHook(() => useOutputGuardRules(), { wrapper: makeWrapper() })

    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})

describe('useCreateOutputGuardRule', () => {
  beforeEach(() => vi.clearAllMocks())

  it('calls createOutputGuardRule on mutate', async () => {
    vi.mocked(outputGuardService.listOutputGuardRules).mockResolvedValue([])
    vi.mocked(outputGuardService.createOutputGuardRule).mockResolvedValue(mockRule)

    const { result } = renderHook(() => useCreateOutputGuardRule(), { wrapper: makeWrapper() })

    await result.current.mutateAsync({ name: 'test-rule', pattern: 'secret\\d+', action: 'MASK', priority: 100, enabled: true })

    expect(outputGuardService.createOutputGuardRule).toHaveBeenCalledWith({
      name: 'test-rule',
      pattern: 'secret\\d+',
      action: 'MASK',
      priority: 100,
      enabled: true,
    })
  })
})

describe('useDeleteOutputGuardRule', () => {
  beforeEach(() => vi.clearAllMocks())

  it('calls deleteOutputGuardRule on mutate', async () => {
    vi.mocked(outputGuardService.listOutputGuardRules).mockResolvedValue([])
    vi.mocked(outputGuardService.deleteOutputGuardRule).mockResolvedValue(undefined)

    const { result } = renderHook(() => useDeleteOutputGuardRule(), { wrapper: makeWrapper() })

    await result.current.mutateAsync('rule-1')

    expect(outputGuardService.deleteOutputGuardRule).toHaveBeenCalledWith('rule-1')
  })
})
