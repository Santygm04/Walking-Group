import Icon from "../../components/Icon"
import { CLIENT_GROUPS, OFFICES } from "../../data/siteData"
import { useLocalTime } from "../../hooks/useUI"
import "./Clients.css"

function OfficeCard({ office }) {
  const time = useLocalTime(office.timeZone)

  return (
    <article className="office-card">
      <div className="office-card__top">
        <span className="office-card__role">{office.role}</span>
        <span className="office-card__time">
          <Icon name="clock" size={13} />
          {time || "--:--"}
        </span>
      </div>
      <h4>{office.shortCity}</h4>
      {office.country !== office.shortCity ? <p className="office-card__country">{office.country}</p> : null}
      <p className="office-card__coords">{office.coords}</p>
    </article>
  )
}

export default function Clients() {
  return (
    <section id="clientes" className="section clients">
      <div className="container">
        <div className="section-head">
          <p className="section-label">04 — Clientes &amp; cobertura</p>
          <h2 className="section-title" data-reveal>
            Marcas que confían en <span className="accent">nuestros datos.</span>
          </h2>
          <p className="section-aside" data-reveal style={{ "--reveal-delay": "100ms" }}>
            Más de 200 organizaciones en América Latina, Europa y Medio Oriente trabajan con nuestros estudios.
          </p>
        </div>

        <div className="clients__grid">
          {CLIENT_GROUPS.map((group, index) => (
            <article className="client-group" key={group.title} data-reveal style={{ "--reveal-delay": `${index * 60}ms` }}>
              <h3>{group.title}</h3>
              <ul>
                {group.clients.map((client) => (
                  <li key={client}>{client}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>

        <div className="coverage" data-reveal>
          <div className="coverage__head">
            <div>
              <p className="coverage__label">Alcance global</p>
              <h3>Tres oficinas. Una misma mirada.</h3>
            </div>
            <p>
              Investigación local con estándares globales. Equipos en América, Europa y Medio Oriente coordinados bajo
              una sola metodología.
            </p>
          </div>

          <div className="coverage__body">
            <div className="coverage__map" role="img" aria-label="Mapa de cobertura con oficinas en Tucumán, España y Emiratos Árabes Unidos">
              <svg viewBox="0 0 600 300" fill="none" aria-hidden="true">
                <defs>
                  <pattern id="map-dots" width="18" height="18" patternUnits="userSpaceOnUse">
                    <circle cx="1.5" cy="1.5" r="1.2" fill="rgba(14,26,38,.16)" />
                  </pattern>
                </defs>
                <rect width="600" height="300" fill="url(#map-dots)" />
                <ellipse cx="300" cy="150" rx="250" ry="108" stroke="rgba(14,26,38,.1)" strokeDasharray="3 7" />
                <ellipse cx="300" cy="150" rx="172" ry="74" stroke="rgba(14,26,38,.07)" />
                <path d="M150 183c50-45 108-77 132-78" stroke="#e8632c" strokeOpacity=".55" strokeDasharray="4 7" />
                <path d="M282 105c58-12 108 26 150 50" stroke="#e8632c" strokeOpacity=".55" strokeDasharray="4 7" />
                <path d="M300 44v212M120 150h360" stroke="rgba(14,26,38,.06)" />
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

              <span className="coverage__coord" aria-hidden="true">
                LATAM · EU · MIDDLE EAST
              </span>
            </div>

            <div className="coverage__offices">
              {OFFICES.map((office) => (
                <OfficeCard key={office.id} office={office} />
              ))}
            </div>
          </div>

          <div className="coverage__foot">
            <span>
              <Icon name="layers" size={15} />
              Asociaciones estratégicas
            </span>
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
