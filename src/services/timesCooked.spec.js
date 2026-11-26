import { describe, it, expect } from 'vitest'
import { formatTimesCooked, timesCookedCount } from './timesCooked'

describe('US-15: timesCookedCount', () => {
  it('lê o contador da receita', () => {
    expect(timesCookedCount({ timesCooked: 3 })).toBe(3)
  })

  it('receitas sem contador ou com valores inválidos contam 0', () => {
    expect(timesCookedCount({})).toBe(0)
    expect(timesCookedCount({ timesCooked: -2 })).toBe(0)
    expect(timesCookedCount({ timesCooked: 1.5 })).toBe(0)
    expect(timesCookedCount({ timesCooked: 'abc' })).toBe(0)
    expect(timesCookedCount(null)).toBe(0)
  })
})

describe('US-15: formatTimesCooked', () => {
  it.each([
    [0, 'Ainda não cozinhada'],
    [1, 'Cozinhada 1 vez'],
    [2, 'Cozinhada 2 vezes'],
    [12, 'Cozinhada 12 vezes'],
  ])('%i -> %s', (count, texto) => {
    expect(formatTimesCooked(count)).toBe(texto)
  })

  it('valores inválidos mostram "Ainda não cozinhada"', () => {
    expect(formatTimesCooked(undefined)).toBe('Ainda não cozinhada')
    expect(formatTimesCooked(-1)).toBe('Ainda não cozinhada')
  })
})
