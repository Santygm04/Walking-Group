import { useEffect, useMemo, useRef, useState } from "react"
import Icon from "../components/Icon"
import "./AvailabilityManager.css"

const MONTHS = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
]

const WEEKDAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"]

const DAYS = [
  { key: 1, label: "Lunes" },
  { key: 2, label: "Martes" },
  { key: 3, label: "Miércoles" },
  { key: 4, label: "Jueves" },
  { key: 5, label: "Viernes" },
  { key: 6, label: "Sábado" },
  { key: 0, label: "Domingo" },
]

const SLOT_OPTIONS = [
  { value: 15, label: "15 minutos" },
  { value: 30, label: "30 minutos" },
  { value: 45, label: "45 minutos" },
  { value: 60, label: "60 minutos" },
  { value: 90, label: "90 minutos" },
  { value: 120, label: "120 minutos" },
]

const FALLBACK = {
  slotMinutes: 60,
  minNoticeHours: 2,
  weekly: {
    0: { enabled: false, start: "09:00", end: "18:00" },
    1: { enabled: true, start: "09:00", end: "18:00" },
    2: { enabled: true, start: "09:00", end: "18:00" },
    3: { enabled: true, start: "09:00", end: "18:00" },
    4: { enabled: true, start: "09:00", end: "18:00" },
    5: { enabled: true, start: "09:00", end: "18:00" },
    6: { enabled: false, start: "09:00", end: "18:00" },
  },
  blockedDates: [],
  extraDates: [],
  extraStart: "09:00",
  extraEnd: "18:00",
}

function ymd(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
}

function formatDate(value, style = "long") {
  if (!value) return ""
  const [year, month, day] = value.split("-").map(Number)
  return new Intl.DateTimeFormat("es-AR", {
    weekday: style === "long" ? "long" : "short",
    day: "numeric",
    month: style === "long" ? "long" : "short",
  }).format(new Date(year, month - 1, day, 12))
}

function cloneSettings(value) {
  const source = value || FALLBACK
  const weekly = {}
  for (let day = 0; day <= 6; day += 1) {
    weekly[day] = { ...(source.weekly?.[day] || FALLBACK.weekly[day]) }
  }
  return {
    slotMinutes: source.slotMinutes || 60,
    minNoticeHours: Number.isFinite(source.minNoticeHours) ? source.minNoticeHours : 2,
    weekly,
    blockedDates: Array.isArray(source.blockedDates) ? [...source.blockedDates] : [],
    extraDates: Array.isArray(source.extraDates) ? [...source.extraDates] : [],
    extraStart: source.extraStart || "09:00",
    extraEnd: source.extraEnd || "18:00",
  }
}

function toMinutes(value) {
  const [hours, minutes] = String(value).split(":").map(Number)
  return hours * 60 + minutes
}

