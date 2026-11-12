import crypto from "node:crypto"
import nodemailer from "nodemailer"

const FALLBACK_SITE_URL = "https://walking-group.vercel.app"
const FALLBACK_CONTACT_EMAIL = "panaxxx@hotmail.com"

export function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;")
}

export function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim())
}

export function formatDateLong(value) {
  if (!value) return "A coordinar"
  const date = new Date(`${value}T12:00:00Z`)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(date)
}

export function formatTime(value) {
  return value ? `${value} h` : "A coordinar"
}

export function getSiteUrl() {
  return (process.env.SITE_URL || FALLBACK_SITE_URL).replace(/\/+$/, "")
}

export function getAdminEmail() {
  return process.env.ADMIN_EMAIL || "santiagogilmina2@gmail.com"
}

export function getContactEmail() {
  return process.env.CONTACT_EMAIL || FALLBACK_CONTACT_EMAIL
}

export function createTransport() {
  const resendKey = process.env.RESEND_API_KEY

  if (resendKey) {
    return {
      async sendMail(message) {
        const payload = {
          from: message.from,
          to: Array.isArray(message.to) ? message.to : [message.to],
          subject: message.subject,
          html: message.html,
          text: message.text,
        }

        if (message.replyTo) payload.reply_to = message.replyTo

        const response = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        })

        const data = await response.json().catch(() => ({}))
        if (!response.ok) throw new Error(`RESEND_${response.status}`)
        return data
      },
    }
  }

  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS

  if (!user || !pass) {
    throw new Error("EMAIL_NOT_CONFIGURED")
  }

  const port = Number(process.env.SMTP_PORT || 465)
  const secure = process.env.SMTP_SECURE ? process.env.SMTP_SECURE === "true" : port === 465

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port,
    secure,
    auth: { user, pass },
  })
}

export function getFromAddress() {
  const from = process.env.EMAIL_FROM || process.env.SMTP_FROM || process.env.SMTP_USER
  if (!from) throw new Error("EMAIL_NOT_CONFIGURED")
  return from.includes("<") ? from : `"Mambo Market" <${from}>`
}

export function signToken(payload) {
  const secret = process.env.CONFIRMATION_SECRET
  if (!secret) throw new Error("CONFIRMATION_NOT_CONFIGURED")

  const body = Buffer.from(JSON.stringify(payload)).toString("base64url")
  const signature = crypto.createHmac("sha256", secret).update(body).digest("base64url")
  return `${body}.${signature}`
}

export function verifyToken(token) {
  const secret = process.env.CONFIRMATION_SECRET
  if (!secret || typeof token !== "string") return null

  const [body, signature] = token.split(".")
  if (!body || !signature) return null

  const expected = crypto.createHmac("sha256", secret).update(body).digest("base64url")
  const signatureBuffer = Buffer.from(signature)
  const expectedBuffer = Buffer.from(expected)

  if (signatureBuffer.length !== expectedBuffer.length) return null
  if (!crypto.timingSafeEqual(signatureBuffer, expectedBuffer)) return null

  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8"))
    if (!payload?.exp || payload.exp < Date.now()) return null
    return payload
  } catch {
    return null
  }
}

export function buildConfirmationUrl(token) {
  return `${getSiteUrl()}/?confirmar=${encodeURIComponent(token)}`
}

export function parseBody(req) {
  if (!req.body) return {}
  if (typeof req.body === "string") {
    try {
      return JSON.parse(req.body)
    } catch {
      return {}
    }
  }
  return req.body
}

function emailShell({ title, preheader, content }) {
  return `<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(title)}</title>
  </head>
  <body style="margin:0;padding:0;background:#f4f1ea;font-family:Arial,Helvetica,sans-serif;color:#111a23;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(preheader)}</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f1ea;padding:28px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border:1px solid #e4e1da;border-radius:14px;overflow:hidden;">
            <tr>
              <td style="background:#0e1a26;padding:18px 26px;">
                <span style="font-size:14px;font-weight:bold;letter-spacing:1px;color:#ffffff;">MAMBO MARKET</span>
                <span style="float:right;font-size:10px;letter-spacing:1px;color:#e8632c;">INVESTIGACIÓN &amp; ESTRATEGIA</span>
              </td>
            </tr>
            <tr><td style="height:4px;background:#e8632c;line-height:4px;">&nbsp;</td></tr>
            <tr><td style="padding:30px 26px;">${content}</td></tr>
            <tr>
              <td style="padding:16px 26px;background:#f7f7f4;border-top:1px solid #ece9e2;font-size:11px;line-height:1.6;color:#7b838c;">
                Mambo Market · España 1674, San Miguel de Tucumán · ${escapeHtml(getContactEmail())}
                <br />
                <a href="${escapeHtml(getSiteUrl())}/privacidad" style="color:#7b838c;text-decoration:underline;">Política de privacidad</a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`
}

