import Icon from "../../components/Icon"
import { SERVICES } from "../../data/siteData"
import "./Services.css"

export default function Services({ onSelectService }) {
  return (
    <section id="servicios" className="section services">
      <div className="container">
        <div className="section-head">
          <p className="section-label">02 — Servicios</p>
          <h2 className="section-title" data-reveal>
            Servicios diseñados para <span className="accent">decidir mejor.</span>
          </h2>
          <p className="section-aside" data-reveal style={{ "--reveal-delay": "100ms" }}>
            Del diagnóstico a la acción: cada estudio se diseña a medida del problema que necesitás resolver.
          </p>
        </div>

        <div className="services__grid">
          {SERVICES.map((service, index) => (
            <article
              key={service.title}
              className="service-card"
              data-reveal
              style={{ "--reveal-delay": `${index * 60}ms` }}
            >
              <div className="service-card__head">
                <span className="service-card__icon">
                  <Icon name={service.icon} size={21} />
                </span>
                <span className="service-card__index">0{index + 1}</span>
              </div>

              <h3>{service.title}</h3>
              <p>{service.description}</p>

              <ul className="service-card__tags" aria-label={`Especialidades de ${service.title}`}>
                {service.tags.map((tag) => (
                  <li key={tag}>{tag}</li>
                ))}
              </ul>

              <button className="service-card__cta" type="button" onClick={() => onSelectService(service.offer)}>
                Solicitar estudio
                <Icon name="arrow-up-right" size={16} />
              </button>
            </article>
          ))}
        </div>

        <div className="services__note" data-reveal>
          <p>
            <strong>+40 tipos de estudios especializados.</strong> Si no encontrás el tuyo, lo diseñamos.
          </p>
          <a className="link-arrow" href="#contacto">
            Contanos tu caso
            <Icon name="arrow-up-right" size={15} />
          </a>
        </div>
      </div>
    </section>
  )
}
