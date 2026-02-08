import i18n from '../i18n'

export function formatRelativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  const lang = i18n.language || 'en'

  try {
    const rtf = new Intl.RelativeTimeFormat(lang, { numeric: 'auto' })
    if (minutes < 1) return rtf.format(0, 'second')  // "just now" / "방금"
    if (minutes < 60) return rtf.format(-minutes, 'minute')
    if (hours < 24) return rtf.format(-hours, 'hour')
    if (days < 7) return rtf.format(-days, 'day')
  } catch {
    // Fallback if Intl.RelativeTimeFormat not available
    if (minutes < 1) return 'just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    if (days < 7) return `${days}d ago`
  }

  return new Date(timestamp).toLocaleDateString(lang, {
    month: 'short',
    day: 'numeric',
  })
}

export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(1)}s`
}

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}
