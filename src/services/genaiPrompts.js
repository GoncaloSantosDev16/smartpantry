// TS-04 / SCRUM-93: funções base para construir prompts formatados e validar a
// resposta da IA. São funções puras (sem rede), por isso são fáceis de testar.

// Formato de receita que pedimos à IA. O Modo Cozinha usa `steps[].timerSeconds`
// para disparar os temporizadores e a Conclusão da refeição usa `ingredients`
// para descontar o stock da despensa.
export const RECIPE_JSON_SHAPE = `{
  "title": "string",
  "description": "string (uma frase)",
  "prepTimeMinutes": number,
  "cookTimeMinutes": number,
  "servings": number,
  "ingredients": [
    { "name": "string", "quantity": number, "unit": "g | kg | ml | L | un" }
  ],
  "steps": [
    { "text": "string", "timerSeconds": number ou null }
  ]
}`

// Texto vindo do utilizador vai para dentro do prompt: tiramos quebras de linha
// e limitamos o tamanho para um nome de ingrediente não conseguir "dar ordens" à IA.
const clean = (value) => String(value ?? '').replace(/\s+/g, ' ').trim().slice(0, 80)
const cleanList = (values) => (Array.isArray(values) ? values.map(clean).filter(Boolean) : [])
const listOrNone = (values) => (values.length > 0 ? values.join(', ') : 'nenhum')

/** Instruções fixas: papel da IA, idioma e formato da resposta. */
export function buildSystemPrompt() {
  return [
    'És o Sous-Chef do SmartPantry, um assistente de cozinha que aproveita sobras.',
    'Respondes sempre em português de Portugal.',
    'Respondes APENAS com um objeto JSON válido, sem texto antes ou depois e sem blocos de código markdown.',
    'Cumpres sempre, sem exceções, as restrições alimentares, as alergias e os ingredientes excluídos que te forem indicados.',
  ].join('\n')
}

/**
 * Prompt para gerar uma receita original com as sobras escolhidas.
 * ingredients = [{ name, quantity, unit }]
 * profile     = { servings, diets, allergies, excludedIngredients }  (perfil ativo)
 */
export function buildRecipePrompt({ ingredients = [], profile = {} } = {}) {
  const lines = ingredients
    .map((i) => {
      const name = clean(i?.name)
      if (!name) return null
      const amount = [i?.quantity, clean(i?.unit)].filter((v) => v !== undefined && v !== null && v !== '')
      return amount.length > 0 ? `- ${name}: ${amount.join(' ')}` : `- ${name}`
    })
    .filter(Boolean)

  const servings = Number(profile.servings) >= 1 ? Math.floor(Number(profile.servings)) : 2

  return [
    'Cria uma receita original que use principalmente estes ingredientes disponíveis:',
    ...lines,
    '',
    `Número de doses: ${servings}`,
    `Estilos alimentares: ${listOrNone(cleanList(profile.diets))}`,
    `Alergias (NUNCA usar): ${listOrNone(cleanList(profile.allergies))}`,
    `Ingredientes excluídos (NUNCA usar): ${listOrNone(cleanList(profile.excludedIngredients))}`,
    '',
    'Regras:',
    '- Podes assumir básicos de cozinha (água, sal, pimenta, azeite) sem os listar.',
    '- Evita ingredientes que não estejam na lista, exceto se forem essenciais.',
    '- Usa apenas as unidades g, kg, ml, L ou un.',
    '- Escreve os passos por ordem, curtos e claros.',
    '- Em passos com tempo de espera ou cozedura, indica "timerSeconds" em segundos; nos outros usa null.',
    '',
    'Responde com JSON neste formato exato:',
    RECIPE_JSON_SHAPE,
  ].join('\n')
}

// Alguns modelos devolvem o JSON dentro de ```json ... ``` mesmo quando lhes pedimos que não.
function stripCodeFences(text) {
  const trimmed = String(text ?? '').trim()
  const match = /^```(?:json)?\s*([\s\S]*?)\s*```$/i.exec(trimmed)
  return match ? match[1] : trimmed
}

const isPositive = (n) => typeof n === 'number' && Number.isFinite(n) && n > 0
const nonEmptyString = (s) => typeof s === 'string' && s.trim().length > 0

/**
 * Converte a resposta da IA numa receita validada.
 * Devolve { ok: true, recipe } ou { ok: false, reason }.
 */
export function parseRecipeResponse(text) {
  let data
  try {
    data = JSON.parse(stripCodeFences(text))
  } catch {
    return { ok: false, reason: 'A resposta não é JSON válido.' }
  }

  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return { ok: false, reason: 'A resposta não é um objeto.' }
  }
  if (!nonEmptyString(data.title)) return { ok: false, reason: 'Falta o título.' }
  if (!Array.isArray(data.ingredients) || data.ingredients.length === 0) {
    return { ok: false, reason: 'Faltam os ingredientes.' }
  }
  if (!Array.isArray(data.steps) || data.steps.length === 0) {
    return { ok: false, reason: 'Faltam os passos.' }
  }

  const ingredients = []
  for (const i of data.ingredients) {
    const quantity = i?.quantity === null || i?.quantity === undefined ? null : Number(i.quantity)
    if (!nonEmptyString(i?.name) || (quantity !== null && !Number.isFinite(quantity))) {
      return { ok: false, reason: 'Há um ingrediente inválido.' }
    }
    ingredients.push({ name: i.name.trim(), quantity, unit: nonEmptyString(i.unit) ? i.unit.trim() : '' })
  }

  const steps = []
  for (const s of data.steps) {
    if (!nonEmptyString(s?.text)) return { ok: false, reason: 'Há um passo inválido.' }
    const timer = Number(s.timerSeconds)
    steps.push({ text: s.text.trim(), timerSeconds: isPositive(timer) ? Math.round(timer) : null })
  }

  const minutes = (n) => (Number.isFinite(Number(n)) && Number(n) >= 0 ? Math.round(Number(n)) : null)

  return {
    ok: true,
    recipe: {
      title: data.title.trim(),
      description: nonEmptyString(data.description) ? data.description.trim() : '',
      prepTimeMinutes: minutes(data.prepTimeMinutes),
      cookTimeMinutes: minutes(data.cookTimeMinutes),
      servings: isPositive(Number(data.servings)) ? Math.round(Number(data.servings)) : null,
      ingredients,
      steps,
    },
  }
}
