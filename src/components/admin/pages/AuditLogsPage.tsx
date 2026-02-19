import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuditLogs } from '../../../hooks/useAuditLogs'
import type { AdminAuditLogResponse } from '../../../types/api'
import './AuditLogsPage.css'

const PAGE_SIZE = 20

const AUDIT_CATEGORIES = ['PERSONA', 'MCP', 'POLICY', 'INTENT', 'OUTPUT_GUARD', 'SCHEDULER', 'USER']

function formatTimestamp(ts: number): string {
  return new Date(ts).toLocaleString()
}

function exportToCsv(logs: AdminAuditLogResponse[]) {
  const header = ['Time', 'Category', 'Action', 'Actor', 'Resource']
  const rows = logs.map(log => [
    formatTimestamp(log.createdAt),
    log.category,
    log.action,
    log.actor,
    log.resourceId ?? '',
  ])
  const csv = [header, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `audit-logs-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export function AuditLogsPage() {
  const { t } = useTranslation()
  const [searchParams, setSearchParams] = useSearchParams()
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const page = Number(searchParams.get('page') ?? '0')
  const category = searchParams.get('category') ?? ''
  const actor = searchParams.get('actor') ?? ''
  const from = searchParams.get('from') ?? ''
  const to = searchParams.get('to') ?? ''

  // Local filter form state (applied on submit)
  const [filterCategory, setFilterCategory] = useState(category)
  const [filterActor, setFilterActor] = useState(actor)
  const [filterFrom, setFilterFrom] = useState(from)
  const [filterTo, setFilterTo] = useState(to)

  const params = {
    page,
    size: PAGE_SIZE,
    ...(category && { category }),
    ...(actor && { actor }),
    ...(from && { from }),
    ...(to && { to }),
  }

  const { data, isLoading, isError, refetch } = useAuditLogs(params)

  function applyFilters() {
    const next = new URLSearchParams()
    if (filterCategory) next.set('category', filterCategory)
    if (filterActor) next.set('actor', filterActor)
    if (filterFrom) next.set('from', filterFrom)
    if (filterTo) next.set('to', filterTo)
    next.set('page', '0')
    setSearchParams(next)
  }

  function resetFilters() {
    setFilterCategory('')
    setFilterActor('')
    setFilterFrom('')
    setFilterTo('')
    setSearchParams({})
  }

  function goToPage(p: number) {
    const next = new URLSearchParams(searchParams)
    next.set('page', String(p))
    setSearchParams(next)
  }

  return (
    <div className="AuditLogs">
      <div className="AuditLogs-header">
        <div>
          <h1 className="AuditLogs-title">{t('admin.auditLogs.title')}</h1>
          <p className="AuditLogs-desc">{t('admin.auditLogs.description')}</p>
        </div>
        {data && data.content.length > 0 && (
          <button
            className="AuditLogs-exportBtn"
            onClick={() => exportToCsv(data.content)}
          >
            {t('admin.auditLogs.exportCsv')}
          </button>
        )}
      </div>

      {/* Filter bar */}
      <div className="AuditLogs-filters">
        <div className="AuditLogs-filterGroup">
          <label className="AuditLogs-filterLabel">{t('admin.auditLogs.filterCategory')}</label>
          <select
            className="AuditLogs-filterSelect"
            value={filterCategory}
            onChange={e => setFilterCategory(e.target.value)}
          >
            <option value="">{t('admin.auditLogs.allCategories')}</option>
            {AUDIT_CATEGORIES.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div className="AuditLogs-filterGroup">
          <label className="AuditLogs-filterLabel">{t('admin.auditLogs.filterActor')}</label>
          <input
            className="AuditLogs-filterInput"
            type="text"
            value={filterActor}
            onChange={e => setFilterActor(e.target.value)}
            placeholder="admin@example.com"
          />
        </div>
        <div className="AuditLogs-filterGroup">
          <label className="AuditLogs-filterLabel">{t('admin.auditLogs.filterFrom')}</label>
          <input
            className="AuditLogs-filterInput"
            type="date"
            value={filterFrom}
            onChange={e => setFilterFrom(e.target.value)}
          />
        </div>
        <div className="AuditLogs-filterGroup">
          <label className="AuditLogs-filterLabel">{t('admin.auditLogs.filterTo')}</label>
          <input
            className="AuditLogs-filterInput"
            type="date"
            value={filterTo}
            onChange={e => setFilterTo(e.target.value)}
          />
        </div>
        <div className="AuditLogs-filterActions">
          <button className="AuditLogs-applyBtn" onClick={applyFilters}>
            {t('admin.auditLogs.apply')}
          </button>
          <button className="AuditLogs-resetBtn" onClick={resetFilters}>
            {t('admin.auditLogs.reset')}
          </button>
        </div>
      </div>

      {/* Table */}
      {isLoading && <div className="AuditLogs-loading">{t('admin.auditLogs.loading')}</div>}

      {isError && (
        <div className="AuditLogs-error">
          {t('admin.auditLogs.loadError')}
          <button className="AuditLogs-retryBtn" onClick={() => refetch()}>
            {t('admin.auditLogs.retry')}
          </button>
        </div>
      )}

      {data && data.content.length === 0 && (
        <div className="AuditLogs-empty">{t('admin.auditLogs.empty')}</div>
      )}

      {data && data.content.length > 0 && (
        <>
          <div className="AuditLogs-table">
            <div className="AuditLogs-tableHeader">
              <span>{t('admin.auditLogs.colTime')}</span>
              <span>{t('admin.auditLogs.colCategory')}</span>
              <span>{t('admin.auditLogs.colAction')}</span>
              <span>{t('admin.auditLogs.colActor')}</span>
              <span>{t('admin.auditLogs.colResource')}</span>
              <span></span>
            </div>
            {data.content.map(log => (
              <div key={log.id}>
                <div className="AuditLogs-tableRow">
                  <span className="AuditLogs-time">{formatTimestamp(log.createdAt)}</span>
                  <span className="AuditLogs-badge AuditLogs-badge--category">{log.category}</span>
                  <span className="AuditLogs-badge AuditLogs-badge--action">{log.action}</span>
                  <span className="AuditLogs-actor">{log.actor}</span>
                  <span className="AuditLogs-resource">{log.resourceId ?? '—'}</span>
                  <button
                    className="AuditLogs-detailBtn"
                    onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
                    disabled={!log.detail}
                  >
                    {log.detail ? t('admin.auditLogs.detail') : t('admin.auditLogs.noDetail')}
                  </button>
                </div>
                {expandedId === log.id && log.detail && (
                  <div className="AuditLogs-detail">
                    <pre className="AuditLogs-detailJson">
                      {JSON.stringify(log.detail, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Pagination */}
          <div className="AuditLogs-pagination">
            <button
              className="AuditLogs-pageBtn"
              disabled={page === 0}
              onClick={() => goToPage(page - 1)}
            >
              {t('admin.auditLogs.prevPage')}
            </button>
            <span className="AuditLogs-pageInfo">
              {t('admin.auditLogs.pageInfo', { page: page + 1, total: data.totalPages })}
            </span>
            <button
              className="AuditLogs-pageBtn"
              disabled={page + 1 >= data.totalPages}
              onClick={() => goToPage(page + 1)}
            >
              {t('admin.auditLogs.nextPage')}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
