import type { Session } from '../types/chat'

/**
 * Export a conversation session as JSON and trigger download.
 */
export function exportAsJson(session: Session): void {
  const payload = {
    sessionId: session.id,
    title: session.title,
    exportedAt: new Date().toISOString(),
    messages: session.messages.map(msg => ({
      role: msg.role,
      content: msg.content,
      timestamp: msg.timestamp,
      ...(msg.toolsUsed?.length ? { toolsUsed: msg.toolsUsed } : {}),
    })),
  }
  const json = JSON.stringify(payload, null, 2)
  downloadFile(json, `${sanitizeFilename(session.title)}.json`, 'application/json')
}

/**
 * Export a conversation session as Markdown and trigger download.
 */
export function exportAsMarkdown(session: Session): void {
  const lines: string[] = []
  lines.push(`# ${session.title}`)
  lines.push('')
  lines.push(`*Exported: ${new Date().toLocaleString()}*`)
  lines.push('')
  lines.push('---')
  lines.push('')

  for (const msg of session.messages) {
    const role = msg.role === 'user' ? 'User' : 'Assistant'
    lines.push(`## ${role}`)
    lines.push('')
    lines.push(msg.content)
    if (msg.toolsUsed?.length) {
      lines.push('')
      lines.push(`*Tools used: ${msg.toolsUsed.join(', ')}*`)
    }
    lines.push('')
  }

  const md = lines.join('\n')
  downloadFile(md, `${sanitizeFilename(session.title)}.md`, 'text/markdown')
}

function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8` })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9가-힣ぁ-んァ-ヶ一-龥\s\-_]/g, '').trim().replace(/\s+/g, '-') || 'conversation'
}
