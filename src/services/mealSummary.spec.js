import { describe, expect, it } from 'vitest'
import { DEMO_RECIPE } from './recipeModel'
import {
  buildConsumptionSummary,
  convertQuantity,
  describeConsumption,
  mealSummaryRoute,
  parseUsedQuantity,
  planConsumption,
  validateConsumedLine,
} from './mealSummary'

const now = new Date(2026, 10, 24, 12, 0, 0)

const pantry = [
  { id: 1, name: 'Arroz', quantity: 1, unit: 'kg', expirationDate: null },
  { id: 2, name: 'Cenoura', quantity: 5, unit: 'un', expirationDate: null },
  { id: 3, name: 'Azeite', quantity: 1, unit: 'L', expirationDate: null },
]

const line = (summary, name) => summary.lines.find((l) => l.name === name)

describe('convertQuantity', () => {
  it('converte massa e volume para a unidade da despensa', () => {
    expect(convertQuantity(200, 'g', 'kg')).toBe(0.2)
    expect(convertQuantity(20, 'ml', 'L')).toBe(0.02)
    expect(convertQuantity(1.5, 'kg', 'g')).toBe(1500)
    expect(convertQuantity(2, 'tbsp', 'ml')).toBe(30)
    expect(convertQuantity(3, 'cloves', 'un')).toBe(3)
    expect(convertQuantity(2, '', 'un')).toBe(2)
  })

  it('devolve null para unidades incompatíveis ou desconhecidas', () => {
    expect(convertQuantity(200, 'g', 'L')).toBeNull()
    expect(convertQuantity(1, 'pitada', 'g')).toBeNull()
    expect(convertQuantity(null, 'g', 'kg')).toBeNull()
  })
})

describe('parseUsedQuantity', () => {
  it('aceita vírgula e números; vazio é null', () => {
    expect(parseUsedQuantity('1,5')).toBe(1.5)
    expect(parseUsedQuantity(' 3 ')).toBe(3)
    expect(parseUsedQuantity('')).toBeNull()
    expect(parseUsedQuantity('abc')).toBeNull()
  })
})

describe('buildConsumptionSummary (SCRUM-129)', () => {
  it('propõe as quantidades da receita na unidade da despensa', () => {
    const summary = buildConsumptionSummary(DEMO_RECIPE, pantry, { now })
    expect(summary.lines.map((l) => [l.name, l.quantity, l.unit])).toEqual([
      ['Arroz', 0.2, 'kg'],
      ['Cenoura', 2, 'un'],
      ['Azeite', 0.02, 'L'],
    ])
    expect(summary.lines.every((l) => l.included)).toBe(true)
    expect(summary.notInPantry.map((i) => i.name)).toEqual(['Frango cozido'])
  })

  it('nunca propõe mais do que existe e arredonda unidades para cima', () => {
    const recipe = { ingredients: [{ name: 'Cenoura', quantity: 1.2, unit: '' }, { name: 'Arroz', quantity: 3, unit: 'kg' }] }
    const summary = buildConsumptionSummary(recipe, pantry, { now })
    expect(line(summary, 'Cenoura').quantity).toBe(2)
    expect(line(summary, 'Arroz').quantity).toBe(1)
  })

  it('cruza nomes em inglês (Spoonacular) com a despensa em português', () => {
    const recipe = { ingredients: [{ name: 'rice', quantity: 100, unit: 'g' }, { name: 'carrots', quantity: 1, unit: '' }] }
    const summary = buildConsumptionSummary(recipe, pantry, { now })
    expect(summary.lines.map((l) => l.name)).toEqual(['Arroz', 'Cenoura'])
    expect(line(summary, 'Arroz').quantity).toBe(0.1)
  })

  it('junta lotes do mesmo produto e ignora expirados ou vazios', () => {
    const items = [
      { id: 10, name: 'Leite', quantity: 1, unit: 'L', expirationDate: '2026-11-30' },
      { id: 11, name: 'Leite', quantity: 0.5, unit: 'L', expirationDate: '2026-11-25' },
      { id: 12, name: 'Leite', quantity: 2, unit: 'L', expirationDate: '2026-11-01' },
      { id: 13, name: 'Ovos', quantity: 0, unit: 'un', expirationDate: null },
    ]
    const recipe = { ingredients: [{ name: 'Leite', quantity: 300, unit: 'ml' }, { name: 'Ovos', quantity: 2, unit: '' }] }
    const summary = buildConsumptionSummary(recipe, items, { now })
    expect(line(summary, 'Leite').available).toBe(1.5)
    expect(summary.notInPantry.map((i) => i.name)).toEqual(['Ovos'])
  })

  it('sem conversão possível deixa a quantidade por preencher (ou 1 em unidades)', () => {
    const recipe = { ingredients: [{ name: 'Arroz', quantity: 2, unit: 'cups' }, { name: 'Cenoura', quantity: 1, unit: 'pitada' }] }
    const summary = buildConsumptionSummary(recipe, pantry, { now })
    expect(line(summary, 'Arroz').quantity).toBeNull()
    expect(line(summary, 'Cenoura').quantity).toBe(1)
  })

  it('dois ingredientes do mesmo produto ficam numa só linha', () => {
    const recipe = { ingredients: [{ name: 'Arroz', quantity: 100, unit: 'g' }, { name: 'Arroz agulha', quantity: 150, unit: 'g' }] }
    const summary = buildConsumptionSummary(recipe, pantry, { now })
    expect(summary.lines).toHaveLength(1)
    expect(summary.lines[0].quantity).toBe(0.25)
    expect(summary.lines[0].recipeIngredients).toHaveLength(2)
  })
})

