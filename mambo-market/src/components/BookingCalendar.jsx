import { useEffect, useMemo, useState } from "react"
import Icon from "./Icon"
import "./BookingCalendar.css"

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

function ymd(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
}

function formatSelectedDate(value) {
  if (!value) return ""
  const [year, month, day] = value.split("-").map(Number)
  return new Intl.DateTimeFormat("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date(year, month - 1, day, 12))
}

export default function BookingCalendar({ value, onChange, id = "booking-calendar" }) {
  const [state, setState] = useState({ loading: true, error: "", days: [], slotMinutes: 60 })
  const [monthOffset, setMonthOffset] = useState(0)
  const [selectedDate, setSelectedDate] = useState(value?.date || "")
  const [selectedTime, setSelectedTime] = useState(value?.time || "")

  const load = async () => {
    setState((previous) => ({ ...previous, loading: true, error: "" }))
    try {
      const response = await fetch("/api/availability", { headers: { Accept: "application/json" } })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.message || "No pudimos cargar la disponibilidad.")
      setState({ loading: false, error: "", days: data.days || [], slotMinutes: data.slotMinutes || 60 })
    } catch (error) {
      setState({ loading: false, error: error.message, days: [], slotMinutes: 60 })
    }
  }

  useEffect(() => {
    load()
  }, [])

  useEffect(() => {
    setSelectedDate(value?.date || "")
    setSelectedTime(value?.time || "")
  }, [value?.date, value?.time])

  const dayMap = useMemo(() => new Map(state.days.map((day) => [day.date, day])), [state.days])
  const today = new Date()
  const viewDate = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1)
  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()
  const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, index) => {
      const date = ymd(year, month, index + 1)
      return { day: index + 1, date, entry: dayMap.get(date) }
    }),
  ]

  const selectedEntry = selectedDate ? dayMap.get(selectedDate) : null
  const slots = selectedEntry?.slots || []
  const availableDays = state.days.filter((day) => day.available).length

  const selectDay = (date, entry) => {
    if (!entry?.available) return
    setSelectedDate(date)
    setSelectedTime("")
    onChange?.({ date, time: "" })
  }

  const selectTime = (time) => {
    setSelectedTime(time)
    onChange?.({ date: selectedDate, time })
  }

  return (
    <div className="booking-calendar" id={id}>
      <div className="booking-calendar__head">
        <div>
          <p className="booking-calendar__label">Fecha y horario</p>
          <p className="booking-calendar__timezone">Hora de Argentina (GMT-3)</p>
        </div>
        <span className="booking-calendar__count">{availableDays} días con turnos</span>
      </div>

      {state.loading ? (
        <div className="booking-calendar__loading" aria-live="polite">
          <span className="booking-calendar__spinner" aria-hidden="true" />
          Cargando disponibilidad…
        </div>
      ) : null}

      {state.error ? (
        <div className="booking-calendar__error" role="alert">
          <p>{state.error}</p>
          <button type="button" className="btn btn--ghost" onClick={load}>
            Reintentar
            <Icon name="refresh" size={15} />
          </button>
        </div>
      ) : null}

      {!state.loading && !state.error ? (
        <>
          <div className="booking-calendar__body">
            <div className="booking-calendar__month">
              <div className="booking-calendar__month-head">
                <button
                  type="button"
                  className="booking-calendar__nav"
                  onClick={() => setMonthOffset((current) => Math.max(0, current - 1))}
                  disabled={monthOffset === 0}
                  aria-label="Mes anterior"
                >
                  <Icon name="arrow-left" size={15} />
                </button>
                <strong>
                  {MONTHS[month]} {year}
                </strong>
                <button
                  type="button"
                  className="booking-calendar__nav"
                  onClick={() => setMonthOffset((current) => Math.min(2, current + 1))}
                  disabled={monthOffset === 2}
                  aria-label="Mes siguiente"
                >
                  <Icon name="arrow-right" size={15} />
                </button>
              </div>

              <div className="booking-calendar__weekdays" aria-hidden="true">
                {WEEKDAYS.map((day) => (
                  <span key={day}>{day}</span>
                ))}
              </div>

              <div className="booking-calendar__days">
                {cells.map((cell, index) =>
                  cell ? (
                    <button
                      key={cell.date}
                      type="button"
                      className={`booking-calendar__day ${cell.entry?.available ? "is-available" : ""} ${selectedDate === cell.date ? "is-selected" : ""}`}
                      onClick={() => selectDay(cell.date, cell.entry)}
                      disabled={!cell.entry?.available}
                      aria-pressed={selectedDate === cell.date}
                      aria-label={`${cell.date}${cell.entry?.available ? `, ${cell.entry.slots.length} horarios disponibles` : ", sin disponibilidad"}`}
                    >
                      <span>{cell.day}</span>
                      {cell.entry?.available ? <i aria-hidden="true" /> : null}
                    </button>
                  ) : (
                    <span key={`empty-${index}`} className="booking-calendar__empty" />
                  ),
                )}
              </div>
            </div>

            <div className="booking-calendar__slots">
              {selectedDate ? (
                <>
                  <p className="booking-calendar__selected-date">{formatSelectedDate(selectedDate)}</p>
                  {slots.length ? (
                    <div className="booking-calendar__slot-grid" role="group" aria-label="Horarios disponibles">
                      {slots.map((time) => (
                        <button
                          key={time}
                          type="button"
                          className={selectedTime === time ? "is-selected" : ""}
                          onClick={() => selectTime(time)}
                          aria-pressed={selectedTime === time}
                        >
                          {time} h
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="booking-calendar__empty-text">No quedan horarios disponibles ese día.</p>
                  )}
                </>
              ) : (
                <p className="booking-calendar__empty-text">
                  Elegí un día disponible en el calendario para ver los horarios.
                </p>
              )}
            </div>
          </div>

          <p className="booking-calendar__summary" aria-live="polite">
            {selectedDate && selectedTime
              ? `Seleccionaste ${formatSelectedDate(selectedDate)} a las ${selectedTime} h.`
              : "Los días y horarios ocupados no se muestran como disponibles."}
          </p>
        </>
      ) : null}
    </div>
  )
}
