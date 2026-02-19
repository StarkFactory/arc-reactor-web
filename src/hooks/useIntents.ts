import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '../lib/queryKeys'
import { listIntents, createIntent, updateIntent, deleteIntent } from '../services/intents'
import type { CreateIntentRequest, UpdateIntentRequest } from '../types/api'

export function useIntents() {
  return useQuery({
    queryKey: queryKeys.intents.list(),
    queryFn: listIntents,
  })
}

export function useCreateIntent() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateIntentRequest) => createIntent(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.intents.all() })
    },
  })
}

export function useUpdateIntent() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ name, data }: { name: string; data: UpdateIntentRequest }) => updateIntent(name, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.intents.all() })
    },
  })
}

export function useDeleteIntent() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (name: string) => deleteIntent(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.intents.all() })
    },
  })
}
