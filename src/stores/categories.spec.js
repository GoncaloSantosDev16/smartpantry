import 'fake-indexeddb/auto'
import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { db } from '@/db'
import { useCategoriesStore } from './categories'

describe('useCategoriesStore (Pinia + Dexie)', () => {
  beforeEach(async () => {
    setActivePinia(createPinia())
    await db.categories.clear()
  })

  it('inicia com a lista custom vazia e loaded a false', () => {
    const store = useCategoriesStore()
    expect(store.custom).toEqual([])
    expect(store.loaded).toBe(false)
    expect(store.all).toContain('Laticínios')
  })

  it('guarda uma nova categoria no Dexie e atualiza o estado local', async () => {
    const store = useCategoriesStore()

    const saved = await store.add('Congelados')

    expect(saved).toBe('Congelados')
    expect(store.custom).toContain('Congelados')
    expect(store.all).toContain('Congelados')

    const inDb = await db.categories.toArray()
    expect(inDb).toHaveLength(1)
    expect(inDb[0].name).toBe('Congelados')
  })

  it('carrega as categorias guardadas no Dexie ao chamar load()', async () => {
    await db.categories.bulkAdd([{ name: 'Molhos' }, { name: 'Padaria' }])
    const store = useCategoriesStore()

    await store.load()

    expect(store.loaded).toBe(true)
    expect(store.custom).toEqual(['Molhos', 'Padaria'])
    expect(store.all).toEqual(expect.arrayContaining(['Laticínios', 'Molhos', 'Padaria']))
  })

  it('rejeita nomes vazios ou apenas com espaços', async () => {
    const store = useCategoriesStore()

    await expect(store.add('   ')).rejects.toThrow('Nome vazio')
    expect(await db.categories.count()).toBe(0)
  })

  it('rejeita categorias duplicadas (ignorando maiúsculas/minúsculas)', async () => {
    const store = useCategoriesStore()
    await store.add('Especiarias')

    await expect(store.add('especiarias')).rejects.toThrow('Categoria duplicada')
    await expect(store.add('fruta')).rejects.toThrow('Categoria duplicada')
    expect(await db.categories.count()).toBe(1)
  })
})