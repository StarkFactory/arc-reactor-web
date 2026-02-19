import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  useRagPolicy,
  useUpdateRagPolicy,
  useRagCandidates,
  useApproveRagCandidate,
  useRejectRagCandidate,
} from '../../../hooks/useRag'
import type { RagIngestionPolicy, RagCandidateResponse } from '../../../types/api'
import './RagIngestionPage.css'

export function RagIngestionPage() {
  const { t } = useTranslation()
  const [searchParams, setSearchParams] = useSearchParams()

  const page = Number(searchParams.get('page') ?? '0')
  const statusFilter = (searchParams.get('status') ?? '') as '' | 'PENDING' | 'INGESTED' | 'REJECTED'

  const { data: policy, isLoading: policyLoading, isError: policyError } = useRagPolicy()
  const updatePolicy = useUpdateRagPolicy()

  const {
    data: candidatesPage,
    isLoading: candidatesLoading,
    isError: candidatesError,
    refetch,
  } = useRagCandidates({
    page,
    size: 20,
    status: statusFilter || undefined,
  })

  const approve = useApproveRagCandidate()
  const reject = useRejectRagCandidate()

  const [editPolicy, setEditPolicy] = useState(false)
  const [policyForm, setPolicyForm] = useState<RagIngestionPolicy | null>(null)
  const [rejectTarget, setRejectTarget] = useState<RagCandidateResponse | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [actionError, setActionError] = useState('')

  function startEditPolicy() {
    if (!policy) return
    setPolicyForm({ ...policy })
    setEditPolicy(true)
  }

  async function handleSavePolicy() {
    if (!policyForm) return
    setActionError('')
    try {
      await updatePolicy.mutateAsync(policyForm)
      setEditPolicy(false)
    } catch {
      setActionError(t('admin.rag.policyError'))
    }
  }

  async function handleApprove(id: string) {
    setActionError('')
    try {
      await approve.mutateAsync(id)
      setSelectedIds((prev) => { const s = new Set(prev); s.delete(id); return s })
    } catch {
      setActionError(t('admin.rag.approveError'))
    }
  }

  async function handleReject() {
    if (!rejectTarget) return
    setActionError('')
    try {
      await reject.mutateAsync({ id: rejectTarget.id, reason: rejectReason })
      setRejectTarget(null)
      setRejectReason('')
    } catch {
      setActionError(t('admin.rag.rejectError'))
    }
  }

  async function handleBulkApprove() {
    setActionError('')
    try {
      await Promise.all([...selectedIds].map((id) => approve.mutateAsync(id)))
      setSelectedIds(new Set())
    } catch {
      setActionError(t('admin.rag.approveError'))
    }
  }

  async function handleBulkReject() {
    setActionError('')
    try {
      await Promise.all([...selectedIds].map((id) => reject.mutateAsync({ id, reason: '' })))
      setSelectedIds(new Set())
    } catch {
      setActionError(t('admin.rag.rejectError'))
    }
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const s = new Set(prev)
      if (s.has(id)) s.delete(id)
      else s.add(id)
      return s
    })
  }

  function setPage(p: number) {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.set('page', String(p))
      return next
    })
  }

  const totalPages = candidatesPage?.totalPages ?? 1

  return (
    <div className="RagIngestionPage">
      <div className="RagIngestionPage-header">
        <div>
          <h1 className="RagIngestionPage-title">{t('admin.rag.title')}</h1>
          <p className="RagIngestionPage-description">{t('admin.rag.description')}</p>
        </div>
      </div>

      {actionError && <div className="RagIngestionPage-error">{actionError}</div>}

      {/* Policy section */}
      <section className="RagIngestionPage-section">
        <h2 className="RagIngestionPage-sectionTitle">{t('admin.rag.policy')}</h2>
        {policyLoading && <div className="RagIngestionPage-state">{t('admin.rag.loading')}</div>}
        {policyError && <div className="RagIngestionPage-error">{t('admin.rag.loadError')}</div>}
        {policy && !editPolicy && (
          <div className="RagIngestionPage-policyCard">
            <div className="RagIngestionPage-policyRow">
              <span>{t('admin.rag.policyEnabled')}</span>
              <span className={`RagIngestionPage-badge RagIngestionPage-badge--${policy.enabled ? 'active' : 'inactive'}`}>
                {policy.enabled ? t('admin.rag.on') : t('admin.rag.off')}
              </span>
            </div>
            <div className="RagIngestionPage-policyRow">
              <span>{t('admin.rag.policyReview')}</span>
              <span className={`RagIngestionPage-badge RagIngestionPage-badge--${policy.requireReview ? 'active' : 'inactive'}`}>
                {policy.requireReview ? t('admin.rag.required') : t('admin.rag.auto')}
              </span>
            </div>
            <div className="RagIngestionPage-policyRow">
              <span>{t('admin.rag.policyMinLength')}</span>
              <span>{policy.minQueryLength}</span>
            </div>
            <div className="RagIngestionPage-policyRow">
              <span>{t('admin.rag.policyChannels')}</span>
              <span>{policy.allowedChannels.join(', ') || t('admin.rag.allChannels')}</span>
            </div>
            <div className="RagIngestionPage-policyRow">
              <span>{t('admin.rag.policyBlockPatterns')}</span>
              <span>{policy.blockPatterns.join(', ') || t('admin.rag.none')}</span>
            </div>
            <button className="RagIngestionPage-btnSecondary" onClick={startEditPolicy}>
              {t('admin.rag.editPolicy')}
            </button>
          </div>
        )}
        {policy && editPolicy && policyForm && (
          <div className="RagIngestionPage-policyForm">
            <label className="RagIngestionPage-label">
              <input
                type="checkbox"
                checked={policyForm.enabled}
                onChange={(e) => setPolicyForm({ ...policyForm, enabled: e.target.checked })}
              />
              {t('admin.rag.policyEnabled')}
            </label>
            <label className="RagIngestionPage-label">
              <input
                type="checkbox"
                checked={policyForm.requireReview}
                onChange={(e) => setPolicyForm({ ...policyForm, requireReview: e.target.checked })}
              />
              {t('admin.rag.policyReview')}
            </label>
            <label className="RagIngestionPage-label">
              {t('admin.rag.policyMinLength')}
              <input
                className="RagIngestionPage-input"
                type="number"
                value={policyForm.minQueryLength}
                onChange={(e) => setPolicyForm({ ...policyForm, minQueryLength: Number(e.target.value) })}
              />
            </label>
            <label className="RagIngestionPage-label">
              {t('admin.rag.policyChannels')}
              <input
                className="RagIngestionPage-input"
                value={policyForm.allowedChannels.join(', ')}
                onChange={(e) =>
                  setPolicyForm({
                    ...policyForm,
                    allowedChannels: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                  })
                }
                placeholder="#channel1, #channel2"
              />
            </label>
            <label className="RagIngestionPage-label">
              {t('admin.rag.policyBlockPatterns')}
              <input
                className="RagIngestionPage-input"
                value={policyForm.blockPatterns.join(', ')}
                onChange={(e) =>
                  setPolicyForm({
                    ...policyForm,
                    blockPatterns: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                  })
                }
                placeholder="pattern1, pattern2"
              />
            </label>
            <div className="RagIngestionPage-formActions">
              <button
                className="RagIngestionPage-btn"
                onClick={handleSavePolicy}
                disabled={updatePolicy.isPending}
              >
                {updatePolicy.isPending ? t('admin.rag.saving') : t('admin.rag.savePolicy')}
              </button>
              <button className="RagIngestionPage-btnSecondary" onClick={() => setEditPolicy(false)}>
                {t('admin.rag.cancel')}
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Candidates section */}
      <section className="RagIngestionPage-section">
        <div className="RagIngestionPage-candidatesHeader">
          <h2 className="RagIngestionPage-sectionTitle">{t('admin.rag.candidates')}</h2>
          <div className="RagIngestionPage-candidatesActions">
            <select
              className="RagIngestionPage-select"
              value={statusFilter}
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
              <option value="">{t('admin.rag.allStatuses')}</option>
              <option value="PENDING">{t('admin.rag.pending')}</option>
              <option value="INGESTED">{t('admin.rag.ingested')}</option>
              <option value="REJECTED">{t('admin.rag.rejected')}</option>
            </select>
            {selectedIds.size > 0 && (
              <>
                <button
                  className="RagIngestionPage-btn"
                  onClick={handleBulkApprove}
                  disabled={approve.isPending}
                >
                  {t('admin.rag.bulkApprove', { count: selectedIds.size })}
                </button>
                <button
                  className="RagIngestionPage-btnDanger"
                  onClick={handleBulkReject}
                  disabled={reject.isPending}
                >
                  {t('admin.rag.bulkReject', { count: selectedIds.size })}
                </button>
              </>
            )}
          </div>
        </div>

        {candidatesLoading && <div className="RagIngestionPage-state">{t('admin.rag.loading')}</div>}
        {candidatesError && (
          <div className="RagIngestionPage-error">
            {t('admin.rag.loadError')}
            <button className="RagIngestionPage-btnSecondary" onClick={() => refetch()}>
              {t('admin.rag.retry')}
            </button>
          </div>
        )}

        {!candidatesLoading && !candidatesError && candidatesPage && (
          <>
            <div className="RagIngestionPage-tableWrap">
              <table className="RagIngestionPage-table">
                <thead>
                  <tr>
                    <th></th>
                    <th>{t('admin.rag.colQuery')}</th>
                    <th>{t('admin.rag.colChannel')}</th>
                    <th>{t('admin.rag.colStatus')}</th>
                    <th>{t('admin.rag.colDate')}</th>
                    <th>{t('admin.rag.colActions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {candidatesPage.content.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="RagIngestionPage-empty">{t('admin.rag.empty')}</td>
                    </tr>
                  ) : (
                    candidatesPage.content.map((c) => (
                      <tr key={c.id}>
                        <td>
                          <input
                            type="checkbox"
                            checked={selectedIds.has(c.id)}
                            onChange={() => toggleSelect(c.id)}
                          />
                        </td>
                        <td className="RagIngestionPage-queryCell">
                          <div className="RagIngestionPage-queryText">{c.query}</div>
                          <div className="RagIngestionPage-answerText">{c.answer}</div>
                        </td>
                        <td>{c.channel}</td>
                        <td>
                          <span className={`RagIngestionPage-badge RagIngestionPage-badge--${c.status.toLowerCase()}`}>
                            {c.status}
                          </span>
                        </td>
                        <td>{new Date(c.createdAt).toLocaleDateString()}</td>
                        <td className="RagIngestionPage-actions">
                          {c.status === 'PENDING' && (
                            <>
                              <button
                                className="RagIngestionPage-btn"
                                onClick={() => handleApprove(c.id)}
                                disabled={approve.isPending}
                              >
                                {t('admin.rag.approve')}
                              </button>
                              <button
                                className="RagIngestionPage-btnDanger"
                                onClick={() => setRejectTarget(c)}
                              >
                                {t('admin.rag.reject')}
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="RagIngestionPage-pagination">
              <button
                className="RagIngestionPage-btnSecondary"
                disabled={page === 0}
                onClick={() => setPage(page - 1)}
              >
                {t('admin.rag.prevPage')}
              </button>
              <span className="RagIngestionPage-pageInfo">
                {t('admin.rag.pageInfo', { page: page + 1, total: totalPages })}
              </span>
              <button
                className="RagIngestionPage-btnSecondary"
                disabled={page + 1 >= totalPages}
                onClick={() => setPage(page + 1)}
              >
                {t('admin.rag.nextPage')}
              </button>
            </div>
          </>
        )}
      </section>

      {/* Reject dialog */}
      {rejectTarget && (
        <div className="RagIngestionPage-overlay" onClick={() => setRejectTarget(null)}>
          <div className="RagIngestionPage-dialog" onClick={(e) => e.stopPropagation()}>
            <p className="RagIngestionPage-dialogText">
              {t('admin.rag.rejectConfirm', { query: rejectTarget.query })}
            </p>
            <textarea
              className="RagIngestionPage-textarea"
              placeholder={t('admin.rag.rejectReasonPlaceholder')}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
            />
            <div className="RagIngestionPage-dialogActions">
              <button
                className="RagIngestionPage-btnDanger"
                onClick={handleReject}
                disabled={reject.isPending}
              >
                {t('admin.rag.reject')}
              </button>
              <button className="RagIngestionPage-btnSecondary" onClick={() => setRejectTarget(null)}>
                {t('admin.rag.cancel')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
