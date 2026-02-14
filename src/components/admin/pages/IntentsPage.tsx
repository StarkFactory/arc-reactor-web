import { useTranslation } from 'react-i18next'
import { IntentManager } from '../../settings/IntentManager'
import './IntentsPage.css'

export function IntentsPage() {
  const { t } = useTranslation()

  return (
    <div className="IntentsPage">
      <h1 className="IntentsPage-title">{t('admin.intentsPage.title')}</h1>
      <p className="IntentsPage-desc">{t('admin.intentsPage.description')}</p>
      <IntentManager />
    </div>
  )
}
