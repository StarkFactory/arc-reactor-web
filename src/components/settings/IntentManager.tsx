import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { IntentProfile, IntentResponse, IntentResponseFormat } from '../../types/api'
import { createIntent, deleteIntent, listIntents, updateIntent } from '../../services/intents'
import './IntentManager.css'

type Mode = 'none' | 'create' | 'edit'

function splitLines(text: string): string[] {
  return text
    .split('\n')
    .map(s => s.trim())
    .filter(Boolean)
}

function splitCsv(text: string): string[] {
  return text
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)
}

export function IntentManager() {
  const { t } = useTranslation()
  const [items, setItems] = useState<IntentResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [expanded, setExpanded] = useState<string | null>(null)
  const [mode, setMode] = useState<Mode>('none')
  const [saving, setSaving] = useState(false)
  const [editName, setEditName] = useState<string | null>(null)

  // Form
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [examplesText, setExamplesText] = useState('')
  const [keywordsText, setKeywordsText] = useState('')
  const [enabled, setEnabled] = useState(true)

  const [profileModel, setProfileModel] = useState('')
  const [profileTemp, setProfileTemp] = useState('')
  const [profileMaxToolCalls, setProfileMaxToolCalls] = useState('')
  const [profileAllowedTools, setProfileAllowedTools] = useState('')
  const [profileSystemPrompt, setProfileSystemPrompt] = useState('')
  const [profileResponseFormat, setProfileResponseFormat] = useState('')

  const fetchAll = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await listIntents()
      setItems(data)
    } catch {
      setError(t('intent.loadError'))
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAll()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const selected = !expanded ? null : items.find(i => i.name === expanded) ?? null

  const resetForm = () => {
    setName('')
    setDescription('')
    setExamplesText('')
    setKeywordsText('')
    setEnabled(true)

    setProfileModel('')
    setProfileTemp('')
    setProfileMaxToolCalls('')
    setProfileAllowedTools('')
    setProfileSystemPrompt('')
    setProfileResponseFormat('')
  }

  const openCreate = () => {
    resetForm()
    setEditName(null)
    setMode('create')
  }

  const openEdit = (intent: IntentResponse) => {
    setEditName(intent.name)
    setMode('edit')
    setName(intent.name)
    setDescription(intent.description)
    setExamplesText((intent.examples || []).join('\n'))
    setKeywordsText((intent.keywords || []).join(', '))
    setEnabled(intent.enabled)

    const p = intent.profile || ({} as IntentProfile)
    setProfileModel(p.model ?? '')
    setProfileTemp(p.temperature != null ? String(p.temperature) : '')
    setProfileMaxToolCalls(p.maxToolCalls != null ? String(p.maxToolCalls) : '')
    setProfileAllowedTools((p.allowedTools || []).join(', '))
    setProfileSystemPrompt(p.systemPrompt ?? '')
    setProfileResponseFormat(p.responseFormat ?? '')
  }

  const closeForm = () => {
    setMode('none')
    setEditName(null)
  }

  const buildProfile = (): IntentProfile => {
    const temperature = profileTemp.trim() ? Number(profileTemp) : null
    const maxToolCalls = profileMaxToolCalls.trim() ? Number(profileMaxToolCalls) : null
    const allowedTools = profileAllowedTools.trim() ? splitCsv(profileAllowedTools) : null

    return {
      model: profileModel.trim() || null,
      temperature: Number.isFinite(temperature) ? temperature : null,
      maxToolCalls: Number.isFinite(maxToolCalls) ? maxToolCalls : null,
      allowedTools,
      systemPrompt: profileSystemPrompt.trim() || null,
      responseFormat: (profileResponseFormat.trim() || null) as IntentResponseFormat | null,
    }
  }

  const handleSave = async () => {
    if (!name.trim() || !description.trim()) return
    setSaving(true)
    setError(null)

    try {
      if (mode === 'create') {
        await createIntent({
          name: name.trim(),
          description: description.trim(),
          examples: splitLines(examplesText),
          keywords: splitCsv(keywordsText),
          profile: buildProfile(),
          enabled,
        })
      } else if (mode === 'edit' && editName) {
        await updateIntent(editName, {
          description: description.trim(),
          examples: splitLines(examplesText),
          keywords: splitCsv(keywordsText),
          profile: buildProfile(),
          enabled,
        })
      }

      closeForm()
      await fetchAll()
    } catch (e) {
      if (e instanceof Error && e.message === 'CONFLICT') {
        setError(t('intent.duplicateError'))
      } else {
        setError(t('intent.saveError'))
      }
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (intentName: string) => {
    if (!confirm(t('intent.deleteConfirm'))) return
    setError(null)
    try {
      await deleteIntent(intentName)
      if (expanded === intentName) setExpanded(null)
      await fetchAll()
    } catch {
      setError(t('intent.deleteError'))
    }
  }

  if (loading) {
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

      {error && <div className="IntentManager-error">{error}</div>}

      {mode !== 'none' && (
        <div className="IntentManager-form">
          <div className="IntentManager-formTitle">
            {mode === 'create' ? t('intent.createTitle') : t('intent.editTitle')}
          </div>

          <input
            className="IntentManager-input"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder={t('intent.namePlaceholder')}
            disabled={mode === 'edit'}
          />
          <input
            className="IntentManager-input"
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder={t('intent.descriptionPlaceholder')}
          />

          <textarea
            className="IntentManager-textarea"
            value={examplesText}
            onChange={e => setExamplesText(e.target.value)}
            placeholder={t('intent.examplesPlaceholder')}
            rows={3}
          />
          <input
            className="IntentManager-input"
            value={keywordsText}
            onChange={e => setKeywordsText(e.target.value)}
            placeholder={t('intent.keywordsPlaceholder')}
          />

          <label className="IntentManager-checkLabel">
            <input type="checkbox" checked={enabled} onChange={e => setEnabled(e.target.checked)} />
            {t('intent.enabled')}
          </label>

          <div className="IntentManager-formSection">{t('intent.profile')}</div>

          <input
            className="IntentManager-input"
            value={profileModel}
            onChange={e => setProfileModel(e.target.value)}
            placeholder={t('intent.profileModel')}
          />
          <div className="IntentManager-row">
            <input
              className="IntentManager-input"
              value={profileTemp}
              onChange={e => setProfileTemp(e.target.value)}
              placeholder={t('intent.profileTemperature')}
            />
            <input
              className="IntentManager-input"
              value={profileMaxToolCalls}
              onChange={e => setProfileMaxToolCalls(e.target.value)}
              placeholder={t('intent.profileMaxToolCalls')}
            />
          </div>
          <input
            className="IntentManager-input"
            value={profileResponseFormat}
            onChange={e => setProfileResponseFormat(e.target.value)}
            placeholder={t('intent.profileResponseFormat')}
          />
          <input
            className="IntentManager-input"
            value={profileAllowedTools}
            onChange={e => setProfileAllowedTools(e.target.value)}
            placeholder={t('intent.profileAllowedTools')}
          />
          <textarea
            className="IntentManager-textarea"
            value={profileSystemPrompt}
            onChange={e => setProfileSystemPrompt(e.target.value)}
            placeholder={t('intent.profileSystemPrompt')}
            rows={4}
          />

          <div className="IntentManager-formActions">
            <button
              className="IntentManager-saveBtn"
              onClick={handleSave}
              disabled={saving || !name.trim() || !description.trim()}
            >
              {saving ? t('intent.saving') : t('intent.save')}
            </button>
            <button className="IntentManager-cancelBtn" onClick={closeForm}>
              {t('intent.cancel')}
            </button>
          </div>
        </div>
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
                    <span className="IntentManager-detailValue">{(intent.examples || []).length}</span>
                  </div>
                  <div className="IntentManager-detailRow">
                    <span className="IntentManager-detailLabel">{t('intent.keywords')}</span>
                    <span className="IntentManager-detailValue">{(intent.keywords || []).join(', ') || '-'}</span>
                  </div>
                  <div className="IntentManager-detailRow">
                    <span className="IntentManager-detailLabel">{t('intent.allowedTools')}</span>
                    <span className="IntentManager-detailValue">{(intent.profile?.allowedTools || []).join(', ') || '-'}</span>
                  </div>

                  <div className="IntentManager-actions">
                    <button className="IntentManager-actionBtn" onClick={() => openEdit(intent)}>
                      {t('intent.edit')}
                    </button>
                    <button className="IntentManager-actionBtn IntentManager-actionBtn--danger" onClick={() => handleDelete(intent.name)}>
                      {t('intent.delete')}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {selected == null && items.length > 0 && (
        <div className="IntentManager-hint">{t('intent.hint')}</div>
      )}
    </div>
  )
}
