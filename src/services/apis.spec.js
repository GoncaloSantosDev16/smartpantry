import { describe, expect, it, vi, afterEach } from 'vitest'
import { computeOverlap } from './recipesApi'
import { lookupProduct } from './productsApi'
 
afterEach(() => vi.unstubAllGlobals())
 
describe('computeOverlap', () => {
  it('calcula a percentagem e separa em stock / em falta', () => {
    const r = computeOverlap(['Eggs', 'Tomato', 'Basil', 'Salt'], ['eggs', 'tomato', 'salt'])
    expect(r.percent).toBe(75)
    expect(r.missing).toEqual(['basil'])
    expect(r.inStock).toEqual(['eggs', 'tomato', 'salt'])
  })
 
  it('receita 100% em stock', () => {
    expect(computeOverlap(['rice'], ['rice']).percent).toBe(100)
  })
 
  it('receita sem ingredientes devolve 0', () => {
    expect(computeOverlap([], ['rice']).percent).toBe(0)
  })
})
 
describe('lookupProduct (com fetch simulado)', () => {
  it('produto encontrado', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        status: 1,
        product: { product_name: 'Oat Drink', brands: 'Alpro, X', quantity: '1 L', categories_tags: ['en:beverages'] },
      }),
    }))
    const r = await lookupProduct('5601234567890')
    expect(r.status).toBe('found')
    expect(r.product).toMatchObject({ name: 'Oat Drink', brand: 'Alpro', quantity: '1 L', category: 'beverages' })
  })
 
  it('produto não encontrado', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({ status: 0 }) }))
    expect((await lookupProduct('0000000000000')).status).toBe('not-found')
  })
 
  it('erro de rede', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')))
    const r = await lookupProduct('123')
    expect(r.status).toBe('error')
  })
})