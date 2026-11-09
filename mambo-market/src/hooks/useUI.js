import { useEffect, useRef, useState } from "react"

export function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  )

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)")
    const update = () => setReduced(query.matches)
    update()
    query.addEventListener("change", update)
    return () => query.removeEventListener("change", update)
  }, [])

  return reduced
}

export function useRevealOnScroll(reduced) {
  useEffect(() => {
    const elements = Array.from(document.querySelectorAll("[data-reveal]"))

    if (reduced || !("IntersectionObserver" in window)) {
      elements.forEach((element) => element.classList.add("is-visible"))
      return undefined
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return
          entry.target.classList.add("is-visible")
          observer.unobserve(entry.target)
        })
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" },
    )

    elements.forEach((element) => observer.observe(element))
    return () => observer.disconnect()
  }, [reduced])
}

export function useMagnetic(reduced) {
  useEffect(() => {
    if (reduced) return undefined
    if (!window.matchMedia("(pointer: fine)").matches) return undefined

    const elements = Array.from(document.querySelectorAll("[data-magnetic]"))
    const cleanups = []

    elements.forEach((element) => {
      let raf = 0
      const strength = 9

      const handleMove = (event) => {
        cancelAnimationFrame(raf)
        raf = requestAnimationFrame(() => {
          const rect = element.getBoundingClientRect()
          const x = (event.clientX - rect.left - rect.width / 2) / rect.width
          const y = (event.clientY - rect.top - rect.height / 2) / rect.height
          element.style.transform = `translate3d(${(x * strength).toFixed(2)}px, ${(y * strength * 0.7).toFixed(2)}px, 0)`
        })
      }

      const handleLeave = () => {
        cancelAnimationFrame(raf)
        element.style.transform = ""
      }

      element.addEventListener("mousemove", handleMove)
      element.addEventListener("mouseleave", handleLeave)
      cleanups.push(() => {
        cancelAnimationFrame(raf)
        element.removeEventListener("mousemove", handleMove)
        element.removeEventListener("mouseleave", handleLeave)
        element.style.transform = ""
      })
    })

    return () => cleanups.forEach((cleanup) => cleanup())
  }, [reduced])
}

export function useInView({ threshold = 0.35, rootMargin = "0px 0px -6% 0px" } = {}) {
  const ref = useRef(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const element = ref.current
    if (!element) return undefined

    if (!("IntersectionObserver" in window)) {
      setInView(true)
      return undefined
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        setInView(true)
        observer.disconnect()
      },
      { threshold, rootMargin },
    )

    observer.observe(element)
    return () => observer.disconnect()
  }, [threshold, rootMargin])

  return [ref, inView]
}

export function useCountUp(target, start, reduced, duration = 1500) {
  const [value, setValue] = useState(reduced ? target : 0)

  useEffect(() => {
    if (!start) return undefined
    if (reduced) {
      setValue(target)
      return undefined
    }

    let frame = 0
    const startTime = performance.now()

    const tick = (now) => {
      const progress = Math.min((now - startTime) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 4)
      setValue(Math.round(target * eased))
      if (progress < 1) frame = requestAnimationFrame(tick)
    }

    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [start, target, reduced, duration])

  return value
}

export function useLocalTime(timeZone) {
  const [time, setTime] = useState("")

  useEffect(() => {
    let formatter
    try {
      formatter = new Intl.DateTimeFormat("es-AR", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
        timeZone,
      })
    } catch {
      setTime("--:--")
      return undefined
    }

    const update = () => setTime(formatter.format(new Date()))
    update()
    const interval = window.setInterval(update, 30000)
    return () => window.clearInterval(interval)
  }, [timeZone])

  return time
}

export function useParallax(reduced, speed = 0.055) {
  const ref = useRef(null)

  useEffect(() => {
    const element = ref.current
    if (!element || reduced) return undefined

    let frame = 0
    const update = () => {
      frame = 0
      const offset = Math.min(window.scrollY * speed, 48)
      element.style.setProperty("--parallax-y", `${offset.toFixed(2)}px`)
    }

    const onScroll = () => {
      if (frame) return
      frame = requestAnimationFrame(update)
    }

    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => {
      window.removeEventListener("scroll", onScroll)
      cancelAnimationFrame(frame)
      element.style.removeProperty("--parallax-y")
    }
  }, [reduced, speed])

  return ref
}
