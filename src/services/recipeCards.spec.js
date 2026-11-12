import { describe, it, expect } from 'vitest'
import { toRecipeCards } from './recipeCards'

const recipe = (id, title, ingredients, extra = {}) => ({
  id,
  title,
  image: null,
  readyInMinutes: 20,
  servings: 2,
  ingredients,
  steps: [{ number: 1, text: 'Cook.' }],
  ...extra,
})

const pantryNames = ['egg', 'rice', 'tomato']

describe('SCRUM-118: toRecipeCards', () => {
  it('mapeia a receita para o cartão, com o que tens e o que falta', () => {
    const [card] = toRecipeCards(
      [
        recipe(1, 'Tomato Rice', [
          { name: 'rice', amount: 200, unit: 'g' },
          { name: 'tomato', amount: 2, unit: '' },
          { name: 'onion', amount: 0.333333, unit: 'cup' },
        ]),
      ],
      pantryNames,
    )
    expect(card).toMatchObject({
      id: 1,
      title: 'Tomato Rice',
      totalMinutes: 20,
      servings: 2,
      percent: 67,
      matched: 2,
      missing: 1,
      ingredients: [
        { name: 'rice', amount: '200 g', inPantry: true },
        { name: 'tomato', amount: '2', inPantry: true },
        { name: 'onion', amount: '0.33 cup', inPantry: false },
      ],
    })
  })

  it('reconhece plural e nomes compostos ("eggs", "cherry tomatoes")', () => {
    const [card] = toRecipeCards([recipe(1, 'X', [{ name: 'eggs' }, { name: 'cherry tomatoes' }])], pantryNames)
    expect(card.percent).toBe(100)
  })

  it('ordena pela maior percentagem de ingredientes que já tens', () => {
    const cards = toRecipeCards(
      [
        recipe(1, 'Metade', [{ name: 'rice' }, { name: 'onion' }]),
        recipe(2, 'Tudo', [{ name: 'eggs' }]),
      ],
      pantryNames,
    )
    expect(cards.map((c) => c.title)).toEqual(['Tudo', 'Metade'])
  })

  it('sem tempo devolve totalMinutes null', () => {
    const [card] = toRecipeCards([recipe(1, 'X', [{ name: 'eggs' }], { readyInMinutes: undefined })], pantryNames)
    expect(card.totalMinutes).toBeNull()
  })

  it('aceita lista vazia', () => {
    expect(toRecipeCards(null, pantryNames)).toEqual([])
  })
})
