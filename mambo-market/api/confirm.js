import {
  buildConfirmedEmail,
  createTransport,
  getContactEmail,
  getFromAddress,
  parseBody,
  verifyToken,
} from "./_utils.js"
import { getRequest, updateRequest } from "./_storage.js"
import { getClientIp, rateLimit, sendRateLimitResponse } from "./_security.js"

function readToken(req) {
  if (req.method === "GET") {
    return typeof req.query?.token === "string" ? req.query.token : ""
  }
  const body = parseBody(req)
  return typeof body.token === "string" ? body.token : ""
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store")

  if (req.method !== "GET" && req.method !== "POST") {
    return res.status(405).json({ error: "METHOD_NOT_ALLOWED", message: "Método no permitido." })
  }

  const ip = getClientIp(req)
  const limit = await rateLimit({ key: `confirm:${ip}`, limit: 30, windowSeconds: 900 })
  if (!limit.allowed) {
    return sendRateLimitResponse(res, limit.retryAfter)
  }

  const token = readToken(req)
  if (!token) {
    return res.status(400).json({ error: "MISSING_TOKEN", message: "Falta el enlace de confirmación." })
  }

  const payload = verifyToken(token)
  if (!payload) {
    return res.status(400).json({
      error: "INVALID_TOKEN",
      message: "El enlace de confirmación no es válido o venció.",
    })
  }

  let stored = null
  try {
    stored = await getRequest(payload.requestId)
  } catch (error) {
    console.error("confirm-storage-read-error", error?.message)
  }

  const meeting = {
    name: payload.nombre,
    company: payload.empresa,
    email: payload.email,
    phone: payload.telefono,
    service: payload.servicio,
    date: payload.fecha,
    time: payload.hora,
    status: stored?.status || "pending",
  }

  if (req.method === "GET") {
    return res.status(200).json({ ok: true, meeting })
  }

  if (stored?.status === "confirmed") {
    return res.status(200).json({
      ok: true,
      alreadyConfirmed: true,
      email: payload.email,
      meeting,
    })
  }

  if (stored?.status === "cancelled") {
    return res.status(409).json({
      error: "REQUEST_CANCELLED",
      message: "Esta solicitud fue cancelada. Contactá al equipo para reprogramarla.",
    })
  }

  try {
    const transport = createTransport()
    const email = buildConfirmedEmail(payload)

    await transport.sendMail({
      from: getFromAddress(),
      to: payload.email,
      replyTo: getContactEmail(),
      subject: email.subject,
      text: email.text,
      html: email.html,
    })

    if (stored) {
      try {
        await updateRequest(payload.requestId, (current) => ({
          ...current,
          status: "confirmed",
          confirmedAt: Date.now(),
        }))
      } catch (error) {
        console.error("confirm-storage-update-error", error?.message)
      }
    }

    return res.status(200).json({ ok: true, email: payload.email, meeting: { ...meeting, status: "confirmed" } })
  } catch (error) {
    console.error("confirm-request-error", error?.message)

    if (error?.message === "EMAIL_NOT_CONFIGURED") {
      return res.status(503).json({
        error: "EMAIL_NOT_CONFIGURED",
        message: "El envío de emails todavía no está configurado.",
      })
    }

    return res.status(500).json({
      error: "CONFIRM_FAILED",
      message: "No pudimos enviar la confirmación. Intentá nuevamente.",
    })
  }
}
