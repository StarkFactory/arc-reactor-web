import { createContext, useContext, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import type { ChatMessage, Session, ChatSettings } from '../types/chat'
import { useAuth } from './AuthContext'
import { useSettings } from '../hooks/useSettings'
import { useChat } from '../hooks/useChat'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { MAX_SESSIONS, SESSION_TITLE_MAX_LENGTH } from '../utils/constants'
import { truncate } from '../utils/formatters'

interface ChatContextValue {
  // Sessions
  sessions: Session[]
  activeSessionId: string
  createSession: () => void
  switchSession: (id: string) => void
  deleteSession: (id: string) => void
  renameSession: (id: string, title: string) => void

  // Messages
  messages: ChatMessage[]
  isLoading: boolean
  activeTool: string | null
  sendMessage: (text: string, files?: File[]) => Promise<void>
  stopGeneration: () => void
  retryLastMessage: () => Promise<void>

  // Settings
  settings: ChatSettings
  updateSettings: (partial: Partial<ChatSettings>) => void
  resetSettings: () => void
}

const ChatCtx = createContext<ChatContextValue | null>(null)

const BASE_SESSION_KEY = 'arc-reactor-sessions'

export function ChatProvider({ children }: { children: ReactNode }) {
  const { t } = useTranslation()
  const { user } = useAuth()

  // Factory for new sessions. Wrapped in useState lazy initializer when used as
  // a default value so that Date.now() / crypto.randomUUID() are only called
  // once on mount, not on every re-render.
  const createNewSession = (): Session => ({
    id: crypto.randomUUID(),
    title: t('chat.newConversation'),
    createdAt: Date.now(),
    updatedAt: Date.now(),
    messages: [],
  })

  const userId = user?.id

  // Namespace localStorage keys by userId for session isolation
  const sessionKey = userId ? `${BASE_SESSION_KEY}:${userId}` : BASE_SESSION_KEY
  const { settings, updateSettings, resetSettings } = useSettings(userId)

  // Use useState to lazily compute the default value so Date.now() is not
  // called during every render (satisfies React's purity rules).
  const [defaultSessions] = useState<Session[]>(() => [createNewSession()])
  const [sessions, setSessions] = useLocalStorage<Session[]>(sessionKey, defaultSessions)

  // Ensure sessions is always a valid array
  const validSessions = Array.isArray(sessions) ? sessions : (() => {
    const initial = createNewSession()
    return [initial]
  })()

  const [activeSessionId, setActiveSessionId] = useState<string>(() => {
    if (validSessions.length > 0) return validSessions[0].id
    const s = createNewSession()
    return s.id
  })

  // Ensure activeSessionId always points to a valid session
  const activeSession = validSessions.find(s => s.id === activeSessionId)
    ?? validSessions[0]
  const effectiveSessionId = activeSession.id

  const handleMessagesChange = (msgs: ChatMessage[]) => {
    setSessions(prev => {
      const list = Array.isArray(prev) ? prev : []
      return list.map(s => {
        if (s.id !== effectiveSessionId) return s
        // Auto-title from first user message
        const firstUser = msgs.find(m => m.role === 'user')
        const title = firstUser
          ? truncate(firstUser.content, SESSION_TITLE_MAX_LENGTH)
          : s.title
        return { ...s, title, messages: msgs, updatedAt: Date.now() }
      })
    })
  }

  const { messages, isLoading, activeTool, sendMessage, stopGeneration, retryLastMessage } = useChat({
    sessionId: effectiveSessionId,
    settings,
    userId: userId || 'web-user',
    initialMessages: activeSession?.messages ?? [],
    onMessagesChange: handleMessagesChange,
  })

  const createSessionFn = () => {
    const newSession = createNewSession()
    setSessions(prev => {
      const list = Array.isArray(prev) ? prev : []
      const updated = [newSession, ...list]
      // Enforce max sessions
      if (updated.length > MAX_SESSIONS) {
        return updated.slice(0, MAX_SESSIONS)
      }
      return updated
    })
    setActiveSessionId(newSession.id)
  }

  const switchSessionFn = (id: string) => {
    setActiveSessionId(id)
  }

  const deleteSessionFn = (id: string) => {
    setSessions(prev => {
      const list = Array.isArray(prev) ? prev : []
      const filtered = list.filter(s => s.id !== id)
      if (filtered.length === 0) {
        const newSession = createNewSession()
        setActiveSessionId(newSession.id)
        return [newSession]
      }
      if (id === effectiveSessionId) {
        setActiveSessionId(filtered[0].id)
      }
      return filtered
    })
  }

  const renameSessionFn = (id: string, title: string) => {
    setSessions(prev => {
      const list = Array.isArray(prev) ? prev : []
      return list.map(s => s.id === id ? { ...s, title } : s)
    })
  }

  return (
    <ChatCtx.Provider value={{
      sessions: validSessions,
      activeSessionId: effectiveSessionId,
      createSession: createSessionFn,
      switchSession: switchSessionFn,
      deleteSession: deleteSessionFn,
      renameSession: renameSessionFn,
      messages,
      isLoading,
      activeTool,
      sendMessage,
      stopGeneration,
      retryLastMessage,
      settings,
      updateSettings,
      resetSettings,
    }}>
      {children}
    </ChatCtx.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useChatContext(): ChatContextValue {
  const ctx = useContext(ChatCtx)
  if (!ctx) throw new Error('useChatContext must be used within ChatProvider')
  return ctx
}
