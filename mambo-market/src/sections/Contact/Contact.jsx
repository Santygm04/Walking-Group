import { useEffect, useState } from "react"
import Icon from "../../components/Icon"
import {
  BUDGET_OPTIONS,
  CONTACT_EMAIL,
  CONTACT_PHONE_DISPLAY,
  CONTACT_PHONE_HREF,
  OFFICES,
  SERVICE_OPTIONS,
  TIME_OPTIONS,
  URGENCY_OPTIONS,
  WHATSAPP_NUMBER,
} from "../../data/siteData"
import "./Contact.css"

const INITIAL_FORM = {
  nombre: "",
  empresa: "",
  email: "",
  telefono: "",
  tipoServicio: "",
  presupuesto: "",
  urgencia: "",
  fechaPreferida: "",
  horaPreferida: "",
  mensaje: "",
}

function buildMessage(form) {
  return [
    "*CONSULTA PROFESIONAL — MAMBO MARKET*",
    "",
    "*DATOS DEL CLIENTE*",
    `• Nombre: ${form.nombre}`,
    `• Empresa: ${form.empresa}`,
    `• Email: ${form.email}`,
    `• Teléfono: ${form.telefono}`,
    "",
    "*SERVICIO SOLICITADO*",
    `• Tipo: ${form.tipoServicio}`,
    `• Presupuesto: ${form.presupuesto || "A definir"}`,
    `• Urgencia: ${form.urgencia || "A definir"}`,
    "",
    "*REUNIÓN PREFERIDA*",
    `• Fecha: ${form.fechaPreferida || "A coordinar"}`,
    `• Hora: ${form.horaPreferida || "A coordinar"}`,
    "",
    "*DETALLES DEL PROYECTO*",
    form.mensaje,
    "",
    "—",
    "Enviado desde mambomarket.com",
  ].join("\n")
}

