import { redisCommand, storageConfigured } from "./_storage.js"

const AVAILABILITY_KEY = "mambo:availability"
const ALLOWED_SLOT_MINUTES = [15, 30, 45, 60, 90, 120]
const DEFAULT_WEEKLY = {
  0: { enabled: false, start: "09:00", end: "18:00" },
  1: { enabled: true, start: "09:00", end: "18:00" },
  2: { enabled: true, start: "09:00", end: "18:00" },
  3: { enabled: true, start: "09:00", end: "18:00" },
  4: { enabled: true, start: "09:00", end: "18:00" },
  5: { enabled: true, start: "09:00", end: "18:00" },
  6: { enabled: false, start: "09:00", end: "18:00" },
}

let availabilityMemory = globalThis.__mamboAvailability || null
globalThis.__mamboAvailability = availabilityMemory

export const DEFAULT_AVAILABILITY = {
  slotMinutes: 60,
  minNoticeHours: 2,
  weekly: DEFAULT_WEEKLY,
  blockedDates: [],
}

function isTime(value) {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(String(value || ""))
}

function toMinutes(value) {
  const [hours, minutes] = String(value).split(":").map(Number)
  return hours * 60 + minutes
}

function toTime(minutes) {
  const hours = String(Math.floor(minutes / 60)).padStart(2, "0")
  const mins = String(minutes % 60).padStart(2, "0")
  return `${hours}:${mins}`
}

export function normalizeAvailability(raw) {
  const source = raw && typeof raw === "object" ? raw : {}
  const weekly = {}

  for (let day = 0; day <= 6; day += 1) {
    const current = source.weekly?.[day] || DEFAULT_WEEKLY[day]
    const start = isTime(current.start) ? current.start : "09:00"
    const end = isTime(current.end) ? current.end : "18:00"
    weekly[day] = {
      enabled: Boolean(current.enabled),
      start,
      end: toMinutes(end) > toMinutes(start) ? end : "18:00",
    }
  }

  const slotMinutes = ALLOWED_SLOT_MINUTES.includes(Number(source.slotMinutes))
    ? Number(source.slotMinutes)
    : 60
  const notice = Number(source.minNoticeHours)
  const minNoticeHours = Number.isFinite(notice) && notice >= 0 && notice <= 72 ? notice : 2
  const blockedDates = Array.isArray(source.blockedDates)
    ? Array.from(
        new Set(
          source.blockedDates.filter((date) => /^\d{4}-\d{2}-\d{2}$/.test(String(date))),
        ),
      ).slice(0, 400)
    : []

  return { slotMinutes, minNoticeHours, weekly, blockedDates }
}

export async function getAvailabilitySettings() {
  if (!storageConfigured()) {
    return normalizeAvailability(availabilityMemory || DEFAULT_AVAILABILITY)
  }

  try {
    const raw = await redisCommand(["GET", AVAILABILITY_KEY])
    if (!raw) return normalizeAvailability(DEFAULT_AVAILABILITY)
    return normalizeAvailability(JSON.parse(raw))
  } catch (error) {
    console.error("availability-read-error", error?.message)
    return normalizeAvailability(DEFAULT_AVAILABILITY)
  }
}

export async function saveAvailabilitySettings(raw) {
  const settings = normalizeAvailability(raw)
  if (storageConfigured()) {
    await redisCommand(["SET", AVAILABILITY_KEY, JSON.stringify(settings)])
  } else {
    availabilityMemory = settings
    globalThis.__mamboAvailability = settings
  }
  return settings
}

export function generateSlots(settings, date) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(date))) return []
  const weekday = new Date(`${date}T12:00:00Z`).getUTCDay()
  const day = settings.weekly[weekday]
  if (!day?.enabled) return []

  const start = toMinutes(day.start)
  const end = toMinutes(day.end)
  const slots = []

  for (let minutes = start; minutes + settings.slotMinutes <= end; minutes += settings.slotMinutes) {
    slots.push(toTime(minutes))
  }

  return slots
}

export function getArgentinaNow() {
  const now = new Date(Date.now() - 3 * 60 * 60 * 1000)
  return {
    date: now.toISOString().slice(0, 10),
    minutes: now.getUTCHours() * 60 + now.getUTCMinutes(),
  }
}

export function addDays(date, amount) {
  const value = new Date(`${date}T12:00:00Z`)
  value.setUTCDate(value.getUTCDate() + amount)
  return value.toISOString().slice(0, 10)
}

function meetingTimestamp(date, time) {
  const [year, month, day] = String(date).split("-").map(Number)
  const [hours, minutes] = String(time).split(":").map(Number)
  if ([year, month, day, hours, minutes].some((value) => !Number.isFinite(value))) return null
  return Date.UTC(year, month - 1, day, hours + 3, minutes, 0, 0)
}

export function isSlotAvailable(settings, requests, date, time, excludeId = "") {
  if (!generateSlots(settings, date).includes(time)) return false
  if (settings.blockedDates.includes(date)) return false

  const timestamp = meetingTimestamp(date, time)
  if (!timestamp || timestamp < Date.now() + settings.minNoticeHours * 60 * 60 * 1000) return false

  return !requests.some(
    (request) =>
      request.id !== excludeId &&
      request.date === date &&
      request.time === time &&
      (request.status === "pending" || request.status === "confirmed"),
  )
}

export function computeAvailabilityDays(settings, requests, days = 90) {
  const today = getArgentinaNow().date
  const occupied = new Set(
    requests
      .filter((request) => request.status === "pending" || request.status === "confirmed")
      .map((request) => `${request.date}|${request.time}`),
  )

  const result = []

  for (let index = 0; index < days; index += 1) {
    const date = addDays(today, index)
    const allSlots = generateSlots(settings, date)
    const blocked = settings.blockedDates.includes(date)
    const availableSlots = blocked
      ? []
      : allSlots.filter((time) => {
          const timestamp = meetingTimestamp(date, time)
          return (
            timestamp &&
            timestamp >= Date.now() + settings.minNoticeHours * 60 * 60 * 1000 &&
            !occupied.has(`${date}|${time}`)
          )
        })

    result.push({
      date,
      available: availableSlots.length > 0,
      slots: availableSlots,
    })
  }

  return result
}
