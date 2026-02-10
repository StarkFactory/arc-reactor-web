import { memo } from 'react'
import type { ChatMessage as ChatMessageType } from '../../types/chat'
import { MarkdownRenderer } from '../common/MarkdownRenderer'
import { MessageActions } from './MessageActions'
import { formatDuration } from '../../utils/formatters'
import './ChatMessage.css'

interface ChatMessageProps {
  message: ChatMessageType
  isLast: boolean
  isLoading: boolean
  showMetadata: boolean
  onRetry?: () => void
}

export const ChatMessage = memo(function ChatMessage({
  message, isLast, isLoading, showMetadata, onRetry,
}: ChatMessageProps) {
  const showPlaceholder = isLoading && isLast && message.role === 'assistant' && !message.content

  return (
    <div className={`ChatMessage ChatMessage--${message.role} ${message.error ? 'ChatMessage--error' : ''}`}>
      <div className="ChatMessage-bubble">
        {message.role === 'assistant' && message.toolsUsed && message.toolsUsed.length > 0 && (
          <div className="ChatMessage-tools">
            {message.toolsUsed.map(t => (
              <span key={t} className="ChatMessage-toolBadge">{t}</span>
            ))}
          </div>
        )}
        <div className="ChatMessage-content">
          {message.error ? (
            <span className="ChatMessage-errorText">{message.content}</span>
          ) : showPlaceholder ? (
            <span className="ChatMessage-typingIndicator">
              <span className="ChatMessage-dot" />
              <span className="ChatMessage-dot" />
              <span className="ChatMessage-dot" />
            </span>
          ) : message.role === 'assistant' && message.content ? (
            <MarkdownRenderer content={message.content} />
          ) : (
            <p className="ChatMessage-text">{message.content}</p>
          )}
        </div>
        {message.role === 'user' && message.attachments && message.attachments.length > 0 && (
          <div className="ChatMessage-attachments">
            {message.attachments.map((att, i) => (
              att.previewUrl ? (
                <img key={i} src={att.previewUrl} alt={att.name} className="ChatMessage-attachmentImg" />
              ) : (
                <span key={i} className="ChatMessage-attachmentFile">{att.name}</span>
              )
            ))}
          </div>
        )}
        {showMetadata && message.role === 'assistant' && message.durationMs && (
          <div className="ChatMessage-meta">
            {formatDuration(message.durationMs)}
          </div>
        )}
        {message.role === 'assistant' && message.content && !showPlaceholder && (
          <MessageActions
            content={message.content}
            onRetry={onRetry}
          />
        )}
      </div>
    </div>
  )
})
