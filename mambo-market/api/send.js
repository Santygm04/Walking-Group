import crypto from "node:crypto"
import {
  buildAdminEmail,
  buildConfirmationUrl,
  buildPendingEmail,
  createTransport,
  getAdminEmail,
  getFromAddress,
  isValidEmail,
  parseBody,
  signToken,
} from "./_utils.js"

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

function clean(value, maxLength = 500) {
  return String(value ?? "").trim().slice(0, maxLength)
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store")

  if (req.method !== "POST") {
    return res.status(405).json({ error: "METHOD_NOT_ALLOWED", message: "Método no permitido." })
  }

  try {
    const body = parseBody(req)
    const form = {
      nombre: clean(body.nombre, 120),
      empresa: clean(body.empresa, 160),
      email: clean(body.email, 180).toLowerCase(),
      telefono: clean(body.telefono, 60),
      tipoServicio: clean(body.tipoServicio, 160),
      presupuesto: clean(body.presupuesto, 120),
      urgencia: clean(body.urgencia, 120),
      fechaPreferida: clean(body.fechaPreferida, 10),
      horaPreferida: clean(body.horaPreferida, 5),
      mensaje: clean(body.mensaje, 4000),
    }

    const missing = REQUIRED_FIELDS.filter((field) => !form[field])
    if (missing.length) {
      return res.status(400).json({ error: "INVALID_FORM", message: "Faltan datos obligatorios." })
    }

    if (!isValidEmail(form.email)) {
      return res.status(400).json({ error: "INVALID_EMAIL", message: "El email ingresado no es válido." })
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(form.fechaPreferida)) {
      return res.status(400).json({ error: "INVALID_DATE", message: "La fecha ingresada no es válida." })
    }

    const today = new Date().toISOString().slice(0, 10)
    if (form.fechaPreferida < today) {
      return res.status(400).json({ error: "PAST_DATE", message: "La fecha de la reunión ya pasó." })
    }

    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(form.horaPreferida)) {
      return res.status(400).json({ error: "INVALID_TIME", message: "El horario ingresado no es válido." })
    }

    const payload = {
      requestId: crypto.randomUUID(),
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
    const pendingEmail = buildPendingEmail(form)

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
      subject: pendingEmail.subject,
      text: pendingEmail.text,
      html: pendingEmail.html,
    })

    return res.status(200).json({ ok: true })
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