export default function AvailabilityManager({ open, onClose, requests = [], onSaved, onUnauthorized }) {
  const dialogRef = useRef(null)
  const callbacksRef = useRef({ onSaved, onUnauthorized })
  const [loadState, setLoadState] = useState({ loading: false, error: "" })
  const [settings, setSettings] = useState(() => cloneSettings(FALLBACK))
  const [blockDate, setBlockDate] = useState("")
  const [monthOffset, setMonthOffset] = useState(0)
  const [status, setStatus] = useState({ type: "idle", message: "" })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    callbacksRef.current = { onSaved, onUnauthorized }
  }, [onSaved, onUnauthorized])

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  useEffect(() => {
    if (!open) return undefined
    document.body.classList.add("admin-dialog-open")
    return () => document.body.classList.remove("admin-dialog-open")
  }, [open])

  useEffect(() => {
    if (!open) return undefined
    let active = true
    setLoadState({ loading: true, error: "" })
    setStatus({ type: "idle", message: "" })

    fetch("/api/availability?admin=1", {
      credentials: "same-origin",
      headers: { Accept: "application/json" },
    })
      .then(async (response) => {
        const data = await response.json().catch(() => ({}))
        if (!response.ok) {
          if (response.status === 401) callbacksRef.current.onUnauthorized?.()
          throw new Error(data.message || "No pudimos cargar la disponibilidad.")
        }
        if (active) setSettings(cloneSettings(data.settings))
      })
      .catch((error) => {
        if (active) setLoadState({ loading: false, error: error.message })
        return undefined
      })
      .finally(() => {
        if (active) setLoadState((previous) => ({ ...previous, loading: false }))
      })

    return () => {
      active = false
    }
  }, [open])

  const today = new Date().toISOString().slice(0, 10)
  const bookedCount = useMemo(() => {
    const counts = new Map()
    requests
      .filter((request) => request.status === "pending" || request.status === "confirmed")
      .forEach((request) => {
        counts.set(request.date, (counts.get(request.date) || 0) + 1)
      })
    return counts
  }, [requests])

  const upcoming = useMemo(
    () =>
      requests
        .filter(
          (request) =>
            (request.status === "pending" || request.status === "confirmed") &&
            request.date &&
            request.date >= today,
        )
        .slice()
        .sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`))
        .slice(0, 8),
    [requests, today],
  )

  const viewDate = new Date(new Date().getFullYear(), new Date().getMonth() + monthOffset, 1)
  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()
  const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const blockedSet = new Set(settings.blockedDates)
  const extraSet = new Set(settings.extraDates)
  const cells = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, index) => {
      const date = ymd(year, month, index + 1)
      const weekday = new Date(Date.UTC(year, month, index + 1, 12)).getUTCDay()
      const weeklyOpen = Boolean(settings.weekly[weekday]?.enabled)
      const blocked = blockedSet.has(date)
      const extra = extraSet.has(date)
      const past = date < today
      return {
        day: index + 1,
        date,
        open: (weeklyOpen || extra) && !blocked && !past,
        weeklyOpen,
        extra: extra && !blocked,
        blocked,
        past,
        closed: !weeklyOpen && !extra,
        booked: bookedCount.get(date) || 0,
      }
    }),
  ]

  const updateDay = (dayKey, patch) => {
    setSettings((previous) => ({
      ...previous,
      weekly: {
        ...previous.weekly,
        [dayKey]: { ...previous.weekly[dayKey], ...patch },
      },
    }))
  }

  const toggleDate = (cell) => {
    if (!cell || cell.past) return
    setSettings((previous) => {
      const blockedDates = previous.blockedDates.filter((date) => date !== cell.date)
      const extraDates = previous.extraDates.filter((date) => date !== cell.date)

      if (cell.blocked) {
        if (cell.weeklyOpen) return { ...previous, blockedDates, extraDates }
        return { ...previous, blockedDates, extraDates: [...extraDates, cell.date].sort() }
      }

      if (cell.weeklyOpen) {
        return { ...previous, blockedDates: [...blockedDates, cell.date].sort(), extraDates }
      }

      if (cell.extra) {
        return { ...previous, blockedDates, extraDates }
      }

      return { ...previous, blockedDates, extraDates: [...extraDates, cell.date].sort() }
    })
    setStatus({ type: "idle", message: "" })
  }

  const addBlockedDate = () => {
    if (!blockDate) {
      setStatus({ type: "error", message: "Elegí una fecha para bloquear." })
      return
    }
    if (blockedSet.has(blockDate)) {
      setStatus({ type: "error", message: "Esa fecha ya está bloqueada." })
      return
    }
    setSettings((previous) => ({
      ...previous,
      blockedDates: [...previous.blockedDates, blockDate].sort(),
      extraDates: previous.extraDates.filter((date) => date !== blockDate),
    }))
    setBlockDate("")
    setStatus({ type: "idle", message: "" })
  }

  const removeBlockedDate = (date) => {
    setSettings((previous) => ({
      ...previous,
      blockedDates: previous.blockedDates.filter((item) => item !== date),
    }))
  }

  const handleSave = async (event) => {
    event.preventDefault()
    if (saving) return

    for (const day of DAYS) {
      const current = settings.weekly[day.key]
      if (current.enabled && toMinutes(current.end) <= toMinutes(current.start)) {
        setStatus({ type: "error", message: `El horario de ${day.label.toLowerCase()} no es válido.` })
        return
      }
    }

    if (toMinutes(settings.extraEnd) <= toMinutes(settings.extraStart)) {
      setStatus({ type: "error", message: "El horario para días puntuales no es válido." })
      return
    }

    setSaving(true)
    setStatus({ type: "idle", message: "" })

    try {
      const response = await fetch("/api/availability", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        if (response.status === 401) callbacksRef.current.onUnauthorized?.()
        throw new Error(data.message || "No pudimos guardar la disponibilidad.")
      }
      setSettings(cloneSettings(data.settings))
      setStatus({ type: "success", message: "Disponibilidad actualizada." })
      callbacksRef.current.onSaved?.(data.settings)
    } catch (error) {
      setStatus({ type: "error", message: error.message })
    } finally {
      setSaving(false)
    }
  }

  return (
    <dialog
      ref={dialogRef}
      className="availability-dialog"
      onClose={onClose}
      onCancel={(event) => {
        event.preventDefault()
        onClose()
      }}
      aria-label="Configurar disponibilidad"
    >
      <form className="availability" onSubmit={handleSave}>
        <header className="availability__head">
          <div>
            <p className="admin-eyebrow">Agenda</p>
            <h2>Disponibilidad de reuniones</h2>
            <p>Definí horarios, bloqueá días y revisá los turnos ocupados.</p>
          </div>
          <button type="button" className="admin-icon-button" onClick={onClose} aria-label="Cerrar disponibilidad">
            <Icon name="x" size={18} />
          </button>
        </header>

        {loadState.loading ? (
          <div className="availability__loading" aria-live="polite">
            <span className="admin-spinner" aria-hidden="true" />
            Cargando configuración…
          </div>
        ) : null}

        {loadState.error ? (
          <p className="availability__alert is-error" role="alert">
            {loadState.error}
          </p>
        ) : null}

        <div className="availability__body">
          <section className="availability__panel">
            <div className="availability__panel-head">
              <h3>Horario semanal</h3>
              <span>Hora de Argentina</span>
            </div>

            <div className="availability-week">
              {DAYS.map((day) => {
                const current = settings.weekly[day.key]
                return (
                  <div className={`availability-day ${current.enabled ? "is-enabled" : ""}`} key={day.key}>
                    <label className="availability-day__toggle">
                      <input
                        type="checkbox"
                        checked={current.enabled}
                        onChange={(event) => updateDay(day.key, { enabled: event.target.checked })}
                      />
                      <span>{day.label}</span>
                    </label>
                    <div className="availability-day__hours">
                      <input
                        type="time"
                        value={current.start}
                        onChange={(event) => updateDay(day.key, { start: event.target.value })}
                        disabled={!current.enabled}
                        aria-label={`Hora de inicio del ${day.label}`}
                      />
                      <span>a</span>
                      <input
                        type="time"
                        value={current.end}
                        onChange={(event) => updateDay(day.key, { end: event.target.value })}
                        disabled={!current.enabled}
                        aria-label={`Hora de fin del ${day.label}`}
                      />
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="availability__settings">
              <label>
                Duración de cada turno
                <select
                  value={settings.slotMinutes}
                  onChange={(event) =>
                    setSettings((previous) => ({ ...previous, slotMinutes: Number(event.target.value) }))
                  }
                >
                  {SLOT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Aviso mínimo
                <span className="availability__input-suffix">
                  <input
                    type="number"
                    min="0"
                    max="72"
                    value={settings.minNoticeHours}
                    onChange={(event) =>
                      setSettings((previous) => ({
                        ...previous,
                        minNoticeHours: Math.max(0, Math.min(72, Number(event.target.value) || 0)),
                      }))
                    }
                  />
                  horas
                </span>
              </label>
              <label className="availability__settings-wide">
                Horario para días puntuales
                <span className="availability-day__hours">
                  <input
                    type="time"
                    value={settings.extraStart}
                    onChange={(event) =>
                      setSettings((previous) => ({ ...previous, extraStart: event.target.value }))
                    }
                    aria-label="Hora de inicio para días puntuales"
                  />
                  <span>a</span>
                  <input
                    type="time"
                    value={settings.extraEnd}
                    onChange={(event) =>
                      setSettings((previous) => ({ ...previous, extraEnd: event.target.value }))
                    }
                    aria-label="Hora de fin para días puntuales"
                  />
                </span>
                <small>Se usan al abrir un día cerrado desde el calendario.</small>
              </label>
            </div>
          </section>

          <section className="availability__panel">
            <div className="availability__panel-head">
              <h3>Bloqueos y agenda</h3>
              <span>{settings.blockedDates.length} días bloqueados</span>
            </div>

            <div className="availability__month-head">
              <button
                type="button"
                className="availability__nav"
                onClick={() => setMonthOffset((current) => current - 1)}
                aria-label="Mes anterior"
              >
                <Icon name="arrow-left" size={15} />
              </button>
              <strong>
                {MONTHS[month]} {year}
              </strong>
              <button
                type="button"
                className="availability__nav"
                onClick={() => setMonthOffset((current) => current + 1)}
                aria-label="Mes siguiente"
              >
                <Icon name="arrow-right" size={15} />
              </button>
            </div>

            <div className="availability__weekdays" aria-hidden="true">
              {WEEKDAYS.map((day) => (
                <span key={day}>{day}</span>
              ))}
            </div>
            <div className="availability__days">
              {cells.map((cell, index) =>
                cell ? (
                  <button
                    key={cell.date}
                    type="button"
                    className={`availability__day ${cell.closed ? "is-closed" : ""} ${cell.blocked ? "is-blocked" : ""} ${cell.past ? "is-past" : ""} ${cell.open ? "is-open" : ""} ${cell.extra ? "is-extra" : ""}`}
                    onClick={() => toggleDate(cell)}
                    disabled={cell.past}
                    aria-pressed={cell.open}
                    title={`${formatDate(cell.date)}${cell.blocked ? " · cerrado" : cell.open ? (cell.booked ? ` · ${cell.booked} turno(s)` : " · disponible") : " · cerrado"} · clic para ${cell.open ? "cerrar" : "abrir"}`}
                  >
                    {cell.day}
                    {cell.booked ? <b>{cell.booked}</b> : null}
                  </button>
                ) : (
                  <span key={`empty-${index}`} />
                ),
              )}
            </div>

            <p className="availability__calendar-hint">
              Hacé clic en un día para abrirlo o cerrarlo. Los días cerrados usan el horario para días puntuales.
            </p>

            <div className="availability__legend">
              <span>
                <i className="is-open" /> Disponible
              </span>
              <span>
                <i className="is-extra" /> Día puntual
              </span>
              <span>
                <i className="is-blocked" /> Cerrado
              </span>
              <span>
                <i className="is-closed" /> Sin horario
              </span>
            </div>

            <div className="availability__blocker">
              <label htmlFor="availability-block-date">Bloquear un día completo</label>
              <div>
                <input
                  id="availability-block-date"
                  type="date"
                  min={today}
                  value={blockDate}
                  onChange={(event) => setBlockDate(event.target.value)}
                />
                <button type="button" className="admin-button" onClick={addBlockedDate}>
                  <Icon name="plus" size={15} />
                  Bloquear
                </button>
              </div>
            </div>

            {settings.blockedDates.length ? (
              <ul className="availability__chips">
                {settings.blockedDates.map((date) => (
                  <li key={date}>
                    {formatDate(date, "short")}
                    <button type="button" onClick={() => removeBlockedDate(date)} aria-label={`Desbloquear ${date}`}>
                      <Icon name="x" size={12} />
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="availability__empty">No hay días bloqueados.</p>
            )}
          </section>

          <section className="availability__panel availability__panel--wide">
            <div className="availability__panel-head">
              <h3>Próximos turnos ocupados</h3>
              <span>{upcoming.length} visibles</span>
            </div>
            {upcoming.length ? (
              <ul className="availability__agenda">
                {upcoming.map((request) => (
                  <li key={request.id}>
                    <span>
                      <strong>{formatDate(request.date, "short")}</strong>
                      {request.time} h
                    </span>
                    <span>{request.name}</span>
                    <span className={`availability__status is-${request.status}`}>
                      {request.status === "confirmed" ? "Confirmada" : "Pendiente"}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="availability__empty">Todavía no hay turnos reservados.</p>
            )}
          </section>
        </div>

        <footer className="availability__foot">
          {status.message ? (
            <p className={`availability__alert ${status.type === "error" ? "is-error" : "is-success"}`} role="status">
              {status.message}
            </p>
          ) : (
            <p className="availability__hint">Los cambios impactan en el calendario público al guardar.</p>
          )}
          <div>
            <button type="button" className="admin-button" onClick={onClose}>
              Cerrar
            </button>
            <button type="submit" className="admin-button admin-button--accent" disabled={saving || loadState.loading}>
              {saving ? "Guardando…" : "Guardar disponibilidad"}
              <Icon name="check" size={16} />
            </button>
          </div>
        </footer>
      </form>
    </dialog>
  )
}
