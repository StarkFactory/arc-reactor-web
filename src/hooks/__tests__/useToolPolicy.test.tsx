import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { useToolPolicyState, useUpdateToolPolicy } from '../useToolPolicy'
import * as toolPolicyService from '../../services/tool-policy'

vi.mock('../../services/tool-policy')

const mockPolicy = {
  enabled: true,
  writeToolNames: ['jira_create_issue'],
  denyWriteChannels: ['slack'],
  allowWriteToolNamesInDenyChannels: [],
  allowWriteToolNamesByChannel: {},
  denyWriteMessage: 'Not allowed',
  createdAt: 0,
  updatedAt: 0,
}

const mockState = {
  configEnabled: true,
  dynamicEnabled: true,
  effective: mockPolicy,
  stored: null,
}

function makeWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  )
}

describe('useToolPolicyState', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns policy state on success', async () => {
    vi.mocked(toolPolicyService.getToolPolicy).mockResolvedValue(mockState)

    const { result } = renderHook(() => useToolPolicyState(), { wrapper: makeWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(mockState)
  })

  it('returns error on failure', async () => {
    vi.mocked(toolPolicyService.getToolPolicy).mockRejectedValue(new Error('fail'))

    const { result } = renderHook(() => useToolPolicyState(), { wrapper: makeWrapper() })

    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})

describe('useUpdateToolPolicy', () => {
  beforeEach(() => vi.clearAllMocks())

  it('calls updateToolPolicy on mutate', async () => {
    vi.mocked(toolPolicyService.getToolPolicy).mockResolvedValue(mockState)
    vi.mocked(toolPolicyService.updateToolPolicy).mockResolvedValue(mockPolicy)

    const { result } = renderHook(() => useUpdateToolPolicy(), { wrapper: makeWrapper() })

    await result.current.mutateAsync({
      enabled: true,
      writeToolNames: ['jira_create_issue'],
      denyWriteChannels: ['slack'],
      allowWriteToolNamesInDenyChannels: [],
      allowWriteToolNamesByChannel: {},
      denyWriteMessage: 'Not allowed',
    })

    expect(toolPolicyService.updateToolPolicy).toHaveBeenCalled()
  })
})
