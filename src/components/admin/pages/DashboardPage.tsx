import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import type { McpServerResponse, PersonaResponse } from '../../../types/api'
import { listMcpServers } from '../../../services/mcp'
import { listPersonas } from '../../../services/personas'
import './DashboardPage.css'

interface SystemStatus {
  mcpServers: McpServerResponse[]
  personas: PersonaResponse[]
  loading: boolean
}

export function DashboardPage() {
  const { t } = useTranslation()
  const [status, setStatus] = useState<SystemStatus>({
    mcpServers: [],
    personas: [],
    loading: true,
  })

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const [servers, personas] = await Promise.allSettled([
          listMcpServers(),
          listPersonas(),
        ])
        if (cancelled) return
        setStatus({
          mcpServers: servers.status === 'fulfilled' ? servers.value : [],
          personas: personas.status === 'fulfilled' ? personas.value : [],
          loading: false,
        })
      } catch {
        if (!cancelled) setStatus(prev => ({ ...prev, loading: false }))
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  const connectedServers = status.mcpServers.filter(s => s.status === 'CONNECTED')
  const totalTools = status.mcpServers.reduce((sum, s) => sum + s.toolCount, 0)

  if (status.loading) {
    return <div className="Dashboard-loading">{t('admin.dashboard.loading')}</div>
  }

  return (
    <div className="Dashboard">
      <h1 className="Dashboard-title">{t('admin.dashboard.title')}</h1>

      <div className="Dashboard-cards">
        <div className="Dashboard-card">
          <div className="Dashboard-cardValue">{status.mcpServers.length}</div>
          <div className="Dashboard-cardLabel">{t('admin.dashboard.mcpServers')}</div>
          <div className="Dashboard-cardSub">
            {t('admin.dashboard.connected', { count: connectedServers.length, tools: totalTools })}
          </div>
        </div>

        <div className="Dashboard-card">
          <div className="Dashboard-cardValue">{status.personas.length}</div>
          <div className="Dashboard-cardLabel">{t('admin.dashboard.personas')}</div>
          <div className="Dashboard-cardSub">
            {t('admin.dashboard.default', { count: status.personas.filter(p => p.isDefault).length })}
          </div>
        </div>

        <div className="Dashboard-card Dashboard-card--accent">
          <div className="Dashboard-cardValue">1</div>
          <div className="Dashboard-cardLabel">{t('admin.dashboard.apps')}</div>
          <div className="Dashboard-cardSub">{t('admin.dashboard.appsAvailable')}</div>
        </div>
      </div>

      <div className="Dashboard-section">
        <h2 className="Dashboard-sectionTitle">{t('admin.dashboard.quickActions')}</h2>
        <div className="Dashboard-actions">
          <Link to="/apps" className="Dashboard-actionBtn">
            {t('admin.dashboard.openApps')}
          </Link>
          <Link to="/admin/mcp-servers" className="Dashboard-actionBtn">
            {t('admin.dashboard.manageMcpServers')}
          </Link>
          <Link to="/admin/personas" className="Dashboard-actionBtn">
            {t('admin.dashboard.managePersonas')}
          </Link>
          <Link to="/admin/intents" className="Dashboard-actionBtn">
            {t('admin.dashboard.intents')}
          </Link>
          <Link to="/admin/output-guard" className="Dashboard-actionBtn">
            {t('admin.dashboard.outputGuard')}
          </Link>
          <Link to="/admin/tool-policy" className="Dashboard-actionBtn">
            {t('admin.dashboard.toolPolicy')}
          </Link>
        </div>
      </div>

      {status.mcpServers.length > 0 && (
        <div className="Dashboard-section">
          <h2 className="Dashboard-sectionTitle">{t('admin.dashboard.serverStatus')}</h2>
          <div className="Dashboard-table">
            <div className="Dashboard-tableHeader">
              <span>{t('admin.dashboard.name')}</span>
              <span>{t('admin.dashboard.transport')}</span>
              <span>{t('admin.dashboard.status')}</span>
              <span>{t('admin.dashboard.tools')}</span>
            </div>
            {status.mcpServers.map(server => (
              <div key={server.id} className="Dashboard-tableRow">
                <span className="Dashboard-serverName">{server.name}</span>
                <span className="Dashboard-badge">{server.transportType}</span>
                <span className={`Dashboard-status Dashboard-status--${server.status.toLowerCase()}`}>
                  {server.status}
                </span>
                <span>{server.toolCount}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
