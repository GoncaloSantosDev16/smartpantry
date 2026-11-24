// US-21 — Resumo de ingredientes consumidos (confirmar/ajustar) no fim de uma receita.
// Funções puras: o ecrã (MealSummaryView) e o store da despensa usam-nas.
import { matchIngredients } from './recipeCoverage'
import { toEnglishIngredient, normalizeName } from './ingredientTranslation'
import { expirationTime, isExpired } from './expiration'

// Unidade -> [dimensão, fator para a unidade base (g, ml, un)].
// Medidas de cozinha (colher, chávena) ficam em ml aproximados.
const UNIT_TABLE = {
  mg: ['mass', 0.001], g: ['mass', 1], gram: ['mass', 1], grama: ['mass', 1],
  kg: ['mass', 1000], kilogram: ['mass', 1000], quilo: ['mass', 1000],
  oz: ['mass', 28.35], ounce: ['mass', 28.35], lb: ['mass', 453.6], pound: ['mass', 453.6],
  ml: ['volume', 1], milliliter: ['volume', 1], millilitre: ['volume', 1],
  cl: ['volume', 10], dl: ['volume', 100],
  l: ['volume', 1000], liter: ['volume', 1000], litre: ['volume', 1000], litro: ['volume', 1000],
  tsp: ['volume', 5], teaspoon: ['volume', 5], colher_de_cha: ['volume', 5],
  tbsp: ['volume', 15], tablespoon: ['volume', 15], colher: ['volume', 15],
  cup: ['volume', 240], chavena: ['volume', 240],
  un: ['count', 1], unit: ['count', 1], unidade: ['count', 1], piece: ['count', 1],
  serving: ['count', 1], clove: ['count', 1], dente: ['count', 1], slice: ['count', 1],
  fatia: ['count', 1], large: ['count', 1], medium: ['count', 1], small: ['count', 1],
  '': ['count', 1],
}

const EPS = 1e-9

/** Arredonda a 3 casas (evita 0.30000000000000004). */
export const round3 = (n) => Math.round(n * 1000) / 1000

function unitInfo(unit) {
  const key = normalizeName(unit ?? '').replace(/\./g, '').replace(/\s+/g, '_')
  if (key in UNIT_TABLE) return UNIT_TABLE[key]
  if (key.endsWith('s') && key.slice(0, -1) in UNIT_TABLE) return UNIT_TABLE[key.slice(0, -1)]
  return null
}

/** 200 g -> kg = 0.2. null se as unidades não forem compatíveis ou forem desconhecidas. */
export function convertQuantity(quantity, fromUnit, toUnit) {
  if (quantity == null || !Number.isFinite(Number(quantity))) return null
  const from = unitInfo(fromUnit)
  const to = unitInfo(toUnit)
  if (!from || !to || from[0] !== to[0]) return null
  return round3((Number(quantity) * from[1]) / to[1])
}

const isCount = (unit) => unitInfo(unit)?.[0] === 'count'

/** "0.2" -> 0.2 ; "1,5" -> 1.5 ; "" -> null */
export function parseUsedQuantity(value) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  const text = String(value ?? '').trim().replace(',', '.')
  if (!text) return null
  const n = Number(text)
  return Number.isFinite(n) ? n : null
}

/** 0.2 -> "0.2", 3 -> "3" */
export const formatAmount = (n) => (n == null ? '' : String(round3(n)))

// Lotes do mesmo produto (mesmo nome e unidade) contam como um só, por validade.
function groupPantry(items, now) {
  const groups = new Map()
  for (const item of items) {
    const quantity = Number(item?.quantity)
    if (!item?.name || !(quantity > 0) || isExpired(item, now)) continue
    const key = `${normalizeName(item.name)}|${item.unit ?? ''}`
    if (!groups.has(key)) groups.set(key, { key, name: item.name, unit: item.unit ?? '', lots: [] })
    groups.get(key).lots.push(item)
  }
  const byExpiry = (a, b) =>
    (expirationTime(a.expirationDate) ?? Infinity) - (expirationTime(b.expirationDate) ?? Infinity)
  return [...groups.values()].map((g) => ({
    ...g,
    lots: [...g.lots].sort(byExpiry),
    available: round3(g.lots.reduce((sum, i) => sum + Number(i.quantity), 0)),
  }))
}

