import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { ErrorReportRequest, ErrorReportResponse } from '../../types/api'
import { submitErrorReport } from '../../services/error-report'
import './ErrorReportPage.css'

interface HistoryEntry {
  requestId: string
  serviceName: string
  timestamp: string
  status: 'accepted' | 'error'
  error?: string
}

export function ErrorReportPage() {
  const { t } = useTranslation()
  const [stackTrace, setStackTrace] = useState('')
  const [serviceName, setServiceName] = useState('')
  const [repoSlug, setRepoSlug] = useState('')
  const [slackChannel, setSlackChannel] = useState('')
  const [environment, setEnvironment] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<ErrorReportResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [history, setHistory] = useState<HistoryEntry[]>([])

  const isValid = stackTrace.trim() && serviceName.trim() && repoSlug.trim() && slackChannel.trim()

  const handleSubmit = async () => {
    if (!isValid) return
    setSubmitting(true)
    setResult(null)
    setError(null)

    const request: ErrorReportRequest = {
      stackTrace: stackTrace.trim(),
      serviceName: serviceName.trim(),
      repoSlug: repoSlug.trim(),
      slackChannel: slackChannel.trim(),
      environment: environment.trim() || undefined,
    }

    try {
      const response = await submitErrorReport(request, apiKey.trim() || undefined)
      setResult(response)
      setHistory(prev => [{
        requestId: response.requestId,
        serviceName: request.serviceName,
        timestamp: new Date().toISOString(),
        status: 'accepted',
      }, ...prev])
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unknown error'
      setError(msg)
      setHistory(prev => [{
        requestId: '-',
        serviceName: request.serviceName,
        timestamp: new Date().toISOString(),
        status: 'error',
        error: msg,
      }, ...prev])
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="ErrorReport">
      <h1 className="ErrorReport-title">{t('apps.errorReport.title')}</h1>
      <p className="ErrorReport-desc">{t('apps.errorReport.description')}</p>

      <div className="ErrorReport-form">
        <div className="ErrorReport-field">
          <label className="ErrorReport-label">{t('apps.errorReport.stackTrace')} {t('apps.errorReport.required')}</label>
          <textarea
            className="ErrorReport-textarea"
            value={stackTrace}
            onChange={e => setStackTrace(e.target.value)}
            placeholder={t('apps.errorReport.stackTracePlaceholder')}
            rows={8}
          />
        </div>

        <div className="ErrorReport-row">
          <div className="ErrorReport-field">
            <label className="ErrorReport-label">{t('apps.errorReport.serviceName')} {t('apps.errorReport.required')}</label>
            <input
              className="ErrorReport-input"
              value={serviceName}
              onChange={e => setServiceName(e.target.value)}
              placeholder={t('apps.errorReport.serviceNamePlaceholder')}
            />
          </div>
          <div className="ErrorReport-field">
            <label className="ErrorReport-label">{t('apps.errorReport.repoSlug')} {t('apps.errorReport.required')}</label>
            <input
              className="ErrorReport-input"
              value={repoSlug}
              onChange={e => setRepoSlug(e.target.value)}
              placeholder={t('apps.errorReport.repoSlugPlaceholder')}
            />
          </div>
        </div>

        <div className="ErrorReport-row">
          <div className="ErrorReport-field">
            <label className="ErrorReport-label">{t('apps.errorReport.slackChannel')} {t('apps.errorReport.required')}</label>
            <input
              className="ErrorReport-input"
              value={slackChannel}
              onChange={e => setSlackChannel(e.target.value)}
              placeholder={t('apps.errorReport.slackChannelPlaceholder')}
            />
          </div>
          <div className="ErrorReport-field">
            <label className="ErrorReport-label">{t('apps.errorReport.environment')}</label>
            <input
              className="ErrorReport-input"
              value={environment}
              onChange={e => setEnvironment(e.target.value)}
              placeholder={t('apps.errorReport.environmentPlaceholder')}
            />
          </div>
        </div>

        <div className="ErrorReport-field">
          <label className="ErrorReport-label">{t('apps.errorReport.apiKey')}</label>
          <input
            className="ErrorReport-input"
            type="password"
            value={apiKey}
            onChange={e => setApiKey(e.target.value)}
            placeholder={t('apps.errorReport.apiKeyPlaceholder')}
          />
        </div>

        <button
          className="ErrorReport-submitBtn"
          onClick={handleSubmit}
          disabled={submitting || !isValid}
        >
          {submitting ? t('apps.errorReport.submitting') : t('apps.errorReport.submit')}
        </button>
      </div>

      {result && (
        <div className="ErrorReport-result ErrorReport-result--success">
          <div className="ErrorReport-resultTitle">{t('apps.errorReport.accepted')}</div>
          <div className="ErrorReport-resultId">{t('apps.errorReport.requestId', { id: result.requestId })}</div>
          <div className="ErrorReport-resultNote">
            {t('apps.errorReport.acceptedNote', { channel: slackChannel || 'Slack' })}
          </div>
        </div>
      )}

      {error && (
        <div className="ErrorReport-result ErrorReport-result--error">
          <div className="ErrorReport-resultTitle">{t('apps.errorReport.errorTitle')}</div>
          <div className="ErrorReport-resultId">{error}</div>
        </div>
      )}

      {history.length > 0 && (
        <div className="ErrorReport-history">
          <h2 className="ErrorReport-historyTitle">{t('apps.errorReport.history')}</h2>
          <div className="ErrorReport-historyList">
            {history.map((entry, i) => (
              <div key={i} className={`ErrorReport-historyItem ErrorReport-historyItem--${entry.status}`}>
                <div className="ErrorReport-historyMain">
                  <span className="ErrorReport-historyService">{entry.serviceName}</span>
                  <span className={`ErrorReport-historyStatus ErrorReport-historyStatus--${entry.status}`}>
                    {entry.status}
                  </span>
                </div>
                <div className="ErrorReport-historyMeta">
                  {entry.requestId !== '-' && <span>ID: {entry.requestId}</span>}
                  {entry.error && <span className="ErrorReport-historyError">{entry.error}</span>}
                  <span>{new Date(entry.timestamp).toLocaleTimeString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
