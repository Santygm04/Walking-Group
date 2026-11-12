import { createSession, getAdminIdentity, setSessionCookie, verifyCredentials } from "../_auth.js"
import { parseBody, sanitizeLine } from "../_utils.js"
import { getClientIp, rateLimit, requireSameOrigin, sendRateLimitResponse } from "../_security.js"

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store")

  if (req.method !== "POST") {
    return res.status(405).json({ error: "METHOD_NOT_ALLOWED", message: "Método no permitido." })
  }

  if (!requireSameOrigin(req, res)) return undefined

  const ip = getClientIp(req)
  const limit = await rateLimit({ key: `login:${ip}`, limit: 8, windowSeconds: 900 })
  if (!limit.allowed) {
    return sendRateLimitResponse(res, limit.retryAfter)
  }

  const body = parseBody(req)
  const email = sanitizeLine(body.email, 180).toLowerCase()
  const password = String(body.password || "").slice(0, 200)

  if (!email || !password) {
    return res.status(400).json({ error: "INVALID_CREDENTIALS", message: "Completá email y contraseña." })
  }

  let admin
  try {
    admin = getAdminIdentity()
  } catch {
    return res.status(503).json({
      error: "ADMIN_NOT_CONFIGURED",
      message: "El panel no está configurado. Configurá ADMIN_PASSWORD (mínimo 12 caracteres).",
    })
  }

  if (!verifyCredentials(email, password)) {
    return res.status(401).json({ error: "INVALID_CREDENTIALS", message: "Email o contraseña incorrectos." })
  }

  try {
    const token = createSession(admin.email)
    setSessionCookie(req, res, token)
    return res.status(200).json({ ok: true, email: admin.email })
  } catch {
    return res.status(503).json({
      error: "ADMIN_NOT_CONFIGURED",
      message: "Falta configurar la clave de sesión del panel.",
    })
  }
}
