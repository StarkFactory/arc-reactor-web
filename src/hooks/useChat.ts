import { useState, useRef, useEffect } from 'react'
import type { ChatMessage } from '../types/chat'
import type { ChatSettings } from '../types/chat'
import { streamChat, sendChat, sendChatMultipart } from '../services/api'
import { FRAMES_TARGET } from '../utils/constants'
import i18n from '../i18n'

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

  // Abort controller for cancelling streaming
  const abortControllerRef = useRef<AbortController | null>(null)

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

  const updateAssistantMessage = (content: string, final: boolean) => {
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
  }

  const tickAnimation = () => {
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
  }

  const waitForAnimationDone = (): Promise<void> => {
    if (displayedLenRef.current >= targetTextRef.current.length) {
      updateAssistantMessage(targetTextRef.current, true)
      return Promise.resolve()
    }
    return new Promise<void>(resolve => {
      animationDoneResolveRef.current = resolve
      tickAnimation()
    })
  }

  const sendMessage = async (text: string, files?: File[]) => {
    if (!text.trim() || isLoading) return

    // Build attachment metadata for display
    const attachments = files?.map(f => ({
      name: f.name,
      type: f.type,
      previewUrl: f.type.startsWith('image/') ? URL.createObjectURL(f) : undefined,
    }))

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text.trim(),
      timestamp: Date.now(),
      ...(attachments && attachments.length > 0 ? { attachments } : {}),
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

    // Create abort controller for this request
    const abortController = new AbortController()
    abortControllerRef.current = abortController

    const chatRequest = {
      message: text.trim(),
      userId,
      metadata: { sessionId },
      ...(settings.model ? { model: settings.model } : {}),
      ...(settings.selectedPersonaId ? { personaId: settings.selectedPersonaId } : {}),
      ...(!settings.selectedPersonaId && settings.selectedPromptTemplateId
        ? { promptTemplateId: settings.selectedPromptTemplateId }
        : {}),
      ...(!settings.selectedPersonaId && !settings.selectedPromptTemplateId && settings.systemPrompt
        ? { systemPrompt: settings.systemPrompt }
        : {}),
      ...(settings.responseFormat !== 'TEXT' ? { responseFormat: settings.responseFormat } : {}),
    }

    try {
      if (files && files.length > 0) {
        // Multipart upload (non-streaming)
        const content = await sendChatMultipart(text.trim(), files, {
          model: settings.model ?? undefined,
          systemPrompt: !settings.selectedPersonaId && !settings.selectedPromptTemplateId
            ? settings.systemPrompt || undefined : undefined,
          personaId: settings.selectedPersonaId ?? undefined,
          userId,
        })
        updateAssistantMessage(content, true)
      } else if (settings.responseFormat === 'JSON') {
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
        }, abortController.signal)

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
              updated[updated.length - 1] = { ...last, content: i18n.t('chat.noResponse') }
            }
            return updated
          })
        }
      }
    } catch (err) {
      cancelAnimationFrame(rafIdRef.current)
      // If aborted by user, finalize with whatever content we have
      if (err instanceof DOMException && err.name === 'AbortError') {
        streamDoneRef.current = true
        if (targetTextRef.current) {
          updateAssistantMessage(targetTextRef.current, true)
        } else {
          // No content received yet — remove the empty assistant message
          setMessages(prev => prev.filter(m => m.content !== ''))
        }
      } else {
        const errorMessage = err instanceof Error ? err.message : i18n.t('chat.requestFailed')
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
      }
    } finally {
      abortControllerRef.current = null
      setIsLoading(false)
      setActiveTool(null)
    }
  }

  const stopGeneration = () => {
    abortControllerRef.current?.abort()
  }

  const retryLastMessage = async () => {
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
  }

  return {
    messages,
    isLoading,
    activeTool,
    sendMessage,
    stopGeneration,
    retryLastMessage,
  }
}
