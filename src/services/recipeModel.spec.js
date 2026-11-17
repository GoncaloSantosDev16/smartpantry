import { describe, expect, it } from 'vitest'
import {
  DEMO_RECIPE,
  formatDuration,
  formatQuantity,
  formatTimer,
  normalizeRecipe,
  totalMinutes,
} from './recipeModel'

describe('normalizeRecipe', () => {
  it('aceita a receita de exemplo da IA', () => {
    const recipe = normalizeRecipe(DEMO_RECIPE)
    expect(recipe.source).toBe('genai')
    expect(recipe.ingredients).toHaveLength(4)
    expect(recipe.steps[2].timerSeconds).toBe(900)
    expect(recipe.externalId).toBeUndefined()
  })

  it('aceita o formato do recipesApi (Spoonacular)', () => {
    const recipe = normalizeRecipe(
      {
        id: 716429,
        title: 'Pasta com alho',
        readyInMinutes: 45,
        servings: 2,
        ingredients: [{ name: 'massa', amount: 200, unit: 'g' }],
        steps: [{ number: 1, text: 'Coze a massa.' }],
      },
      { source: 'spoonacular' },
    )
    expect(recipe.externalId).toBe(716429)
    expect(recipe.cookTimeMinutes).toBe(45)
    expect(recipe.ingredients[0].quantity).toBe(200)
    expect(recipe.steps[0]).toEqual({ text: 'Coze a massa.', timerSeconds: null })
  })

  it('nunca copia o id da receita para o registo', () => {
    expect(normalizeRecipe({ ...DEMO_RECIPE, id: 99 })).not.toHaveProperty('id')
  })

  it('limpa espaços e descarta ingredientes e passos vazios', () => {
    const recipe = normalizeRecipe({
      title: '  Omelete  ',
      ingredients: [{ name: ' Ovos ', quantity: '2', unit: 'un' }, { name: '   ' }],
      steps: ['  Bate os ovos.  ', '', { text: '  ' }],
    })
    expect(recipe.title).toBe('Omelete')
    expect(recipe.ingredients).toEqual([{ name: 'Ovos', quantity: 2, unit: 'un' }])
    expect(recipe.steps).toEqual([{ text: 'Bate os ovos.', timerSeconds: null }])
  })

  it('usa "manual" quando a origem é desconhecida', () => {
    expect(normalizeRecipe({ ...DEMO_RECIPE, source: 'outra' }).source).toBe('manual')
  })

  it('normaliza tempos e temporizadores inválidos para null', () => {
    const recipe = normalizeRecipe({
      ...DEMO_RECIPE,
      prepTimeMinutes: -5,
      cookTimeMinutes: 'abc',
      servings: 0,
      steps: [{ text: 'Espera.', timerSeconds: -1 }],
    })
    expect(recipe.prepTimeMinutes).toBeNull()
    expect(recipe.cookTimeMinutes).toBeNull()
    expect(recipe.servings).toBeNull()
    expect(recipe.steps[0].timerSeconds).toBeNull()
  })

  it.each([
    ['null', null],
    ['texto', 'olá'],
    ['sem título', { ...DEMO_RECIPE, title: '  ' }],
    ['sem ingredientes', { ...DEMO_RECIPE, ingredients: [] }],
  ])('devolve null: %s', (_nome, raw) => {
    expect(normalizeRecipe(raw)).toBeNull()
  })

  it('aceita receitas sem passos', () => {
    expect(normalizeRecipe({ ...DEMO_RECIPE, steps: [] }).steps).toEqual([])
  })
})

describe('formatação', () => {
  it('totalMinutes', () => {
    expect(totalMinutes({ prepTimeMinutes: 10, cookTimeMinutes: 25 })).toBe(35)
    expect(totalMinutes({ prepTimeMinutes: null, cookTimeMinutes: 25 })).toBe(25)
    expect(totalMinutes({ prepTimeMinutes: null, cookTimeMinutes: null })).toBeNull()
    expect(totalMinutes(null)).toBeNull()
  })

  it.each([
    [null, ''],
    [45, '45 min'],
    [60, '1 h'],
    [65, '1 h 05 min'],
    [150, '2 h 30 min'],
  ])('formatDuration(%s) = "%s"', (minutes, esperado) => {
    expect(formatDuration(minutes)).toBe(esperado)
  })

  it.each([
    [null, ''],
    [45, '45 s'],
    [900, '15 min'],
    [5400, '1 h 30 min'],
  ])('formatTimer(%s) = "%s"', (seconds, esperado) => {
    expect(formatTimer(seconds)).toBe(esperado)
  })

  it('formatQuantity', () => {
    expect(formatQuantity({ quantity: 200, unit: 'g' })).toBe('200 g')
    expect(formatQuantity({ quantity: 2, unit: '' })).toBe('2')
    expect(formatQuantity({ quantity: null, unit: 'g' })).toBe('')
  })
})
