import { useEffect } from 'react'

/**
 * Registers global keyboard shortcuts using Ctrl (Windows/Linux) or Cmd (Mac).
 * Modifier key combos are safe to intercept even in input/textarea fields.
 */
export function useKeyboardShortcuts(shortcuts: Record<string, () => void>) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey)) return

      const cb = shortcuts[e.key.toLowerCase()]
      if (cb) {
        e.preventDefault()
        cb()
      }
    }

    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [shortcuts])
}
