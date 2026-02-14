import { Outlet, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useSettings } from '../../hooks/useSettings'
import './AppsLayout.css'

export function AppsLayout() {
  const { t, i18n } = useTranslation()
  const { settings, updateSettings } = useSettings()

  return (
    <div className="Apps">
      <header className="Apps-header">
        <Link to="/apps" className="Apps-logo">{t('apps.title')}</Link>
        <div className="Apps-headerActions">
          <button
            className="Apps-headerBtn"
            onClick={() => i18n.changeLanguage(i18n.language === 'ko' ? 'en' : 'ko')}
            title={t('settings.language')}
          >
            {i18n.language === 'ko' ? 'EN' : 'KO'}
          </button>
          <button
            className="Apps-headerBtn"
            onClick={() => updateSettings({ darkMode: !settings.darkMode })}
            title={t('settings.theme')}
          >
            {settings.darkMode ? '\u2600\uFE0F' : '\uD83C\uDF19'}
          </button>
          <Link to="/" className="Apps-backLink">{t('apps.backToChat')}</Link>
        </div>
      </header>
      <main className="Apps-content">
        <Outlet />
      </main>
    </div>
  )
}
