import 'fake-indexeddb/auto'
import { describe, it, expect, beforeEach } from 'vitest'
import { db } from './index'

describe('db', () => {
  beforeEach(async () => {
    await Promise.all(db.tables.map((t) => t.clear()))
  })

  it('guarda e lê um perfil', async () => {
    const id = await db.profiles.add({ name: 'Casa', servings: 2, isDefault: true })
    const profile = await db.profiles.get(id)
    expect(profile.name).toBe('Casa')
  })

  it('não permite categorias duplicadas', async () => {
    await db.categories.add({ name: 'Lacticínios' })
    await expect(db.categories.add({ name: 'Lacticínios' })).rejects.toThrow()
  })

  it.each(['profiles', 'pantryItems', 'categories', 'shoppingItems', 'recipes', 'collections'])(
    'permite criar, ler, atualizar e apagar em %s',
    async (table) => {
      const id = await db[table].add({ name: 'x' })
      expect((await db[table].get(id)).name).toBe('x')

      await db[table].update(id, { name: 'y' })
      expect((await db[table].get(id)).name).toBe('y')

      await db[table].delete(id)
      expect(await db[table].get(id)).toBeUndefined()
    },
  )

  it('mantém os dados depois de fechar e reabrir a base de dados', async () => {
    await db.profiles.add({ name: 'Casa', servings: 2, isDefault: true })
    db.close()
    await db.open()
    expect(await db.profiles.count()).toBe(1)
  })

  it('encontra os itens que expiram nas próximas 48 horas', async () => {
    const now = new Date('2026-11-02T12:00:00Z')
    const limit = new Date(now.getTime() + 48 * 60 * 60 * 1000)

    await db.pantryItems.bulkAdd([
      { name: 'Leite', expirationDate: '2026-11-03T12:00:00.000Z' },
      { name: 'Arroz', expirationDate: '2027-01-01T12:00:00.000Z' },
    ])

    const soon = await db.pantryItems
      .where('expirationDate')
      .between(now.toISOString(), limit.toISOString(), true, true)
      .toArray()

    expect(soon.map((i) => i.name)).toEqual(['Leite'])
  })
})