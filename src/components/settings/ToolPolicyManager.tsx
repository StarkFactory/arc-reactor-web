import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { ToolPolicyResponse, ToolPolicyStateResponse } from '../../types/api'
import { deleteToolPolicy, getToolPolicy, updateToolPolicy } from '../../services/tool-policy'
import { getMcpServer, listMcpServers } from '../../services/mcp'
import './ToolPolicyManager.css'

type Mode = 'view' | 'edit'

function normalizeChannel(s: string): string {
  return s.trim().toLowerCase()
}

function parseChannelToolMap(text: string): Record<string, string[]> {
  const out: Record<string, string[]> = {}
  for (const rawLine of text.split('\n')) {
    const line = rawLine.trim()
    if (!line) continue
    const idx = line.indexOf(':')
    if (idx <= 0) continue
    const channel = normalizeChannel(line.slice(0, idx))
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

function matchesFilter(value: string, filter: string): boolean {
  const f = filter.trim().toLowerCase()
  if (!f) return true
  return value.toLowerCase().includes(f)
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
  const [writeToolFilter, setWriteToolFilter] = useState('')
  const [allowToolFilter, setAllowToolFilter] = useState('')
  const [collapsedServers, setCollapsedServers] = useState<Record<string, boolean>>({})
  const [selectedAllowChannel, setSelectedAllowChannel] = useState('')
  const [showAdvancedAllowByChannel, setShowAdvancedAllowByChannel] = useState(false)
  const [denyChannelDraft, setDenyChannelDraft] = useState('')
  const [denyChannelError, setDenyChannelError] = useState<string | null>(null)

  // Form fields
  const [enabled, setEnabled] = useState(false)
  const [writeToolNamesText, setWriteToolNamesText] = useState('')
  const [denyWriteChannelsText, setDenyWriteChannelsText] = useState('slack')
  const [allowWriteToolNamesInDenyChannelsText, setAllowWriteToolNamesInDenyChannelsText] = useState('')
  const [allowWriteToolNamesByChannelText, setAllowWriteToolNamesByChannelText] = useState('')
  const [denyWriteMessage, setDenyWriteMessage] = useState(
    'Error: This tool is not allowed in this channel'
  )

  const writeToolSet = useMemo(() => new Set(splitLines(writeToolNamesText)), [writeToolNamesText])
  const allowByChannel = useMemo(
    () => parseChannelToolMap(allowWriteToolNamesByChannelText),
    [allowWriteToolNamesByChannelText]
  )

  const denyChannels = useMemo(() => {
    return Array.from(new Set(splitLines(denyWriteChannelsText).map(normalizeChannel).filter(Boolean))).sort()
  }, [denyWriteChannelsText])

  // Only deny-channels are enforced, so keep the main UI scoped to them.
  // Non-deny channels can still be edited via Advanced textarea.
  const allowChannels = useMemo(() => denyChannels, [denyChannels])

  useEffect(() => {
    if (!allowChannels.length) {
      if (selectedAllowChannel) setSelectedAllowChannel('')
      return
    }
    if (!selectedAllowChannel || !allowChannels.includes(selectedAllowChannel)) {
      setSelectedAllowChannel(allowChannels[0])
    }
  }, [allowChannels, selectedAllowChannel])

  const addDenyChannel = () => {
    setDenyChannelError(null)
    const ch = normalizeChannel(denyChannelDraft)
    if (!ch) return

    if (denyChannels.includes(ch)) {
      setDenyChannelError(t('toolPolicy.channelExists'))
      return
    }

    const next = [...denyChannels, ch].sort()
    setDenyWriteChannelsText(next.join('\n'))
    setDenyChannelDraft('')
  }

  const removeDenyChannel = (channel: string) => {
    const ch = normalizeChannel(channel)
    if (!ch) return

    const next = denyChannels.filter(c => c !== ch)
    setDenyWriteChannelsText(next.join('\n'))

    // Also prune channel-scoped allowlist for that channel.
    setAllowWriteToolNamesByChannelText(prev => {
      const map = parseChannelToolMap(prev)
      if (!(ch in map)) return prev
      delete map[ch]
      return formatChannelToolMap(map)
    })
  }

  const effective: ToolPolicyResponse | null = state?.effective ?? null
  const stored: ToolPolicyResponse | null = state?.stored ?? null

  const seedForm = useCallback((p: ToolPolicyResponse) => {
    setEnabled(p.enabled)
    setWriteToolNamesText(joinLines(p.writeToolNames))
    setDenyWriteChannelsText(joinLines(p.denyWriteChannels))
    setAllowWriteToolNamesInDenyChannelsText(joinLines(p.allowWriteToolNamesInDenyChannels))
    setAllowWriteToolNamesByChannelText(formatChannelToolMap(p.allowWriteToolNamesByChannel))
    setDenyWriteMessage(p.denyWriteMessage)
    setDenyChannelDraft('')
    setDenyChannelError(null)
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

  const serversSorted = useMemo(() => Object.keys(mcpToolsByServer).sort(), [mcpToolsByServer])

  const visibleToolsByServer = useMemo(() => {
    const out: Record<string, string[]> = {}
    for (const server of serversSorted) {
      const tools = (mcpToolsByServer[server] ?? []).filter(tn => matchesFilter(tn, writeToolFilter))
      out[server] = tools
    }
    return out
  }, [mcpToolsByServer, serversSorted, writeToolFilter])

  const writeToolsByServerForAllowlist = useMemo(() => {
    const out: Record<string, string[]> = {}
    const remaining = new Set(Array.from(writeToolSet))

    for (const server of serversSorted) {
      const serverTools = (mcpToolsByServer[server] ?? []).filter(tn => remaining.has(tn))
      if (serverTools.length) {
        out[server] = serverTools.slice().sort()
        serverTools.forEach(tn => remaining.delete(tn))
      }
    }

    if (remaining.size) {
      out['_unknown'] = Array.from(remaining).sort()
    }
    return out
  }, [mcpToolsByServer, serversSorted, writeToolSet])

  const toggleWriteTool = (toolName: string, checked: boolean) => {
    const current = new Set(writeToolSet)
    if (checked) current.add(toolName)
    else current.delete(toolName)
    setWriteToolNamesText(Array.from(current).sort().join('\n'))
  }

  const updateWriteToolsBulk = (server: string, action: 'select' | 'clear') => {
    const serverTools = visibleToolsByServer[server] ?? []
    if (!serverTools.length) return
    const next = new Set(writeToolSet)
    if (action === 'select') serverTools.forEach(tn => next.add(tn))
    else serverTools.forEach(tn => next.delete(tn))
    setWriteToolNamesText(Array.from(next).sort().join('\n'))
  }

  const toggleAllowToolForChannel = (channel: string, toolName: string, checked: boolean) => {
    const ch = normalizeChannel(channel)
    if (!ch) return
    setAllowWriteToolNamesByChannelText(prev => {
      const map = parseChannelToolMap(prev)
      const current = new Set(map[ch] ?? [])
      if (checked) current.add(toolName)
      else current.delete(toolName)
      if (current.size === 0) delete map[ch]
      else map[ch] = Array.from(current).sort()
      return formatChannelToolMap(map)
    })
  }

  const setAllowAllForChannel = (channel: string, action: 'select' | 'clear') => {
    const ch = normalizeChannel(channel)
    if (!ch) return
    const tools = Array.from(writeToolSet).filter(tn => matchesFilter(tn, allowToolFilter)).sort()
    setAllowWriteToolNamesByChannelText(prev => {
      const map = parseChannelToolMap(prev)
      if (action === 'clear') {
        delete map[ch]
      } else {
        map[ch] = tools
      }
      return formatChannelToolMap(map)
    })
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
          <div className="ToolPolicy-fieldHelp">{t('toolPolicy.writeToolsHelp')}</div>
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
          {mode === 'edit' && serversSorted.length > 0 && (
            <>
              <div className="ToolPolicy-filterRow">
                <input
                  className="ToolPolicy-input"
                  value={writeToolFilter}
                  onChange={e => setWriteToolFilter(e.target.value)}
                  placeholder={t('toolPolicy.filterToolsPlaceholder')}
                />
              </div>
              <div className="ToolPolicy-serverGroups">
                {serversSorted.map(server => {
                  const tools = visibleToolsByServer[server] ?? []
                  const selectedCount = tools.filter(tn => writeToolSet.has(tn)).length
                  const collapsed = !!collapsedServers[`write:${server}`]
                  return (
                    <div key={server} className="ToolPolicy-serverGroup">
                      <div className="ToolPolicy-serverHeader">
                        <button
                          type="button"
                          className="ToolPolicy-serverToggle"
                          onClick={() =>
                            setCollapsedServers(prev => ({
                              ...prev,
                              [`write:${server}`]: !prev[`write:${server}`],
                            }))
                          }
                        >
                          <span className="ToolPolicy-serverName">{server}</span>
                          <span className="ToolPolicy-serverMeta">
                            {selectedCount}/{tools.length}
                          </span>
                        </button>
                        <div className="ToolPolicy-serverActions">
                          <button
                            type="button"
                            className="ToolPolicy-btn ToolPolicy-btn--small"
                            onClick={() => updateWriteToolsBulk(server, 'select')}
                            disabled={mode !== 'edit' || toolsLoading || tools.length === 0}
                          >
                            {t('toolPolicy.selectAll')}
                          </button>
                          <button
                            type="button"
                            className="ToolPolicy-btn ToolPolicy-btn--small"
                            onClick={() => updateWriteToolsBulk(server, 'clear')}
                            disabled={mode !== 'edit' || toolsLoading || tools.length === 0}
                          >
                            {t('toolPolicy.clearAll')}
                          </button>
                        </div>
                      </div>
                      {!collapsed && tools.length > 0 && (
                        <div className="ToolPolicy-toolsGrid ToolPolicy-toolsGrid--grouped">
                          {tools.map(tool => {
                            const checked = writeToolSet.has(tool)
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
                      {!collapsed && tools.length === 0 && (
                        <div className="ToolPolicy-empty ToolPolicy-empty--inline">
                          {t('toolPolicy.noToolsForFilter')}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>

        <div className="ToolPolicy-field">
          <div className="ToolPolicy-fieldLabel">{t('toolPolicy.denyChannels')}</div>
          <div className="ToolPolicy-fieldHelp">{t('toolPolicy.denyChannelsHelp')}</div>

          <div className="ToolPolicy-channelRow">
            <input
              className="ToolPolicy-input"
              value={denyChannelDraft}
              onChange={e => setDenyChannelDraft(e.target.value)}
              placeholder={t('toolPolicy.channelPlaceholder')}
              disabled={mode !== 'edit'}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  addDenyChannel()
                }
              }}
            />
            <button
              type="button"
              className="ToolPolicy-btn"
              onClick={addDenyChannel}
              disabled={mode !== 'edit' || !denyChannelDraft.trim()}
            >
              {t('toolPolicy.addChannel')}
            </button>
          </div>

          {denyChannelError && <div className="ToolPolicy-toolsError">{denyChannelError}</div>}

          {denyChannels.length === 0 ? (
            <div className="ToolPolicy-empty ToolPolicy-empty--inline">{t('toolPolicy.noChannels')}</div>
          ) : (
            <div className="ToolPolicy-channelChips">
              {denyChannels.map(ch => (
                <span key={ch} className="ToolPolicy-chip">
                  <span className="ToolPolicy-chipLabel">{ch}</span>
                  <button
                    type="button"
                    className="ToolPolicy-chipRemove"
                    onClick={() => removeDenyChannel(ch)}
                    disabled={mode !== 'edit'}
                    aria-label={`${t('toolPolicy.remove')} ${ch}`}
                    title={t('toolPolicy.remove')}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}

          {showAdvancedAllowByChannel && (
            <textarea
              className="ToolPolicy-textarea ToolPolicy-textarea--advanced"
              value={denyWriteChannelsText}
              onChange={e => setDenyWriteChannelsText(e.target.value)}
              placeholder={t('toolPolicy.denyChannelsPlaceholder')}
              rows={3}
              disabled={mode !== 'edit'}
            />
          )}
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
          <div className="ToolPolicy-fieldHelp">{t('toolPolicy.allowWriteToolsInDenyChannelsHelp')}</div>
        </div>

        <div className="ToolPolicy-field">
          <div className="ToolPolicy-fieldLabel">{t('toolPolicy.allowWriteToolsByChannel')}</div>
          <div className="ToolPolicy-fieldHelp">{t('toolPolicy.allowWriteToolsByChannelHelp')}</div>

          {mode === 'edit' && (
            <div className="ToolPolicy-allowByChannel">
              {allowChannels.length === 0 ? (
                <div className="ToolPolicy-empty">{t('toolPolicy.noChannels')}</div>
              ) : (
                <>
                  <div className="ToolPolicy-allowHeader">
                    <select
                      className="ToolPolicy-select"
                      value={selectedAllowChannel}
                      onChange={e => setSelectedAllowChannel(e.target.value)}
                      disabled={mode !== 'edit'}
                    >
                      {allowChannels.map(ch => (
                        <option key={ch} value={ch}>
                          {ch}
                        </option>
                      ))}
                    </select>
                    <div className="ToolPolicy-allowActions">
                      <button
                        type="button"
                        className="ToolPolicy-btn ToolPolicy-btn--small"
                        onClick={() => setAllowAllForChannel(selectedAllowChannel, 'select')}
                        disabled={mode !== 'edit' || !selectedAllowChannel || writeToolSet.size === 0}
                      >
                        {t('toolPolicy.selectAll')}
                      </button>
                      <button
                        type="button"
                        className="ToolPolicy-btn ToolPolicy-btn--small"
                        onClick={() => setAllowAllForChannel(selectedAllowChannel, 'clear')}
                        disabled={mode !== 'edit' || !selectedAllowChannel}
                      >
                        {t('toolPolicy.clearAll')}
                      </button>
                      <button
                        type="button"
                        className="ToolPolicy-btn ToolPolicy-btn--small"
                        onClick={() => setShowAdvancedAllowByChannel(v => !v)}
                        disabled={mode !== 'edit'}
                      >
                        {showAdvancedAllowByChannel ? t('toolPolicy.hideAdvanced') : t('toolPolicy.showAdvanced')}
                      </button>
                    </div>
                  </div>

                  <div className="ToolPolicy-filterRow">
                    <input
                      className="ToolPolicy-input"
                      value={allowToolFilter}
                      onChange={e => setAllowToolFilter(e.target.value)}
                      placeholder={t('toolPolicy.filterAllowToolsPlaceholder')}
                      disabled={mode !== 'edit'}
                    />
                  </div>

                  {writeToolSet.size === 0 ? (
                    <div className="ToolPolicy-empty">{t('toolPolicy.noWriteToolsSelected')}</div>
                  ) : (
                    <div className="ToolPolicy-serverGroups">
                      {Object.keys(writeToolsByServerForAllowlist).sort().map(server => {
                        const tools = (writeToolsByServerForAllowlist[server] ?? []).filter(tn =>
                          matchesFilter(tn, allowToolFilter)
                        )
                        const allowSet = new Set(allowByChannel[selectedAllowChannel] ?? [])
                        const selectedCount = tools.filter(tn => allowSet.has(tn)).length
                        const label = server === '_unknown' ? t('toolPolicy.unknownServer') : server
                        const collapsed = !!collapsedServers[`allow:${selectedAllowChannel}:${server}`]
                        return (
                          <div key={server} className="ToolPolicy-serverGroup">
                            <div className="ToolPolicy-serverHeader">
                              <button
                                type="button"
                                className="ToolPolicy-serverToggle"
                                onClick={() =>
                                  setCollapsedServers(prev => ({
                                    ...prev,
                                    [`allow:${selectedAllowChannel}:${server}`]: !prev[`allow:${selectedAllowChannel}:${server}`],
                                  }))
                                }
                              >
                                <span className="ToolPolicy-serverName">{label}</span>
                                <span className="ToolPolicy-serverMeta">
                                  {selectedCount}/{tools.length}
                                </span>
                              </button>
                            </div>
                            {!collapsed && tools.length > 0 && (
                              <div className="ToolPolicy-toolsGrid ToolPolicy-toolsGrid--grouped">
                                {tools.map(tool => {
                                  const checked = allowSet.has(tool)
                                  return (
                                    <label key={tool} className="ToolPolicy-toolCheck">
                                      <input
                                        type="checkbox"
                                        checked={checked}
                                        onChange={e => toggleAllowToolForChannel(selectedAllowChannel, tool, e.target.checked)}
                                      />
                                      <span className="ToolPolicy-toolName">{tool}</span>
                                    </label>
                                  )
                                })}
                              </div>
                            )}
                            {!collapsed && tools.length === 0 && (
                              <div className="ToolPolicy-empty ToolPolicy-empty--inline">
                                {t('toolPolicy.noToolsForFilter')}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {showAdvancedAllowByChannel && (
                    <textarea
                      className="ToolPolicy-textarea ToolPolicy-textarea--advanced"
                      value={allowWriteToolNamesByChannelText}
                      onChange={e => setAllowWriteToolNamesByChannelText(e.target.value)}
                      placeholder={t('toolPolicy.allowWriteToolsByChannelPlaceholder')}
                      rows={6}
                      disabled={mode !== 'edit'}
                    />
                  )}
                </>
              )}
            </div>
          )}
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
