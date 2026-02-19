import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  listScheduledJobs,
  createScheduledJob,
  updateScheduledJob,
  deleteScheduledJob,
  triggerScheduledJob,
} from '../services/scheduler'
import { queryKeys } from '../lib/queryKeys'
import type { CreateScheduledJobRequest, UpdateScheduledJobRequest } from '../types/api'

export function useScheduledJobs() {
  return useQuery({
    queryKey: queryKeys.scheduler.list(),
    queryFn: listScheduledJobs,
  })
}

export function useCreateScheduledJob() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateScheduledJobRequest) => createScheduledJob(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.scheduler.all() }),
  })
}

export function useUpdateScheduledJob() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateScheduledJobRequest }) =>
      updateScheduledJob(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.scheduler.all() }),
  })
}

export function useDeleteScheduledJob() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteScheduledJob(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.scheduler.all() }),
  })
}

export function useTriggerScheduledJob() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => triggerScheduledJob(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.scheduler.all() }),
  })
}
