import { requireAdmin } from "../_auth.js"
import { listRequests, storageConfigured } from "../_storage.js"
import { twoFactorAvailable, twoFactorEnabled } from "../_twofactor.js"

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "METHOD_NOT_ALLOWED", message: "Método no permitido." })
  }

  const session = requireAdmin(req, res, { checkOrigin: false })
  if (!session) return undefined

  const view = typeof req.query?.view === "string" ? req.query.view : "health"

  if (view === "backup") {
    if (!storageConfigured()) {
      return res.status(503).json({ error: "STORAGE_NOT_CONFIGURED", message: "Falta la base de datos." })
    }

    try {
      const requests = await listRequests()
      return res.status(200).json({
        ok: true,
        generatedAt: new Date().toISOString(),
        count: requests.length,
        requests,
      })
    } catch (error) {
      console.error("admin-backup-error", error?.message)
      return res.status(500).json({ error: "BACKUP_FAILED", message: "No pudimos generar el backup." })
    }
  }

  if (view !== "health") {
    return res.status(400).json({ error: "INVALID_VIEW", message: "Vista no válida." })
  }

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
