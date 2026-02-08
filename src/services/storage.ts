export function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (raw === null) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export function saveToStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // localStorage full or unavailable - silently ignore
  }
}

export function removeFromStorage(key: string): void {
  try {
    localStorage.removeItem(key)
  } catch {
    // silently ignore
  }
}
