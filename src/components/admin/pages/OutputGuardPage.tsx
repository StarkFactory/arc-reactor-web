import { useTranslation } from 'react-i18next'
import { OutputGuardRuleManager } from '../../settings/OutputGuardRuleManager'
import './OutputGuardPage.css'

export function OutputGuardPage() {
  const { t } = useTranslation()

  return (
    <div className="OutputGuardPage">
      <h1 className="OutputGuardPage-title">{t('admin.outputGuardPage.title')}</h1>
      <p className="OutputGuardPage-desc">{t('admin.outputGuardPage.description')}</p>
      <OutputGuardRuleManager />
    </div>
  )
}
