import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import type { TemplateResponse, TemplateDetailResponse, VersionResponse } from '../../types/api'
import {
  listTemplates,
  getTemplate,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  createVersion,
  activateVersion,
  archiveVersion,
} from '../../services/prompts'
import './PromptTemplateManager.css'

interface PromptTemplateManagerProps {
  value: string | null
  onChange: (templateId: string | null) => void
}

type EditMode = 'none' | 'create' | 'edit'

export function PromptTemplateManager({ value, onChange }: PromptTemplateManagerProps) {
  const { t } = useTranslation()

  // Template list
  const [templates, setTemplates] = useState<TemplateResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Selected template detail
  const [detail, setDetail] = useState<TemplateDetailResponse | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)

  // Template form
  const [editMode, setEditMode] = useState<EditMode>('none')
  const [editId, setEditId] = useState<string | null>(null)
  const [formName, setFormName] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [saving, setSaving] = useState(false)

  // Version form
  const [versionFormOpen, setVersionFormOpen] = useState(false)
  const [versionContent, setVersionContent] = useState('')
  const [versionChangeLog, setVersionChangeLog] = useState('')
  const [versionSaving, setVersionSaving] = useState(false)

  const fetchTemplates = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await listTemplates()
      setTemplates(data)
    } catch {
      setError(t('promptTemplate.loadError'))
      setTemplates([])
    } finally {
      setLoading(false)
    }
  }, [t])

  const fetchDetail = useCallback(async (id: string) => {
    try {
      setDetailLoading(true)
      const data = await getTemplate(id)
      setDetail(data)
    } catch {
      setDetail(null)
      setError(t('promptTemplate.loadError'))
    } finally {
      setDetailLoading(false)
    }
  }, [t])

  useEffect(() => {
    fetchTemplates()
  }, [fetchTemplates])

  useEffect(() => {
    if (value) {
      fetchDetail(value)
    } else {
      setDetail(null)
    }
  }, [value, fetchDetail])

  const handleSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value || null
    onChange(id)
    setEditMode('none')
    setVersionFormOpen(false)
  }

  // Template CRUD
  const openCreate = () => {
    setEditMode('create')
    setEditId(null)
    setFormName('')
    setFormDescription('')
  }

  const openEdit = () => {
    if (!detail) return
    setEditMode('edit')
    setEditId(detail.id)
    setFormName(detail.name)
    setFormDescription(detail.description)
  }

  const closeForm = () => {
    setEditMode('none')
    setEditId(null)
  }

  const handleSaveTemplate = async () => {
    if (!formName.trim()) return
    setSaving(true)
    try {
      if (editMode === 'create') {
        const created = await createTemplate({
          name: formName.trim(),
          description: formDescription.trim(),
        })
        onChange(created.id)
      } else if (editMode === 'edit' && editId) {
        await updateTemplate(editId, {
          name: formName.trim(),
          description: formDescription.trim(),
        })
        await fetchDetail(editId)
      }
      await fetchTemplates()
      closeForm()
    } catch {
      setError(t('promptTemplate.saveError'))
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteTemplate = async () => {
    if (!value) return
    if (!confirm(t('promptTemplate.deleteConfirm'))) return
    try {
      await deleteTemplate(value)
      onChange(null)
      setDetail(null)
      await fetchTemplates()
    } catch {
      setError(t('promptTemplate.deleteError'))
    }
  }

  // Version CRUD
  const handleCreateVersion = async () => {
    if (!value || !versionContent.trim()) return
    setVersionSaving(true)
    try {
      await createVersion(value, {
        content: versionContent.trim(),
        changeLog: versionChangeLog.trim(),
      })
      setVersionContent('')
      setVersionChangeLog('')
      setVersionFormOpen(false)
      await fetchDetail(value)
    } catch {
      setError(t('promptTemplate.versionError'))
    } finally {
      setVersionSaving(false)
    }
  }

  const handleActivateVersion = async (version: VersionResponse) => {
    if (!value) return
    try {
      await activateVersion(value, version.id)
      await fetchDetail(value)
    } catch {
      setError(t('promptTemplate.versionError'))
    }
  }

  const handleArchiveVersion = async (version: VersionResponse) => {
    if (!value) return
    try {
      await archiveVersion(value, version.id)
      await fetchDetail(value)
    } catch {
      setError(t('promptTemplate.versionError'))
    }
  }

  const truncate = (text: string, max: number) =>
    text.length > max ? text.slice(0, max) + '...' : text

  if (loading) {
    return <div className="PromptTemplateManager-loading">{t('promptTemplate.loading')}</div>
  }

  if (error && templates.length === 0) {
    return (
      <div className="PromptTemplateManager-error">
        <span>{error}</span>
        <button className="PromptTemplateManager-retryBtn" onClick={fetchTemplates}>
          {t('promptTemplate.retry')}
        </button>
      </div>
    )
  }

  return (
    <div className="PromptTemplateManager">
      {/* Template selector row */}
      <div className="PromptTemplateManager-row">
        <select
          className="PromptTemplateManager-select"
          value={value ?? ''}
          onChange={handleSelect}
        >
          <option value="">{t('promptTemplate.none')}</option>
          {templates.map(tpl => (
            <option key={tpl.id} value={tpl.id}>{tpl.name}</option>
          ))}
        </select>
        <button
          className="PromptTemplateManager-manageBtn"
          onClick={() => editMode === 'none' ? openCreate() : closeForm()}
          title={editMode === 'none' ? t('promptTemplate.add') : t('promptTemplate.close')}
        >
          {editMode === 'none' ? '+' : '\u00d7'}
        </button>
      </div>

      {/* Template create/edit form */}
      {editMode !== 'none' && (
        <div className="PromptTemplateManager-form">
          <input
            className="PromptTemplateManager-input"
            value={formName}
            onChange={e => setFormName(e.target.value)}
            placeholder={t('promptTemplate.namePlaceholder')}
          />
          <input
            className="PromptTemplateManager-input"
            value={formDescription}
            onChange={e => setFormDescription(e.target.value)}
            placeholder={t('promptTemplate.descriptionPlaceholder')}
          />
          <div className="PromptTemplateManager-formActions">
            <button
              className="PromptTemplateManager-saveBtn"
              onClick={handleSaveTemplate}
              disabled={saving || !formName.trim()}
            >
              {saving ? t('promptTemplate.saving') : editMode === 'create' ? t('promptTemplate.create') : t('promptTemplate.save')}
            </button>
            <button className="PromptTemplateManager-cancelBtn" onClick={closeForm}>
              {t('promptTemplate.cancel')}
            </button>
          </div>
        </div>
      )}

      {/* Selected template detail */}
      {value && editMode === 'none' && (
        <>
          {detailLoading && (
            <div className="PromptTemplateManager-detailLoading">{t('promptTemplate.loading')}</div>
          )}
          {detail && !detailLoading && (
            <div className="PromptTemplateManager-detail">
              <div className="PromptTemplateManager-detailHeader">
                <span className="PromptTemplateManager-detailName">{detail.name}</span>
                <div className="PromptTemplateManager-detailActions">
                  <button className="PromptTemplateManager-actionBtn" onClick={openEdit}>
                    {t('promptTemplate.edit')}
                  </button>
                  <button
                    className="PromptTemplateManager-actionBtn PromptTemplateManager-actionBtn--danger"
                    onClick={handleDeleteTemplate}
                  >
                    {t('promptTemplate.delete')}
                  </button>
                </div>
              </div>

              {detail.description && (
                <div className="PromptTemplateManager-description">{detail.description}</div>
              )}

              {/* Active version highlight */}
              {detail.activeVersion && (
                <div className="PromptTemplateManager-activeHighlight">
                  <span className="PromptTemplateManager-badge PromptTemplateManager-badge--active">
                    {t('promptTemplate.active')}
                  </span>
                  <span>v{detail.activeVersion.version}: {truncate(detail.activeVersion.content, 100)}</span>
                </div>
              )}

              {/* Versions */}
              <div className="PromptTemplateManager-versionsHeader">
                <span>{t('promptTemplate.versions')} ({detail.versions.length})</span>
                <button
                  className="PromptTemplateManager-addVersionBtn"
                  onClick={() => setVersionFormOpen(true)}
                >
                  {t('promptTemplate.addVersion')}
                </button>
              </div>

              {/* Version create form */}
              {versionFormOpen && (
                <div className="PromptTemplateManager-form">
                  <textarea
                    className="PromptTemplateManager-textarea"
                    value={versionContent}
                    onChange={e => setVersionContent(e.target.value)}
                    placeholder={t('promptTemplate.contentPlaceholder')}
                    rows={5}
                  />
                  <input
                    className="PromptTemplateManager-input"
                    value={versionChangeLog}
                    onChange={e => setVersionChangeLog(e.target.value)}
                    placeholder={t('promptTemplate.changeLogPlaceholder')}
                  />
                  <div className="PromptTemplateManager-formActions">
                    <button
                      className="PromptTemplateManager-saveBtn"
                      onClick={handleCreateVersion}
                      disabled={versionSaving || !versionContent.trim()}
                    >
                      {versionSaving ? t('promptTemplate.saving') : t('promptTemplate.createVersion')}
                    </button>
                    <button
                      className="PromptTemplateManager-cancelBtn"
                      onClick={() => { setVersionFormOpen(false); setVersionContent(''); setVersionChangeLog('') }}
                    >
                      {t('promptTemplate.cancel')}
                    </button>
                  </div>
                </div>
              )}

              {detail.versions.length === 0 && (
                <div className="PromptTemplateManager-noVersions">{t('promptTemplate.noVersions')}</div>
              )}

              <div className="PromptTemplateManager-versions">
                {detail.versions.slice().reverse().map(v => (
                  <div key={v.id} className="PromptTemplateManager-versionItem">
                    <div className="PromptTemplateManager-versionHeader">
                      <span className="PromptTemplateManager-versionNum">v{v.version}</span>
                      <span className={`PromptTemplateManager-badge PromptTemplateManager-badge--${v.status.toLowerCase()}`}>
                        {t(`promptTemplate.${v.status.toLowerCase()}`)}
                      </span>
                    </div>
                    <div className="PromptTemplateManager-versionContent">
                      {truncate(v.content, 120)}
                    </div>
                    {v.changeLog && (
                      <div className="PromptTemplateManager-versionChangeLog">{v.changeLog}</div>
                    )}
                    <div className="PromptTemplateManager-versionActions">
                      {v.status === 'DRAFT' && (
                        <button
                          className="PromptTemplateManager-versionBtn PromptTemplateManager-versionBtn--activate"
                          onClick={() => handleActivateVersion(v)}
                        >
                          {t('promptTemplate.activate')}
                        </button>
                      )}
                      {v.status === 'ACTIVE' && (
                        <button
                          className="PromptTemplateManager-versionBtn PromptTemplateManager-versionBtn--archive"
                          onClick={() => handleArchiveVersion(v)}
                        >
                          {t('promptTemplate.archive')}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {error && templates.length > 0 && (
        <div className="PromptTemplateManager-inlineError">{error}</div>
      )}
    </div>
  )
}
