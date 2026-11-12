import crypto from "node:crypto"
import { redisCommand, storageConfigured } from "./_storage.js"

const TTL_SECONDS = 600
const MAX_ATTEMPTS = 5
const memoryChallenges = globalThis.__mamboTwoFactor || new Map()
globalThis.__mamboTwoFactor = memoryChallenges

function getSecret() {
  const secret = process.env.ADMIN_SESSION_SECRET || process.env.CONFIRMATION_SECRET
  if (!secret) throw new Error("TWO_FACTOR_NOT_CONFIGURED")
  return secret
}

function hashCode(challengeId, code) {
  return crypto.createHmac("sha256", getSecret()).update(`${challengeId}:${code}`).digest()
}

function safeMatch(left, right) {
  if (left.length !== right.length) return false
  return crypto.timingSafeEqual(left, right)
}

function memoryAvailable() {
  return process.env.NODE_ENV !== "production" && process.env.VERCEL !== "1"
}

export function twoFactorEnabled() {
  return process.env.ADMIN_2FA_DISABLED !== "true"
}

export function twoFactorAvailable() {
  return storageConfigured() || memoryAvailable()
}

export async function createChallenge(email) {
  if (!twoFactorAvailable()) throw new Error("TWO_FACTOR_NOT_CONFIGURED")

  const challengeId = crypto.randomUUID()
  const code = String(crypto.randomInt(0, 1000000)).padStart(6, "0")
  const now = Date.now()
  const record = {
    email,
    hash: hashCode(challengeId, code).toString("hex"),
    attempts: 0,
    createdAt: now,
    expiresAt: now + TTL_SECONDS * 1000,
  }

  if (storageConfigured()) {
    await redisCommand(["SET", `mambo:2fa:${challengeId}`, JSON.stringify(record), "EX", TTL_SECONDS])
  } else {
    memoryChallenges.set(challengeId, record)
  }

  return { challengeId, code, expiresInSeconds: TTL_SECONDS }
}

export async function verifyChallenge(challengeId, code) {
  if (!challengeId || !/^\d{6}$/.test(String(code || ""))) return null
  if (!twoFactorAvailable()) throw new Error("TWO_FACTOR_NOT_CONFIGURED")

  let record = null
  const key = `mambo:2fa:${challengeId}`

  if (storageConfigured()) {
    const raw = await redisCommand(["GET", key])
    if (raw) {
      try {
        record = JSON.parse(raw)
      } catch {
        record = null
      }
    }
  } else {
    record = memoryChallenges.get(challengeId) || null
  }

  if (!record || record.expiresAt < Date.now() || record.attempts >= MAX_ATTEMPTS) {
    await deleteChallenge(challengeId)
    return null
  }

  const candidate = hashCode(challengeId, String(code))
  const expected = Buffer.from(record.hash, "hex")
  const valid = safeMatch(candidate, expected)

  if (!valid) {
    record.attempts += 1
    if (storageConfigured()) {
      const ttl = Math.max(1, Math.ceil((record.expiresAt - Date.now()) / 1000))
      await redisCommand(["SET", key, JSON.stringify(record), "EX", ttl])
    } else {
      memoryChallenges.set(challengeId, record)
    }
    return null
  }

  await deleteChallenge(challengeId)
  return { email: record.email }
}

export async function deleteChallenge(challengeId) {
  if (!challengeId) return
  if (storageConfigured()) {
    await redisCommand(["DEL", `mambo:2fa:${challengeId}`])
  } else {
    memoryChallenges.delete(challengeId)
  }
}
