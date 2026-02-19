import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type {
  CreateOutputGuardRuleRequest,
  OutputGuardRuleResponse,
  OutputGuardSimulationResponse,
} from '../../types/api'
import {
  createOutputGuardRule,
  deleteOutputGuardRule,
  listOutputGuardAudits,
  listOutputGuardRules,
  simulateOutputGuard,
  updateOutputGuardRule,
} from '../../services/output-guard'
import './OutputGuardRuleManager.css'

type Mode = 'none' | 'create' | 'edit'

export function OutputGuardRuleManager() {
  const { t } = useTranslation()
  const [items, setItems] = useState<OutputGuardRuleResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [expanded, setExpanded] = useState<string | null>(null)
  const [mode, setMode] = useState<Mode>('none')
  const [saving, setSaving] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)

  // Form
  const [name, setName] = useState('')
  const [pattern, setPattern] = useState('')
  const [action, setAction] = useState('MASK')
  const [priority, setPriority] = useState('100')
  const [enabled, setEnabled] = useState(true)

  // Simulation
  const [simContent, setSimContent] = useState('')
  const [simIncludeDisabled, setSimIncludeDisabled] = useState(false)
  const [simResult, setSimResult] = useState<OutputGuardSimulationResponse | null>(null)
  const [simLoading, setSimLoading] = useState(false)

  // Audits
  const [audits, setAudits] = useState<Array<{ action: string; actor: string; detail: string | null; createdAt: number }>>([])

  const fetchAll = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await listOutputGuardRules()
      setItems(data)
    } catch {
      setError(t('outputGuard.loadError'))
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  const fetchAudits = async () => {
    try {
      const data = await listOutputGuardAudits(50)
      setAudits(data.map(a => ({ action: a.action, actor: a.actor, detail: a.detail, createdAt: a.createdAt })))
    } catch {
      setAudits([])
    }
  }

  useEffect(() => {
    fetchAll()
    fetchAudits()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const selected = !expanded ? null : items.find(i => i.id === expanded) ?? null

  const resetForm = () => {
    setName('')
    setPattern('')
    setAction('MASK')
    setPriority('100')
    setEnabled(true)
  }

  const openCreate = () => {
    resetForm()
    setEditId(null)
    setMode('create')
  }

  const openEdit = (rule: OutputGuardRuleResponse) => {
    setEditId(rule.id)
    setMode('edit')
    setName(rule.name)
    setPattern(rule.pattern)
    setAction(rule.action)
    setPriority(String(rule.priority))
    setEnabled(rule.enabled)
  }

  const closeForm = () => {
    setMode('none')
    setEditId(null)
  }

  const handleSave = async () => {
    if (!name.trim() || !pattern.trim()) return

    setSaving(true)
    setError(null)
    try {
      const body: CreateOutputGuardRuleRequest = {
        name: name.trim(),
        pattern: pattern.trim(),
        action: action.trim() || 'MASK',
        priority: Number(priority) || 100,
        enabled,
      }

      if (mode === 'create') {
        await createOutputGuardRule(body)
      } else if (mode === 'edit' && editId) {
        await updateOutputGuardRule(editId, body)
      }

      closeForm()
      await fetchAll()
      await fetchAudits()
    } catch (e) {
      setError(e instanceof Error ? e.message : t('outputGuard.saveError'))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm(t('outputGuard.deleteConfirm'))) return
    setError(null)
    try {
      await deleteOutputGuardRule(id)
      if (expanded === id) setExpanded(null)
      await fetchAll()
      await fetchAudits()
    } catch {
      setError(t('outputGuard.deleteError'))
    }
  }

  const handleSimulate = async () => {
    if (!simContent.trim()) return
    setSimLoading(true)
    setError(null)
    setSimResult(null)
    try {
      const res = await simulateOutputGuard({ content: simContent.trim(), includeDisabled: simIncludeDisabled })
      setSimResult(res)
      await fetchAudits()
    } catch (e) {
      setError(e instanceof Error ? e.message : t('outputGuard.simulateError'))
    } finally {
      setSimLoading(false)
    }
  }

  if (loading) {
    return <div className="OutputGuardManager-loading">{t('outputGuard.loading')}</div>
  }

  return (
    <div className="OutputGuardManager">
      <div className="OutputGuardManager-header">
        <span className="OutputGuardManager-count">
          {items.length > 0 ? t('outputGuard.count', { count: items.length }) : ''}
        </span>
        <button className="OutputGuardManager-addBtn" onClick={mode === 'none' ? openCreate : closeForm}>
          {mode === 'none' ? '+' : '\u00d7'}
        </button>
      </div>

      {error && <div className="OutputGuardManager-error">{error}</div>}

      {mode !== 'none' && (
        <div className="OutputGuardManager-form">
          <div className="OutputGuardManager-formTitle">
            {mode === 'create' ? t('outputGuard.createTitle') : t('outputGuard.editTitle')}
          </div>

          <input
            className="OutputGuardManager-input"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder={t('outputGuard.namePlaceholder')}
          />

          <textarea
            className="OutputGuardManager-textarea"
            value={pattern}
            onChange={e => setPattern(e.target.value)}
            placeholder={t('outputGuard.patternPlaceholder')}
            rows={3}
          />

          <div className="OutputGuardManager-row">
            <select className="OutputGuardManager-select" value={action} onChange={e => setAction(e.target.value)}>
              <option value="MASK">MASK</option>
              <option value="REJECT">REJECT</option>
            </select>
            <input
              className="OutputGuardManager-input"
              value={priority}
              onChange={e => setPriority(e.target.value)}
              placeholder={t('outputGuard.priorityPlaceholder')}
            />
          </div>

          <label className="OutputGuardManager-checkLabel">
            <input type="checkbox" checked={enabled} onChange={e => setEnabled(e.target.checked)} />
            {t('outputGuard.enabled')}
          </label>

          <div className="OutputGuardManager-formActions">
            <button
              className="OutputGuardManager-saveBtn"
              onClick={handleSave}
              disabled={saving || !name.trim() || !pattern.trim()}
            >
              {saving ? t('outputGuard.saving') : t('outputGuard.save')}
            </button>
            <button className="OutputGuardManager-cancelBtn" onClick={closeForm}>
              {t('outputGuard.cancel')}
            </button>
          </div>
        </div>
      )}

      <div className="OutputGuardManager-sectionTitle">{t('outputGuard.rules')}</div>

      {items.length === 0 ? (
        <div className="OutputGuardManager-empty">{t('outputGuard.empty')}</div>
      ) : (
        <div className="OutputGuardManager-list">
          {items.map(rule => (
            <div key={rule.id} className="OutputGuardManager-item">
              <div className="OutputGuardManager-itemTop">
                <button
                  className="OutputGuardManager-nameBtn"
                  onClick={() => setExpanded(expanded === rule.id ? null : rule.id)}
                >
                  {rule.name}
                </button>
                <span className={`OutputGuardManager-badge${rule.enabled ? '' : ' OutputGuardManager-badge--disabled'}`}>
                  {rule.enabled ? t('outputGuard.enabledYes') : t('outputGuard.enabledNo')}
                </span>
              </div>
              <div className="OutputGuardManager-meta">
                <span className="OutputGuardManager-chip">{rule.action}</span>
                <span className="OutputGuardManager-chip">{t('outputGuard.priority', { value: rule.priority })}</span>
              </div>

              {expanded === rule.id && (
                <div className="OutputGuardManager-detail">
                  <pre className="OutputGuardManager-pattern">{rule.pattern}</pre>
                  <div className="OutputGuardManager-actions">
                    <button className="OutputGuardManager-actionBtn" onClick={() => openEdit(rule)}>
                      {t('outputGuard.edit')}
                    </button>
                    <button className="OutputGuardManager-actionBtn OutputGuardManager-actionBtn--danger" onClick={() => handleDelete(rule.id)}>
                      {t('outputGuard.delete')}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="OutputGuardManager-sectionTitle">{t('outputGuard.simulation')}</div>
      <div className="OutputGuardManager-sim">
        <textarea
          className="OutputGuardManager-textarea"
          value={simContent}
          onChange={e => setSimContent(e.target.value)}
          placeholder={t('outputGuard.simulationPlaceholder')}
          rows={3}
        />
        <label className="OutputGuardManager-checkLabel">
          <input
            type="checkbox"
            checked={simIncludeDisabled}
            onChange={e => setSimIncludeDisabled(e.target.checked)}
          />
          {t('outputGuard.includeDisabled')}
        </label>
        <button
          className="OutputGuardManager-saveBtn"
          onClick={handleSimulate}
          disabled={simLoading || !simContent.trim()}
        >
          {simLoading ? t('outputGuard.simulating') : t('outputGuard.simulate')}
        </button>

        {simResult && (
          <div className="OutputGuardManager-simResult">
            <div className="OutputGuardManager-simRow">
              <span>{t('outputGuard.blocked')}</span>
              <b>{String(simResult.blocked)}</b>
            </div>
            <div className="OutputGuardManager-simRow">
              <span>{t('outputGuard.modified')}</span>
              <b>{String(simResult.modified)}</b>
            </div>
            {simResult.blockedByRuleName && (
              <div className="OutputGuardManager-simRow">
                <span>{t('outputGuard.blockedBy')}</span>
                <b>{simResult.blockedByRuleName}</b>
              </div>
            )}
            <pre className="OutputGuardManager-pattern">{simResult.resultContent}</pre>
          </div>
        )}
      </div>

      <div className="OutputGuardManager-sectionTitle">{t('outputGuard.audits')}</div>
      <div className="OutputGuardManager-audits">
        {audits.length === 0 ? (
          <div className="OutputGuardManager-empty">{t('outputGuard.noAudits')}</div>
        ) : (
          audits.map((a, idx) => (
            <div key={idx} className="OutputGuardManager-auditRow">
              <span className="OutputGuardManager-chip">{a.action}</span>
              <span className="OutputGuardManager-auditActor">{a.actor}</span>
              <span className="OutputGuardManager-auditDetail">{a.detail || ''}</span>
            </div>
          ))
        )}
      </div>

      {selected == null && items.length > 0 && (
        <div className="OutputGuardManager-hint">{t('outputGuard.hint')}</div>
      )}
    </div>
  )
}
