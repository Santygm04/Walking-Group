import { createSession, getAdminIdentity, setSessionCookie } from "../_auth.js"
import { verifyChallenge } from "../_twofactor.js"
import { parseBody, sanitizeLine } from "../_utils.js"
import { getClientIp, rateLimit, requireSameOrigin, sendRateLimitResponse } from "../_security.js"

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store")

  if (req.method !== "POST") {
    return res.status(405).json({ error: "METHOD_NOT_ALLOWED", message: "Método no permitido." })
  }

  if (!requireSameOrigin(req, res)) return undefined

  const ip = getClientIp(req)
  const limit = await rateLimit({ key: `otp-verify:${ip}`, limit: 20, windowSeconds: 900 })
  if (!limit.allowed) {
    return sendRateLimitResponse(res, limit.retryAfter)
  }

  const body = parseBody(req)
  const challengeId = sanitizeLine(body.challengeId, 64)
  const code = sanitizeLine(body.code, 6)

  if (!challengeId || !/^\d{6}$/.test(code)) {
    return res.status(400).json({ error: "INVALID_CODE", message: "Código inválido o vencido." })
  }

  let result
  try {
    result = await verifyChallenge(challengeId, code)
  } catch {
    return res.status(503).json({
      error: "TWO_FACTOR_NOT_CONFIGURED",
      message: "El 2FA no está disponible.",
    })
  }

  if (!result) {
    return res.status(401).json({ error: "INVALID_CODE", message: "Código inválido o vencido." })
  }

  let admin
  try {
    admin = getAdminIdentity()
  } catch {
    return res.status(503).json({ error: "ADMIN_NOT_CONFIGURED", message: "El panel no está configurado." })
  }

  if (result.email !== admin.email) {
    return res.status(401).json({ error: "INVALID_CODE", message: "Código inválido o vencido." })
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
