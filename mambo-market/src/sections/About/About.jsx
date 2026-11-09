import Icon from "../../components/Icon"
import { PRINCIPLES, STATS } from "../../data/siteData"
import { useCountUp, useInView } from "../../hooks/useUI"
import "./About.css"

function Stat({ stat, index, reduced }) {
  const [ref, inView] = useInView({ threshold: 0.55 })
  const value = useCountUp(stat.value, inView, reduced)

  return (
    <div className="stat" ref={ref} data-reveal style={{ "--reveal-delay": `${index * 80}ms` }}>
      <span className="stat__value">
        {value}
        {stat.suffix ? <sup>{stat.suffix}</sup> : null}
      </span>
      <span className="stat__label">{stat.label}</span>
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
            No vendemos datos.
            <br />
            <span className="serif">Construimos decisiones.</span>
          </h2>
          <p className="section-aside" data-reveal style={{ "--reveal-delay": "120ms" }}>
            Desde 2007 acompañamos a marcas líderes en América Latina, Europa y Medio Oriente.
          </p>
        </div>

        <div className="about__grid">
          <div className="about__copy" data-reveal>
            <p className="about__lead">
              <span className="about__dropcap" aria-hidden="true">
                M
              </span>
              ambo Market es una empresa especializada en investigación de mercados, coaching empresarial y
              consultoría estratégica con presencia consolidada en América Latina y Europa.
            </p>
            <p>
              Dirigida por <strong>Diego Gil</strong> y un equipo de expertos altamente calificados, hemos desarrollado
              metodologías propias que se aplican exitosamente en diversos países, ayudando a empresas líderes a tomar
              decisiones estratégicas informadas.
            </p>
            <p>
              Nuestra misión es acompañar a las organizaciones en su aventura de conocer profundamente al consumidor,
              proporcionando insights valiosos que impulsen su crecimiento sostenible y competitividad en el mercado.
            </p>
            <a className="link-line" href="#metodologia">
              Conocer el método
              <Icon name="arrow-down" size={14} />
            </a>
          </div>

          <figure className="about__quote" data-reveal="right" style={{ "--reveal-delay": "160ms" }}>
            <span className="about__quote-mark" aria-hidden="true">
              “
            </span>
            <blockquote>Cada estudio empieza con una pregunta y termina con una decisión.</blockquote>
            <figcaption>
              <span className="about__signature">Diego Gil</span>
              <span>Director · Mambo Market</span>
            </figcaption>
            <div className="about__stamp">
              <Icon name="spark" size={15} />
              <span>Método propio</span>
            </div>
          </figure>
        </div>

        <div className="about__stats">
          {STATS.map((stat, index) => (
            <Stat key={stat.label} stat={stat} index={index} reduced={reduced} />
          ))}
        </div>

        <div className="about__principles">
          <p className="about__principles-label">Principios corporativos</p>
          <ol>
            {PRINCIPLES.map((principle, index) => (
              <li key={principle} data-reveal style={{ "--reveal-delay": `${index * 70}ms` }}>
                <span>0{index + 1}</span>
                <p>{principle}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  )
}
