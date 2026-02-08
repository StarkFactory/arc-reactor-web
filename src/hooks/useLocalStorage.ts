import { useState, useCallback } from 'react'
import { loadFromStorage, saveToStorage } from '../services/storage'

export function useLocalStorage<T>(key: string, defaultValue: T): [T, (value: T | ((prev: T) => T)) => void] {
  const [stored, setStored] = useState<T>(() => loadFromStorage(key, defaultValue))

  // Reload from storage when key changes during render (avoids setState-in-effect)
  const [prevKey, setPrevKey] = useState(key)
  if (prevKey !== key) {
    setPrevKey(key)
    setStored(loadFromStorage(key, defaultValue))
  }

  const setValue = useCallback((value: T | ((prev: T) => T)) => {
    setStored(prev => {
      const next = value instanceof Function ? value(prev) : value
      saveToStorage(key, next)
      return next
    })
  }, [key])

  return [stored, setValue]
}
