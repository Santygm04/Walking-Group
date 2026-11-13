import { useEffect, useMemo, useRef, useState } from "react"
import Icon from "../components/Icon"
import { BUDGET_OPTIONS, CONTACT_EMAIL, SERVICE_OPTIONS, URGENCY_OPTIONS } from "../data/siteData"
import "./AdminPage.css"

const STATUS = {
  pending: { label: "Pendiente", className: "status--pending" },
  confirmed: { label: "Confirmada", className: "status--confirmed" },
  cancelled: { label: "Cancelada", className: "status--cancelled" },
}

const FILTERS = [
  { id: "all", label: "Todas" },
  { id: "pending", label: "Pendientes" },
  { id: "confirmed", label: "Confirmadas" },
  { id: "cancelled", label: "Canceladas" },
]

const SORT_OPTIONS = [
  { id: "newest", label: "Más recientes" },
  { id: "oldest", label: "Más antiguas" },
  { id: "meeting", label: "Reunión más próxima" },
  { id: "name", label: "Nombre A-Z" },
]

const HISTORY_LABELS = {
  created: "Solicitud recibida",
  confirmed: "Reunión confirmada",
  cancelled: "Reunión cancelada",
  replied: "Respuesta enviada",
  edited: "Solicitud editada",
  note: "Nota interna",
  reminder: "Recordatorio enviado",
  client_rescheduled: "Cliente reprogramó la reunión",
  client_cancelled: "Cliente canceló la reunión",
}

const PAGE_SIZE = 9

function api(path, options = {}) {
  return fetch(path, {
    credentials: "same-origin",
    ...options,
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(options.headers || {}),
    },
  }).then(async (response) => {
    const data = await response.json().catch(() => ({}))
    if (!response.ok) {
      const error = new Error(data.message || "Ocurrió un error inesperado.")
      error.status = response.status
      error.code = data.error
      throw error
    }
    return data
  })
}

function formatDate(value, style = "long") {
  if (!value) return "Sin fecha"
  const [year, month, day] = value.split("-").map(Number)
  const date = new Date(Date.UTC(year, month - 1, day, 12))
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat("es-AR", {
    weekday: style === "long" ? "long" : "short",
    day: "numeric",
    month: style === "long" ? "long" : "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(date)
}

function formatTime(value) {
  return value ? `${value} h` : "Sin horario"
}

function formatTimestamp(value) {
  if (!value) return "—"
  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value))
}

function initials(name) {
  return String(name || "?")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("")
}

function meetingTimestamp(request) {
  if (!request.date) return Number.MAX_SAFE_INTEGER
  const value = new Date(`${request.date}T${request.time || "00:00"}:00`).getTime()
  return Number.isNaN(value) ? Number.MAX_SAFE_INTEGER : value
}

function sortRequests(requests, sortBy) {
  const list = [...requests]
  if (sortBy === "oldest") return list.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0))
  if (sortBy === "meeting") return list.sort((a, b) => meetingTimestamp(a) - meetingTimestamp(b))
  if (sortBy === "name") return list.sort((a, b) => String(a.name || "").localeCompare(String(b.name || ""), "es"))
  return list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
}

function csvCell(value) {
  const text = String(value ?? "")
  const safe = /^[=+\-@\t\r]/.test(text) ? `'${text}` : text
  return `"${safe.replaceAll('"', '""')}"`
}

function exportRequestsCsv(requests) {
  const headers = [
    "Nombre",
    "Empresa",
    "Email",
    "Teléfono",
    "Servicio",
    "Fecha",
    "Horario",
    "Presupuesto",
    "Urgencia",
    "Estado",
    "Recibida",
    "Respuestas",
    "Notas",
    "Mensaje",
  ]

  const rows = requests.map((request) => [
    request.name,
    request.company,
    request.email,
    request.phone,
    request.service,
    request.date,
    request.time,
    request.budget,
    request.urgency,
    STATUS[request.status]?.label || "Pendiente",
    formatTimestamp(request.createdAt),
    request.replies?.length || 0,
    request.notes?.length || 0,
    request.message,
  ])

  const csv = [headers, ...rows].map((row) => row.map(csvCell).join(",")).join("\n")
  const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = `mambo-solicitudes-${new Date().toISOString().slice(0, 10)}.csv`
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}

function StatusBadge({ status }) {
  const meta = STATUS[status] || STATUS.pending
  return <span className={`status-badge ${meta.className}`}>{meta.label}</span>
}

function CopyButton({ value, label }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(String(value || ""))
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1600)
    } catch {
      setCopied(false)
    }
  }

  return (
    <button
      type="button"
      className="admin-icon-button"
      onClick={handleCopy}
      aria-label={`Copiar ${label}`}
      title={`Copiar ${label}`}
    >
      <Icon name={copied ? "check" : "copy"} size={14} />
    </button>
  )
}

