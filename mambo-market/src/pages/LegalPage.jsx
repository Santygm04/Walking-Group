import { useEffect } from "react"
import Icon from "../components/Icon"
import { CONTACT_EMAIL } from "../data/siteData"
import "./LegalPage.css"

const LAST_UPDATED = "12 de noviembre de 2026"

function PrivacyContent() {
  return (
    <>
      <section>
        <h2>1. Responsable del tratamiento</h2>
        <p>
          El responsable de los datos personales recopilados en este sitio es <strong>Mambo Market</strong>, con domicilio
          en España 1674, San Miguel de Tucumán, Tucumán, Argentina. Para cualquier consulta relacionada con tus datos,
          podés escribir a <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
        </p>
      </section>

      <section>
        <h2>2. Qué datos recopilamos</h2>
        <p>Cuando completás el formulario de contacto o solicitás una reunión, recopilamos:</p>
        <ul>
          <li>Nombre y apellido.</li>
          <li>Empresa u organización.</li>
          <li>Email y teléfono de contacto.</li>
          <li>Servicio de interés, presupuesto estimado y urgencia.</li>
          <li>Fecha y horario preferido para la reunión.</li>
          <li>El mensaje o detalle del proyecto que nos compartís.</li>
        </ul>
        <p>
          También podemos registrar datos técnicos mínimos, como dirección IP y fecha de la solicitud, con fines de
          seguridad y prevención de abuso. No utilizamos cookies de publicidad ni herramientas de seguimiento.
        </p>
      </section>

      <section>
        <h2>3. Para qué usamos los datos</h2>
        <ul>
          <li>Recibir y gestionar tu solicitud de reunión o consulta.</li>
          <li>Confirmar, reprogramar o cancelar reuniones y enviarte los emails asociados.</li>
          <li>Enviarte recordatorios de reuniones confirmadas.</li>
          <li>Responder tus consultas y preparar propuestas comerciales.</li>
          <li>Proteger el sitio, prevenir spam y garantizar la seguridad del servicio.</li>
        </ul>
      </section>

      <section>
        <h2>4. Base legal</h2>
        <p>
          El tratamiento se basa en el consentimiento que otorgás al enviar el formulario y, para las comunicaciones
          necesarias de la reunión, en la ejecución de la relación solicitada. Los datos de seguridad se tratan sobre la
          base del interés legítimo en proteger el sitio y a sus usuarios.
        </p>
      </section>

      <section>
        <h2>5. Almacenamiento y proveedores</h2>
        <p>
          Los datos se almacenan en servicios de infraestructura y bases de datos seguras, y se utilizan proveedores de
          correo electrónico para enviar las comunicaciones del servicio. Algunos proveedores pueden procesar datos fuera
          de Argentina; en esos casos se aplican las garantías y condiciones de seguridad de cada proveedor.
        </p>
        <p>
          Los proveedores tecnológicos utilizados pueden incluir Vercel (alojamiento), Upstash (base de datos), Google
          (correo) y/o Resend (envío de emails transaccionales).
        </p>
      </section>

      <section>
        <h2>6. Conservación</h2>
        <p>
          Conservamos las solicitudes mientras la reunión esté activa y, luego, durante el tiempo necesario para atender
          consultas o cumplir obligaciones legales. En general, no conservamos solicitudes inactivas por más de 24 meses.
          Podés pedir su eliminación anticipada escribiéndonos.
        </p>
      </section>

      <section>
        <h2>7. Tus derechos</h2>
        <p>
          Podés solicitar el acceso, la rectificación, la actualización o la eliminación de tus datos, así como oponerte a
          determinados tratamientos. Para ejercer estos derechos, escribí a{" "}
          <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>. También podés presentar una reclamación ante la
          autoridad de protección de datos que corresponda.
        </p>
      </section>

      <section>
        <h2>8. Cookies</h2>
        <p>
          El sitio público no utiliza cookies de seguimiento ni publicidad. El panel de administración utiliza una cookie
          técnica estrictamente necesaria para mantener la sesión iniciada de forma segura. No se utiliza para perfilado
          ni para compartir información con terceros.
        </p>
      </section>

      <section>
        <h2>9. Seguridad</h2>
        <p>
          Aplicamos medidas técnicas y organizativas razonables, incluyendo cifrado en tránsito, control de acceso,
          autenticación en dos pasos para el panel, limitación de intentos y validación de datos. Ningún sistema es
          absolutamente infalible, pero trabajamos para mantener la confidencialidad y disponibilidad de la información.
        </p>
      </section>

      <section>
        <h2>10. Cambios en esta política</h2>
        <p>
          Podemos actualizar esta política para reflejar cambios en el servicio o en la normativa aplicable. Publicaremos
          la versión vigente en esta página con su fecha de actualización.
        </p>
      </section>

      <p className="legal-related">
        Ver también los <a href="/terminos">términos y condiciones</a>.
      </p>
    </>
  )
}

