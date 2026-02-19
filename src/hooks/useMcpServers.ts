import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  listMcpServers,
  getMcpServer,
  registerMcpServer,
  deleteMcpServer,
  connectMcpServer,
  disconnectMcpServer,
} from '../services/mcp'
import {
  getMcpAccessPolicy,
  updateMcpAccessPolicy,
  clearMcpAccessPolicy,
} from '../services/mcp-access-policy'
import { queryKeys } from '../lib/queryKeys'
import type { RegisterMcpServerRequest, UpdateMcpAccessPolicyRequest } from '../types/api'

export function useMcpServers() {
  return useQuery({
    queryKey: queryKeys.mcpServers.list(),
    queryFn: listMcpServers,
  })
}

export function useMcpServerDetail(name: string | null) {
  return useQuery({
    queryKey: queryKeys.mcpServers.detail(name ?? ''),
    queryFn: () => getMcpServer(name!),
    enabled: name !== null,
  })
}

export function useMcpAccessPolicy(name: string | null) {
  return useQuery({
    queryKey: queryKeys.mcpServers.accessPolicy(name ?? ''),
    queryFn: () => getMcpAccessPolicy(name!),
    enabled: name !== null,
  })
}

export function useRegisterMcpServer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: RegisterMcpServerRequest) => registerMcpServer(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.mcpServers.all() }),
  })
}

export function useDeleteMcpServer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (name: string) => deleteMcpServer(name),
    onSuccess: (_data, name) => {
      qc.invalidateQueries({ queryKey: queryKeys.mcpServers.all() })
      qc.removeQueries({ queryKey: queryKeys.mcpServers.detail(name) })
    },
  })
}

export function useConnectMcpServer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (name: string) => connectMcpServer(name),
    onSuccess: (_data, name) => {
      qc.invalidateQueries({ queryKey: queryKeys.mcpServers.list() })
      qc.invalidateQueries({ queryKey: queryKeys.mcpServers.detail(name) })
    },
  })
}

export function useDisconnectMcpServer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (name: string) => disconnectMcpServer(name),
    onSuccess: (_data, name) => {
      qc.invalidateQueries({ queryKey: queryKeys.mcpServers.list() })
      qc.invalidateQueries({ queryKey: queryKeys.mcpServers.detail(name) })
    },
  })
}

export function useUpdateMcpAccessPolicy() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ name, data }: { name: string; data: UpdateMcpAccessPolicyRequest }) =>
      updateMcpAccessPolicy(name, data),
    onSuccess: (_data, { name }) =>
      qc.invalidateQueries({ queryKey: queryKeys.mcpServers.accessPolicy(name) }),
  })
}

export function useClearMcpAccessPolicy() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (name: string) => clearMcpAccessPolicy(name),
    onSuccess: (_data, name) =>
      qc.invalidateQueries({ queryKey: queryKeys.mcpServers.accessPolicy(name) }),
  })
}
