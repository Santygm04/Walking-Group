import { useEffect, useState } from "react"
import Icon from "../../components/Icon"
import { useParallax } from "../../hooks/useUI"
import "./Hero.css"

const BARS = [
  { label: "Recordación de marca", value: 84, delay: 720 },
  { label: "Intención de compra", value: 87, delay: 820 },
  { label: "Diferenciación", value: 72, delay: 920 },
  { label: "Afinidad", value: 91, delay: 1020 },
]

function Sparkline() {
  return (
    <svg className="report__spark" viewBox="0 0 300 96" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="spark-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ff6b2c" stopOpacity="0.32" />
          <stop offset="1" stopColor="#ff6b2c" stopOpacity="0" />
        </linearGradient>
      </defs>
      <g stroke="rgba(244,241,234,.09)" strokeWidth="1">
        <path d="M0 24h300M0 52h300M0 80h300" />
      </g>
      <path
        className="report__spark-area"
        d="M0 76C20 74 28 62 44 64S66 48 82 52s24-16 42-8 24-18 42-12 24-18 44-8 26-16 48-6 24-8 42-14v92H0Z"
        fill="url(#spark-fill)"
      />
      <path
        className="report__spark-line"
        d="M0 76C20 74 28 62 44 64S66 48 82 52s24-16 42-8 24-18 42-12 24-18 44-8 26-16 48-6 24-8 42-14"
        stroke="#ff6b2c"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <circle className="report__spark-dot" cx="300" cy="4" r="4" fill="#ff6b2c" />
    </svg>
  )
}

export default function Hero({ reduced }) {
  const [loaded, setLoaded] = useState(reduced)
  const visualRef = useParallax(reduced)

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
      <div className="hero__grid" aria-hidden="true" />
      <div className="hero__glow" aria-hidden="true" />

      <div className="container hero__inner">
        <div className="hero__copy">
          <p className="hero__eyebrow">
            <span className="hero__status">Investigación independiente desde 2007</span>
            <span className="hero__edition">Tucumán · AR — 26.82° S</span>
          </p>

          <h1 className="hero__title">
            <span className="mask-line">
              <span style={{ "--line-delay": "40ms" }}>Datos que</span>
            </span>
            <span className="mask-line hero__title-serif">
              <span style={{ "--line-delay": "150ms" }}>mueven</span>
            </span>
            <span className="mask-line">
              <span style={{ "--line-delay": "260ms" }}>
                <span className="hero__highlight">mercados</span>
                <span className="hero__dot">.</span>
              </span>
            </span>
          </h1>

          <div className="hero__bottom">
            <p className="hero__lede" data-reveal style={{ "--reveal-delay": "540ms" }}>
              Investigación de mercados, coaching empresarial y consultoría estratégica para marcas que necesitan
              entender antes de decidir.
            </p>

            <div className="hero__actions" data-reveal style={{ "--reveal-delay": "640ms" }}>
              <a className="btn" href="#contacto" data-magnetic>
                Agendar consulta
                <span className="btn__icon">
                  <Icon name="arrow-up-right" size={18} />
                </span>
              </a>
              <a className="btn btn--ghost" href="#servicios">
                Ver servicios
                <span className="btn__icon">
                  <Icon name="arrow-down" size={17} />
                </span>
              </a>
            </div>
          </div>

          <dl className="hero__meta" data-reveal style={{ "--reveal-delay": "740ms" }}>
            <div>
              <dt>Oficinas</dt>
              <dd>3 · LATAM / EU / EAU</dd>
            </div>
            <div>
              <dt>Estudios</dt>
              <dd>+40 especializados</dd>
            </div>
            <div>
              <dt>Clientes</dt>
              <dd>+200 marcas</dd>
            </div>
          </dl>
        </div>

        <div className="hero__visual" ref={visualRef} aria-hidden="true">
          <div className="hero__orbit" aria-hidden="true">
            <span className="hero__orbit-ring hero__orbit-ring--one" />
            <span className="hero__orbit-ring hero__orbit-ring--two" />
            <span className="hero__orbit-dot hero__orbit-dot--a" />
            <span className="hero__orbit-dot hero__orbit-dot--b" />
          </div>

          <article className="report" data-reveal="scale" style={{ "--reveal-delay": "360ms" }}>
            <div className="report__top">
              <span className="report__brand">Mambo / Field report</span>
              <span className="report__live">
                <i aria-hidden="true" />
                En vivo
              </span>
            </div>

            <div className="report__body">
              <p className="report__kicker">Índice de intención de compra</p>
              <div className="report__score">
                <span>87.4</span>
                <em>%</em>
                <span className="report__delta">+12,6</span>
              </div>

              <Sparkline />

              <div className="report__bars">
                {BARS.map((bar) => (
                  <div className="report__bar" key={bar.label}>
                    <span className="report__bar-label">{bar.label}</span>
                    <span className="report__bar-track">
                      <span
                        className="report__bar-fill"
                        style={{ "--bar-value": bar.value / 100, "--bar-delay": `${bar.delay}ms` }}
                      />
                    </span>
                    <span className="report__bar-value">{bar.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="report__foot">
              <span>Concept test · LATAM</span>
              <span>n = 1.240</span>
            </div>
          </article>

          <div className="hero__chip-position hero__chip-position--a" data-reveal="scale" style={{ "--reveal-delay": "700ms" }}>
            <div className="hero__chip">
              <span className="hero__chip-icon">
                <Icon name="target" size={17} />
              </span>
              <span>
                <strong>92%</strong>
                <small>Concept fulfillment</small>
              </span>
            </div>
          </div>

          <div className="hero__chip-position hero__chip-position--b" data-reveal="scale" style={{ "--reveal-delay": "820ms" }}>
            <div className="hero__chip">
              <span className="hero__chip-icon">
                <Icon name="globe" size={17} />
              </span>
              <span>
                <strong>3 husos</strong>
                <small>LATAM · EU · UAE</small>
              </span>
            </div>
          </div>

          <div className="hero__seal" aria-hidden="true">
            <svg viewBox="0 0 120 120">
              <defs>
                <path id="seal-circle" d="M60,60 m-43,0 a43,43 0 1,1 86,0 a43,43 0 1,1 -86,0" />
              </defs>
              <text>
                <textPath href="#seal-circle">MAMBO MARKET · RESEARCH SINCE 2007 ·</textPath>
              </text>
            </svg>
            <Icon name="arrow-down" size={17} />
          </div>
        </div>
      </div>

      <div className="hero__scroll" aria-hidden="true">
        <span>Scroll</span>
        <i />
      </div>
    </section>
  )
}
