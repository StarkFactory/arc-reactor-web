import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import type { PersonaResponse } from '../../types/api'
import { listPersonas, createPersona, updatePersona, deletePersona } from '../../services/personas'
import './PersonaSelector.css'

interface PersonaSelectorProps {
  value: string | null
  onChange: (personaId: string | null) => void
  onSystemPromptPreview?: (prompt: string) => void
}

type EditMode = 'none' | 'create' | 'edit'

export function PersonaSelector({ value, onChange, onSystemPromptPreview }: PersonaSelectorProps) {
  const { t } = useTranslation()
  const [personas, setPersonas] = useState<PersonaResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editMode, setEditMode] = useState<EditMode>('none')
  const [editId, setEditId] = useState<string | null>(null)
  const [formName, setFormName] = useState('')
  const [formPrompt, setFormPrompt] = useState('')
  const [formIsDefault, setFormIsDefault] = useState(false)
  const [saving, setSaving] = useState(false)

  const fetchPersonas = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await listPersonas()
      setPersonas(data)
    } catch {
      setError(t('persona.loadError'))
      setPersonas([])
    } finally {
      setLoading(false)
    }
  }, [t])

  useEffect(() => {
    fetchPersonas()
  }, [fetchPersonas])

  // Notify parent of selected persona's system prompt
  useEffect(() => {
    if (!value || !onSystemPromptPreview) return
    const selected = personas.find(p => p.id === value)
    if (selected) onSystemPromptPreview(selected.systemPrompt)
  }, [value, personas, onSystemPromptPreview])

  const handleSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value || null
    onChange(id)
  }

  const openCreate = () => {
    setEditMode('create')
    setEditId(null)
    setFormName('')
    setFormPrompt('')
    setFormIsDefault(false)
  }

  const openEdit = (persona: PersonaResponse) => {
    setEditMode('edit')
    setEditId(persona.id)
    setFormName(persona.name)
    setFormPrompt(persona.systemPrompt)
    setFormIsDefault(persona.isDefault)
  }

  const closeForm = () => {
    setEditMode('none')
    setEditId(null)
  }

  const handleSave = async () => {
    if (!formName.trim() || !formPrompt.trim()) return
    setSaving(true)
    try {
      if (editMode === 'create') {
        const created = await createPersona({
          name: formName.trim(),
          systemPrompt: formPrompt.trim(),
          isDefault: formIsDefault,
        })
        onChange(created.id)
      } else if (editMode === 'edit' && editId) {
        await updatePersona(editId, {
          name: formName.trim(),
          systemPrompt: formPrompt.trim(),
          isDefault: formIsDefault,
        })
      }
      await fetchPersonas()
      closeForm()
    } catch {
      setError(t('persona.saveError'))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm(t('persona.deleteConfirm'))) return
    try {
      await deletePersona(id)
      if (value === id) onChange(null)
      await fetchPersonas()
    } catch {
      setError(t('persona.deleteError'))
    }
  }

  if (loading) {
    return <div className="PersonaSelector-loading">{t('persona.loading')}</div>
  }

  if (error && personas.length === 0) {
    return (
      <div className="PersonaSelector-error">
        <span>{error}</span>
        <button className="PersonaSelector-retryBtn" onClick={fetchPersonas}>{t('persona.retry')}</button>
      </div>
    )
  }

  return (
    <div className="PersonaSelector">
      <div className="PersonaSelector-row">
        <select
          className="PersonaSelector-select"
          value={value ?? ''}
          onChange={handleSelect}
        >
          <option value="">{t('persona.custom')}</option>
          {personas.map(p => (
            <option key={p.id} value={p.id}>
              {p.name}{p.isDefault ? ` (${t('persona.default')})` : ''}
            </option>
          ))}
        </select>
        <button
          className="PersonaSelector-manageBtn"
          onClick={() => editMode === 'none' ? openCreate() : closeForm()}
          title={editMode === 'none' ? t('persona.add') : t('persona.close')}
        >
          {editMode === 'none' ? '+' : '\u00d7'}
        </button>
      </div>

      {/* Selected persona info */}
      {value && editMode === 'none' && (() => {
        const selected = personas.find(p => p.id === value)
        if (!selected) return null
        return (
          <div className="PersonaSelector-preview">
            <div className="PersonaSelector-previewPrompt">{selected.systemPrompt}</div>
            <div className="PersonaSelector-previewActions">
              <button className="PersonaSelector-editBtn" onClick={() => openEdit(selected)}>
                {t('persona.edit')}
              </button>
              <button
                className="PersonaSelector-deleteBtn"
                onClick={() => handleDelete(selected.id)}
              >
                {t('persona.delete')}
              </button>
            </div>
          </div>
        )
      })()}

      {/* Create / Edit form */}
      {editMode !== 'none' && (
        <div className="PersonaSelector-form">
          <input
            className="PersonaSelector-input"
            value={formName}
            onChange={e => setFormName(e.target.value)}
            placeholder={t('persona.namePlaceholder')}
          />
          <textarea
            className="PersonaSelector-textarea"
            value={formPrompt}
            onChange={e => setFormPrompt(e.target.value)}
            placeholder={t('persona.promptPlaceholder')}
            rows={4}
          />
          <label className="PersonaSelector-checkLabel">
            <input
              type="checkbox"
              checked={formIsDefault}
              onChange={e => setFormIsDefault(e.target.checked)}
            />
            {t('persona.setDefault')}
          </label>
          <div className="PersonaSelector-formActions">
            <button
              className="PersonaSelector-saveBtn"
              onClick={handleSave}
              disabled={saving || !formName.trim() || !formPrompt.trim()}
            >
              {saving ? t('persona.saving') : editMode === 'create' ? t('persona.create') : t('persona.save')}
            </button>
            <button className="PersonaSelector-cancelBtn" onClick={closeForm}>
              {t('persona.cancel')}
            </button>
          </div>
        </div>
      )}

      {error && <div className="PersonaSelector-inlineError">{error}</div>}
    </div>
  )
}
