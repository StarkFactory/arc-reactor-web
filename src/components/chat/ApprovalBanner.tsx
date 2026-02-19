import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useChatContext } from '../../context/ChatContext'
import { fetchPendingApprovals, approveToolCall, rejectToolCall } from '../../services/approval'
import type { ApprovalSummary } from '../../types/api'
import './ApprovalBanner.css'

const POLL_INTERVAL = 2000

export function ApprovalBanner() {
  const { t } = useTranslation()
  const { isLoading } = useChatContext()
  const [approvals, setApprovals] = useState<ApprovalSummary[]>([])
  const [processing, setProcessing] = useState<string | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const poll = async () => {
    const pending = await fetchPendingApprovals()
    setApprovals(pending)
  }

  useEffect(() => {
    if (!isLoading) {
      setApprovals([])
      return
    }

    poll()
    intervalRef.current = setInterval(poll, POLL_INTERVAL)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [isLoading])

  const handleApprove = async (id: string) => {
    setProcessing(id)
    try {
      await approveToolCall(id)
      setApprovals(prev => prev.filter(a => a.id !== id))
    } catch {
      // silently fail, next poll will refresh
    } finally {
      setProcessing(null)
    }
  }

  const handleReject = async (id: string) => {
    setProcessing(id)
    try {
      await rejectToolCall(id)
      setApprovals(prev => prev.filter(a => a.id !== id))
    } catch {
      // silently fail
    } finally {
      setProcessing(null)
    }
  }

  if (approvals.length === 0) return null

  return (
    <div className="ApprovalBanner">
      {approvals.map(approval => (
        <div key={approval.id} className="ApprovalBanner-item">
          <div className="ApprovalBanner-header">
            <span className="ApprovalBanner-label">{t('approval.pending')}</span>
            <span className="ApprovalBanner-toolName">
              {t('approval.toolName', { name: approval.toolName })}
            </span>
          </div>
          {Object.keys(approval.arguments).length > 0 && (
            <pre className="ApprovalBanner-args">
              {JSON.stringify(approval.arguments, null, 2)}
            </pre>
          )}
          <div className="ApprovalBanner-actions">
            <button
              className="ApprovalBanner-approveBtn"
              onClick={() => handleApprove(approval.id)}
              disabled={processing === approval.id}
            >
              {t('approval.approve')}
            </button>
            <button
              className="ApprovalBanner-rejectBtn"
              onClick={() => handleReject(approval.id)}
              disabled={processing === approval.id}
            >
              {t('approval.reject')}
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
