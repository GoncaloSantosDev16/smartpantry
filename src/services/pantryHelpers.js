// Funções puras de apoio à US-03 (testáveis sem interface).

export const UNITS = ['g', 'kg', 'ml', 'L', 'un']

/**
 * "400 g" -> { quantity: 400, unit: 'g' } ; "1 L" -> { quantity: 1, unit: 'L' }
 * "33 cl" -> { quantity: 330, unit: 'ml' }. Se não perceber, devolve {}.
 */
export function parseQuantity(text) {
  const m = String(text ?? '').trim().match(/^(\d+(?:[.,]\d+)?)\s*(kg|g|ml|cl|l|un)?\b/i)
  if (!m) return {}
  let quantity = Number(m[1].replace(',', '.'))
  let unit = (m[2] ?? 'un').toLowerCase()
  if (unit === 'cl') {
    quantity *= 10
    unit = 'ml'
  }
  if (unit === 'l') unit = 'L'
  return { quantity, unit }
}

// Palavras das categorias do Open Food Facts -> categorias da app
const CATEGORY_KEYWORDS = [
  ['Dairy', ['dairies', 'milk', 'cheese', 'yogurt', 'yoghurt', 'butter', 'cream']],
  ['Beverages', ['beverages', 'drinks', 'water', 'juice', 'soda']],
  ['Meat & Fish', ['meat', 'fish', 'seafood', 'sausage', 'ham', 'poultry']],
  ['Fruits & Vegetables', ['fruit', 'vegetable', 'salad']],
  ['Grains & Pasta', ['cereal', 'pasta', 'rice', 'bread', 'flour', 'biscuit']],
  ['Frozen', ['frozen']],
  ['Canned & Jarred', ['canned', 'preserved', 'jar']],
  ['Spices & Condiments', ['spice', 'sauce', 'condiment', 'oil', 'vinegar', 'salt']],
]

/** Tenta adivinhar a categoria da app a partir da categoria do produto (ou 'Other'). */
export function guessCategory(productCategory, available = []) {
  const text = String(productCategory ?? '').toLowerCase()
  for (const [category, words] of CATEGORY_KEYWORDS) {
    if (words.some((w) => text.includes(w)) && (available.length === 0 || available.includes(category))) {
      return category
    }
  }
  return available.includes('Other') || available.length === 0 ? 'Other' : available[0]
}

/**
 * Valida o formulário de item. Devolve um objeto { campo: 'mensagem' } (vazio = válido).
 */
export function validateItem(item) {
  const errors = {}
  if (!String(item.name ?? '').trim()) errors.name = 'O nome é obrigatório.'
  if (!item.category) errors.category = 'Escolhe uma categoria.'
  const q = Number(item.quantity)
  if (!Number.isFinite(q) || q <= 0) errors.quantity = 'A quantidade deve ser maior que 0.'
  if (!item.unit) errors.unit = 'Escolhe uma unidade.'
  if (item.expiresOn && Number.isNaN(Date.parse(item.expiresOn))) errors.expiresOn = 'Data inválida.'
  return errors
}