// O ingrediente da receita corresponde a este produto? Compara em português e em inglês.
function matches(recipeName, group) {
  const recipeNames = [recipeName, toEnglishIngredient(recipeName)].filter(Boolean)
  const pantryNames = [group.name, toEnglishIngredient(group.name)].filter(Boolean)
  return recipeNames.some((r) => matchIngredients([r], pantryNames)[0].inPantry)
}

function proposedQuantity(ingredient, group) {
  const converted = convertQuantity(ingredient.quantity, ingredient.unit, group.unit)
  if (converted == null) return isCount(group.unit) ? Math.min(1, group.available) : null
  const value = isCount(group.unit) ? Math.ceil(converted - EPS) : converted
  return round3(Math.min(value, group.available))
}

/**
 * SCRUM-129 — Linhas do resumo para uma receita.
 * Devolve { lines, notInPantry }:
 *   lines: [{ key, name, unit, available, quantity, included, recipeIngredients }]
 *          (name/unit são os da despensa; quantity é a proposta, na unidade da despensa)
 *   notInPantry: ingredientes da receita que não existem na despensa
 */
export function buildConsumptionSummary(recipe, pantryItems = [], { now = Date.now() } = {}) {
  const groups = groupPantry(pantryItems, now)
  const lines = []
  const notInPantry = []

  for (const ingredient of recipe?.ingredients ?? []) {
    const candidates = groups.filter((g) => matches(ingredient.name, g))
    if (candidates.length === 0) {
      notInPantry.push(ingredient)
      continue
    }
    // Prefere um produto cuja unidade dê para converter a quantidade da receita
    const group =
      candidates.find((g) => convertQuantity(ingredient.quantity, ingredient.unit, g.unit) != null) ??
      candidates[0]

    const existing = lines.find((l) => l.key === group.key)
    const proposed = proposedQuantity(ingredient, group)
    if (existing) {
      existing.recipeIngredients.push(ingredient)
      if (existing.quantity != null && proposed != null) {
        existing.quantity = round3(Math.min(existing.quantity + proposed, group.available))
      }
      continue
    }
    lines.push({
      key: group.key,
      name: group.name,
      unit: group.unit,
      available: group.available,
      quantity: proposed,
      included: true,
      recipeIngredients: [ingredient],
    })
  }
  return { lines, notInPantry }
}

/** Erro de uma linha do resumo, ou null se estiver válida (ou excluída). */
export function validateConsumedLine(line) {
  if (!line?.included) return null
  const value = parseUsedQuantity(line.quantity)
  if (value == null) return 'Indica a quantidade usada.'
  if (value < 0) return 'A quantidade não pode ser negativa.'
  if (value > line.available + EPS) return `Só tens ${formatAmount(line.available)} ${line.unit}.`.trim()
  if (isCount(line.unit) && !Number.isInteger(value)) return 'Em unidades, usa números inteiros.'
  return null
}

/**
 * Operações a aplicar à despensa: desconta das linhas incluídas, começando pelos
 * lotes que expiram primeiro. [{ id, quantity }] ou [{ id, remove: true }] quando acaba.
 * Lança erro se alguma linha for inválida.
 */
export function planConsumption(lines, pantryItems = [], { now = Date.now() } = {}) {
  const invalid = lines.find((l) => validateConsumedLine(l))
  if (invalid) throw new Error(`Quantidade inválida para ${invalid.name}.`)

  const groups = new Map(groupPantry(pantryItems, now).map((g) => [g.key, g]))
  const operations = []
  for (const line of lines) {
    if (!line.included) continue
    let remaining = parseUsedQuantity(line.quantity)
    const group = groups.get(line.key)
    if (!group || !(remaining > 0)) continue
    for (const lot of group.lots) {
      if (remaining <= EPS) break
      const take = Math.min(Number(lot.quantity), remaining)
      remaining = round3(remaining - take)
      const left = round3(Number(lot.quantity) - take)
      operations.push(left <= EPS ? { id: lot.id, remove: true } : { id: lot.id, quantity: left })
    }
  }
  return operations
}

/** SCRUM-130 — Rota do resumo para uma receita (usada no fim da receita / Cook Mode). */
export function mealSummaryRoute(recipe) {
  return recipe?.id !== undefined
    ? { name: 'meal-summary', params: { id: recipe.id } }
    : { name: 'meal-summary-preview' }
}
