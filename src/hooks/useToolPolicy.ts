import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getToolPolicy, updateToolPolicy, deleteToolPolicy } from '../services/tool-policy'
import { queryKeys } from '../lib/queryKeys'
import type { UpdateToolPolicyRequest } from '../types/api'

export function useToolPolicyState() {
  return useQuery({
    queryKey: queryKeys.toolPolicy.state(),
    queryFn: getToolPolicy,
  })
}

export function useUpdateToolPolicy() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: UpdateToolPolicyRequest) => updateToolPolicy(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.toolPolicy.all() }),
  })
}

export function useDeleteToolPolicy() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => deleteToolPolicy(),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.toolPolicy.all() }),
  })
}
