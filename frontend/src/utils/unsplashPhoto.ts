// frontend/src/utils/unsplashPhoto.ts
const CACHE_KEY = 'wp_unsplash_cache'
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000 // 7 days

type CacheEntry = { url: string; ts: number }
type Cache = Record<string, CacheEntry>

function readCache(): Cache {
  try { return JSON.parse(localStorage.getItem(CACHE_KEY) ?? '{}') } catch { return {} }
}

function writeCache(cache: Cache) {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(cache)) } catch {}
}

export async function fetchDestinationPhoto(destination: string): Promise<string | null> {
  const key = destination.toLowerCase().trim()
  if (!key) return null

  const cache = readCache()
  const entry = cache[key]
  if (entry && Date.now() - entry.ts < CACHE_TTL) return entry.url

  const apiKey = import.meta.env.VITE_UNSPLASH_ACCESS_KEY
  if (!apiKey) return null

  try {
    const res = await fetch(
      `https://api.unsplash.com/photos/random?query=${encodeURIComponent(key)}&orientation=landscape&content_filter=high`,
      { headers: { Authorization: `Client-ID ${apiKey}` } }
    )
    if (!res.ok) return null
    const data = await res.json()
    const url: string | null = data?.urls?.regular ?? null
    if (!url) return null
    writeCache({ ...readCache(), [key]: { url, ts: Date.now() } })
    return url
  } catch {
    return null
  }
}
