import { AVAILABLE_MODELS } from '../../utils/constants'
import './ModelSelector.css'

interface ModelSelectorProps {
  value: string | null
  onChange: (model: string | null) => void
  compact?: boolean
}

export function ModelSelector({ value, onChange, compact = false }: ModelSelectorProps) {
  return (
    <select
      className={`ModelSelector ${compact ? 'ModelSelector--compact' : ''}`}
      value={value ?? ''}
      onChange={e => onChange(e.target.value || null)}
    >
      {AVAILABLE_MODELS.map(m => (
        <option key={m.id} value={m.id}>
          {compact ? m.label : `${m.label}${m.provider ? ` (${m.provider})` : ''}`}
        </option>
      ))}
    </select>
  )
}
