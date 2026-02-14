import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import type { ScheduledJobResponse } from '../../../types/api'
import {
  listScheduledJobs,
  createScheduledJob,
  updateScheduledJob,
  deleteScheduledJob,
  triggerScheduledJob,
} from '../../../services/scheduler'
import './SchedulerPage.css'

type EditMode = 'none' | 'create' | 'edit'

export function SchedulerPage() {
  const { t } = useTranslation()
  const [jobs, setJobs] = useState<ScheduledJobResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editMode, setEditMode] = useState<EditMode>('none')
  const [editId, setEditId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [triggeringId, setTriggeringId] = useState<string | null>(null)

  // Form state
  const [formName, setFormName] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [formCron, setFormCron] = useState('')
  const [formTimezone, setFormTimezone] = useState('Asia/Seoul')
  const [formMcpServer, setFormMcpServer] = useState('')
  const [formToolName, setFormToolName] = useState('')
  const [formToolArgs, setFormToolArgs] = useState('')
  const [formSlackChannel, setFormSlackChannel] = useState('')
  const [formEnabled, setFormEnabled] = useState(true)

  const fetchJobs = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await listScheduledJobs()
      setJobs(data)
    } catch {
      setError(t('admin.schedulerPage.loadError'))
    } finally {
      setLoading(false)
    }
  }, [t])

  useEffect(() => {
    fetchJobs()
  }, [fetchJobs])

  const resetForm = () => {
    setFormName('')
    setFormDescription('')
    setFormCron('')
    setFormTimezone('Asia/Seoul')
    setFormMcpServer('')
    setFormToolName('')
    setFormToolArgs('')
    setFormSlackChannel('')
    setFormEnabled(true)
  }

  const openCreate = () => {
    setEditMode('create')
    setEditId(null)
    resetForm()
  }

  const openEdit = (job: ScheduledJobResponse) => {
    setEditMode('edit')
    setEditId(job.id)
    setFormName(job.name)
    setFormDescription(job.description || '')
    setFormCron(job.cronExpression)
    setFormTimezone(job.timezone)
    setFormMcpServer(job.mcpServerName)
    setFormToolName(job.toolName)
    setFormToolArgs(Object.keys(job.toolArguments).length > 0 ? JSON.stringify(job.toolArguments, null, 2) : '')
    setFormSlackChannel(job.slackChannelId || '')
    setFormEnabled(job.enabled)
  }

  const closeForm = () => {
    setEditMode('none')
    setEditId(null)
  }

  const isFormValid = () => {
    if (!formName.trim() || !formCron.trim() || !formMcpServer.trim() || !formToolName.trim()) return false
    if (formToolArgs.trim()) {
      try {
        JSON.parse(formToolArgs)
      } catch {
        return false
      }
    }
    return true
  }

  const handleSave = async () => {
    if (!isFormValid()) return
    setSaving(true)
    setError(null)
    try {
      const request = {
        name: formName.trim(),
        description: formDescription.trim() || undefined,
        cronExpression: formCron.trim(),
        timezone: formTimezone,
        mcpServerName: formMcpServer.trim(),
        toolName: formToolName.trim(),
        toolArguments: formToolArgs.trim() ? JSON.parse(formToolArgs) : undefined,
        slackChannelId: formSlackChannel.trim() || undefined,
        enabled: formEnabled,
      }
      if (editMode === 'create') {
        await createScheduledJob(request)
      } else if (editMode === 'edit' && editId) {
        await updateScheduledJob(editId, request)
      }
      await fetchJobs()
      closeForm()
    } catch {
      setError(t('admin.schedulerPage.saveError'))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm(t('admin.schedulerPage.deleteConfirm'))) return
    setError(null)
    try {
      await deleteScheduledJob(id)
      await fetchJobs()
    } catch {
      setError(t('admin.schedulerPage.deleteError'))
    }
  }

  const handleTrigger = async (id: string) => {
    setTriggeringId(id)
    setError(null)
    try {
      const { result } = await triggerScheduledJob(id)
      // Refresh to get updated lastRunAt/lastStatus
      await fetchJobs()
      // Show result briefly
      setError(null)
      alert(result)
    } catch {
      setError(t('admin.schedulerPage.triggerError'))
    } finally {
      setTriggeringId(null)
    }
  }

  const formatTimestamp = (ts: number | null) => {
    if (!ts) return '-'
    return new Date(ts).toLocaleString()
  }

  const statusClass = (status: string | null) => {
    switch (status) {
      case 'SUCCESS': return 'SchedulerPage-statusSuccess'
      case 'FAILED': return 'SchedulerPage-statusFailed'
      case 'RUNNING': return 'SchedulerPage-statusRunning'
      default: return ''
    }
  }

  return (
    <div className="SchedulerPage">
      <div className="SchedulerPage-header">
        <div>
          <h1 className="SchedulerPage-title">{t('admin.schedulerPage.title')}</h1>
          <p className="SchedulerPage-desc">{t('admin.schedulerPage.description')}</p>
        </div>
        {editMode === 'none' && (
          <button className="SchedulerPage-addBtn" onClick={openCreate}>
            {t('admin.schedulerPage.newJob')}
          </button>
        )}
      </div>

      {error && <div className="SchedulerPage-error">{error}</div>}

      {editMode !== 'none' && (
        <div className="SchedulerPage-form">
          <h3 className="SchedulerPage-formTitle">
            {editMode === 'create' ? t('admin.schedulerPage.createTitle') : t('admin.schedulerPage.editTitle')}
          </h3>
          <div className="SchedulerPage-formGrid">
            <div className="SchedulerPage-field">
              <label className="SchedulerPage-label">{t('admin.schedulerPage.name')}</label>
              <input
                className="SchedulerPage-input"
                value={formName}
                onChange={e => setFormName(e.target.value)}
                placeholder={t('admin.schedulerPage.namePlaceholder')}
              />
            </div>
            <div className="SchedulerPage-field">
              <label className="SchedulerPage-label">{t('admin.schedulerPage.cron')}</label>
              <input
                className="SchedulerPage-input"
                value={formCron}
                onChange={e => setFormCron(e.target.value)}
                placeholder="0 0 9 * * *"
              />
            </div>
            <div className="SchedulerPage-field">
              <label className="SchedulerPage-label">{t('admin.schedulerPage.mcpServer')}</label>
              <input
                className="SchedulerPage-input"
                value={formMcpServer}
                onChange={e => setFormMcpServer(e.target.value)}
                placeholder={t('admin.schedulerPage.mcpServerPlaceholder')}
              />
            </div>
            <div className="SchedulerPage-field">
              <label className="SchedulerPage-label">{t('admin.schedulerPage.toolName')}</label>
              <input
                className="SchedulerPage-input"
                value={formToolName}
                onChange={e => setFormToolName(e.target.value)}
                placeholder={t('admin.schedulerPage.toolNamePlaceholder')}
              />
            </div>
            <div className="SchedulerPage-field">
              <label className="SchedulerPage-label">{t('admin.schedulerPage.timezone')}</label>
              <input
                className="SchedulerPage-input"
                value={formTimezone}
                onChange={e => setFormTimezone(e.target.value)}
                placeholder="Asia/Seoul"
              />
            </div>
            <div className="SchedulerPage-field">
              <label className="SchedulerPage-label">{t('admin.schedulerPage.slackChannel')}</label>
              <input
                className="SchedulerPage-input"
                value={formSlackChannel}
                onChange={e => setFormSlackChannel(e.target.value)}
                placeholder={t('admin.schedulerPage.slackChannelPlaceholder')}
              />
            </div>
          </div>
          <div className="SchedulerPage-field">
            <label className="SchedulerPage-label">{t('admin.schedulerPage.description')}</label>
            <input
              className="SchedulerPage-input"
              value={formDescription}
              onChange={e => setFormDescription(e.target.value)}
              placeholder={t('admin.schedulerPage.descriptionPlaceholder')}
            />
          </div>
          <div className="SchedulerPage-field">
            <label className="SchedulerPage-label">{t('admin.schedulerPage.toolArgs')}</label>
            <textarea
              className="SchedulerPage-textarea"
              value={formToolArgs}
              onChange={e => setFormToolArgs(e.target.value)}
              placeholder='{"categoryId": "tech"}'
              rows={3}
            />
          </div>
          <label className="SchedulerPage-checkLabel">
            <input
              type="checkbox"
              checked={formEnabled}
              onChange={e => setFormEnabled(e.target.checked)}
            />
            {t('admin.schedulerPage.enabled')}
          </label>
          <div className="SchedulerPage-formActions">
            <button
              className="SchedulerPage-saveBtn"
              onClick={handleSave}
              disabled={saving || !isFormValid()}
            >
              {saving ? t('admin.schedulerPage.saving') : editMode === 'create' ? t('admin.schedulerPage.create') : t('admin.schedulerPage.save')}
            </button>
            <button className="SchedulerPage-cancelBtn" onClick={closeForm}>
              {t('admin.schedulerPage.cancel')}
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="SchedulerPage-loading">{t('admin.schedulerPage.loading')}</div>
      ) : jobs.length === 0 ? (
        <div className="SchedulerPage-empty">{t('admin.schedulerPage.empty')}</div>
      ) : (
        <div className="SchedulerPage-list">
          {jobs.map(job => (
            <div key={job.id} className="SchedulerPage-card">
              <div className="SchedulerPage-cardHeader">
                <div className="SchedulerPage-cardTitle">
                  <span className="SchedulerPage-cardName">{job.name}</span>
                  <span className={`SchedulerPage-badge ${job.enabled ? 'SchedulerPage-badgeActive' : 'SchedulerPage-badgeInactive'}`}>
                    {job.enabled ? t('admin.schedulerPage.active') : t('admin.schedulerPage.inactive')}
                  </span>
                  {job.lastStatus && (
                    <span className={`SchedulerPage-badge ${statusClass(job.lastStatus)}`}>
                      {job.lastStatus}
                    </span>
                  )}
                </div>
                <div className="SchedulerPage-cardActions">
                  <button
                    className="SchedulerPage-triggerBtn"
                    onClick={() => handleTrigger(job.id)}
                    disabled={triggeringId === job.id}
                  >
                    {triggeringId === job.id ? t('admin.schedulerPage.triggering') : t('admin.schedulerPage.trigger')}
                  </button>
                  <button className="SchedulerPage-editBtn" onClick={() => openEdit(job)}>
                    {t('admin.schedulerPage.edit')}
                  </button>
                  <button className="SchedulerPage-deleteBtn" onClick={() => handleDelete(job.id)}>
                    {t('admin.schedulerPage.delete')}
                  </button>
                </div>
              </div>
              {job.description && (
                <div className="SchedulerPage-cardDesc">{job.description}</div>
              )}
              <div className="SchedulerPage-cardMeta">
                <span className="SchedulerPage-metaItem">
                  <span className="SchedulerPage-metaLabel">{t('admin.schedulerPage.cron')}</span>
                  <code>{job.cronExpression}</code>
                </span>
                <span className="SchedulerPage-metaItem">
                  <span className="SchedulerPage-metaLabel">{t('admin.schedulerPage.mcpServer')}</span>
                  {job.mcpServerName}
                </span>
                <span className="SchedulerPage-metaItem">
                  <span className="SchedulerPage-metaLabel">{t('admin.schedulerPage.toolName')}</span>
                  <code>{job.toolName}</code>
                </span>
                {job.slackChannelId && (
                  <span className="SchedulerPage-metaItem">
                    <span className="SchedulerPage-metaLabel">Slack</span>
                    {job.slackChannelId}
                  </span>
                )}
                <span className="SchedulerPage-metaItem">
                  <span className="SchedulerPage-metaLabel">{t('admin.schedulerPage.lastRun')}</span>
                  {formatTimestamp(job.lastRunAt)}
                </span>
              </div>
              {job.lastResult && (
                <div className="SchedulerPage-cardResult">
                  <span className="SchedulerPage-metaLabel">{t('admin.schedulerPage.lastResult')}</span>
                  <pre className="SchedulerPage-resultPre">{job.lastResult}</pre>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
