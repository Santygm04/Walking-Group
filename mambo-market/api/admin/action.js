import crypto from "node:crypto"
import { requireAdmin } from "../_auth.js"
import {
  buildCancelledEmail,
  buildConfirmedEmail,
  buildReplyEmail,
  createTransport,
  getFromAddress,
  parseBody,
  sanitizeLine,
  sanitizeMultiline,
} from "../_utils.js"
import { getRequest, storageAvailable, updateRequest } from "../_storage.js"
import { getClientIp, rateLimit, sendRateLimitResponse } from "../_security.js"

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "METHOD_NOT_ALLOWED", message: "Método no permitido." })
  }

  const session = requireAdmin(req, res)
  if (!session) return undefined

  if (!storageAvailable()) {
    return res.status(503).json({
      error: "STORAGE_NOT_CONFIGURED",
      message: "Falta conectar la base de datos (Upstash Redis) para usar el panel.",
    })
  }

  const ip = getClientIp(req)
  const limit = await rateLimit({ key: `admin-action:${ip}:${session.sub}`, limit: 60, windowSeconds: 60 })
  if (!limit.allowed) {
    return sendRateLimitResponse(res, limit.retryAfter)
  }

  const body = parseBody(req)
  const id = sanitizeLine(body.id, 64)
  const action = sanitizeLine(body.action, 20)

  if (!UUID_PATTERN.test(id)) {
    return res.status(400).json({ error: "INVALID_ID", message: "Solicitud inválida." })
  }

  let record
  try {
    record = await getRequest(id)
  } catch (error) {
    console.error("admin-action-read-error", error?.message)
    return res.status(500).json({ error: "READ_FAILED", message: "No pudimos leer la solicitud." })
  }

  if (!record) {
    return res.status(404).json({ error: "NOT_FOUND", message: "La solicitud no existe." })
  }

  try {
    const transport = createTransport()

    if (action === "confirm") {
      if (record.status === "confirmed") {
        return res.status(409).json({ error: "ALREADY_CONFIRMED", message: "La reunión ya está confirmada." })
      }

      const email = buildConfirmedEmail({
        nombre: record.name,
        fecha: record.date,
        hora: record.time,
        servicio: record.service,
      })

      await transport.sendMail({
        from: getFromAddress(),
        to: record.email,
        subject: email.subject,
        text: email.text,
        html: email.html,
      })

      const updated = await updateRequest(id, (current) => ({
        ...current,
        status: "confirmed",
        confirmedAt: Date.now(),
        cancelledAt: null,
        cancelReason: "",
      }))

      return res.status(200).json({ ok: true, request: updated })
    }

    if (action === "cancel") {
      if (record.status === "cancelled") {
        return res.status(409).json({ error: "ALREADY_CANCELLED", message: "La solicitud ya está cancelada." })
      }

      const reason = sanitizeMultiline(body.reason, 500)
      const email = buildCancelledEmail(record, reason)

      await transport.sendMail({
        from: getFromAddress(),
        to: record.email,
        subject: email.subject,
        text: email.text,
        html: email.html,
      })

      const updated = await updateRequest(id, (current) => ({
        ...current,
        status: "cancelled",
        cancelledAt: Date.now(),
        cancelReason: reason,
        confirmedAt: null,
      }))

      return res.status(200).json({ ok: true, request: updated })
    }

    if (action === "reply") {
      const subject = sanitizeLine(body.subject, 160) || "Respuesta de Mambo Market"
      const message = sanitizeMultiline(body.message, 5000)

      if (!message) {
        return res.status(400).json({ error: "EMPTY_MESSAGE", message: "Escribí un mensaje antes de enviar." })
      }

      const email = buildReplyEmail(record, subject, message)

      await transport.sendMail({
        from: getFromAddress(),
        to: record.email,
        replyTo: getFromAddress(),
        subject: email.subject,
        text: email.text,
        html: email.html,
      })

      const reply = {
        id: crypto.randomUUID(),
        subject,
        message,
        sentAt: Date.now(),
      }

      const updated = await updateRequest(id, (current) => ({
        ...current,
        replies: [...(Array.isArray(current.replies) ? current.replies : []).slice(-19), reply],
      }))

      return res.status(200).json({ ok: true, request: updated })
    }

    return res.status(400).json({ error: "INVALID_ACTION", message: "Acción no válida." })
  } catch (error) {
    console.error("admin-action-error", error?.message)

    if (error?.message === "EMAIL_NOT_CONFIGURED") {
      return res.status(503).json({
        error: "EMAIL_NOT_CONFIGURED",
        message: "El envío de emails todavía no está configurado.",
      })
    }

    return res.status(500).json({ error: "ACTION_FAILED", message: "No pudimos completar la acción." })
  }
}
