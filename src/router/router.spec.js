import { describe, expect, it } from 'vitest'
import router from './index'

describe('router: rotas das receitas (US-13 e US-16)', () => {
  it('resolve os detalhes de uma receita guardada', () => {
    expect(router.resolve({ name: 'recipe-detail', params: { id: 5 } }).href).toBe('/receitas/5')
    expect(router.resolve('/receitas/5').name).toBe('recipe-detail')
  })

  it('/receitas/preview não é confundido com um id', () => {
    expect(router.resolve('/receitas/preview').name).toBe('recipe-preview')
  })

  it('um id que não é número não corresponde a nenhuma rota de receita', () => {
    expect(router.resolve('/receitas/abc').name).toBeUndefined()
  })

  it('a rota das sugestões de receitas (US-09) continua a funcionar', () => {
    expect(router.resolve('/receitas').name).toBe('recipes')
  })

  it('resolve o ecrã das receitas guardadas (US-16)', () => {
    expect(router.resolve({ name: 'saved-recipes' }).href).toBe('/receitas/guardadas')
    expect(router.resolve('/receitas/guardadas').name).toBe('saved-recipes')
  })

  it('em desenvolvimento existe a rota /receitas/demo', () => {
    expect(router.hasRoute('recipe-demo')).toBe(import.meta.env.DEV)
  })
})
