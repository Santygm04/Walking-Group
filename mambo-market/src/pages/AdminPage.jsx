import { useEffect, useMemo, useRef, useState } from "react"
import Icon from "../components/Icon"
import { CONTACT_EMAIL } from "../data/siteData"
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

function StatusBadge({ status }) {
  const meta = STATUS[status] || STATUS.pending
  return <span className={`status-badge ${meta.className}`}>{meta.label}</span>
}

function LoginView({ onLogin }) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (loading) return
    setError("")
    setLoading(true)

    try {
      const data = await api("/api/admin/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      })
      onLogin(data.email)
    } catch (loginError) {
      setError(loginError.message)
    } finally {
      setLoading(false)
    }
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
            {loading ? "Ingresando…" : "Ingresar"}
            <Icon name="arrow-right" size={17} />
          </button>
        </form>

        <p className="admin-login__note">Sesión segura de 8 horas. No compartas tu contraseña.</p>
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

function DetailDialog({ request, onClose, onAction, actionState, onReply }) {
  const dialogRef = useRef(null)
  const [confirmCancel, setConfirmCancel] = useState(false)
  const [replyOpen, setReplyOpen] = useState(false)

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
    setConfirmCancel(false)
    setReplyOpen(false)
  }, [request?.id])

  const handleClose = () => {
    onClose()
  }

  const handleCancel = () => {
    onAction("cancel")
    setConfirmCancel(false)
  }

  const status = request?.status || "pending"

  return (
    <dialog
      ref={dialogRef}
      className="admin-dialog"
      onClose={handleClose}
      onCancel={(event) => {
        event.preventDefault()
        handleClose()
      }}
      onClick={(event) => {
        if (event.target === dialogRef.current) handleClose()
      }}
      aria-labelledby="admin-detail-title"
    >
      {request ? (
        <div className="admin-dialog__panel">
          <header className="admin-dialog__head">
            <div>
              <StatusBadge status={status} />
              <h2 id="admin-detail-title">{request.name}</h2>
              <p>{request.company}</p>
            </div>
            <button type="button" className="admin-dialog__close" onClick={handleClose} aria-label="Cerrar detalle">
              <Icon name="x" size={18} />
            </button>
          </header>

          <div className="admin-dialog__body">
            <div className="admin-detail-grid">
              <div>
                <span>Fecha de reunión</span>
                <strong>{formatDate(request.date)}</strong>
              </div>
              <div>
                <span>Horario</span>
                <strong>{formatTime(request.time)}</strong>
              </div>
              <div>
                <span>Email</span>
                <strong>
                  <a href={`mailto:${request.email}`}>{request.email}</a>
                </strong>
              </div>
              <div>
                <span>Teléfono</span>
                <strong>
                  <a href={`tel:${request.phone}`}>{request.phone}</a>
                </strong>
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

            {request.confirmedAt ? <p className="admin-history">Confirmada el {formatTimestamp(request.confirmedAt)}.</p> : null}
            {request.cancelledAt ? <p className="admin-history">Cancelada el {formatTimestamp(request.cancelledAt)}.</p> : null}

            {Array.isArray(request.replies) && request.replies.length ? (
              <div className="admin-replies">
                <h3>Respuestas enviadas</h3>
                {request.replies.slice(-3).reverse().map((reply) => (
                  <div key={reply.id}>
                    <strong>{reply.subject}</strong>
                    <span>{formatTimestamp(reply.sentAt)}</span>
                    <p>{reply.message}</p>
                  </div>
                ))}
              </div>
            ) : null}

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

            {replyOpen ? (
              <ReplyForm
                request={request}
                sending={actionState.loading}
                onSend={(payload) => {
                  onReply(payload)
                }}
              />
            ) : null}

            {confirmCancel ? (
              <div className="admin-cancel-confirm" role="alert">
                <p>¿Cancelar esta reunión? Se enviará un email al cliente.</p>
                <div>
                  <button
                    type="button"
                    className="admin-button admin-button--danger"
                    onClick={handleCancel}
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
                Cancelar
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
          </footer>
        </div>
      ) : null}
    </dialog>
  )
}

export default function AdminPage() {
  const [auth, setAuth] = useState({ status: "checking", email: "" })
  const [requests, setRequests] = useState([])
  const [listState, setListState] = useState({ loading: false, error: "" })
  const [filter, setFilter] = useState("all")
  const [query, setQuery] = useState("")
  const [selected, setSelected] = useState(null)
  const [actionState, setActionState] = useState({ loading: false, error: "", success: "" })

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

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return requests.filter((request) => {
      if (filter !== "all" && (request.status || "pending") !== filter) return false
      if (!needle) return true
      return [request.name, request.company, request.email, request.service]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(needle))
    })
  }, [requests, filter, query])

  const handleLogin = (email) => {
    setAuth({ status: "authenticated", email })
  }

  const handleLogout = async () => {
    try {
      await api("/api/admin/logout", { method: "POST" })
    } catch {
      // The session is cleared locally even if the request fails.
    }
    setRequests([])
    setSelected(null)
    setAuth({ status: "guest", email: "" })
  }

  const openDetail = (request) => {
    setActionState({ loading: false, error: "", success: "" })
    setSelected(request)
  }

  const runAction = async (action, extra = {}) => {
    if (!selected || actionState.loading) return
    setActionState({ loading: true, error: "", success: "" })

    try {
      const data = await api("/api/admin/action", {
        method: "POST",
        body: JSON.stringify({ id: selected.id, action, ...extra }),
      })
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
              : "Respuesta enviada al cliente.",
      })
    } catch (error) {
      if (error.status === 401) {
        setAuth({ status: "guest", email: "" })
        setSelected(null)
        return
      }
      setActionState({ loading: false, error: error.message, success: "" })
    }
  }

  const handleReply = async (payload) => {
    await runAction("reply", payload)
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
        </header>

        <section className="admin-stats" aria-label="Resumen de solicitudes">
          <article>
            <span>Pendientes</span>
            <strong>{stats.pending}</strong>
          </article>
          <article>
            <span>Confirmadas</span>
            <strong>{stats.confirmed}</strong>
          </article>
          <article>
            <span>Canceladas</span>
            <strong>{stats.cancelled}</strong>
          </article>
          <article>
            <span>Total</span>
            <strong>{stats.total}</strong>
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
                  onClick={() => setFilter(item.id)}
                >
                  {item.label}
                  <span>{count}</span>
                </button>
              )
            })}
          </div>

          <label className="admin-search">
            <Icon name="search" size={17} />
            <span className="sr-only">Buscar solicitudes</span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar por nombre, empresa o email"
            />
          </label>
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
          <section className="admin-cards" aria-label="Solicitudes">
            {filtered.map((request) => (
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
                <div className="request-card__meta">
                  <span>
                    <Icon name="clock" size={14} />
                    {formatTime(request.time)}
                  </span>
                  <span>{request.email}</span>
                </div>
                <div className="request-card__foot">
                  <span>Recibida {formatTimestamp(request.createdAt)}</span>
                  <button type="button" className="admin-button" onClick={() => openDetail(request)}>
                    Ver detalle
                    <Icon name="arrow-right" size={15} />
                  </button>
                </div>
              </article>
            ))}
          </section>
        ) : null}
      </main>

      <DetailDialog
        request={selected}
        onClose={() => setSelected(null)}
        onAction={runAction}
        onReply={handleReply}
        actionState={actionState}
      />
    </div>
  )
}
