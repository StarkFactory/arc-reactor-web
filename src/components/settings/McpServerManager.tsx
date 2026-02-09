import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import type { McpServerResponse, McpServerDetailResponse } from '../../types/api'
import {
  listMcpServers,
  getMcpServer,
  registerMcpServer,
  deleteMcpServer,
  connectMcpServer,
  disconnectMcpServer,
} from '../../services/mcp'
import './McpServerManager.css'

export function McpServerManager() {
  const { t } = useTranslation()
  const [servers, setServers] = useState<McpServerResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [expandedServer, setExpandedServer] = useState<string | null>(null)
  const [serverDetail, setServerDetail] = useState<McpServerDetailResponse | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // Register form state
  const [formName, setFormName] = useState('')
  const [formTransport, setFormTransport] = useState('SSE')
  const [formUrl, setFormUrl] = useState('')
  const [formCommand, setFormCommand] = useState('')
  const [formArgs, setFormArgs] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [formAutoConnect, setFormAutoConnect] = useState(true)
  const [saving, setSaving] = useState(false)

  const fetchServers = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await listMcpServers()
      setServers(data)
    } catch {
      setError(t('mcp.loadError'))
      setServers([])
    } finally {
      setLoading(false)
    }
  }, [t])

  useEffect(() => {
    fetchServers()
  }, [fetchServers])

  const handleToggleDetail = async (name: string) => {
    if (expandedServer === name) {
      setExpandedServer(null)
      setServerDetail(null)
      return
    }
    try {
      const detail = await getMcpServer(name)
      setServerDetail(detail)
      setExpandedServer(name)
    } catch {
      setError(t('mcp.detailError'))
    }
  }

  const handleConnect = async (name: string) => {
    setActionLoading(name)
    setError(null)
    try {
      await connectMcpServer(name)
      await fetchServers()
      if (expandedServer === name) {
        const detail = await getMcpServer(name)
        setServerDetail(detail)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : t('mcp.connectError'))
    } finally {
      setActionLoading(null)
    }
  }

  const handleDisconnect = async (name: string) => {
    setActionLoading(name)
    setError(null)
    try {
      await disconnectMcpServer(name)
      await fetchServers()
      if (expandedServer === name) {
        const detail = await getMcpServer(name)
        setServerDetail(detail)
      }
    } catch {
      setError(t('mcp.disconnectError'))
    } finally {
      setActionLoading(null)
    }
  }

  const handleDelete = async (name: string) => {
    if (!confirm(t('mcp.deleteConfirm'))) return
    setActionLoading(name)
    setError(null)
    try {
      await deleteMcpServer(name)
      if (expandedServer === name) {
        setExpandedServer(null)
        setServerDetail(null)
      }
      await fetchServers()
    } catch {
      setError(t('mcp.deleteError'))
    } finally {
      setActionLoading(null)
    }
  }

  const handleRegister = async () => {
    if (!formName.trim()) return
    setSaving(true)
    setError(null)
    try {
      const config: Record<string, unknown> = {}
      if (formTransport === 'SSE' || formTransport === 'HTTP') {
        if (formUrl.trim()) config.url = formUrl.trim()
      } else if (formTransport === 'STDIO') {
        if (formCommand.trim()) config.command = formCommand.trim()
        if (formArgs.trim()) config.args = formArgs.split(',').map(a => a.trim()).filter(Boolean)
      }

      await registerMcpServer({
        name: formName.trim(),
        description: formDescription.trim() || undefined,
        transportType: formTransport,
        config,
        autoConnect: formAutoConnect,
      })

      // Reset form
      setFormName('')
      setFormTransport('SSE')
      setFormUrl('')
      setFormCommand('')
      setFormArgs('')
      setFormDescription('')
      setFormAutoConnect(true)
      setShowForm(false)
      await fetchServers()
    } catch (e) {
      if (e instanceof Error && e.message === 'CONFLICT') {
        setError(t('mcp.duplicateError'))
      } else {
        setError(t('mcp.registerError'))
      }
    } finally {
      setSaving(false)
    }
  }

  const isFormValid = formName.trim() &&
    ((formTransport === 'SSE' && formUrl.trim()) ||
     (formTransport === 'HTTP' && formUrl.trim()) ||
     (formTransport === 'STDIO' && formCommand.trim()))

  if (loading) {
    return <div className="McpManager-loading">{t('mcp.loading')}</div>
  }

  if (error && servers.length === 0 && !showForm) {
    return (
      <div className="McpManager-error">
        <span>{error}</span>
        <button className="McpManager-retryBtn" onClick={fetchServers}>{t('mcp.retry')}</button>
      </div>
    )
  }

  return (
    <div className="McpManager">
      <div className="McpManager-header">
        <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
          {servers.length > 0 ? t('mcp.serverCount', { count: servers.length }) : ''}
        </span>
        <button
          className="McpManager-addBtn"
          onClick={() => setShowForm(!showForm)}
          title={showForm ? t('mcp.close') : t('mcp.add')}
        >
          {showForm ? '\u00d7' : '+'}
        </button>
      </div>

      {/* Register form */}
      {showForm && (
        <div className="McpManager-form">
          <div className="McpManager-formTitle">{t('mcp.registerTitle')}</div>
          <input
            className="McpManager-input"
            value={formName}
            onChange={e => setFormName(e.target.value)}
            placeholder={t('mcp.namePlaceholder')}
          />
          <select
            className="McpManager-select"
            value={formTransport}
            onChange={e => setFormTransport(e.target.value)}
          >
            <option value="SSE">SSE</option>
            <option value="STDIO">STDIO</option>
            <option value="HTTP">HTTP</option>
          </select>

          {(formTransport === 'SSE' || formTransport === 'HTTP') && (
            <input
              className="McpManager-input"
              value={formUrl}
              onChange={e => setFormUrl(e.target.value)}
              placeholder={t('mcp.urlPlaceholder')}
            />
          )}

          {formTransport === 'STDIO' && (
            <>
              <input
                className="McpManager-input"
                value={formCommand}
                onChange={e => setFormCommand(e.target.value)}
                placeholder={t('mcp.commandPlaceholder')}
              />
              <input
                className="McpManager-input"
                value={formArgs}
                onChange={e => setFormArgs(e.target.value)}
                placeholder={t('mcp.argsPlaceholder')}
              />
            </>
          )}

          <input
            className="McpManager-input"
            value={formDescription}
            onChange={e => setFormDescription(e.target.value)}
            placeholder={t('mcp.descriptionPlaceholder')}
          />

          <label className="McpManager-checkLabel">
            <input
              type="checkbox"
              checked={formAutoConnect}
              onChange={e => setFormAutoConnect(e.target.checked)}
            />
            {t('mcp.autoConnect')}
          </label>

          <div className="McpManager-formActions">
            <button
              className="McpManager-saveBtn"
              onClick={handleRegister}
              disabled={saving || !isFormValid}
            >
              {saving ? t('mcp.registering') : t('mcp.register')}
            </button>
            <button className="McpManager-cancelBtn" onClick={() => setShowForm(false)}>
              {t('mcp.cancel')}
            </button>
          </div>
        </div>
      )}

      {/* Server list */}
      {servers.length === 0 && !showForm ? (
        <div className="McpManager-empty">{t('mcp.noServers')}</div>
      ) : (
        <div className="McpManager-list">
          {servers.map(server => (
            <div key={server.id} className="McpManager-card">
              <div
                className="McpManager-cardTop"
                onClick={() => handleToggleDetail(server.name)}
                style={{ cursor: 'pointer' }}
              >
                <span className="McpManager-cardName">{server.name}</span>
                <span className={`McpManager-badge McpManager-badge--status McpManager-badge--${server.status}`}>
                  {server.status}
                </span>
              </div>

              <div className="McpManager-cardMeta">
                <span className="McpManager-badge McpManager-badge--transport">{server.transportType}</span>
                {server.toolCount > 0 && (
                  <span className="McpManager-toolCount">
                    {t('mcp.toolCount', { count: server.toolCount })}
                  </span>
                )}
              </div>

              <div className="McpManager-cardActions">
                {server.status === 'CONNECTED' ? (
                  <button
                    className="McpManager-actionBtn McpManager-actionBtn--disconnect"
                    onClick={() => handleDisconnect(server.name)}
                    disabled={actionLoading === server.name}
                  >
                    {actionLoading === server.name ? '...' : t('mcp.disconnect')}
                  </button>
                ) : (
                  <button
                    className="McpManager-actionBtn McpManager-actionBtn--connect"
                    onClick={() => handleConnect(server.name)}
                    disabled={actionLoading === server.name}
                  >
                    {actionLoading === server.name ? '...' : t('mcp.connect')}
                  </button>
                )}
                <button
                  className="McpManager-actionBtn McpManager-actionBtn--delete"
                  onClick={() => handleDelete(server.name)}
                  disabled={actionLoading === server.name}
                >
                  {t('mcp.delete')}
                </button>
              </div>

              {/* Expanded detail */}
              {expandedServer === server.name && serverDetail && (
                <div className="McpManager-detail">
                  {serverDetail.description && (
                    <div className="McpManager-detailLabel">{serverDetail.description}</div>
                  )}
                  {serverDetail.tools.length > 0 && (
                    <>
                      <div className="McpManager-detailLabel">
                        {t('mcp.availableTools')} ({serverDetail.tools.length})
                      </div>
                      <div className="McpManager-toolList">
                        {serverDetail.tools.map(tool => (
                          <span key={tool} className="McpManager-toolTag">{tool}</span>
                        ))}
                      </div>
                    </>
                  )}
                  {serverDetail.tools.length === 0 && server.status !== 'CONNECTED' && (
                    <div className="McpManager-detailLabel">{t('mcp.connectToSeeTools')}</div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {error && servers.length > 0 && <div className="McpManager-inlineError">{error}</div>}
    </div>
  )
}
