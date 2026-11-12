import { useCallback, useState } from "react"
import "./index.css"
import SiteHeader from "./sections/SiteHeader/SiteHeader"
import Hero from "./sections/Hero/Hero"
import TrustBar from "./sections/TrustBar/TrustBar"
import About from "./sections/About/About"
import Services from "./sections/Services/Services"
import Methodology from "./sections/Methodology/Methodology"
import Clients from "./sections/Clients/Clients"
import Contact from "./sections/Contact/Contact"
import SiteFooter from "./sections/SiteFooter/SiteFooter"
import ConfirmationPage from "./pages/ConfirmationPage"
import { useMagnetic, usePrefersReducedMotion, useRevealOnScroll } from "./hooks/useUI"

function LandingPage() {
  const reduced = usePrefersReducedMotion()
  useRevealOnScroll(reduced)
  useMagnetic(reduced)

  const [selection, setSelection] = useState({ offer: "", token: 0 })

  const handleSelectService = useCallback(
    (offer) => {
      setSelection((previous) => ({ offer, token: previous.token + 1 }))
      const target = document.getElementById("contacto")
      if (target) target.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" })
    },
    [reduced],
  )

  return (
    <div className="site">
      <a className="skip-link" href="#contenido">
        Saltar al contenido
      </a>

      <SiteHeader />

      <main id="contenido" tabIndex={-1}>
        <Hero reduced={reduced} />
        <TrustBar />
        <About reduced={reduced} />
        <Services onSelectService={handleSelectService} />
        <Methodology />
        <Clients />
        <Contact selectedService={selection.offer} selectionToken={selection.token} />
      </main>

      <SiteFooter />
    </div>
  )
}

export default function App() {
  const token = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("confirmar") : ""

  if (token) {
    return <ConfirmationPage token={token} />
  }

  return <LandingPage />
}
