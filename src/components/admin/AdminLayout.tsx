import { NavLink, Outlet, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useSettings } from '../../hooks/useSettings'
import './AdminLayout.css'

export function AdminLayout() {
  const { t, i18n } = useTranslation()
  const { settings, updateSettings } = useSettings()

  const navItems = [
    { to: '/admin', label: t('admin.nav.dashboard'), end: true },
    { to: '/admin/error-report', label: t('admin.nav.errorReport') },
    { to: '/admin/mcp-servers', label: t('admin.nav.mcpServers') },
    { to: '/admin/personas', label: t('admin.nav.personas') },
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
