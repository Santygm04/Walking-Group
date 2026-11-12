import crypto from "node:crypto"
import { isSameOrigin, safeEqual } from "./_security.js"

const COOKIE_NAME = "mm_admin"
const SESSION_TTL_MS = 1000 * 60 * 60 * 8

function getSessionSecret() {
  const secret = process.env.ADMIN_SESSION_SECRET || process.env.CONFIRMATION_SECRET
  if (!secret) throw new Error("ADMIN_NOT_CONFIGURED")
  return secret
}

function sign(value) {
  return crypto.createHmac("sha256", getSessionSecret()).update(value).digest("base64url")
}

export function signSession(payload) {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url")
  return `${body}.${sign(body)}`
}

export function verifySession(token) {
  if (typeof token !== "string") return null
  const [body, signature] = token.split(".")
  if (!body || !signature) return null

  let expected
  try {
    expected = sign(body)
  } catch {
    return null
  }

  if (signature.length !== expected.length || !safeEqual(signature, expected)) return null

  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8"))
    if (!payload?.sub || !payload?.exp || payload.exp < Date.now()) return null
    return payload
  } catch {
    return null
  }
}

export function parseCookies(req) {
  const header = req.headers.cookie
  if (!header) return {}

  return header.split(";").reduce((cookies, part) => {
    const index = part.indexOf("=")
    if (index === -1) return cookies
    const key = part.slice(0, index).trim()
    const value = part.slice(index + 1).trim()
    if (key) cookies[key] = decodeURIComponent(value)
    return cookies
  }, {})
}

function secureCookie(req) {
  return req.headers["x-forwarded-proto"] === "https" || process.env.VERCEL === "1" || process.env.NODE_ENV === "production"
}

export function setSessionCookie(req, res, token) {
  const parts = [
    `${COOKIE_NAME}=${encodeURIComponent(token)}`,
    "HttpOnly",
    "Path=/",
    "SameSite=Strict",
    `Max-Age=${SESSION_TTL_MS / 1000}`,
  ]
  if (secureCookie(req)) parts.push("Secure")
  res.setHeader("Set-Cookie", parts.join("; "))
}

export function clearSessionCookie(req, res) {
  const parts = [`${COOKIE_NAME}=`, "HttpOnly", "Path=/", "SameSite=Strict", "Max-Age=0"]
  if (secureCookie(req)) parts.push("Secure")
  res.setHeader("Set-Cookie", parts.join("; "))
}

export function getAdminIdentity() {
  const email = (process.env.ADMIN_EMAIL || "santiagogilmina2@gmail.com").toLowerCase()
  const secret = process.env.ADMIN_PASSWORD_HASH || process.env.ADMIN_PASSWORD
  if (!secret) throw new Error("ADMIN_NOT_CONFIGURED")
  if (!secret.startsWith("scrypt$") && secret.length < 12) throw new Error("ADMIN_NOT_CONFIGURED")
  return { email, secret }
}

export function verifyPassword(input, configured) {
  if (!input || !configured) return false

  if (configured.startsWith("scrypt$")) {
    const [, saltHex, hashHex] = configured.split("$")
    if (!saltHex || !hashHex) return false
    try {
      const salt = Buffer.from(saltHex, "hex")
      const hash = Buffer.from(hashHex, "hex")
      const candidate = crypto.scryptSync(String(input), salt, hash.length)
      return hash.length === candidate.length && crypto.timingSafeEqual(hash, candidate)
    } catch {
      return false
    }
  }

  return safeEqual(input, configured)
}

export function verifyCredentials(email, password) {
  const admin = getAdminIdentity()
  if (!email || !password) return false
  return safeEqual(String(email).toLowerCase(), admin.email) && verifyPassword(password, admin.secret)
}

export function createSession(email) {
  const now = Date.now()
  return signSession({
    sub: String(email).toLowerCase(),
    iat: now,
    exp: now + SESSION_TTL_MS,
    jti: crypto.randomUUID(),
  })
}

export function requireAdmin(req, res, { checkOrigin = true } = {}) {
  res.setHeader("Cache-Control", "no-store")

  if (checkOrigin && req.method !== "GET" && req.method !== "HEAD" && !isSameOrigin(req)) {
    res.status(403).json({ error: "INVALID_ORIGIN", message: "Origen de la solicitud no permitido." })
    return null
  }

  const token = parseCookies(req)[COOKIE_NAME]
  const session = verifySession(token)
  if (!session) {
    res.status(401).json({ error: "UNAUTHORIZED", message: "Sesión inválida o vencida." })
    return null
  }

  try {
    const admin = getAdminIdentity()
    if (session.sub !== admin.email) {
      res.status(401).json({ error: "UNAUTHORIZED", message: "Sesión inválida o vencida." })
      return null
    }
  } catch {
    res.status(503).json({ error: "ADMIN_NOT_CONFIGURED", message: "El panel no está configurado." })
    return null
  }

  return session
}
