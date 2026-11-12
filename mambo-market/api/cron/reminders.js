import crypto from "node:crypto"
import { safeEqual } from "../_security.js"
import { listRequests, storageAvailable, updateRequest } from "../_storage.js"
import { buildReminderEmail, createTransport, getFromAddress, meetingTimestampART } from "../_utils.js"

const WINDOW_MS = 36 * 60 * 60 * 1000
const MAX_PER_RUN = 50

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
    const now = Date.now()
    const requests = (await listRequests())
      .filter((request) => request.status === "confirmed" && !request.reminderSentAt)
      .map((request) => ({ request, at: meetingTimestampART(request.date, request.time) }))
      .filter(({ at }) => at !== null && at >= now && at - now <= WINDOW_MS)
      .slice(0, MAX_PER_RUN)

    if (!requests.length) {
      return res.status(200).json({ ok: true, sent: 0, failed: 0, checked: 0 })
    }

    const transport = createTransport()
    let sent = 0
    let failed = 0

    for (const { request } of requests) {
      try {
        const email = buildReminderEmail(request)
        await transport.sendMail({
          from: getFromAddress(),
          to: request.email,
          subject: email.subject,
          text: email.text,
          html: email.html,
        })

        await updateRequest(request.id, (current) => ({
          ...current,
          reminderSentAt: Date.now(),
          updatedAt: Date.now(),
          history: [
            ...(Array.isArray(current.history) ? current.history : []),
            {
              id: crypto.randomUUID(),
              type: "reminder",
              at: Date.now(),
              by: "Sistema",
              detail: "Recordatorio automático enviado.",
            },
          ].slice(-60),
        }))

        sent += 1
      } catch (error) {
        failed += 1
        console.error("reminder-send-error", request.id, error?.message)
      }
    }

    return res.status(200).json({ ok: true, sent, failed, checked: requests.length })
  } catch (error) {
    console.error("reminders-cron-error", error?.message)
    return res.status(500).json({ error: "CRON_FAILED", message: "No pudimos procesar los recordatorios." })
  }
}
