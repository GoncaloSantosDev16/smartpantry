import { describe, it, expect } from 'vitest'
import { ingredientTags, matchIngredients, coveragePercent, formatCoverage } from './recipeCoverage'

const pantry = ['egg', 'rice', 'tomato']

describe('SCRUM-113: matchIngredients', () => {
  it('marca cada ingrediente como "tem" ou "falta", pela ordem da receita', () => {
    expect(matchIngredients(['rice', 'tomato', 'onion'], pantry)).toEqual([
      { name: 'rice', inPantry: true },
      { name: 'tomato', inPantry: true },
      { name: 'onion', inPantry: false },
    ])
  })

  it('aceita plurais e nomes mais longos', () => {
    expect(matchIngredients(['large eggs', 'cherry tomatoes', 'Basmati Rice'], pantry).every((i) => i.inPantry)).toBe(true)
    expect(matchIngredients(['berries'], ['berry'])[0].inPantry).toBe(true)
  })

  it('aceita o caso inverso (despensa mais específica que a receita)', () => {
    expect(matchIngredients(['chicken'], ['chicken breast'])[0].inPantry).toBe(true)
  })

  it('não confunde palavras parecidas', () => {
    expect(matchIngredients(['price', 'eggplant', 'ricotta'], pantry).some((i) => i.inPantry)).toBe(false)
  })

  it('despensa vazia ou nomes vazios', () => {
    expect(matchIngredients(['rice'], [])[0].inPantry).toBe(false)
    expect(matchIngredients([''], pantry)[0].inPantry).toBe(false)
    expect(matchIngredients([], pantry)).toEqual([])
  })

  it('gera etiquetas sem acentos nem pontuação', () => {
    expect(ingredientTags('Crème-Fraîche')).toEqual([['creme'], ['fraiche']])
  })
})

describe('SCRUM-114: coveragePercent / formatCoverage', () => {
  it.each([
    [2, 2, 100],
    [2, 3, 67],
    [1, 5, 20],
    [1, 4, 25],
    [0, 2, 0],
    [0, 0, 0],
  ])('%i de %i -> %i%%', (matched, total, percent) => {
    expect(coveragePercent(matched, total)).toBe(percent)
  })

  it('formata o texto do cartão', () => {
    expect(formatCoverage(80)).toBe('Tem 80% dos ingredientes')
  })
})
