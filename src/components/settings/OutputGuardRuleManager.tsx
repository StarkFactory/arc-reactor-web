import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslation } from 'react-i18next'
import type { OutputGuardSimulationResponse } from '../../types/api'
import {
  useOutputGuardRules,
  useOutputGuardAudits,
  useCreateOutputGuardRule,
  useUpdateOutputGuardRule,
  useDeleteOutputGuardRule,
  useSimulateOutputGuard,
} from '../../hooks/useOutputGuard'
import {
  OutputGuardFormSchema,
  EMPTY_OUTPUT_GUARD_FORM,
  type OutputGuardFormInput,
} from '../../schemas/output-guard'
import './OutputGuardRuleManager.css'

type Mode = 'none' | 'create' | 'edit'

export function OutputGuardRuleManager() {
  const { t } = useTranslation()
  const [expanded, setExpanded] = useState<string | null>(null)
  const [mode, setMode] = useState<Mode>('none')
  const [editId, setEditId] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  // Simulation local state (not a form)
  const [simContent, setSimContent] = useState('')
  const [simIncludeDisabled, setSimIncludeDisabled] = useState(false)
  const [simResult, setSimResult] = useState<OutputGuardSimulationResponse | null>(null)

  const { data: items = [], isLoading } = useOutputGuardRules()
  const { data: audits = [] } = useOutputGuardAudits()
  const createRule = useCreateOutputGuardRule()
  const updateRule = useUpdateOutputGuardRule()
  const deleteRule = useDeleteOutputGuardRule()
  const simulate = useSimulateOutputGuard()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isValid },
  } = useForm<OutputGuardFormInput>({
    resolver: zodResolver(OutputGuardFormSchema),
    defaultValues: EMPTY_OUTPUT_GUARD_FORM,
    mode: 'onChange',
  })

  const openCreate = () => {
    reset(EMPTY_OUTPUT_GUARD_FORM)
    setEditId(null)
    setMode('create')
    setActionError(null)
  }

  const openEdit = (rule: { id: string; name: string; pattern: string; action: string; priority: number; enabled: boolean }) => {
    reset({
      name: rule.name,
      pattern: rule.pattern,
      action: rule.action,
      priority: String(rule.priority),
      enabled: rule.enabled,
    })
    setEditId(rule.id)
    setMode('edit')
    setActionError(null)
  }

  const closeForm = () => {
    setMode('none')
    setEditId(null)
    setActionError(null)
  }

  const onSubmit = async (values: OutputGuardFormInput) => {
    setActionError(null)
    const body = {
      name: values.name.trim(),
      pattern: values.pattern.trim(),
      action: values.action.trim() || 'MASK',
      priority: Number(values.priority) || 100,
      enabled: values.enabled,
    }

    try {
      if (mode === 'create') {
        await createRule.mutateAsync(body)
      } else if (mode === 'edit' && editId) {
        await updateRule.mutateAsync({ id: editId, data: body })
      }
      closeForm()
    } catch (e) {
      setActionError(e instanceof Error ? e.message : t('outputGuard.saveError'))
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm(t('outputGuard.deleteConfirm'))) return
    setActionError(null)
    try {
      await deleteRule.mutateAsync(id)
      if (expanded === id) setExpanded(null)
    } catch {
      setActionError(t('outputGuard.deleteError'))
    }
  }

  const handleSimulate = async () => {
    if (!simContent.trim()) return
    setSimResult(null)
    setActionError(null)
    try {
      const res = await simulate.mutateAsync({ content: simContent.trim(), includeDisabled: simIncludeDisabled })
      setSimResult(res)
    } catch (e) {
      setActionError(e instanceof Error ? e.message : t('outputGuard.simulateError'))
    }
  }

  const isSaving = createRule.isPending || updateRule.isPending

  if (isLoading) {
    return <div className="OutputGuardManager-loading">{t('outputGuard.loading')}</div>
  }

  return (
    <div className="OutputGuardManager">
      <div className="OutputGuardManager-header">
        <span className="OutputGuardManager-count">
          {items.length > 0 ? t('outputGuard.count', { count: items.length }) : ''}
        </span>
        <button
          className="OutputGuardManager-addBtn"
          onClick={mode === 'none' ? openCreate : closeForm}
        >
          {mode === 'none' ? '+' : '\u00d7'}
        </button>
      </div>

      {actionError && <div className="OutputGuardManager-error">{actionError}</div>}

      {mode !== 'none' && (
        <form className="OutputGuardManager-form" onSubmit={handleSubmit(onSubmit)}>
          <div className="OutputGuardManager-formTitle">
            {mode === 'create' ? t('outputGuard.createTitle') : t('outputGuard.editTitle')}
          </div>

          <input
            className="OutputGuardManager-input"
            {...register('name')}
            placeholder={t('outputGuard.namePlaceholder')}
          />
          {errors.name && <span className="OutputGuardManager-fieldError">{errors.name.message}</span>}

          <textarea
            className="OutputGuardManager-textarea"
            {...register('pattern')}
            placeholder={t('outputGuard.patternPlaceholder')}
            rows={3}
          />
          {errors.pattern && (
            <span className="OutputGuardManager-fieldError">{errors.pattern.message}</span>
          )}

          <div className="OutputGuardManager-row">
            <select className="OutputGuardManager-select" {...register('action')}>
              <option value="MASK">MASK</option>
              <option value="REJECT">REJECT</option>
            </select>
            <input
              className="OutputGuardManager-input"
              {...register('priority')}
              placeholder={t('outputGuard.priorityPlaceholder')}
            />
          </div>

          <label className="OutputGuardManager-checkLabel">
            <input type="checkbox" {...register('enabled')} />
            {t('outputGuard.enabled')}
          </label>

          <div className="OutputGuardManager-formActions">
            <button
              type="submit"
              className="OutputGuardManager-saveBtn"
              disabled={isSaving || !isValid}
            >
              {isSaving ? t('outputGuard.saving') : t('outputGuard.save')}
            </button>
            <button type="button" className="OutputGuardManager-cancelBtn" onClick={closeForm}>
              {t('outputGuard.cancel')}
            </button>
          </div>
        </form>
      )}

      <div className="OutputGuardManager-sectionTitle">{t('outputGuard.rules')}</div>

      {items.length === 0 ? (
        <div className="OutputGuardManager-empty">{t('outputGuard.empty')}</div>
      ) : (
        <div className="OutputGuardManager-list">
          {items.map(rule => (
            <div key={rule.id} className="OutputGuardManager-item">
              <div className="OutputGuardManager-itemTop">
                <button
                  className="OutputGuardManager-nameBtn"
                  onClick={() => setExpanded(expanded === rule.id ? null : rule.id)}
                >
                  {rule.name}
                </button>
                <span
                  className={`OutputGuardManager-badge${rule.enabled ? '' : ' OutputGuardManager-badge--disabled'}`}
                >
                  {rule.enabled ? t('outputGuard.enabledYes') : t('outputGuard.enabledNo')}
                </span>
              </div>
              <div className="OutputGuardManager-meta">
                <span className="OutputGuardManager-chip">{rule.action}</span>
                <span className="OutputGuardManager-chip">
                  {t('outputGuard.priority', { value: rule.priority })}
                </span>
              </div>

              {expanded === rule.id && (
                <div className="OutputGuardManager-detail">
                  <pre className="OutputGuardManager-pattern">{rule.pattern}</pre>
                  <div className="OutputGuardManager-actions">
                    <button className="OutputGuardManager-actionBtn" onClick={() => openEdit(rule)}>
                      {t('outputGuard.edit')}
                    </button>
                    <button
                      className="OutputGuardManager-actionBtn OutputGuardManager-actionBtn--danger"
                      onClick={() => handleDelete(rule.id)}
                    >
                      {t('outputGuard.delete')}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="OutputGuardManager-sectionTitle">{t('outputGuard.simulation')}</div>
      <div className="OutputGuardManager-sim">
        <textarea
          className="OutputGuardManager-textarea"
          value={simContent}
          onChange={e => setSimContent(e.target.value)}
          placeholder={t('outputGuard.simulationPlaceholder')}
          rows={3}
        />
        <label className="OutputGuardManager-checkLabel">
          <input
            type="checkbox"
            checked={simIncludeDisabled}
            onChange={e => setSimIncludeDisabled(e.target.checked)}
          />
          {t('outputGuard.includeDisabled')}
        </label>
        <button
          className="OutputGuardManager-saveBtn"
          onClick={handleSimulate}
          disabled={simulate.isPending || !simContent.trim()}
        >
          {simulate.isPending ? t('outputGuard.simulating') : t('outputGuard.simulate')}
        </button>

        {simResult && (
          <div className="OutputGuardManager-simResult">
            <div className="OutputGuardManager-simRow">
              <span>{t('outputGuard.blocked')}</span>
              <b>{String(simResult.blocked)}</b>
            </div>
            <div className="OutputGuardManager-simRow">
              <span>{t('outputGuard.modified')}</span>
              <b>{String(simResult.modified)}</b>
            </div>
            {simResult.blockedByRuleName && (
              <div className="OutputGuardManager-simRow">
                <span>{t('outputGuard.blockedBy')}</span>
                <b>{simResult.blockedByRuleName}</b>
              </div>
            )}
            <pre className="OutputGuardManager-pattern">{simResult.resultContent}</pre>
          </div>
        )}
      </div>

      <div className="OutputGuardManager-sectionTitle">{t('outputGuard.audits')}</div>
      <div className="OutputGuardManager-audits">
        {audits.length === 0 ? (
          <div className="OutputGuardManager-empty">{t('outputGuard.noAudits')}</div>
        ) : (
          audits.map((a, idx) => (
            <div key={idx} className="OutputGuardManager-auditRow">
              <span className="OutputGuardManager-chip">{a.action}</span>
              <span className="OutputGuardManager-auditActor">{a.actor}</span>
              <span className="OutputGuardManager-auditDetail">{a.detail || ''}</span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
