import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { ToolPolicyResponse, ToolPolicyStateResponse } from '../../types/api'
import { deleteToolPolicy, getToolPolicy, updateToolPolicy } from '../../services/tool-policy'
import { getMcpServer, listMcpServers } from '../../services/mcp'
import './ToolPolicyManager.css'

type Mode = 'view' | 'edit'

function parseChannelToolMap(text: string): Record<string, string[]> {
  const out: Record<string, string[]> = {}
  for (const rawLine of text.split('\n')) {
    const line = rawLine.trim()
    if (!line) continue
    const idx = line.indexOf(':')
    if (idx <= 0) continue
    const channel = line.slice(0, idx).trim().toLowerCase()
    if (!channel) continue
    const toolsPart = line.slice(idx + 1).trim()
    if (!toolsPart) continue
    const tools = toolsPart
      .split(/[,\\s]+/g)
      .map(s => s.trim())
      .filter(Boolean)
    if (tools.length === 0) continue
    out[channel] = Array.from(new Set([...(out[channel] ?? []), ...tools]))
  }
  return out
}

function formatChannelToolMap(map: Record<string, string[]> | null | undefined): string {
  if (!map) return ''
  const channels = Object.keys(map).sort()
  return channels
    .map(ch => `${ch}: ${(map[ch] ?? []).join(', ')}`)
    .join('\n')
}

function splitLines(text: string): string[] {
  return text
    .split('\n')
    .map(s => s.trim())
    .filter(Boolean)
}

function joinLines(items: string[] | Set<string> | null | undefined): string {
  if (!items) return ''
  const arr = Array.isArray(items) ? items : Array.from(items)
  return arr.join('\n')
}

