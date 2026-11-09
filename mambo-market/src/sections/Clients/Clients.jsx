import { useState } from "react"
import Icon from "../../components/Icon"
import { CLIENT_GROUPS, CLIENT_NAMES, OFFICES } from "../../data/siteData"
import { useLocalTime } from "../../hooks/useUI"
import "./Clients.css"

function OfficeRow({ office }) {
  const time = useLocalTime(office.timeZone)

  return (
    <div className="office-row">
      <div className="office-row__main">
        <span className="office-row__role">{office.role}</span>
        <h4>
          {office.shortCity}
          {office.country !== office.shortCity ? <span>{office.country}</span> : null}
        </h4>
        <p>{office.coords}</p>
      </div>
      <div className="office-row__time">
        <Icon name="clock" size={14} />
        <span>{time || "--:--"}</span>
        <small>Hora local</small>
      </div>
    </div>
  )
}

export default function Clients() {
  const [paused, setPaused] = useState(false)

  return (
    <section id="clientes" className="section clients">
      <div className="container">
        <div className="section-head">
          <p className="section-label">04 — Clientes & cobertura</p>
          <h2 className="section-title" data-reveal>
            Marcas que ya
            <br />
            <span className="serif">decidieron</span>
            <br />
            con datos.
          </h2>
          <p className="section-aside" data-reveal style={{ "--reveal-delay": "120ms" }}>
            Más de 200 organizaciones en América Latina, Europa y Medio Oriente confían en nuestros estudios.
          </p>
        </div>
      </div>

      <div className="clients__band" data-paused={paused}>
        <div className="container clients__band-inner">
          <span>Selección de clientes — 2007 / 2026</span>
          <button
            type="button"
            className="clients__pause"
            aria-pressed={paused}
            onClick={() => setPaused((value) => !value)}
          >
            {paused ? "Reanudar movimiento" : "Pausar movimiento"}
            <Icon name={paused ? "play" : "pause"} size={12} />
          </button>
        </div>

        <div className="clients__marquee marquee">
          <div className="clients__track marquee-track" style={{ "--marquee-duration": "48s" }}>
            {[0, 1].map((copy) => (
              <div className="clients__group marquee-group" key={copy} aria-hidden={copy === 1 ? "true" : undefined}>
                {CLIENT_NAMES.map((name, index) => (
                  <span className="clients__item" key={`${copy}-${name}`}>
                    <span className={`clients__name ${index % 2 === 1 ? "is-outline" : ""}`}>{name}</span>
                    <Icon name="spark" size={15} className="clients__sep" />
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="container">
        <div className="clients__categories">
          {CLIENT_GROUPS.map((group, index) => (
            <div className="clients__category" key={group.title} data-reveal style={{ "--reveal-delay": `${index * 70}ms` }}>
              <h3>{group.title}</h3>
              <ul>
                {group.clients.map((client) => (
                  <li key={client}>{client}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="coverage-panel" data-reveal>
          <div className="coverage-panel__head">
            <div>
              <p className="coverage-panel__label">Alcance global</p>
              <h3>
                Tres oficinas.
                <br />
                <span className="serif">Una misma obsesión.</span>
              </h3>
            </div>
            <p>
              Investigación local con estándares globales. Equipos en América, Europa y Medio Oriente, coordinados en
              una sola metodología.
            </p>
          </div>

          <div className="coverage-panel__body">
            <div className="coverage-map" role="img" aria-label="Mapa de cobertura con oficinas en Tucumán, España y Emiratos Árabes Unidos">
              <svg viewBox="0 0 600 340" fill="none" aria-hidden="true">
                <defs>
                  <pattern id="map-dots" width="18" height="18" patternUnits="userSpaceOnUse">
                    <circle cx="1.5" cy="1.5" r="1.2" fill="rgba(244,241,234,.15)" />
                  </pattern>
                </defs>
                <rect width="600" height="340" fill="url(#map-dots)" />
                <ellipse cx="300" cy="170" rx="250" ry="118" stroke="rgba(244,241,234,.13)" strokeDasharray="3 7" />
                <ellipse cx="300" cy="170" rx="172" ry="82" stroke="rgba(244,241,234,.08)" />
                <path
                  d="M150 207c50-50 108-84 132-85"
                  stroke="#ff6b2c"
                  strokeOpacity=".5"
                  strokeDasharray="4 7"
                  className="coverage-map__route"
                />
                <path
                  d="M282 122c58-14 108 28 150 55"
                  stroke="#ff6b2c"
                  strokeOpacity=".5"
                  strokeDasharray="4 7"
                  className="coverage-map__route"
                />
                <path d="M300 52v236M120 170h360" stroke="rgba(244,241,234,.07)" />
              </svg>

              {OFFICES.map((office) => (
                <div className="map-point" style={office.point} key={office.id}>
                  <span className="map-point__ping" aria-hidden="true" />
                  <span className="map-point__dot" aria-hidden="true" />
                  <span className="map-point__label">
                    {office.shortCity}
                    <em>{office.id.toUpperCase()}</em>
                  </span>
                </div>
              ))}

              <span className="coverage-map__coord coverage-map__coord--tl" aria-hidden="true">
                26° S / 65° O
              </span>
              <span className="coverage-map__coord coverage-map__coord--br" aria-hidden="true">
                25° N / 55° E
              </span>
            </div>

            <div className="coverage-offices">
              {OFFICES.map((office) => (
                <OfficeRow key={office.id} office={office} />
              ))}
            </div>
          </div>

          <div className="coverage-panel__foot">
            <p>
              <Icon name="layers" size={15} />
              Asociaciones estratégicas
            </p>
            <p>
              Consultoras internacionales, universidades de prestigio y organizaciones especializadas en investigación
              de mercados.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