function emailButton(url, label) {
  return `<a href="${escapeHtml(url)}" style="display:inline-block;margin-top:8px;padding:13px 22px;border-radius:8px;background:#e8632c;color:#0e1a26;font-size:14px;font-weight:bold;text-decoration:none;">${escapeHtml(label)}</a>`
}

function detailsTable(rows) {
  const cells = rows
    .map(
      ([label, value]) => `<tr>
        <td style="padding:8px 0;border-bottom:1px solid #ece9e2;font-size:12px;color:#7b838c;width:120px;vertical-align:top;">${escapeHtml(label)}</td>
        <td style="padding:8px 0;border-bottom:1px solid #ece9e2;font-size:14px;line-height:1.5;color:#111a23;font-weight:600;">${escapeHtml(value || "—")}</td>
      </tr>`,
    )
    .join("")

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:18px 0;border-collapse:collapse;">${cells}</table>`
}

export function buildAdminEmail(form, confirmUrl) {
  const rows = [
    ["Cliente", form.nombre],
    ["Empresa", form.empresa],
    ["Email", form.email],
    ["Teléfono", form.telefono],
    ["Servicio", form.tipoServicio],
    ["Fecha", formatDateLong(form.fechaPreferida)],
    ["Horario (Argentina)", formatTime(form.horaPreferida)],
    ["Presupuesto", form.presupuesto || "A definir"],
    ["Urgencia", form.urgencia || "A definir"],
    ["Mensaje", form.mensaje],
  ]

  const html = emailShell({
    title: "Nueva solicitud de reunión",
    preheader: `${form.nombre} solicitó una reunión para ${formatDateLong(form.fechaPreferida)}.`,
    content: `
      <p style="margin:0 0 6px;font-size:11px;font-weight:bold;letter-spacing:1px;text-transform:uppercase;color:#b8430f;">Nueva solicitud</p>
      <h1 style="margin:0;font-size:24px;line-height:1.2;color:#0e1a26;">Revisá y confirmá la reunión</h1>
      <p style="margin:12px 0 0;font-size:14px;line-height:1.6;color:#5d6670;">
        ${escapeHtml(form.nombre)} envió una solicitud de reunión desde la web de Mambo Market.
      </p>
      ${detailsTable(rows)}
      ${emailButton(confirmUrl, "Confirmar reunión")}
      <p style="margin:14px 0 0;font-size:12px;line-height:1.6;color:#7b838c;">
        Al confirmar, se enviará un email de confirmación a ${escapeHtml(form.email)}.
        Si el botón no funciona, copiá este enlace: ${escapeHtml(confirmUrl)}
      </p>
    `,
  })

  const text = [
    "NUEVA SOLICITUD DE REUNIÓN — MAMBO MARKET",
    "",
    `Cliente: ${form.nombre}`,
    `Empresa: ${form.empresa}`,
    `Email: ${form.email}`,
    `Teléfono: ${form.telefono}`,
    `Servicio: ${form.tipoServicio}`,
    `Fecha: ${formatDateLong(form.fechaPreferida)}`,
    `Horario (Argentina): ${formatTime(form.horaPreferida)}`,
    `Presupuesto: ${form.presupuesto || "A definir"}`,
    `Urgencia: ${form.urgencia || "A definir"}`,
    "",
    "Mensaje:",
    form.mensaje,
    "",
    "Confirmá la reunión desde este enlace:",
    confirmUrl,
  ].join("\n")

  return {
    subject: `Nueva solicitud de reunión — ${form.nombre}`,
    html,
    text,
  }
}

