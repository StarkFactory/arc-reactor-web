import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '../lib/queryKeys'
import {
  fetchUsers,
  updateUserRole,
  updateUserStatus,
  resetUserPassword,
} from '../services/users'
import type { AdminUserListParams } from '../types/api'

export function useUsers(params: AdminUserListParams = {}) {
  return useQuery({
    queryKey: queryKeys.users.list(params as Record<string, unknown>),
    queryFn: () => fetchUsers(params),
    placeholderData: (prev) => prev,
  })
}

export function useUpdateUserRole() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, role }: { id: string; role: 'USER' | 'ADMIN' }) =>
      updateUserRole(id, { role }),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.users.all() }),
  })
}

export function useUpdateUserStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      updateUserStatus(id, { active }),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.users.all() }),
  })
}

export function useResetUserPassword() {
  return useMutation({
    mutationFn: (id: string) => resetUserPassword(id),
  })
}
