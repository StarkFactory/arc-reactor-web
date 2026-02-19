import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import {
  usePendingApprovals,
  useApproveToolCall,
  useRejectToolCall,
} from '../../../hooks/useApprovals'
import type { ApprovalSummary } from '../../../types/api'
import './ApprovalWorkflowPage.css'

const POLL_INTERVAL = 2000

export function ApprovalWorkflowPage() {
  const { t } = useTranslation()
  const { data: approvals, isLoading, isError, refetch } = usePendingApprovals(POLL_INTERVAL)

  const approve = useApproveToolCall()
  const reject = useRejectToolCall()

  const [rejectTarget, setRejectTarget] = useState<ApprovalSummary | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [actionError, setActionError] = useState('')
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>(() =>
    'Notification' in window ? Notification.permission : 'default'
  )
  const prevCountRef = useRef(0)

  // Browser notification for new approvals
  useEffect(() => {
    if (!approvals) return
    const pending = approvals.filter((a) => a.status === 'PENDING').length
    if (pending > prevCountRef.current && notifPermission === 'granted') {
      new Notification(t('admin.approvals.newRequest'), {
        body: t('admin.approvals.newRequestBody', { count: pending }),
      })
    }
    prevCountRef.current = pending
  }, [approvals, notifPermission, t])

  async function requestNotifPermission() {
    if (!('Notification' in window)) return
    const p = await Notification.requestPermission()
    setNotifPermission(p)
  }

  async function handleApprove(id: string) {
    setActionError('')
    try {
      await approve.mutateAsync(id)
    } catch {
      setActionError(t('admin.approvals.approveError'))
    }
  }

  async function handleReject() {
    if (!rejectTarget) return
    setActionError('')
    try {
      await reject.mutateAsync({ id: rejectTarget.id, reason: rejectReason || undefined })
      setRejectTarget(null)
      setRejectReason('')
    } catch {
      setActionError(t('admin.approvals.rejectError'))
    }
  }

  const pending = approvals?.filter((a) => a.status === 'PENDING') ?? []
  const processed = approvals?.filter((a) => a.status !== 'PENDING') ?? []

  return (
    <div className="ApprovalWorkflowPage">
      <div className="ApprovalWorkflowPage-header">
        <div>
          <h1 className="ApprovalWorkflowPage-title">{t('admin.approvals.title')}</h1>
          <p className="ApprovalWorkflowPage-description">{t('admin.approvals.description')}</p>
        </div>
        <div className="ApprovalWorkflowPage-headerActions">
          {notifPermission !== 'granted' && 'Notification' in window && (
            <button className="ApprovalWorkflowPage-btnSecondary" onClick={requestNotifPermission}>
              {t('admin.approvals.enableNotifications')}
            </button>
          )}
          {notifPermission === 'granted' && (
            <span className="ApprovalWorkflowPage-notifOn">{t('admin.approvals.notificationsEnabled')}</span>
          )}
          <button className="ApprovalWorkflowPage-btnSecondary" onClick={() => refetch()}>
            {t('admin.approvals.refresh')}
          </button>
        </div>
      </div>

      {actionError && <div className="ApprovalWorkflowPage-error">{actionError}</div>}

      <div className="ApprovalWorkflowPage-pollingBadge">
        {t('admin.approvals.autoRefresh', { interval: POLL_INTERVAL / 1000 })}
      </div>

      {isLoading && (
        <div className="ApprovalWorkflowPage-state">{t('admin.approvals.loading')}</div>
      )}
      {isError && (
        <div className="ApprovalWorkflowPage-error">
          {t('admin.approvals.loadError')}
          <button className="ApprovalWorkflowPage-btnSecondary" onClick={() => refetch()}>
            {t('admin.approvals.retry')}
          </button>
        </div>
      )}

      {/* Pending section */}
      <section className="ApprovalWorkflowPage-section">
        <h2 className="ApprovalWorkflowPage-sectionTitle">
          {t('admin.approvals.pendingSection')}
          {pending.length > 0 && (
            <span className="ApprovalWorkflowPage-countBadge">{pending.length}</span>
          )}
        </h2>

        {pending.length === 0 && !isLoading && (
          <div className="ApprovalWorkflowPage-empty">{t('admin.approvals.noPending')}</div>
        )}

        <div className="ApprovalWorkflowPage-cards">
          {pending.map((item) => (
            <div key={item.id} className="ApprovalWorkflowPage-card ApprovalWorkflowPage-card--pending">
              <div className="ApprovalWorkflowPage-cardHeader">
                <span className="ApprovalWorkflowPage-toolName">{item.toolName}</span>
                <span className="ApprovalWorkflowPage-requestedAt">
                  {new Date(item.requestedAt).toLocaleTimeString()}
                </span>
              </div>
              <div className="ApprovalWorkflowPage-userId">
                {t('admin.approvals.requestedBy', { userId: item.userId })}
              </div>
              <div className="ApprovalWorkflowPage-args">
                <div className="ApprovalWorkflowPage-argsLabel">{t('admin.approvals.arguments')}</div>
                <pre className="ApprovalWorkflowPage-argsContent">
                  {JSON.stringify(item.arguments, null, 2)}
                </pre>
              </div>
              <div className="ApprovalWorkflowPage-cardActions">
                <button
                  className="ApprovalWorkflowPage-btnApprove"
                  onClick={() => handleApprove(item.id)}
                  disabled={approve.isPending}
                >
                  {t('admin.approvals.approve')}
                </button>
                <button
                  className="ApprovalWorkflowPage-btnReject"
                  onClick={() => setRejectTarget(item)}
                >
                  {t('admin.approvals.reject')}
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Processed section */}
      {processed.length > 0 && (
        <section className="ApprovalWorkflowPage-section">
          <h2 className="ApprovalWorkflowPage-sectionTitle">
            {t('admin.approvals.processedSection')}
          </h2>
          <div className="ApprovalWorkflowPage-tableWrap">
            <table className="ApprovalWorkflowPage-table">
              <thead>
                <tr>
                  <th>{t('admin.approvals.colTool')}</th>
                  <th>{t('admin.approvals.colUser')}</th>
                  <th>{t('admin.approvals.colStatus')}</th>
                  <th>{t('admin.approvals.colTime')}</th>
                </tr>
              </thead>
              <tbody>
                {processed.map((item) => (
                  <tr key={item.id}>
                    <td>{item.toolName}</td>
                    <td>{item.userId}</td>
                    <td>
                      <span className={`ApprovalWorkflowPage-statusBadge ApprovalWorkflowPage-statusBadge--${item.status.toLowerCase()}`}>
                        {item.status}
                      </span>
                    </td>
                    <td>{new Date(item.requestedAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Reject dialog */}
      {rejectTarget && (
        <div className="ApprovalWorkflowPage-overlay" onClick={() => setRejectTarget(null)}>
          <div className="ApprovalWorkflowPage-dialog" onClick={(e) => e.stopPropagation()}>
            <p className="ApprovalWorkflowPage-dialogText">
              {t('admin.approvals.rejectConfirm', { tool: rejectTarget.toolName })}
            </p>
            <textarea
              className="ApprovalWorkflowPage-textarea"
              placeholder={t('admin.approvals.rejectReasonPlaceholder')}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
            />
            <div className="ApprovalWorkflowPage-dialogActions">
              <button
                className="ApprovalWorkflowPage-btnReject"
                onClick={handleReject}
                disabled={reject.isPending}
              >
                {t('admin.approvals.reject')}
              </button>
              <button
                className="ApprovalWorkflowPage-btnSecondary"
                onClick={() => setRejectTarget(null)}
              >
                {t('admin.approvals.cancel')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
