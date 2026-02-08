import { useState, useRef, useEffect, useCallback, type FormEvent } from 'react'
import './App.css'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  toolsUsed?: string[]
}

const API_BASE = import.meta.env.VITE_API_URL || ''

/**
 * Target animation duration in frames (~60fps).
 * Any response (short or long) animates over roughly this many frames.
 * 40 frames ≈ 667ms at 60fps — clearly visible typing effect.
 */
const FRAMES_TARGET = 40

function App() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [darkMode, setDarkMode] = useState(true)
  const [sessionId] = useState(() => crypto.randomUUID())
  const [activeTool, setActiveTool] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Typing animation state (refs to avoid re-renders during animation)
  const targetTextRef = useRef('')
  const displayedLenRef = useRef(0)
  const rafIdRef = useRef<number>(0)
  const toolsUsedRef = useRef<string[]>([])
  const streamDoneRef = useRef(false)
  const animationDoneResolveRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light')
  }, [darkMode])

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
        }
      }
      return updated
    })
  }, [])

  /** Start or continue the typing animation loop */
  const tickAnimation = useCallback(() => {
    cancelAnimationFrame(rafIdRef.current)

    const step = () => {
      const target = targetTextRef.current
      const current = displayedLenRef.current

      if (current < target.length) {
        // Scale speed so total animation takes ~FRAMES_TARGET frames
        // Short text (18 chars): 1 char/frame → 18 frames = 300ms (visible typing)
        // Long text (500 chars): 13 chars/frame → 40 frames = 667ms (smooth scroll)
        const speed = Math.max(1, Math.ceil(target.length / FRAMES_TARGET))
        const next = Math.min(current + speed, target.length)
        displayedLenRef.current = next
        updateAssistantMessage(target.slice(0, next), false)
        rafIdRef.current = requestAnimationFrame(step)
      } else if (streamDoneRef.current) {
        // Animation caught up and stream is done — finalize
        updateAssistantMessage(target, true)
        if (animationDoneResolveRef.current) {
          animationDoneResolveRef.current()
          animationDoneResolveRef.current = null
        }
      }
      // else: animation caught up but stream still going — wait for tickAnimation to be called again
    }
    rafIdRef.current = requestAnimationFrame(step)
  }, [updateAssistantMessage])

  /** Returns a promise that resolves when typing animation finishes */
  const waitForAnimationDone = useCallback((): Promise<void> => {
    // Already caught up?
    if (displayedLenRef.current >= targetTextRef.current.length) {
      updateAssistantMessage(targetTextRef.current, true)
      return Promise.resolve()
    }
    return new Promise<void>(resolve => {
      animationDoneResolveRef.current = resolve
      tickAnimation()
    })
  }, [tickAnimation, updateAssistantMessage])

  const sendMessage = async (e: FormEvent) => {
    e.preventDefault()
    const text = input.trim()
    if (!text || isLoading) return

    const userMsg: ChatMessage = { role: 'user', content: text }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setIsLoading(true)
    setActiveTool(null)

    // Reset animation state
    targetTextRef.current = ''
    displayedLenRef.current = 0
    toolsUsedRef.current = []
    streamDoneRef.current = false
    animationDoneResolveRef.current = null
    cancelAnimationFrame(rafIdRef.current)

    try {
      const res = await fetch(`${API_BASE}/api/chat/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, userId: 'web-user', sessionId }),
      })

      if (!res.ok) throw new Error(`HTTP ${res.status}`)

      const reader = res.body?.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      setMessages(prev => [...prev, { role: 'assistant', content: '' }])

      while (reader) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })

        // Parse SSE events (separated by double newline)
        const parts = buffer.split('\n\n')
        buffer = parts.pop() ?? ''

        for (const part of parts) {
          const lines = part.split('\n')
          let eventType = 'message'
          const dataLines: string[] = []

          for (const line of lines) {
            if (line.startsWith('event:')) {
              eventType = line.slice(6).trim()
            } else if (line.startsWith('data:')) {
              dataLines.push(line.slice(5))
            }
          }

          // SSE spec: multiple data lines are joined with newlines
          const data = dataLines.join('\n')

          switch (eventType) {
            case 'message':
              if (data) {
                targetTextRef.current += data
                tickAnimation()
              }
              break
            case 'tool_start':
              setActiveTool(data)
              if (data && !toolsUsedRef.current.includes(data)) {
                toolsUsedRef.current.push(data)
              }
              break
            case 'tool_end':
              setActiveTool(null)
              break
            case 'done':
              break
          }
        }
      }

      // Stream ended — mark done and wait for typing animation to finish naturally
      streamDoneRef.current = true
      if (targetTextRef.current) {
        await waitForAnimationDone()
      }

      if (!targetTextRef.current) {
        const json = await res.json().catch(() => null)
        if (json?.content) {
          setMessages(prev => {
            const updated = [...prev]
            updated[updated.length - 1] = { role: 'assistant', content: json.content }
            return updated
          })
        }
      }
    } catch (err) {
      cancelAnimationFrame(rafIdRef.current)
      setMessages(prev => [
        ...prev.filter(m => m.content !== ''),
        { role: 'assistant', content: `[Error] ${err instanceof Error ? err.message : 'Request failed'}` }
      ])
    } finally {
      setIsLoading(false)
      setActiveTool(null)
      inputRef.current?.focus()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(e as unknown as FormEvent)
    }
  }

  return (
    <div className="chat-container">
      <header className="chat-header">
        <h1>Arc Reactor</h1>
        <span className="subtitle">AI Agent Chat</span>
        <button className="theme-toggle" onClick={() => setDarkMode(!darkMode)}>
          {darkMode ? '☀️' : '🌙'}
        </button>
      </header>

      <main className="chat-messages">
        {messages.length === 0 && (
          <div className="empty-state">
            <p>Arc Reactor AI Agent에게 질문하세요</p>
            <div className="suggestions">
              {['안녕하세요', '지금 몇 시야?', '3 + 5는 얼마야?'].map(s => (
                <button key={s} onClick={() => { setInput(s) }} className="suggestion">
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`message ${msg.role}`}>
            <div className="message-bubble">
              {msg.role === 'assistant' && msg.toolsUsed && msg.toolsUsed.length > 0 && (
                <div className="tools-used">
                  {msg.toolsUsed.map(t => (
                    <span key={t} className="tool-badge">{t}</span>
                  ))}
                </div>
              )}
              <pre>{msg.content || (isLoading && i === messages.length - 1 ? '...' : '')}</pre>
            </div>
          </div>
        ))}

        {activeTool && (
          <div className="tool-indicator">
            <span className="tool-spinner" />
            <span>Using tool: {activeTool}</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </main>

      <form className="chat-input" onSubmit={sendMessage}>
        <textarea
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="메시지를 입력하세요..."
          rows={1}
          disabled={isLoading}
        />
        <button type="submit" disabled={isLoading || !input.trim()}>
          {isLoading ? '...' : '보내기'}
        </button>
      </form>
    </div>
  )
}

export default App
