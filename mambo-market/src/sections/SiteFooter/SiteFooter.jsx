import Icon from "../../components/Icon"
import {
  CONTACT_EMAIL,
  CONTACT_PHONE_DISPLAY,
  CONTACT_PHONE_HREF,
  INSTAGRAM_URL,
  NAV_ITEMS,
  OFFICES,
  WHATSAPP_NUMBER,
} from "../../data/siteData"
import "./SiteFooter.css"

export default function SiteFooter() {
  const year = new Date().getFullYear()

  const scrollToTop = () => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" })
  }

  return (
    <footer className="site-footer">
      <div className="container">
        <div className="site-footer__cta" data-reveal>
          <div>
            <p className="site-footer__label">Siguiente paso</p>
            <h2>¿Listo para decidir con datos?</h2>
          </div>
          <a className="btn btn--accent" href="#contacto">
            Agendar una consulta
            <Icon name="arrow-up-right" size={17} />
          </a>
        </div>

        <div className="site-footer__grid">
          <div className="site-footer__brand">
            <a className="site-footer__logo" href="#inicio" aria-label="Mambo Market — Volver al inicio">
              <span className="site-footer__mark" aria-hidden="true">
                <svg viewBox="0 0 40 40" fill="none">
                  <path d="M7.5 31.5V9l12.5 12.5L32.5 9v22.5" stroke="currentColor" strokeWidth="4" />
                </svg>
              </span>
              <span>
                <strong>Mambo Market</strong>
                <small>Investigación &amp; estrategia</small>
              </span>
            </a>
            <p>Investigación de mercados, coaching empresarial y consultoría estratégica desde 2007.</p>
            <a className="link-arrow" href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer">
              Instagram
              <Icon name="arrow-up-right" size={14} />
            </a>
          </div>

          <div className="site-footer__col">
            <h3>Navegación</h3>
            <ul>
              {NAV_ITEMS.map((item) => (
                <li key={item.id}>
                  <a href={`#${item.id}`}>{item.label}</a>
                </li>
              ))}
            </ul>
          </div>

          <div className="site-footer__col">
            <h3>Oficinas</h3>
            {OFFICES.map((office) => (
              <div className="site-footer__office" key={office.id}>
                <span>{office.role}</span>
                <strong>
                  {office.shortCity}
                  {office.country !== office.shortCity ? ` · ${office.country}` : ""}
                </strong>
                <p>{office.address}</p>
              </div>
            ))}
          </div>

          <div className="site-footer__col">
            <h3>Contacto</h3>
            <a href={`tel:${CONTACT_PHONE_HREF}`}>{CONTACT_PHONE_DISPLAY}</a>
            <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
            <a href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noopener noreferrer">
              WhatsApp
            </a>
            <p className="site-footer__person">Diego Gil — Director</p>
            <p className="site-footer__person">Sergio Ferrer — Europa</p>
          </div>
        </div>

        <div className="site-footer__bottom">
          <p>© {year} Mambo Market. Todos los derechos reservados.</p>
          <p className="site-footer__credit">
            Sitio creado por{" "}
            <a href="https://github.com/Santygm04" target="_blank" rel="noopener noreferrer">
              Santiago Gil Mina
            </a>
          </p>
          <button type="button" className="site-footer__top" onClick={scrollToTop} aria-label="Volver arriba">
            <Icon name="arrow-up" size={16} />
          </button>
        </div>
      </div>
    </footer>
  )
}
