import 'fake-indexeddb/auto'
import { h } from 'vue'
import { beforeEach, describe, expect, it } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory, createRouter, RouterView } from 'vue-router'
import { db } from '@/db'
import { useRecipesStore } from '@/stores/recipes'
import { DEMO_RECIPE } from '@/services/recipeModel'
import MealSummaryView from './MealSummaryView.vue'
import RecipeDetailView from './RecipeDetailView.vue'

const byId = (w, id) => w.find(`[data-testid="${id}"]`)
const row = (w, name) => w.find(`[data-testid="consumed-item"][data-name="${name}"]`)

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
      { path: '/receitas/preview/resumo', name: 'meal-summary-preview', component: MealSummaryView },
      { path: '/receitas/:id(\\d+)/resumo', name: 'meal-summary', component: MealSummaryView },
      { path: '/receitas/:id(\\d+)', name: 'recipe-detail', component: RecipeDetailView },
    ],
  })
  router.push(path)
  await router.isReady()
  const wrapper = mount({ render: () => h(RouterView) }, { global: { plugins: [pinia, router] } })
  await settle()
  return { wrapper, router, store }
}

const withDemo = (store) => store.openPreview(DEMO_RECIPE)

// O IndexedDB (fake-indexeddb) responde em macrotarefas: flushPromises não chega.
const settle = async () => {
  for (let i = 0; i < 5; i++) {
    await new Promise((r) => setTimeout(r, 10))
    await flushPromises()
  }
}

beforeEach(async () => {
  await Promise.all(db.tables.map((t) => t.clear()))
  await db.pantryItems.bulkAdd([
    { name: 'Arroz', quantity: 1, unit: 'kg', category: 'Outro', expirationDate: null },
    { name: 'Cenoura', quantity: 5, unit: 'un', category: 'Outro', expirationDate: null },
    { name: 'Azeite', quantity: 1, unit: 'L', category: 'Outro', expirationDate: null },
  ])
})

const stock = async () => Object.fromEntries((await db.pantryItems.toArray()).map((i) => [i.name, i.quantity]))

describe('MealSummaryView (US-21)', () => {
  it('SCRUM-130: "Concluir receita" abre o resumo', async () => {
    const { wrapper, router } = await open('/receitas/preview', withDemo)
    await byId(wrapper, 'finish-recipe').trigger('click')
    await settle()
    expect(router.currentRoute.value.name).toBe('meal-summary-preview')
    expect(byId(wrapper, 'meal-summary-title').text()).toBe('Arroz de frango com legumes')
  })

  it('propõe as quantidades e mostra o que não está na despensa', async () => {
    const { wrapper } = await open('/receitas/preview/resumo', withDemo)
    expect(row(wrapper, 'Arroz').find('[data-testid="consumed-item-qty"]').element.value).toBe('0.2')
    expect(row(wrapper, 'Arroz').find('[data-testid="consumed-item-unit"]').text()).toBe('kg')
    expect(row(wrapper, 'Cenoura').find('[data-testid="consumed-item-qty"]').element.value).toBe('2')
    expect(byId(wrapper, 'not-in-pantry-item').attributes('data-name')).toBe('Frango cozido')
  })

  it('confirmar desconta da despensa', async () => {
    const { wrapper } = await open('/receitas/preview/resumo', withDemo)
    await byId(wrapper, 'meal-summary-confirm').trigger('click')
    await settle()
    expect(byId(wrapper, 'meal-summary-done').exists()).toBe(true)
    expect(await stock()).toEqual({ Arroz: 0.8, Cenoura: 3, Azeite: 0.98 })
  })

  it('ajustar e excluir antes de confirmar', async () => {
    const { wrapper } = await open('/receitas/preview/resumo', withDemo)
    await row(wrapper, 'Cenoura').find('[data-testid="consumed-item-qty"]').setValue('5')
    await row(wrapper, 'Azeite').find('[data-testid="consumed-item-toggle"]').setValue(false)
    expect(row(wrapper, 'Azeite').attributes('data-included')).toBe('false')
    await byId(wrapper, 'meal-summary-confirm').trigger('click')
    await settle()
    expect(await stock()).toEqual({ Arroz: 0.8, Azeite: 1 })
  })

  it('quantidade inválida mostra erro e bloqueia a confirmação', async () => {
    const { wrapper } = await open('/receitas/preview/resumo', withDemo)
    await row(wrapper, 'Arroz').find('[data-testid="consumed-item-qty"]').setValue('2')
    expect(row(wrapper, 'Arroz').find('[data-testid="consumed-item-error"]').text()).toBe('Só tens 1 kg.')
    expect(byId(wrapper, 'meal-summary-confirm').attributes('disabled')).toBeDefined()
    await row(wrapper, 'Arroz').find('[data-testid="consumed-item-qty"]').setValue('0.5')
    await row(wrapper, 'Cenoura').find('[data-testid="consumed-item-qty"]').setValue('1.5')
    expect(row(wrapper, 'Cenoura').find('[data-testid="consumed-item-error"]').exists()).toBe(true)
    expect(byId(wrapper, 'meal-summary-confirm').attributes('disabled')).toBeDefined()
  })

  it('receita guardada: conta mais uma vez cozinhada', async () => {
    const { id } = await useRecipesStoreSave()
    const { wrapper } = await open(`/receitas/${id}/resumo`)
    await byId(wrapper, 'meal-summary-confirm').trigger('click')
    await settle()
    expect((await db.recipes.get(id)).timesCooked).toBe(1)
  })

  it('sem receita mostra "não encontrada"', async () => {
    const { wrapper } = await open('/receitas/preview/resumo')
    expect(byId(wrapper, 'meal-summary-not-found').exists()).toBe(true)
  })
})

async function useRecipesStoreSave() {
  setActivePinia(createPinia())
  return useRecipesStore().saveRecipe(DEMO_RECIPE, { source: 'genai' })
}
