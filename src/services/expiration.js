// US-06 — Regras de validade. Funções puras: recebem `now` para serem testáveis.

export const EXPIRY_WINDOW_HOURS = 48
const HOUR = 60 * 60 * 1000
const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/

const toTime = (now) => (now instanceof Date ? now.getTime() : Number(now))

/**
 * Instante em que o produto deixa de estar válido.
 * "2026-11-17" (input type="date") vale até ao fim desse dia, na hora local.
 */
export function expirationTime(value) {
  if (!value) return null
  const match = DATE_ONLY.exec(String(value))
  if (match) return new Date(+match[1], +match[2] - 1, +match[3], 23, 59, 59, 999).getTime()
  const time = new Date(value).getTime()
  return Number.isNaN(time) ? null : time
}

export function isExpired(item, now = Date.now()) {
  const time = expirationTime(item?.expirationDate)
  return time !== null && time < toTime(now)
}

/** SCRUM-106 — validade <= agora + 48h (inclui os já expirados). */
export function isExpiringSoon(item, now = Date.now(), hours = EXPIRY_WINDOW_HOURS) {
  const time = expirationTime(item?.expirationDate)
  return time !== null && time <= toTime(now) + hours * HOUR
}

/** Itens a expirar, os mais urgentes primeiro. */
export function filterExpiringItems(items = [], now = Date.now(), hours = EXPIRY_WINDOW_HOURS) {
  return (Array.isArray(items) ? items : [])
    .filter((item) => isExpiringSoon(item, now, hours))
    .sort((a, b) => expirationTime(a.expirationDate) - expirationTime(b.expirationDate))
}

const startOfDay = (time) => {
  const d = new Date(time)
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
}

/** Dias de calendário até à validade (0 = hoje, negativo = já passou). */
export function daysUntil(value, now = Date.now()) {
  const time = expirationTime(value)
  if (time === null) return null
  return Math.round((startOfDay(time) - startOfDay(toTime(now))) / (24 * HOUR))
}

/** Texto curto para mostrar ao utilizador. */
export function expiryLabel(value, now = Date.now()) {
  const time = expirationTime(value)
  if (time === null) return ''
  if (time < toTime(now)) return 'Expirado'
  const days = daysUntil(value, now)
  if (days <= 0) return 'Expira hoje'
  if (days === 1) return 'Expira amanhã'
  return `Expira em ${days} dias`
}
