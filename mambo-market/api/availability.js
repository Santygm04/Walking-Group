import { requireAdmin } from "./_auth.js"
import {
  computeAvailabilityDays,
  getAvailabilitySettings,
  normalizeAvailability,
  saveAvailabilitySettings,
} from "./_availability.js"
import { listRequests } from "./_storage.js"
import { getClientIp, rateLimit, sendRateLimitResponse } from "./_security.js"
import { parseBody } from "./_utils.js"

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store")

  if (req.method === "GET") {
    const adminView = req.query?.admin === "1"

    if (adminView) {
      const session = requireAdmin(req, res, { checkOrigin: false })
      if (!session) return undefined

      const settings = await getAvailabilitySettings()
      return res.status(200).json({ ok: true, settings })
    }

    const ip = getClientIp(req)
    const limit = await rateLimit({ key: `availability:${ip}`, limit: 120, windowSeconds: 900 })
    if (!limit.allowed) {
      return sendRateLimitResponse(res, limit.retryAfter)
    }

    const settings = await getAvailabilitySettings()
    let requests = []
    try {
      requests = await listRequests()
    } catch (error) {
      console.error("availability-bookings-error", error?.message)
    }

    const days = computeAvailabilityDays(settings, requests)

    return res.status(200).json({
      ok: true,
      slotMinutes: settings.slotMinutes,
      minNoticeHours: settings.minNoticeHours,
      timezone: "America/Argentina/Tucumán",
      days,
    })
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "METHOD_NOT_ALLOWED", message: "Método no permitido." })
  }

  const session = requireAdmin(req, res)
  if (!session) return undefined

  const body = parseBody(req)
  if (!body.settings || typeof body.settings !== "object") {
    return res.status(400).json({ error: "INVALID_SETTINGS", message: "Configuración inválida." })
  }

  try {
    const settings = normalizeAvailability(body.settings)
    await saveAvailabilitySettings(settings)
    return res.status(200).json({ ok: true, settings })
  } catch (error) {
    console.error("availability-save-error", error?.message)
    return res.status(500).json({ error: "SAVE_FAILED", message: "No pudimos guardar la disponibilidad." })
  }
}
