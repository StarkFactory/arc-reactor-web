import { useTranslation } from 'react-i18next'
import './EmptyState.css'

interface EmptyStateProps {
  onSuggestionClick: (text: string) => void
}

export function EmptyState({ onSuggestionClick }: EmptyStateProps) {
  const { t } = useTranslation()

  const suggestions = [
    t('suggestions.hello'),
    t('suggestions.time'),
    t('suggestions.math'),
  ]

  return (
    <div className="EmptyState">
      <p className="EmptyState-text">{t('chat.emptyState')}</p>
      <div className="EmptyState-suggestions">
        {suggestions.map(s => (
          <button
            key={s}
            className="EmptyState-suggestion"
            onClick={() => onSuggestionClick(s)}
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  )
}
