import { useEffect, useRef, useState } from "react"
import Icon from "../../components/Icon"
import { CONTACT_EMAIL, CONTACT_PHONE_DISPLAY, CONTACT_PHONE_HREF, NAV_ITEMS } from "../../data/siteData"
import "./SiteHeader.css"

export default function SiteHeader() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState("inicio")
  const progressRef = useRef(null)
  const toggleRef = useRef(null)
  const menuRef = useRef(null)

  useEffect(() => {
    let frame = 0

    const update = () => {
      frame = 0
      const y = window.scrollY
      const scrollable = document.documentElement.scrollHeight - window.innerHeight

      setScrolled(y > 24)
      if (progressRef.current) {
        progressRef.current.style.transform = `scaleX(${scrollable > 0 ? Math.min(y / scrollable, 1) : 0})`
      }

      const probe = y + window.innerHeight * 0.32
      let current = NAV_ITEMS[0].id

      NAV_ITEMS.forEach(({ id }) => {
        const element = document.getElementById(id)
        if (!element) return
        const top = element.getBoundingClientRect().top + y
        if (top <= probe) current = id
      })

      if (y + window.innerHeight >= document.documentElement.scrollHeight - 4) {
        current = NAV_ITEMS[NAV_ITEMS.length - 1].id
      }

      setActive(current)
    }

    const onScroll = () => {
      if (frame) return
      frame = requestAnimationFrame(update)
    }

    update()
    window.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("resize", onScroll)
    return () => {
      window.removeEventListener("scroll", onScroll)
      window.removeEventListener("resize", onScroll)
      cancelAnimationFrame(frame)
    }
  }, [])

  useEffect(() => {
    document.body.classList.toggle("menu-open", open)
    if (!open) return undefined
    const timer = window.setTimeout(() => {
      menuRef.current?.querySelector("a")?.focus()
    }, 380)
    return () => window.clearTimeout(timer)
  }, [open])

  useEffect(() => {
    const onKeyDown = (event) => {
      if (!open) return

      if (event.key === "Escape") {
        setOpen(false)
        toggleRef.current?.focus()
        return
      }

      if (event.key !== "Tab") return

      const focusables = [
        document.querySelector(".brand"),
        toggleRef.current,
        ...Array.from(menuRef.current?.querySelectorAll('a[href], button:not([disabled])') ?? []),
      ].filter(Boolean)

      if (!focusables.length) return
      const first = focusables[0]
      const last = focusables[focusables.length - 1]

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [open])

  const closeMenu = () => setOpen(false)

  return (
    <>
      <div className="scroll-progress" ref={progressRef} aria-hidden="true" />

      <header className={`site-header ${scrolled ? "is-scrolled" : ""} ${open ? "is-open" : ""}`}>
        <div className="container site-header__inner">
          <a className="brand" href="#inicio" aria-label="Mambo Market — Ir al inicio" onClick={closeMenu}>
            <span className="brand__mark" aria-hidden="true">
              <svg viewBox="0 0 40 40" fill="none">
                <path d="M7.5 31.5V9l12.5 12.5L32.5 9v22.5" stroke="currentColor" strokeWidth="4" />
              </svg>
            </span>
            <span className="brand__type">
              <span className="brand__name">Mambo Market</span>
              <span className="brand__sub">Investigación &amp; estrategia</span>
            </span>
          </a>

          <nav className="desktop-nav" aria-label="Navegación principal">
            {NAV_ITEMS.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                className={active === item.id ? "is-active" : ""}
                aria-current={active === item.id ? "location" : undefined}
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="site-header__actions">
            <a className="btn site-header__cta" href="#contacto" data-magnetic>
              Hablemos
              <span className="btn__icon">
                <Icon name="arrow-up-right" size={17} />
              </span>
            </a>
            <button
              ref={toggleRef}
              type="button"
              className="menu-toggle"
              aria-expanded={open}
              aria-controls="mobile-menu"
              aria-label={open ? "Cerrar menú" : "Abrir menú"}
              onClick={() => setOpen((value) => !value)}
            >
              <span />
              <span />
            </button>
          </div>
        </div>
      </header>

      <div
        id="mobile-menu"
        ref={menuRef}
        className={`mobile-menu ${open ? "is-open" : ""}`}
        aria-hidden={!open}
        role="dialog"
        aria-modal={open ? "true" : undefined}
        aria-label="Menú de navegación"
      >
        <div className="mobile-menu__inner">
          <p className="mobile-menu__label">Navegación</p>
          <nav aria-label="Navegación móvil">
            <ul className="mobile-menu__list">
              {NAV_ITEMS.map((item, index) => (
                <li key={item.id} style={{ "--item-index": index }}>
                  <a href={`#${item.id}`} onClick={closeMenu} tabIndex={open ? 0 : -1}>
                    <span className="mobile-menu__index">0{index + 1}</span>
                    <span>{item.label}</span>
                    <Icon name="arrow-up-right" size={22} className="mobile-menu__arrow" />
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="mobile-menu__foot">
            <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
            <a href={`tel:${CONTACT_PHONE_HREF}`}>{CONTACT_PHONE_DISPLAY}</a>
            <p>Tucumán · España · EAU</p>
          </div>
        </div>
      </div>
    </>
  )
}