function LoginView({ onLogin }) {
  const [step, setStep] = useState("credentials")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [challengeId, setChallengeId] = useState("")
  const [code, setCode] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (loading) return
    setError("")
    setLoading(true)

    try {
      if (step === "otp") {
        const data = await api("/api/admin/verify", {
          method: "POST",
          body: JSON.stringify({ challengeId, code }),
        })
        onLogin(data.email)
        return
      }

      const data = await api("/api/admin/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      })

      if (data.otpRequired) {
        setChallengeId(data.challengeId)
        setPassword("")
        setCode("")
        setStep("otp")
        return
      }

      onLogin(data.email)
    } catch (loginError) {
      setError(loginError.message)
    } finally {
      setLoading(false)
    }
  }

  const handleBack = () => {
    setStep("credentials")
    setChallengeId("")
    setCode("")
    setError("")
  }

  return (
    <div className="admin-login">
      <div className="admin-login__card">
        <div className="admin-brand">
          <span className="admin-brand__mark" aria-hidden="true">
            <svg viewBox="0 0 40 40" fill="none">
              <path d="M7.5 31.5V9l12.5 12.5L32.5 9v22.5" stroke="currentColor" strokeWidth="4" />
            </svg>
          </span>
          <span>
            <strong>Mambo Market</strong>
            <small>Panel de administración</small>
          </span>
        </div>

        {step === "credentials" ? (
          <>
            <h1>Ingresá al panel</h1>
            <p className="admin-login__lead">Acceso restringido al equipo de Mambo Market.</p>

            <form className="admin-login__form" onSubmit={handleSubmit}>
              <div className="admin-field">
                <label htmlFor="admin-email">Gmail</label>
                <input
                  id="admin-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="username"
                  placeholder="tu@gmail.com"
                  required
                />
              </div>

              <div className="admin-field">
                <label htmlFor="admin-password">Contraseña</label>
                <div className="admin-password">
                  <input
                    id="admin-password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    autoComplete="current-password"
                    placeholder="Tu contraseña"
                    required
                  />
                  <button
                    type="button"
                    className="admin-password__toggle"
                    onClick={() => setShowPassword((value) => !value)}
                    aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  >
                    <Icon name={showPassword ? "eye-off" : "eye"} size={18} />
                  </button>
                </div>
              </div>

              {error ? (
                <p className="admin-form-error" role="alert">
                  {error}
                </p>
              ) : null}

              <button type="submit" className="btn btn--accent btn--full" disabled={loading}>
                {loading ? "Verificando…" : "Ingresar"}
                <Icon name="arrow-right" size={17} />
              </button>
            </form>
          </>
        ) : (
          <>
            <h1>Verificá tu identidad</h1>
            <p className="admin-login__lead">
              Enviamos un código de 6 dígitos a <strong>{email}</strong>. Vence en 10 minutos.
            </p>

            <form className="admin-login__form" onSubmit={handleSubmit}>
              <div className="admin-field">
                <label htmlFor="admin-code">Código de seguridad</label>
                <input
                  id="admin-code"
                  className="admin-otp-input"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  value={code}
                  onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
                  autoComplete="one-time-code"
                  placeholder="000000"
                  autoFocus
                  required
                />
              </div>

              {error ? (
                <p className="admin-form-error" role="alert">
                  {error}
                </p>
              ) : null}

              <button type="submit" className="btn btn--accent btn--full" disabled={loading || code.length !== 6}>
                {loading ? "Verificando…" : "Verificar código"}
                <Icon name="check" size={17} />
              </button>

              <button type="button" className="admin-button" onClick={handleBack} disabled={loading}>
                Volver e ingresar de nuevo
              </button>
            </form>
          </>
        )}

        <p className="admin-login__note">
          {step === "otp"
            ? "Si no recibís el código, revisá Spam o volvé para solicitar uno nuevo."
            : "Sesión segura de 8 horas. El acceso se confirma con un código enviado a tu Gmail."}
        </p>
        <a className="admin-login__back" href="/">
          Volver al sitio
        </a>
      </div>
    </div>
  )
}

function ReplyForm({ request, onSend, sending }) {
  const [subject, setSubject] = useState(`Re: tu solicitud — Mambo Market`)
  const [message, setMessage] = useState("")

  const handleSubmit = (event) => {
    event.preventDefault()
    if (!message.trim() || sending) return
    onSend({ subject, message })
  }

  return (
    <form className="admin-reply" onSubmit={handleSubmit}>
      <div className="admin-field">
        <label htmlFor={`reply-subject-${request.id}`}>Asunto</label>
        <input
          id={`reply-subject-${request.id}`}
          type="text"
          value={subject}
          onChange={(event) => setSubject(event.target.value)}
          maxLength={160}
          required
        />
      </div>
      <div className="admin-field">
        <label htmlFor={`reply-message-${request.id}`}>Mensaje para {request.name}</label>
        <textarea
          id={`reply-message-${request.id}`}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="Escribí tu respuesta…"
          maxLength={5000}
          autoFocus
          required
        />
      </div>
      <button type="submit" className="btn btn--accent" disabled={sending || !message.trim()}>
        {sending ? "Enviando…" : "Enviar respuesta"}
        <Icon name="mail" size={16} />
      </button>
    </form>
  )
}

function optionsWithCurrent(options, current) {
  if (!current || options.includes(current)) return options
  return [current, ...options]
}

