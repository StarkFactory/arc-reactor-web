import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import './AppsPage.css'

interface AppCard {
  id: string
  icon: string
  path: string
}

export function AppsPage() {
  const { t } = useTranslation()

  const apps: AppCard[] = [
    {
      id: 'error-report',
      icon: '\uD83D\uDD0D',
      path: '/apps/error-report',
    },
  ]

  return (
    <div className="AppsPage">
      <h1 className="AppsPage-title">{t('apps.title')}</h1>
      <p className="AppsPage-desc">{t('apps.description')}</p>

      <div className="AppsPage-grid">
        {apps.map(app => (
          <Link key={app.id} to={app.path} className="AppsPage-card">
            <span className="AppsPage-cardIcon">{app.icon}</span>
            <div className="AppsPage-cardBody">
              <h3 className="AppsPage-cardName">{t(`apps.${app.id}.name`)}</h3>
              <p className="AppsPage-cardDesc">{t(`apps.${app.id}.description`)}</p>
            </div>
            <span className="AppsPage-cardArrow">&rarr;</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
