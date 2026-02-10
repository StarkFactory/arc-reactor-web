import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useChatContext } from '../../context/ChatContext'
import { getPersona } from '../../services/personas'
import { getTemplate } from '../../services/prompts'
import './ActiveConfigIndicator.css'

interface ActiveConfigIndicatorProps {
  onOpenSettings: () => void
}

export function ActiveConfigIndicator({ onOpenSettings }: ActiveConfigIndicatorProps) {
  const { t } = useTranslation()
  const { settings } = useChatContext()
  const [label, setLabel] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function resolve() {
      if (settings.selectedPersonaId) {
        try {
          const persona = await getPersona(settings.selectedPersonaId)
          if (!cancelled) setLabel(t('chat.activePersona', { name: persona.name }))
        } catch {
          if (!cancelled) setLabel(t('chat.activePersona', { name: '...' }))
        }
      } else if (settings.selectedPromptTemplateId) {
        try {
          const template = await getTemplate(settings.selectedPromptTemplateId)
          if (!cancelled) setLabel(t('chat.activeTemplate', { name: template.name }))
        } catch {
          if (!cancelled) setLabel(t('chat.activeTemplate', { name: '...' }))
        }
      } else if (settings.systemPrompt.trim()) {
        if (!cancelled) setLabel(t('chat.customPromptActive'))
      } else {
        if (!cancelled) setLabel(null)
      }
    }

    resolve()
    return () => { cancelled = true }
  }, [settings.selectedPersonaId, settings.selectedPromptTemplateId, settings.systemPrompt, t])

  if (!label) return null

  return (
    <div
      className="ActiveConfigIndicator"
      onClick={onOpenSettings}
      onKeyDown={e => e.key === 'Enter' && onOpenSettings()}
      role="button"
      tabIndex={0}
    >
      <span className="ActiveConfigIndicator-label">{label}</span>
    </div>
  )
}
