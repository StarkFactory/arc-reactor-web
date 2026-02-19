import { useState, useMemo, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslation } from 'react-i18next'
import type { ScheduledJobResponse } from '../../types/api'
import { useMcpServers } from '../../hooks/useMcpServers'
import { listMcpServers as fetchMcpServerList, getMcpServer } from '../../services/mcp'
import {
  useScheduledJobs,
  useCreateScheduledJob,
  useUpdateScheduledJob,
  useDeleteScheduledJob,
  useTriggerScheduledJob,
} from '../../hooks/useScheduler'
import {
  SchedulerFormSchema,
  EMPTY_SCHEDULER_FORM,
  type SchedulerFormInput,
} from '../../schemas/scheduler'
import './SchedulerManager.css'

type Mode = 'view' | 'create' | 'edit'

function safeJsonStringify(value: unknown): string {
  try {
    return JSON.stringify(value ?? {}, null, 2)
  } catch {
    return '{}'
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

function toFormValues(job: ScheduledJobResponse): SchedulerFormInput {
  return {
    name: job.name ?? '',
    description: job.description ?? '',
    cronExpression: job.cronExpression ?? '',
    timezone: job.timezone ?? 'Asia/Seoul',
    mcpServerName: job.mcpServerName ?? '',
    toolName: job.toolName ?? '',
    toolArgsText: safeJsonStringify(job.toolArguments ?? {}),
    slackChannelId: job.slackChannelId ?? '',
    enabled: !!job.enabled,
  }
}

interface McpToolSelectorProps {
  mcpServerName: string
  toolName: string
  mcpServers: { id: string; name: string }[]
  toolsByServer: Record<string, string[]>
  onServerChange: (name: string) => void
  onToolChange: (name: string) => void
}

function McpToolSelector({
  mcpServerName,
  toolName,
  mcpServers,
  toolsByServer,
  onServerChange,
  onToolChange,
}: McpToolSelectorProps) {
  const { t } = useTranslation()
  const tools = toolsByServer[mcpServerName] ?? []

  return (
    <>
      <div className="SchedulerManager-field">
        <div className="SchedulerManager-label">{t('admin.schedulerPage.mcpServer')}</div>
        <select
          className="SchedulerManager-select"
          value={mcpServerName}
          onChange={e => {
            onServerChange(e.target.value)
            onToolChange('')
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
          onChange={e => onToolChange(e.target.value)}
          disabled={!mcpServerName}
        >
          <option value="">{t('admin.schedulerPage.toolNamePlaceholder')}</option>
          {tools.map(tn => (
            <option key={tn} value={tn}>
              {tn}
            </option>
          ))}
        </select>
      </div>
    </>
  )
}

export function SchedulerManager() {
  const { t } = useTranslation()
  const [mode, setMode] = useState<Mode>('view')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [toolsByServer, setToolsByServer] = useState<Record<string, string[]>>({})
  const [toolsLoading, setToolsLoading] = useState(false)

  const { data: rawJobs = [], isLoading: jobsLoading, error: jobsError, refetch: refetchJobs } = useScheduledJobs()
  const { data: mcpServers = [] } = useMcpServers()

  const jobs = useMemo(
    () => rawJobs.slice().sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0)),
    [rawJobs],
  )

  const createJob = useCreateScheduledJob()
  const updateJob = useUpdateScheduledJob()
  const deleteJob = useDeleteScheduledJob()
  const triggerJob = useTriggerScheduledJob()

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isValid },
  } = useForm<SchedulerFormInput>({
    resolver: zodResolver(SchedulerFormSchema),
    defaultValues: EMPTY_SCHEDULER_FORM,
    mode: 'onChange',
  })

  const mcpServerName = watch('mcpServerName')
  const toolName = watch('toolName')
  const toolArgsText = watch('toolArgsText')

  // Load MCP tools for all connected servers
  const loadMcpTools = async () => {
    setToolsLoading(true)
    try {
      const servers = await fetchMcpServerList()
      const out: Record<string, string[]> = {}
      await Promise.all(
        servers.map(async s => {
          try {
            const detail = await getMcpServer(s.name)
            out[s.name] = (detail.tools ?? []).slice().sort()
          } catch {
            out[s.name] = []
          }
        }),
      )
      setToolsByServer(out)
    } catch {
      // ignore
    } finally {
      setToolsLoading(false)
    }
  }

  // Load MCP server details on mount using the service directly
  useEffect(() => {
    fetchMcpServerList()
      .then(async servers => {
        const out: Record<string, string[]> = {}
        await Promise.all(
          servers.map(async s => {
            try {
              const detail = await getMcpServer(s.name)
              out[s.name] = (detail.tools ?? []).slice().sort()
            } catch {
              out[s.name] = []
            }
          }),
        )
        setToolsByServer(out)
      })
      .catch(() => {})
  }, [])

  const openCreate = () => {
    reset(EMPTY_SCHEDULER_FORM)
    setEditingId(null)
    setMode('create')
  }

  const openEdit = (job: ScheduledJobResponse) => {
    reset(toFormValues(job))
    setEditingId(job.id)
    setMode('edit')
  }

  const closeForm = () => {
    setMode('view')
    setEditingId(null)
    setActionError(null)
  }

  const onSubmit = async (values: SchedulerFormInput) => {
    setActionError(null)
    let toolArguments: Record<string, unknown> = {}
    try {
      const raw = values.toolArgsText.trim()
      if (raw && raw !== '{}') {
        toolArguments = JSON.parse(raw) as Record<string, unknown>
      }
    } catch {
      setActionError(t('admin.schedulerPage.toolArgsInvalidJson', { detail: '' }))
      return
    }

    const base = {
      name: values.name.trim(),
      description: values.description.trim() || null,
      cronExpression: values.cronExpression.trim(),
      timezone: values.timezone.trim() || 'Asia/Seoul',
      mcpServerName: values.mcpServerName.trim(),
      toolName: values.toolName.trim(),
      toolArguments,
      slackChannelId: values.slackChannelId.trim() || null,
      enabled: values.enabled,
    }

    try {
      if (mode === 'create') {
        await createJob.mutateAsync(base)
      } else if (mode === 'edit' && editingId) {
        await updateJob.mutateAsync({ id: editingId, data: base })
      }
      closeForm()
    } catch {
      setActionError(t('admin.schedulerPage.saveError'))
    }
  }

  const handleDelete = async (job: ScheduledJobResponse) => {
    if (!confirm(t('admin.schedulerPage.deleteConfirm'))) return
    setActionError(null)
    try {
      await deleteJob.mutateAsync(job.id)
    } catch {
      setActionError(t('admin.schedulerPage.deleteError'))
    }
  }

  const handleTrigger = async (job: ScheduledJobResponse) => {
    setActionError(null)
    try {
      const res = await triggerJob.mutateAsync(job.id)
      alert(res?.result ?? 'OK')
    } catch {
      setActionError(t('admin.schedulerPage.triggerError'))
    }
  }

  const handleToggleEnabled = async (job: ScheduledJobResponse, nextEnabled: boolean) => {
    setActionError(null)
    try {
      await updateJob.mutateAsync({
        id: job.id,
        data: {
          name: job.name,
          description: job.description,
          cronExpression: job.cronExpression,
          timezone: job.timezone,
          mcpServerName: job.mcpServerName,
          toolName: job.toolName,
          toolArguments: job.toolArguments ?? {},
          slackChannelId: job.slackChannelId,
          enabled: nextEnabled,
        },
      })
    } catch {
      setActionError(t('admin.schedulerPage.saveError'))
    }
  }

  const isSaving = createJob.isPending || updateJob.isPending

  if (jobsLoading) {
    return <div className="SchedulerManager-loading">{t('admin.schedulerPage.loading')}</div>
  }

  const jobsErrorMsg = jobsError
    ? jobsError.message.includes('HTTP 404') || jobsError.message.includes('HTTP 503')
      ? t('admin.schedulerPage.disabled')
      : t('admin.schedulerPage.loadError')
    : null

  return (
    <div className="SchedulerManager">
      <div className="SchedulerManager-header">
        <div className="SchedulerManager-headerLeft">
          <div className="SchedulerManager-count">{jobs.length > 0 ? `${jobs.length}` : ''}</div>
          <button className="SchedulerManager-refreshBtn" onClick={() => refetchJobs()}>
            {t('admin.schedulerPage.refresh')}
          </button>
        </div>
        <div className="SchedulerManager-headerRight">
          <button
            className="SchedulerManager-secondaryBtn"
            onClick={loadMcpTools}
            disabled={toolsLoading}
          >
            {toolsLoading
              ? t('admin.schedulerPage.reloadingTools')
              : t('admin.schedulerPage.reloadTools')}
          </button>
          <button className="SchedulerManager-primaryBtn" onClick={openCreate}>
            {t('admin.schedulerPage.newJob')}
          </button>
        </div>
      </div>

      {(jobsErrorMsg || actionError) && (
        <div className="SchedulerManager-error">{jobsErrorMsg ?? actionError}</div>
      )}

      {mode !== 'view' && (
        <form className="SchedulerManager-form" onSubmit={handleSubmit(onSubmit)}>
          <div className="SchedulerManager-formTitle">
            {mode === 'create'
              ? t('admin.schedulerPage.createTitle')
              : t('admin.schedulerPage.editTitle')}
          </div>

          <div className="SchedulerManager-grid">
            <div className="SchedulerManager-field">
              <div className="SchedulerManager-label">{t('admin.schedulerPage.name')}</div>
              <input
                className="SchedulerManager-input"
                {...register('name')}
                placeholder={t('admin.schedulerPage.namePlaceholder')}
              />
              {errors.name && (
                <div className="SchedulerManager-formError">{errors.name.message}</div>
              )}
            </div>

            <div className="SchedulerManager-field">
              <div className="SchedulerManager-label">{t('admin.schedulerPage.cron')}</div>
              <input
                className="SchedulerManager-input"
                {...register('cronExpression')}
                placeholder="0 0 * * *"
              />
              {errors.cronExpression && (
                <div className="SchedulerManager-formError">{errors.cronExpression.message}</div>
              )}
            </div>

            <div className="SchedulerManager-field">
              <div className="SchedulerManager-label">{t('admin.schedulerPage.timezone')}</div>
              <input
                className="SchedulerManager-input"
                {...register('timezone')}
                placeholder="Asia/Seoul"
              />
            </div>

            <McpToolSelector
              mcpServerName={mcpServerName}
              toolName={toolName}
              mcpServers={mcpServers}
              toolsByServer={toolsByServer}
              onServerChange={name => setValue('mcpServerName', name, { shouldValidate: true })}
              onToolChange={name => setValue('toolName', name, { shouldValidate: true })}
            />

            <div className="SchedulerManager-field">
              <div className="SchedulerManager-label">{t('admin.schedulerPage.slackChannel')}</div>
              <input
                className="SchedulerManager-input"
                {...register('slackChannelId')}
                placeholder={t('admin.schedulerPage.slackChannelPlaceholder')}
              />
            </div>

            <div className="SchedulerManager-field SchedulerManager-fieldWide">
              <div className="SchedulerManager-label">{t('admin.schedulerPage.toolArgs')}</div>
              <textarea
                className="SchedulerManager-textarea"
                {...register('toolArgsText')}
                rows={8}
                spellCheck={false}
              />
              {errors.toolArgsText && (
                <div className="SchedulerManager-formError">{errors.toolArgsText.message}</div>
              )}
              <div className="SchedulerManager-hintRow">
                <button
                  className="SchedulerManager-tertiaryBtn"
                  type="button"
                  onClick={() => {
                    try {
                      const raw = toolArgsText.trim()
                      if (!raw) return
                      const parsed = JSON.parse(raw)
                      setValue('toolArgsText', JSON.stringify(parsed, null, 2))
                    } catch {
                      // leave as-is
                    }
                  }}
                >
                  {t('admin.schedulerPage.formatJson')}
                </button>
              </div>
            </div>

            <div className="SchedulerManager-field">
              <label className="SchedulerManager-check">
                <input type="checkbox" {...register('enabled')} />
                {t('admin.schedulerPage.enabled')}
              </label>
            </div>

            <div className="SchedulerManager-field SchedulerManager-fieldWide">
              <div className="SchedulerManager-label">
                {t('admin.schedulerPage.descriptionLabel')}
              </div>
              <input
                className="SchedulerManager-input"
                {...register('description')}
                placeholder={t('admin.schedulerPage.descriptionPlaceholder')}
              />
            </div>
          </div>

          <div className="SchedulerManager-formActions">
            <button
              type="button"
              className="SchedulerManager-secondaryBtn"
              onClick={closeForm}
              disabled={isSaving}
            >
              {t('admin.schedulerPage.cancel')}
            </button>
            <button
              type="submit"
              className="SchedulerManager-primaryBtn"
              disabled={isSaving || !isValid}
            >
              {isSaving
                ? t('admin.schedulerPage.saving')
                : mode === 'create'
                  ? t('admin.schedulerPage.create')
                  : t('admin.schedulerPage.save')}
            </button>
          </div>
        </form>
      )}

      {jobs.length === 0 && !jobsErrorMsg && (
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
                      {job.enabled
                        ? t('admin.schedulerPage.active')
                        : t('admin.schedulerPage.inactive')}
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
                    <span>
                      {t('admin.schedulerPage.lastRun')}: {formatTs(job.lastRunAt)}
                    </span>
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
                    {expandedId === job.id
                      ? t('admin.schedulerPage.hideDetails')
                      : t('admin.schedulerPage.details')}
                  </button>
                  <button
                    className="SchedulerManager-secondaryBtn"
                    onClick={() => handleTrigger(job)}
                    disabled={triggerJob.isPending && triggerJob.variables === job.id}
                  >
                    {triggerJob.isPending && triggerJob.variables === job.id
                      ? t('admin.schedulerPage.triggering')
                      : t('admin.schedulerPage.trigger')}
                  </button>
                  <button className="SchedulerManager-secondaryBtn" onClick={() => openEdit(job)}>
                    {t('admin.schedulerPage.edit')}
                  </button>
                  <button
                    className="SchedulerManager-dangerBtn"
                    onClick={() => handleDelete(job)}
                  >
                    {t('admin.schedulerPage.delete')}
                  </button>
                </div>
              </div>

              {expandedId === job.id && (
                <div className="SchedulerManager-itemDetails">
                  {job.description ? (
                    <div className="SchedulerManager-detailRow">{job.description}</div>
                  ) : null}
                  <div className="SchedulerManager-detailRow">
                    <div className="SchedulerManager-detailLabel">
                      {t('admin.schedulerPage.slackChannel')}
                    </div>
                    <div className="SchedulerManager-detailValue mono">
                      {job.slackChannelId ?? '-'}
                    </div>
                  </div>
                  <div className="SchedulerManager-detailRow">
                    <div className="SchedulerManager-detailLabel">
                      {t('admin.schedulerPage.toolArgs')}
                    </div>
                    <pre className="SchedulerManager-pre">
                      {safeJsonStringify(job.toolArguments ?? {})}
                    </pre>
                  </div>
                  <div className="SchedulerManager-detailRow">
                    <div className="SchedulerManager-detailLabel">
                      {t('admin.schedulerPage.lastResult')}
                    </div>
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
