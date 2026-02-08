import { useState, useEffect, useCallback } from 'react'
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
      setError('페르소나 목록을 불러올 수 없습니다')
      setPersonas([])
    } finally {
      setLoading(false)
    }
  }, [])

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
      setError('저장에 실패했습니다')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deletePersona(id)
      if (value === id) onChange(null)
      await fetchPersonas()
    } catch {
      setError('삭제에 실패했습니다')
    }
  }

  if (loading) {
    return <div className="PersonaSelector-loading">불러오는 중...</div>
  }

  if (error && personas.length === 0) {
    return (
      <div className="PersonaSelector-error">
        <span>{error}</span>
        <button className="PersonaSelector-retryBtn" onClick={fetchPersonas}>재시도</button>
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
          <option value="">직접 입력 (커스텀)</option>
          {personas.map(p => (
            <option key={p.id} value={p.id}>
              {p.name}{p.isDefault ? ' (기본)' : ''}
            </option>
          ))}
        </select>
        <button
          className="PersonaSelector-manageBtn"
          onClick={() => editMode === 'none' ? openCreate() : closeForm()}
          title={editMode === 'none' ? '페르소나 추가' : '닫기'}
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
                수정
              </button>
              <button
                className="PersonaSelector-deleteBtn"
                onClick={() => handleDelete(selected.id)}
              >
                삭제
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
            placeholder="페르소나 이름"
          />
          <textarea
            className="PersonaSelector-textarea"
            value={formPrompt}
            onChange={e => setFormPrompt(e.target.value)}
            placeholder="시스템 프롬프트"
            rows={4}
          />
          <label className="PersonaSelector-checkLabel">
            <input
              type="checkbox"
              checked={formIsDefault}
              onChange={e => setFormIsDefault(e.target.checked)}
            />
            기본 페르소나로 설정
          </label>
          <div className="PersonaSelector-formActions">
            <button
              className="PersonaSelector-saveBtn"
              onClick={handleSave}
              disabled={saving || !formName.trim() || !formPrompt.trim()}
            >
              {saving ? '저장 중...' : editMode === 'create' ? '생성' : '저장'}
            </button>
            <button className="PersonaSelector-cancelBtn" onClick={closeForm}>
              취소
            </button>
          </div>
        </div>
      )}

      {error && <div className="PersonaSelector-inlineError">{error}</div>}
    </div>
  )
}
