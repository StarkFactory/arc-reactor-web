import { useState, useRef, useEffect, type FormEvent } from 'react'
import './ChatInput.css'

interface ChatInputProps {
  onSend: (text: string) => void
  disabled: boolean
  initialValue?: string
}

export function ChatInput({ onSend, disabled, initialValue }: ChatInputProps) {
  const [input, setInput] = useState('')
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Accept external value (e.g., from suggestion click)
  useEffect(() => {
    if (initialValue) {
      setInput(initialValue)
      inputRef.current?.focus()
    }
  }, [initialValue])

  // Focus input when not loading
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
        placeholder="메시지를 입력하세요..."
        rows={1}
        disabled={disabled}
      />
      <button type="submit" disabled={disabled || !input.trim()}>
        {disabled ? '...' : '보내기'}
      </button>
    </form>
  )
}
