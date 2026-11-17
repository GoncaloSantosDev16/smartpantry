import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { db } from '@/db'
import { useRecipesStore } from './recipes'
import { DEMO_RECIPE } from '@/services/recipeModel'

const SPOONACULAR = {
  id: 716429,
  title: 'Pasta com alho',
  readyInMinutes: 45,
  servings: 2,
  ingredients: [{ name: 'massa', amount: 200, unit: 'g' }],
  steps: [{ number: 1, text: 'Coze a massa.' }],
}

beforeEach(async () => {
  setActivePinia(createPinia())
  await Promise.all(db.tables.map((t) => t.clear()))
  vi.restoreAllMocks()
})

describe('recipes store: guardar', () => {
  it('guarda a receita no IndexedDB com id, data e contador a zero', async () => {
    const store = useRecipesStore()
    const saved = await store.saveRecipe(DEMO_RECIPE)

    expect(saved.id).toBeTypeOf('number')
    expect(saved.timesCooked).toBe(0)
    expect(saved.savedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/)

    const naBase = await db.recipes.get(saved.id)
    expect(naBase.title).toBe(DEMO_RECIPE.title)
    expect(naBase.ingredients).toHaveLength(4)
    expect(naBase.steps[2].timerSeconds).toBe(900)
  })

  it('a receita guardada sobrevive a um novo store (simula recarregar a app)', async () => {
    await useRecipesStore().saveRecipe(DEMO_RECIPE)

    setActivePinia(createPinia())
    const novo = useRecipesStore()
    await novo.load()
    expect(novo.recipes).toHaveLength(1)
    expect(novo.recipes[0].title).toBe(DEMO_RECIPE.title)
  })

  it('recusa receitas inválidas e não escreve nada', async () => {
    const store = useRecipesStore()
    await expect(store.saveRecipe({ title: 'Sem ingredientes', ingredients: [] })).rejects.toThrow('inválida')
    expect(await db.recipes.count()).toBe(0)
  })

  it('não duplica receitas do Spoonacular', async () => {
    const store = useRecipesStore()
    const a = await store.saveRecipe(SPOONACULAR, { source: 'spoonacular' })
    const b = await store.saveRecipe(SPOONACULAR, { source: 'spoonacular' })
    expect(b.id).toBe(a.id)
    expect(await db.recipes.count()).toBe(1)
  })

  it('receitas da IA iguais guardam-se como registos distintos', async () => {
    const store = useRecipesStore()
    await store.saveRecipe(DEMO_RECIPE)
    await store.saveRecipe(DEMO_RECIPE)
    expect(await db.recipes.count()).toBe(2)
  })

  it('propaga o erro se a escrita falhar', async () => {
    vi.spyOn(db.recipes, 'add').mockRejectedValue(new Error('quota'))
    const store = useRecipesStore()
    await expect(store.saveRecipe(DEMO_RECIPE)).rejects.toThrow('quota')
    expect(store.recipes).toHaveLength(0)
  })
})

describe('recipes store: ler', () => {
  it('load devolve as mais recentes primeiro', async () => {
    await db.recipes.add({ ...DEMO_RECIPE, title: 'Antiga', savedAt: '2026-11-01T10:00:00.000Z' })
    await db.recipes.add({ ...DEMO_RECIPE, title: 'Recente', savedAt: '2026-11-09T10:00:00.000Z' })

    const store = useRecipesStore()
    await store.load()
    expect(store.recipes.map((r) => r.title)).toEqual(['Recente', 'Antiga'])
    expect(store.loaded).toBe(true)
  })

  it('load com forcar volta a ler a base de dados', async () => {
    const store = useRecipesStore()
    await store.load()
    await db.recipes.add({ ...DEMO_RECIPE, savedAt: '2026-11-09T10:00:00.000Z' })

    await store.load()
    expect(store.recipes).toHaveLength(0)
    await store.load({ forcar: true })
    expect(store.recipes).toHaveLength(1)
  })

  it('load nunca rejeita: guarda o erro e marca como carregado', async () => {
    vi.spyOn(db.recipes, 'toArray').mockRejectedValue(new Error('indisponível'))
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const store = useRecipesStore()
    await expect(store.load()).resolves.toBeUndefined()
    expect(store.error).toBeInstanceOf(Error)
    expect(store.recipes).toEqual([])
    expect(store.loaded).toBe(true)
  })

  it('várias chamadas simultâneas a load fazem uma só leitura', async () => {
    const spy = vi.spyOn(db.recipes, 'toArray')
    const store = useRecipesStore()
    await Promise.all([store.load(), store.load(), store.load()])
    expect(spy).toHaveBeenCalledTimes(1)
  })

  it('getById lê da base de dados quando não está em memória', async () => {
    const id = await db.recipes.add({ ...DEMO_RECIPE, savedAt: '2026-11-09T10:00:00.000Z' })
    const store = useRecipesStore()
    expect((await store.getById(id)).title).toBe(DEMO_RECIPE.title)
    expect(await store.getById(9999)).toBeNull()
  })
})

describe('recipes store: pré-visualização', () => {
  it('openPreview guarda a receita normalizada, sem a gravar', async () => {
    const store = useRecipesStore()
    expect(store.openPreview(DEMO_RECIPE)).toBe(true)
    expect(store.preview.title).toBe(DEMO_RECIPE.title)
    expect(await db.recipes.count()).toBe(0)
  })

  it('openPreview com receita inválida devolve false e limpa a pré-visualização', () => {
    const store = useRecipesStore()
    store.openPreview(DEMO_RECIPE)
    expect(store.openPreview({ title: '' })).toBe(false)
    expect(store.preview).toBeNull()
  })

  it('clearPreview limpa a pré-visualização', () => {
    const store = useRecipesStore()
    store.openPreview(DEMO_RECIPE)
    store.clearPreview()
    expect(store.preview).toBeNull()
  })
})
