import crypto from "node:crypto"
import { redisCommand, storageConfigured } from "./_storage.js"

const memoryLimits = globalThis.__mamboRateLimits || new Map()
globalThis.__mamboRateLimits = memoryLimits

export function getClientIp(req) {
  const forwarded = req.headers["x-forwarded-for"]
  if (typeof forwarded === "string" && forwarded.length) {
    return forwarded.split(",")[0].trim().slice(0, 80)
  }
  return String(req.headers["x-real-ip"] || req.socket?.remoteAddress || "unknown").slice(0, 80)
}

export function safeEqual(left, right) {
  const leftHash = crypto.createHash("sha256").update(String(left)).digest()
  const rightHash = crypto.createHash("sha256").update(String(right)).digest()
  return crypto.timingSafeEqual(leftHash, rightHash)
}

export function isSameOrigin(req) {
  const origin = req.headers.origin
  const host = req.headers["x-forwarded-host"] || req.headers.host
  if (!origin || !host) return false

  try {
    return new URL(origin).host === host
  } catch {
    return false
  }
}

export function requireSameOrigin(req, res) {
  if (isSameOrigin(req)) return true
  res.status(403).json({ error: "INVALID_ORIGIN", message: "Origen de la solicitud no permitido." })
  return false
}

export async function rateLimit({ key, limit, windowSeconds }) {
  const safeKey = String(key).replace(/[^a-zA-Z0-9:_-]/g, "").slice(0, 120)

  if (storageConfigured()) {
    try {
      const windowId = Math.floor(Date.now() / 1000 / windowSeconds)
      const redisKey = `mambo:rl:${safeKey}:${windowId}`
      const count = await redisCommand(["INCR", redisKey])
      if (count === 1) await redisCommand(["EXPIRE", redisKey, windowSeconds])
      return {
        allowed: count <= limit,
        remaining: Math.max(0, limit - count),
        retryAfter: windowSeconds,
      }
    } catch {
      // Fall back to in-memory limiting if Redis is unavailable.
    }
  }

  const now = Date.now()
  const existing = memoryLimits.get(safeKey)
  const windowMs = windowSeconds * 1000

  if (!existing || existing.resetAt <= now) {
    memoryLimits.set(safeKey, { count: 1, resetAt: now + windowMs })
    return { allowed: true, remaining: limit - 1, retryAfter: windowSeconds }
  }

  existing.count += 1
  return {
    allowed: existing.count <= limit,
    remaining: Math.max(0, limit - existing.count),
    retryAfter: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
  }
}

export function sendRateLimitResponse(res, retryAfter) {
  res.setHeader("Retry-After", String(Math.max(1, retryAfter)))
  return res.status(429).json({
    error: "RATE_LIMITED",
    message: "Demasiados intentos. Esperá unos minutos y volvé a intentar.",
  })
}
