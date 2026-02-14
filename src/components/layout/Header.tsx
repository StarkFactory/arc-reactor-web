import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'
import { useChatContext } from '../../context/ChatContext'
import './Header.css'

interface HeaderProps {
  onToggleSidebar: () => void
  onOpenSettings: () => void
}

export function Header({ onToggleSidebar, onOpenSettings }: HeaderProps) {
  const { t } = useTranslation()
  const { isAdmin } = useAuth()
  const { settings, updateSettings } = useChatContext()

  return (
    <header className="Header">
      <button
        className="Header-menuBtn"
        onClick={onToggleSidebar}
        aria-label={t('sidebar.newChat')}
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
          <rect y="3" width="20" height="2" rx="1" />
          <rect y="9" width="20" height="2" rx="1" />
          <rect y="15" width="20" height="2" rx="1" />
        </svg>
      </button>
      <h1 className="Header-title">{t('app.title')}</h1>
      <span className="Header-subtitle">{t('app.subtitle')}</span>
      <div className="Header-actions">
        <Link to="/apps" className="Header-appsLink">{t('header.apps')}</Link>
        {isAdmin && (
          <Link to="/admin" className="Header-adminLink">{t('header.admin')}</Link>
        )}
        <button
          className="Header-iconBtn"
          onClick={onOpenSettings}
          aria-label={t('settings.title')}
        >
          <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
            <path d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" />
          </svg>
        </button>
        <button
          className="Header-iconBtn"
          onClick={() => updateSettings({ darkMode: !settings.darkMode })}
          aria-label={t('settings.theme')}
        >
          {settings.darkMode ? '\u2600\uFE0F' : '\uD83C\uDF19'}
        </button>
      </div>
    </header>
  )
}
