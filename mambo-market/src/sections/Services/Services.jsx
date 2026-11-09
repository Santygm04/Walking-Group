import Icon from "../../components/Icon"
import { SERVICES } from "../../data/siteData"
import "./Services.css"

function ServiceGlyph({ type }) {
  const props = {
    viewBox: "0 0 96 48",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.6",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": "true",
    className: "service__glyph",
  }

  if (type === "bars") {
    return (
      <svg {...props}>
        <path d="M2 46h92" opacity=".35" strokeDasharray="2 4" />
        <rect x="8" y="27" width="8" height="19" fill="currentColor" stroke="none" opacity=".45" />
        <rect x="22" y="17" width="8" height="29" fill="currentColor" stroke="none" opacity=".6" />
        <rect x="36" y="33" width="8" height="13" fill="currentColor" stroke="none" opacity=".35" />
        <rect x="50" y="9" width="8" height="37" fill="currentColor" stroke="none" opacity=".8" />
        <rect x="64" y="22" width="8" height="24" fill="currentColor" stroke="none" opacity=".55" />
        <rect x="78" y="4" width="8" height="42" fill="currentColor" stroke="none" />
      </svg>
    )
  }

  if (type === "curve") {
    return (
      <svg {...props}>
        <path d="M4 42h88M4 42V4" opacity=".35" strokeDasharray="2 4" />
        <path d="M6 10c18 2 26 10 34 18s16 10 28 4 16-12 22-14" strokeWidth="2" />
        <path d="M6 10c18 2 26 10 34 18s16 10 28 4 16-12 22-14v24H6Z" fill="currentColor" stroke="none" opacity=".08" />
        <circle cx="40" cy="28" r="3.5" fill="currentColor" stroke="none" />
        <circle cx="68" cy="32" r="3.5" fill="currentColor" stroke="none" />
        <path d="M40 8v8M68 40v4" opacity=".5" />
      </svg>
    )
  }

  if (type === "nodes") {
    return (
      <svg {...props}>
        <path d="M20 36 46 14l28 8M20 36l26 4 28-18M46 14v26" opacity=".45" strokeDasharray="3 4" />
        <circle cx="20" cy="36" r="5" fill="currentColor" stroke="none" opacity=".55" />
        <circle cx="46" cy="14" r="7" fill="currentColor" stroke="none" />
        <circle cx="74" cy="22" r="4" fill="currentColor" stroke="none" opacity=".7" />
        <circle cx="46" cy="40" r="4" fill="currentColor" stroke="none" opacity=".7" />
      </svg>
    )
  }

  if (type === "orbit") {
    return (
      <svg {...props}>
        <circle cx="48" cy="24" r="9" fill="currentColor" stroke="none" />
        <ellipse cx="48" cy="24" rx="34" ry="13" transform="rotate(-16 48 24)" opacity=".55" />
        <ellipse cx="48" cy="24" rx="24" ry="22" transform="rotate(28 48 24)" opacity=".3" strokeDasharray="3 4" />
        <circle cx="76" cy="15" r="3.5" fill="currentColor" stroke="none" />
        <circle cx="25" cy="36" r="2.5" fill="currentColor" stroke="none" opacity=".6" />
      </svg>
    )
  }

  if (type === "shelf") {
    return (
      <svg {...props}>
        <path d="M4 14h88M4 30h88M4 46h88" opacity=".4" />
        <rect x="12" y="7" width="8" height="7" fill="currentColor" stroke="none" opacity=".5" />
        <rect x="24" y="5" width="6" height="9" fill="currentColor" stroke="none" opacity=".8" />
        <rect x="36" y="8" width="9" height="6" fill="currentColor" stroke="none" opacity=".35" />
        <rect x="55" y="4" width="7" height="10" fill="currentColor" stroke="none" />
        <rect x="67" y="7" width="9" height="7" fill="currentColor" stroke="none" opacity=".55" />
        <rect x="14" y="22" width="7" height="8" fill="currentColor" stroke="none" opacity=".7" />
        <rect x="27" y="20" width="10" height="10" fill="currentColor" stroke="none" />
        <rect x="44" y="24" width="6" height="6" fill="currentColor" stroke="none" opacity=".45" />
        <rect x="62" y="21" width="8" height="9" fill="currentColor" stroke="none" opacity=".7" />
        <rect x="18" y="37" width="9" height="9" fill="currentColor" stroke="none" opacity=".5" />
        <rect x="34" y="35" width="7" height="11" fill="currentColor" stroke="none" opacity=".75" />
        <rect x="50" y="38" width="10" height="8" fill="currentColor" stroke="none" />
        <rect x="68" y="36" width="6" height="10" fill="currentColor" stroke="none" opacity=".4" />
      </svg>
    )
  }

  return (
    <svg {...props}>
      <path d="M14 40a34 34 0 0 1 68 0" strokeWidth="2" />
      <path d="M24 40a24 24 0 0 1 48 0" opacity=".35" />
      <path d="M48 40 63 22" strokeWidth="2" />
      <circle cx="48" cy="40" r="3.5" fill="currentColor" stroke="none" />
      <path d="M15 40h6M75 40h6M24 20l4 4M72 20l-4 4" opacity=".6" />
    </svg>
  )
}

export default function Services({ onSelectService }) {
  return (
    <section id="servicios" className="section services">
      <div className="container">
        <div className="section-head">
          <p className="section-label">02 — Servicios</p>
          <h2 className="section-title" data-reveal>
            Seis formas de
            <br />
            <span className="serif">entender</span>
            <br />
            tu mercado.
          </h2>
          <p className="section-aside" data-reveal style={{ "--reveal-delay": "120ms" }}>
            Del diagnóstico a la acción: cada estudio se diseña a medida del problema que necesitás resolver.
          </p>
        </div>

        <div className="services__bento">
          {SERVICES.map((service, index) => (
            <article
              key={service.title}
              className={`service-card ${service.featured ? "service-card--featured" : ""}`}
              data-reveal
              style={{ "--reveal-delay": `${index * 70}ms` }}
            >
              <div className="service-card__top">
                <span className="service-card__index">{service.index}</span>
                <span className="service-card__icon">
                  <Icon name={service.icon} size={21} />
                </span>
                <ServiceGlyph type={service.visual} />
              </div>

              <div className="service-card__body">
                <h3>{service.title}</h3>
                <p>{service.description}</p>
                <ul className="service-card__tags" aria-label={`Especialidades de ${service.title}`}>
                  {service.tags.map((tag) => (
                    <li key={tag}>{tag}</li>
                  ))}
                </ul>
              </div>

              <button className="service-card__cta" type="button" onClick={() => onSelectService(service.offer)}>
                Solicitar este estudio
                <Icon name="arrow-up-right" size={16} />
              </button>
            </article>
          ))}
        </div>

        <div className="services__foot" data-reveal>
          <p>
            <strong>+40 tipos de estudios especializados.</strong> Si no está en la lista, lo diseñamos.
          </p>
          <a className="link-line" href="#contacto">
            Contanos tu caso
            <Icon name="arrow-up-right" size={14} />
          </a>
        </div>
      </div>
    </section>
  )
}