export function ToolPolicyManager() {
  const { t } = useTranslation()
  const [state, setState] = useState<ToolPolicyStateResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [mode, setMode] = useState<Mode>('view')
  const [saving, setSaving] = useState(false)
  const [toolsLoading, setToolsLoading] = useState(false)
  const [toolsError, setToolsError] = useState<string | null>(null)
  const [mcpToolsByServer, setMcpToolsByServer] = useState<Record<string, string[]>>({})

  // Form fields
  const [enabled, setEnabled] = useState(false)
  const [writeToolNamesText, setWriteToolNamesText] = useState('')
  const [denyWriteChannelsText, setDenyWriteChannelsText] = useState('slack')
  const [allowWriteToolNamesInDenyChannelsText, setAllowWriteToolNamesInDenyChannelsText] = useState('')
  const [allowWriteToolNamesByChannelText, setAllowWriteToolNamesByChannelText] = useState('')
  const [denyWriteMessage, setDenyWriteMessage] = useState(
    'Error: This tool is not allowed in this channel'
  )

  const effective: ToolPolicyResponse | null = state?.effective ?? null
  const stored: ToolPolicyResponse | null = state?.stored ?? null

  const seedForm = useCallback((p: ToolPolicyResponse) => {
    setEnabled(p.enabled)
    setWriteToolNamesText(joinLines(p.writeToolNames))
    setDenyWriteChannelsText(joinLines(p.denyWriteChannels))
    setAllowWriteToolNamesInDenyChannelsText(joinLines(p.allowWriteToolNamesInDenyChannels))
    setAllowWriteToolNamesByChannelText(formatChannelToolMap(p.allowWriteToolNamesByChannel))
    setDenyWriteMessage(p.denyWriteMessage)
  }, [])

  const fetchState = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getToolPolicy()
      setState(data)

      // Initialize form from stored if present, otherwise from effective.
      const base = data.stored ?? data.effective
      seedForm(base)
    } catch {
      setError(t('toolPolicy.loadError'))
      setState(null)
    } finally {
      setLoading(false)
    }
  }, [seedForm, t])

  const fetchMcpTools = useCallback(async () => {
    try {
      setToolsLoading(true)
      setToolsError(null)
      const servers = await listMcpServers()
      const out: Record<string, string[]> = {}
      for (const s of servers) {
        try {
          const detail = await getMcpServer(s.name)
          const tools = (detail.tools ?? []).slice().sort()
          out[s.name] = tools
        } catch {
          out[s.name] = []
        }
      }
      setMcpToolsByServer(out)
    } catch {
      setToolsError(t('toolPolicy.toolsLoadError'))
      setMcpToolsByServer({})
    } finally {
      setToolsLoading(false)
    }
  }, [t])

  useEffect(() => {
    fetchState()
  }, [fetchState])

  useEffect(() => {
    fetchMcpTools()
  }, [fetchMcpTools])

  const canSave = useMemo(() => {
    if (!denyWriteMessage.trim()) return false
    return true
  }, [denyWriteMessage])

  const allMcpToolsSorted = useMemo(() => {
    const set = new Set<string>()
    Object.values(mcpToolsByServer).forEach(tools => tools.forEach(t => set.add(t)))
    return Array.from(set).sort()
  }, [mcpToolsByServer])

  const toggleWriteTool = (toolName: string, checked: boolean) => {
    const current = new Set(splitLines(writeToolNamesText))
    if (checked) current.add(toolName)
    else current.delete(toolName)
    setWriteToolNamesText(Array.from(current).sort().join('\n'))
  }

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    try {
      await updateToolPolicy({
        enabled,
        writeToolNames: splitLines(writeToolNamesText),
        denyWriteChannels: splitLines(denyWriteChannelsText),
        allowWriteToolNamesInDenyChannels: splitLines(allowWriteToolNamesInDenyChannelsText),
        allowWriteToolNamesByChannel: parseChannelToolMap(allowWriteToolNamesByChannelText),
        denyWriteMessage: denyWriteMessage.trim(),
      })
      setMode('view')
      await fetchState()
    } catch (e) {
      setError(e instanceof Error ? e.message : t('toolPolicy.saveError'))
    } finally {
      setSaving(false)
    }
  }

  const handleReset = async () => {
    if (!confirm(t('toolPolicy.resetConfirm'))) return
    setSaving(true)
    setError(null)
    try {
      await deleteToolPolicy()
      setMode('view')
      await fetchState()
    } catch (e) {
      setError(e instanceof Error ? e.message : t('toolPolicy.resetError'))
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="ToolPolicy-loading">{t('toolPolicy.loading')}</div>
  }

  if (!state || !effective) {
    return (
      <div className="ToolPolicy">
        {error && <div className="ToolPolicy-error">{error}</div>}
        <button className="ToolPolicy-retry" onClick={fetchState}>
          {t('toolPolicy.retry')}
        </button>
      </div>
    )
  }

  return (
    <div className="ToolPolicy">
      <div className="ToolPolicy-top">
        <div>
          <div className="ToolPolicy-kv">
            <span className="ToolPolicy-k">{t('toolPolicy.configEnabled')}</span>
            <b className={`ToolPolicy-v ${state.configEnabled ? 'on' : 'off'}`}>
              {String(state.configEnabled)}
            </b>
          </div>
          <div className="ToolPolicy-kv">
            <span className="ToolPolicy-k">{t('toolPolicy.dynamicEnabled')}</span>
            <b className={`ToolPolicy-v ${state.dynamicEnabled ? 'on' : 'off'}`}>
              {String(state.dynamicEnabled)}
            </b>
          </div>
        </div>

        <div className="ToolPolicy-actions">
          <button
            className="ToolPolicy-btn"
            onClick={() => {
              if (mode === 'edit') {
                // Revert form to last known base
                seedForm(stored ?? effective)
                setMode('view')
              } else {
                setMode('edit')
              }
            }}
          >
            {mode === 'edit' ? t('toolPolicy.cancel') : t('toolPolicy.edit')}
          </button>
          <button className="ToolPolicy-btn ToolPolicy-btn--danger" onClick={handleReset} disabled={saving}>
            {t('toolPolicy.reset')}
          </button>
        </div>
      </div>

      {error && <div className="ToolPolicy-error">{error}</div>}

      <div className="ToolPolicy-sectionTitle">{t('toolPolicy.effective')}</div>
      <div className="ToolPolicy-card">
        <div className="ToolPolicy-row">
          <span className="ToolPolicy-label">{t('toolPolicy.enabled')}</span>
          <b>{String(effective.enabled)}</b>
        </div>
        <div className="ToolPolicy-row">
          <span className="ToolPolicy-label">{t('toolPolicy.writeTools')}</span>
          <b>{effective.writeToolNames.length}</b>
        </div>
        <div className="ToolPolicy-row">
          <span className="ToolPolicy-label">{t('toolPolicy.denyChannels')}</span>
          <b>{effective.denyWriteChannels.length}</b>
        </div>
        <div className="ToolPolicy-row">
          <span className="ToolPolicy-label">{t('toolPolicy.allowWriteToolsInDenyChannels')}</span>
          <b>{effective.allowWriteToolNamesInDenyChannels.length}</b>
        </div>
        <div className="ToolPolicy-row">
          <span className="ToolPolicy-label">{t('toolPolicy.allowWriteToolsByChannel')}</span>
          <b>{Object.keys(effective.allowWriteToolNamesByChannel || {}).length}</b>
        </div>
        <div className="ToolPolicy-row">
          <span className="ToolPolicy-label">{t('toolPolicy.denyMessage')}</span>
          <span className="ToolPolicy-mono">{effective.denyWriteMessage}</span>
        </div>
      </div>

      <div className="ToolPolicy-sectionTitle">{t('toolPolicy.stored')}</div>
      <div className="ToolPolicy-card">
        {stored ? (
          <>
            <div className="ToolPolicy-row">
              <span className="ToolPolicy-label">{t('toolPolicy.enabled')}</span>
              <b>{String(stored.enabled)}</b>
            </div>
            <div className="ToolPolicy-row">
              <span className="ToolPolicy-label">{t('toolPolicy.writeTools')}</span>
              <b>{stored.writeToolNames.length}</b>
            </div>
            <div className="ToolPolicy-row">
              <span className="ToolPolicy-label">{t('toolPolicy.denyChannels')}</span>
              <b>{stored.denyWriteChannels.length}</b>
            </div>
            <div className="ToolPolicy-row">
              <span className="ToolPolicy-label">{t('toolPolicy.allowWriteToolsInDenyChannels')}</span>
              <b>{stored.allowWriteToolNamesInDenyChannels.length}</b>
            </div>
            <div className="ToolPolicy-row">
              <span className="ToolPolicy-label">{t('toolPolicy.allowWriteToolsByChannel')}</span>
              <b>{Object.keys(stored.allowWriteToolNamesByChannel || {}).length}</b>
            </div>
          </>
        ) : (
          <div className="ToolPolicy-empty">{t('toolPolicy.noStored')}</div>
        )}
      </div>

      <div className="ToolPolicy-sectionTitle">{t('toolPolicy.editSection')}</div>
      <div className={`ToolPolicy-form ${mode !== 'edit' ? 'ToolPolicy-form--disabled' : ''}`}>
        <label className="ToolPolicy-check">
          <input type="checkbox" checked={enabled} onChange={e => setEnabled(e.target.checked)} disabled={mode !== 'edit'} />
          {t('toolPolicy.enabled')}
        </label>

        <div className="ToolPolicy-field">
          <div className="ToolPolicy-fieldLabel">{t('toolPolicy.writeTools')}</div>
          <textarea
            className="ToolPolicy-textarea"
            value={writeToolNamesText}
            onChange={e => setWriteToolNamesText(e.target.value)}
            placeholder={t('toolPolicy.writeToolsPlaceholder')}
            rows={6}
            disabled={mode !== 'edit'}
          />
          <div className="ToolPolicy-toolsBar">
            <button
              className="ToolPolicy-btn ToolPolicy-btn--small"
              onClick={fetchMcpTools}
              disabled={toolsLoading || mode !== 'edit'}
              type="button"
            >
              {toolsLoading ? t('toolPolicy.toolsLoading') : t('toolPolicy.refreshTools')}
            </button>
            {toolsError && <div className="ToolPolicy-toolsError">{toolsError}</div>}
          </div>
          {mode === 'edit' && allMcpToolsSorted.length > 0 && (
            <div className="ToolPolicy-toolsGrid">
              {allMcpToolsSorted.map(tool => {
                const checked = splitLines(writeToolNamesText).includes(tool)
                return (
                  <label key={tool} className="ToolPolicy-toolCheck">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={e => toggleWriteTool(tool, e.target.checked)}
                    />
                    <span className="ToolPolicy-toolName">{tool}</span>
                  </label>
                )
              })}
            </div>
          )}
        </div>

        <div className="ToolPolicy-field">
          <div className="ToolPolicy-fieldLabel">{t('toolPolicy.denyChannels')}</div>
          <textarea
            className="ToolPolicy-textarea"
            value={denyWriteChannelsText}
            onChange={e => setDenyWriteChannelsText(e.target.value)}
            placeholder={t('toolPolicy.denyChannelsPlaceholder')}
            rows={3}
            disabled={mode !== 'edit'}
          />
        </div>

        <div className="ToolPolicy-field">
          <div className="ToolPolicy-fieldLabel">{t('toolPolicy.allowWriteToolsInDenyChannels')}</div>
          <textarea
            className="ToolPolicy-textarea"
            value={allowWriteToolNamesInDenyChannelsText}
            onChange={e => setAllowWriteToolNamesInDenyChannelsText(e.target.value)}
            placeholder={t('toolPolicy.allowWriteToolsInDenyChannelsPlaceholder')}
            rows={4}
            disabled={mode !== 'edit'}
          />
        </div>

        <div className="ToolPolicy-field">
          <div className="ToolPolicy-fieldLabel">{t('toolPolicy.allowWriteToolsByChannel')}</div>
          <textarea
            className="ToolPolicy-textarea"
            value={allowWriteToolNamesByChannelText}
            onChange={e => setAllowWriteToolNamesByChannelText(e.target.value)}
            placeholder={t('toolPolicy.allowWriteToolsByChannelPlaceholder')}
            rows={6}
            disabled={mode !== 'edit'}
          />
        </div>

        <div className="ToolPolicy-field">
          <div className="ToolPolicy-fieldLabel">{t('toolPolicy.denyMessage')}</div>
          <input
            className="ToolPolicy-input"
            value={denyWriteMessage}
            onChange={e => setDenyWriteMessage(e.target.value)}
            placeholder={t('toolPolicy.denyMessagePlaceholder')}
            disabled={mode !== 'edit'}
          />
        </div>

        <div className="ToolPolicy-formActions">
          <button className="ToolPolicy-btn ToolPolicy-btn--primary" onClick={handleSave} disabled={mode !== 'edit' || saving || !canSave}>
            {saving ? t('toolPolicy.saving') : t('toolPolicy.save')}
          </button>
        </div>
      </div>
    </div>
  )
}
