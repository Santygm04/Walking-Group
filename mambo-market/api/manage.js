import crypto from "node:crypto"
import {
  buildAdminClientActionEmail,
  buildCancelledEmail,
  buildMeetingLinks,
  buildUpdatedEmail,
  createTransport,
  getAdminEmail,
  getContactEmail,
  getFromAddress,
  meetingTimestampART,
  parseBody,
  sanitizeLine,
  verifyManageToken,
} from "./_utils.js"
import { getRequest, listRequests, updateRequest } from "./_storage.js"
import { getAvailabilitySettings, isSlotAvailable } from "./_availability.js"
import { getClientIp, rateLimit, requireSameOrigin, sendRateLimitResponse } from "./_security.js"

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/

function readToken(req) {
  if (req.method === "GET") {
    return typeof req.query?.token === "string" ? req.query.token : ""
  }
  const body = parseBody(req)
  return typeof body.token === "string" ? body.token : ""
}

function meetingView(record) {
  const links = buildMeetingLinks(record)
  return {
    name: record.name,
    company: record.company,
    service: record.service,
    date: record.date,
    time: record.time,
    status: record.status || "pending",
    links: {
      manageUrl: links.manageUrl,
      calendarUrl: links.calendarUrl,
      googleCalendarUrl: links.googleCalendarUrl,
    },
  }
}

