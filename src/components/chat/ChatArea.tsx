import { useRef, useEffect, useState } from 'react'
import { useChatContext } from '../../context/ChatContext'
import { ChatMessage } from './ChatMessage'
import { ChatInput } from './ChatInput'
import { ToolIndicator } from './ToolIndicator'
import { ApprovalBanner } from './ApprovalBanner'
import { EmptyState } from './EmptyState'
import { ActiveConfigIndicator } from './ActiveConfigIndicator'
import './ChatArea.css'

interface ChatAreaProps {
  onOpenSettings?: () => void
}

export function ChatArea({ onOpenSettings }: ChatAreaProps) {
  const { messages, isLoading, activeTool, sendMessage, stopGeneration, retryLastMessage, settings } = useChatContext()
  const messagesRef = useRef<HTMLElement>(null)
  const [suggestion, setSuggestion] = useState<string | undefined>()

  useEffect(() => {
    const el = messagesRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages])

  const handleSuggestion = (text: string) => {
    setSuggestion(text)
    setTimeout(() => setSuggestion(undefined), 100)
  }

  const handleSend = (text: string, files?: File[]) => {
    sendMessage(text, files)
  }

  return (
    <div className="ChatArea">
      {onOpenSettings && <ActiveConfigIndicator onOpenSettings={onOpenSettings} />}
      <main className="ChatArea-messages" ref={messagesRef} aria-live="polite">
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
        <ApprovalBanner />
      </main>
      <ChatInput
        onSend={handleSend}
        onStop={stopGeneration}
        disabled={isLoading}
        initialValue={suggestion}
      />
    </div>
  )
}
