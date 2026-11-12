// SCRUM-116 — Lista formatada de todos os ingredientes que existem na despensa,
// pronta a enviar ao Sous-Chef. Funções puras (sem base de dados), fáceis de testar.

const round = (n) => Math.round(n * 1000) / 1000
const keyOf = (name, unit) => `${name.toLocaleLowerCase('pt-PT')}|${unit}`
const time = (date) => {
  const t = date ? new Date(date).getTime() : NaN
  return Number.isNaN(t) ? null : t
}

/**
 * Converte os itens da despensa em [{ name, quantity, unit, expirationDate }].
 * - ignora itens sem nome, sem quantidade (> 0) ou já expirados;
 * - junta itens com o mesmo nome e unidade (soma as quantidades);
 * - ordena pelos que expiram primeiro (os sem validade ficam no fim) e depois por nome.
 */
export function buildPantryIngredientList(items = [], { now = new Date() } = {}) {
  const nowTime = new Date(now).getTime()
  const grouped = new Map()

  for (const item of Array.isArray(items) ? items : []) {
    const name = String(item?.name ?? '').replace(/\s+/g, ' ').trim()
    const quantity = Number(item?.quantity)
    const unit = String(item?.unit ?? '').trim() || 'un'
    const expires = time(item?.expirationDate)

    if (!name || !Number.isFinite(quantity) || quantity <= 0) continue
    if (expires !== null && expires < nowTime) continue

    const key = keyOf(name, unit)
    const existing = grouped.get(key)
    if (existing) {
      existing.quantity = round(existing.quantity + quantity)
      if (expires !== null && (existing._expires === null || expires < existing._expires)) {
        existing._expires = expires
        existing.expirationDate = item.expirationDate
      }
    } else {
      grouped.set(key, {
        name,
        quantity: round(quantity),
        unit,
        expirationDate: expires === null ? null : item.expirationDate,
        _expires: expires,
      })
    }
  }

  return [...grouped.values()]
    .sort((a, b) => {
      if (a._expires !== b._expires) {
        if (a._expires === null) return 1
        if (b._expires === null) return -1
        return a._expires - b._expires
      }
      return a.name.localeCompare(b.name, 'pt-PT')
    })
    .map(({ _expires, ...ingredient }) => ingredient)
}

/** Texto legível da lista: "- Leite: 2 L" por linha. */
export function formatPantryIngredientList(list = []) {
  return list.map((i) => `- ${i.name}: ${i.quantity} ${i.unit}`).join('\n')
}
