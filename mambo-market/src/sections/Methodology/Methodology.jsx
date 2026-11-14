import { useRef, useState } from "react"
import Icon from "../../components/Icon"
import { METHODS } from "../../data/siteData"
import { usePrefersReducedMotion } from "../../hooks/useUI"
import "./Methodology.css"

const PHASES = ["Inmersión", "Diseño", "Campo", "Insights"]

export default function Methodology() {
  const [openIndex, setOpenIndex] = useState(0)
  const reduced = usePrefersReducedMotion()
  const methodRefs = useRef([])

  const handleToggle = (index) => {
    const nextIndex = openIndex === index ? -1 : index
    setOpenIndex(nextIndex)

    window.setTimeout(() => {
      const target = methodRefs.current[index]
      if (!target) return
      const rect = target.getBoundingClientRect()
      const headerOffset = 100

      if (rect.top < headerOffset || rect.top > window.innerHeight * 0.72) {
        target.scrollIntoView({
          behavior: reduced ? "auto" : "smooth",
          block: "nearest",
        })
      }
    }, 500)
  }

  return (
    <section id="metodologia" className="section methodology">
      <div className="container">
        <div className="section-head">
          <p className="section-label">03 — Metodología</p>
          <h2 className="section-title" data-reveal>
            Un método claro, de la pregunta a la <span className="accent">decisión.</span>
          </h2>
          <p className="section-aside" data-reveal style={{ "--reveal-delay": "100ms" }}>
            Metodologías propias y técnicas internacionales para responder preguntas de negocio con evidencia.
          </p>
        </div>

        <div className="methodology__layout">
          <aside className="methodology__intro" data-reveal>
            <div className="methodology__intro-card">
              <span className="methodology__eyebrow">Nuestro proceso</span>
              <h3>Rigor metodológico en cada etapa.</h3>
              <p>
                Combinamos herramientas cuantitativas, cualitativas y modelos propios para transformar información en
                decisiones accionables.
              </p>

              <ol className="methodology__phases">
                {PHASES.map((phase, index) => (
                  <li key={phase}>
                    <span>0{index + 1}</span>
                    {phase}
                  </li>
                ))}
              </ol>

              <a className="btn btn--accent" href="#contacto">
                Hablemos de tu proyecto
                <Icon name="arrow-up-right" size={16} />
              </a>
            </div>
          </aside>

          <div className="methodology__list">
            {METHODS.map((method, index) => {
              const isOpen = openIndex === index

              return (
                <div
                  className={`method ${isOpen ? "is-open" : ""}`}
                  key={method.title}
                  data-reveal
                  style={{ "--reveal-delay": `${index * 60}ms` }}
                >
                  <h3>
                    <button
                      type="button"
                      className="method__trigger"
                      id={`method-trigger-${index}`}
                      aria-expanded={isOpen}
                      aria-controls={`method-panel-${index}`}
                      onClick={() => handleToggle(index)}
                    >
                      <span className="method__index">{method.index}</span>
                      <span className="method__title">{method.title}</span>
                      <span className="method__icon" aria-hidden="true">
                        <Icon name={isOpen ? "minus" : "plus"} size={17} />
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
