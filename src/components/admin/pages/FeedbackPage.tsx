import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useFeedback, useDeleteFeedback } from '../../../hooks/useFeedback'
import type { FeedbackResponse } from '../../../types/api'
import './FeedbackPage.css'

export function FeedbackPage() {
  const { t } = useTranslation()
  const [searchParams, setSearchParams] = useSearchParams()

  const page = Number(searchParams.get('page') ?? '0')
  const rating = (searchParams.get('rating') ?? '') as '' | 'POSITIVE' | 'NEGATIVE'
  const intentName = searchParams.get('intentName') ?? ''
  const from = searchParams.get('from') ?? ''
  const to = searchParams.get('to') ?? ''

  const { data, isLoading, isError, refetch } = useFeedback({
    page,
    size: 20,
    rating: rating || undefined,
    intentName: intentName || undefined,
    from: from || undefined,
    to: to || undefined,
  })

  const deleteFeedback = useDeleteFeedback()

  const [expanded, setExpanded] = useState<FeedbackResponse | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [actionError, setActionError] = useState('')

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
      await deleteFeedback.mutateAsync(confirmDelete)
      setConfirmDelete(null)
    } catch {
      setActionError(t('admin.feedback.deleteError'))
    }
  }

  function exportJson() {
    if (!data) return
    const blob = new Blob([JSON.stringify(data.content, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `feedback-export-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Summary stats
  const totalItems = data?.totalElements ?? 0
  const positive = data?.content.filter((f) => f.rating === 'POSITIVE').length ?? 0
  const negative = data?.content.filter((f) => f.rating === 'NEGATIVE').length ?? 0

  return (
    <div className="FeedbackPage">
      <div className="FeedbackPage-header">
        <div>
          <h1 className="FeedbackPage-title">{t('admin.feedback.title')}</h1>
          <p className="FeedbackPage-description">{t('admin.feedback.description')}</p>
        </div>
        <button className="FeedbackPage-btnSecondary" onClick={exportJson} disabled={!data}>
          {t('admin.feedback.exportJson')}
        </button>
      </div>

      {actionError && <div className="FeedbackPage-error">{actionError}</div>}

      {/* Summary cards */}
      {data && (
        <div className="FeedbackPage-summary">
          <div className="FeedbackPage-card">
            <div className="FeedbackPage-cardLabel">{t('admin.feedback.total')}</div>
            <div className="FeedbackPage-cardValue">{totalItems.toLocaleString()}</div>
          </div>
          <div className="FeedbackPage-card FeedbackPage-card--positive">
            <div className="FeedbackPage-cardLabel">{t('admin.feedback.positive')}</div>
            <div className="FeedbackPage-cardValue">{positive}</div>
          </div>
          <div className="FeedbackPage-card FeedbackPage-card--negative">
            <div className="FeedbackPage-cardLabel">{t('admin.feedback.negative')}</div>
            <div className="FeedbackPage-cardValue">{negative}</div>
          </div>
          <div className="FeedbackPage-card">
            <div className="FeedbackPage-cardLabel">{t('admin.feedback.positiveRate')}</div>
            <div className="FeedbackPage-cardValue">
              {totalItems > 0 ? `${((positive / (positive + negative)) * 100).toFixed(1)}%` : '—'}
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="FeedbackPage-filters">
        <select
          className="FeedbackPage-select"
          value={rating}
          onChange={(e) =>
            setSearchParams((prev) => {
              const next = new URLSearchParams(prev)
              if (e.target.value) next.set('rating', e.target.value)
              else next.delete('rating')
              next.set('page', '0')
              return next
            })
          }
        >
          <option value="">{t('admin.feedback.allRatings')}</option>
          <option value="POSITIVE">{t('admin.feedback.positive')}</option>
          <option value="NEGATIVE">{t('admin.feedback.negative')}</option>
        </select>
        <input
          className="FeedbackPage-input"
          placeholder={t('admin.feedback.intentPlaceholder')}
          value={intentName}
          onChange={(e) =>
            setSearchParams((prev) => {
              const next = new URLSearchParams(prev)
              if (e.target.value) next.set('intentName', e.target.value)
              else next.delete('intentName')
              next.set('page', '0')
              return next
            })
          }
        />
        <input
          className="FeedbackPage-input"
          type="date"
          value={from}
          onChange={(e) =>
            setSearchParams((prev) => {
              const next = new URLSearchParams(prev)
              if (e.target.value) next.set('from', e.target.value)
              else next.delete('from')
              next.set('page', '0')
              return next
            })
          }
        />
        <span className="FeedbackPage-dateSep">~</span>
        <input
          className="FeedbackPage-input"
          type="date"
          value={to}
          onChange={(e) =>
            setSearchParams((prev) => {
              const next = new URLSearchParams(prev)
              if (e.target.value) next.set('to', e.target.value)
              else next.delete('to')
              next.set('page', '0')
              return next
            })
          }
        />
      </div>

      {isLoading && <div className="FeedbackPage-state">{t('admin.feedback.loading')}</div>}
      {isError && (
        <div className="FeedbackPage-error">
          {t('admin.feedback.loadError')}
          <button className="FeedbackPage-btnSecondary" onClick={() => refetch()}>
            {t('admin.feedback.retry')}
          </button>
        </div>
      )}

      {!isLoading && !isError && data && (
        <>
          <div className="FeedbackPage-tableWrap">
            <table className="FeedbackPage-table">
              <thead>
                <tr>
                  <th>{t('admin.feedback.colRating')}</th>
                  <th>{t('admin.feedback.colIntent')}</th>
                  <th>{t('admin.feedback.colModel')}</th>
                  <th>{t('admin.feedback.colDuration')}</th>
                  <th>{t('admin.feedback.colDate')}</th>
                  <th>{t('admin.feedback.colActions')}</th>
                </tr>
              </thead>
              <tbody>
                {data.content.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="FeedbackPage-empty">{t('admin.feedback.empty')}</td>
                  </tr>
                ) : (
                  data.content.map((fb) => (
                    <tr
                      key={fb.id}
                      className={`FeedbackPage-row FeedbackPage-row--${fb.rating.toLowerCase()}`}
                      onClick={() => setExpanded(expanded?.id === fb.id ? null : fb)}
                    >
                      <td>
                        <span className={`FeedbackPage-badge FeedbackPage-badge--${fb.rating.toLowerCase()}`}>
                          {fb.rating === 'POSITIVE' ? '👍' : '👎'} {fb.rating}
                        </span>
                      </td>
                      <td>{fb.intentName ?? '—'}</td>
                      <td>{fb.model ?? '—'}</td>
                      <td>{fb.durationMs != null ? `${fb.durationMs}ms` : '—'}</td>
                      <td>{new Date(fb.createdAt).toLocaleDateString()}</td>
                      <td onClick={(e) => e.stopPropagation()}>
                        <button
                          className="FeedbackPage-iconBtnDanger"
                          onClick={() => setConfirmDelete(fb.id)}
                        >
                          {t('admin.feedback.delete')}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Expanded detail */}
          {expanded && (
            <div className="FeedbackPage-expandedCard">
              <div className="FeedbackPage-expandedLabel">{t('admin.feedback.query')}</div>
              <p className="FeedbackPage-expandedText">{expanded.query ?? '—'}</p>
              <div className="FeedbackPage-expandedLabel">{t('admin.feedback.answer')}</div>
              <p className="FeedbackPage-expandedText">{expanded.answer ?? '—'}</p>
              {expanded.toolsUsed.length > 0 && (
                <>
                  <div className="FeedbackPage-expandedLabel">{t('admin.feedback.toolsUsed')}</div>
                  <p className="FeedbackPage-expandedText">{expanded.toolsUsed.join(', ')}</p>
                </>
              )}
            </div>
          )}

          <div className="FeedbackPage-pagination">
            <button
              className="FeedbackPage-btnSecondary"
              disabled={page === 0}
              onClick={() => setPage(page - 1)}
            >
              {t('admin.feedback.prevPage')}
            </button>
            <span className="FeedbackPage-pageInfo">
              {t('admin.feedback.pageInfo', { page: page + 1, total: data.totalPages || 1 })}
            </span>
            <button
              className="FeedbackPage-btnSecondary"
              disabled={page + 1 >= (data.totalPages || 1)}
              onClick={() => setPage(page + 1)}
            >
              {t('admin.feedback.nextPage')}
            </button>
          </div>
        </>
      )}

      {/* Delete confirmation */}
      {confirmDelete && (
        <div className="FeedbackPage-overlay" onClick={() => setConfirmDelete(null)}>
          <div className="FeedbackPage-dialog" onClick={(e) => e.stopPropagation()}>
            <p className="FeedbackPage-dialogText">{t('admin.feedback.deleteConfirm')}</p>
            <div className="FeedbackPage-dialogActions">
              <button
                className="FeedbackPage-btnDanger"
                onClick={handleDelete}
                disabled={deleteFeedback.isPending}
              >
                {t('admin.feedback.delete')}
              </button>
              <button className="FeedbackPage-btnSecondary" onClick={() => setConfirmDelete(null)}>
                {t('admin.feedback.cancel')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
