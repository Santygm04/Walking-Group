import { useState } from "react"
import Icon from "../../components/Icon"
import { METHODS } from "../../data/siteData"
import "./Methodology.css"

const PHASES = ["Inmersión", "Diseño", "Campo", "Insights"]

export default function Methodology() {
  const [openIndex, setOpenIndex] = useState(0)

  return (
    <section id="metodologia" className="section section--dark methodology">
      <div className="methodology__grid-bg" aria-hidden="true" />

      <div className="container">
        <div className="methodology__layout">
          <div className="methodology__intro">
            <p className="section-label">03 — Metodología</p>
            <h2 className="section-title" data-reveal>
              Método propio.
              <br />
              <span className="serif accent">Rigor internacional.</span>
            </h2>
            <p className="lead" data-reveal style={{ "--reveal-delay": "120ms" }}>
              Metodologías propias y técnicas internacionales para responder preguntas de negocio con evidencia, no con
              intuición.
            </p>

            <div className="methodology__phases" data-reveal style={{ "--reveal-delay": "200ms" }}>
              {PHASES.map((phase, index) => (
                <span key={phase}>
                  <i>0{index + 1}</i>
                  {phase}
                </span>
              ))}
            </div>

            <div className="methodology__mark" aria-hidden="true">
              <Icon name="spark" size={130} strokeWidth={1} />
            </div>
          </div>

          <div className="methodology__list">
            {METHODS.map((method, index) => {
              const isOpen = openIndex === index

              return (
                <div
                  className={`method ${isOpen ? "is-open" : ""}`}
                  key={method.title}
                  data-reveal
                  style={{ "--reveal-delay": `${index * 80}ms` }}
                >
                  <h3>
                    <button
                      type="button"
                      className="method__trigger"
                      id={`method-trigger-${index}`}
                      aria-expanded={isOpen}
                      aria-controls={`method-panel-${index}`}
                      onClick={() => setOpenIndex(isOpen ? -1 : index)}
                    >
                      <span className="method__index">{method.index}</span>
                      <span className="method__title">{method.title}</span>
                      <span className="method__icon" aria-hidden="true">
                        <Icon name={isOpen ? "minus" : "plus"} size={18} />
                      </span>
                    </button>
                  </h3>

                  <div
                    className="method__panel"
                    id={`method-panel-${index}`}
                    role="region"
                    aria-labelledby={`method-trigger-${index}`}
                    aria-hidden={!isOpen}
                  >
                    <div className="method__panel-inner">
                      <p>{method.description}</p>
                      <ul>
                        {method.bullets.map((bullet) => (
                          <li key={bullet}>
                            <Icon name="check" size={13} />
                            {bullet}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
