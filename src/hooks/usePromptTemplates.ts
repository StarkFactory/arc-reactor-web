import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '../lib/queryKeys'
import {
  listTemplates,
  getTemplate,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  createVersion,
  activateVersion,
  archiveVersion,
} from '../services/prompts'
import type { CreateTemplateRequest, UpdateTemplateRequest, CreateVersionRequest } from '../types/api'

export function useTemplates() {
  return useQuery({
    queryKey: queryKeys.promptTemplates.list(),
    queryFn: listTemplates,
  })
}

export function useTemplate(id: string) {
  return useQuery({
    queryKey: queryKeys.promptTemplates.detail(id),
    queryFn: () => getTemplate(id),
    enabled: !!id,
  })
}

export function useCreateTemplate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (req: CreateTemplateRequest) => createTemplate(req),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.promptTemplates.all() }),
  })
}

export function useUpdateTemplate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, req }: { id: string; req: UpdateTemplateRequest }) =>
      updateTemplate(id, req),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: queryKeys.promptTemplates.all() })
      qc.invalidateQueries({ queryKey: queryKeys.promptTemplates.detail(id) })
    },
  })
}

export function useDeleteTemplate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteTemplate(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.promptTemplates.all() }),
  })
}

export function useCreateVersion() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ templateId, req }: { templateId: string; req: CreateVersionRequest }) =>
      createVersion(templateId, req),
    onSuccess: (_, { templateId }) => {
      qc.invalidateQueries({ queryKey: queryKeys.promptTemplates.detail(templateId) })
    },
  })
}

export function useActivateVersion() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ templateId, versionId }: { templateId: string; versionId: string }) =>
      activateVersion(templateId, versionId),
    onSuccess: (_, { templateId }) => {
      qc.invalidateQueries({ queryKey: queryKeys.promptTemplates.detail(templateId) })
      qc.invalidateQueries({ queryKey: queryKeys.prompts.all() })
    },
  })
}

export function useArchiveVersion() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ templateId, versionId }: { templateId: string; versionId: string }) =>
      archiveVersion(templateId, versionId),
    onSuccess: (_, { templateId }) => {
      qc.invalidateQueries({ queryKey: queryKeys.promptTemplates.detail(templateId) })
    },
  })
}
