export const PUBLIC_DATA_EVENT = 'catalog:invalidate'

type CacheEntry = { value: unknown; at: number }

const CACHE_MS = 5 * 60 * 1000
const entries = new Map<string, CacheEntry>()

export function readCache<T>(key: string): T | null {
  const entry = entries.get(key)
  if (!entry) return null
  if (Date.now() - entry.at > CACHE_MS) {
    entries.delete(key)
    return null
  }
  return entry.value as T
}

export function writeCache<T>(key: string, value: T): void {
  entries.set(key, { value, at: Date.now() })
}

export function invalidatePublicData(): void {
  for (const key of entries.keys()) {
    if (key.startsWith('public:')) entries.delete(key)
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(PUBLIC_DATA_EVENT))
  }
}
