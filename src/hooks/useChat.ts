import { useState, useRef, useCallback, useEffect } from 'react'
import type { ChatMessage } from '../types/chat'
import type { ChatSettings } from '../types/chat'
import { streamChat, sendChat } from '../services/api'
import { FRAMES_TARGET } from '../utils/constants'

interface UseChatOptions {
  sessionId: string
  settings: ChatSettings
  userId: string
  initialMessages?: ChatMessage[]
  onMessagesChange?: (messages: ChatMessage[]) => void
}

export function useChat({ sessionId, settings, userId, initialMessages = [], onMessagesChange }: UseChatOptions) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages)
  const [isLoading, setIsLoading] = useState(false)
  const [activeTool, setActiveTool] = useState<string | null>(null)

  // Typing animation refs
  const targetTextRef = useRef('')
  const displayedLenRef = useRef(0)
  const rafIdRef = useRef<number>(0)
  const toolsUsedRef = useRef<string[]>([])
  const streamDoneRef = useRef(false)
  const animationDoneResolveRef = useRef<(() => void) | null>(null)
  const sendStartTimeRef = useRef<number>(0)

  // Sync initial messages when session changes
  useEffect(() => {
    setMessages(initialMessages)
  }, [sessionId]) // eslint-disable-line react-hooks/exhaustive-deps

  // Notify parent of message changes
  const messagesRef = useRef(messages)
  messagesRef.current = messages
  useEffect(() => {
    onMessagesChange?.(messages)
  }, [messages]) // eslint-disable-line react-hooks/exhaustive-deps

  const updateAssistantMessage = useCallback((content: string, final: boolean) => {
    setMessages(prev => {
      const updated = [...prev]
      const last = updated[updated.length - 1]
      if (last?.role === 'assistant') {
        updated[updated.length - 1] = {
          ...last,
          content,
          toolsUsed: final && toolsUsedRef.current.length > 0
            ? [...toolsUsedRef.current]
            : last.toolsUsed,
          durationMs: final ? Date.now() - sendStartTimeRef.current : undefined,
        }
      }
      return updated
    })
  }, [])

  const tickAnimation = useCallback(() => {
    cancelAnimationFrame(rafIdRef.current)

    const step = () => {
      const target = targetTextRef.current
      const current = displayedLenRef.current

      if (current < target.length) {
        const speed = Math.max(1, Math.ceil(target.length / FRAMES_TARGET))
        const next = Math.min(current + speed, target.length)
        displayedLenRef.current = next
        updateAssistantMessage(target.slice(0, next), false)
        rafIdRef.current = requestAnimationFrame(step)
      } else if (streamDoneRef.current) {
        updateAssistantMessage(target, true)
        if (animationDoneResolveRef.current) {
          animationDoneResolveRef.current()
          animationDoneResolveRef.current = null
        }
      }
    }
    rafIdRef.current = requestAnimationFrame(step)
  }, [updateAssistantMessage])

  const waitForAnimationDone = useCallback((): Promise<void> => {
    if (displayedLenRef.current >= targetTextRef.current.length) {
      updateAssistantMessage(targetTextRef.current, true)
      return Promise.resolve()
    }
    return new Promise<void>(resolve => {
      animationDoneResolveRef.current = resolve
      tickAnimation()
    })
  }, [tickAnimation, updateAssistantMessage])

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isLoading) return

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text.trim(),
      timestamp: Date.now(),
    }

    const assistantMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
    }

    setMessages(prev => [...prev, userMsg, assistantMsg])
    setIsLoading(true)
    setActiveTool(null)

    // Reset animation state
    targetTextRef.current = ''
    displayedLenRef.current = 0
    toolsUsedRef.current = []
    streamDoneRef.current = false
    animationDoneResolveRef.current = null
    cancelAnimationFrame(rafIdRef.current)
    sendStartTimeRef.current = Date.now()

    const chatRequest = {
      message: text.trim(),
      userId,
      metadata: { sessionId },
      ...(settings.model ? { model: settings.model } : {}),
      ...(settings.selectedPersonaId ? { personaId: settings.selectedPersonaId } : {}),
      ...(!settings.selectedPersonaId && settings.systemPrompt ? { systemPrompt: settings.systemPrompt } : {}),
      ...(settings.responseFormat !== 'TEXT' ? { responseFormat: settings.responseFormat } : {}),
    }

    try {
      if (settings.responseFormat === 'JSON') {
        // JSON format uses non-streaming endpoint
        const content = await sendChat(chatRequest)
        updateAssistantMessage(content, true)
      } else {
        await streamChat(chatRequest, {
          onToken: (data) => {
            targetTextRef.current += data
            tickAnimation()
          },
          onToolStart: (name) => {
            setActiveTool(name)
            if (name && !toolsUsedRef.current.includes(name)) {
              toolsUsedRef.current.push(name)
            }
          },
          onToolEnd: () => {
            setActiveTool(null)
          },
          onDone: () => {
            // handled by stream end
          },
          onError: (err) => {
            throw err
          },
        })

        // Stream ended
        streamDoneRef.current = true
        if (targetTextRef.current) {
          await waitForAnimationDone()
        }

        if (!targetTextRef.current) {
          // Fallback: no streaming content received
          setMessages(prev => {
            const updated = [...prev]
            const last = updated[updated.length - 1]
            if (last?.role === 'assistant' && !last.content) {
              updated[updated.length - 1] = { ...last, content: '응답을 받지 못했습니다.' }
            }
            return updated
          })
        }
      }
    } catch (err) {
      cancelAnimationFrame(rafIdRef.current)
      const errorMessage = err instanceof Error ? err.message : '요청에 실패했습니다.'
      setMessages(prev => {
        const updated = prev.filter(m => m.content !== '')
        updated.push({
          id: crypto.randomUUID(),
          role: 'assistant',
          content: errorMessage,
          error: true,
          timestamp: Date.now(),
        })
        return updated
      })
    } finally {
      setIsLoading(false)
      setActiveTool(null)
    }
  }, [isLoading, sessionId, settings, userId, tickAnimation, waitForAnimationDone, updateAssistantMessage])

  const retryLastMessage = useCallback(async () => {
    const lastUserMsg = [...messages].reverse().find(m => m.role === 'user')
    if (!lastUserMsg) return

    // Remove both the last assistant message AND its corresponding user message
    // so that sendMessage can re-add them as a fresh pair
    setMessages(prev => {
      const last = prev[prev.length - 1]
      if (last?.role === 'assistant' && prev[prev.length - 2]?.role === 'user') {
        return prev.slice(0, -2)
      }
      if (last?.role === 'assistant') {
        return prev.slice(0, -1)
      }
      return prev
    })

    // Wait a tick for state to update, then resend
    await new Promise(r => setTimeout(r, 0))
    await sendMessage(lastUserMsg.content)
  }, [messages, sendMessage])

  return {
    messages,
    isLoading,
    activeTool,
    sendMessage,
    retryLastMessage,
  }
}
