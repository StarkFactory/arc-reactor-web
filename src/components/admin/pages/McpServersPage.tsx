import { useTranslation } from 'react-i18next'
import { McpServerManager } from '../../settings/McpServerManager'
import './McpServersPage.css'

export function McpServersPage() {
  const { t } = useTranslation()

  return (
    <div className="McpServersPage">
      <h1 className="McpServersPage-title">{t('admin.mcpServersPage.title')}</h1>
      <p className="McpServersPage-desc">{t('admin.mcpServersPage.description')}</p>
      <McpServerManager />
    </div>
  )
}
