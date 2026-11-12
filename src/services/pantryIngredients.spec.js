import { describe, it, expect } from 'vitest'
import { buildPantryIngredientList, formatPantryIngredientList } from './pantryIngredients'

const now = new Date('2026-11-12T12:00:00Z')

describe('SCRUM-116: buildPantryIngredientList', () => {
  it('devolve nome, quantidade e unidade de cada item', () => {
    const list = buildPantryIngredientList([{ id: 1, name: 'Leite', quantity: 2, unit: 'L', category: 'Laticínios' }], { now })
    expect(list).toEqual([{ name: 'Leite', quantity: 2, unit: 'L', expirationDate: null }])
  })

  it('ignora itens sem nome, sem quantidade ou já expirados', () => {
    const list = buildPantryIngredientList(
      [
        { name: '  ', quantity: 1, unit: 'un' },
        { name: 'Sal', quantity: 0, unit: 'g' },
        { name: 'Iogurte', quantity: 2, unit: 'un', expirationDate: '2026-11-10T00:00:00Z' },
        { name: 'Arroz', quantity: 1, unit: 'kg' },
      ],
      { now },
    )
    expect(list.map((i) => i.name)).toEqual(['Arroz'])
  })

  it('junta itens com o mesmo nome e unidade', () => {
    const list = buildPantryIngredientList(
      [
        { name: 'Ovos', quantity: 6, unit: 'un' },
        { name: 'ovos', quantity: 4, unit: 'un' },
        { name: 'Ovos', quantity: 0.5, unit: 'kg' },
      ],
      { now },
    )
    expect(list).toHaveLength(2)
    expect(list.find((i) => i.unit === 'un').quantity).toBe(10)
  })

  it('ordena pelos que expiram primeiro e deixa os sem validade no fim', () => {
    const list = buildPantryIngredientList(
      [
        { name: 'Arroz', quantity: 1, unit: 'kg' },
        { name: 'Leite', quantity: 1, unit: 'L', expirationDate: '2026-11-20T00:00:00Z' },
        { name: 'Fiambre', quantity: 200, unit: 'g', expirationDate: '2026-11-13T00:00:00Z' },
      ],
      { now },
    )
    expect(list.map((i) => i.name)).toEqual(['Fiambre', 'Leite', 'Arroz'])
  })

  it('aceita lista vazia ou inválida', () => {
    expect(buildPantryIngredientList([], { now })).toEqual([])
    expect(buildPantryIngredientList(null, { now })).toEqual([])
  })

  it('formata a lista em texto', () => {
    expect(
      formatPantryIngredientList([
        { name: 'Leite', quantity: 2, unit: 'L' },
        { name: 'Ovos', quantity: 6, unit: 'un' },
      ]),
    ).toBe('- Leite: 2 L\n- Ovos: 6 un')
  })
})
