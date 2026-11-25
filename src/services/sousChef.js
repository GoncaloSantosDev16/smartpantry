// US-17 — Regras do Sous-Chef (gerar uma receita original com as sobras).
// Funções puras: recebem `now` para serem testáveis.
import { daysUntil, expirationTime, isExpired, isExpiringSoon } from '@/services/expiration'

/**
 * Sobras por ordem de utilidade: primeiro o que expira mais cedo, depois o que
 * não tem validade (por ordem alfabética).
 */
export function sortLeftovers(items = []) {
  const list = Array.isArray(items) ? [...items] : []
  return list.sort((a, b) => {
    const ta = expirationTime(a?.expirationDate)
    const tb = expirationTime(b?.expirationDate)
    if (ta !== null && tb !== null && ta !== tb) return ta - tb
    if (ta !== null && tb === null) return -1
    if (ta === null && tb !== null) return 1
    return String(a?.name ?? '').localeCompare(String(b?.name ?? ''), 'pt')
  })
}

/** Ids dos itens que expiram nas próximas 48 horas (inclui os já expirados). */
export function expiringLeftoverIds(items = [], now = Date.now()) {
  return (Array.isArray(items) ? items : []).filter((item) => isExpiringSoon(item, now)).map((item) => item.id)
}

/** "Expirado", "Expira hoje", "Expira amanhã", "Expira em 5 dias"; vazio sem validade. */
export function expiryLabel(item, now = Date.now()) {
  const days = daysUntil(item?.expirationDate, now)
  if (days === null) return ''
  if (days < 0) return 'Expirado'
  if (days === 0) return 'Expira hoje'
  if (days === 1) return 'Expira amanhã'
  return `Expira em ${days} dias`
}

/** 'expired' | 'soon' | 'ok' | 'none', para escolher a cor do selo. */
export function expiryTone(item, now = Date.now()) {
  if (expirationTime(item?.expirationDate) === null) return 'none'
  if (isExpired(item, now)) return 'expired'
  return isExpiringSoon(item, now) ? 'soon' : 'ok'
}

/**
 * Ingredientes a enviar à IA: só os itens escolhidos, com a quantidade e a
 * unidade que há na despensa.
 */
export function toLeftoverIngredients(items = [], selectedIds = []) {
  const wanted = new Set(selectedIds)
  return (Array.isArray(items) ? items : [])
    .filter((item) => wanted.has(item.id))
    .map((item) => ({ name: item.name, quantity: item.quantity, unit: item.unit }))
}
