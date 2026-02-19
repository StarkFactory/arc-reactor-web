import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useMcpServers } from '../../../hooks/useMcpServers'
import { useOpsDashboard } from '../../../hooks/useOpsDashboard'
import './DashboardPage.css'

export function DashboardPage() {
  const { t } = useTranslation()
  const { data: mcpData } = useMcpServers()
  const { data: ops, isLoading: opsLoading, isError: opsError, refetch: opsRefetch } = useOpsDashboard()

  const mcpServers = mcpData ?? []
  const connectedServers = mcpServers.filter(s => s.status === 'CONNECTED')
  const totalTools = mcpServers.reduce((sum, s) => sum + s.toolCount, 0)

  return (
    <div className="Dashboard">
      <h1 className="Dashboard-title">{t('admin.dashboard.title')}</h1>

      {/* Ops Metrics */}
      <div className="Dashboard-section">
        <h2 className="Dashboard-sectionTitle">{t('admin.dashboard.opsMetrics')}</h2>
        {opsLoading && <div className="Dashboard-loading">{t('admin.dashboard.loading')}</div>}
        {opsError && (
          <div className="Dashboard-error">
            {t('admin.dashboard.loadError')}
            <button className="Dashboard-retryBtn" onClick={() => opsRefetch()}>
              {t('admin.dashboard.retry')}
            </button>
          </div>
        )}
        {ops && (
          <div className="Dashboard-cards">
            <div className="Dashboard-card">
              <div className="Dashboard-cardValue">{ops.totalChats.toLocaleString()}</div>
              <div className="Dashboard-cardLabel">{t('admin.dashboard.totalChats')}</div>
            </div>
            <div className="Dashboard-card">
              <div className="Dashboard-cardValue">{ops.activeUsers.toLocaleString()}</div>
              <div className="Dashboard-cardLabel">{t('admin.dashboard.activeUsers')}</div>
            </div>
            <div className="Dashboard-card">
              <div className="Dashboard-cardValue">{ops.successRate.toFixed(1)}%</div>
              <div className="Dashboard-cardLabel">{t('admin.dashboard.successRate')}</div>
            </div>
            <div className="Dashboard-card">
              <div className="Dashboard-cardValue">{ops.avgLatencyMs}ms</div>
              <div className="Dashboard-cardLabel">{t('admin.dashboard.avgLatency')}</div>
            </div>
          </div>
        )}
      </div>

      {/* MCP / Personas summary */}
      <div className="Dashboard-cards Dashboard-cards--secondary">
        <div className="Dashboard-card">
          <div className="Dashboard-cardValue">{mcpServers.length}</div>
          <div className="Dashboard-cardLabel">{t('admin.dashboard.mcpServers')}</div>
          <div className="Dashboard-cardSub">
            {t('admin.dashboard.connected', { count: connectedServers.length, tools: totalTools })}
          </div>
        </div>
        {ops && (
          <div className="Dashboard-card">
            <div className="Dashboard-cardLabel Dashboard-cardLabel--inline">
              {t('admin.dashboard.schedulerSummary')}
            </div>
            <div className="Dashboard-cardSub Dashboard-schedulerRow">
              <span className="Dashboard-schedulerSuccess">
                {t('admin.dashboard.schedulerSuccess', { count: ops.schedulerJobSummary.successCount })}
              </span>
              <span className="Dashboard-schedulerFailed">
                {t('admin.dashboard.schedulerFailed', { count: ops.schedulerJobSummary.failedCount })}
              </span>
              <span>
                {t('admin.dashboard.schedulerDisabled', { count: ops.schedulerJobSummary.disabledCount })}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Recent Audit Logs */}
      {ops && (
        <div className="Dashboard-section">
          <div className="Dashboard-sectionHeader">
            <h2 className="Dashboard-sectionTitle">{t('admin.dashboard.recentAuditLogs')}</h2>
            <Link to="/admin/audit-logs" className="Dashboard-sectionLink">
              {t('admin.dashboard.viewAllAuditLogs')} →
            </Link>
          </div>
          {ops.recentAuditLogs.length === 0 ? (
            <p className="Dashboard-empty">{t('admin.dashboard.noRecentAuditLogs')}</p>
          ) : (
            <div className="Dashboard-table">
              <div className="Dashboard-tableHeader Dashboard-tableHeader--audit">
                <span>{t('admin.dashboard.status')}</span>
                <span>{t('admin.dashboard.name')}</span>
                <span>{t('admin.dashboard.transport')}</span>
                <span>{t('admin.dashboard.tools')}</span>
              </div>
              {ops.recentAuditLogs.map(log => (
                <div key={log.id} className="Dashboard-tableRow Dashboard-tableRow--audit">
                  <span className="Dashboard-badge">{log.category}</span>
                  <span className="Dashboard-badge Dashboard-badge--action">{log.action}</span>
                  <span className="Dashboard-auditActor">{log.actor}</span>
                  <span className="Dashboard-auditTime">
                    {new Date(log.createdAt).toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Quick Actions */}
      <div className="Dashboard-section">
        <h2 className="Dashboard-sectionTitle">{t('admin.dashboard.quickActions')}</h2>
        <div className="Dashboard-actions">
          <Link to="/apps" className="Dashboard-actionBtn">{t('admin.dashboard.openApps')}</Link>
          <Link to="/admin/mcp-servers" className="Dashboard-actionBtn">{t('admin.dashboard.manageMcpServers')}</Link>
          <Link to="/admin/personas" className="Dashboard-actionBtn">{t('admin.dashboard.managePersonas')}</Link>
          <Link to="/admin/audit-logs" className="Dashboard-actionBtn">{t('admin.nav.auditLogs')}</Link>
          <Link to="/admin/output-guard" className="Dashboard-actionBtn">{t('admin.dashboard.outputGuard')}</Link>
          <Link to="/admin/tool-policy" className="Dashboard-actionBtn">{t('admin.dashboard.toolPolicy')}</Link>
        </div>
      </div>

      {/* MCP Server Status table */}
      {mcpServers.length > 0 && (
        <div className="Dashboard-section">
          <h2 className="Dashboard-sectionTitle">{t('admin.dashboard.serverStatus')}</h2>
          <div className="Dashboard-table">
            <div className="Dashboard-tableHeader">
              <span>{t('admin.dashboard.name')}</span>
              <span>{t('admin.dashboard.transport')}</span>
              <span>{t('admin.dashboard.status')}</span>
              <span>{t('admin.dashboard.tools')}</span>
            </div>
            {mcpServers.map(server => (
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
