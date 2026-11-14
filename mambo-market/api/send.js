import crypto from "node:crypto"
import {
  buildAdminEmail,
  buildConfirmationUrl,
  buildMeetingLinks,
  buildPendingEmail,
  createTransport,
  getAdminEmail,
  getContactEmail,
  getFromAddress,
  isValidEmail,
  parseBody,
  sanitizeLine,
  sanitizeMultiline,
  signToken,
} from "./_utils.js"
import { saveRequest, storageConfigured, listRequests } from "./_storage.js"
import { getAvailabilitySettings, isSlotAvailable } from "./_availability.js"
import { getClientIp, rateLimit, sendRateLimitResponse } from "./_security.js"

const REQUIRED_FIELDS = [
  "nombre",
  "empresa",
  "email",
  "telefono",
  "tipoServicio",
  "mensaje",
  "fechaPreferida",
  "horaPreferida",
]

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store")

  if (req.method !== "POST") {
    return res.status(405).json({ error: "METHOD_NOT_ALLOWED", message: "Método no permitido." })
  }

  const ip = getClientIp(req)
  const limit = await rateLimit({ key: `send:${ip}`, limit: 5, windowSeconds: 600 })
  if (!limit.allowed) {
    return sendRateLimitResponse(res, limit.retryAfter)
  }

  try {
    const body = parseBody(req)

    if (sanitizeLine(body.website, 200)) {
      return res.status(200).json({ ok: true })
    }

    const form = {
      nombre: sanitizeLine(body.nombre, 120),
      empresa: sanitizeLine(body.empresa, 160),
      email: sanitizeLine(body.email, 180).toLowerCase(),
      telefono: sanitizeLine(body.telefono, 60),
      tipoServicio: sanitizeLine(body.tipoServicio, 160),
      presupuesto: sanitizeLine(body.presupuesto, 120),
      urgencia: sanitizeLine(body.urgencia, 120),
      fechaPreferida: sanitizeLine(body.fechaPreferida, 10),
      horaPreferida: sanitizeLine(body.horaPreferida, 5),
      mensaje: sanitizeMultiline(body.mensaje, 4000),
    }

    const missing = REQUIRED_FIELDS.filter((field) => !form[field])
    if (missing.length) {
      return res.status(400).json({ error: "INVALID_FORM", message: "Faltan datos obligatorios." })
    }

    if (!isValidEmail(form.email)) {
      return res.status(400).json({ error: "INVALID_EMAIL", message: "El email ingresado no es válido." })
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(form.fechaPreferida) || Number.isNaN(new Date(`${form.fechaPreferida}T12:00:00Z`).getTime())) {
      return res.status(400).json({ error: "INVALID_DATE", message: "La fecha ingresada no es válida." })
    }

    const today = new Date().toISOString().slice(0, 10)
    if (form.fechaPreferida < today) {
      return res.status(400).json({ error: "PAST_DATE", message: "La fecha de la reunión ya pasó." })
    }

    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(form.horaPreferida)) {
      return res.status(400).json({ error: "INVALID_TIME", message: "El horario ingresado no es válido." })
    }

    let settings
    let requests
    try {
      ;[settings, requests] = await Promise.all([getAvailabilitySettings(), listRequests()])
    } catch (error) {
      console.error("send-availability-error", error?.message)
      return res.status(500).json({
        error: "AVAILABILITY_FAILED",
        message: "No pudimos validar la disponibilidad. Intentá nuevamente.",
      })
    }

    if (!isSlotAvailable(settings, requests, form.fechaPreferida, form.horaPreferida)) {
      return res.status(409).json({
        error: "SLOT_UNAVAILABLE",
        message: "Ese horario ya no está disponible. Elegí otro día u horario.",
      })
    }

    const id = crypto.randomUUID()
    const createdAt = Date.now()
    const record = {
      id,
      createdAt,
      updatedAt: createdAt,
      status: "pending",
      name: form.nombre,
      company: form.empresa,
      email: form.email,
      phone: form.telefono,
      service: form.tipoServicio,
      budget: form.presupuesto,
      urgency: form.urgencia,
      date: form.fechaPreferida,
      time: form.horaPreferida,
      message: form.mensaje,
      replies: [],
      notes: [],
      history: [{ id: crypto.randomUUID(), type: "created", at: createdAt, by: "Sistema" }],
    }

    let stored = false
    try {
      stored = await saveRequest(record)
    } catch (storageError) {
      console.error("send-storage-error", storageError?.message)
    }

    if (storageConfigured() && !stored) {
      console.error("send-storage-not-persisted", id)
    }

    const payload = {
      requestId: id,
      nombre: form.nombre,
      email: form.email,
      telefono: form.telefono,
      empresa: form.empresa,
      servicio: form.tipoServicio,
      fecha: form.fechaPreferida,
      hora: form.horaPreferida,
      exp: Date.now() + 1000 * 60 * 60 * 24 * 30,
    }

    const token = signToken(payload)
    const confirmUrl = buildConfirmationUrl(token)
    const transport = createTransport()

    const adminEmail = buildAdminEmail(form, confirmUrl)
    const meetingLinks = buildMeetingLinks(record)
    const pendingEmail = buildPendingEmail(form, { manageUrl: meetingLinks.manageUrl })

    await transport.sendMail({
      from: getFromAddress(),
      to: getAdminEmail(),
      replyTo: form.email,
      subject: adminEmail.subject,
      text: adminEmail.text,
      html: adminEmail.html,
    })

    await transport.sendMail({
      from: getFromAddress(),
      to: form.email,
      replyTo: getContactEmail(),
      subject: pendingEmail.subject,
      text: pendingEmail.text,
      html: pendingEmail.html,
    })

    return res.status(200).json({ ok: true, stored })
  } catch (error) {
    console.error("send-request-error", error?.message)

    if (error?.message === "EMAIL_NOT_CONFIGURED") {
      return res.status(503).json({
        error: "EMAIL_NOT_CONFIGURED",
        message: "El envío de emails todavía no está configurado.",
      })
    }

    if (error?.message === "CONFIRMATION_NOT_CONFIGURED") {
      return res.status(503).json({
        error: "CONFIRMATION_NOT_CONFIGURED",
        message: "La confirmación de reuniones todavía no está configurada.",
      })
    }

    return res.status(500).json({
      error: "SEND_FAILED",
      message: "No pudimos enviar la solicitud. Intentá nuevamente.",
    })
  }
}
