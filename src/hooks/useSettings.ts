import { useEffect } from 'react'
import type { ChatSettings } from '../types/chat'
import { DEFAULT_SETTINGS } from '../utils/constants'
import { useUiStore } from '../stores/uiStore'

const toKey = (userId?: string) => userId ?? '__anon'

export function useSettings(userId?: string) {
  const key = toKey(userId)
  const settings = useUiStore((state) => state.settingsByUser[key] ?? DEFAULT_SETTINGS)
  const storeUpdate = useUiStore((state) => state.updateSettings)
  const storeReset = useUiStore((state) => state.resetSettings)

  const updateSettings = (partial: Partial<ChatSettings>) => storeUpdate(partial, userId)
  const resetSettings = () => storeReset(userId)

  // Sync dark mode preference to the document root element
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', settings.darkMode ? 'dark' : 'light')
  }, [settings.darkMode])

  return { settings, updateSettings, resetSettings }
}
