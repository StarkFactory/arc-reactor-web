import { useTranslation } from 'react-i18next'
import { SchedulerManager } from '../../settings/SchedulerManager'
import './SchedulerPage.css'

export function SchedulerPage() {
  const { t } = useTranslation()

  return (
    <div className="SchedulerPage">
      <h1 className="SchedulerPage-title">{t('admin.schedulerPage.title')}</h1>
      <p className="SchedulerPage-desc">{t('admin.schedulerPage.description')}</p>
      <SchedulerManager />
    </div>
  )
}