async function notifyParties(userEmail, adminEmail) {
  const transport = createTransport()
  const results = await Promise.allSettled([
    transport.sendMail({ ...userEmail, replyTo: getContactEmail() }),
    transport.sendMail({ ...adminEmail, replyTo: getContactEmail() }),
  ])

  results.forEach((result, index) => {
    if (result.status === "rejected") {
      console.error(index === 0 ? "manage-user-email-error" : "manage-admin-email-error", result.reason?.message)
    }
  })

  return results.every((result) => result.status === "fulfilled")
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store")

  if (req.method !== "GET" && req.method !== "POST") {
    return res.status(405).json({ error: "METHOD_NOT_ALLOWED", message: "Método no permitido." })
  }

  if (req.method === "POST" && !requireSameOrigin(req, res)) return undefined

  const ip = getClientIp(req)
  const limit = await rateLimit({ key: `manage:${ip}`, limit: 40, windowSeconds: 900 })
  if (!limit.allowed) {
    return sendRateLimitResponse(res, limit.retryAfter)
  }

  const token = readToken(req)
  const payload = verifyManageToken(token)
  if (!payload) {
    return res.status(400).json({ error: "INVALID_TOKEN", message: "El enlace no es válido o venció." })
  }

  let record
  try {
    record = await getRequest(payload.requestId)
  } catch (error) {
    console.error("manage-read-error", error?.message)
    return res.status(500).json({ error: "READ_FAILED", message: "No pudimos cargar la reunión." })
  }

  if (!record) {
    return res.status(404).json({ error: "NOT_FOUND", message: "La reunión no existe." })
  }

  if (req.method === "GET") {
    return res.status(200).json({ ok: true, meeting: meetingView(record) })
  }

  const body = parseBody(req)
  const action = sanitizeLine(body.action, 20)

  if ((action === "reschedule" || action === "cancel") && record.status === "confirmed") {
    return res.status(403).json({
      error: "CONFIRMED_IMMUTABLE",
      message: "La reunión ya está confirmada. Para reprogramarla o cancelarla, escribinos por email.",
    })
  }

  if (action === "reschedule") {
    if (record.status === "cancelled") {
      return res.status(409).json({ error: "CANCELLED", message: "La reunión ya está cancelada." })
    }

    const date = sanitizeLine(body.date, 10)
    const time = sanitizeLine(body.time, 5)
    const timestamp = meetingTimestampART(date, time)

    if (!DATE_PATTERN.test(date) || !TIME_PATTERN.test(time) || !timestamp) {
      return res.status(400).json({ error: "INVALID_DATE_TIME", message: "La fecha o el horario no son válidos." })
    }

    if (timestamp < Date.now()) {
      return res.status(400).json({ error: "PAST_DATE", message: "Elegí una fecha y horario futuros." })
    }

    let settings
    let requests
    try {
      ;[settings, requests] = await Promise.all([getAvailabilitySettings(), listRequests()])
    } catch (error) {
      console.error("manage-availability-error", error?.message)
      return res.status(500).json({ error: "AVAILABILITY_FAILED", message: "No pudimos validar la disponibilidad." })
    }

    if (!isSlotAvailable(settings, requests, date, time, record.id)) {
      return res.status(409).json({
        error: "SLOT_UNAVAILABLE",
        message: "Ese horario ya no está disponible. Elegí otro día u horario.",
      })
    }

    const previous = { date: record.date, time: record.time }

    let updated
    try {
      updated = await updateRequest(record.id, (current) => ({
        ...current,
        date,
        time,
        reminderSentAt: null,
        updatedAt: Date.now(),
        history: [
          ...(Array.isArray(current.history) ? current.history : []),
          {
            id: crypto.randomUUID(),
            type: "client_rescheduled",
            at: Date.now(),
            by: "Cliente",
            detail: `Nueva fecha: ${date} ${time}`,
          },
        ].slice(-60),
      }))
    } catch (error) {
      console.error("manage-reschedule-error", error?.message)
      return res.status(500).json({ error: "UPDATE_FAILED", message: "No pudimos reprogramar la reunión." })
    }

    let emailSent = false
    try {
      const links = buildMeetingLinks(updated)
      const userEmail = buildUpdatedEmail(updated, links)
      const adminEmail = buildAdminClientActionEmail(updated, "rescheduled", previous)
      emailSent = await notifyParties(
        {
          from: getFromAddress(),
          to: updated.email,
          subject: userEmail.subject,
          text: userEmail.text,
          html: userEmail.html,
        },
        {
          from: getFromAddress(),
          to: getAdminEmail(),
          subject: adminEmail.subject,
          text: adminEmail.text,
          html: adminEmail.html,
        },
      )
    } catch (error) {
      console.error("manage-reschedule-email-error", error?.message)
    }

    return res.status(200).json({ ok: true, emailSent, meeting: meetingView(updated) })
  }

  if (action === "cancel") {
    if (record.status === "cancelled") {
      return res.status(409).json({ error: "CANCELLED", message: "La reunión ya está cancelada." })
    }

    let updated
    try {
      updated = await updateRequest(record.id, (current) => ({
        ...current,
        status: "cancelled",
        cancelledAt: Date.now(),
        cancelReason: "Cancelada por el cliente.",
        updatedAt: Date.now(),
        history: [
          ...(Array.isArray(current.history) ? current.history : []),
          {
            id: crypto.randomUUID(),
            type: "client_cancelled",
            at: Date.now(),
            by: "Cliente",
            detail: "El cliente canceló la reunión.",
          },
        ].slice(-60),
      }))
    } catch (error) {
      console.error("manage-cancel-error", error?.message)
      return res.status(500).json({ error: "UPDATE_FAILED", message: "No pudimos cancelar la reunión." })
    }

    let emailSent = false
    try {
      const userEmail = buildCancelledEmail(updated, "Cancelada por el cliente.")
      const adminEmail = buildAdminClientActionEmail(updated, "cancelled")
      emailSent = await notifyParties(
        {
          from: getFromAddress(),
          to: updated.email,
          subject: userEmail.subject,
          text: userEmail.text,
          html: userEmail.html,
        },
        {
          from: getFromAddress(),
          to: getAdminEmail(),
          subject: adminEmail.subject,
          text: adminEmail.text,
          html: adminEmail.html,
        },
      )
    } catch (error) {
      console.error("manage-cancel-email-error", error?.message)
    }

    return res.status(200).json({ ok: true, emailSent, meeting: meetingView(updated) })
  }

  return res.status(400).json({ error: "INVALID_ACTION", message: "Acción no válida." })
}
