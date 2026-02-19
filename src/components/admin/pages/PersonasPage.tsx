import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslation } from 'react-i18next'
import type { PersonaResponse } from '../../../types/api'
import { usePersonas, useCreatePersona, useUpdatePersona, useDeletePersona } from '../../../hooks/usePersonas'
import { CreatePersonaSchema, type CreatePersonaInput } from '../../../schemas/persona'
import './PersonasPage.css'

type EditMode = 'none' | 'create' | 'edit'

export function PersonasPage() {
  const { t } = useTranslation()
  const [editMode, setEditMode] = useState<EditMode>('none')
  const [editId, setEditId] = useState<string | null>(null)

  const { data: personas = [], isLoading, error } = usePersonas()
  const createMutation = useCreatePersona()
  const updateMutation = useUpdatePersona()
  const deleteMutation = useDeletePersona()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreatePersonaInput>({
    resolver: zodResolver(CreatePersonaSchema),
    defaultValues: { name: '', systemPrompt: '', isDefault: false },
  })

  const openCreate = () => {
    setEditMode('create')
    setEditId(null)
    reset({ name: '', systemPrompt: '', isDefault: false })
  }

  const openEdit = (persona: PersonaResponse) => {
    setEditMode('edit')
    setEditId(persona.id)
    reset({ name: persona.name, systemPrompt: persona.systemPrompt, isDefault: persona.isDefault })
  }

  const closeForm = () => {
    setEditMode('none')
    setEditId(null)
    reset()
  }

  const onSubmit = handleSubmit(async (data) => {
    if (editMode === 'create') {
      await createMutation.mutateAsync(data)
    } else if (editMode === 'edit' && editId) {
      await updateMutation.mutateAsync({ id: editId, data })
    }
    closeForm()
  })

  const handleDelete = async (id: string) => {
    if (!confirm(t('admin.personasPage.deleteConfirm'))) return
    await deleteMutation.mutateAsync(id)
  }

  const mutationError = createMutation.error ?? updateMutation.error ?? deleteMutation.error

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

      {(error || mutationError) && (
        <div className="PersonasPage-error">
          {error ? t('admin.personasPage.loadError') : t('admin.personasPage.saveError')}
        </div>
      )}

      {editMode !== 'none' && (
        <form className="PersonasPage-form" onSubmit={onSubmit}>
          <h3 className="PersonasPage-formTitle">
            {editMode === 'create' ? t('admin.personasPage.createTitle') : t('admin.personasPage.editTitle')}
          </h3>
          <input
            className="PersonasPage-input"
            {...register('name')}
            placeholder={t('admin.personasPage.namePlaceholder')}
          />
          {errors.name && <p className="PersonasPage-fieldError">{errors.name.message}</p>}
          <textarea
            className="PersonasPage-textarea"
            {...register('systemPrompt')}
            placeholder={t('admin.personasPage.promptPlaceholder')}
            rows={6}
          />
          {errors.systemPrompt && <p className="PersonasPage-fieldError">{errors.systemPrompt.message}</p>}
          <label className="PersonasPage-checkLabel">
            <input type="checkbox" {...register('isDefault')} />
            {t('admin.personasPage.setDefault')}
          </label>
          <div className="PersonasPage-formActions">
            <button className="PersonasPage-saveBtn" type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? t('admin.personasPage.saving')
                : editMode === 'create'
                  ? t('admin.personasPage.create')
                  : t('admin.personasPage.save')}
            </button>
            <button type="button" className="PersonasPage-cancelBtn" onClick={closeForm}>
              {t('admin.personasPage.cancel')}
            </button>
          </div>
        </form>
      )}

      {isLoading ? (
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
