import { safeEqual } from "../_security.js"
import { deleteRequest, listRequests, storageAvailable } from "../_storage.js"

const DEFAULT_RETENTION_DAYS = 730
const MAX_PER_RUN = 100

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store")

  if (req.method !== "GET") {
    return res.status(405).json({ error: "METHOD_NOT_ALLOWED", message: "Método no permitido." })
  }

  const secret = process.env.CRON_SECRET
  if (!secret) {
    return res.status(503).json({ error: "CRON_NOT_CONFIGURED", message: "Falta CRON_SECRET." })
  }

  const authorization = req.headers.authorization || ""
  if (!safeEqual(authorization, `Bearer ${secret}`)) {
    return res.status(401).json({ error: "UNAUTHORIZED", message: "No autorizado." })
  }

  if (!storageAvailable()) {
    return res.status(503).json({ error: "STORAGE_NOT_CONFIGURED", message: "Falta la base de datos." })
  }

  try {
    const days = Number(process.env.DATA_RETENTION_DAYS || DEFAULT_RETENTION_DAYS)
    const retentionDays = Number.isFinite(days) && days > 0 ? days : DEFAULT_RETENTION_DAYS
    const cutoff = Date.now() - retentionDays * 24 * 60 * 60 * 1000

    const oldRequests = (await listRequests())
      .filter((request) => request.createdAt && request.createdAt < cutoff)
      .slice(0, MAX_PER_RUN)

    let deleted = 0
    for (const request of oldRequests) {
      try {
        await deleteRequest(request.id)
        deleted += 1
      } catch (error) {
        console.error("retention-delete-error", request.id, error?.message)
      }
    }

    return res.status(200).json({ ok: true, deleted, checked: oldRequests.length, retentionDays })
  } catch (error) {
    console.error("retention-cron-error", error?.message)
    return res.status(500).json({ error: "RETENTION_FAILED", message: "No pudimos procesar la retención." })
  }
}
