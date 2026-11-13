import { getRequest } from "./_storage.js"
import { getClientIp, rateLimit, sendRateLimitResponse } from "./_security.js"
import { meetingTimestampART, verifyManageToken } from "./_utils.js"

function escapeIcs(value) {
  return String(value ?? "")
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;")
}

function formatIcsDate(timestamp) {
  return new Date(timestamp).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "")
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "METHOD_NOT_ALLOWED", message: "Método no permitido." })
  }

  const ip = getClientIp(req)
  const limit = await rateLimit({ key: `calendar:${ip}`, limit: 40, windowSeconds: 900 })
  if (!limit.allowed) {
    return sendRateLimitResponse(res, limit.retryAfter)
  }

  const payload = verifyManageToken(typeof req.query?.token === "string" ? req.query.token : "")
  if (!payload) {
    return res.status(400).json({ error: "INVALID_TOKEN", message: "El enlace no es válido o venció." })
  }

  let record
  try {
    record = await getRequest(payload.requestId)
  } catch (error) {
    console.error("calendar-read-error", error?.message)
    return res.status(500).json({ error: "READ_FAILED", message: "No pudimos cargar la reunión." })
  }

  if (!record) {
    return res.status(404).json({ error: "NOT_FOUND", message: "La reunión no existe." })
  }

  if (record.status === "cancelled") {
    return res.status(410).json({ error: "CANCELLED", message: "La reunión está cancelada." })
  }

  const start = meetingTimestampART(record.date, record.time)
  if (!start) {
    return res.status(400).json({ error: "INVALID_DATE", message: "La reunión no tiene una fecha válida." })
  }

  const end = start + 45 * 60 * 1000
  const status = record.status === "confirmed" ? "CONFIRMED" : "TENTATIVE"
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Mambo Market//Reunion//ES",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${record.id}@mambomarket`,
    `DTSTAMP:${formatIcsDate(Date.now())}`,
    `DTSTART:${formatIcsDate(start)}`,
    `DTEND:${formatIcsDate(end)}`,
    `SUMMARY:${escapeIcs("Reunión con Mambo Market")}`,
    `DESCRIPTION:${escapeIcs(`Servicio: ${record.service || "A coordinar"}\nEstado: ${status === "CONFIRMED" ? "Confirmada" : "Pendiente de confirmación"}`)}`,
    "LOCATION:A coordinar",
    `STATUS:${status}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ]

  res.setHeader("Content-Type", "text/calendar; charset=utf-8")
  res.setHeader("Content-Disposition", 'attachment; filename="mambo-market-reunion.ics"')
  res.setHeader("Cache-Control", "no-store")
  return res.status(200).send(lines.join("\r\n"))
}
