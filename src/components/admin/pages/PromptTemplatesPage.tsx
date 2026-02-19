import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  useTemplates,
  useTemplate,
  useCreateTemplate,
  useUpdateTemplate,
  useDeleteTemplate,
  useCreateVersion,
  useActivateVersion,
  useArchiveVersion,
} from '../../../hooks/usePromptTemplates'
import type { TemplateResponse, VersionStatus } from '../../../types/api'
import './PromptTemplatesPage.css'

const STATUS_LABELS: Record<VersionStatus, string> = {
  DRAFT: 'Draft',
  ACTIVE: 'Active',
  ARCHIVED: 'Archived',
}

export function PromptTemplatesPage() {
  const { t } = useTranslation()
  const { data: templates, isLoading, isError, refetch } = useTemplates()

  const [selectedId, setSelectedId] = useState<string>('')
  const { data: detail } = useTemplate(selectedId)

  const createTemplate = useCreateTemplate()
  const updateTemplate = useUpdateTemplate()
  const deleteTemplate = useDeleteTemplate()
  const createVersion = useCreateVersion()
  const activateVersion = useActivateVersion()
  const archiveVersion = useArchiveVersion()

  const [newTemplateName, setNewTemplateName] = useState('')
  const [newTemplateDesc, setNewTemplateDesc] = useState('')
  const [showNewTemplate, setShowNewTemplate] = useState(false)

  const [newVersionContent, setNewVersionContent] = useState('')
  const [newVersionLog, setNewVersionLog] = useState('')
  const [showNewVersion, setShowNewVersion] = useState(false)

  const [confirmDelete, setConfirmDelete] = useState<TemplateResponse | null>(null)
  const [actionError, setActionError] = useState('')

  const [editTemplate, setEditTemplate] = useState<TemplateResponse | null>(null)
  const [editName, setEditName] = useState('')
  const [editDesc, setEditDesc] = useState('')

  const [compareVersions, setCompareVersions] = useState<{ a: string; b: string } | null>(null)

  async function handleCreateTemplate() {
    if (!newTemplateName.trim()) return
    setActionError('')
    try {
      const t = await createTemplate.mutateAsync({
        name: newTemplateName.trim(),
        description: newTemplateDesc.trim() || undefined,
      })
      setSelectedId(t.id)
      setNewTemplateName('')
      setNewTemplateDesc('')
      setShowNewTemplate(false)
    } catch {
      setActionError('Failed to create template')
    }
  }

  async function handleUpdateTemplate() {
    if (!editTemplate) return
    setActionError('')
    try {
      await updateTemplate.mutateAsync({
        id: editTemplate.id,
        req: { name: editName, description: editDesc },
      })
      setEditTemplate(null)
    } catch {
      setActionError('Failed to update template')
    }
  }

  async function handleDelete() {
    if (!confirmDelete) return
    try {
      await deleteTemplate.mutateAsync(confirmDelete.id)
      if (selectedId === confirmDelete.id) setSelectedId('')
      setConfirmDelete(null)
    } catch {
      setActionError('Failed to delete template')
    }
  }

  async function handleCreateVersion() {
    if (!selectedId || !newVersionContent.trim()) return
    setActionError('')
    try {
      await createVersion.mutateAsync({
        templateId: selectedId,
        req: { content: newVersionContent, changeLog: newVersionLog || undefined },
      })
      setNewVersionContent('')
      setNewVersionLog('')
      setShowNewVersion(false)
    } catch {
      setActionError('Failed to create version')
    }
  }

  async function handleActivate(versionId: string) {
    if (!selectedId) return
    setActionError('')
    try {
      await activateVersion.mutateAsync({ templateId: selectedId, versionId })
    } catch {
      setActionError('Failed to activate version')
    }
  }

  async function handleArchive(versionId: string) {
    if (!selectedId) return
    setActionError('')
    try {
      await archiveVersion.mutateAsync({ templateId: selectedId, versionId })
    } catch {
      setActionError('Failed to archive version')
    }
  }

  const versions = detail?.versions ?? []
  const compareA = compareVersions ? versions.find((v) => v.id === compareVersions.a) : null
  const compareB = compareVersions ? versions.find((v) => v.id === compareVersions.b) : null

  return (
    <div className="PromptTemplatesPage">
      <div className="PromptTemplatesPage-header">
        <div>
          <h1 className="PromptTemplatesPage-title">{t('admin.promptTemplates.title')}</h1>
          <p className="PromptTemplatesPage-description">{t('admin.promptTemplates.description')}</p>
        </div>
        <button
          className="PromptTemplatesPage-btn"
          onClick={() => setShowNewTemplate(true)}
        >
          {t('admin.promptTemplates.newTemplate')}
        </button>
      </div>

      {actionError && <div className="PromptTemplatesPage-error">{actionError}</div>}

      <div className="PromptTemplatesPage-body">
        {/* Template list */}
        <div className="PromptTemplatesPage-list">
          {isLoading && <div className="PromptTemplatesPage-state">{t('admin.promptTemplates.loading')}</div>}
          {isError && (
            <div className="PromptTemplatesPage-error">
              {t('admin.promptTemplates.loadError')}
              <button className="PromptTemplatesPage-btnSecondary" onClick={() => refetch()}>
                {t('admin.promptTemplates.retry')}
              </button>
            </div>
          )}
          {templates?.map((tmpl) => (
            <div
              key={tmpl.id}
              className={`PromptTemplatesPage-listItem${selectedId === tmpl.id ? ' PromptTemplatesPage-listItem--active' : ''}`}
              onClick={() => setSelectedId(tmpl.id)}
            >
              <div className="PromptTemplatesPage-listItemName">{tmpl.name}</div>
              {tmpl.description && (
                <div className="PromptTemplatesPage-listItemDesc">{tmpl.description}</div>
              )}
              <div className="PromptTemplatesPage-listItemActions">
                <button
                  className="PromptTemplatesPage-iconBtn"
                  onClick={(e) => {
                    e.stopPropagation()
                    setEditTemplate(tmpl)
                    setEditName(tmpl.name)
                    setEditDesc(tmpl.description)
                  }}
                >
                  {t('admin.promptTemplates.edit')}
                </button>
                <button
                  className="PromptTemplatesPage-iconBtnDanger"
                  onClick={(e) => {
                    e.stopPropagation()
                    setConfirmDelete(tmpl)
                  }}
                >
                  {t('admin.promptTemplates.delete')}
                </button>
              </div>
            </div>
          ))}
          {!isLoading && !isError && templates?.length === 0 && (
            <div className="PromptTemplatesPage-state">{t('admin.promptTemplates.empty')}</div>
          )}
        </div>

        {/* Version detail */}
        <div className="PromptTemplatesPage-detail">
          {!selectedId ? (
            <div className="PromptTemplatesPage-state">{t('admin.promptTemplates.selectHint')}</div>
          ) : (
            <>
              <div className="PromptTemplatesPage-detailHeader">
                <span className="PromptTemplatesPage-detailTitle">{detail?.name}</span>
                <div className="PromptTemplatesPage-detailActions">
                  {versions.length >= 2 && (
                    <button
                      className="PromptTemplatesPage-btnSecondary"
                      onClick={() =>
                        setCompareVersions({
                          a: versions[versions.length - 2]?.id ?? '',
                          b: versions[versions.length - 1]?.id ?? '',
                        })
                      }
                    >
                      {t('admin.promptTemplates.compare')}
                    </button>
                  )}
                  <button
                    className="PromptTemplatesPage-btn"
                    onClick={() => setShowNewVersion(true)}
                  >
                    {t('admin.promptTemplates.addVersion')}
                  </button>
                </div>
              </div>

              {versions.length === 0 ? (
                <div className="PromptTemplatesPage-state">{t('admin.promptTemplates.noVersions')}</div>
              ) : (
                <div className="PromptTemplatesPage-versions">
                  {[...versions].reverse().map((v) => (
                    <div key={v.id} className="PromptTemplatesPage-version">
                      <div className="PromptTemplatesPage-versionMeta">
                        <span className="PromptTemplatesPage-versionNum">v{v.version}</span>
                        <span className={`PromptTemplatesPage-statusBadge PromptTemplatesPage-statusBadge--${v.status.toLowerCase()}`}>
                          {STATUS_LABELS[v.status]}
                        </span>
                        <span className="PromptTemplatesPage-versionDate">
                          {new Date(v.createdAt).toLocaleString()}
                        </span>
                        {v.changeLog && (
                          <span className="PromptTemplatesPage-changeLog">{v.changeLog}</span>
                        )}
                      </div>
                      <pre className="PromptTemplatesPage-versionContent">{v.content}</pre>
                      <div className="PromptTemplatesPage-versionActions">
                        {v.status === 'DRAFT' && (
                          <button
                            className="PromptTemplatesPage-btn"
                            onClick={() => handleActivate(v.id)}
                            disabled={activateVersion.isPending}
                          >
                            {t('admin.promptTemplates.activate')}
                          </button>
                        )}
                        {v.status === 'ACTIVE' && (
                          <button
                            className="PromptTemplatesPage-btnSecondary"
                            onClick={() => handleArchive(v.id)}
                            disabled={archiveVersion.isPending}
                          >
                            {t('admin.promptTemplates.archive')}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* New template dialog */}
      {showNewTemplate && (
        <div className="PromptTemplatesPage-overlay" onClick={() => setShowNewTemplate(false)}>
          <div className="PromptTemplatesPage-dialog" onClick={(e) => e.stopPropagation()}>
            <h3 className="PromptTemplatesPage-dialogTitle">{t('admin.promptTemplates.createTitle')}</h3>
            <input
              className="PromptTemplatesPage-input"
              placeholder={t('admin.promptTemplates.namePlaceholder')}
              value={newTemplateName}
              onChange={(e) => setNewTemplateName(e.target.value)}
            />
            <input
              className="PromptTemplatesPage-input"
              placeholder={t('admin.promptTemplates.descPlaceholder')}
              value={newTemplateDesc}
              onChange={(e) => setNewTemplateDesc(e.target.value)}
            />
            <div className="PromptTemplatesPage-dialogActions">
              <button
                className="PromptTemplatesPage-btn"
                onClick={handleCreateTemplate}
                disabled={!newTemplateName.trim() || createTemplate.isPending}
              >
                {createTemplate.isPending ? t('admin.promptTemplates.saving') : t('admin.promptTemplates.create')}
              </button>
              <button className="PromptTemplatesPage-btnSecondary" onClick={() => setShowNewTemplate(false)}>
                {t('admin.promptTemplates.cancel')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit template dialog */}
      {editTemplate && (
        <div className="PromptTemplatesPage-overlay" onClick={() => setEditTemplate(null)}>
          <div className="PromptTemplatesPage-dialog" onClick={(e) => e.stopPropagation()}>
            <h3 className="PromptTemplatesPage-dialogTitle">{t('admin.promptTemplates.editTitle')}</h3>
            <input
              className="PromptTemplatesPage-input"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
            />
            <input
              className="PromptTemplatesPage-input"
              value={editDesc}
              onChange={(e) => setEditDesc(e.target.value)}
            />
            <div className="PromptTemplatesPage-dialogActions">
              <button
                className="PromptTemplatesPage-btn"
                onClick={handleUpdateTemplate}
                disabled={!editName.trim() || updateTemplate.isPending}
              >
                {updateTemplate.isPending ? t('admin.promptTemplates.saving') : t('admin.promptTemplates.save')}
              </button>
              <button className="PromptTemplatesPage-btnSecondary" onClick={() => setEditTemplate(null)}>
                {t('admin.promptTemplates.cancel')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add version dialog */}
      {showNewVersion && (
        <div className="PromptTemplatesPage-overlay" onClick={() => setShowNewVersion(false)}>
          <div className="PromptTemplatesPage-dialog PromptTemplatesPage-dialog--wide" onClick={(e) => e.stopPropagation()}>
            <h3 className="PromptTemplatesPage-dialogTitle">{t('admin.promptTemplates.addVersionTitle')}</h3>
            <textarea
              className="PromptTemplatesPage-textarea"
              placeholder={t('admin.promptTemplates.contentPlaceholder')}
              value={newVersionContent}
              onChange={(e) => setNewVersionContent(e.target.value)}
              rows={8}
            />
            <input
              className="PromptTemplatesPage-input"
              placeholder={t('admin.promptTemplates.changeLogPlaceholder')}
              value={newVersionLog}
              onChange={(e) => setNewVersionLog(e.target.value)}
            />
            <div className="PromptTemplatesPage-dialogActions">
              <button
                className="PromptTemplatesPage-btn"
                onClick={handleCreateVersion}
                disabled={!newVersionContent.trim() || createVersion.isPending}
              >
                {createVersion.isPending ? t('admin.promptTemplates.saving') : t('admin.promptTemplates.createVersion')}
              </button>
              <button className="PromptTemplatesPage-btnSecondary" onClick={() => setShowNewVersion(false)}>
                {t('admin.promptTemplates.cancel')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {confirmDelete && (
        <div className="PromptTemplatesPage-overlay" onClick={() => setConfirmDelete(null)}>
          <div className="PromptTemplatesPage-dialog" onClick={(e) => e.stopPropagation()}>
            <p className="PromptTemplatesPage-dialogText">
              {t('admin.promptTemplates.deleteConfirm', { name: confirmDelete.name })}
            </p>
            <div className="PromptTemplatesPage-dialogActions">
              <button
                className="PromptTemplatesPage-btnDanger"
                onClick={handleDelete}
                disabled={deleteTemplate.isPending}
              >
                {t('admin.promptTemplates.delete')}
              </button>
              <button className="PromptTemplatesPage-btnSecondary" onClick={() => setConfirmDelete(null)}>
                {t('admin.promptTemplates.cancel')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Compare dialog */}
      {compareVersions && compareA && compareB && (
        <div className="PromptTemplatesPage-overlay" onClick={() => setCompareVersions(null)}>
          <div className="PromptTemplatesPage-dialog PromptTemplatesPage-dialog--wide" onClick={(e) => e.stopPropagation()}>
            <h3 className="PromptTemplatesPage-dialogTitle">{t('admin.promptTemplates.compareTitle')}</h3>
            <div className="PromptTemplatesPage-compareGrid">
              <div>
                <div className="PromptTemplatesPage-compareLabel">v{compareA.version} ({STATUS_LABELS[compareA.status]})</div>
                <pre className="PromptTemplatesPage-compareContent">{compareA.content}</pre>
              </div>
              <div>
                <div className="PromptTemplatesPage-compareLabel">v{compareB.version} ({STATUS_LABELS[compareB.status]})</div>
                <pre className="PromptTemplatesPage-compareContent">{compareB.content}</pre>
              </div>
            </div>
            <div className="PromptTemplatesPage-dialogActions">
              <button className="PromptTemplatesPage-btnSecondary" onClick={() => setCompareVersions(null)}>
                {t('admin.promptTemplates.close')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