export default function Contact({ selectedService, selectionToken }) {
  const [form, setForm] = useState(INITIAL_FORM)
  const [highlighted, setHighlighted] = useState(false)
  const [status, setStatus] = useState({ type: "idle", message: "", fallback: "" })

  useEffect(() => {
    if (!selectedService) return undefined
    setForm((previous) => ({ ...previous, tipoServicio: selectedService }))
    setHighlighted(true)
    const timer = window.setTimeout(() => setHighlighted(false), 2600)
    return () => window.clearTimeout(timer)
  }, [selectedService, selectionToken])

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((previous) => ({ ...previous, [name]: value }))
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(buildMessage(form))}`
    const opened = window.open(url, "_blank")

    if (opened) {
      opened.opener = null
      setStatus({
        type: "success",
        message: "Abrimos WhatsApp en una pestaña nueva con el resumen de tu consulta.",
        fallback: "",
      })
      return
    }

    setStatus({
      type: "error",
      message: "No pudimos abrir WhatsApp automáticamente.",
      fallback: url,
    })
  }

  const minDate = new Date().toISOString().split("T")[0]

  return (
    <section id="contacto" className="section contact">
      <div className="container">
        <div className="contact-panel">
          <div className="contact-panel__intro">
            <p className="section-label">05 — Contacto</p>
            <h2 className="contact-panel__title" data-reveal>
              Hablemos de tu próximo <span className="accent">proyecto.</span>
            </h2>
            <p className="contact__lead" data-reveal style={{ "--reveal-delay": "120ms" }}>
              Contanos qué necesitás entender. Te respondemos con alcance, tiempos y un plan de estudio a medida.
            </p>

            <div className="contact__direct" data-reveal style={{ "--reveal-delay": "200ms" }}>
              <a
                className="contact__direct-item"
                href={`https://wa.me/${WHATSAPP_NUMBER}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <span className="contact__direct-icon">
                  <Icon name="whatsapp" size={19} />
                </span>
                <span>
                  <small>WhatsApp directo</small>
                  <strong>{CONTACT_PHONE_DISPLAY}</strong>
                </span>
                <Icon name="arrow-up-right" size={18} className="contact__direct-arrow" />
              </a>

              <a className="contact__direct-item" href={`mailto:${CONTACT_EMAIL}`}>
                <span className="contact__direct-icon">
                  <Icon name="mail" size={19} />
                </span>
                <span>
                  <small>Email</small>
                  <strong>{CONTACT_EMAIL}</strong>
                </span>
                <Icon name="arrow-up-right" size={18} className="contact__direct-arrow" />
              </a>

              <a className="contact__direct-item" href={`tel:${CONTACT_PHONE_HREF}`}>
                <span className="contact__direct-icon">
                  <Icon name="phone" size={19} />
                </span>
                <span>
                  <small>Teléfono</small>
                  <strong>Llamar ahora</strong>
                </span>
                <Icon name="arrow-up-right" size={18} className="contact__direct-arrow" />
              </a>
            </div>

            <div className="contact__promise" data-reveal style={{ "--reveal-delay": "280ms" }}>
              <span aria-hidden="true" />
              <p>
                <strong>Respuesta en menos de 24 h hábiles.</strong> Sin intermediarios: hablás directo con el equipo.
              </p>
            </div>

            <div className="contact__offices" data-reveal style={{ "--reveal-delay": "340ms" }}>
              {OFFICES.map((office) => (
                <span key={office.id}>
                  {office.shortCity}
                  {office.country !== office.shortCity ? <em>{office.country}</em> : null}
                </span>
              ))}
            </div>
          </div>

          <div className="contact-panel__form" data-reveal="right" style={{ "--reveal-delay": "120ms" }}>
            <form className="contact-form" onSubmit={handleSubmit}>
              <div className="contact-form__head">
                <div>
                  <p className="contact-form__kicker">Formulario / 01</p>
                  <h3>Contanos del proyecto</h3>
                </div>
                <span className="contact-form__badge">Respuesta &lt; 24 h</span>
              </div>

              <p className="contact-form__hint">
                Completá los datos y te enviamos una propuesta a medida. Los campos con <span>*</span> son obligatorios.
              </p>

              <fieldset className="form-section">
                <legend>
                  <span>01</span> Tus datos
                </legend>
                <div className="form-grid">
                <div className="field">
                  <label htmlFor="nombre">
                    Nombre completo <span aria-hidden="true">*</span>
                  </label>
                  <input
                    type="text"
                    id="nombre"
                    name="nombre"
                    value={form.nombre}
                    onChange={handleChange}
                    autoComplete="name"
                    placeholder="Tu nombre"
                    required
                  />
                </div>

                <div className="field">
                  <label htmlFor="empresa">
                    Empresa / organización <span aria-hidden="true">*</span>
                  </label>
                  <input
                    type="text"
                    id="empresa"
                    name="empresa"
                    value={form.empresa}
                    onChange={handleChange}
                    autoComplete="organization"
                    placeholder="Nombre de tu empresa"
                    required
                  />
                </div>

                <div className="field">
                  <label htmlFor="email">
                    Email corporativo <span aria-hidden="true">*</span>
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    autoComplete="email"
                    placeholder="nombre@empresa.com"
                    required
                  />
                </div>

                <div className="field">
                  <label htmlFor="telefono">
                    Teléfono <span aria-hidden="true">*</span>
                  </label>
                  <input
                    type="tel"
                    id="telefono"
                    name="telefono"
                    value={form.telefono}
                    onChange={handleChange}
                    autoComplete="tel"
                    placeholder="+54 9 381 ..."
                    required
                  />
                </div>
                </div>
              </fieldset>

              <fieldset className="form-section">
                <legend>
                  <span>02</span> Tu proyecto
                </legend>
                <div className="form-grid">
                <div className={`field field--full ${highlighted ? "is-highlighted" : ""}`}>
                  <label htmlFor="tipoServicio">
                    Servicio de interés <span aria-hidden="true">*</span>
                  </label>
                  <select
                    id="tipoServicio"
                    name="tipoServicio"
                    value={form.tipoServicio}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Seleccionar servicio…</option>
                    {SERVICE_OPTIONS.map((option) => (
                      <option value={option} key={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="field">
                  <label htmlFor="presupuesto">Presupuesto estimado</label>
                  <select id="presupuesto" name="presupuesto" value={form.presupuesto} onChange={handleChange}>
                    <option value="">Seleccionar rango…</option>
                    {BUDGET_OPTIONS.map((option) => (
                      <option value={option} key={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="field">
                  <label htmlFor="urgencia">Urgencia del proyecto</label>
                  <select id="urgencia" name="urgencia" value={form.urgencia} onChange={handleChange}>
                    <option value="">Seleccionar urgencia…</option>
                    {URGENCY_OPTIONS.map((option) => (
                      <option value={option} key={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="field field--full">
                  <label htmlFor="mensaje">
                    Detalles del proyecto <span aria-hidden="true">*</span>
                  </label>
                  <textarea
                    id="mensaje"
                    name="mensaje"
                    value={form.mensaje}
                    onChange={handleChange}
                    placeholder="Describí tu proyecto, objetivos, mercado objetivo y cualquier dato que nos ayude a preparar una propuesta personalizada."
                    required
                  />
                </div>
                </div>
              </fieldset>

              <fieldset className="form-section">
                <legend>
                  <span>03</span> Reunión <em>opcional</em>
                </legend>
                <div className="form-grid">
                <div className="field">
                  <label htmlFor="fechaPreferida">Fecha preferida</label>
                  <input
                    type="date"
                    id="fechaPreferida"
                    name="fechaPreferida"
                    value={form.fechaPreferida}
                    onChange={handleChange}
                    min={minDate}
                  />
                </div>

                <div className="field">
                  <label htmlFor="horaPreferida">Hora preferida</label>
                  <select id="horaPreferida" name="horaPreferida" value={form.horaPreferida} onChange={handleChange}>
                    <option value="">Seleccionar hora…</option>
                    {TIME_OPTIONS.map((option) => (
                      <option value={option} key={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>

                </div>
              </fieldset>

              <button type="submit" className="btn btn--full contact-form__submit">
                Enviar consulta por WhatsApp
                <span className="btn__icon">
                  <Icon name="whatsapp" size={18} />
                </span>
              </button>

              <p className="contact-form__note">
                Se abre WhatsApp con el resumen de tu consulta. No almacenamos datos en este sitio.
              </p>

              <div className={`contact-form__status contact-form__status--${status.type}`} aria-live="polite" role="status">
                {status.message ? (
                  <>
                    <Icon name={status.type === "error" ? "arrow-up-right" : "check"} size={16} />
                    <span>
                      {status.message}{" "}
                      {status.fallback ? (
                        <a href={status.fallback} target="_blank" rel="noopener noreferrer">
                          Abrir WhatsApp manualmente
                        </a>
                      ) : null}
                    </span>
                  </>
                ) : null}
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>
  )
}
