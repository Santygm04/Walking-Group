import { useEffect, useState } from "react"
import Icon from "../components/Icon"
import { CONTACT_EMAIL } from "../data/siteData"
import "./ManageBookingPage.css"

const STATUS = {
  pending: { label: "Pendiente de confirmación", className: "is-pending" },
  confirmed: { label: "Confirmada", className: "is-confirmed" },
  cancelled: { label: "Cancelada", className: "is-cancelled" },
}

function formatDate(value) {
  if (!value) return "Sin fecha"
  const [year, month, day] = value.split("-").map(Number)
  const date = new Date(Date.UTC(year, month - 1, day, 12))
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(date)
}

function formatTime(value) {
  return value ? `${value} h` : "Sin horario"
}

function Brand() {
  return (
    <a className="confirm-brand" href="/">
      <span className="confirm-brand__mark" aria-hidden="true">
        <svg viewBox="0 0 40 40" fill="none">
          <path d="M7.5 31.5V9l12.5 12.5L32.5 9v22.5" stroke="currentColor" strokeWidth="4" />
        </svg>
      </span>
      <span>
        <strong>Mambo Market</strong>
        <small>Investigación &amp; estrategia</small>
      </span>
    </a>
  )
}

export default function ManageBookingPage({ token }) {
  const [state, setState] = useState({ status: "loading", meeting: null, message: "" })
  const [date, setDate] = useState("")
  const [time, setTime] = useState("")
  const [rescheduleOpen, setRescheduleOpen] = useState(false)
  const [cancelOpen, setCancelOpen] = useState(false)
  const [notice, setNotice] = useState("")

  useEffect(() => {
    document.title = "Gestionar reunión — Mambo Market"
    const robots = document.createElement("meta")
    robots.name = "robots"
    robots.content = "noindex, nofollow"
    document.head.appendChild(robots)

    let active = true
    fetch(`/api/manage?token=${encodeURIComponent(token)}`, { headers: { Accept: "application/json" } })
      .then(async (response) => {
        const data = await response.json().catch(() => ({}))
        if (!response.ok) throw new Error(data.message || "El enlace no es válido o venció.")
        if (!active) return
        setState({ status: "ready", meeting: data.meeting, message: "" })
        setDate(data.meeting.date || "")
        setTime(data.meeting.time || "")
      })
      .catch((error) => {
        if (!active) return
        setState({ status: "error", meeting: null, message: error.message })
      })

    return () => {
      active = false
      robots.remove()
    }
  }, [token])

  const meeting = state.meeting
  const status = STATUS[meeting?.status] || STATUS.pending

  const handleReschedule = async (event) => {
    event.preventDefault()
    if (state.status === "working") return
    setNotice("")
    setState((previous) => ({ ...previous, status: "working" }))

    try {
      const response = await fetch("/api/manage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, action: "reschedule", date, time }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.message || "No pudimos reprogramar la reunión.")

      setState({ status: "ready", meeting: data.meeting, message: "" })
      setDate(data.meeting.date)
      setTime(data.meeting.time)
      setRescheduleOpen(false)
      setNotice(
        data.emailSent
          ? "Reunión reprogramada. Te enviamos un email con los nuevos datos."
          : "Reunión reprogramada. El cambio quedó guardado, pero no pudimos enviarte el email.",
      )
    } catch (error) {
      setState((previous) => ({ ...previous, status: "ready" }))
      setNotice(error.message)
    }
  }

  const handleCancel = async () => {
    if (state.status === "working") return
    setNotice("")
    setState((previous) => ({ ...previous, status: "working" }))

    try {
      const response = await fetch("/api/manage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, action: "cancel" }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.message || "No pudimos cancelar la reunión.")

      setState({ status: "ready", meeting: data.meeting, message: "" })
      setCancelOpen(false)
      setNotice(
        data.emailSent
          ? "Reunión cancelada. Te enviamos un email de confirmación."
          : "Reunión cancelada. El cambio quedó guardado, pero no pudimos enviarte el email.",
      )
    } catch (error) {
      setState((previous) => ({ ...previous, status: "ready" }))
      setNotice(error.message)
    }
  }

  return (
    <div className="confirm-page manage-page">
      <header className="confirm-page__header">
        <div className="container confirm-page__header-inner">
          <Brand />
          <a className="manage-back" href="/">
            Volver al sitio
            <Icon name="arrow-up-right" size={14} />
          </a>
        </div>
      </header>

      <main className="confirm-page__main">
        <div className="container confirm-page__content">
          {state.status === "loading" ? (
            <div className="confirm-card confirm-card--center" aria-live="polite">
              <span className="confirm-spinner" aria-hidden="true" />
              <p>Cargando tu reunión…</p>
            </div>
          ) : null}

          {state.status === "error" ? (
            <div className="confirm-card confirm-card--center">
              <span className="confirm-state-icon confirm-state-icon--error" aria-hidden="true">
                <Icon name="arrow-up-right" size={22} />
              </span>
              <h1>No pudimos abrir este enlace</h1>
              <p>{state.message}</p>
              <p>
                Si necesitás ayuda, escribinos a <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
              </p>
              <a className="btn btn--ghost" href="/">
                Volver al sitio
              </a>
            </div>
          ) : null}

          {meeting ? (
            <div className="confirm-card manage-card">
              <div className="manage-status-row">
                <span className={`manage-status ${status.className}`}>{status.label}</span>
                <span className="manage-brand-note">Mambo Market</span>
              </div>

              <h1>Hola, {meeting.name}.</h1>
              <p className="confirm-card__lead">
                Desde acá podés revisar los datos de tu reunión y reprogramarla o cancelarla.
              </p>

              <dl className="confirm-details">
                <div>
                  <dt>Fecha</dt>
                  <dd>{formatDate(meeting.date)}</dd>
                </div>
                <div>
                  <dt>Horario (Argentina)</dt>
                  <dd>{formatTime(meeting.time)}</dd>
                </div>
                <div>
                  <dt>Servicio</dt>
                  <dd>{meeting.service}</dd>
                </div>
                <div>
                  <dt>Empresa</dt>
                  <dd>{meeting.company || "—"}</dd>
                </div>
              </dl>

              {notice ? (
                <p className="manage-notice" role="status">
                  {notice}
                </p>
              ) : null}

              {meeting.status !== "cancelled" ? (
                <>
                  <div className="manage-calendar">
                    <a
                      className="btn btn--ghost"
                      href={meeting.links.googleCalendarUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Agregar a Google Calendar
                      <Icon name="calendar" size={15} />
                    </a>
                    <a className="btn btn--ghost" href={meeting.links.calendarUrl}>
                      Descargar .ics
                      <Icon name="download" size={15} />
                    </a>
                  </div>

                  <div className="manage-actions">
                    <button
                      type="button"
                      className="btn btn--accent"
                      onClick={() => {
                        setRescheduleOpen((value) => !value)
                        setCancelOpen(false)
                      }}
                      disabled={state.status === "working"}
                    >
                      {rescheduleOpen ? "Cerrar reprogramación" : "Reprogramar reunión"}
                      <Icon name="calendar" size={16} />
                    </button>
                    <button
                      type="button"
                      className="manage-cancel-button"
                      onClick={() => {
                        setCancelOpen(true)
                        setRescheduleOpen(false)
                      }}
                      disabled={state.status === "working"}
                    >
                      Cancelar reunión
                    </button>
                  </div>

                  {rescheduleOpen ? (
                    <form className="manage-form" onSubmit={handleReschedule}>
                      <div className="manage-form__head">
                        <h2>Elegí un nuevo horario</h2>
                        <p>Los horarios se expresan en hora de Argentina (GMT-3).</p>
                      </div>
                      <div className="manage-form__grid">
                        <label>
                          Nueva fecha
                          <input
                            type="date"
                            value={date}
                            onChange={(event) => setDate(event.target.value)}
                            required
                          />
                        </label>
                        <label>
                          Nuevo horario
                          <input
                            type="time"
                            value={time}
                            onChange={(event) => setTime(event.target.value)}
                            required
                          />
                        </label>
                      </div>
                      <button type="submit" className="btn btn--accent" disabled={state.status === "working"}>
                        {state.status === "working" ? "Guardando…" : "Confirmar nuevo horario"}
                        <Icon name="check" size={16} />
                      </button>
                    </form>
                  ) : null}

                  {cancelOpen ? (
                    <div className="manage-cancel-panel" role="alertdialog" aria-label="Cancelar reunión">
                      <p>¿Seguro que querés cancelar la reunión? Te enviaremos un email de confirmación.</p>
                      <div>
                        <button type="button" className="manage-cancel-confirm" onClick={handleCancel} disabled={state.status === "working"}>
                          {state.status === "working" ? "Cancelando…" : "Sí, cancelar reunión"}
                        </button>
                        <button type="button" className="manage-cancel-back" onClick={() => setCancelOpen(false)}>
                          Volver
                        </button>
                      </div>
                    </div>
                  ) : null}
                </>
              ) : (
                <p className="manage-cancelled-note">
                  Esta reunión está cancelada. Si querés coordinar una nueva, escribinos a{" "}
                  <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
                </p>
              )}
            </div>
          ) : null}
        </div>
      </main>

      <footer className="confirm-page__footer">
        <div className="container">
          <span>© {new Date().getFullYear()} Mambo Market</span>
          <span>
            <a href="/privacidad">Privacidad</a> · <a href="/terminos">Términos</a> ·{" "}
            <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
          </span>
        </div>
      </footer>
    </div>
  )
}
