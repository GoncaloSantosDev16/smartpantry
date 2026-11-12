import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { discoverRecipes, MAX_SEARCH_INGREDIENTS } from './recipeDiscovery'

const spoonacularRecipe = {
  id: 1,
  title: 'Tomato Rice',
  image: 'https://img.spoonacular.com/recipes/1-312x231.jpg',
  readyInMinutes: 30,
  servings: 2,
  extendedIngredients: [{ nameClean: 'rice', amount: 200, unit: 'g' }, { nameClean: 'tomato', amount: 2, unit: '' }],
  analyzedInstructions: [{ steps: [{ number: 1, step: 'Cook the rice.' }] }],
}

const okFetch = (results = [spoonacularRecipe]) =>
  vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({ results }) })

const ingredients = [
  { name: 'Arroz', quantity: 1, unit: 'kg' },
  { name: 'Tomate', quantity: 3, unit: 'un' },
]

beforeEach(() => vi.stubEnv('VITE_SPOONACULAR_KEY', 'chave-de-teste'))
afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
  delete globalThis.__SMARTPANTRY_SPOONACULAR_MOCK__
})

describe('SCRUM-117: discoverRecipes', () => {
  it('pesquisa no Spoonacular com os ingredientes e o perfil em inglês', async () => {
    const fetchMock = okFetch()
    vi.stubGlobal('fetch', fetchMock)

    const result = await discoverRecipes({
      ingredients,
      profile: { diets: ['vegetarian'], allergies: ['Amendoim'], excludedIngredients: ['Cogumelos'] },
    })

    const url = new URL(fetchMock.mock.calls[0][0])
    expect(url.pathname).toBe('/recipes/complexSearch')
    expect(url.searchParams.get('includeIngredients')).toBe('rice,tomato')
    expect(url.searchParams.get('diet')).toBe('vegetarian')
    expect(url.searchParams.get('intolerances')).toBe('peanut')
    expect(url.searchParams.get('excludeIngredients')).toBe('mushrooms')
    expect(url.searchParams.get('sort')).toBe('max-used-ingredients')

    expect(result.status).toBe('ok')
    expect(result.pantryNames).toEqual(['rice', 'tomato'])
    expect(result.recipes[0]).toMatchObject({ id: 1, title: 'Tomato Rice', readyInMinutes: 30 })
  })

  it(`envia no máximo ${MAX_SEARCH_INGREDIENTS} ingredientes, mas guarda todos para comparar`, async () => {
    const fetchMock = okFetch()
    vi.stubGlobal('fetch', fetchMock)
    const many = Array.from({ length: 12 }, (_, i) => ({ name: `Item ${i}`, quantity: 1, unit: 'un' }))

    const result = await discoverRecipes({ ingredients: many })

    const sent = new URL(fetchMock.mock.calls[0][0]).searchParams.get('includeIngredients').split(',')
    expect(sent).toHaveLength(MAX_SEARCH_INGREDIENTS)
    expect(result.pantryNames).toHaveLength(12)
  })

  it('despensa vazia não faz pedidos', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    expect(await discoverRecipes({ ingredients: [] })).toMatchObject({ status: 'error', code: 'no-ingredients' })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('limite diário da API devolve rate-limit', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 402, json: async () => ({}) }))
    expect(await discoverRecipes({ ingredients })).toMatchObject({ status: 'error', code: 'rate-limit' })
  })

  it('sem chave devolve missing-key', async () => {
    vi.stubEnv('VITE_SPOONACULAR_KEY', '')
    expect(await discoverRecipes({ ingredients })).toMatchObject({ status: 'error', code: 'missing-key' })
  })

  it('erro de rede devolve network', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))
    expect(await discoverRecipes({ ingredients })).toMatchObject({ status: 'error', code: 'network' })
  })
})

describe('SCRUM-119: mock de desenvolvimento', () => {
  it('usa a resposta simulada, guarda o pedido e não chama a API', async () => {
    vi.stubEnv('VITE_SPOONACULAR_KEY', '')
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    globalThis.__SMARTPANTRY_SPOONACULAR_MOCK__ = { data: { results: [spoonacularRecipe] } }

    const result = await discoverRecipes({ ingredients })

    expect(result.recipes[0].title).toBe('Tomato Rice')
    expect(globalThis.__SMARTPANTRY_SPOONACULAR_MOCK__.lastRequest.params.includeIngredients).toBe('rice,tomato')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('simula erros', async () => {
    globalThis.__SMARTPANTRY_SPOONACULAR_MOCK__ = { error: 'rate-limit' }
    expect(await discoverRecipes({ ingredients })).toMatchObject({ status: 'error', code: 'rate-limit' })
  })
})
