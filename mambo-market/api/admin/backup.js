import { requireAdmin } from "../_auth.js"
import { listRequests, storageConfigured } from "../_storage.js"

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "METHOD_NOT_ALLOWED", message: "Método no permitido." })
  }

  const session = requireAdmin(req, res, { checkOrigin: false })
  if (!session) return undefined

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
