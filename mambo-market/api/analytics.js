import crypto from "node:crypto"
import { requireAdmin } from "./_auth.js"
import { listAnalyticsEvents, pushAnalyticsEvents } from "./_storage.js"
import { getClientIp, rateLimit, sendRateLimitResponse } from "./_security.js"
import { parseBody, sanitizeLine } from "./_utils.js"

const MAX_EVENTS_PER_REQUEST = 25
const MAX_AGE_MS = 90 * 24 * 60 * 60 * 1000

function decodeHeader(value) {
  if (!value) return ""
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

function cleanPath(value) {
  const raw = sanitizeLine(value, 180)
  if (!raw) return "/"
  try {
    return new URL(raw, "https://mambo.local").pathname.slice(0, 180) || "/"
  } catch {
    return "/"
  }
}

function summarize(events) {
  const now = Date.now()
  const cutoff = now - MAX_AGE_MS
  const recentEvents = events.filter((event) => event.at && event.at >= cutoff)
  const pageViews = recentEvents.filter((event) => event.type === "page_view")
  const clicks = recentEvents.filter((event) => event.type === "click")
  const visitors = new Set(recentEvents.map((event) => event.visitorId).filter(Boolean))
  const sessions = new Set(recentEvents.map((event) => event.sessionId).filter(Boolean))
  const activeVisitors = new Set(
    recentEvents
      .filter((event) => event.at >= now - 30 * 60 * 1000)
      .map((event) => event.visitorId)
      .filter(Boolean),
  )

  const dailyMap = new Map()
  for (let index = 13; index >= 0; index -= 1) {
    const date = new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), new Date().getUTCDate() - index))
    const key = date.toISOString().slice(0, 10)
    dailyMap.set(key, {
      key,
      label: date.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", timeZone: "UTC" }),
      title: date.toLocaleDateString("es-AR", { day: "numeric", month: "long", timeZone: "UTC" }),
      views: 0,
      clicks: 0,
    })
  }

  recentEvents.forEach((event) => {
    const key = new Date(event.at).toISOString().slice(0, 10)
    const bucket = dailyMap.get(key)
    if (!bucket) return
    if (event.type === "page_view") bucket.views += 1
    if (event.type === "click") bucket.clicks += 1
  })

  const countBy = (list, pick) => {
    const counts = new Map()
    list.forEach((event) => {
      const key = pick(event)
      if (!key) return
      counts.set(key, (counts.get(key) || 0) + 1)
    })
    return Array.from(counts.entries())
      .map(([label, count]) => ({ label, count }))
      .sort((left, right) => right.count - left.count)
      .slice(0, 8)
  }

  return {
    totals: {
      pageViews: pageViews.length,
      clicks: clicks.length,
      visitors: visitors.size,
      sessions: sessions.size,
      activeVisitors: activeVisitors.size,
    },
    daily: Array.from(dailyMap.values()),
    topPages: countBy(pageViews, (event) => event.path),
    topClicks: countBy(clicks, (event) => event.label || event.href),
    topLocations: countBy(
      pageViews,
      (event) => [event.city, event.country].filter(Boolean).join(", ") || "Desconocido",
    ),
    recent: [...recentEvents]
      .sort((left, right) => right.at - left.at)
      .slice(0, 30)
      .map((event) => ({
        id: event.id,
        type: event.type,
        path: event.path,
        label: event.label,
        href: event.href,
        visitorId: event.visitorId,
        country: event.country,
        city: event.city,
        at: event.at,
      })),
  }
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store")

  if (req.method === "GET") {
    const session = requireAdmin(req, res, { checkOrigin: false })
    if (!session) return undefined

    try {
      const events = await listAnalyticsEvents()
      return res.status(200).json({ ok: true, analytics: summarize(events) })
    } catch (error) {
      console.error("analytics-read-error", error?.message)
      return res.status(500).json({ error: "ANALYTICS_FAILED", message: "No pudimos cargar la analítica." })
    }
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "METHOD_NOT_ALLOWED", message: "Método no permitido." })
  }

  const ip = getClientIp(req)
  const limit = await rateLimit({ key: `analytics:${ip}`, limit: 120, windowSeconds: 60 })
  if (!limit.allowed) {
    return sendRateLimitResponse(res, limit.retryAfter)
  }

  const body = parseBody(req)
  if (!Array.isArray(body.events) || !body.events.length) {
    return res.status(400).json({ error: "INVALID_EVENTS", message: "Eventos inválidos." })
  }

  const country = decodeHeader(req.headers["x-vercel-ip-country"]).slice(0, 80)
  const city = decodeHeader(req.headers["x-vercel-ip-city"]).slice(0, 100)
  const now = Date.now()

  const events = body.events
    .slice(0, MAX_EVENTS_PER_REQUEST)
    .filter((event) => event && typeof event === "object")
    .map((event) => {
      const type = event.type === "click" ? "click" : "page_view"
      const visitorId = sanitizeLine(event.visitorId, 64)
      const sessionId = sanitizeLine(event.sessionId, 64)

      if (!/^[a-zA-Z0-9-]{8,64}$/.test(visitorId) || !/^[a-zA-Z0-9-]{8,64}$/.test(sessionId)) return null

      return {
        id: crypto.randomUUID(),
        type,
        path: cleanPath(event.path),
        label: sanitizeLine(event.label, 80),
        href: cleanPath(event.href),
        referrer: cleanPath(event.referrer),
        device: sanitizeLine(event.device, 20),
        language: sanitizeLine(event.language, 20),
        visitorId,
        sessionId,
        country,
        city,
        at: now,
      }
    })
    .filter(Boolean)

  if (!events.length) {
    return res.status(400).json({ error: "INVALID_EVENTS", message: "Eventos inválidos." })
  }

  try {
    await pushAnalyticsEvents(events)
    return res.status(200).json({ ok: true })
  } catch (error) {
    console.error("analytics-write-error", error?.message)
    return res.status(500).json({ error: "ANALYTICS_FAILED", message: "No pudimos guardar la analítica." })
  }
}
