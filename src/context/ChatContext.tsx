import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import type { ChatMessage, Session, ChatSettings } from '../types/chat'
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
  sendMessage: (text: string) => Promise<void>
  retryLastMessage: () => Promise<void>

  // Settings
  settings: ChatSettings
  updateSettings: (partial: Partial<ChatSettings>) => void
  resetSettings: () => void
}

const ChatCtx = createContext<ChatContextValue | null>(null)

function createNewSession(): Session {
  return {
    id: crypto.randomUUID(),
    title: '새 대화',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    messages: [],
  }
}

export function ChatProvider({ children }: { children: ReactNode }) {
  const { settings, updateSettings, resetSettings } = useSettings()

  const [sessions, setSessions] = useLocalStorage<Session[]>('arc-reactor-sessions', [createNewSession()])

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

  const activeSession = validSessions.find(s => s.id === activeSessionId)

  const handleMessagesChange = useCallback((msgs: ChatMessage[]) => {
    setSessions(prev => {
      const list = Array.isArray(prev) ? prev : []
      return list.map(s => {
        if (s.id !== activeSessionId) return s
        // Auto-title from first user message
        const firstUser = msgs.find(m => m.role === 'user')
        const title = firstUser
          ? truncate(firstUser.content, SESSION_TITLE_MAX_LENGTH)
          : s.title
        return { ...s, title, messages: msgs, updatedAt: Date.now() }
      })
    })
  }, [activeSessionId, setSessions])

  const { messages, isLoading, activeTool, sendMessage, retryLastMessage } = useChat({
    sessionId: activeSessionId,
    settings,
    initialMessages: activeSession?.messages ?? [],
    onMessagesChange: handleMessagesChange,
  })

  const createSessionFn = useCallback(() => {
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
  }, [setSessions])

  const switchSessionFn = useCallback((id: string) => {
    setActiveSessionId(id)
  }, [])

  const deleteSessionFn = useCallback((id: string) => {
    setSessions(prev => {
      const list = Array.isArray(prev) ? prev : []
      const filtered = list.filter(s => s.id !== id)
      if (filtered.length === 0) {
        const newSession = createNewSession()
        setActiveSessionId(newSession.id)
        return [newSession]
      }
      if (id === activeSessionId) {
        setActiveSessionId(filtered[0].id)
      }
      return filtered
    })
  }, [activeSessionId, setSessions])

  const renameSessionFn = useCallback((id: string, title: string) => {
    setSessions(prev => {
      const list = Array.isArray(prev) ? prev : []
      return list.map(s => s.id === id ? { ...s, title } : s)
    })
  }, [setSessions])

  return (
    <ChatCtx.Provider value={{
      sessions: validSessions,
      activeSessionId,
      createSession: createSessionFn,
      switchSession: switchSessionFn,
      deleteSession: deleteSessionFn,
      renameSession: renameSessionFn,
      messages,
      isLoading,
      activeTool,
      sendMessage,
      retryLastMessage,
      settings,
      updateSettings,
      resetSettings,
    }}>
      {children}
    </ChatCtx.Provider>
  )
}

export function useChatContext(): ChatContextValue {
  const ctx = useContext(ChatCtx)
  if (!ctx) throw new Error('useChatContext must be used within ChatProvider')
  return ctx
}
