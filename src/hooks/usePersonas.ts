import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '../lib/queryKeys'
import { listPersonas, createPersona, updatePersona, deletePersona } from '../services/personas'
import type { CreatePersonaRequest, UpdatePersonaRequest } from '../types/api'

export function usePersonas() {
  return useQuery({
    queryKey: queryKeys.personas.list(),
    queryFn: listPersonas,
  })
}

export function useCreatePersona() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreatePersonaRequest) => createPersona(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.personas.all() })
    },
  })
}

export function useUpdatePersona() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePersonaRequest }) => updatePersona(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.personas.all() })
    },
  })
}

export function useDeletePersona() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deletePersona(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.personas.all() })
    },
  })
}
