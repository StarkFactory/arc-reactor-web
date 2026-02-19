import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { useMcpServers, useRegisterMcpServer, useDeleteMcpServer } from '../useMcpServers'
import * as mcpService from '../../services/mcp'

vi.mock('../../services/mcp')

const mockServers = [
  {
    id: '1',
    name: 'test-server',
    description: null,
    transportType: 'SSE',
    autoConnect: true,
    status: 'CONNECTED',
    toolCount: 3,
    createdAt: 0,
    updatedAt: 0,
  },
]

function makeWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  )
}

describe('useMcpServers', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns servers list on success', async () => {
    vi.mocked(mcpService.listMcpServers).mockResolvedValue(mockServers)

    const { result } = renderHook(() => useMcpServers(), { wrapper: makeWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(mockServers)
  })

  it('returns error state on failure', async () => {
    vi.mocked(mcpService.listMcpServers).mockRejectedValue(new Error('network error'))

    const { result } = renderHook(() => useMcpServers(), { wrapper: makeWrapper() })

    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})

describe('useRegisterMcpServer', () => {
  beforeEach(() => vi.clearAllMocks())

  it('calls registerMcpServer and invalidates on success', async () => {
    vi.mocked(mcpService.listMcpServers).mockResolvedValue([])
    vi.mocked(mcpService.registerMcpServer).mockResolvedValue(mockServers[0])

    const { result } = renderHook(() => useRegisterMcpServer(), { wrapper: makeWrapper() })

    await result.current.mutateAsync({
      name: 'new-server',
      transportType: 'SSE',
      config: { url: 'http://localhost:8080' },
    })

    expect(mcpService.registerMcpServer).toHaveBeenCalledWith({
      name: 'new-server',
      transportType: 'SSE',
      config: { url: 'http://localhost:8080' },
    })
  })
})

describe('useDeleteMcpServer', () => {
  beforeEach(() => vi.clearAllMocks())

  it('calls deleteMcpServer on mutate', async () => {
    vi.mocked(mcpService.listMcpServers).mockResolvedValue([])
    vi.mocked(mcpService.deleteMcpServer).mockResolvedValue(undefined)

    const { result } = renderHook(() => useDeleteMcpServer(), { wrapper: makeWrapper() })

    await result.current.mutateAsync('test-server')

    expect(mcpService.deleteMcpServer).toHaveBeenCalledWith('test-server')
  })
})