describe('validateConsumedLine', () => {
  const base = { name: 'Arroz', unit: 'kg', available: 1, included: true }

  it('aceita quantidades entre 0 e o disponível', () => {
    expect(validateConsumedLine({ ...base, quantity: '0.5' })).toBeNull()
    expect(validateConsumedLine({ ...base, quantity: '1' })).toBeNull()
    expect(validateConsumedLine({ ...base, quantity: '0' })).toBeNull()
  })

  it('rejeita vazio, negativo e mais do que existe', () => {
    expect(validateConsumedLine({ ...base, quantity: '' })).toMatch(/quantidade/)
    expect(validateConsumedLine({ ...base, quantity: '-1' })).toMatch(/negativa/)
    expect(validateConsumedLine({ ...base, quantity: '2' })).toBe('Só tens 1 kg.')
  })

  it('em unidades só aceita inteiros', () => {
    expect(validateConsumedLine({ ...base, unit: 'un', available: 5, quantity: '1.5' })).toMatch(/inteiros/)
  })

  it('linhas excluídas não são validadas', () => {
    expect(validateConsumedLine({ ...base, included: false, quantity: 'abc' })).toBeNull()
  })
})

describe('planConsumption', () => {
  it('desconta as linhas incluídas e remove o que acaba', () => {
    const { lines } = buildConsumptionSummary(DEMO_RECIPE, pantry, { now })
    line({ lines }, 'Cenoura').quantity = '5'
    line({ lines }, 'Azeite').included = false
    expect(planConsumption(lines, pantry, { now })).toEqual([
      { id: 1, quantity: 0.8 },
      { id: 2, remove: true },
    ])
  })

  it('gasta primeiro os lotes que expiram mais cedo', () => {
    const items = [
      { id: 10, name: 'Leite', quantity: 1, unit: 'L', expirationDate: '2026-11-30' },
      { id: 11, name: 'Leite', quantity: 0.5, unit: 'L', expirationDate: '2026-11-25' },
    ]
    const { lines } = buildConsumptionSummary({ ingredients: [{ name: 'Leite', quantity: 700, unit: 'ml' }] }, items, { now })
    expect(planConsumption(lines, items, { now })).toEqual([
      { id: 11, remove: true },
      { id: 10, quantity: 0.8 },
    ])
  })

  it('lança erro se houver linhas inválidas', () => {
    const { lines } = buildConsumptionSummary(DEMO_RECIPE, pantry, { now })
    line({ lines }, 'Arroz').quantity = '9'
    expect(() => planConsumption(lines, pantry, { now })).toThrow(/Arroz/)
  })
})

describe('mealSummaryRoute (SCRUM-130)', () => {
  it('aponta para a receita guardada ou para a pré-visualização', () => {
    expect(mealSummaryRoute({ id: 7 })).toEqual({ name: 'meal-summary', params: { id: 7 } })
    expect(mealSummaryRoute({ title: 'x' })).toEqual({ name: 'meal-summary-preview' })
  })
})

describe('describeConsumption (US-22 / SCRUM-135)', () => {
  it('mostra o antes e o depois de cada produto e o que acabou', () => {
    const ops = [{ id: 1, quantity: 0.8 }, { id: 2, remove: true }]
    expect(describeConsumption(ops, pantry)).toEqual([
      { name: 'Arroz', unit: 'kg', before: 1, after: 0.8, removed: false },
      { name: 'Cenoura', unit: 'un', before: 5, after: 0, removed: true },
    ])
  })

  it('junta os lotes do mesmo produto', () => {
    const items = [
      { id: 10, name: 'Arroz', quantity: 0.1, unit: 'kg' },
      { id: 11, name: 'Arroz', quantity: 1, unit: 'kg' },
    ]
    expect(describeConsumption([{ id: 10, remove: true }, { id: 11, quantity: 0.9 }], items)).toEqual([
      { name: 'Arroz', unit: 'kg', before: 1.1, after: 0.9, removed: false },
    ])
  })

  it('ignora operações de itens desconhecidos', () => {
    expect(describeConsumption([{ id: 99, remove: true }], pantry)).toEqual([])
  })
})
