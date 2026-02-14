import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type {
  CreateScheduledJobRequest,
  McpServerResponse,
  ScheduledJobResponse,
  UpdateScheduledJobRequest,
} from '../../types/api'
import { listMcpServers, getMcpServer } from '../../services/mcp'
import {
  createScheduledJob,
  deleteScheduledJob,
  listScheduledJobs,
  triggerScheduledJob,
  updateScheduledJob,
} from '../../services/scheduler'
import './SchedulerManager.css'

type Mode = 'view' | 'create' | 'edit'

function safeJsonStringify(value: unknown): string {
  try {
    return JSON.stringify(value ?? {}, null, 2)
  } catch {
    return '{}'
  }
}

type JsonParseError = 'INVALID_JSON' | 'NOT_OBJECT'

function parseJsonObject(
  text: string
): { ok: true; value: Record<string, unknown> } | { ok: false; error: JsonParseError; detail?: string } {
  const raw = text.trim()
  if (!raw) return { ok: true, value: {} }
  try {
    const v = JSON.parse(raw)
    if (v === null || Array.isArray(v) || typeof v !== 'object') {
      return { ok: false, error: 'NOT_OBJECT' }
    }
    return { ok: true, value: v as Record<string, unknown> }
  } catch (e) {
    return { ok: false, error: 'INVALID_JSON', detail: e instanceof Error ? e.message : undefined }
  }
}

function toUpdateRequest(job: ScheduledJobResponse): UpdateScheduledJobRequest {
  return {
    name: job.name,
    description: job.description,
    cronExpression: job.cronExpression,
    timezone: job.timezone,
    mcpServerName: job.mcpServerName,
    toolName: job.toolName,
    toolArguments: job.toolArguments ?? {},
    slackChannelId: job.slackChannelId,
    enabled: job.enabled,
  }
}

function formatTs(ts: number | null | undefined): string {
  if (!ts) return '-'
  try {
    return new Date(ts).toLocaleString()
  } catch {
    return String(ts)
  }
}

