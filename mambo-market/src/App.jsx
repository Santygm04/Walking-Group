"use client"

import { useState, useEffect } from "react"
import "./index.css"

function App() {
  const [formData, setFormData] = useState({
    nombre: "",
    empresa: "",
    email: "",
    telefono: "",
    tipoServicio: "",
    mensaje: "",
    fechaPreferida: "",
    horaPreferida: "",
    presupuesto: "",
    urgencia: "",
  })

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: "0px 0px -50px 0px",
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible")
        }
      })
    }, observerOptions)

    const animatedElements = document.querySelectorAll(".fade-in, .slide-in-left, .slide-in-right")
    animatedElements.forEach((el) => observer.observe(el))

    return () => observer.disconnect()
  }, [])

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    const mensaje = `
🏢 *CONSULTA PROFESIONAL - MAMBO MARKET*

👤 *DATOS DEL CLIENTE*
• Nombre: ${formData.nombre}
• Empresa: ${formData.empresa}
• Email: ${formData.email}
• Teléfono: ${formData.telefono}

🎯 *SERVICIO SOLICITADO*
• Tipo: ${formData.tipoServicio}
• Presupuesto estimado: ${formData.presupuesto}
• Urgencia: ${formData.urgencia}

📅 *REUNIÓN PREFERIDA*
• Fecha: ${formData.fechaPreferida || "A coordinar"}
• Hora: ${formData.horaPreferida || "A coordinar"}

💬 *DETALLES DEL PROYECTO*
${formData.mensaje}

---
*Enviado desde mambomarket.com*
*Investigación de Mercados • Coaching Empresarial*
    `.trim()

    const numeroWhatsApp = "5493816288837"
    const url = `https://wa.me/${numeroWhatsApp}?text=${encodeURIComponent(mensaje)}`

    window.open(url, "_blank")
  }

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({ behavior: "smooth" })
    }
    setMobileMenuOpen(false)
  }

  return (
    <div className="App">
      {/* Header */}
      <header className="header">
        <div className="container">
          <div className="header-content">
            <a href="#inicio" className="logo" onClick={() => scrollToSection("inicio")}>
              Mambo Market
            </a>
            <nav>
              <ul className={`nav-menu ${mobileMenuOpen ? "mobile-open" : ""}`}>
                <li>
                  <a href="#inicio" onClick={() => scrollToSection("inicio")}>
                    Inicio
                  </a>
                </li>
                <li>
                  <a href="#nosotros" onClick={() => scrollToSection("nosotros")}>
                    Nosotros
                  </a>
                </li>
                <li>
                  <a href="#servicios" onClick={() => scrollToSection("servicios")}>
                    Servicios
                  </a>
                </li>
                <li>
                  <a href="#metodologia" onClick={() => scrollToSection("metodologia")}>
                    Metodología
                  </a>
                </li>
                <li>
                  <a href="#clientes" onClick={() => scrollToSection("clientes")}>
                    Clientes
                  </a>
                </li>
                <li>
                  <a href="#contacto" onClick={() => scrollToSection("contacto")}>
                    Contacto
                  </a>
                </li>
              </ul>
              <button className="mobile-menu-btn" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                ☰
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section id="inicio" className="hero">
        <div className="container">
          <div className="hero-content">
            <h1 className="fade-in">Mambo Market</h1>
            <p className="subtitle fade-in">
              Investigación de Mercados • Coaching Empresarial • Consultoría Estratégica
            </p>
            <p className="description fade-in">
              Empresa Regional de Estudios de Mercado para América Latina y Europa. Más de 40 tipos de estudios
              especializados para impulsar tu negocio.
            </p>
            <a href="#contacto" className="cta-button fade-in" onClick={() => scrollToSection("contacto")}>
              Solicitar Consulta Gratuita
            </a>
          </div>
        </div>
      </section>

      {/* Nosotros Section */}
      <section id="nosotros" className="section">
        <div className="container">
          <h2 className="fade-in">¿Quiénes Somos?</h2>
          <p className="section-intro fade-in">
            Líderes en investigación de mercados con presencia internacional y metodologías propias
          </p>

          <div className="about-grid">
            <div className="about-content slide-in-left">
              <h3>Nuestra Historia</h3>
              <p>
                <strong>Mambo Market</strong> es una empresa especializada en investigación de mercados, coaching
                empresarial y consultoría estratégica con presencia consolidada en América Latina y Europa.
              </p>
              <p>
                Dirigida por <strong>Diego Gil</strong> y un equipo de expertos altamente calificados, hemos
                desarrollado metodologías propias que se aplican exitosamente en diversos países, ayudando a empresas
                líderes a tomar decisiones estratégicas informadas.
              </p>
              <p>
                Nuestra misión es acompañar a las organizaciones en su aventura de conocer profundamente al consumidor,
                proporcionando insights valiosos que impulsen su crecimiento sostenible y competitividad en el mercado.
              </p>
            </div>

            <div className="about-stats slide-in-right">
              <h3 style={{ marginBottom: "2rem", fontSize: "1.8rem" }}>Nuestros Números</h3>
              <div className="stats-grid">
                <div className="stat-item">
                  <h4>40+</h4>
                  <p>Tipos de Estudios</p>
                </div>
                <div className="stat-item">
                  <h4>15+</h4>
                  <p>Años de Experiencia</p>
                </div>
                <div className="stat-item">
                  <h4>200+</h4>
                  <p>Clientes Satisfechos</p>
                </div>
                <div className="stat-item">
                  <h4>2</h4>
                  <p>Continentes</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Servicios Section */}
      <section id="servicios" className="section">
        <div className="container">
          <h2 className="fade-in">Nuestros Servicios</h2>
          <p className="section-intro fade-in">
            Soluciones integrales de investigación y consultoría para potenciar tu negocio
          </p>

          <div className="services-grid">
            <div className="service-card fade-in">
              <span className="service-icon">📊</span>
              <h3>Estudios de Mercado</h3>
              <p>
                Investigación cuantitativa y cualitativa para entender el comportamiento del consumidor, tendencias de
                mercado y oportunidades de negocio.
              </p>
            </div>

            <div className="service-card fade-in">
              <span className="service-icon">💰</span>
              <h3>Análisis de Sensibilidad de Precios</h3>
              <p>
                Estudios especializados para determinar la elasticidad de precios y optimizar estrategias de pricing
                basadas en modelos propios.
              </p>
            </div>

            <div className="service-card fade-in">
              <span className="service-icon">🎯</span>
              <h3>Brand Analysis & Redes Semánticas</h3>
              <p>
                Análisis profundo de percepción de marca y significados psicológicos asociados para posicionamiento
                estratégico efectivo.
              </p>
            </div>

            <div className="service-card fade-in">
              <span className="service-icon">🚀</span>
              <h3>Coaching Empresarial</h3>
              <p>
                Acompañamiento estratégico personalizado para el crecimiento, desarrollo organizacional y optimización
                de procesos empresariales.
              </p>
            </div>

            <div className="service-card fade-in">
              <span className="service-icon">🏪</span>
              <h3>Estudios de Punto de Venta</h3>
              <p>
                Análisis completo de distribución, facing, merchandising y comportamiento del consumidor en el punto de
                venta.
              </p>
            </div>

            <div className="service-card fade-in">
              <span className="service-icon">⭐</span>
              <h3>Calidad de Servicio</h3>
              <p>
                Evaluación integral de la experiencia del cliente y desarrollo de estrategias para la mejora continua
                del servicio.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Metodología Section */}
      <section id="metodologia" className="section">
        <div className="container">
          <h2 className="fade-in">Nuestra Metodología</h2>
          <p className="section-intro fade-in">
            Metodologías propias y técnicas internacionales para resultados excepcionales
          </p>

          <div className="methodology-grid">
            <div className="methodology-card fade-in">
              <h4>Decisiones de Marketing</h4>
              <ul>
                <li>Desarrollo y lanzamiento de productos</li>
                <li>Estrategias de marca y posicionamiento</li>
                <li>Optimización de precios y promociones</li>
                <li>Campañas publicitarias efectivas</li>
              </ul>
            </div>

            <div className="methodology-card fade-in">
              <h4>Comportamiento del Consumidor</h4>
              <ul>
                <li>Hábitos de compra y consumo</li>
                <li>Motivaciones y frenos de compra</li>
                <li>Segmentación psicográfica</li>
                <li>Journey del cliente</li>
              </ul>
            </div>

            <div className="methodology-card fade-in">
              <h4>Técnicas Especializadas</h4>
              <ul>
                <li>Modelos econométricos propios</li>
                <li>Análisis de redes semánticas</li>
                <li>Estudios de elasticidad de precios</li>
                <li>Técnicas proyectivas avanzadas</li>
              </ul>
            </div>

            <div className="methodology-card fade-in">
              <h4>Investigación Avanzada</h4>
              <ul>
                <li>Estudios multipaís</li>
                <li>Análisis predictivos</li>
                <li>Investigación digital</li>
                <li>Metodologías mixtas</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Clientes Section */}
      <section id="clientes" className="section">
        <div className="container">
          <h2 className="fade-in">Nuestros Clientes</h2>
          <p className="section-intro fade-in">
            Trabajamos con las empresas más importantes de América Latina y Europa
          </p>

          <div className="clients-showcase fade-in">
            <h3 style={{ marginBottom: "2rem", color: "#dc3545" }}>Principales Clientes</h3>
            <div className="clients-grid">
              <div className="client-category">
                <h4>Investigación Internacional</h4>
                <ul className="client-list">
                  <li>Kantar</li>
                  <li>Ipsos</li>
                  <li>Intermarket Research</li>
                  <li>Survey Data</li>
                </ul>
              </div>

              <div className="client-category">
                <h4>Sector Alimentario</h4>
                <ul className="client-list">
                  <li>Sumesa</li>
                  <li>Quala</li>
                  <li>Yeti</li>
                  <li>Corporación Nacional</li>
                </ul>
              </div>

              <div className="client-category">
                <h4>Servicios Financieros</h4>
                <ul className="client-list">
                  <li>Vision Fund</li>
                  <li>Biess</li>
                  <li>Advance Consultora</li>
                  <li>Controladora del Estado</li>
                </ul>
              </div>

              <div className="client-category">
                <h4>Consultoría & Otros</h4>
                <ul className="client-list">
                  <li>Insotec</li>
                  <li>Mipro</li>
                  <li>GeoPlaDeS</li>
                  <li>Agencia Nacional</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="about-grid" style={{ marginTop: "4rem" }}>
            <div className="about-content slide-in-left">
              <h3>Asociaciones Estratégicas</h3>
              <p>
                Mantenemos alianzas estratégicas con empresas líderes tanto a nivel nacional como internacional, lo que
                nos permite ofrecer servicios de clase mundial y acceder a las mejores prácticas globales.
              </p>
              <p>
                Nuestras asociaciones incluyen partnerships con consultoras internacionales, universidades de prestigio
                y organizaciones especializadas en investigación de mercados.
              </p>
            </div>

            <div className="about-stats slide-in-right">
              <h3 style={{ marginBottom: "2rem", fontSize: "1.8rem" }}>Alcance Global</h3>
              <div className="stats-grid">
                <div className="stat-item">
                  <h4>España</h4>
                  <p>Oficina Europea</p>
                </div>
                <div className="stat-item">
                  <h4>Argentina</h4>
                  <p>Sede Principal</p>
                </div>
                <div className="stat-item">
                  <h4>UAE</h4>
                  <p>Oficina Medio Oriente</p>
                </div>
                <div className="stat-item">
                  <h4>LATAM</h4>
                  <p>Cobertura Regional</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contacto Section */}
      <section id="contacto" className="section">
        <div className="container">
          <h2 className="fade-in">Contacto y Consulta</h2>
          <p className="section-intro fade-in">
            Agenda tu consulta gratuita y descubre cómo podemos impulsar tu negocio
          </p>

          <div className="contact-section">
            <div className="contact-grid">
              <div className="contact-info slide-in-left">
                <h3>Nuestras Oficinas</h3>

                <div className="location-card">
                  <h4>🇦🇷 Argentina - Sede Principal</h4>
                  <p>
                    <strong>Dirección:</strong> España 1674, San Miguel de Tucumán
                  </p>
                  <p>
                    <strong>Director:</strong> Diego Gil
                  </p>
                  <p>
                    <strong>Teléfono:</strong> +54 9381 628 8837
                  </p>
                  <p>
                    <strong>Email:</strong> panaxxx@hotmail.com
                  </p>
                </div>

                <div className="location-card">
                  <h4>🇦🇪 Emiratos Árabes Unidos</h4>
                  <p>
                    <strong>Oficina:</strong> Al Shmookh Business Center
                  </p>
                  <p>
                    <strong>Ubicación:</strong> One UAQ, UAE Free Trade Zone
                  </p>
                  <p>
                    <strong>Ciudad:</strong> Umm Al Quwain, U.A.E
                  </p>
                </div>

                <div className="location-card">
                  <h4>🇪🇸 España - Oficina Europea</h4>
                  <p>
                    <strong>Contacto:</strong> Sergio Ferrer
                  </p>
                  <p>
                    <strong>Teléfono:</strong> +34 631 079 181
                  </p>
                  <p>
                    <strong>Email:</strong> viajesbcn2014@gmail.com
                  </p>
                </div>
              </div>

              <div className="slide-in-right">
                <form onSubmit={handleSubmit} className="contact-form">
                  <h3 style={{ marginBottom: "2rem", textAlign: "center", color: "#dc3545" }}>
                    Solicitar Consulta Profesional
                  </h3>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="nombre">Nombre Completo *</label>
                      <input
                        type="text"
                        id="nombre"
                        name="nombre"
                        value={formData.nombre}
                        onChange={handleInputChange}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="empresa">Empresa / Organización *</label>
                      <input
                        type="text"
                        id="empresa"
                        name="empresa"
                        value={formData.empresa}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="email">Email Corporativo *</label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="telefono">Teléfono *</label>
                      <input
                        type="tel"
                        id="telefono"
                        name="telefono"
                        value={formData.telefono}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="tipoServicio">Servicio de Interés *</label>
                    <select
                      id="tipoServicio"
                      name="tipoServicio"
                      value={formData.tipoServicio}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Seleccionar servicio...</option>
                      <option value="Estudio de Mercado Completo">Estudio de Mercado Completo</option>
                      <option value="Análisis de Sensibilidad de Precios">Análisis de Sensibilidad de Precios</option>
                      <option value="Brand Analysis & Redes Semánticas">Brand Analysis & Redes Semánticas</option>
                      <option value="Coaching Empresarial">Coaching Empresarial</option>
                      <option value="Estudios de Punto de Venta">Estudios de Punto de Venta</option>
                      <option value="Evaluación de Calidad de Servicio">Evaluación de Calidad de Servicio</option>
                      <option value="Consultoría Estratégica Integral">Consultoría Estratégica Integral</option>
                      <option value="Investigación Personalizada">Investigación Personalizada</option>
                    </select>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="presupuesto">Presupuesto Estimado</label>
                      <select
                        id="presupuesto"
                        name="presupuesto"
                        value={formData.presupuesto}
                        onChange={handleInputChange}
                      >
                        <option value="">Seleccionar rango...</option>
                        <option value="Menos de $5,000 USD">Menos de $5,000 USD</option>
                        <option value="$5,000 - $15,000 USD">$5,000 - $15,000 USD</option>
                        <option value="$15,000 - $30,000 USD">$15,000 - $30,000 USD</option>
                        <option value="$30,000 - $50,000 USD">$30,000 - $50,000 USD</option>
                        <option value="Más de $50,000 USD">Más de $50,000 USD</option>
                        <option value="A definir">A definir</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label htmlFor="urgencia">Urgencia del Proyecto</label>
                      <select id="urgencia" name="urgencia" value={formData.urgencia} onChange={handleInputChange}>
                        <option value="">Seleccionar...</option>
                        <option value="Inmediata (1-2 semanas)">Inmediata (1-2 semanas)</option>
                        <option value="Alta (1 mes)">Alta (1 mes)</option>
                        <option value="Media (2-3 meses)">Media (2-3 meses)</option>
                        <option value="Baja (más de 3 meses)">Baja (más de 3 meses)</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="fechaPreferida">Fecha Preferida para Reunión</label>
                      <input
                        type="date"
                        id="fechaPreferida"
                        name="fechaPreferida"
                        value={formData.fechaPreferida}
                        onChange={handleInputChange}
                        min={new Date().toISOString().split("T")[0]}
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="horaPreferida">Hora Preferida</label>
                      <select
                        id="horaPreferida"
                        name="horaPreferida"
                        value={formData.horaPreferida}
                        onChange={handleInputChange}
                      >
                        <option value="">Seleccionar hora...</option>
                        <option value="09:00 AM">09:00 AM</option>
                        <option value="10:00 AM">10:00 AM</option>
                        <option value="11:00 AM">11:00 AM</option>
                        <option value="02:00 PM">02:00 PM</option>
                        <option value="03:00 PM">03:00 PM</option>
                        <option value="04:00 PM">04:00 PM</option>
                        <option value="05:00 PM">05:00 PM</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="mensaje">Detalles del Proyecto *</label>
                    <textarea
                      id="mensaje"
                      name="mensaje"
                      value={formData.mensaje}
                      onChange={handleInputChange}
                      placeholder="Describa su proyecto, objetivos, mercado objetivo, y cualquier información relevante que nos ayude a preparar una propuesta personalizada..."
                      required
                    ></textarea>
                  </div>

                  <button type="submit" className="submit-btn">
                    📱 Enviar Consulta por WhatsApp
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-section">
              <h3>Mambo Market</h3>
              <p>Empresa líder en investigación de mercados y consultoría estratégica</p>
              <p>Presencia en América Latina, Europa y Medio Oriente</p>
              <p>Dirigida por Diego Gil y equipo de expertos</p>
            </div>

            <div className="footer-section">
              <h3>Servicios Principales</h3>
              <a href="#servicios">Investigación de Mercados</a>
              <a href="#servicios">Análisis de Precios</a>
              <a href="#servicios">Brand Analysis</a>
              <a href="#servicios">Coaching Empresarial</a>
              <a href="#servicios">Consultoría Estratégica</a>
            </div>

            <div className="footer-section">
              <h3>Contacto Principal</h3>
              <p>📍 España 1674, Tucumán, Argentina</p>
              <p>📱 +54 9381 628 8837</p>
              <p>📧 panaxxx@hotmail.com</p>
              <p>👨‍💼 Diego Gil - Director</p>
            </div>

            <div className="footer-section">
              <h3>Oficinas Internacionales</h3>
              <p>🇪🇸 España - Sergio Ferrer</p>
              <p>🇦🇪 UAE - Al Shmookh Business Center</p>
              <p>🌎 Cobertura: LATAM & Europa</p>
            </div>
          </div>

          <div className="footer-bottom">
            <p>&copy; {new Date().getFullYear()} Mambo Market. Todos los derechos reservados.</p>
            <p>Investigación de Mercados • Coaching Empresarial • Consultoría Estratégica</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App