function TermsContent() {
  return (
    <>
      <section>
        <h2>1. Objeto</h2>
        <p>
          Este sitio presenta los servicios de Mambo Market y permite enviar solicitudes de reunión, consultas e
          información sobre proyectos de investigación de mercados, coaching empresarial y consultoría estratégica.
        </p>
      </section>

      <section>
        <h2>2. Uso del sitio</h2>
        <p>
          Al utilizar el sitio te comprometés a proporcionar información veraz y actualizada, y a no utilizarlo para
          fines ilícitos, fraudulentos o que puedan afectar su funcionamiento o la seguridad de terceros.
        </p>
      </section>

      <section>
        <h2>3. Solicitudes y reuniones</h2>
        <p>
          Enviar el formulario no implica una reserva automática. Toda reunión queda sujeta a disponibilidad y a la
          confirmación que el equipo realice por email. Si una reunión se confirma, recibirás un email con la fecha y el
          horario acordados.
        </p>
        <p>
          Los horarios publicados e intercambiados se expresan en hora de Argentina (GMT-3), salvo que se indique otra
          cosa.
        </p>
      </section>

      <section>
        <h2>4. Servicios y presupuestos</h2>
        <p>
          La información del sitio, incluyendo rangos de presupuesto y descripciones de servicios, tiene carácter
          orientativo. El alcance, los entregables, los plazos y el precio definitivo se establecen en una propuesta o
          contrato específico.
        </p>
      </section>

      <section>
        <h2>5. Propiedad intelectual</h2>
        <p>
          Los textos, marcas, diseños, gráficos, metodologías y demás contenidos de este sitio son propiedad de Mambo
          Market o se utilizan con autorización. No podés reproducirlos o utilizarlos comercialmente sin permiso previo.
        </p>
      </section>

      <section>
        <h2>6. Limitación de responsabilidad</h2>
        <p>
          Trabajamos para mantener la información actualizada y el sitio disponible, pero no garantizamos que no existan
          interrupciones o errores. En la medida permitida por la ley, Mambo Market no será responsable por daños
          indirectos derivados del uso del sitio o de la imposibilidad de acceder a él.
        </p>
      </section>

      <section>
        <h2>7. Enlaces a terceros</h2>
        <p>
          El sitio puede incluir enlaces a servicios externos, como WhatsApp, Instagram o herramientas de terceros. No
          controlamos sus contenidos ni sus políticas de privacidad.
        </p>
      </section>

      <section>
        <h2>8. Datos personales</h2>
        <p>
          El tratamiento de los datos que enviás a través del formulario se describe en nuestra{" "}
          <a href="/privacidad">política de privacidad</a>.
        </p>
      </section>

      <section>
        <h2>9. Ley aplicable y jurisdicción</h2>
        <p>
          Estos términos se rigen por la legislación de la República Argentina. Cualquier controversia se someterá a los
          tribunales competentes de la provincia de Tucumán, salvo que la normativa de consumo aplicable disponga otra
          cosa.
        </p>
      </section>

      <section>
        <h2>10. Contacto</h2>
        <p>
          Para consultas sobre estos términos, escribinos a{" "}
          <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
        </p>
      </section>
    </>
  )
}

export default function LegalPage({ type }) {
  const privacy = type === "privacy"
  const title = privacy ? "Política de privacidad" : "Términos y condiciones"

  useEffect(() => {
    document.title = `${title} — Mambo Market`
    const description = document.querySelector('meta[name="description"]')
    if (description) description.setAttribute("content", `${title} de Mambo Market.`)
  }, [title])

  return (
    <div className="legal-page">
      <header className="legal-header">
        <div className="container legal-header__inner">
          <a className="legal-brand" href="/" aria-label="Mambo Market — Volver al inicio">
            <span className="legal-brand__mark" aria-hidden="true">
              <svg viewBox="0 0 40 40" fill="none">
                <path d="M7.5 31.5V9l12.5 12.5L32.5 9v22.5" stroke="currentColor" strokeWidth="4" />
              </svg>
            </span>
            <span>
              <strong>Mambo Market</strong>
              <small>Investigación &amp; estrategia</small>
            </span>
          </a>
          <a className="legal-back" href="/">
            Volver al sitio
            <Icon name="arrow-up-right" size={15} />
          </a>
        </div>
      </header>

      <main className="container legal-main">
        <p className="legal-eyebrow">Legal</p>
        <h1>{title}</h1>
        <p className="legal-updated">Última actualización: {LAST_UPDATED}</p>
        <article className="legal-content">{privacy ? <PrivacyContent /> : <TermsContent />}</article>
      </main>

      <footer className="legal-footer">
        <div className="container">
          <span>© {new Date().getFullYear()} Mambo Market</span>
          <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
        </div>
      </footer>
    </div>
  )
}