export function buildPendingEmail(form) {
  const rows = [
    ["Fecha", formatDateLong(form.fechaPreferida)],
    ["Horario (Argentina)", formatTime(form.horaPreferida)],
    ["Servicio", form.tipoServicio],
  ]

  const html = emailShell({
    title: "Recibimos tu solicitud",
    preheader: "Tu solicitud de reunión quedó pendiente de confirmación.",
    content: `
      <p style="margin:0 0 6px;font-size:11px;font-weight:bold;letter-spacing:1px;text-transform:uppercase;color:#b8430f;">Solicitud recibida</p>
      <h1 style="margin:0;font-size:24px;line-height:1.2;color:#0e1a26;">Hola, ${escapeHtml(form.nombre)}</h1>
      <p style="margin:12px 0 0;font-size:14px;line-height:1.6;color:#5d6670;">
        Recibimos tu solicitud de reunión con Mambo Market. El equipo va a revisar la disponibilidad y vas a recibir
        un email de confirmación.
      </p>
      ${detailsTable(rows)}
      <p style="margin:0;padding:12px 14px;border-radius:8px;background:#fdf0e8;font-size:13px;line-height:1.6;color:#b8430f;">
        <strong>Estado: pendiente de confirmación.</strong> Todavía no está reservado el horario.
      </p>
      <p style="margin:16px 0 0;font-size:13px;line-height:1.6;color:#5d6670;">
        Si necesitás cambiar algún dato, respondé este email o escribinos a ${escapeHtml(getContactEmail())}.
      </p>
    `,
  })

  const text = [
    `Hola, ${form.nombre}:`,
    "",
    "Recibimos tu solicitud de reunión con Mambo Market.",
    `Fecha: ${formatDateLong(form.fechaPreferida)}`,
    `Horario (Argentina): ${formatTime(form.horaPreferida)}`,
    `Servicio: ${form.tipoServicio}`,
    "",
    "Estado: PENDIENTE DE CONFIRMACIÓN.",
    "El equipo va a revisar la disponibilidad y vas a recibir un email de confirmación.",
    "",
    `Si necesitás cambiar algún dato, respondé este email o escribinos a ${getContactEmail()}.`,
  ].join("\n")

  return {
    subject: "Recibimos tu solicitud — Mambo Market",
    html,
    text,
  }
}

export function buildConfirmedEmail(meeting) {
  const rows = [
    ["Fecha", formatDateLong(meeting.fecha)],
    ["Horario (Argentina)", formatTime(meeting.hora)],
    ["Servicio", meeting.servicio],
  ]

  const html = emailShell({
    title: "Reunión confirmada",
    preheader: `Tu reunión con Mambo Market quedó confirmada para ${formatDateLong(meeting.fecha)}.`,
    content: `
      <p style="margin:0 0 6px;font-size:11px;font-weight:bold;letter-spacing:1px;text-transform:uppercase;color:#b8430f;">Reunión confirmada</p>
      <h1 style="margin:0;font-size:24px;line-height:1.2;color:#0e1a26;">Hola, ${escapeHtml(meeting.nombre)}</h1>
      <p style="margin:12px 0 0;font-size:14px;line-height:1.6;color:#5d6670;">
        Tu reunión con Mambo Market quedó confirmada. Estos son los datos:
      </p>
      ${detailsTable(rows)}
      <p style="margin:0;padding:12px 14px;border-radius:8px;background:#edf7f1;font-size:13px;line-height:1.6;color:#1f6b46;">
        <strong>Estado: confirmada.</strong> Te esperamos en el horario acordado.
      </p>
      <p style="margin:16px 0 0;font-size:13px;line-height:1.6;color:#5d6670;">
        Si necesitás reprogramar, respondé este email o escribinos a ${escapeHtml(getContactEmail())}.
      </p>
    `,
  })

  const text = [
    `Hola, ${meeting.nombre}:`,
    "",
    "Tu reunión con Mambo Market quedó confirmada.",
    `Fecha: ${formatDateLong(meeting.fecha)}`,
    `Horario (Argentina): ${formatTime(meeting.hora)}`,
    `Servicio: ${meeting.servicio}`,
    "",
    "Estado: CONFIRMADA.",
    `Si necesitás reprogramar, respondé este email o escribinos a ${getContactEmail()}.`,
  ].join("\n")

  return {
    subject: "Tu reunión está confirmada — Mambo Market",
    html,
    text,
  }
}

export function sanitizeLine(value, maxLength = 200) {
  return String(value ?? "")
    .replace(/[\r\n\t]+/g, " ")
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .trim()
    .slice(0, maxLength)
}

