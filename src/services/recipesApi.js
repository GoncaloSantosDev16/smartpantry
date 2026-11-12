const BASE_URL = 'https://api.spoonacular.com'
 
const norm = (s) => String(s ?? '').trim().toLowerCase()
 


export function computeOverlap(recipeIngredientNames, pantryNames) {
  const pantry = pantryNames.map(norm).filter(Boolean)
  const recipe = recipeIngredientNames.map(norm).filter(Boolean)
  if (recipe.length === 0) return { percent: 0, inStock: [], missing: [] }
 
  const inStock = []
  const missing = []
  for (const ing of recipe) {
    const have = pantry.some((p) => ing.includes(p) || p.includes(ing))
    ;(have ? inStock : missing).push(ing)
  }
  return { percent: Math.round((inStock.length / recipe.length) * 100), inStock, missing }
}
 
// Códigos de erro (mesmos nomes do genai.js, para o GenAIStatus saber quando
// mostrar "Tentar novamente").
const MESSAGES = {
  'missing-key': 'Falta VITE_SPOONACULAR_KEY no .env.local',
  'rate-limit': 'Limite diário da API atingido',
  timeout: 'A pesquisa de receitas demorou demasiado. Tenta novamente.',
  aborted: 'Pedido cancelado.',
  network: 'Sem ligação à internet. Liga-te e tenta novamente.',
  server: 'O serviço de receitas está indisponível neste momento. Tenta mais tarde.',
}
const fail = (code, extra = {}) => ({ status: 'error', code, message: MESSAGES[code] ?? MESSAGES.server, ...extra })

// SCRUM-119 — Resposta simulada, SÓ em desenvolvimento (npm run dev); no build de
// produção este código é removido. Os testes Katalon definem antes do pedido:
//   window.__SMARTPANTRY_SPOONACULAR_MOCK__ = { data: { results: [...] } }  ou  { error: 'rate-limit' }
// e podem ler o pedido feito em window.__SMARTPANTRY_SPOONACULAR_MOCK__.lastRequest.
function devMock(path, params) {
  if (!import.meta.env.DEV) return null
  const mock = globalThis.__SMARTPANTRY_SPOONACULAR_MOCK__
  if (!mock || typeof mock !== 'object') return null
  mock.lastRequest = { path, params: { ...params } }
  if (mock.error) return fail(mock.error)
  return { status: 'ok', data: mock.data ?? {} }
}

async function request(path, params, signal) {
  const mocked = devMock(path, params)
  if (mocked) return mocked

  const key = import.meta.env.VITE_SPOONACULAR_KEY
  if (!key) return fail('missing-key')

  const qs = new URLSearchParams({ ...params, apiKey: key })
  try {
    const res = await fetch(`${BASE_URL}${path}?${qs}`, { signal: signal ?? AbortSignal.timeout(10000) })
    if (res.status === 402) return fail('rate-limit')
    if (!res.ok) return fail('server', { httpStatus: res.status, detail: `HTTP ${res.status}` })
    return { status: 'ok', data: await res.json() }
  } catch (e) {
    if (e?.name === 'TimeoutError') return fail('timeout')
    if (e?.name === 'AbortError') return fail('aborted')
    return fail('network', { detail: e?.message })
  }
}
 
/**
 * Pesquisa receitas com os ingredientes da despensa, respeitando o perfil ativo.
 * profile = { diets: ['vegetarian'], allergies: ['peanut'], excludedIngredients: ['mushroom'] }
 * Nota: o Spoonacular espera nomes em inglês (ex.: 'peanut', 'dairy', 'gluten').
 */
export async function searchRecipes(pantryNames, profile = {}, { number = 10, signal } = {}) {
  const params = {
    includeIngredients: pantryNames.join(','),
    number: String(number),
    addRecipeInformation: 'true',
    fillIngredients: 'true',
    instructionsRequired: 'true',
    // US-09: as que usam mais ingredientes da despensa primeiro; ignora básicos (sal, água…)
    sort: 'max-used-ingredients',
    ignorePantry: 'true',
  }
  if (profile.diets?.length) params.diet = profile.diets.join(',')
  if (profile.allergies?.length) params.intolerances = profile.allergies.join(',')
  if (profile.excludedIngredients?.length) params.excludeIngredients = profile.excludedIngredients.join(',')
 
  const res = await request('/recipes/complexSearch', params, signal)
  if (res.status === 'error') return res
 
  const recipes = (res.data.results ?? []).map((r) => {
    const ingredients = (r.extendedIngredients ?? []).map((i) => ({
      name: i.nameClean ?? i.name,
      amount: i.amount,
      unit: i.unit,
    }))
    const overlap = computeOverlap(ingredients.map((i) => i.name), pantryNames)
    return {
      id: r.id,
      title: r.title,
      image: r.image,
      readyInMinutes: r.readyInMinutes,
      servings: r.servings,
      ingredients,
      steps: (r.analyzedInstructions?.[0]?.steps ?? []).map((s) => ({ number: s.number, text: s.step })),
      overlap,
    }
  })
 
  // Receitas com maior sobreposição primeiro (a prioridade a itens a expirar entra na US-10)
  recipes.sort((a, b) => b.overlap.percent - a.overlap.percent)
  return { status: 'ok', recipes }
}