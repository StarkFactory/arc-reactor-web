import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import type { ClippingPersona } from '../../../types/clipping'
import {
  listClippingPersonas,
  createClippingPersona,
  updateClippingPersona,
  deleteClippingPersona,
} from '../../../services/clipping'
import './ClippingPersonasPage.css'

type EditMode = 'none' | 'create' | 'edit'

export function ClippingPersonasPage() {
  const { t } = useTranslation()
  const [personas, setPersonas] = useState<ClippingPersona[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editMode, setEditMode] = useState<EditMode>('none')
  const [editId, setEditId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const [formName, setFormName] = useState('')
  const [formSystemPrompt, setFormSystemPrompt] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [formSummaryStyle, setFormSummaryStyle] = useState('')
  const [formTargetAudience, setFormTargetAudience] = useState('')
  const [formMaxItems, setFormMaxItems] = useState('5')
  const [formLanguage, setFormLanguage] = useState('ko')
  const [formIsActive, setFormIsActive] = useState(true)

  const fetchData = async () => {
    try {
      setLoading(true); setError(null)
      setPersonas(await listClippingPersonas())
    } catch {
      setError(t('admin.clipping.personas.loadError'))
    } finally { setLoading(false) }
  }

  useEffect(() => { fetchData() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const resetForm = () => {
    setFormName(''); setFormSystemPrompt(''); setFormDescription('')
    setFormSummaryStyle(''); setFormTargetAudience('')
    setFormMaxItems('5'); setFormLanguage('ko'); setFormIsActive(true)
  }

  const openCreate = () => { setEditMode('create'); setEditId(null); resetForm() }
  const openEdit = (p: ClippingPersona) => {
    setEditMode('edit'); setEditId(p.id)
    setFormName(p.name); setFormSystemPrompt(p.systemPrompt)
    setFormDescription(p.description || ''); setFormSummaryStyle(p.summaryStyle || '')
    setFormTargetAudience(p.targetAudience || ''); setFormMaxItems(String(p.maxItems))
    setFormLanguage(p.language); setFormIsActive(p.isActive)
  }
  const closeForm = () => { setEditMode('none'); setEditId(null) }

  const handleSave = async () => {
    if (!formName.trim() || !formSystemPrompt.trim()) return
    setSaving(true); setError(null)
    try {
      const req = {
        name: formName.trim(),
        systemPrompt: formSystemPrompt.trim(),
        description: formDescription.trim() || undefined,
        summaryStyle: formSummaryStyle.trim() || undefined,
        targetAudience: formTargetAudience.trim() || undefined,
        maxItems: parseInt(formMaxItems) || 5,
        language: formLanguage,
        isActive: formIsActive,
      }
      if (editMode === 'create') await createClippingPersona(req)
      else if (editId) await updateClippingPersona(editId, req)
      await fetchData(); closeForm()
    } catch {
      setError(t('admin.clipping.personas.saveError'))
    } finally { setSaving(false) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm(t('admin.clipping.personas.deleteConfirm'))) return
    try { await deleteClippingPersona(id); await fetchData() }
    catch { setError(t('admin.clipping.personas.deleteError')) }
  }

  return (
    <div className="ClipPersonaPage">
      <div className="ClipPersonaPage-header">
        <div>
          <h1 className="ClipPersonaPage-title">{t('admin.clipping.personas.title')}</h1>
          <p className="ClipPersonaPage-desc">{t('admin.clipping.personas.description')}</p>
        </div>
        {editMode === 'none' && (
          <button className="ClipPersonaPage-addBtn" onClick={openCreate}>{t('admin.clipping.personas.new')}</button>
        )}
      </div>

      {error && <div className="ClipPersonaPage-error">{error}</div>}

      {editMode !== 'none' && (
        <div className="ClipPersonaPage-form">
          <h3 className="ClipPersonaPage-formTitle">
            {editMode === 'create' ? t('admin.clipping.personas.createTitle') : t('admin.clipping.personas.editTitle')}
          </h3>
          <div className="ClipPersonaPage-formGrid">
            <div className="ClipPersonaPage-field">
              <label className="ClipPersonaPage-label">{t('admin.clipping.personas.name')}</label>
              <input className="ClipPersonaPage-input" value={formName} onChange={e => setFormName(e.target.value)}
                placeholder={t('admin.clipping.personas.namePlaceholder')} />
            </div>
            <div className="ClipPersonaPage-field">
              <label className="ClipPersonaPage-label">{t('admin.clipping.personas.language')}</label>
              <select className="ClipPersonaPage-input" value={formLanguage} onChange={e => setFormLanguage(e.target.value)}>
                <option value="ko">Korean</option>
                <option value="en">English</option>
              </select>
            </div>
            <div className="ClipPersonaPage-field">
              <label className="ClipPersonaPage-label">{t('admin.clipping.personas.maxItems')}</label>
              <input className="ClipPersonaPage-input" type="number" min="1" max="20" value={formMaxItems}
                onChange={e => setFormMaxItems(e.target.value)} />
            </div>
            <div className="ClipPersonaPage-field">
              <label className="ClipPersonaPage-label">{t('admin.clipping.personas.targetAudience')}</label>
              <input className="ClipPersonaPage-input" value={formTargetAudience}
                onChange={e => setFormTargetAudience(e.target.value)}
                placeholder={t('admin.clipping.personas.targetAudiencePlaceholder')} />
            </div>
          </div>
          <div className="ClipPersonaPage-field">
            <label className="ClipPersonaPage-label">{t('admin.clipping.personas.description')}</label>
            <input className="ClipPersonaPage-input" value={formDescription} onChange={e => setFormDescription(e.target.value)}
              placeholder={t('admin.clipping.personas.descriptionPlaceholder')} />
          </div>
          <div className="ClipPersonaPage-field">
            <label className="ClipPersonaPage-label">{t('admin.clipping.personas.summaryStyle')}</label>
            <input className="ClipPersonaPage-input" value={formSummaryStyle} onChange={e => setFormSummaryStyle(e.target.value)}
              placeholder={t('admin.clipping.personas.summaryStylePlaceholder')} />
          </div>
          <div className="ClipPersonaPage-field">
            <label className="ClipPersonaPage-label">{t('admin.clipping.personas.systemPrompt')}</label>
            <textarea className="ClipPersonaPage-textarea" value={formSystemPrompt}
              onChange={e => setFormSystemPrompt(e.target.value)}
              placeholder={t('admin.clipping.personas.systemPromptPlaceholder')} rows={4} />
          </div>
          <label className="ClipPersonaPage-checkLabel">
            <input type="checkbox" checked={formIsActive} onChange={e => setFormIsActive(e.target.checked)} />
            {t('admin.clipping.personas.active')}
          </label>
          <div className="ClipPersonaPage-formActions">
            <button className="ClipPersonaPage-saveBtn" onClick={handleSave}
              disabled={saving || !formName.trim() || !formSystemPrompt.trim()}>
              {saving ? t('admin.clipping.saving') : editMode === 'create' ? t('admin.clipping.create') : t('admin.clipping.save')}
            </button>
            <button className="ClipPersonaPage-cancelBtn" onClick={closeForm}>{t('admin.clipping.cancel')}</button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="ClipPersonaPage-loading">{t('admin.clipping.personas.loading')}</div>
      ) : personas.length === 0 ? (
        <div className="ClipPersonaPage-empty">{t('admin.clipping.personas.empty')}</div>
      ) : (
        <div className="ClipPersonaPage-list">
          {personas.map(p => (
            <div key={p.id} className="ClipPersonaPage-card">
              <div className="ClipPersonaPage-cardHeader">
                <div className="ClipPersonaPage-cardTitle">
                  <span className="ClipPersonaPage-cardName">{p.name}</span>
                  <span className={`ClipPersonaPage-badge ${p.isActive ? 'ClipPersonaPage-badgeActive' : 'ClipPersonaPage-badgeInactive'}`}>
                    {p.isActive ? t('admin.clipping.personas.active') : t('admin.clipping.personas.inactive')}
                  </span>
                </div>
                <div className="ClipPersonaPage-cardActions">
                  <button className="ClipPersonaPage-editBtn" onClick={() => openEdit(p)}>{t('admin.clipping.edit')}</button>
                  <button className="ClipPersonaPage-deleteBtn" onClick={() => handleDelete(p.id)}>{t('admin.clipping.delete')}</button>
                </div>
              </div>
              {p.description && <div className="ClipPersonaPage-cardDesc">{p.description}</div>}
              <div className="ClipPersonaPage-cardPrompt">
                <span className="ClipPersonaPage-metaLabel">{t('admin.clipping.personas.systemPrompt')}</span>
                <pre className="ClipPersonaPage-promptPre">{p.systemPrompt}</pre>
              </div>
              <div className="ClipPersonaPage-cardMeta">
                <span className="ClipPersonaPage-metaItem">
                  <span className="ClipPersonaPage-metaLabel">{t('admin.clipping.personas.language')}</span>
                  {p.language}
                </span>
                <span className="ClipPersonaPage-metaItem">
                  <span className="ClipPersonaPage-metaLabel">{t('admin.clipping.personas.maxItems')}</span>
                  {p.maxItems}
                </span>
                {p.targetAudience && (
                  <span className="ClipPersonaPage-metaItem">
                    <span className="ClipPersonaPage-metaLabel">{t('admin.clipping.personas.targetAudience')}</span>
                    {p.targetAudience}
                  </span>
                )}
                {p.summaryStyle && (
                  <span className="ClipPersonaPage-metaItem">
                    <span className="ClipPersonaPage-metaLabel">{t('admin.clipping.personas.summaryStyle')}</span>
                    {p.summaryStyle}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
