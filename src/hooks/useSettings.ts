import { useCallback, useEffect } from 'react'
import type { ChatSettings } from '../types/chat'
import { DEFAULT_SETTINGS } from '../utils/constants'
import { useLocalStorage } from './useLocalStorage'

const STORAGE_KEY = 'arc-reactor-settings'

export function useSettings() {
  const [settings, setSettings] = useLocalStorage<ChatSettings>(STORAGE_KEY, DEFAULT_SETTINGS)

  const updateSettings = useCallback((partial: Partial<ChatSettings>) => {
    setSettings(prev => ({ ...prev, ...partial }))
  }, [setSettings])

  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_SETTINGS)
  }, [setSettings])

  // Apply dark mode to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', settings.darkMode ? 'dark' : 'light')
  }, [settings.darkMode])

  return { settings, updateSettings, resetSettings }
}
