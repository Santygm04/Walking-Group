import { requireAdmin } from "../_auth.js"
import { listRequests, storageAvailable, storageConfigured } from "../_storage.js"
import { twoFactorAvailable, twoFactorEnabled } from "../_twofactor.js"

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "METHOD_NOT_ALLOWED", message: "Método no permitido." })
  }

  const session = requireAdmin(req, res, { checkOrigin: false })
  if (!session) return undefined

  const view = typeof req.query?.view === "string" ? req.query.view : "list"

  if (view === "health") {
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

  if (!storageAvailable()) {
    return res.status(503).json({
      error: "STORAGE_NOT_CONFIGURED",
      message: "Falta conectar la base de datos (Upstash Redis) para usar el panel.",
    })
  }

  try {
    const requests = await listRequests()

    if (view === "backup") {
      return res.status(200).json({
        ok: true,
        generatedAt: new Date().toISOString(),
        count: requests.length,
        requests,
      })
    }

    const sorted = requests
      .filter((request) => request && typeof request.id === "string")
      .sort((left, right) => (right.createdAt || 0) - (left.createdAt || 0))
      .slice(0, 500)

    return res.status(200).json({ ok: true, requests: sorted })
  } catch (error) {
    console.error("admin-list-error", error?.message)
    return res.status(500).json({ error: "LIST_FAILED", message: "No pudimos cargar las solicitudes." })
  }
}