export function SchedulerManager() {
  const { t } = useTranslation()
  const [jobs, setJobs] = useState<ScheduledJobResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [mcpServers, setMcpServers] = useState<McpServerResponse[]>([])
  const [mcpToolsByServer, setMcpToolsByServer] = useState<Record<string, string[]>>({})
  const [toolsLoading, setToolsLoading] = useState(false)

  const [mode, setMode] = useState<Mode>('view')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [triggeringId, setTriggeringId] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  // Form fields
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [cronExpression, setCronExpression] = useState('')
  const [timezone, setTimezone] = useState('Asia/Seoul')
  const [mcpServerName, setMcpServerName] = useState('')
  const [toolName, setToolName] = useState('')
  const [toolArgsText, setToolArgsText] = useState('{}')
  const [slackChannelId, setSlackChannelId] = useState('')
  const [enabled, setEnabled] = useState(true)
  const [formError, setFormError] = useState<string | null>(null)

  const fetchJobs = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await listScheduledJobs()
      setJobs((data ?? []).slice().sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0)))
    } catch (e) {
      const msg = e instanceof Error ? e.message : ''
      if (msg.includes('HTTP 404') || msg.includes('HTTP 503')) {
        setError(t('admin.schedulerPage.disabled'))
      } else {
        setError(t('admin.schedulerPage.loadError'))
      }
      setJobs([])
    } finally {
      setLoading(false)
    }
  }, [t])

  const fetchMcpTools = useCallback(async () => {
    try {
      setToolsLoading(true)
      const servers = await listMcpServers()
      setMcpServers(servers)

      const out: Record<string, string[]> = {}
      for (const s of servers) {
        try {
          const detail = await getMcpServer(s.name)
          out[s.name] = (detail.tools ?? []).slice().sort()
        } catch {
          out[s.name] = []
        }
      }
      setMcpToolsByServer(out)
    } catch {
      setMcpServers([])
      setMcpToolsByServer({})
    } finally {
      setToolsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchJobs()
  }, [fetchJobs])

  useEffect(() => {
    fetchMcpTools()
  }, [fetchMcpTools])

  const toolsForSelectedServer = useMemo(() => {
    return (mcpToolsByServer[mcpServerName] ?? []).slice()
  }, [mcpServerName, mcpToolsByServer])

  const resetForm = useCallback(() => {
    setEditingId(null)
    setName('')
    setDescription('')
    setCronExpression('')
    setTimezone('Asia/Seoul')
    setMcpServerName('')
    setToolName('')
    setToolArgsText('{}')
    setSlackChannelId('')
    setEnabled(true)
    setFormError(null)
  }, [])

  const openCreate = () => {
    resetForm()
    setMode('create')
  }

  const openEdit = (job: ScheduledJobResponse) => {
    setEditingId(job.id)
    setName(job.name ?? '')
    setDescription(job.description ?? '')
    setCronExpression(job.cronExpression ?? '')
    setTimezone(job.timezone ?? 'Asia/Seoul')
    setMcpServerName(job.mcpServerName ?? '')
    setToolName(job.toolName ?? '')
    setToolArgsText(safeJsonStringify(job.toolArguments ?? {}))
    setSlackChannelId(job.slackChannelId ?? '')
    setEnabled(!!job.enabled)
    setFormError(null)
    setMode('edit')
  }

  const closeForm = () => {
    resetForm()
    setMode('view')
  }

  const canSubmit = useMemo(() => {
    if (!name.trim()) return false
    if (!cronExpression.trim()) return false
    if (!mcpServerName.trim()) return false
    if (!toolName.trim()) return false
    const parsed = parseJsonObject(toolArgsText)
    if (!parsed.ok) return false
    return true
  }, [name, cronExpression, mcpServerName, toolName, toolArgsText])

  const submit = async () => {
    setFormError(null)
    const parsed = parseJsonObject(toolArgsText)
    if (!parsed.ok) {
      if (parsed.error === 'NOT_OBJECT') setFormError(t('admin.schedulerPage.toolArgsNotObject'))
      else setFormError(t('admin.schedulerPage.toolArgsInvalidJson', { detail: parsed.detail || '' }))
      return
    }

    const base: CreateScheduledJobRequest = {
      name: name.trim(),
      description: description.trim() || null,
      cronExpression: cronExpression.trim(),
      timezone: timezone.trim() || 'Asia/Seoul',
      mcpServerName: mcpServerName.trim(),
      toolName: toolName.trim(),
      toolArguments: parsed.value,
      slackChannelId: slackChannelId.trim() || null,
      enabled,
    }

    try {
      setSaving(true)
      if (mode === 'create') {
        await createScheduledJob(base)
      } else if (mode === 'edit' && editingId) {
        await updateScheduledJob(editingId, base)
      }
      closeForm()
      await fetchJobs()
    } catch {
      setFormError(t('admin.schedulerPage.saveError'))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (job: ScheduledJobResponse) => {
    if (!confirm(t('admin.schedulerPage.deleteConfirm'))) return
    try {
      setError(null)
      await deleteScheduledJob(job.id)
      await fetchJobs()
    } catch {
      setError(t('admin.schedulerPage.deleteError'))
    }
  }

  const handleTrigger = async (job: ScheduledJobResponse) => {
    try {
      setError(null)
      setTriggeringId(job.id)
      const res = await triggerScheduledJob(job.id)
      alert(res?.result ?? 'OK')
      await fetchJobs()
    } catch {
      setError(t('admin.schedulerPage.triggerError'))
    } finally {
      setTriggeringId(null)
    }
  }

  const handleToggleEnabled = async (job: ScheduledJobResponse, nextEnabled: boolean) => {
    try {
      setError(null)
      const req = toUpdateRequest({ ...job, enabled: nextEnabled })
      await updateScheduledJob(job.id, req)
      await fetchJobs()
    } catch {
      setError(t('admin.schedulerPage.saveError'))
    }
  }

  if (loading) {
    return <div className="SchedulerManager-loading">{t('admin.schedulerPage.loading')}</div>
  }

  return (
    <div className="SchedulerManager">
      <div className="SchedulerManager-header">
        <div className="SchedulerManager-headerLeft">
          <div className="SchedulerManager-count">
            {jobs.length > 0 ? `${jobs.length}` : ''}
          </div>
          <button className="SchedulerManager-refreshBtn" onClick={fetchJobs}>
            {t('admin.schedulerPage.refresh')}
          </button>
        </div>
        <div className="SchedulerManager-headerRight">
          <button className="SchedulerManager-secondaryBtn" onClick={fetchMcpTools} disabled={toolsLoading}>
            {toolsLoading ? t('admin.schedulerPage.reloadingTools') : t('admin.schedulerPage.reloadTools')}
          </button>
          <button className="SchedulerManager-primaryBtn" onClick={openCreate}>
            {t('admin.schedulerPage.newJob')}
          </button>
        </div>
      </div>

      {error && <div className="SchedulerManager-error">{error}</div>}

      {mode !== 'view' && (
        <div className="SchedulerManager-form">
          <div className="SchedulerManager-formTitle">
            {mode === 'create' ? t('admin.schedulerPage.createTitle') : t('admin.schedulerPage.editTitle')}
          </div>

          {formError && <div className="SchedulerManager-formError">{formError}</div>}

          <div className="SchedulerManager-grid">
            <div className="SchedulerManager-field">
              <div className="SchedulerManager-label">{t('admin.schedulerPage.name')}</div>
              <input
                className="SchedulerManager-input"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder={t('admin.schedulerPage.namePlaceholder')}
              />
            </div>

            <div className="SchedulerManager-field">
              <div className="SchedulerManager-label">{t('admin.schedulerPage.cron')}</div>
              <input
                className="SchedulerManager-input"
                value={cronExpression}
                onChange={e => setCronExpression(e.target.value)}
                placeholder="0 0 * * *"
              />
            </div>

            <div className="SchedulerManager-field">
              <div className="SchedulerManager-label">{t('admin.schedulerPage.timezone')}</div>
              <input
                className="SchedulerManager-input"
                value={timezone}
                onChange={e => setTimezone(e.target.value)}
                placeholder="Asia/Seoul"
              />
            </div>

            <div className="SchedulerManager-field">
              <div className="SchedulerManager-label">{t('admin.schedulerPage.mcpServer')}</div>
              <select
                className="SchedulerManager-select"
                value={mcpServerName}
                onChange={e => {
                  setMcpServerName(e.target.value)
                  setToolName('')
                }}
              >
                <option value="">{t('admin.schedulerPage.mcpServerPlaceholder')}</option>
                {mcpServers
                  .slice()
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map(s => (
                    <option key={s.id} value={s.name}>
                      {s.name}
                    </option>
                  ))}
              </select>
            </div>

            <div className="SchedulerManager-field">
              <div className="SchedulerManager-label">{t('admin.schedulerPage.toolName')}</div>
              <select
                className="SchedulerManager-select"
                value={toolName}
                onChange={e => setToolName(e.target.value)}
                disabled={!mcpServerName}
              >
                <option value="">{t('admin.schedulerPage.toolNamePlaceholder')}</option>
                {toolsForSelectedServer.map(tn => (
                  <option key={tn} value={tn}>
                    {tn}
                  </option>
                ))}
              </select>
            </div>

            <div className="SchedulerManager-field">
              <div className="SchedulerManager-label">{t('admin.schedulerPage.slackChannel')}</div>
              <input
                className="SchedulerManager-input"
                value={slackChannelId}
                onChange={e => setSlackChannelId(e.target.value)}
                placeholder={t('admin.schedulerPage.slackChannelPlaceholder')}
              />
            </div>

            <div className="SchedulerManager-field SchedulerManager-fieldWide">
              <div className="SchedulerManager-label">{t('admin.schedulerPage.toolArgs')}</div>
              <textarea
                className="SchedulerManager-textarea"
                value={toolArgsText}
                onChange={e => setToolArgsText(e.target.value)}
                rows={8}
                spellCheck={false}
              />
              <div className="SchedulerManager-hintRow">
                <button
                  className="SchedulerManager-tertiaryBtn"
                  type="button"
                  onClick={() => {
                    const parsed = parseJsonObject(toolArgsText)
                    if (!parsed.ok) {
                      if (parsed.error === 'NOT_OBJECT') setFormError(t('admin.schedulerPage.toolArgsNotObject'))
                      else setFormError(t('admin.schedulerPage.toolArgsInvalidJson', { detail: parsed.detail || '' }))
                      return
                    }
                    setFormError(null)
                    setToolArgsText(JSON.stringify(parsed.value, null, 2))
                  }}
                >
                  {t('admin.schedulerPage.formatJson')}
                </button>
              </div>
            </div>

            <div className="SchedulerManager-field">
              <label className="SchedulerManager-check">
                <input type="checkbox" checked={enabled} onChange={e => setEnabled(e.target.checked)} />
                {t('admin.schedulerPage.enabled')}
              </label>
            </div>

            <div className="SchedulerManager-field SchedulerManager-fieldWide">
              <div className="SchedulerManager-label">{t('admin.schedulerPage.descriptionLabel')}</div>
              <input
                className="SchedulerManager-input"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder={t('admin.schedulerPage.descriptionPlaceholder')}
              />
            </div>
          </div>

          <div className="SchedulerManager-formActions">
            <button className="SchedulerManager-secondaryBtn" onClick={closeForm} disabled={saving}>
              {t('admin.schedulerPage.cancel')}
            </button>
            <button
              className="SchedulerManager-primaryBtn"
              onClick={submit}
              disabled={saving || !canSubmit}
            >
              {saving ? t('admin.schedulerPage.saving') : mode === 'create' ? t('admin.schedulerPage.create') : t('admin.schedulerPage.save')}
            </button>
          </div>
        </div>
      )}

      {jobs.length === 0 && !error && (
        <div className="SchedulerManager-empty">{t('admin.schedulerPage.empty')}</div>
      )}

      {jobs.length > 0 && (
        <div className="SchedulerManager-list">
          {jobs.map(job => (
            <div key={job.id} className="SchedulerManager-item">
              <div className="SchedulerManager-itemTop">
                <div className="SchedulerManager-itemMain">
                  <div className="SchedulerManager-itemTitleRow">
                    <div className="SchedulerManager-itemName">{job.name}</div>
                    <span className={`SchedulerManager-pill ${job.enabled ? 'isOn' : 'isOff'}`}>
                      {job.enabled ? t('admin.schedulerPage.active') : t('admin.schedulerPage.inactive')}
                    </span>
                  </div>
                  <div className="SchedulerManager-itemMeta">
                    <span className="mono">{job.cronExpression}</span>
                    <span className="dot">·</span>
                    <span className="mono">{job.timezone}</span>
                    <span className="dot">·</span>
                    <span className="mono">{job.mcpServerName}</span>
                    <span className="dot">·</span>
                    <span className="mono">{job.toolName}</span>
                  </div>
                  <div className="SchedulerManager-itemSub">
                    <span>{t('admin.schedulerPage.lastRun')}: {formatTs(job.lastRunAt)}</span>
                    {job.lastStatus ? <span className="dot">·</span> : null}
                    {job.lastStatus ? <span>{job.lastStatus}</span> : null}
                  </div>
                </div>

                <div className="SchedulerManager-itemActions">
                  <label className="SchedulerManager-toggle">
                    <input
                      type="checkbox"
                      checked={job.enabled}
                      onChange={e => handleToggleEnabled(job, e.target.checked)}
                    />
                    <span>{t('admin.schedulerPage.enabled')}</span>
                  </label>
                  <button
                    className="SchedulerManager-tertiaryBtn"
                    onClick={() => setExpandedId(expandedId === job.id ? null : job.id)}
                  >
                    {expandedId === job.id ? t('admin.schedulerPage.hideDetails') : t('admin.schedulerPage.details')}
                  </button>
                  <button
                    className="SchedulerManager-secondaryBtn"
                    onClick={() => handleTrigger(job)}
                    disabled={triggeringId === job.id}
                  >
                    {triggeringId === job.id ? t('admin.schedulerPage.triggering') : t('admin.schedulerPage.trigger')}
                  </button>
                  <button className="SchedulerManager-secondaryBtn" onClick={() => openEdit(job)}>
                    {t('admin.schedulerPage.edit')}
                  </button>
                  <button className="SchedulerManager-dangerBtn" onClick={() => handleDelete(job)}>
                    {t('admin.schedulerPage.delete')}
                  </button>
                </div>
              </div>

              {expandedId === job.id && (
                <div className="SchedulerManager-itemDetails">
                  {job.description ? <div className="SchedulerManager-detailRow">{job.description}</div> : null}
                  <div className="SchedulerManager-detailRow">
                    <div className="SchedulerManager-detailLabel">{t('admin.schedulerPage.slackChannel')}</div>
                    <div className="SchedulerManager-detailValue mono">{job.slackChannelId ?? '-'}</div>
                  </div>
                  <div className="SchedulerManager-detailRow">
                    <div className="SchedulerManager-detailLabel">{t('admin.schedulerPage.toolArgs')}</div>
                    <pre className="SchedulerManager-pre">{safeJsonStringify(job.toolArguments ?? {})}</pre>
                  </div>
                  <div className="SchedulerManager-detailRow">
                    <div className="SchedulerManager-detailLabel">{t('admin.schedulerPage.lastResult')}</div>
                    <pre className="SchedulerManager-pre">{job.lastResult ?? '-'}</pre>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
