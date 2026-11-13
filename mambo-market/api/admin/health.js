import { requireAdmin } from "../_auth.js"
import { storageConfigured } from "../_storage.js"
import { twoFactorAvailable, twoFactorEnabled } from "../_twofactor.js"

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "METHOD_NOT_ALLOWED", message: "Método no permitido." })
  }

  const session = requireAdmin(req, res, { checkOrigin: false })
  if (!session) return undefined

  const resend = Boolean(process.env.RESEND_API_KEY)
  const smtp = Boolean(process.env.SMTP_USER && process.env.SMTP_PASS)
  const retentionDays = Number(process.env.DATA_RETENTION_DAYS || 730)

  return res.status(200).json({
    ok: true,
    admin: session.sub,
    services: {
      storage: storageConfigured(),
      email: resend || smtp,
      emailProvider: resend ? "resend" : smtp ? "smtp" : null,
      twoFactor: twoFactorEnabled() && twoFactorAvailable(),
      cron: Boolean(process.env.CRON_SECRET),
      retentionDays: Number.isFinite(retentionDays) ? retentionDays : 730,
    },
  })
}
