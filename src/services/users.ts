import type {
  AdminUserListResponse,
  AdminUserListParams,
  AdminUserResponse,
  UpdateUserRoleRequest,
  UpdateUserStatusRequest,
  ResetPasswordResponse,
} from '../types/api'
import { api } from '../lib/http'

export function fetchUsers(params: AdminUserListParams = {}): Promise<AdminUserListResponse> {
  const searchParams: Record<string, string> = {}
  if (params.page !== undefined) searchParams['page'] = String(params.page)
  if (params.size !== undefined) searchParams['size'] = String(params.size)
  if (params.search) searchParams['search'] = params.search
  if (params.role) searchParams['role'] = params.role
  if (params.status) searchParams['status'] = params.status
  return api.get('admin/users', { searchParams }).json()
}

export function updateUserRole(id: string, req: UpdateUserRoleRequest): Promise<AdminUserResponse> {
  return api.put(`admin/users/${id}/role`, { json: req }).json()
}

export function updateUserStatus(id: string, req: UpdateUserStatusRequest): Promise<AdminUserResponse> {
  return api.put(`admin/users/${id}/status`, { json: req }).json()
}

export function resetUserPassword(id: string): Promise<ResetPasswordResponse> {
  return api.post(`admin/users/${id}/reset-password`, { json: {} }).json()
}
