import crypto from "node:crypto"
import { requireAdmin } from "../_auth.js"
import {
  buildCancelledEmail,
  buildConfirmedEmail,
  buildMeetingLinks,
  buildReminderEmail,
  buildReplyEmail,
  buildUpdatedEmail,
  createTransport,
  getContactEmail,
  getFromAddress,
  isValidEmail,
  parseBody,
  sanitizeLine,
  sanitizeMultiline,
} from "../_utils.js"
import { deleteRequest, getRequest, storageAvailable, updateRequest } from "../_storage.js"
import { getClientIp, rateLimit, sendRateLimitResponse } from "../_security.js"

const UUID_PATTERN = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/

function addHistory(record, type, detail = "") {
  const entry = {
    id: crypto.randomUUID(),
    type,
    at: Date.now(),
    by: "Admin",
    ...(detail ? { detail } : {}),
  }
  return [...(Array.isArray(record.history) ? record.history : []), entry].slice(-60)
}

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
  const limit = await rateLimit({ key: `admin-action:${ip}:${session.sub}`, limit: 80, windowSeconds: 60 })
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
    if (action === "confirm") {
      if (record.status === "confirmed") {
        return res.status(409).json({ error: "ALREADY_CONFIRMED", message: "La reunión ya está confirmada." })
      }

      const links = buildMeetingLinks(record)
      const email = buildConfirmedEmail(
        {
          nombre: record.name,
          fecha: record.date,
          hora: record.time,
          servicio: record.service,
        },
        links,
      )

      const transport = createTransport()
      await transport.sendMail({
        from: getFromAddress(),
        to: record.email,
        replyTo: getContactEmail(),
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
        updatedAt: Date.now(),
        history: addHistory(current, "confirmed", "Reunión confirmada y cliente notificado."),
      }))

      return res.status(200).json({ ok: true, request: updated })
    }

    if (action === "cancel") {
      if (record.status === "cancelled") {
        return res.status(409).json({ error: "ALREADY_CANCELLED", message: "La solicitud ya está cancelada." })
      }

      const reason = sanitizeMultiline(body.reason, 500)
      const email = buildCancelledEmail(record, reason)

      const transport = createTransport()
      await transport.sendMail({
        from: getFromAddress(),
        to: record.email,
        replyTo: getContactEmail(),
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
        updatedAt: Date.now(),
        history: addHistory(current, "cancelled", reason || "Reunión cancelada y cliente notificado."),
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

      const transport = createTransport()
      await transport.sendMail({
        from: getFromAddress(),
        to: record.email,
        replyTo: getContactEmail(),
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
        updatedAt: Date.now(),
        history: addHistory(current, "replied", `Respuesta enviada: ${subject}`),
      }))

      return res.status(200).json({ ok: true, request: updated })
    }

    if (action === "remind") {
      if (record.status !== "confirmed") {
        return res.status(409).json({
          error: "NOT_CONFIRMED",
          message: "Confirmá la reunión antes de enviar un recordatorio.",
        })
      }

      const links = buildMeetingLinks(record)
      const email = buildReminderEmail(record, links)
      const transport = createTransport()
      await transport.sendMail({
        from: getFromAddress(),
        to: record.email,
        replyTo: getContactEmail(),
        subject: email.subject,
        text: email.text,
        html: email.html,
      })

      const updated = await updateRequest(id, (current) => ({
        ...current,
        reminderSentAt: Date.now(),
        updatedAt: Date.now(),
        history: addHistory(current, "reminder", "Recordatorio manual enviado."),
      }))

      return res.status(200).json({ ok: true, request: updated })
    }

    if (action === "note") {
      const text = sanitizeMultiline(body.text, 2000)
      if (!text) {
        return res.status(400).json({ error: "EMPTY_NOTE", message: "Escribí una nota antes de guardarla." })
      }

      const note = { id: crypto.randomUUID(), text, createdAt: Date.now(), by: "Admin" }
      const updated = await updateRequest(id, (current) => ({
        ...current,
        notes: [...(Array.isArray(current.notes) ? current.notes : []).slice(-49), note],
        updatedAt: Date.now(),
        history: addHistory(current, "note", text.slice(0, 140)),
      }))

      return res.status(200).json({ ok: true, request: updated })
    }

    if (action === "edit") {
      const fields = {
        name: sanitizeLine(body.name, 120),
        company: sanitizeLine(body.company, 160),
        email: sanitizeLine(body.email, 180).toLowerCase(),
        phone: sanitizeLine(body.phone, 60),
        service: sanitizeLine(body.service, 160),
        budget: sanitizeLine(body.budget, 120),
        urgency: sanitizeLine(body.urgency, 120),
        date: sanitizeLine(body.date, 10),
        time: sanitizeLine(body.time, 5),
        message: sanitizeMultiline(body.message, 4000),
      }

      const required = ["name", "company", "email", "phone", "service", "date", "time", "message"]
      if (required.some((field) => !fields[field])) {
        return res.status(400).json({ error: "INVALID_FORM", message: "Faltan datos obligatorios." })
      }

      if (!isValidEmail(fields.email)) {
        return res.status(400).json({ error: "INVALID_EMAIL", message: "El email ingresado no es válido." })
      }

      const parsedDate = new Date(`${fields.date}T12:00:00Z`)

      if (
        !DATE_PATTERN.test(fields.date) ||
        Number.isNaN(parsedDate.getTime()) ||
        !TIME_PATTERN.test(fields.time)
      ) {
        return res.status(400).json({
          error: "INVALID_DATE_TIME",
          message: "La fecha o el horario no son válidos.",
        })
      }

      const changed = Object.keys(fields).filter(
        (key) => String(record[key] ?? "") !== String(fields[key] ?? ""),
      )
      const notifyClient = Boolean(body.notifyClient)

      if (notifyClient && changed.length && record.status !== "cancelled") {
        const nextRecord = { ...record, ...fields }
        const links = buildMeetingLinks(nextRecord)
        const email = buildUpdatedEmail(nextRecord, links)
        const transport = createTransport()
        await transport.sendMail({
          from: getFromAddress(),
          to: fields.email,
          subject: email.subject,
          text: email.text,
          html: email.html,
        })
      }

      const updated = await updateRequest(id, (current) => {
        const scheduleChanged = current.date !== fields.date || current.time !== fields.time

        return {
          ...current,
          ...fields,
          reminderSentAt: scheduleChanged ? null : current.reminderSentAt,
          updatedAt: Date.now(),
          history: addHistory(
            current,
            "edited",
            changed.length ? `Campos actualizados: ${changed.join(", ")}` : "Sin cambios en los datos.",
          ),
        }
      })

      return res.status(200).json({ ok: true, request: updated })
    }

    if (action === "delete") {
      const notifyClient = Boolean(body.notifyClient)

      if (notifyClient && record.status !== "cancelled") {
        const email = buildCancelledEmail(record, sanitizeMultiline(body.reason, 500))
        const transport = createTransport()
        await transport.sendMail({
          from: getFromAddress(),
          to: record.email,
          replyTo: getContactEmail(),
          subject: email.subject,
          text: email.text,
          html: email.html,
        })
      }

      await deleteRequest(id)
      return res.status(200).json({ ok: true, deleted: true, id })
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
