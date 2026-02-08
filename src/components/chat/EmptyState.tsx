import { SUGGESTIONS } from '../../utils/constants'
import './EmptyState.css'

interface EmptyStateProps {
  onSuggestionClick: (text: string) => void
}

export function EmptyState({ onSuggestionClick }: EmptyStateProps) {
  return (
    <div className="EmptyState">
      <p className="EmptyState-text">Arc Reactor AI Agent에게 질문하세요</p>
      <div className="EmptyState-suggestions">
        {SUGGESTIONS.map(s => (
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
