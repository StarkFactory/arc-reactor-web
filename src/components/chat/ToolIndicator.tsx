import { useTranslation } from 'react-i18next'
import './ToolIndicator.css'

interface ToolIndicatorProps {
  toolName: string
}

export function ToolIndicator({ toolName }: ToolIndicatorProps) {
  const { t } = useTranslation()

  return (
    <div className="ToolIndicator">
      <span className="ToolIndicator-spinner" />
      <span>{t('tool.using', { name: toolName })}</span>
    </div>
  )
}
