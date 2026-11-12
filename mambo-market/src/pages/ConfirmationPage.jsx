import { useEffect, useState } from "react"
import Icon from "../components/Icon"
import { CONTACT_EMAIL } from "../data/siteData"
import "./ConfirmationPage.css"

function formatDate(value) {
  if (!value) return "A coordinar"
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
  return value ? `${value} h` : "A coordinar"
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

function MeetingDetails({ meeting }) {
  return (
    <dl className="confirm-details">
      <div>
        <dt>Cliente</dt>
        <dd>{meeting.name}</dd>
      </div>
      <div>
        <dt>Empresa</dt>
        <dd>{meeting.company || "—"}</dd>
      </div>
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
        <dt>Email</dt>
        <dd>
          <a href={`mailto:${meeting.email}`}>{meeting.email}</a>
        </dd>
      </div>
      <div>
        <dt>Teléfono</dt>
        <dd>
          <a href={`tel:${meeting.phone}`}>{meeting.phone}</a>
        </dd>
      </div>
    </dl>
  )
}

export default function ConfirmationPage({ token }) {
  const [state, setState] = useState({ status: "loading", meeting: null, message: "" })

  useEffect(() => {
    document.title = "Confirmar reunión — Mambo Market"
    const robots = document.createElement("meta")
    robots.name = "robots"
    robots.content = "noindex, nofollow"
    document.head.appendChild(robots)
    let cancelled = false

    fetch(`/api/confirm?token=${encodeURIComponent(token)}`, { headers: { Accept: "application/json" } })
      .then(async (response) => {
        const data = await response.json().catch(() => ({}))
        if (!response.ok) {
          throw new Error(data.message || "El enlace de confirmación no es válido o venció.")
        }
        if (cancelled) return

        if (data.meeting?.status === "confirmed") {
          setState({ status: "confirmed", meeting: data.meeting, message: data.meeting.email })
          return
        }

        if (data.meeting?.status === "cancelled") {
          setState({ status: "cancelled", meeting: data.meeting, message: "" })
          return
        }

        setState({ status: "ready", meeting: data.meeting, message: "" })
      })
      .catch((error) => {
        if (cancelled) return
        setState({ status: "error", meeting: null, message: error.message })
      })

    return () => {
      cancelled = true
      robots.remove()
    }
  }, [token])

  const handleConfirm = async () => {
    if (state.status === "confirming") return

    setState((previous) => ({ ...previous, status: "confirming", message: "" }))

    try {
      const response = await fetch("/api/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      })
      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        if (data.error === "REQUEST_CANCELLED") {
          setState((previous) => ({ ...previous, status: "cancelled", message: data.message || "" }))
          return
        }
        throw new Error(data.message || "No pudimos confirmar la reunión.")
      }

      setState((previous) => ({
        status: "confirmed",
        meeting: previous.meeting,
        message: data.email || previous.meeting?.email || "",
      }))
    } catch (error) {
      setState((previous) => ({ ...previous, status: "ready", message: error.message }))
    }
  }

  return (
    <div className="confirm-page">
      <header className="confirm-page__header">
        <div className="container confirm-page__header-inner">
          <Brand />
          <span className="confirm-page__tag">Confirmación de reunión</span>
        </div>
      </header>

      <main className="confirm-page__main">
        <div className="container confirm-page__content">
          {state.status === "loading" ? (
            <div className="confirm-card confirm-card--center" aria-live="polite">
              <span className="confirm-spinner" aria-hidden="true" />
              <p>Verificando el enlace de confirmación…</p>
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

          {(state.status === "ready" || state.status === "confirming") && state.meeting ? (
            <div className="confirm-card">
              <p className="confirm-card__eyebrow">Revisión del equipo</p>
              <h1>Confirmá la reunión con {state.meeting.name}.</h1>
              <p className="confirm-card__lead">
                Revisá los datos de la solicitud. Al confirmar, se enviará automáticamente un email de confirmación al
                cliente.
              </p>

              <MeetingDetails meeting={state.meeting} />

              {state.message ? (
                <p className="confirm-alert" role="alert">
                  {state.message}
                </p>
              ) : null}

              <button
                type="button"
                className="btn btn--accent btn--full confirm-card__submit"
                onClick={handleConfirm}
                disabled={state.status === "confirming"}
              >
                {state.status === "confirming" ? "Confirmando reunión…" : "Confirmar reunión"}
                <Icon name={state.status === "confirming" ? "clock" : "check"} size={18} />
              </button>

              <p className="confirm-card__note">
                Se enviará la confirmación a <strong>{state.meeting.email}</strong>. Si el horario no sirve, respondé
                el email de la solicitud para reprogramarlo.
              </p>
            </div>
          ) : null}

          {state.status === "confirmed" && state.meeting ? (
            <div className="confirm-card confirm-card--center">
              <span className="confirm-state-icon" aria-hidden="true">
                <Icon name="check" size={24} />
              </span>
              <p className="confirm-card__eyebrow">Reunión confirmada</p>
              <h1>Listo. El cliente ya recibió la confirmación.</h1>
              <p className="confirm-card__lead">
                Enviamos el email de confirmación a <strong>{state.message}</strong> con la fecha y el horario
                acordados.
              </p>
              <MeetingDetails meeting={state.meeting} />
              <a className="btn btn--ghost" href="/">
                Volver al sitio
              </a>
            </div>
          ) : null}

          {state.status === "cancelled" && state.meeting ? (
            <div className="confirm-card confirm-card--center">
              <span className="confirm-state-icon confirm-state-icon--error" aria-hidden="true">
                <Icon name="x" size={24} />
              </span>
              <p className="confirm-card__eyebrow">Reunión cancelada</p>
              <h1>Esta solicitud fue cancelada.</h1>
              <p className="confirm-card__lead">
                No se puede confirmar desde este enlace. Si necesitás reprogramar, escribinos a{" "}
                <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
              </p>
              <a className="btn btn--ghost" href="/">
                Volver al sitio
              </a>
            </div>
          ) : null}
        </div>
      </main>

      <footer className="confirm-page__footer">
        <div className="container">
          <span>© {new Date().getFullYear()} Mambo Market</span>
          <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
        </div>
      </footer>
    </div>
  )
}
