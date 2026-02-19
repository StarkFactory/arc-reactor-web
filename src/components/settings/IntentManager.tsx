import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslation } from 'react-i18next'
import type { IntentProfile, IntentResponse, IntentResponseFormat } from '../../types/api'
import { useIntents, useCreateIntent, useUpdateIntent, useDeleteIntent } from '../../hooks/useIntents'
import { IntentFormSchema, type IntentFormInput } from '../../schemas/intent'
import './IntentManager.css'

type Mode = 'none' | 'create' | 'edit'

function splitLines(text: string): string[] {
  return text.split('\n').map(s => s.trim()).filter(Boolean)
}

function splitCsv(text: string): string[] {
  return text.split(',').map(s => s.trim()).filter(Boolean)
}

function buildProfile(data: IntentFormInput): IntentProfile {
  const temperature = data.profileTemp.trim() ? Number(data.profileTemp) : null
  const maxToolCalls = data.profileMaxToolCalls.trim() ? Number(data.profileMaxToolCalls) : null
  const allowedTools = data.profileAllowedTools.trim() ? splitCsv(data.profileAllowedTools) : null

  return {
    model: data.profileModel.trim() || null,
    temperature: Number.isFinite(temperature) ? temperature : null,
    maxToolCalls: Number.isFinite(maxToolCalls) ? maxToolCalls : null,
    allowedTools,
    systemPrompt: data.profileSystemPrompt.trim() || null,
    responseFormat: (data.profileResponseFormat.trim() || null) as IntentResponseFormat | null,
  }
}

function intentToFormValues(intent: IntentResponse): IntentFormInput {
  const p = intent.profile ?? ({} as IntentProfile)
  return {
    name: intent.name,
    description: intent.description,
    examplesText: (intent.examples ?? []).join('\n'),
    keywordsText: (intent.keywords ?? []).join(', '),
    enabled: intent.enabled,
    profileModel: p.model ?? '',
    profileTemp: p.temperature != null ? String(p.temperature) : '',
    profileMaxToolCalls: p.maxToolCalls != null ? String(p.maxToolCalls) : '',
    profileAllowedTools: (p.allowedTools ?? []).join(', '),
    profileSystemPrompt: p.systemPrompt ?? '',
    profileResponseFormat: p.responseFormat ?? '',
  }
}

const EMPTY_FORM: IntentFormInput = {
  name: '',
  description: '',
  examplesText: '',
  keywordsText: '',
  enabled: true,
  profileModel: '',
  profileTemp: '',
  profileMaxToolCalls: '',
  profileAllowedTools: '',
  profileSystemPrompt: '',
  profileResponseFormat: '',
}

