import { useState, useRef, useEffect, useCallback, type FormEvent } from 'react'
import './App.css'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  toolsUsed?: string[]
}

const API_BASE = import.meta.env.VITE_API_URL || ''

/** Chars revealed per animation frame (~60fps → ~180 chars/sec) */
const CHARS_PER_FRAME = 3

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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light')
  }, [darkMode])

  /** Flush remaining text instantly (called when stream ends) */
  const flushAnimation = useCallback(() => {
    cancelAnimationFrame(rafIdRef.current)
    const full = targetTextRef.current
    if (full) {
      displayedLenRef.current = full.length
      setMessages(prev => {
        const updated = [...prev]
        const last = updated[updated.length - 1]
        if (last?.role === 'assistant') {
          updated[updated.length - 1] = {
            ...last,
            content: full,
            toolsUsed: toolsUsedRef.current.length > 0 ? [...toolsUsedRef.current] : undefined,
          }
        }
        return updated
      })
    }
  }, [])

  /** Start or continue the typing animation loop */
  const tickAnimation = useCallback(() => {
    cancelAnimationFrame(rafIdRef.current)

    const step = () => {
      const target = targetTextRef.current
      const current = displayedLenRef.current
      if (current < target.length) {
        const next = Math.min(current + CHARS_PER_FRAME, target.length)
        displayedLenRef.current = next
        const displayed = target.slice(0, next)
        setMessages(prev => {
          const updated = [...prev]
          const last = updated[updated.length - 1]
          if (last?.role === 'assistant') {
            updated[updated.length - 1] = {
              ...last,
              content: displayed,
              toolsUsed: toolsUsedRef.current.length > 0 ? [...toolsUsedRef.current] : undefined,
            }
          }
          return updated
        })
        rafIdRef.current = requestAnimationFrame(step)
      }
    }
    rafIdRef.current = requestAnimationFrame(step)
  }, [])

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

      // Flush any remaining animation
      flushAnimation()

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
