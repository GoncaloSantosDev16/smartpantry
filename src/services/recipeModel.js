// US-13: modelo de receita partilhado entre a IA (GenAI Sous-Chef), o Spoonacular
// e o livro de receitas. Receita guardada na tabela `recipes` do Dexie:
//
//   { id, source: 'genai' | 'spoonacular' | 'manual', externalId?,
//     title, description, prepTimeMinutes, cookTimeMinutes, servings,
//     ingredients: [{ name, quantity, unit }],
//     steps: [{ text, timerSeconds }],
//     savedAt (ISO), timesCooked }

export const RECIPE_SOURCES = ['genai', 'spoonacular', 'manual']

const text = (value) => (typeof value === 'string' ? value.trim() : '')

function toNumber(value) {
  if (value === null || value === undefined || value === '') return null
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

function toMinutes(value) {
  const n = toNumber(value)
  return n !== null && n >= 0 ? Math.round(n) : null
}

function toTimer(value) {
  const n = toNumber(value)
  return n !== null && n > 0 ? Math.round(n) : null
}

/**
 * Converte uma receita (da IA, do Spoonacular ou já guardada) no formato de
 * armazenamento. Devolve null se não tiver título ou ingredientes.
 * Aceita os nomes usados pelo recipesApi.js (amount, readyInMinutes, id, steps[].text).
 */
export function normalizeRecipe(raw, { source } = {}) {
  if (!raw || typeof raw !== 'object') return null

  const title = text(raw.title)
  const ingredients = (Array.isArray(raw.ingredients) ? raw.ingredients : [])
    .map((i) => ({
      name: text(i?.name),
      quantity: toNumber(i?.quantity ?? i?.amount),
      unit: text(i?.unit),
    }))
    .filter((i) => i.name)
  if (!title || ingredients.length === 0) return null

  const steps = (Array.isArray(raw.steps) ? raw.steps : [])
    .map((s) =>
      typeof s === 'string'
        ? { text: text(s), timerSeconds: null }
        : { text: text(s?.text ?? s?.step), timerSeconds: toTimer(s?.timerSeconds) },
    )
    .filter((s) => s.text)

  const wanted = source ?? raw.source
  const recipeSource = RECIPE_SOURCES.includes(wanted) ? wanted : 'manual'
  const externalId = raw.externalId ?? (recipeSource === 'spoonacular' ? raw.id : undefined)

  const recipe = {
    source: recipeSource,
    title,
    description: text(raw.description),
    prepTimeMinutes: toMinutes(raw.prepTimeMinutes),
    cookTimeMinutes: toMinutes(raw.cookTimeMinutes ?? raw.readyInMinutes),
    servings: toNumber(raw.servings) > 0 ? Math.round(toNumber(raw.servings)) : null,
    ingredients,
    steps,
  }
  if (externalId !== undefined && externalId !== null) recipe.externalId = externalId
  return recipe
}

/** Soma preparação e cozedura; null se nenhum dos dois for conhecido. */
export function totalMinutes(recipe) {
  const { prepTimeMinutes: prep, cookTimeMinutes: cook } = recipe ?? {}
  if (prep == null && cook == null) return null
  return (prep ?? 0) + (cook ?? 0)
}

/** 45 -> "45 min", 65 -> "1 h 05 min", 120 -> "2 h" */
export function formatDuration(minutes) {
  if (minutes == null) return ''
  if (minutes < 60) return `${minutes} min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m === 0 ? `${h} h` : `${h} h ${String(m).padStart(2, '0')} min`
}

/** Temporizador de um passo: 45 -> "45 s", 900 -> "15 min", 5400 -> "1 h 30 min" */
export function formatTimer(seconds) {
  if (seconds == null) return ''
  if (seconds < 60) return `${seconds} s`
  return formatDuration(Math.round(seconds / 60))
}

/** "200 g", "2 un"; só o número se não houver unidade; vazio se não houver quantidade. */
export function formatQuantity(ingredient) {
  if (ingredient?.quantity == null) return ''
  return [ingredient.quantity, ingredient.unit].filter((v) => v !== '' && v != null).join(' ')
}

// Receita de exemplo no formato devolvido pelo GenAI Sous-Chef.
// Serve para a rota de desenvolvimento /recipes/demo e para os testes Katalon.
export const DEMO_RECIPE = {
  source: 'genai',
  title: 'Arroz de frango com legumes',
  description: 'Um prato simples para aproveitar as sobras do frigorífico.',
  prepTimeMinutes: 10,
  cookTimeMinutes: 25,
  servings: 2,
  ingredients: [
    { name: 'Arroz', quantity: 200, unit: 'g' },
    { name: 'Frango cozido', quantity: 300, unit: 'g' },
    { name: 'Cenoura', quantity: 2, unit: 'un' },
    { name: 'Azeite', quantity: 20, unit: 'ml' },
  ],
  steps: [
    { text: 'Corta o frango e a cenoura em pedaços pequenos.', timerSeconds: null },
    { text: 'Refoga a cenoura no azeite.', timerSeconds: 300 },
    { text: 'Junta o arroz e a água e deixa cozer.', timerSeconds: 900 },
    { text: 'Mistura o frango, prova o sal e serve.', timerSeconds: null },
  ],
}
