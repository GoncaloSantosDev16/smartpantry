import { describe, expect, it } from 'vitest'
import { guessCategory, parseQuantity, validateItem } from './pantryHelpers'

describe('parseQuantity', () => {
  it('lê gramas e litros', () => {
    expect(parseQuantity('400 g')).toEqual({ quantity: 400, unit: 'g' })
    expect(parseQuantity('1 L')).toEqual({ quantity: 1, unit: 'L' })
    expect(parseQuantity('1,5 l')).toEqual({ quantity: 1.5, unit: 'L' })
  })
  it('converte cl para ml', () => {
    expect(parseQuantity('33 cl')).toEqual({ quantity: 330, unit: 'ml' })
  })
  it('texto sem número devolve vazio', () => {
    expect(parseQuantity('grande')).toEqual({})
    expect(parseQuantity(undefined)).toEqual({})
  })
})

describe('guessCategory', () => {
  const cats = ['Dairy', 'Beverages', 'Other']
  it('adivinha pela palavra', () => {
    expect(guessCategory('dairies', cats)).toBe('Dairy')
    expect(guessCategory('plant-based-beverages', cats)).toBe('Beverages')
  })
  it('usa Other quando não conhece', () => {
    expect(guessCategory('xyz', cats)).toBe('Other')
  })
})

describe('validateItem (cenários da US-03)', () => {
  const valid = { name: 'Milk', category: 'Dairy', quantity: 2, unit: 'L', expiresOn: '2026-12-01' }
  it('item completo é válido', () => {
    expect(validateItem(valid)).toEqual({})
  })
  it('nome obrigatório', () => {
    expect(validateItem({ ...valid, name: '  ' }).name).toBeDefined()
  })
  it('quantidade inválida', () => {
    expect(validateItem({ ...valid, quantity: -1 }).quantity).toBeDefined()
    expect(validateItem({ ...valid, quantity: 0 }).quantity).toBeDefined()
  })
  it('validade é opcional', () => {
    expect(validateItem({ ...valid, expiresOn: '' })).toEqual({})
  })
})