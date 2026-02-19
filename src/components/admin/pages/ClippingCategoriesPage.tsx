import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import type { ClippingCategory, ClippingPersona } from '../../../types/clipping'
import {
  listClippingCategories,
  createClippingCategory,
  updateClippingCategory,
  deleteClippingCategory,
} from '../../../services/clipping'
import { listClippingPersonas } from '../../../services/clipping'
import './ClippingCategoriesPage.css'

type EditMode = 'none' | 'create' | 'edit'

export function ClippingCategoriesPage() {
  const { t } = useTranslation()
  const [categories, setCategories] = useState<ClippingCategory[]>([])
  const [personas, setPersonas] = useState<ClippingPersona[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editMode, setEditMode] = useState<EditMode>('none')
  const [editId, setEditId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const [formName, setFormName] = useState('')
  const [formMaxItems, setFormMaxItems] = useState('5')
  const [formPersonaId, setFormPersonaId] = useState('')

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)
      const [cats, pers] = await Promise.all([listClippingCategories(), listClippingPersonas()])
      setCategories(cats)
      setPersonas(pers)
    } catch {
      setError(t('admin.clipping.categories.loadError'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const resetForm = () => {
    setFormName('')
    setFormMaxItems('5')
    setFormPersonaId('')
  }

  const openCreate = () => { setEditMode('create'); setEditId(null); resetForm() }
  const openEdit = (cat: ClippingCategory) => {
    setEditMode('edit')
    setEditId(cat.id)
    setFormName(cat.name)
    setFormMaxItems(String(cat.maxItems))
    setFormPersonaId(cat.personaId || '')
  }
  const closeForm = () => { setEditMode('none'); setEditId(null) }

  const handleSave = async () => {
    if (!formName.trim()) return
    setSaving(true)
    setError(null)
    try {
      const req = {
        name: formName.trim(),
        maxItems: parseInt(formMaxItems) || 5,
        personaId: formPersonaId || undefined,
      }
      if (editMode === 'create') {
        await createClippingCategory(req)
      } else if (editId) {
        await updateClippingCategory(editId, req)
      }
      await fetchData()
      closeForm()
    } catch {
      setError(t('admin.clipping.categories.saveError'))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm(t('admin.clipping.categories.deleteConfirm'))) return
    try {
      await deleteClippingCategory(id)
      await fetchData()
    } catch {
      setError(t('admin.clipping.categories.deleteError'))
    }
  }

  const personaName = (id: string | null) => {
    if (!id) return '-'
    return personas.find(p => p.id === id)?.name || id
  }

  return (
    <div className="ClipCatPage">
      <div className="ClipCatPage-header">
        <div>
          <h1 className="ClipCatPage-title">{t('admin.clipping.categories.title')}</h1>
          <p className="ClipCatPage-desc">{t('admin.clipping.categories.description')}</p>
        </div>
        {editMode === 'none' && (
          <button className="ClipCatPage-addBtn" onClick={openCreate}>
            {t('admin.clipping.categories.new')}
          </button>
        )}
      </div>

      {error && <div className="ClipCatPage-error">{error}</div>}

      {editMode !== 'none' && (
        <div className="ClipCatPage-form">
          <h3 className="ClipCatPage-formTitle">
            {editMode === 'create' ? t('admin.clipping.categories.createTitle') : t('admin.clipping.categories.editTitle')}
          </h3>
          <div className="ClipCatPage-formGrid">
            <div className="ClipCatPage-field">
              <label className="ClipCatPage-label">{t('admin.clipping.categories.name')}</label>
              <input className="ClipCatPage-input" value={formName} onChange={e => setFormName(e.target.value)}
                placeholder={t('admin.clipping.categories.namePlaceholder')} />
            </div>
            <div className="ClipCatPage-field">
              <label className="ClipCatPage-label">{t('admin.clipping.categories.maxItems')}</label>
              <input className="ClipCatPage-input" type="number" min="1" max="20" value={formMaxItems}
                onChange={e => setFormMaxItems(e.target.value)} />
            </div>
            <div className="ClipCatPage-field">
              <label className="ClipCatPage-label">{t('admin.clipping.categories.persona')}</label>
              <select className="ClipCatPage-input" value={formPersonaId} onChange={e => setFormPersonaId(e.target.value)}>
                <option value="">{t('admin.clipping.categories.noPersona')}</option>
                {personas.filter(p => p.isActive).map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="ClipCatPage-formActions">
            <button className="ClipCatPage-saveBtn" onClick={handleSave} disabled={saving || !formName.trim()}>
              {saving ? t('admin.clipping.saving') : editMode === 'create' ? t('admin.clipping.create') : t('admin.clipping.save')}
            </button>
            <button className="ClipCatPage-cancelBtn" onClick={closeForm}>{t('admin.clipping.cancel')}</button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="ClipCatPage-loading">{t('admin.clipping.categories.loading')}</div>
      ) : categories.length === 0 ? (
        <div className="ClipCatPage-empty">{t('admin.clipping.categories.empty')}</div>
      ) : (
        <div className="ClipCatPage-list">
          {categories.map(cat => (
            <div key={cat.id} className="ClipCatPage-card">
              <div className="ClipCatPage-cardHeader">
                <span className="ClipCatPage-cardName">{cat.name}</span>
                <div className="ClipCatPage-cardActions">
                  <button className="ClipCatPage-editBtn" onClick={() => openEdit(cat)}>{t('admin.clipping.edit')}</button>
                  <button className="ClipCatPage-deleteBtn" onClick={() => handleDelete(cat.id)}>{t('admin.clipping.delete')}</button>
                </div>
              </div>
              <div className="ClipCatPage-cardMeta">
                <span className="ClipCatPage-metaItem">
                  <span className="ClipCatPage-metaLabel">{t('admin.clipping.categories.maxItems')}</span>
                  {cat.maxItems}
                </span>
                <span className="ClipCatPage-metaItem">
                  <span className="ClipCatPage-metaLabel">{t('admin.clipping.categories.persona')}</span>
                  {personaName(cat.personaId)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
