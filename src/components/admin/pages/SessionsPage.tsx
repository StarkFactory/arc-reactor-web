import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  useSessions,
  useSessionDetail,
  useDeleteSession,
  useExportSession,
} from '../../../hooks/useSessions'
import type { SessionResponse } from '../../../types/api'
import './SessionsPage.css'

export function SessionsPage() {
  const { t } = useTranslation()
  const [searchParams, setSearchParams] = useSearchParams()

  const page = Number(searchParams.get('page') ?? '0')
  const search = searchParams.get('search') ?? ''
  const userId = searchParams.get('userId') ?? ''

  const [searchInput, setSearchInput] = useState(search)

  const { data, isLoading, isError, refetch } = useSessions({ page, size: 20, search, userId })
  const deleteSession = useDeleteSession()
  const exportSession = useExportSession()

  const [selectedId, setSelectedId] = useState<string>('')
  const { data: detail, isLoading: detailLoading } = useSessionDetail(selectedId)

  const [confirmDelete, setConfirmDelete] = useState<SessionResponse | null>(null)
  const [actionError, setActionError] = useState('')

  function applyFilters() {
    const p = new URLSearchParams()
    if (searchInput) p.set('search', searchInput)
    if (userId) p.set('userId', userId)
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

  async function handleDelete() {
    if (!confirmDelete) return
    setActionError('')
    try {
      await deleteSession.mutateAsync(confirmDelete.id)
      if (selectedId === confirmDelete.id) setSelectedId('')
      setConfirmDelete(null)
    } catch {
      setActionError(t('admin.sessions.deleteError'))
    }
  }

  async function handleExport(id: string, format: 'json' | 'markdown') {
    setActionError('')
    try {
      const content = await exportSession.mutateAsync({ id, format })
      const mime = format === 'json' ? 'application/json' : 'text/markdown'
      const ext = format === 'json' ? 'json' : 'md'
      const blob = new Blob([content], { type: mime })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `session-${id}-${new Date().toISOString().slice(0, 10)}.${ext}`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      setActionError(t('admin.sessions.exportError'))
    }
  }

  return (
    <div className="SessionsPage">
      <div className="SessionsPage-header">
        <div>
          <h1 className="SessionsPage-title">{t('admin.sessions.title')}</h1>
          <p className="SessionsPage-description">{t('admin.sessions.description')}</p>
        </div>
      </div>

      {actionError && <div className="SessionsPage-error">{actionError}</div>}

      <div className="SessionsPage-body">
        {/* List panel */}
        <div className="SessionsPage-listPanel">
          <div className="SessionsPage-filters">
            <input
              className="SessionsPage-searchInput"
              placeholder={t('admin.sessions.searchPlaceholder')}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
            />
            <button className="SessionsPage-btn" onClick={applyFilters}>
              {t('admin.sessions.apply')}
            </button>
            <button className="SessionsPage-btnSecondary" onClick={resetFilters}>
              {t('admin.sessions.reset')}
            </button>
          </div>

          {isLoading && <div className="SessionsPage-state">{t('admin.sessions.loading')}</div>}
          {isError && (
            <div className="SessionsPage-error">
              {t('admin.sessions.loadError')}
              <button className="SessionsPage-btnSecondary" onClick={() => refetch()}>
                {t('admin.sessions.retry')}
              </button>
            </div>
          )}

          {!isLoading && !isError && data && (
            <>
              <div className="SessionsPage-list">
                {data.content.length === 0 ? (
                  <div className="SessionsPage-state">{t('admin.sessions.empty')}</div>
                ) : (
                  data.content.map((s) => (
                    <div
                      key={s.id}
                      className={`SessionsPage-listItem${selectedId === s.id ? ' SessionsPage-listItem--active' : ''}`}
                      onClick={() => setSelectedId(s.id)}
                    >
                      <div className="SessionsPage-listItemTitle">
                        {s.title ?? t('admin.sessions.untitled')}
                      </div>
                      <div className="SessionsPage-listItemMeta">
                        <span>{s.userEmail ?? s.userId}</span>
                        <span>{t('admin.sessions.messageCount', { count: s.messageCount })}</span>
                        <span>{new Date(s.updatedAt).toLocaleDateString()}</span>
                      </div>
                      {s.lastMessage && (
                        <div className="SessionsPage-listItemLast">{s.lastMessage}</div>
                      )}
                      <div className="SessionsPage-listItemActions" onClick={(e) => e.stopPropagation()}>
                        <button
                          className="SessionsPage-iconBtn"
                          onClick={() => handleExport(s.id, 'json')}
                        >
                          JSON
                        </button>
                        <button
                          className="SessionsPage-iconBtn"
                          onClick={() => handleExport(s.id, 'markdown')}
                        >
                          MD
                        </button>
                        <button
                          className="SessionsPage-iconBtnDanger"
                          onClick={() => setConfirmDelete(s)}
                        >
                          {t('admin.sessions.delete')}
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="SessionsPage-pagination">
                <button
                  className="SessionsPage-btnSecondary"
                  disabled={page === 0}
                  onClick={() => setPage(page - 1)}
                >
                  {t('admin.sessions.prevPage')}
                </button>
                <span className="SessionsPage-pageInfo">
                  {t('admin.sessions.pageInfo', { page: page + 1, total: data.totalPages || 1 })}
                </span>
                <button
                  className="SessionsPage-btnSecondary"
                  disabled={page + 1 >= (data.totalPages || 1)}
                  onClick={() => setPage(page + 1)}
                >
                  {t('admin.sessions.nextPage')}
                </button>
              </div>
            </>
          )}
        </div>

        {/* Detail panel */}
        <div className="SessionsPage-detailPanel">
          {!selectedId ? (
            <div className="SessionsPage-state">{t('admin.sessions.selectHint')}</div>
          ) : detailLoading ? (
            <div className="SessionsPage-state">{t('admin.sessions.loadingDetail')}</div>
          ) : detail ? (
            <div className="SessionsPage-detail">
              <div className="SessionsPage-detailHeader">
                <span className="SessionsPage-detailTitle">
                  {detail.title ?? t('admin.sessions.untitled')}
                </span>
                <span className="SessionsPage-detailUser">{detail.userEmail ?? detail.userId}</span>
              </div>
              <div className="SessionsPage-messages">
                {detail.messages.map((msg, i) => (
                  <div
                    key={i}
                    className={`SessionsPage-message SessionsPage-message--${msg.role}`}
                  >
                    <div className="SessionsPage-messageRole">{msg.role}</div>
                    <div className="SessionsPage-messageContent">{msg.content}</div>
                    <div className="SessionsPage-messageTime">
                      {new Date(msg.createdAt).toLocaleTimeString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* Delete confirmation */}
      {confirmDelete && (
        <div className="SessionsPage-overlay" onClick={() => setConfirmDelete(null)}>
          <div className="SessionsPage-dialog" onClick={(e) => e.stopPropagation()}>
            <p className="SessionsPage-dialogText">
              {t('admin.sessions.deleteConfirm', {
                title: confirmDelete.title ?? t('admin.sessions.untitled'),
              })}
            </p>
            <div className="SessionsPage-dialogActions">
              <button
                className="SessionsPage-btnDanger"
                onClick={handleDelete}
                disabled={deleteSession.isPending}
              >
                {t('admin.sessions.delete')}
              </button>
              <button
                className="SessionsPage-btnSecondary"
                onClick={() => setConfirmDelete(null)}
              >
                {t('admin.sessions.cancel')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
