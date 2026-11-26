import 'fake-indexeddb/auto'
import { h } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory, createRouter, RouterView } from 'vue-router'
import { db } from '@/db'
import { useRecipesStore } from '@/stores/recipes'
import { DEMO_RECIPE } from '@/services/recipeModel'
import SavedRecipesView from './SavedRecipesView.vue'

const byId = (wrapper, id) => wrapper.find(`[data-testid="${id}"]`)
const cards = (wrapper) => wrapper.findAll('[data-testid="recipe-card"]')

async function open(setupPinia) {
  const pinia = createPinia()
  setActivePinia(pinia)
  setupPinia?.(useRecipesStore())

  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'home', component: { render: () => h('div') } },
      { path: '/receitas/guardadas', name: 'saved-recipes', component: SavedRecipesView },
      {
        path: '/receitas/:id(\\d+)',
        name: 'recipe-detail',
        component: { render: () => h('div', { 'data-testid': 'detail-stub' }) },
      },
    ],
  })
  router.push('/receitas/guardadas')
  await router.isReady()

  const wrapper = mount({ render: () => h(RouterView) }, { global: { plugins: [pinia, router] } })
  await flushPromises()
  return { wrapper, router }
}

const seed = (title, savedAt, extra = {}) => db.recipes.add({ ...DEMO_RECIPE, title, savedAt, ...extra })

beforeEach(async () => {
  await Promise.all(db.tables.map((t) => t.clear()))
  vi.restoreAllMocks()
})

describe('SavedRecipesView', () => {
  it('mostra o estado vazio quando não há receitas', async () => {
    const { wrapper } = await open()
    expect(byId(wrapper, 'recipes-empty').text()).toContain('Ainda não guardaste nenhuma receita')
    expect(cards(wrapper)).toHaveLength(0)
  })

  it('lista as receitas guardadas, mais recentes primeiro', async () => {
    await seed('Antiga', '2026-11-01T10:00:00.000Z')
    await seed('Recente', '2026-11-09T10:00:00.000Z')
    const { wrapper } = await open()

    const titulos = wrapper.findAll('[data-testid="recipe-card-title"]').map((t) => t.text())
    expect(titulos).toEqual(['Recente', 'Antiga'])
  })

  it('mostra o resumo: tempo total, doses e ingredientes', async () => {
    await seed('Arroz', '2026-11-09T10:00:00.000Z')
    const { wrapper } = await open()
    expect(byId(wrapper, 'recipe-card-summary').text()).toBe('35 min · 2 doses · 4 ingredientes')
  })

  it('lê sempre da base de dados, mesmo que o store já tivesse dados antigos', async () => {
    const { wrapper } = await open((store) => {
      store.loaded = true
      store.recipes = [{ id: 1, title: 'Fantasma', ingredients: [{ name: 'x' }], steps: [] }]
    })
    expect(wrapper.text()).not.toContain('Fantasma')
    expect(byId(wrapper, 'recipes-empty').exists()).toBe(true)
  })

  it('cada receita abre os seus detalhes', async () => {
    const id = await seed('Arroz', '2026-11-09T10:00:00.000Z')
    const { wrapper, router } = await open()

    expect(cards(wrapper)[0].attributes('href')).toBe(`/receitas/${id}`)
    await cards(wrapper)[0].trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.fullPath).toBe(`/receitas/${id}`)
  })

  it('mostra um erro se a base de dados não puder ser lida', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(db.recipes, 'toArray').mockRejectedValue(new Error('indisponível'))
    const { wrapper } = await open()

    expect(byId(wrapper, 'recipes-error').text()).toContain('Não foi possível ler')
    expect(byId(wrapper, 'recipes-empty').exists()).toBe(false)
  })

  it('mostra "A carregar" enquanto a leitura não termina', async () => {
    let release
    vi.spyOn(db.recipes, 'toArray').mockReturnValue(new Promise((r) => (release = r)))
    const pinia = createPinia()
    setActivePinia(pinia)
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/', name: 'home', component: { render: () => h('div') } },
        { path: '/receitas/guardadas', name: 'saved-recipes', component: SavedRecipesView },
      ],
    })
    router.push('/receitas/guardadas')
    await router.isReady()
    const wrapper = mount({ render: () => h(RouterView) }, { global: { plugins: [pinia, router] } })
    await flushPromises()

    expect(byId(wrapper, 'recipes-loading').exists()).toBe(true)
    release([])
    await flushPromises()
    expect(byId(wrapper, 'recipes-loading').exists()).toBe(false)
    expect(byId(wrapper, 'recipes-empty').exists()).toBe(true)
  })
})

describe('US-15: contador nos cartões das receitas guardadas', () => {
  it('cada cartão mostra quantas vezes a receita foi cozinhada', async () => {
    await seed('Nunca feita', '2026-11-01T10:00:00.000Z', { timesCooked: 0 })
    await seed('Uma vez', '2026-11-02T10:00:00.000Z', { timesCooked: 1 })
    await seed('Favorita', '2026-11-03T10:00:00.000Z', { timesCooked: 5 })
    const { wrapper } = await open()

    const contadores = wrapper.findAll('[data-testid="recipe-card-times-cooked"]')
    expect(contadores.map((c) => c.text())).toEqual([
      '🍳 Cozinhada 5 vezes',
      '🍳 Cozinhada 1 vez',
      '🍳 Ainda não cozinhada',
    ])
    expect(contadores.map((c) => c.attributes('data-count'))).toEqual(['5', '1', '0'])
  })

  it('receitas antigas sem contador mostram "Ainda não cozinhada"', async () => {
    await seed('Antiga', '2026-11-01T10:00:00.000Z')
    const { wrapper } = await open()
    expect(byId(wrapper, 'recipe-card-times-cooked').text()).toContain('Ainda não cozinhada')
  })
})
