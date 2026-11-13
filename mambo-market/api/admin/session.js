import { clearSessionCookie, requireAdmin } from "../_auth.js"
import { requireSameOrigin } from "../_security.js"

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store")

  if (req.method === "POST") {
    if (!requireSameOrigin(req, res)) return undefined
    clearSessionCookie(req, res)
    return res.status(200).json({ ok: true })
  }

  if (req.method !== "GET") {
    return res.status(405).json({ error: "METHOD_NOT_ALLOWED", message: "Método no permitido." })
  }

  const session = requireAdmin(req, res, { checkOrigin: false })
  if (!session) return undefined

  return res.status(200).json({ ok: true, email: session.sub })
}
