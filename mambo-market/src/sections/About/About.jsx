import Icon from "../../components/Icon"
import { PRINCIPLES, STATS } from "../../data/siteData"
import { useCountUp, useInView } from "../../hooks/useUI"
import "./About.css"

function Stat({ stat, reduced }) {
  const [ref, inView] = useInView({ threshold: 0.55 })
  const value = useCountUp(stat.value, inView, reduced)

  return (
    <div className="about-stat" ref={ref}>
      <span className="about-stat__value">
        {value}
        {stat.suffix ? <sup>{stat.suffix}</sup> : null}
      </span>
      <span className="about-stat__label">{stat.label}</span>
    </div>
  )
}

export default function About({ reduced }) {
  return (
    <section id="nosotros" className="section about">
      <div className="container">
        <div className="section-head">
          <p className="section-label">01 — Nosotros</p>
          <h2 className="section-title" data-reveal>
            Una firma de investigación con <span className="accent">mirada estratégica.</span>
          </h2>
          <p className="section-aside" data-reveal style={{ "--reveal-delay": "100ms" }}>
            Desde 2007 acompañamos a organizaciones líderes en América Latina, Europa y Medio Oriente.
          </p>
        </div>

        <div className="about__grid">
          <div className="about__copy" data-reveal>
            <p className="about__lead">
              Mambo Market es una empresa especializada en investigación de mercados, coaching empresarial y
              consultoría estratégica con presencia consolidada en América Latina y Europa.
            </p>
            <p>
              Dirigida por <strong>Diego Gil</strong> y un equipo de expertos altamente calificados, hemos desarrollado
              metodologías propias que se aplican exitosamente en distintos países, ayudando a empresas líderes a tomar
              decisiones estratégicas informadas.
            </p>
            <p>
              Nuestra misión es acompañar a las organizaciones en su aventura de conocer profundamente al consumidor,
              proporcionando insights valiosos que impulsen su crecimiento sostenible y competitividad en el mercado.
            </p>
            <a className="link-arrow" href="#metodologia">
              Conocer nuestro método
              <Icon name="arrow-down" size={15} />
            </a>
          </div>

          <aside className="about__panel" data-reveal="scale" style={{ "--reveal-delay": "120ms" }}>
            <div className="about__panel-head">
              <span className="about__panel-label">Mambo Market en números</span>
              <span className="about__panel-year">2007 — 2026</span>
            </div>

            <div className="about__stats">
              {STATS.map((stat) => (
                <Stat key={stat.label} stat={stat} reduced={reduced} />
              ))}
            </div>

            <blockquote className="about__quote">
              <p>“Cada estudio empieza con una pregunta y termina con una decisión.”</p>
              <footer>
                <span className="about__quote-avatar" aria-hidden="true">
                  DG
                </span>
                <span>
                  <strong>Diego Gil</strong>
                  <small>Director · Mambo Market</small>
                </span>
              </footer>
            </blockquote>
          </aside>
        </div>

        <ul className="about__principles">
          {PRINCIPLES.map((principle, index) => (
            <li key={principle} data-reveal style={{ "--reveal-delay": `${index * 50}ms` }}>
              <span className="about__principle-icon">
                <Icon name="check" size={13} />
              </span>
              {principle}
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
