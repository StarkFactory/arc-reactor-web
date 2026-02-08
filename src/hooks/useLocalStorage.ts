import { useState, useCallback, useEffect, useRef } from 'react'
import { loadFromStorage, saveToStorage } from '../services/storage'

export function useLocalStorage<T>(key: string, defaultValue: T): [T, (value: T | ((prev: T) => T)) => void] {
  const [stored, setStored] = useState<T>(() => loadFromStorage(key, defaultValue))
  const prevKeyRef = useRef(key)

  // Reload from storage when key changes (e.g. user login/logout)
  useEffect(() => {
    if (prevKeyRef.current !== key) {
      prevKeyRef.current = key
      setStored(loadFromStorage(key, defaultValue))
    }
  }, [key, defaultValue])

  const setValue = useCallback((value: T | ((prev: T) => T)) => {
    setStored(prev => {
      const next = value instanceof Function ? value(prev) : value
      saveToStorage(key, next)
      return next
    })
  }, [key])

  return [stored, setValue]
}