export function IntentManager() {
  const { t } = useTranslation()
  const [mode, setMode] = useState<Mode>('none')
  const [editName, setEditName] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)

  const { data: items = [], isLoading, error: loadError } = useIntents()
  const createMutation = useCreateIntent()
  const updateMutation = useUpdateIntent()
  const deleteMutation = useDeleteIntent()

  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<IntentFormInput>({
    resolver: zodResolver(IntentFormSchema),
    defaultValues: EMPTY_FORM,
  })

  const openCreate = () => {
    reset(EMPTY_FORM)
    setEditName(null)
    setFormError(null)
    setMode('create')
  }

  const openEdit = (intent: IntentResponse) => {
    reset(intentToFormValues(intent))
    setEditName(intent.name)
    setFormError(null)
    setMode('edit')
  }

  const closeForm = () => {
    setMode('none')
    setEditName(null)
    setFormError(null)
    reset()
  }

  const onSubmit = handleSubmit(async (data) => {
    setFormError(null)
    try {
      if (mode === 'create') {
        await createMutation.mutateAsync({
          name: data.name.trim(),
          description: data.description.trim(),
          examples: splitLines(data.examplesText),
          keywords: splitCsv(data.keywordsText),
          profile: buildProfile(data),
          enabled: data.enabled,
        })
      } else if (mode === 'edit' && editName) {
        await updateMutation.mutateAsync({
          name: editName,
          data: {
            description: data.description.trim(),
            examples: splitLines(data.examplesText),
            keywords: splitCsv(data.keywordsText),
            profile: buildProfile(data),
            enabled: data.enabled,
          },
        })
      }
      closeForm()
    } catch (e) {
      if (e instanceof Error && e.message === 'CONFLICT') {
        setFormError(t('intent.duplicateError'))
      } else {
        setFormError(t('intent.saveError'))
      }
    }
  })

  const handleDelete = async (intentName: string) => {
    if (!confirm(t('intent.deleteConfirm'))) return
    try {
      await deleteMutation.mutateAsync(intentName)
      if (expanded === intentName) setExpanded(null)
    } catch {
      setFormError(t('intent.deleteError'))
    }
  }

  if (isLoading) {
    return <div className="IntentManager-loading">{t('intent.loading')}</div>
  }

  return (
    <div className="IntentManager">
      <div className="IntentManager-header">
        <span className="IntentManager-count">
          {items.length > 0 ? t('intent.count', { count: items.length }) : ''}
        </span>
        <button className="IntentManager-addBtn" onClick={mode === 'none' ? openCreate : closeForm}>
          {mode === 'none' ? '+' : '\u00d7'}
        </button>
      </div>

      {(loadError || formError) && (
        <div className="IntentManager-error">
          {formError ?? t('intent.loadError')}
        </div>
      )}

      {mode !== 'none' && (
        <form className="IntentManager-form" onSubmit={onSubmit}>
          <div className="IntentManager-formTitle">
            {mode === 'create' ? t('intent.createTitle') : t('intent.editTitle')}
          </div>

          <input
            className="IntentManager-input"
            {...register('name')}
            placeholder={t('intent.namePlaceholder')}
            disabled={mode === 'edit'}
          />
          <input
            className="IntentManager-input"
            {...register('description')}
            placeholder={t('intent.descriptionPlaceholder')}
          />
          <textarea
            className="IntentManager-textarea"
            {...register('examplesText')}
            placeholder={t('intent.examplesPlaceholder')}
            rows={3}
          />
          <input
            className="IntentManager-input"
            {...register('keywordsText')}
            placeholder={t('intent.keywordsPlaceholder')}
          />
          <label className="IntentManager-checkLabel">
            <input type="checkbox" {...register('enabled')} />
            {t('intent.enabled')}
          </label>

          <div className="IntentManager-formSection">{t('intent.profile')}</div>

          <input className="IntentManager-input" {...register('profileModel')} placeholder={t('intent.profileModel')} />
          <div className="IntentManager-row">
            <input className="IntentManager-input" {...register('profileTemp')} placeholder={t('intent.profileTemperature')} />
            <input className="IntentManager-input" {...register('profileMaxToolCalls')} placeholder={t('intent.profileMaxToolCalls')} />
          </div>
          <input className="IntentManager-input" {...register('profileResponseFormat')} placeholder={t('intent.profileResponseFormat')} />
          <input className="IntentManager-input" {...register('profileAllowedTools')} placeholder={t('intent.profileAllowedTools')} />
          <textarea className="IntentManager-textarea" {...register('profileSystemPrompt')} placeholder={t('intent.profileSystemPrompt')} rows={4} />

          <div className="IntentManager-formActions">
            <button className="IntentManager-saveBtn" type="submit" disabled={isSubmitting}>
              {isSubmitting ? t('intent.saving') : t('intent.save')}
            </button>
            <button type="button" className="IntentManager-cancelBtn" onClick={closeForm}>
              {t('intent.cancel')}
            </button>
          </div>
        </form>
      )}

      {items.length === 0 ? (
        <div className="IntentManager-empty">{t('intent.empty')}</div>
      ) : (
        <div className="IntentManager-list">
          {items.map(intent => (
            <div key={intent.name} className="IntentManager-item">
              <div className="IntentManager-itemTop">
                <button
                  className="IntentManager-nameBtn"
                  onClick={() => setExpanded(expanded === intent.name ? null : intent.name)}
                >
                  {intent.name}
                </button>
                <span className={`IntentManager-badge${intent.enabled ? '' : ' IntentManager-badge--disabled'}`}>
                  {intent.enabled ? t('intent.enabledYes') : t('intent.enabledNo')}
                </span>
              </div>
              <div className="IntentManager-desc">{intent.description}</div>

              {expanded === intent.name && (
                <div className="IntentManager-detail">
                  <div className="IntentManager-detailRow">
                    <span className="IntentManager-detailLabel">{t('intent.examples')}</span>
                    <span className="IntentManager-detailValue">{(intent.examples ?? []).length}</span>
                  </div>
                  <div className="IntentManager-detailRow">
                    <span className="IntentManager-detailLabel">{t('intent.keywords')}</span>
                    <span className="IntentManager-detailValue">{(intent.keywords ?? []).join(', ') || '-'}</span>
                  </div>
                  <div className="IntentManager-detailRow">
                    <span className="IntentManager-detailLabel">{t('intent.allowedTools')}</span>
                    <span className="IntentManager-detailValue">{(intent.profile?.allowedTools ?? []).join(', ') || '-'}</span>
                  </div>
                  <div className="IntentManager-actions">
                    <button className="IntentManager-actionBtn" onClick={() => openEdit(intent)}>
                      {t('intent.edit')}
                    </button>
                    <button
                      className="IntentManager-actionBtn IntentManager-actionBtn--danger"
                      onClick={() => handleDelete(intent.name)}
                    >
                      {t('intent.delete')}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {expanded == null && items.length > 0 && (
        <div className="IntentManager-hint">{t('intent.hint')}</div>
      )}
    </div>
  )
}
