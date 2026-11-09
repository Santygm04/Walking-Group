import { useEffect, useState } from "react"
import Icon from "../../components/Icon"
import { useParallax } from "../../hooks/useUI"
import "./Hero.css"

const BARS = [
  { label: "Recordación de marca", value: 84, delay: 600 },
  { label: "Intención de compra", value: 87, delay: 700 },
  { label: "Diferenciación", value: 72, delay: 800 },
]

function Chart() {
  return (
    <svg className="hero-card__chart" viewBox="0 0 328 110" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="hero-area" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#e8632c" stopOpacity="0.2" />
          <stop offset="1" stopColor="#e8632c" stopOpacity="0" />
        </linearGradient>
      </defs>
      <g stroke="#ece9e2" strokeWidth="1">
        <path d="M0 28h320M0 58h320M0 88h320" />
      </g>
      <path
        className="hero-card__area"
        d="M0 86C22 82 34 66 54 68s30-18 52-14 34-20 58-12 36-16 60-8 40-10 62-18 26-4 34-6v90H0Z"
        fill="url(#hero-area)"
      />
      <path
        className="hero-card__line"
        d="M0 86C22 82 34 66 54 68s30-18 52-14 34-20 58-12 36-16 60-8 40-10 62-18 26-4 34-6"
        stroke="#e8632c"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <circle className="hero-card__dot" cx="320" cy="10" r="4" fill="#e8632c" />
    </svg>
  )
}

export default function Hero({ reduced }) {
  const [loaded, setLoaded] = useState(reduced)
  const visualRef = useParallax(reduced, 0.03)

  useEffect(() => {
    if (reduced) {
      setLoaded(true)
      return undefined
    }
    const frame = requestAnimationFrame(() => setLoaded(true))
    return () => cancelAnimationFrame(frame)
  }, [reduced])

  return (
    <section id="inicio" className={`hero ${loaded ? "is-loaded" : ""}`}>
      <div className="hero__bg" aria-hidden="true">
        <span className="hero__glow hero__glow--one" />
        <span className="hero__glow hero__glow--two" />
      </div>

      <div className="container hero__inner">
        <div className="hero__copy">
          <p className="hero__eyebrow" data-reveal>
            Consultoría en investigación de mercados
          </p>

          <h1 className="hero__title">
            <span className="mask-line">
              <span style={{ "--line-delay": "40ms" }}>Entendé tu mercado.</span>
            </span>
            <span className="mask-line">
              <span style={{ "--line-delay": "150ms" }}>
                Decidí con <em>evidencia</em>.
              </span>
            </span>
          </h1>

          <p className="hero__lede" data-reveal style={{ "--reveal-delay": "380ms" }}>
            Investigación de mercados, coaching empresarial y consultoría estratégica para equipos que necesitan
            decidir con datos, no con intuición.
          </p>

          <div className="hero__actions" data-reveal style={{ "--reveal-delay": "480ms" }}>
            <a className="btn btn--accent" href="#contacto">
              Agendar una consulta
              <Icon name="arrow-up-right" size={17} />
            </a>
            <a className="btn btn--ghost" href="#servicios">
              Ver servicios
              <Icon name="arrow-right" size={17} />
            </a>
          </div>

          <ul className="hero__proof" data-reveal style={{ "--reveal-delay": "580ms" }}>
            <li>
              <strong>+40</strong>
              <span>tipos de estudio</span>
            </li>
            <li>
              <strong>+200</strong>
              <span>marcas asesoradas</span>
            </li>
            <li>
              <strong>3</strong>
              <span>oficinas globales</span>
            </li>
          </ul>
        </div>

        <div className="hero__visual" ref={visualRef} aria-hidden="true">
          <div className="hero__visual-bg" />

          <article className="hero-card" data-reveal="scale" style={{ "--reveal-delay": "220ms" }}>
            <div className="hero-card__head">
              <div>
                <span className="hero-card__brand">Mambo Market</span>
                <span className="hero-card__meta">Panel de investigación · Q4 2026</span>
              </div>
              <span className="hero-card__status">
                <i />
                En vivo
              </span>
            </div>

            <div className="hero-card__metric">
              <span className="hero-card__label">Índice de intención de compra</span>
              <div className="hero-card__value">
                <strong>87.4</strong>
                <span>%</span>
                <em>+12,6</em>
              </div>
            </div>

            <Chart />

            <div className="hero-card__bars">
              {BARS.map((bar) => (
                <div className="hero-card__bar" key={bar.label}>
                  <span className="hero-card__bar-label">{bar.label}</span>
                  <span className="hero-card__bar-track">
                    <span
                      className="hero-card__bar-fill"
                      style={{ "--bar-value": bar.value / 100, "--bar-delay": `${bar.delay}ms` }}
                    />
                  </span>
                  <span className="hero-card__bar-value">{bar.value}</span>
                </div>
              ))}
            </div>

            <div className="hero-card__foot">
              <span>Concept test · LATAM</span>
              <span>n = 1.240</span>
            </div>
          </article>

          <div className="hero-badge hero-badge--a" data-reveal="scale" style={{ "--reveal-delay": "560ms" }}>
            <span className="hero-badge__icon">
              <Icon name="target" size={17} />
            </span>
            <span>
              <strong>92%</strong>
              <small>Concept fulfillment</small>
            </span>
          </div>

          <div className="hero-badge hero-badge--b" data-reveal="scale" style={{ "--reveal-delay": "660ms" }}>
            <span className="hero-badge__icon">
              <Icon name="globe" size={17} />
            </span>
            <span>
              <strong>3 regiones</strong>
              <small>LATAM · EU · UAE</small>
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}
