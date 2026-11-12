import {
  buildConfirmedEmail,
  createTransport,
  getFromAddress,
  parseBody,
  verifyToken,
} from "./_utils.js"

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

  const meeting = {
    name: payload.nombre,
    company: payload.empresa,
    email: payload.email,
    phone: payload.telefono,
    service: payload.servicio,
    date: payload.fecha,
    time: payload.hora,
  }

  if (req.method === "GET") {
    return res.status(200).json({ ok: true, meeting })
  }

  try {
    const transport = createTransport()
    const email = buildConfirmedEmail(payload)

    await transport.sendMail({
      from: getFromAddress(),
      to: payload.email,
      subject: email.subject,
      text: email.text,
      html: email.html,
    })

    return res.status(200).json({ ok: true, email: payload.email, meeting })
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
