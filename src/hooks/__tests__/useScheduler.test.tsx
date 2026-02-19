import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { useScheduledJobs, useCreateScheduledJob, useDeleteScheduledJob } from '../useScheduler'
import * as schedulerService from '../../services/scheduler'

vi.mock('../../services/scheduler')

const mockJob = {
  id: 'job-1',
  name: 'test-job',
  description: null,
  cronExpression: '0 0 * * *',
  timezone: 'Asia/Seoul',
  mcpServerName: 'test-server',
  toolName: 'test-tool',
  toolArguments: {},
  slackChannelId: null,
  enabled: true,
  lastRunAt: null,
  lastStatus: null,
  lastResult: null,
  createdAt: 0,
  updatedAt: 0,
}

function makeWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  )
}

describe('useScheduledJobs', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns jobs on success', async () => {
    vi.mocked(schedulerService.listScheduledJobs).mockResolvedValue([mockJob])

    const { result } = renderHook(() => useScheduledJobs(), { wrapper: makeWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual([mockJob])
  })

  it('returns error on failure', async () => {
    vi.mocked(schedulerService.listScheduledJobs).mockRejectedValue(new Error('fail'))

    const { result } = renderHook(() => useScheduledJobs(), { wrapper: makeWrapper() })

    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})

describe('useCreateScheduledJob', () => {
  beforeEach(() => vi.clearAllMocks())

  it('calls createScheduledJob on mutate', async () => {
    vi.mocked(schedulerService.listScheduledJobs).mockResolvedValue([])
    vi.mocked(schedulerService.createScheduledJob).mockResolvedValue(mockJob)

    const { result } = renderHook(() => useCreateScheduledJob(), { wrapper: makeWrapper() })

    await result.current.mutateAsync({
      name: 'test-job',
      cronExpression: '0 0 * * *',
      mcpServerName: 'test-server',
      toolName: 'test-tool',
    })

    expect(schedulerService.createScheduledJob).toHaveBeenCalledWith({
      name: 'test-job',
      cronExpression: '0 0 * * *',
      mcpServerName: 'test-server',
      toolName: 'test-tool',
    })
  })
})

describe('useDeleteScheduledJob', () => {
  beforeEach(() => vi.clearAllMocks())

  it('calls deleteScheduledJob on mutate', async () => {
    vi.mocked(schedulerService.listScheduledJobs).mockResolvedValue([])
    vi.mocked(schedulerService.deleteScheduledJob).mockResolvedValue(undefined)

    const { result } = renderHook(() => useDeleteScheduledJob(), { wrapper: makeWrapper() })

    await result.current.mutateAsync('job-1')

    expect(schedulerService.deleteScheduledJob).toHaveBeenCalledWith('job-1')
  })
})
