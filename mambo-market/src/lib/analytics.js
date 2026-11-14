const QUEUE = []
let flushTimer = 0
let initialized = false

function createId(prefix) {
  const random = window.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`
  return `${prefix}-${random}`
}

function getVisitorId() {
  try {
    const existing = window.localStorage.getItem("mm_vid")
    if (existing) return existing
    const id = createId("v")
    window.localStorage.setItem("mm_vid", id)
    return id
  } catch {
    return createId("v")
  }
}

function getSessionId() {
  try {
    const existing = window.sessionStorage.getItem("mm_sid")
    if (existing) return existing
    const id = createId("s")
    window.sessionStorage.setItem("mm_sid", id)
    return id
  } catch {
    return createId("s")
  }
}

function getDevice() {
  if (window.innerWidth < 640) return "mobile"
  if (window.innerWidth < 1024) return "tablet"
  return "desktop"
}

function contexts() {
  return {
    path: window.location.pathname,
    referrer: document.referrer,
    device: getDevice(),
    language: navigator.language || "",
    visitorId: getVisitorId(),
    sessionId: getSessionId(),
  }
}

function flush(useBeacon = false) {
  window.clearTimeout(flushTimer)
  flushTimer = 0
  if (!QUEUE.length) return

  const events = QUEUE.splice(0, 25)
  const payload = JSON.stringify({ events })

  if (useBeacon && navigator.sendBeacon) {
    const blob = new Blob([payload], { type: "application/json" })
    navigator.sendBeacon("/api/analytics", blob)
    return
  }

  fetch("/api/analytics", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: payload,
    keepalive: true,
  }).catch(() => {})
}

function enqueue(event) {
  if (QUEUE.length >= 50) QUEUE.shift()
  QUEUE.push(event)

  if (!flushTimer) {
    flushTimer = window.setTimeout(() => flush(), 3000)
  }
}

function pageView() {
  enqueue({
    type: "page_view",
    title: document.title,
    ...contexts(),
  })
}

function clickLabel(element) {
  const explicit = element.getAttribute("data-track")
  if (explicit) return explicit.slice(0, 80)

  const aria = element.getAttribute("aria-label")
  if (aria) return aria.slice(0, 80)

  return (element.innerText || element.textContent || "").replace(/\s+/g, " ").trim().slice(0, 80)
}

function onDocumentClick(event) {
  const target = event.target
  if (!(target instanceof Element)) return

  const element = target.closest("a, button, [data-track]")
  if (!element || element.hasAttribute("disabled")) return

  const label = clickLabel(element)
  if (!label) return

  let href = ""
  if (element instanceof HTMLAnchorElement && element.href) {
    try {
      const url = new URL(element.href, window.location.origin)
      href = url.pathname
    } catch {
      href = ""
    }
  }

  enqueue({
    type: "click",
    label,
    href,
    ...contexts(),
  })
}

export function initAnalytics() {
  if (import.meta.env.DEV || initialized) return
  if (window.location.pathname.startsWith("/admin")) return

  initialized = true
  pageView()

  document.addEventListener("click", onDocumentClick, { capture: true, passive: true })

  const handleHide = () => flush(true)
  window.addEventListener("pagehide", handleHide)
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") flush(true)
  })
}
