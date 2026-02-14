import { useTranslation } from 'react-i18next'
import './SchedulerPage.css'

export function SchedulerPage() {
  const { t } = useTranslation()

  return (
    <div className="SchedulerPage">
      <h1 className="SchedulerPage-title">{t('admin.schedulerPage.title')}</h1>
      <p className="SchedulerPage-desc">{t('admin.schedulerPage.description')}</p>
      <div className="SchedulerPage-note">{t('admin.schedulerPage.comingSoon')}</div>
    </div>
  )
}