function EditForm({ request, onSave, saving }) {
  const [fields, setFields] = useState({
    name: request.name || "",
    company: request.company || "",
    email: request.email || "",
    phone: request.phone || "",
    service: request.service || "",
    budget: request.budget || "",
    urgency: request.urgency || "",
    date: request.date || "",
    time: request.time || "",
    message: request.message || "",
  })
  const [notifyClient, setNotifyClient] = useState(true)

  const serviceOptions = optionsWithCurrent(SERVICE_OPTIONS, fields.service)
  const budgetOptions = optionsWithCurrent(BUDGET_OPTIONS, fields.budget)
  const urgencyOptions = optionsWithCurrent(URGENCY_OPTIONS, fields.urgency)

  const handleChange = (event) => {
    const { name, value } = event.target
    setFields((previous) => ({ ...previous, [name]: value }))
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    if (saving) return
    onSave({ ...fields, notifyClient })
  }

  return (
    <form className="admin-edit" onSubmit={handleSubmit}>
      <div className="admin-edit__grid">
        <div className="admin-field">
          <label htmlFor={`edit-name-${request.id}`}>Nombre</label>
          <input id={`edit-name-${request.id}`} name="name" value={fields.name} onChange={handleChange} maxLength={120} required />
        </div>
        <div className="admin-field">
          <label htmlFor={`edit-company-${request.id}`}>Empresa</label>
          <input id={`edit-company-${request.id}`} name="company" value={fields.company} onChange={handleChange} maxLength={160} required />
        </div>
        <div className="admin-field">
          <label htmlFor={`edit-email-${request.id}`}>Email</label>
          <input id={`edit-email-${request.id}`} name="email" type="email" value={fields.email} onChange={handleChange} maxLength={180} required />
        </div>
        <div className="admin-field">
          <label htmlFor={`edit-phone-${request.id}`}>Teléfono</label>
          <input id={`edit-phone-${request.id}`} name="phone" type="tel" value={fields.phone} onChange={handleChange} maxLength={60} required />
        </div>
        <div className="admin-field">
          <label htmlFor={`edit-service-${request.id}`}>Servicio</label>
          <select id={`edit-service-${request.id}`} name="service" value={fields.service} onChange={handleChange} required>
            <option value="">Seleccionar servicio…</option>
            {serviceOptions.map((option) => (
              <option value={option} key={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
        <div className="admin-field">
          <label htmlFor={`edit-budget-${request.id}`}>Presupuesto</label>
          <select id={`edit-budget-${request.id}`} name="budget" value={fields.budget} onChange={handleChange}>
            <option value="">Sin definir</option>
            {budgetOptions.map((option) => (
              <option value={option} key={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
        <div className="admin-field">
          <label htmlFor={`edit-date-${request.id}`}>Fecha</label>
          <input id={`edit-date-${request.id}`} name="date" type="date" value={fields.date} onChange={handleChange} required />
        </div>
        <div className="admin-field">
                      <label htmlFor={`edit-time-${request.id}`}>Horario (Argentina)</label>
                      <input id={`edit-time-${request.id}`} name="time" type="time" value={fields.time} onChange={handleChange} required />
                      <small className="admin-field__hint">Hora de Argentina (GMT-3).</small>
        </div>
        <div className="admin-field">
          <label htmlFor={`edit-urgency-${request.id}`}>Urgencia</label>
          <select id={`edit-urgency-${request.id}`} name="urgency" value={fields.urgency} onChange={handleChange}>
            <option value="">Sin definir</option>
            {urgencyOptions.map((option) => (
              <option value={option} key={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="admin-field">
        <label htmlFor={`edit-message-${request.id}`}>Mensaje del cliente</label>
        <textarea
          id={`edit-message-${request.id}`}
          name="message"
          value={fields.message}
          onChange={handleChange}
          maxLength={4000}
          required
        />
      </div>

      <label className="admin-checkbox">
        <input type="checkbox" checked={notifyClient} onChange={(event) => setNotifyClient(event.target.checked)} />
        <span>Notificar al cliente por email si cambian los datos</span>
      </label>

      <button type="submit" className="btn btn--accent" disabled={saving}>
        {saving ? "Guardando…" : "Guardar cambios"}
        <Icon name="check" size={16} />
      </button>
    </form>
  )
}

function NotesPanel({ request, onAdd, saving }) {
  const [text, setText] = useState("")
  const notes = Array.isArray(request.notes) ? request.notes : []

  const handleSubmit = (event) => {
    event.preventDefault()
    if (!text.trim() || saving) return
    onAdd({ text })
    setText("")
  }

  return (
    <div className="admin-notes">
      <form className="admin-note-form" onSubmit={handleSubmit}>
        <div className="admin-field">
          <label htmlFor={`note-${request.id}`}>Nueva nota interna</label>
          <textarea
            id={`note-${request.id}`}
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder="Agregá contexto, próximos pasos o información interna…"
            maxLength={2000}
          />
        </div>
        <button type="submit" className="btn btn--ghost" disabled={saving || !text.trim()}>
          Guardar nota
          <Icon name="note" size={16} />
        </button>
      </form>

      {notes.length ? (
        <div className="admin-note-list">
          {notes.slice().reverse().map((note) => (
            <article key={note.id} className="admin-note">
              <p>{note.text}</p>
              <span>
                {note.by || "Admin"} · {formatTimestamp(note.createdAt)}
              </span>
            </article>
          ))}
        </div>
      ) : (
        <p className="admin-tab-empty">Todavía no hay notas internas para esta solicitud.</p>
      )}
    </div>
  )
}

function HistoryPanel({ request }) {
  const history = Array.isArray(request.history) && request.history.length
    ? request.history
    : [{ id: "created", type: "created", at: request.createdAt, by: "Sistema" }]

  return (
    <ol className="admin-history-list">
      {history.slice().reverse().map((event) => (
        <li key={event.id}>
          <span className={`admin-history-dot admin-history-dot--${event.type}`} aria-hidden="true" />
          <div>
            <strong>{HISTORY_LABELS[event.type] || "Actividad"}</strong>
            <p>{event.detail || event.by || "Sistema"}</p>
            <small>{formatTimestamp(event.at)}</small>
          </div>
        </li>
      ))}
    </ol>
  )
}

function DetailDialog({ request, initialMode, onClose, onAction, actionState }) {
  const dialogRef = useRef(null)
  const [tab, setTab] = useState("detail")
  const [confirmCancel, setConfirmCancel] = useState(false)
  const [replyOpen, setReplyOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteNotify, setDeleteNotify] = useState(false)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (request && !dialog.open) {
      dialog.showModal()
      dialog.querySelector(".admin-dialog__close")?.focus()
    }
    if (!request && dialog.open) dialog.close()
  }, [request])

  useEffect(() => {
    document.body.classList.toggle("admin-dialog-open", Boolean(request))
    return () => document.body.classList.remove("admin-dialog-open")
  }, [request])

  useEffect(() => {
    if (initialMode === "edit") setTab("edit")
    else if (initialMode === "notes") setTab("notes")
    else if (initialMode === "history") setTab("history")
    else setTab("detail")

    setConfirmCancel(false)
    setReplyOpen(initialMode === "reply")
    setDeleteOpen(initialMode === "delete")
    setDeleteNotify(false)
  }, [request?.id, initialMode])

  if (!request) {
    return (
      <dialog ref={dialogRef} className="admin-dialog" onClose={onClose} onCancel={onClose}>
        <span />
      </dialog>
    )
  }

  const status = request.status || "pending"
  const replies = Array.isArray(request.replies) ? request.replies : []
  const notes = Array.isArray(request.notes) ? request.notes : []
  const history = Array.isArray(request.history) ? request.history : []

  const historyEntries = history.length
    ? history
    : [{ id: "created", type: "created", at: request.createdAt, by: "Sistema" }]

  const tabs = [
    { id: "detail", label: "Detalle" },
    { id: "edit", label: "Editar" },
    { id: "notes", label: `Notas (${notes.length})` },
    { id: "history", label: `Historial (${historyEntries.length})` },
  ]

  return (
    <dialog
      ref={dialogRef}
      className="admin-dialog"
      onClose={onClose}
      onCancel={(event) => {
        event.preventDefault()
        onClose()
      }}
      onClick={(event) => {
        if (event.target === dialogRef.current) onClose()
      }}
      aria-labelledby="admin-detail-title"
    >
      <div className="admin-dialog__panel">
        <header className="admin-dialog__head">
          <div>
            <StatusBadge status={status} />
            <h2 id="admin-detail-title">{request.name}</h2>
            <p>{request.company}</p>
          </div>
          <button type="button" className="admin-dialog__close" onClick={onClose} aria-label="Cerrar detalle">
            <Icon name="x" size={18} />
          </button>
        </header>

        <div className="admin-dialog__tabs" role="tablist" aria-label="Detalle de la solicitud">
          {tabs.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={tab === item.id}
              className={tab === item.id ? "is-active" : ""}
              onClick={() => setTab(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="admin-dialog__body">
          {actionState.error ? (
            <p className="admin-form-error" role="alert">
              {actionState.error}
            </p>
          ) : null}
          {actionState.success ? (
            <p className="admin-form-success" role="status">
              {actionState.success}
            </p>
          ) : null}

          {tab === "detail" ? (
            <>
              <div className="admin-detail-contact">
                <a href={`mailto:${request.email}`}>
                  <Icon name="mail" size={15} />
                  {request.email}
                </a>
                <a href={`tel:${request.phone}`}>
                  <Icon name="phone" size={15} />
                  {request.phone}
                </a>
                <a href={`https://wa.me/${String(request.phone || "").replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer">
                  <Icon name="whatsapp" size={15} />
                  WhatsApp
                </a>
                <CopyButton value={request.email} label="email" />
                <CopyButton value={request.phone} label="teléfono" />
              </div>

              <div className="admin-detail-grid">
                <div>
                  <span>Fecha de reunión</span>
                  <strong>{formatDate(request.date)}</strong>
                </div>
                <div>
                  <span>Horario (Argentina)</span>
                  <strong>{formatTime(request.time)}</strong>
                </div>
                <div>
                  <span>Servicio</span>
                  <strong>{request.service}</strong>
                </div>
                <div>
                  <span>Presupuesto</span>
                  <strong>{request.budget || "A definir"}</strong>
                </div>
                <div>
                  <span>Urgencia</span>
                  <strong>{request.urgency || "A definir"}</strong>
                </div>
                <div>
                  <span>Solicitud recibida</span>
                  <strong>{formatTimestamp(request.createdAt)}</strong>
                </div>
              </div>

              <div className="admin-message">
                <span>Mensaje del cliente</span>
                <p>{request.message}</p>
              </div>

              <div className="admin-detail-meta">
                <span>
                  <Icon name="mail" size={13} /> {replies.length} respuestas enviadas
                </span>
                <span>
                  <Icon name="note" size={13} /> {notes.length} notas internas
                </span>
                {request.confirmedAt ? <span className="is-ok">Confirmada {formatTimestamp(request.confirmedAt)}</span> : null}
                {request.cancelledAt ? <span className="is-danger">Cancelada {formatTimestamp(request.cancelledAt)}</span> : null}
                {request.reminderSentAt ? <span>Recordatorio {formatTimestamp(request.reminderSentAt)}</span> : null}
              </div>

              {replies.length ? (
                <div className="admin-replies">
                  <h3>Últimas respuestas</h3>
                  {replies.slice(-3).reverse().map((reply) => (
                    <div key={reply.id}>
                      <strong>{reply.subject}</strong>
                      <span>{formatTimestamp(reply.sentAt)}</span>
                      <p>{reply.message}</p>
                    </div>
                  ))}
                </div>
              ) : null}

              {replyOpen ? <ReplyForm request={request} sending={actionState.loading} onSend={(payload) => onAction("reply", payload)} /> : null}

              {confirmCancel ? (
                <div className="admin-cancel-confirm" role="alert">
                  <p>¿Cancelar esta reunión? Se enviará un email al cliente.</p>
                  <div>
                    <button
                      type="button"
                      className="admin-button admin-button--danger"
                      onClick={() => onAction("cancel")}
                      disabled={actionState.loading}
                    >
                      Sí, cancelar
                    </button>
                    <button type="button" className="admin-button" onClick={() => setConfirmCancel(false)}>
                      Volver
                    </button>
                  </div>
                </div>
              ) : null}

              {deleteOpen ? (
                <div className="admin-delete-panel" role="alertdialog" aria-label="Eliminar solicitud">
                  <h3>Eliminar solicitud</h3>
                  <p>Esta acción borra la solicitud del panel y no se puede deshacer.</p>
                  <label className="admin-checkbox">
                    <input type="checkbox" checked={deleteNotify} onChange={(event) => setDeleteNotify(event.target.checked)} />
                    <span>Avisar al cliente por email antes de eliminar</span>
                  </label>
                  <div className="admin-delete-panel__actions">
                    <button
                      type="button"
                      className="admin-button admin-button--danger"
                      onClick={() => onAction("delete", { notifyClient: deleteNotify })}
                      disabled={actionState.loading}
                    >
                      {actionState.loading ? "Eliminando…" : "Eliminar definitivamente"}
                      <Icon name="trash" size={15} />
                    </button>
                    <button type="button" className="admin-button" onClick={() => setDeleteOpen(false)}>
                      Volver
                    </button>
                  </div>
                </div>
              ) : null}
            </>
          ) : null}

          {tab === "edit" ? <EditForm request={request} saving={actionState.loading} onSave={(payload) => onAction("edit", payload)} /> : null}

          {tab === "notes" ? <NotesPanel request={request} saving={actionState.loading} onAdd={(payload) => onAction("note", payload)} /> : null}

          {tab === "history" ? <HistoryPanel request={request} /> : null}
        </div>

        <footer className="admin-dialog__actions">
          {status !== "confirmed" ? (
            <button
              type="button"
              className="btn btn--accent"
              onClick={() => onAction("confirm")}
              disabled={actionState.loading}
            >
              {actionState.loading ? "Procesando…" : status === "cancelled" ? "Volver a confirmar" : "Confirmar reunión"}
              <Icon name="check" size={16} />
            </button>
          ) : null}

          {status !== "cancelled" ? (
            <button
              type="button"
              className="admin-button admin-button--danger"
              onClick={() => setConfirmCancel(true)}
              disabled={actionState.loading}
            >
              Cancelar reunión
            </button>
          ) : null}

          <button
            type="button"
            className="admin-button"
            onClick={() => setReplyOpen((value) => !value)}
            disabled={actionState.loading}
          >
            {replyOpen ? "Cerrar respuesta" : "Responder"}
            <Icon name="mail" size={15} />
          </button>

          {status === "confirmed" ? (
            <button
              type="button"
              className="admin-button"
              onClick={() => onAction("remind")}
              disabled={actionState.loading}
            >
              Recordatorio
              <Icon name="bell" size={15} />
            </button>
          ) : null}

          <button type="button" className="admin-button" onClick={() => setTab("edit")} disabled={actionState.loading}>
            Editar
            <Icon name="pencil" size={15} />
          </button>

          <button
            type="button"
            className="admin-icon-button admin-icon-button--danger"
            onClick={() => setDeleteOpen(true)}
            disabled={actionState.loading}
            aria-label="Eliminar solicitud"
            title="Eliminar solicitud"
          >
            <Icon name="trash" size={16} />
          </button>
        </footer>
      </div>
    </dialog>
  )
}

export default function AdminPage() {
  const [auth, setAuth] = useState({ status: "checking", email: "" })
  const [requests, setRequests] = useState([])
  const [listState, setListState] = useState({ loading: false, error: "" })
  const [filter, setFilter] = useState("all")
  const [query, setQuery] = useState("")
  const [sortBy, setSortBy] = useState("newest")
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState(null)
  const [dialogMode, setDialogMode] = useState("detail")
  const [actionState, setActionState] = useState({ loading: false, error: "", success: "" })
  const [health, setHealth] = useState(null)
  const [notice, setNotice] = useState("")
  const noticeTimer = useRef(0)

  useEffect(() => {
    document.title = "Panel — Mambo Market"
    const robots = document.createElement("meta")
    robots.name = "robots"
    robots.content = "noindex, nofollow"
    document.head.appendChild(robots)
    let active = true

    api("/api/admin/session")
      .then((data) => {
        if (!active) return
        setAuth({ status: "authenticated", email: data.email })
      })
      .catch(() => {
        if (!active) return
        setAuth({ status: "guest", email: "" })
      })

    return () => {
      active = false
      robots.remove()
    }
  }, [])

  useEffect(() => {
    return () => window.clearTimeout(noticeTimer.current)
  }, [])

  useEffect(() => {
    setPage(1)
  }, [filter, query, sortBy])

  const showNotice = (message) => {
    window.clearTimeout(noticeTimer.current)
    setNotice(message)
    noticeTimer.current = window.setTimeout(() => setNotice(""), 3200)
  }

  const loadRequests = async () => {
    setListState({ loading: true, error: "" })
    try {
      const data = await api("/api/admin/requests")
      setRequests(Array.isArray(data.requests) ? data.requests : [])
      setListState({ loading: false, error: "" })
    } catch (error) {
      if (error.status === 401) {
        setAuth({ status: "guest", email: "" })
        return
      }
      setListState({ loading: false, error: error.message })
    }
  }

  useEffect(() => {
    if (auth.status === "authenticated") loadRequests()
  }, [auth.status])

  useEffect(() => {
    if (auth.status !== "authenticated") return undefined
    let active = true

    api("/api/admin/health")
      .then((data) => {
        if (active) setHealth(data.services)
      })
      .catch(() => {})

    return () => {
      active = false
    }
  }, [auth.status])

  useEffect(() => {
    if (!selected) return
    const updated = requests.find((request) => request.id === selected.id)
    if (updated && updated !== selected) setSelected(updated)
  }, [requests, selected])

  const stats = useMemo(() => {
    return requests.reduce(
      (counts, request) => {
        counts.total += 1
        if (request.status === "confirmed") counts.confirmed += 1
        else if (request.status === "cancelled") counts.cancelled += 1
        else counts.pending += 1
        return counts
      },
      { total: 0, pending: 0, confirmed: 0, cancelled: 0 },
    )
  }, [requests])

  const metrics = useMemo(() => {
    const now = new Date()
    const months = []

    for (let index = 5; index >= 0; index -= 1) {
      const date = new Date(now.getFullYear(), now.getMonth() - index, 1)
      months.push({
        key: `${date.getFullYear()}-${date.getMonth()}`,
        label: date.toLocaleDateString("es-AR", { month: "short" }).replace(".", ""),
        title: date.toLocaleDateString("es-AR", { month: "long", year: "numeric" }),
        count: 0,
      })
    }

    requests.forEach((request) => {
      if (!request.createdAt) return
      const date = new Date(request.createdAt)
      const bucket = months.find((month) => month.key === `${date.getFullYear()}-${date.getMonth()}`)
      if (bucket) bucket.count += 1
    })

    const maxMonth = Math.max(1, ...months.map((month) => month.count))

    const serviceCounts = Object.entries(
      requests.reduce((counts, request) => {
        const service = request.service || "Sin servicio"
        counts[service] = (counts[service] || 0) + 1
        return counts
      }, {}),
    )
      .sort((left, right) => right[1] - left[1])
      .slice(0, 4)

    const maxService = Math.max(1, ...serviceCounts.map(([, count]) => count))
    const durations = requests
      .filter((request) => request.createdAt && request.confirmedAt)
      .map((request) => request.confirmedAt - request.createdAt)
      .filter((duration) => duration > 0)
    const averageMs = durations.length
      ? durations.reduce((total, duration) => total + duration, 0) / durations.length
      : 0
    const averageConfirmation =
      averageMs > 0
        ? averageMs < 24 * 60 * 60 * 1000
          ? `${Math.round(averageMs / (60 * 60 * 1000))} h`
          : `${(averageMs / (24 * 60 * 60 * 1000)).toFixed(1)} días`
        : "—"
    const newLast7 = requests.filter((request) => request.createdAt > Date.now() - 7 * 24 * 60 * 60 * 1000).length
    const confirmationRate = requests.length ? Math.round(((stats.confirmed || 0) / requests.length) * 100) : 0

    return { months, maxMonth, serviceCounts, maxService, averageConfirmation, newLast7, confirmationRate }
  }, [requests, stats.confirmed])

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    const filteredList = requests.filter((request) => {
      if (filter !== "all" && (request.status || "pending") !== filter) return false
      if (!needle) return true
      return [request.name, request.company, request.email, request.service, request.phone]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(needle))
    })

    return sortRequests(filteredList, sortBy)
  }, [requests, filter, query, sortBy])

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, pageCount)
  const pageItems = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  const handleLogin = (email) => setAuth({ status: "authenticated", email })

  const handleLogout = async () => {
    try {
      await api("/api/admin/logout", { method: "POST" })
    } catch {
      // La sesión local se cierra igualmente.
    }
    setRequests([])
    setSelected(null)
    setAuth({ status: "guest", email: "" })
  }

  const openDetail = (request, mode = "detail") => {
    setActionState({ loading: false, error: "", success: "" })
    setDialogMode(mode)
    setSelected(request)
  }

  const runAction = async (action, extra = {}) => {
    if (!selected || actionState.loading) return null
    setActionState({ loading: true, error: "", success: "" })

    try {
      const data = await api("/api/admin/action", {
        method: "POST",
        body: JSON.stringify({ id: selected.id, action, ...extra }),
      })

      if (action === "delete") {
        setRequests((previous) => previous.filter((request) => request.id !== selected.id))
        setSelected(null)
        showNotice("Solicitud eliminada.")
        setActionState({ loading: false, error: "", success: "" })
        return null
      }

      const updated = data.request
      setRequests((previous) => previous.map((request) => (request.id === updated.id ? updated : request)))
      setSelected(updated)
      setActionState({
        loading: false,
        error: "",
        success:
          action === "confirm"
            ? "Reunión confirmada. Le enviamos el email al cliente."
            : action === "cancel"
              ? "Reunión cancelada. Le enviamos el aviso al cliente."
              : action === "reply"
                ? "Respuesta enviada al cliente."
                : action === "edit"
                  ? "Solicitud actualizada correctamente."
                  : action === "note"
                    ? "Nota interna guardada."
                    : action === "remind"
                      ? "Recordatorio enviado al cliente."
                      : "Acción completada.",
      })
      return updated
    } catch (error) {
      if (error.status === 401) {
        setAuth({ status: "guest", email: "" })
        setSelected(null)
        return null
      }
      setActionState({ loading: false, error: error.message, success: "" })
      return null
    }
  }

  const handleFilter = (nextFilter) => {
    setFilter(nextFilter)
    setPage(1)
  }

  const handleExport = () => {
    exportRequestsCsv(filtered)
    showNotice("CSV exportado con las solicitudes filtradas.")
  }

  const handleBackup = async () => {
    try {
      const data = await api("/api/admin/backup")
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement("a")
      anchor.href = url
      anchor.download = `mambo-backup-${new Date().toISOString().slice(0, 10)}.json`
      document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()
      URL.revokeObjectURL(url)
      showNotice(`Backup generado con ${data.count} solicitudes.`)
    } catch (error) {
      if (error.status === 401) {
        setAuth({ status: "guest", email: "" })
        return
      }
      showNotice(error.message)
    }
  }

  if (auth.status === "checking") {
    return (
      <div className="admin-page admin-page--center">
        <span className="admin-spinner" aria-hidden="true" />
        <p>Verificando sesión…</p>
      </div>
    )
  }

  if (auth.status === "guest") {
    return (
      <div className="admin-page admin-page--center">
        <LoginView onLogin={handleLogin} />
      </div>
    )
  }

  return (
    <div className="admin-page">
      <aside className="admin-sidebar">
        <div className="admin-brand admin-brand--sidebar">
          <span className="admin-brand__mark" aria-hidden="true">
            <svg viewBox="0 0 40 40" fill="none">
              <path d="M7.5 31.5V9l12.5 12.5L32.5 9v22.5" stroke="currentColor" strokeWidth="4" />
            </svg>
          </span>
          <span>
            <strong>Mambo Market</strong>
            <small>Administración</small>
          </span>
        </div>

        <nav className="admin-nav" aria-label="Panel">
          <span className="admin-nav__item is-active">
            <Icon name="layers" size={17} />
            Solicitudes
          </span>
          <a className="admin-nav__item" href="/">
            <Icon name="globe" size={17} />
            Ver sitio
          </a>
        </nav>

        <div className="admin-sidebar__foot">
          <span className="admin-sidebar__email">{auth.email}</span>
          <button type="button" className="admin-sidebar__logout" onClick={handleLogout}>
            <Icon name="log-out" size={16} />
            Cerrar sesión
          </button>
        </div>
      </aside>

      <main className="admin-main">
        <header className="admin-topbar">
          <div>
            <p className="admin-eyebrow">Solicitudes de reunión</p>
            <h1>Panel de administración</h1>
          </div>
          <div className="admin-topbar__actions">
            <button type="button" className="admin-button" onClick={handleExport} disabled={!filtered.length}>
              <Icon name="download" size={16} />
              Exportar CSV
            </button>
            <button type="button" className="admin-button" onClick={handleBackup}>
              <Icon name="download" size={16} />
              Backup JSON
            </button>
            <button
              type="button"
              className="admin-button"
              onClick={loadRequests}
              disabled={listState.loading}
              aria-label="Actualizar solicitudes"
            >
              <Icon name="refresh" size={16} />
              {listState.loading ? "Actualizando…" : "Actualizar"}
            </button>
          </div>
        </header>

        {health ? (
          <div className="admin-health" aria-label="Estado del sistema">
            <span className={health.storage ? "is-ok" : "is-warn"} title="Base de datos Redis">
              <i />
              Base de datos
            </span>
            <span className={health.email ? "is-ok" : "is-warn"} title={`Proveedor: ${health.emailProvider || "sin configurar"}`}>
              <i />
              Email
            </span>
            <span className={health.twoFactor ? "is-ok" : "is-warn"} title="Código de seguridad por email">
              <i />
              2FA
            </span>
            <span className={health.cron ? "is-ok" : "is-warn"} title="Recordatorios y retención automáticos">
              <i />
              Cron
            </span>
            <span className="admin-health__info">Retención: {health.retentionDays} días</span>
          </div>
        ) : null}

        <section className="admin-stats" aria-label="Resumen de solicitudes">
          <button type="button" className={filter === "pending" ? "is-active" : ""} onClick={() => handleFilter("pending")}>
            <span>Pendientes</span>
            <strong>{stats.pending}</strong>
          </button>
          <button type="button" className={filter === "confirmed" ? "is-active" : ""} onClick={() => handleFilter("confirmed")}>
            <span>Confirmadas</span>
            <strong>{stats.confirmed}</strong>
          </button>
          <button type="button" className={filter === "cancelled" ? "is-active" : ""} onClick={() => handleFilter("cancelled")}>
            <span>Canceladas</span>
            <strong>{stats.cancelled}</strong>
          </button>
          <button type="button" className={filter === "all" ? "is-active" : ""} onClick={() => handleFilter("all")}>
            <span>Total</span>
            <strong>{stats.total}</strong>
          </button>
        </section>

        <section className="admin-metrics" aria-label="Métricas del panel">
          <article className="admin-metric-card admin-metric-card--wide">
            <div className="admin-metric-head">
              <h2>Solicitudes por mes</h2>
              <span>Últimos 6 meses</span>
            </div>
            <div className="admin-mini-bars">
              {metrics.months.map((month) => (
                <div className="admin-mini-bar" key={month.key} title={`${month.title}: ${month.count} solicitudes`}>
                  <span className="admin-mini-bar__value">{month.count}</span>
                  <span className="admin-mini-bar__track">
                    <i style={{ height: `${Math.max(5, (month.count / metrics.maxMonth) * 100)}%` }} />
                  </span>
                  <span className="admin-mini-bar__label">{month.label}</span>
                </div>
              ))}
            </div>
          </article>

          <article className="admin-metric-card">
            <div className="admin-metric-head">
              <h2>Tasa de confirmación</h2>
              <strong className="admin-metric-big">{metrics.confirmationRate}%</strong>
            </div>
            <div className="admin-progress" aria-hidden="true">
              <i style={{ width: `${metrics.confirmationRate}%` }} />
            </div>
            <div className="admin-status-split">
              <span>
                <i className="is-pending" /> {stats.pending} pendientes
              </span>
              <span>
                <i className="is-confirmed" /> {stats.confirmed} confirmadas
              </span>
              <span>
                <i className="is-cancelled" /> {stats.cancelled} canceladas
              </span>
            </div>
          </article>

          <article className="admin-metric-card">
            <div className="admin-metric-head">
              <h2>Servicios más pedidos</h2>
            </div>
            {metrics.serviceCounts.length ? (
              <ul className="admin-service-list">
                {metrics.serviceCounts.map(([service, count]) => (
                  <li key={service}>
                    <span>{service}</span>
                    <strong>{count}</strong>
                    <i aria-hidden="true">
                      <b style={{ width: `${Math.max(6, (count / metrics.maxService) * 100)}%` }} />
                    </i>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="admin-metric-empty">Sin datos todavía.</p>
            )}
          </article>

          <article className="admin-metric-card admin-metric-card--kpis">
            <div>
              <span>Tiempo medio de confirmación</span>
              <strong>{metrics.averageConfirmation}</strong>
            </div>
            <div>
              <span>Nuevas en los últimos 7 días</span>
              <strong>{metrics.newLast7}</strong>
            </div>
          </article>
        </section>

        <section className="admin-toolbar" aria-label="Filtros de solicitudes">
          <div className="admin-tabs" role="tablist" aria-label="Estado">
            {FILTERS.map((item) => {
              const count = item.id === "all" ? stats.total : stats[item.id]
              return (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  aria-selected={filter === item.id}
                  className={filter === item.id ? "is-active" : ""}
                  onClick={() => handleFilter(item.id)}
                >
                  {item.label}
                  <span>{count}</span>
                </button>
              )
            })}
          </div>

          <div className="admin-toolbar__filters">
            <label className="admin-search">
              <Icon name="search" size={17} />
              <span className="sr-only">Buscar solicitudes</span>
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar nombre, empresa, email…"
              />
            </label>

            <label className="admin-select">
              <span className="sr-only">Ordenar solicitudes</span>
              <select value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
                {SORT_OPTIONS.map((option) => (
                  <option value={option.id} key={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </section>

        {listState.error ? (
          <div className="admin-empty admin-empty--error" role="alert">
            <h2>No pudimos cargar las solicitudes</h2>
            <p>{listState.error}</p>
            <button type="button" className="admin-button" onClick={loadRequests}>
              Reintentar
            </button>
          </div>
        ) : null}

        {!listState.error && listState.loading && !requests.length ? (
          <div className="admin-empty">
            <span className="admin-spinner" aria-hidden="true" />
            <p>Cargando solicitudes…</p>
          </div>
        ) : null}

        {!listState.error && !listState.loading && !filtered.length ? (
          <div className="admin-empty">
            <span className="admin-empty__icon" aria-hidden="true">
              <Icon name="mail" size={22} />
            </span>
            <h2>No hay solicitudes para mostrar</h2>
            <p>Cuando alguien complete el formulario, va a aparecer acá.</p>
          </div>
        ) : null}

        {!listState.error && filtered.length ? (
          <>
            <section className="admin-cards" aria-label="Solicitudes">
              {pageItems.map((request) => (
                <article className="request-card" key={request.id}>
                  <div className="request-card__head">
                    <StatusBadge status={request.status} />
                    <span className="request-card__date">{formatDate(request.date, "short")}</span>
                  </div>

                  <div className="request-card__person">
                    <span className="request-card__avatar" aria-hidden="true">
                      {initials(request.name)}
                    </span>
                    <div>
                      <h2>{request.name}</h2>
                      <p>{request.company}</p>
                    </div>
                  </div>

                  <p className="request-card__service">{request.service}</p>
                  <p className="request-card__message">{request.message}</p>

                  <div className="request-card__meta">
                    <span>
                      <Icon name="clock" size={13} />
                      {formatTime(request.time)} · ARG
                    </span>
                    <span>
                      <Icon name="mail" size={13} />
                      {request.email}
                    </span>
                    <span>
                      <Icon name="phone" size={13} />
                      {request.phone}
                    </span>
                  </div>

                  <div className="request-card__badges">
                    {request.replies?.length ? <span>{request.replies.length} respuestas</span> : null}
                    {request.notes?.length ? <span>{request.notes.length} notas</span> : null}
                    {request.reminderSentAt ? <span>Recordatorio</span> : null}
                    {request.updatedAt && request.updatedAt !== request.createdAt ? <span>Actualizada</span> : null}
                  </div>

                  <div className="request-card__actions">
                    <a className="admin-icon-button" href={`mailto:${request.email}`} aria-label={`Enviar email a ${request.name}`} title="Enviar email">
                      <Icon name="mail" size={15} />
                    </a>
                    <a
                      className="admin-icon-button"
                      href={`https://wa.me/${String(request.phone || "").replace(/\D/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Abrir WhatsApp de ${request.name}`}
                      title="Abrir WhatsApp"
                    >
                      <Icon name="whatsapp" size={15} />
                    </a>
                    <button
                      type="button"
                      className="admin-icon-button"
                      onClick={() => openDetail(request, "edit")}
                      aria-label={`Editar solicitud de ${request.name}`}
                      title="Editar"
                    >
                      <Icon name="pencil" size={15} />
                    </button>
                    <button
                      type="button"
                      className="admin-icon-button admin-icon-button--danger"
                      onClick={() => openDetail(request, "delete")}
                      aria-label={`Eliminar solicitud de ${request.name}`}
                      title="Eliminar"
                    >
                      <Icon name="trash" size={15} />
                    </button>
                    <span className="request-card__spacer" />
                    <button type="button" className="admin-button" onClick={() => openDetail(request)}>
                      Ver detalle
                      <Icon name="arrow-right" size={15} />
                    </button>
                  </div>

                  <div className="request-card__foot">
                    <span>Recibida {formatTimestamp(request.createdAt)}</span>
                  </div>
                </article>
              ))}
            </section>

            {pageCount > 1 ? (
              <nav className="admin-pagination" aria-label="Paginación">
                <button type="button" className="admin-button" onClick={() => setPage(Math.max(1, currentPage - 1))} disabled={currentPage === 1}>
                  Anterior
                </button>
                <span>
                  Página {currentPage} de {pageCount} · {filtered.length} solicitudes
                </span>
                <button
                  type="button"
                  className="admin-button"
                  onClick={() => setPage(Math.min(pageCount, currentPage + 1))}
                  disabled={currentPage === pageCount}
                >
                  Siguiente
                </button>
              </nav>
            ) : null}
          </>
        ) : null}
      </main>

      <DetailDialog
        request={selected}
        initialMode={dialogMode}
        onClose={() => setSelected(null)}
        onAction={runAction}
        actionState={actionState}
      />

      {notice ? (
        <div className="admin-toast" role="status">
          {notice}
        </div>
      ) : null}
    </div>
  )
}
