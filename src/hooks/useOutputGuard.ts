import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  listOutputGuardRules,
  listOutputGuardAudits,
  createOutputGuardRule,
  updateOutputGuardRule,
  deleteOutputGuardRule,
  simulateOutputGuard,
} from '../services/output-guard'
import { queryKeys } from '../lib/queryKeys'
import type {
  CreateOutputGuardRuleRequest,
  UpdateOutputGuardRuleRequest,
  OutputGuardSimulationRequest,
} from '../types/api'

export function useOutputGuardRules() {
  return useQuery({
    queryKey: queryKeys.outputGuard.list(),
    queryFn: listOutputGuardRules,
  })
}

export function useOutputGuardAudits(limit = 50) {
  return useQuery({
    queryKey: queryKeys.outputGuard.audits(),
    queryFn: () => listOutputGuardAudits(limit),
  })
}

export function useCreateOutputGuardRule() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateOutputGuardRuleRequest) => createOutputGuardRule(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.outputGuard.all() }),
  })
}

export function useUpdateOutputGuardRule() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateOutputGuardRuleRequest }) =>
      updateOutputGuardRule(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.outputGuard.all() }),
  })
}

export function useDeleteOutputGuardRule() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteOutputGuardRule(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.outputGuard.all() }),
  })
}

export function useSimulateOutputGuard() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: OutputGuardSimulationRequest) => simulateOutputGuard(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.outputGuard.audits() }),
  })
}
