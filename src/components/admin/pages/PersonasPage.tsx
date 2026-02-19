import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import type { PersonaResponse } from '../../../types/api'
import { listPersonas, createPersona, updatePersona, deletePersona } from '../../../services/personas'
import './PersonasPage.css'

type EditMode = 'none' | 'create' | 'edit'

export function PersonasPage() {
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

  const fetchPersonas = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await listPersonas()
      setPersonas(data)
    } catch {
      setError(t('admin.personasPage.loadError'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPersonas()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

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
    setError(null)
    try {
      if (editMode === 'create') {
        await createPersona({
          name: formName.trim(),
          systemPrompt: formPrompt.trim(),
          isDefault: formIsDefault,
        })
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
      setError(t('admin.personasPage.saveError'))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm(t('admin.personasPage.deleteConfirm'))) return
    setError(null)
    try {
      await deletePersona(id)
      await fetchPersonas()
    } catch {
      setError(t('admin.personasPage.deleteError'))
    }
  }

  return (
    <div className="PersonasPage">
      <div className="PersonasPage-header">
        <div>
          <h1 className="PersonasPage-title">{t('admin.personasPage.title')}</h1>
          <p className="PersonasPage-desc">{t('admin.personasPage.description')}</p>
        </div>
        {editMode === 'none' && (
          <button className="PersonasPage-addBtn" onClick={openCreate}>
            {t('admin.personasPage.newPersona')}
          </button>
        )}
      </div>

      {error && <div className="PersonasPage-error">{error}</div>}

      {editMode !== 'none' && (
        <div className="PersonasPage-form">
          <h3 className="PersonasPage-formTitle">
            {editMode === 'create' ? t('admin.personasPage.createTitle') : t('admin.personasPage.editTitle')}
          </h3>
          <input
            className="PersonasPage-input"
            value={formName}
            onChange={e => setFormName(e.target.value)}
            placeholder={t('admin.personasPage.namePlaceholder')}
          />
          <textarea
            className="PersonasPage-textarea"
            value={formPrompt}
            onChange={e => setFormPrompt(e.target.value)}
            placeholder={t('admin.personasPage.promptPlaceholder')}
            rows={6}
          />
          <label className="PersonasPage-checkLabel">
            <input
              type="checkbox"
              checked={formIsDefault}
              onChange={e => setFormIsDefault(e.target.checked)}
            />
            {t('admin.personasPage.setDefault')}
          </label>
          <div className="PersonasPage-formActions">
            <button
              className="PersonasPage-saveBtn"
              onClick={handleSave}
              disabled={saving || !formName.trim() || !formPrompt.trim()}
            >
              {saving ? t('admin.personasPage.saving') : editMode === 'create' ? t('admin.personasPage.create') : t('admin.personasPage.save')}
            </button>
            <button className="PersonasPage-cancelBtn" onClick={closeForm}>
              {t('admin.personasPage.cancel')}
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="PersonasPage-loading">{t('admin.personasPage.loading')}</div>
      ) : personas.length === 0 ? (
        <div className="PersonasPage-empty">{t('admin.personasPage.empty')}</div>
      ) : (
        <div className="PersonasPage-list">
          {personas.map(persona => (
            <div key={persona.id} className="PersonasPage-card">
              <div className="PersonasPage-cardHeader">
                <span className="PersonasPage-cardName">
                  {persona.name}
                  {persona.isDefault && <span className="PersonasPage-defaultBadge">{t('persona.default')}</span>}
                </span>
                <div className="PersonasPage-cardActions">
                  <button className="PersonasPage-editBtn" onClick={() => openEdit(persona)}>
                    {t('admin.personasPage.edit')}
                  </button>
                  <button className="PersonasPage-deleteBtn" onClick={() => handleDelete(persona.id)}>
                    {t('admin.personasPage.delete')}
                  </button>
                </div>
              </div>
              <div className="PersonasPage-cardPrompt">{persona.systemPrompt}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
