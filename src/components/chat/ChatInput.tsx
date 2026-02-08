import { useState, useRef, useEffect, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import './ChatInput.css'

interface ChatInputProps {
  onSend: (text: string) => void
  onStop: () => void
  disabled: boolean
  initialValue?: string
}

export function ChatInput({ onSend, onStop, disabled, initialValue }: ChatInputProps) {
  const { t } = useTranslation()
  const [input, setInput] = useState('')
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Sync initialValue during render (avoids setState-in-effect)
  const [prevInitialValue, setPrevInitialValue] = useState(initialValue)
  if (initialValue !== prevInitialValue) {
    setPrevInitialValue(initialValue)
    if (initialValue) setInput(initialValue)
  }

  // Focus when initialValue changes or loading finishes
  useEffect(() => {
    if (initialValue) inputRef.current?.focus()
  }, [initialValue])

  useEffect(() => {
    if (!disabled) inputRef.current?.focus()
  }, [disabled])

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    const text = input.trim()
    if (!text || disabled) return
    onSend(text)
    setInput('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e as unknown as FormEvent)
    }
  }

  return (
    <form className="ChatInput" onSubmit={handleSubmit}>
      <textarea
        ref={inputRef}
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={t('chat.placeholder')}
        rows={1}
        disabled={disabled}
      />
      {disabled ? (
        <button type="button" className="ChatInput-stopBtn" onClick={onStop}>
          <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
            <rect x="3" y="3" width="10" height="10" rx="1.5" />
          </svg>
          {t('chat.stop')}
        </button>
      ) : (
        <button type="submit" disabled={!input.trim()}>
          {t('chat.send')}
        </button>
      )}
    </form>
  )
}
