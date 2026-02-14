import { useTranslation } from 'react-i18next'
import { ToolPolicyManager } from '../../settings/ToolPolicyManager'
import './ToolPolicyPage.css'

export function ToolPolicyPage() {
  const { t } = useTranslation()

  return (
    <div className="ToolPolicyPage">
      <h1 className="ToolPolicyPage-title">{t('admin.toolPolicyPage.title')}</h1>
      <p className="ToolPolicyPage-desc">{t('admin.toolPolicyPage.description')}</p>
      <ToolPolicyManager />
    </div>
  )
}
