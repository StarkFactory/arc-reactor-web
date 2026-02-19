import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import type { ClippingSource, ClippingCategory } from '../../../types/clipping'
import {
  listClippingSources,
  createClippingSource,
  updateClippingSource,
  deleteClippingSource,
  verifyClippingSource,
  approveClippingSource,
  revokeClippingSource,
  listClippingCategories,
} from '../../../services/clipping'
import './ClippingSourcesPage.css'

type EditMode = 'none' | 'create' | 'edit'

export function ClippingSourcesPage() {
  const { t } = useTranslation()
  const [sources, setSources] = useState<ClippingSource[]>([])
  const [categories, setCategories] = useState<ClippingCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editMode, setEditMode] = useState<EditMode>('none')
  const [editId, setEditId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [actionId, setActionId] = useState<string | null>(null)

  const [formName, setFormName] = useState('')
  const [formUrl, setFormUrl] = useState('')
  const [formCategoryId, setFormCategoryId] = useState('')

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)
      const [src, cats] = await Promise.all([listClippingSources(), listClippingCategories()])
      setSources(src)
      setCategories(cats)
    } catch {
      setError(t('admin.clipping.sources.loadError'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const resetForm = () => { setFormName(''); setFormUrl(''); setFormCategoryId('') }

  const openCreate = () => { setEditMode('create'); setEditId(null); resetForm() }
  const openEdit = (src: ClippingSource) => {
    setEditMode('edit'); setEditId(src.id)
    setFormName(src.name); setFormUrl(src.url); setFormCategoryId(src.categoryId)
  }
  const closeForm = () => { setEditMode('none'); setEditId(null) }

  const handleSave = async () => {
    if (!formName.trim() || !formUrl.trim() || !formCategoryId) return
    setSaving(true); setError(null)
    try {
      const req = { name: formName.trim(), url: formUrl.trim(), categoryId: formCategoryId }
      if (editMode === 'create') await createClippingSource(req)
      else if (editId) await updateClippingSource(editId, req)
      await fetchData(); closeForm()
    } catch {
      setError(t('admin.clipping.sources.saveError'))
    } finally { setSaving(false) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm(t('admin.clipping.sources.deleteConfirm'))) return
    try { await deleteClippingSource(id); await fetchData() }
    catch { setError(t('admin.clipping.sources.deleteError')) }
  }

  const handleVerify = async (id: string) => {
    setActionId(id); setError(null)
    try { await verifyClippingSource(id); await fetchData() }
    catch { setError(t('admin.clipping.sources.verifyError')) }
    finally { setActionId(null) }
  }

  const handleApprove = async (id: string) => {
    setActionId(id); setError(null)
    try { await approveClippingSource(id, 'admin'); await fetchData() }
    catch { setError(t('admin.clipping.sources.approveError')) }
    finally { setActionId(null) }
  }

  const handleRevoke = async (id: string) => {
    setActionId(id); setError(null)
    try { await revokeClippingSource(id); await fetchData() }
    catch { setError(t('admin.clipping.sources.approveError')) }
    finally { setActionId(null) }
  }

  const categoryName = (id: string) => categories.find(c => c.id === id)?.name || id

  const statusBadge = (status: string) => {
    switch (status) {
      case 'VERIFIED': return 'ClipSrcPage-badgeVerified'
      case 'FEED_ERROR': case 'ROBOTS_BLOCKED': case 'TIMEOUT': return 'ClipSrcPage-badgeError'
      default: return 'ClipSrcPage-badgePending'
    }
  }

  return (
    <div className="ClipSrcPage">
      <div className="ClipSrcPage-header">
        <div>
          <h1 className="ClipSrcPage-title">{t('admin.clipping.sources.title')}</h1>
          <p className="ClipSrcPage-desc">{t('admin.clipping.sources.description')}</p>
        </div>
        {editMode === 'none' && (
          <button className="ClipSrcPage-addBtn" onClick={openCreate}>{t('admin.clipping.sources.new')}</button>
        )}
      </div>

      {error && <div className="ClipSrcPage-error">{error}</div>}

      {editMode !== 'none' && (
        <div className="ClipSrcPage-form">
          <h3 className="ClipSrcPage-formTitle">
            {editMode === 'create' ? t('admin.clipping.sources.createTitle') : t('admin.clipping.sources.editTitle')}
          </h3>
          <div className="ClipSrcPage-formGrid">
            <div className="ClipSrcPage-field">
              <label className="ClipSrcPage-label">{t('admin.clipping.sources.name')}</label>
              <input className="ClipSrcPage-input" value={formName} onChange={e => setFormName(e.target.value)}
                placeholder={t('admin.clipping.sources.namePlaceholder')} />
            </div>
            <div className="ClipSrcPage-field">
              <label className="ClipSrcPage-label">{t('admin.clipping.sources.category')}</label>
              <select className="ClipSrcPage-input" value={formCategoryId} onChange={e => setFormCategoryId(e.target.value)}>
                <option value="">{t('admin.clipping.sources.selectCategory')}</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>
          <div className="ClipSrcPage-field">
            <label className="ClipSrcPage-label">{t('admin.clipping.sources.url')}</label>
            <input className="ClipSrcPage-input" value={formUrl} onChange={e => setFormUrl(e.target.value)}
              placeholder="https://example.com/rss" />
          </div>
          <div className="ClipSrcPage-formActions">
            <button className="ClipSrcPage-saveBtn" onClick={handleSave}
              disabled={saving || !formName.trim() || !formUrl.trim() || !formCategoryId}>
              {saving ? t('admin.clipping.saving') : editMode === 'create' ? t('admin.clipping.create') : t('admin.clipping.save')}
            </button>
            <button className="ClipSrcPage-cancelBtn" onClick={closeForm}>{t('admin.clipping.cancel')}</button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="ClipSrcPage-loading">{t('admin.clipping.sources.loading')}</div>
      ) : sources.length === 0 ? (
        <div className="ClipSrcPage-empty">{t('admin.clipping.sources.empty')}</div>
      ) : (
        <div className="ClipSrcPage-list">
          {sources.map(src => (
            <div key={src.id} className="ClipSrcPage-card">
              <div className="ClipSrcPage-cardHeader">
                <div className="ClipSrcPage-cardTitle">
                  <span className="ClipSrcPage-cardName">{src.name}</span>
                  <span className={`ClipSrcPage-badge ${statusBadge(src.verificationStatus)}`}>
                    {src.verificationStatus}
                  </span>
                  {src.crawlApproved && (
                    <span className="ClipSrcPage-badge ClipSrcPage-badgeApproved">
                      {t('admin.clipping.sources.approved')}
                    </span>
                  )}
                </div>
                <div className="ClipSrcPage-cardActions">
                  <button className="ClipSrcPage-verifyBtn" onClick={() => handleVerify(src.id)}
                    disabled={actionId === src.id}>
                    {actionId === src.id ? '...' : t('admin.clipping.sources.verify')}
                  </button>
                  {src.crawlApproved ? (
                    <button className="ClipSrcPage-revokeBtn" onClick={() => handleRevoke(src.id)}
                      disabled={actionId === src.id}>
                      {t('admin.clipping.sources.revoke')}
                    </button>
                  ) : (
                    <button className="ClipSrcPage-approveBtn" onClick={() => handleApprove(src.id)}
                      disabled={actionId === src.id}>
                      {t('admin.clipping.sources.approve')}
                    </button>
                  )}
                  <button className="ClipSrcPage-editBtn" onClick={() => openEdit(src)}>{t('admin.clipping.edit')}</button>
                  <button className="ClipSrcPage-deleteBtn" onClick={() => handleDelete(src.id)}>{t('admin.clipping.delete')}</button>
                </div>
              </div>
              <div className="ClipSrcPage-cardUrl">
                <a href={src.url} target="_blank" rel="noopener noreferrer">{src.url}</a>
              </div>
              <div className="ClipSrcPage-cardMeta">
                <span className="ClipSrcPage-metaItem">
                  <span className="ClipSrcPage-metaLabel">{t('admin.clipping.sources.category')}</span>
                  {categoryName(src.categoryId)}
                </span>
                <span className="ClipSrcPage-metaItem">
                  <span className="ClipSrcPage-metaLabel">{t('admin.clipping.sources.reliability')}</span>
                  {src.reliabilityScore}
                </span>
                <span className="ClipSrcPage-metaItem">
                  <span className="ClipSrcPage-metaLabel">{t('admin.clipping.sources.failCount')}</span>
                  {src.crawlFailCount}
                </span>
                {src.lastCrawlError && (
                  <span className="ClipSrcPage-metaItem ClipSrcPage-metaError">
                    <span className="ClipSrcPage-metaLabel">{t('admin.clipping.sources.lastError')}</span>
                    {src.lastCrawlError}
                  </span>
                )}
                {src.approvedBy && (
                  <span className="ClipSrcPage-metaItem">
                    <span className="ClipSrcPage-metaLabel">{t('admin.clipping.sources.approvedBy')}</span>
                    {src.approvedBy}
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
