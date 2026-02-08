import type { ChatRequest } from '../types/api'
import { API_BASE } from '../utils/constants'
import { getAuthToken, removeAuthToken } from '../utils/api-client'

export interface StreamCallbacks {
  onToken: (text: string) => void
  onToolStart: (name: string) => void
  onToolEnd: (name: string) => void
  onDone: () => void
  onError: (error: Error) => void
}

export async function streamChat(
  request: ChatRequest,
  callbacks: StreamCallbacks,
  signal?: AbortSignal,
): Promise<void> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  const token = getAuthToken()
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${API_BASE}/api/chat/stream`, {
    method: 'POST',
    headers,
    body: JSON.stringify(request),
    signal,
  })

  if (res.status === 401 && token) {
    removeAuthToken()
    throw new Error('Session expired')
  }

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`)
  }

  const reader = res.body?.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (reader) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })

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
          if (data) callbacks.onToken(data)
          break
        case 'tool_start':
          callbacks.onToolStart(data)
          break
        case 'tool_end':
          callbacks.onToolEnd(data)
          break
        case 'done':
          callbacks.onDone()
          break
      }
    }
  }
}
