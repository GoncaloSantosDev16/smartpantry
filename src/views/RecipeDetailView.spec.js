import 'fake-indexeddb/auto'
import { h } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory, createRouter, RouterView } from 'vue-router'
import { db } from '@/db'
import { useRecipesStore } from '@/stores/recipes'
import { DEMO_RECIPE } from '@/services/recipeModel'
import RecipeDetailView from './RecipeDetailView.vue'

const byId = (wrapper, id) => wrapper.find(`[data-testid="${id}"]`)
const allById = (wrapper, id) => wrapper.findAll(`[data-testid="${id}"]`)

async function open(path, setup) {
  const pinia = createPinia()
  setActivePinia(pinia)
  const store = useRecipesStore()
  await setup?.(store)

  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'home', component: { render: () => h('div', { 'data-testid': 'home' }) } },
      { path: '/receitas/preview', name: 'recipe-preview', component: RecipeDetailView },
      { path: '/receitas/:id(\\d+)', name: 'recipe-detail', component: RecipeDetailView },
    ],
  })
  router.push(path)
  await router.isReady()

  const wrapper = mount({ render: () => h(RouterView) }, { global: { plugins: [pinia, router] } })
  await flushPromises()
  return { wrapper, router, store }
}

beforeEach(async () => {
  await Promise.all(db.tables.map((t) => t.clear()))
  vi.restoreAllMocks()
})

describe('RecipeDetailView: pré-visualização', () => {
  const withDemo = (store) => store.openPreview(DEMO_RECIPE)

  it('mostra título, descrição, tempos e doses', async () => {
    const { wrapper } = await open('/receitas/preview', withDemo)
    expect(byId(wrapper, 'recipe-title').text()).toBe('Arroz de frango com legumes')
    expect(byId(wrapper, 'recipe-description').text()).toContain('sobras')
    const meta = byId(wrapper, 'recipe-meta').text()
    expect(meta).toContain('Preparação: 10 min')
    expect(meta).toContain('Cozedura: 25 min')
    expect(meta).toContain('Total: 35 min')
    expect(meta).toContain('2 doses')
  })

  it('lista os ingredientes com quantidade e os passos com temporizador', async () => {
    const { wrapper } = await open('/receitas/preview', withDemo)
    const ingredientes = allById(wrapper, 'recipe-ingredient')
    expect(ingredientes).toHaveLength(4)
    expect(ingredientes[0].text()).toContain('200 g')
    expect(ingredientes[0].text()).toContain('Arroz')

    expect(allById(wrapper, 'recipe-step')).toHaveLength(4)
    const temporizadores = allById(wrapper, 'recipe-step-timer').map((t) => t.text())
    expect(temporizadores).toEqual(['⏱ 5 min', '⏱ 15 min'])
  })

  it('oferece "Guardar receita" e ainda não está guardada', async () => {
    const { wrapper } = await open('/receitas/preview', withDemo)
    expect(byId(wrapper, 'save-recipe').exists()).toBe(true)
    expect(byId(wrapper, 'saved-badge').exists()).toBe(false)
  })

  it('guardar persiste no IndexedDB e passa a mostrar "Receita guardada"', async () => {
    const { wrapper, router, store } = await open('/receitas/preview', withDemo)
    await byId(wrapper, 'save-recipe').trigger('click')
    await flushPromises()

    expect(await db.recipes.count()).toBe(1)
    const [guardada] = await db.recipes.toArray()
    expect(guardada.title).toBe(DEMO_RECIPE.title)

    expect(byId(wrapper, 'saved-badge').text()).toContain('Receita guardada')
    expect(byId(wrapper, 'save-recipe').exists()).toBe(false)
    expect(router.currentRoute.value.fullPath).toBe(`/receitas/${guardada.id}`)
    expect(store.preview).toBeNull()
  })

  it('um duplo clique em Guardar só grava uma vez', async () => {
    const { wrapper } = await open('/receitas/preview', withDemo)
    const botao = byId(wrapper, 'save-recipe')
    botao.trigger('click')
    botao.trigger('click')
    await flushPromises()
    expect(await db.recipes.count()).toBe(1)
  })

  it('mostra um erro e mantém o botão se a gravação falhar', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(db.recipes, 'add').mockRejectedValue(new Error('quota'))
    const { wrapper } = await open('/receitas/preview', withDemo)

    await byId(wrapper, 'save-recipe').trigger('click')
    await flushPromises()

    expect(byId(wrapper, 'save-error').text()).toContain('Não foi possível guardar')
    expect(byId(wrapper, 'save-recipe').exists()).toBe(true)
    expect(byId(wrapper, 'saved-badge').exists()).toBe(false)
  })

  it('sem receita para mostrar, volta ao início', async () => {
    const { wrapper, router } = await open('/receitas/preview')
    expect(router.currentRoute.value.path).toBe('/')
    expect(byId(wrapper, 'home').exists()).toBe(true)
  })

  it('aceita receitas sem passos nem descrição', async () => {
    const { wrapper } = await open('/receitas/preview', (store) =>
      store.openPreview({ title: 'Salada', ingredients: [{ name: 'Alface', quantity: 1, unit: 'un' }] }),
    )
    expect(byId(wrapper, 'recipe-no-steps').exists()).toBe(true)
    expect(byId(wrapper, 'recipe-description').exists()).toBe(false)
  })
})

describe('RecipeDetailView: receita guardada', () => {
  it('lê a receita do IndexedDB e mostra que já está guardada', async () => {
    const id = await db.recipes.add({ ...DEMO_RECIPE, savedAt: '2026-11-09T10:00:00.000Z', timesCooked: 0 })
    const { wrapper } = await open(`/receitas/${id}`)

    expect(byId(wrapper, 'recipe-title').text()).toBe(DEMO_RECIPE.title)
    expect(allById(wrapper, 'recipe-ingredient')).toHaveLength(4)
    expect(byId(wrapper, 'saved-badge').exists()).toBe(true)
    expect(byId(wrapper, 'save-recipe').exists()).toBe(false)
  })

  it('id que não existe mostra "Receita não encontrada"', async () => {
    const { wrapper } = await open('/receitas/9999')
    expect(byId(wrapper, 'recipe-not-found').text()).toContain('não encontrada')
  })
})
