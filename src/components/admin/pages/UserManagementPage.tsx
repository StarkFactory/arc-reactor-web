import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  useUsers,
  useUpdateUserRole,
  useUpdateUserStatus,
  useResetUserPassword,
} from '../../../hooks/useUsers'
import type { AdminUserResponse, UserRole } from '../../../types/api'
import './UserManagementPage.css'

export function UserManagementPage() {
  const { t } = useTranslation()
  const [searchParams, setSearchParams] = useSearchParams()

  const page = Number(searchParams.get('page') ?? '0')
  const search = searchParams.get('search') ?? ''
  const role = searchParams.get('role') ?? ''
  const status = searchParams.get('status') ?? ''

  const [searchInput, setSearchInput] = useState(search)

  const { data, isLoading, isError, refetch } = useUsers({ page, size: 20, search, role, status })
  const updateRole = useUpdateUserRole()
  const updateStatus = useUpdateUserStatus()
  const resetPassword = useResetUserPassword()

  const [confirmAction, setConfirmAction] = useState<{
    type: 'role' | 'status' | 'reset'
    user: AdminUserResponse
    newRole?: UserRole
    newActive?: boolean
  } | null>(null)

  const [resetResult, setResetResult] = useState<{ userId: string; password: string } | null>(null)

  function applyFilters() {
    const p = new URLSearchParams()
    if (searchInput) p.set('search', searchInput)
    if (role) p.set('role', role)
    if (status) p.set('status', status)
    p.set('page', '0')
    setSearchParams(p)
  }

  function resetFilters() {
    setSearchInput('')
    setSearchParams({})
  }

  function setPage(p: number) {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.set('page', String(p))
      return next
    })
  }

  async function handleConfirm() {
    if (!confirmAction) return
    const { type, user, newRole, newActive } = confirmAction
    try {
      if (type === 'role' && newRole) {
        await updateRole.mutateAsync({ id: user.id, role: newRole })
      } else if (type === 'status' && newActive !== undefined) {
        await updateStatus.mutateAsync({ id: user.id, active: newActive })
      } else if (type === 'reset') {
        const res = await resetPassword.mutateAsync(user.id)
        setResetResult({ userId: user.id, password: res.temporaryPassword })
      }
    } finally {
      setConfirmAction(null)
    }
  }

  return (
    <div className="UserManagementPage">
      <div className="UserManagementPage-header">
        <div>
          <h1 className="UserManagementPage-title">{t('admin.users.title')}</h1>
          <p className="UserManagementPage-description">{t('admin.users.description')}</p>
        </div>
      </div>

      <div className="UserManagementPage-filters">
        <input
          className="UserManagementPage-searchInput"
          placeholder={t('admin.users.searchPlaceholder')}
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
        />
        <select
          className="UserManagementPage-select"
          value={role}
          onChange={(e) =>
            setSearchParams((prev) => {
              const next = new URLSearchParams(prev)
              if (e.target.value) next.set('role', e.target.value)
              else next.delete('role')
              next.set('page', '0')
              return next
            })
          }
        >
          <option value="">{t('admin.users.allRoles')}</option>
          <option value="ADMIN">{t('admin.users.roleAdmin')}</option>
          <option value="USER">{t('admin.users.roleUser')}</option>
        </select>
        <select
          className="UserManagementPage-select"
          value={status}
          onChange={(e) =>
            setSearchParams((prev) => {
              const next = new URLSearchParams(prev)
              if (e.target.value) next.set('status', e.target.value)
              else next.delete('status')
              next.set('page', '0')
              return next
            })
          }
        >
          <option value="">{t('admin.users.allStatuses')}</option>
          <option value="active">{t('admin.users.statusActive')}</option>
          <option value="inactive">{t('admin.users.statusInactive')}</option>
        </select>
        <button className="UserManagementPage-btn" onClick={applyFilters}>
          {t('admin.users.apply')}
        </button>
        <button className="UserManagementPage-btnSecondary" onClick={resetFilters}>
          {t('admin.users.reset')}
        </button>
      </div>

      {isLoading && <div className="UserManagementPage-state">{t('admin.users.loading')}</div>}
      {isError && (
        <div className="UserManagementPage-error">
          {t('admin.users.loadError')}
          <button className="UserManagementPage-btnSecondary" onClick={() => refetch()}>
            {t('admin.users.retry')}
          </button>
        </div>
      )}

      {!isLoading && !isError && data && (
        <>
          <div className="UserManagementPage-tableWrap">
            <table className="UserManagementPage-table">
              <thead>
                <tr>
                  <th>{t('admin.users.colEmail')}</th>
                  <th>{t('admin.users.colName')}</th>
                  <th>{t('admin.users.colRole')}</th>
                  <th>{t('admin.users.colStatus')}</th>
                  <th>{t('admin.users.colCreated')}</th>
                  <th>{t('admin.users.colActions')}</th>
                </tr>
              </thead>
              <tbody>
                {data.content.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="UserManagementPage-empty">
                      {t('admin.users.empty')}
                    </td>
                  </tr>
                ) : (
                  data.content.map((user) => (
                    <tr key={user.id}>
                      <td>{user.email}</td>
                      <td>{user.name}</td>
                      <td>
                        <span className={`UserManagementPage-badge UserManagementPage-badge--${user.role.toLowerCase()}`}>
                          {user.role}
                        </span>
                      </td>
                      <td>
                        <span className={`UserManagementPage-badge UserManagementPage-badge--${user.active ? 'active' : 'inactive'}`}>
                          {user.active ? t('admin.users.statusActive') : t('admin.users.statusInactive')}
                        </span>
                      </td>
                      <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                      <td className="UserManagementPage-actions">
                        <button
                          className="UserManagementPage-actionBtn"
                          onClick={() =>
                            setConfirmAction({
                              type: 'role',
                              user,
                              newRole: user.role === 'ADMIN' ? 'USER' : 'ADMIN',
                            })
                          }
                        >
                          {user.role === 'ADMIN'
                            ? t('admin.users.demote')
                            : t('admin.users.promote')}
                        </button>
                        <button
                          className="UserManagementPage-actionBtn"
                          onClick={() =>
                            setConfirmAction({
                              type: 'status',
                              user,
                              newActive: !user.active,
                            })
                          }
                        >
                          {user.active ? t('admin.users.deactivate') : t('admin.users.activate')}
                        </button>
                        <button
                          className="UserManagementPage-actionBtnDanger"
                          onClick={() => setConfirmAction({ type: 'reset', user })}
                        >
                          {t('admin.users.resetPassword')}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="UserManagementPage-pagination">
            <button
              className="UserManagementPage-btnSecondary"
              disabled={page === 0}
              onClick={() => setPage(page - 1)}
            >
              {t('admin.users.prevPage')}
            </button>
            <span className="UserManagementPage-pageInfo">
              {t('admin.users.pageInfo', {
                page: page + 1,
                total: data.totalPages || 1,
              })}
            </span>
            <button
              className="UserManagementPage-btnSecondary"
              disabled={page + 1 >= (data.totalPages || 1)}
              onClick={() => setPage(page + 1)}
            >
              {t('admin.users.nextPage')}
            </button>
          </div>
        </>
      )}

      {confirmAction && (
        <div className="UserManagementPage-overlay" onClick={() => setConfirmAction(null)}>
          <div className="UserManagementPage-dialog" onClick={(e) => e.stopPropagation()}>
            <p className="UserManagementPage-dialogText">
              {confirmAction.type === 'role' &&
                t('admin.users.confirmRole', {
                  email: confirmAction.user.email,
                  role: confirmAction.newRole,
                })}
              {confirmAction.type === 'status' &&
                t('admin.users.confirmStatus', {
                  email: confirmAction.user.email,
                  status: confirmAction.newActive
                    ? t('admin.users.statusActive')
                    : t('admin.users.statusInactive'),
                })}
              {confirmAction.type === 'reset' &&
                t('admin.users.confirmReset', { email: confirmAction.user.email })}
            </p>
            <div className="UserManagementPage-dialogActions">
              <button
                className="UserManagementPage-btn"
                onClick={handleConfirm}
                disabled={
                  updateRole.isPending || updateStatus.isPending || resetPassword.isPending
                }
              >
                {t('admin.users.confirm')}
              </button>
              <button
                className="UserManagementPage-btnSecondary"
                onClick={() => setConfirmAction(null)}
              >
                {t('admin.users.cancel')}
              </button>
            </div>
          </div>
        </div>
      )}

      {resetResult && (
        <div className="UserManagementPage-overlay" onClick={() => setResetResult(null)}>
          <div className="UserManagementPage-dialog" onClick={(e) => e.stopPropagation()}>
            <p className="UserManagementPage-dialogText">
              {t('admin.users.resetResult', { password: resetResult.password })}
            </p>
            <div className="UserManagementPage-dialogActions">
              <button className="UserManagementPage-btn" onClick={() => setResetResult(null)}>
                {t('admin.users.close')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
