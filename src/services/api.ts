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

/** Non-streaming chat for JSON response format */
export async function sendChat(request: ChatRequest): Promise<string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  const token = getAuthToken()
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${API_BASE}/api/chat`, {
    method: 'POST',
    headers,
    body: JSON.stringify(request),
  })

  if (res.status === 401 && token) {
    removeAuthToken()
    throw new Error('Session expired')
  }

  if (!res.ok) throw new Error(`HTTP ${res.status}`)

  const data = await res.json()
  return data.content ?? data.message ?? JSON.stringify(data)
}

/** Multipart chat for file attachments (non-streaming) */
export async function sendChatMultipart(
  message: string,
  files: File[],
  params?: {
    model?: string
    systemPrompt?: string
    personaId?: string
    userId?: string
  }
): Promise<string> {
  const formData = new FormData()
  formData.append('message', message)
  files.forEach(f => formData.append('files', f))
  if (params?.model) formData.append('model', params.model)
  if (params?.systemPrompt) formData.append('systemPrompt', params.systemPrompt)
  if (params?.personaId) formData.append('personaId', params.personaId)
  if (params?.userId) formData.append('userId', params.userId)

  const headers: Record<string, string> = {}
  const token = getAuthToken()
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${API_BASE}/api/chat/multipart`, {
    method: 'POST',
    headers,
    body: formData,
  })

  if (res.status === 401 && token) {
    removeAuthToken()
    throw new Error('Session expired')
  }

  if (!res.ok) throw new Error(`HTTP ${res.status}`)

  const data = await res.json()
  return data.content ?? data.message ?? JSON.stringify(data)
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
        case 'error':
          callbacks.onError(new Error(data))
          break
        case 'done':
          callbacks.onDone()
          break
      }
    }
  }
}
