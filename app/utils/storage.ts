// Lightweight localStorage helper with SSR safety.
// The Todos app persists state locally so the UI is fully functional
// without a backend; this layer is bypassed once a real API is wired in.

const PREFIX = 'todos:'

// SSR-safe: only touch localStorage when a real window exists. Using
// typeof window (instead of import.meta.client) keeps this portable across
// Nuxt, Vitest and any plain Node entry point.
const hasWindow = typeof window !== 'undefined' && !!window.localStorage

export const storage = {
  get<T>(key: string, fallback: T): T {
    if (!hasWindow) return fallback
    try {
      const raw = window.localStorage.getItem(PREFIX + key)
      return raw ? (JSON.parse(raw) as T) : fallback
    } catch {
      return fallback
    }
  },
  set<T>(key: string, value: T): void {
    if (!hasWindow) return
    try {
      window.localStorage.setItem(PREFIX + key, JSON.stringify(value))
    } catch {
      // ignore quota / serialization errors
    }
  },
  remove(key: string): void {
    if (!hasWindow) return
    try {
      window.localStorage.removeItem(PREFIX + key)
    } catch {
      // ignore
    }
  }
}
