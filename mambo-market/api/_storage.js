const REQUESTS_KEY = "mambo:requests"

const memoryStore = globalThis.__mamboMemoryStore || new Map()
globalThis.__mamboMemoryStore = memoryStore

function getRedisConfig() {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN
  return url && token ? { url, token } : null
}

export function storageConfigured() {
  return Boolean(getRedisConfig())
}

function allowMemoryStorage() {
  return process.env.NODE_ENV !== "production" && process.env.VERCEL !== "1"
}

export function storageAvailable() {
  return storageConfigured() || allowMemoryStorage()
}

export async function redisCommand(command) {
  const config = getRedisConfig()
  if (!config) throw new Error("STORAGE_NOT_CONFIGURED")

  const response = await fetch(config.url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(command),
  })

  if (!response.ok) {
    throw new Error(`STORAGE_HTTP_${response.status}`)
  }

  const data = await response.json()
  if (data?.error) throw new Error(`STORAGE_ERROR_${data.error}`)
  return data?.result
}

function parseRecord(value) {
  if (typeof value !== "string") return null
  try {
    const record = JSON.parse(value)
    return record && typeof record === "object" ? record : null
  } catch {
    return null
  }
}

export async function saveRequest(record) {
  if (!storageConfigured()) {
    memoryStore.set(record.id, record)
    return false
  }

  await redisCommand(["HSET", REQUESTS_KEY, record.id, JSON.stringify(record)])
  return true
}

export async function getRequest(id) {
  if (!storageConfigured()) {
    return memoryStore.get(id) || null
  }

  const raw = await redisCommand(["HGET", REQUESTS_KEY, id])
  return parseRecord(raw)
}

export async function listRequests() {
  if (!storageConfigured()) {
    return Array.from(memoryStore.values())
  }

  const raw = await redisCommand(["HVALS", REQUESTS_KEY])
  if (!Array.isArray(raw)) return []
  return raw.map(parseRecord).filter(Boolean)
}

export async function updateRequest(id, updater) {
  const current = await getRequest(id)
  if (!current) return null

  const next = typeof updater === "function" ? updater(current) : { ...current, ...updater }
  const record = { ...next, id }
  await saveRequest(record)
  return record
}

export async function deleteRequest(id) {
  if (!storageConfigured()) {
    return memoryStore.delete(id)
  }

  const removed = await redisCommand(["HDEL", REQUESTS_KEY, id])
  return removed > 0
}

const ANALYTICS_KEY = "mambo:analytics:events"
const ANALYTICS_MAX_EVENTS = 2000
let analyticsMemory = globalThis.__mamboAnalytics || []
globalThis.__mamboAnalytics = analyticsMemory

function parseAnalyticsEvent(value) {
  if (typeof value !== "string") return null
  try {
    const event = JSON.parse(value)
    return event && typeof event === "object" ? event : null
  } catch {
    return null
  }
}

export async function pushAnalyticsEvents(events) {
  if (!Array.isArray(events) || !events.length) return false

  if (!storageConfigured()) {
    analyticsMemory = [...events, ...analyticsMemory].slice(0, ANALYTICS_MAX_EVENTS)
    globalThis.__mamboAnalytics = analyticsMemory
    return false
  }

  await redisCommand(["LPUSH", ANALYTICS_KEY, ...events.map((event) => JSON.stringify(event))])
  await redisCommand(["LTRIM", ANALYTICS_KEY, 0, ANALYTICS_MAX_EVENTS - 1])
  await redisCommand(["EXPIRE", ANALYTICS_KEY, 60 * 60 * 24 * 90])
  return true
}

export async function listAnalyticsEvents(limit = ANALYTICS_MAX_EVENTS) {
  if (!storageConfigured()) {
    return analyticsMemory.slice(0, limit)
  }

  const raw = await redisCommand(["LRANGE", ANALYTICS_KEY, 0, Math.max(0, limit - 1)])
  if (!Array.isArray(raw)) return []
  return raw.map(parseAnalyticsEvent).filter(Boolean)
}

export async function pruneAnalyticsEvents(maxAgeDays = 90) {
  const events = await listAnalyticsEvents(ANALYTICS_MAX_EVENTS)
  const cutoff = Date.now() - maxAgeDays * 24 * 60 * 60 * 1000
  const keep = events.filter((event) => event.at && event.at >= cutoff)

  if (keep.length === events.length) return 0

  if (!storageConfigured()) {
    analyticsMemory = keep
    globalThis.__mamboAnalytics = analyticsMemory
    return events.length - keep.length
  }

  await redisCommand(["DEL", ANALYTICS_KEY])
  if (keep.length) {
    await redisCommand(["RPUSH", ANALYTICS_KEY, ...keep.map((event) => JSON.stringify(event))])
    await redisCommand(["EXPIRE", ANALYTICS_KEY, 60 * 60 * 24 * maxAgeDays])
  }
  return events.length - keep.length
}