export function sanitizeMultiline(value, maxLength = 4000) {
  return String(value ?? "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "")
    .trim()
    .slice(0, maxLength)
}

export function buildCancelledEmail(record, reason = "") {
  const rows = [
    ["Fecha", formatDateLong(record.date)],
    ["Horario (Argentina)", formatTime(record.time)],
    ["Servicio", record.service],
  ]

  const safeReason = sanitizeMultiline(reason, 500)

  const html = emailShell({
    title: "Solicitud cancelada",
    preheader: "La reunión con Mambo Market fue cancelada.",
    content: `
      <p style="margin:0 0 6px;font-size:11px;font-weight:bold;letter-spacing:1px;text-transform:uppercase;color:#b8430f;">Reunión cancelada</p>
      <h1 style="margin:0;font-size:24px;line-height:1.2;color:#0e1a26;">Hola, ${escapeHtml(record.name)}</h1>
      <p style="margin:12px 0 0;font-size:14px;line-height:1.6;color:#5d6670;">
        Te escribimos para avisarte que la reunión que teníamos agendada fue cancelada.
      </p>
      ${detailsTable(rows)}
      ${
        safeReason
          ? `<p style="margin:0 0 16px;padding:12px 14px;border-radius:8px;background:#fdf0e8;font-size:13px;line-height:1.6;color:#b8430f;">${escapeHtml(safeReason).replace(/\n/g, "<br />")}</p>`
          : ""
      }
      <p style="margin:16px 0 0;font-size:13px;line-height:1.6;color:#5d6670;">
        Si querés coordinar un nuevo horario, respondé este email o escribinos a ${escapeHtml(getContactEmail())}.
      </p>
    `,
  })

  const text = [
    `Hola, ${record.name}:`,
    "",
    "La reunión con Mambo Market fue cancelada.",
    `Fecha: ${formatDateLong(record.date)}`,
    `Horario (Argentina): ${formatTime(record.time)}`,
    `Servicio: ${record.service}`,
    safeReason ? `\nMotivo: ${safeReason}` : "",
    "",
    `Si querés coordinar un nuevo horario, respondé este email o escribinos a ${getContactEmail()}.`,
  ]
    .filter(Boolean)
    .join("\n")

  return {
    subject: "Reunión cancelada — Mambo Market",
    html,
    text,
  }
}

export function buildReplyEmail(record, subject, message) {
  const safeSubject = sanitizeLine(subject, 160) || "Respuesta de Mambo Market"
  const safeMessage = sanitizeMultiline(message, 5000)
  const htmlMessage = escapeHtml(safeMessage).replace(/\n/g, "<br />")
  const rows = [
    ["Fecha de la reunión", formatDateLong(record.date)],
    ["Horario (Argentina)", formatTime(record.time)],
    ["Servicio", record.service],
  ]

  const html = emailShell({
    title: safeSubject,
    preheader: "Mensaje del equipo de Mambo Market.",
    content: `
      <p style="margin:0 0 6px;font-size:11px;font-weight:bold;letter-spacing:1px;text-transform:uppercase;color:#b8430f;">Mensaje del equipo</p>
      <h1 style="margin:0;font-size:24px;line-height:1.2;color:#0e1a26;">Hola, ${escapeHtml(record.name)}</h1>
      <div style="margin:18px 0;padding:16px 18px;border-left:3px solid #e8632c;background:#f7f7f4;font-size:14px;line-height:1.7;color:#111a23;">
        ${htmlMessage}
      </div>
      ${detailsTable(rows)}
      <p style="margin:16px 0 0;font-size:13px;line-height:1.6;color:#5d6670;">
        Podés responder este email o escribirnos a ${escapeHtml(getContactEmail())}.
      </p>
    `,
  })

  return {
    subject: `${safeSubject} — Mambo Market`,
    html,
    text: [
      `Hola, ${record.name}:`,
      "",
      safeMessage,
      "",
      `Fecha de la reunión: ${formatDateLong(record.date)}`,
      `Horario (Argentina): ${formatTime(record.time)}`,
      `Servicio: ${record.service}`,
      "",
      `Respondé este email o escribinos a ${getContactEmail()}.`,
    ].join("\n"),
  }
}

export function buildUpdatedEmail(record) {
  const confirmed = record.status === "confirmed"
  const rows = [
    ["Fecha", formatDateLong(record.date)],
    ["Horario (Argentina)", formatTime(record.time)],
    ["Servicio", record.service],
    ["Estado", confirmed ? "Confirmada" : "Pendiente de confirmación"],
  ]

  const html = emailShell({
    title: confirmed ? "Reunión actualizada" : "Solicitud actualizada",
    preheader: "Actualizamos los datos de tu reunión con Mambo Market.",
    content: `
      <p style="margin:0 0 6px;font-size:11px;font-weight:bold;letter-spacing:1px;text-transform:uppercase;color:#b8430f;">Datos actualizados</p>
      <h1 style="margin:0;font-size:24px;line-height:1.2;color:#0e1a26;">Hola, ${escapeHtml(record.name)}</h1>
      <p style="margin:12px 0 0;font-size:14px;line-height:1.6;color:#5d6670;">
        Actualizamos los datos de tu solicitud de reunión con Mambo Market. Estos son los datos vigentes:
      </p>
      ${detailsTable(rows)}
      <p style="margin:16px 0 0;font-size:13px;line-height:1.6;color:#5d6670;">
        Si necesitás cambiar algo, respondé este email o escribinos a ${escapeHtml(getContactEmail())}.
      </p>
    `,
  })

  return {
    subject: confirmed ? "Reunión actualizada — Mambo Market" : "Solicitud actualizada — Mambo Market",
    html,
    text: [
      `Hola, ${record.name}:`,
      "",
      "Actualizamos los datos de tu solicitud de reunión con Mambo Market.",
      `Fecha: ${formatDateLong(record.date)}`,
      `Horario (Argentina): ${formatTime(record.time)}`,
      `Servicio: ${record.service}`,
      `Estado: ${confirmed ? "Confirmada" : "Pendiente de confirmación"}`,
      "",
      `Si necesitás cambiar algo, respondé este email o escribinos a ${getContactEmail()}.`,
    ].join("\n"),
  }
}

export function buildOtpEmail(code) {
  const html = emailShell({
    title: "Código de acceso",
    preheader: "Tu código de acceso al panel de Mambo Market.",
    content: `
      <p style="margin:0 0 6px;font-size:11px;font-weight:bold;letter-spacing:1px;text-transform:uppercase;color:#b8430f;">Acceso al panel</p>
      <h1 style="margin:0;font-size:24px;line-height:1.2;color:#0e1a26;">Tu código de seguridad</h1>
      <p style="margin:12px 0 18px;font-size:14px;line-height:1.6;color:#5d6670;">
        Usá este código para completar el ingreso al panel de administración de Mambo Market.
      </p>
      <p style="margin:0;padding:18px;border-radius:10px;background:#0e1a26;color:#ffffff;font-family:'Courier New',monospace;font-size:34px;font-weight:bold;letter-spacing:8px;text-align:center;">
        ${escapeHtml(code)}
      </p>
      <p style="margin:16px 0 0;font-size:13px;line-height:1.6;color:#5d6670;">
        El código vence en 10 minutos y solo se puede usar una vez. Si no fuiste vos, cambiá la contraseña del panel.
      </p>
    `,
  })

  return {
    subject: "Código de acceso — Panel Mambo Market",
    html,
    text: [
      "CÓDIGO DE ACCESO — PANEL MAMBO MARKET",
      "",
      `Código: ${code}`,
      "",
      "Vence en 10 minutos y solo se puede usar una vez.",
      "Si no fuiste vos, cambiá la contraseña del panel.",
    ].join("\n"),
  }
}

export function meetingTimestampART(date, time) {
  if (!date || !time) return null
  const [year, month, day] = String(date).split("-").map(Number)
  const [hours, minutes] = String(time).split(":").map(Number)
  if (
    !Number.isFinite(year) ||
    !Number.isFinite(month) ||
    !Number.isFinite(day) ||
    !Number.isFinite(hours) ||
    !Number.isFinite(minutes)
  ) {
    return null
  }
  return Date.UTC(year, month - 1, day, hours + 3, minutes, 0, 0)
}

export function buildReminderEmail(record) {
  const rows = [
    ["Fecha", formatDateLong(record.date)],
    ["Horario (Argentina)", formatTime(record.time)],
    ["Servicio", record.service],
  ]

  const html = emailShell({
    title: "Recordatorio de reunión",
    preheader: `Tu reunión con Mambo Market es el ${formatDateLong(record.date)}.`,
    content: `
      <p style="margin:0 0 6px;font-size:11px;font-weight:bold;letter-spacing:1px;text-transform:uppercase;color:#b8430f;">Recordatorio</p>
      <h1 style="margin:0;font-size:24px;line-height:1.2;color:#0e1a26;">Hola, ${escapeHtml(record.name)}</h1>
      <p style="margin:12px 0 0;font-size:14px;line-height:1.6;color:#5d6670;">
        Te recordamos que tenés una reunión confirmada con Mambo Market.
      </p>
      ${detailsTable(rows)}
      <p style="margin:16px 0 0;font-size:13px;line-height:1.6;color:#5d6670;">
        Si necesitás reprogramar, respondé este email o escribinos a ${escapeHtml(getContactEmail())}.
      </p>
    `,
  })

  return {
    subject: "Recordatorio: tu reunión con Mambo Market",
    html,
    text: [
      `Hola, ${record.name}:`,
      "",
      "Te recordamos que tenés una reunión confirmada con Mambo Market.",
      `Fecha: ${formatDateLong(record.date)}`,
      `Horario (Argentina): ${formatTime(record.time)}`,
      `Servicio: ${record.service}`,
      "",
      `Si necesitás reprogramar, respondé este email o escribinos a ${getContactEmail()}.`,
    ].join("\n"),
  }
}
