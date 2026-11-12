import { requireAdmin } from "../_auth.js"
import { listRequests, storageAvailable } from "../_storage.js"

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "METHOD_NOT_ALLOWED", message: "Método no permitido." })
  }

  const session = requireAdmin(req, res, { checkOrigin: false })
  if (!session) return undefined

  if (!storageAvailable()) {
    return res.status(503).json({
      error: "STORAGE_NOT_CONFIGURED",
      message: "Falta conectar la base de datos (Upstash Redis) para usar el panel.",
    })
  }

  try {
    const requests = await listRequests()
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
