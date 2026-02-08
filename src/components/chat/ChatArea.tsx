import { useRef, useEffect, useState, useCallback } from 'react'
import { useChatContext } from '../../context/ChatContext'
import { ChatMessage } from './ChatMessage'
import { ChatInput } from './ChatInput'
import { ToolIndicator } from './ToolIndicator'
import { EmptyState } from './EmptyState'
import './ChatArea.css'

export function ChatArea() {
  const { messages, isLoading, activeTool, sendMessage, retryLastMessage, settings } = useChatContext()
  const messagesRef = useRef<HTMLElement>(null)
  const [suggestion, setSuggestion] = useState<string | undefined>()

  useEffect(() => {
    const el = messagesRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages])

  const handleSuggestion = useCallback((text: string) => {
    setSuggestion(text)
    setTimeout(() => setSuggestion(undefined), 100)
  }, [])

  const handleSend = useCallback((text: string) => {
    sendMessage(text)
  }, [sendMessage])

  return (
    <div className="ChatArea">
      <main className="ChatArea-messages" ref={messagesRef}>
        {messages.length === 0 && (
          <EmptyState onSuggestionClick={handleSuggestion} />
        )}
        {messages.map((msg, i) => (
          <ChatMessage
            key={msg.id}
            message={msg}
            isLast={i === messages.length - 1}
            isLoading={isLoading}
            showMetadata={settings.showMetadata}
            onRetry={msg.role === 'assistant' ? retryLastMessage : undefined}
          />
        ))}
        {activeTool && <ToolIndicator toolName={activeTool} />}
      </main>
      <ChatInput
        onSend={handleSend}
        disabled={isLoading}
        initialValue={suggestion}
      />
    </div>
  )
}
