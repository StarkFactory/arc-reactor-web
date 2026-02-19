import { NavLink, Outlet, Link, Navigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'
import { useSettings } from '../../hooks/useSettings'
import './AdminLayout.css'

export function AdminLayout() {
  const { t, i18n } = useTranslation()
  const { isAdmin } = useAuth()
  const { settings, updateSettings } = useSettings()

  if (!isAdmin) return <Navigate to="/" replace />

  const navItems = [
    { to: '/admin', label: t('admin.nav.dashboard'), end: true },
    { to: '/admin/mcp-servers', label: t('admin.nav.mcpServers') },
    { to: '/admin/personas', label: t('admin.nav.personas') },
    { to: '/admin/intents', label: t('admin.nav.intents') },
    { to: '/admin/output-guard', label: t('admin.nav.outputGuard') },
    { to: '/admin/tool-policy', label: t('admin.nav.toolPolicy') },
    { to: '/admin/scheduler', label: t('admin.nav.scheduler') },
    { to: '/admin/clipping/categories', label: t('admin.nav.clippingCategories') },
    { to: '/admin/clipping/sources', label: t('admin.nav.clippingSources') },
    { to: '/admin/clipping/personas', label: t('admin.nav.clippingPersonas') },
    { to: '/admin/clipping/stats', label: t('admin.nav.clippingStats') },
    { to: '/admin/audit-logs', label: t('admin.nav.auditLogs') },
    { to: '/admin/users', label: t('admin.nav.users') },
  ]

  return (
    <div className="Admin">
      <header className="Admin-header">
        <Link to="/admin" className="Admin-logo">{t('admin.title')}</Link>
        <div className="Admin-headerActions">
          <button
            className="Admin-headerBtn"
            onClick={() => i18n.changeLanguage(i18n.language === 'ko' ? 'en' : 'ko')}
            title={t('settings.language')}
          >
            {i18n.language === 'ko' ? 'EN' : 'KO'}
          </button>
          <button
            className="Admin-headerBtn"
            onClick={() => updateSettings({ darkMode: !settings.darkMode })}
            title={t('settings.theme')}
          >
            {settings.darkMode ? '\u2600\uFE0F' : '\uD83C\uDF19'}
          </button>
          <Link to="/" className="Admin-backLink">{t('admin.backToChat')}</Link>
        </div>
      </header>
      <div className="Admin-body">
        <nav className="Admin-sidebar">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `Admin-navItem${isActive ? ' Admin-navItem--active' : ''}`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <main className="Admin-content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
