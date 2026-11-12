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
