import { describe, expect, it, vi } from 'vitest'
import { useRecipeGenerator } from './useRecipeGenerator'

const RECIPE = { title: 'Omelete', ingredients: [], steps: [] }
const INPUT = { ingredients: [{ name: 'Ovos' }], profile: {} }

describe('useRecipeGenerator', () => {
  it('começa em repouso', () => {
    const { loading, error, recipe } = useRecipeGenerator(vi.fn())
    expect(loading.value).toBe(false)
    expect(error.value).toBeNull()
    expect(recipe.value).toBeNull()
  })

  it('liga o loading durante o pedido e guarda a receita no fim', async () => {
    let resolve
    const requestFn = vi.fn(() => new Promise((r) => (resolve = r)))
    const { loading, recipe, generate } = useRecipeGenerator(requestFn)

    const promise = generate(INPUT)
    expect(loading.value).toBe(true)

    resolve({ status: 'ok', recipe: RECIPE })
    expect(await promise).toEqual(RECIPE)
    expect(loading.value).toBe(false)
    expect(recipe.value).toEqual(RECIPE)
  })

  it('guarda o erro (código e mensagem) quando o pedido falha', async () => {
    const requestFn = vi.fn().mockResolvedValue({ status: 'error', code: 'timeout', message: 'Demorou demasiado.' })
    const { loading, error, recipe, generate } = useRecipeGenerator(requestFn)

    expect(await generate(INPUT)).toBeNull()
    expect(error.value).toEqual({ code: 'timeout', message: 'Demorou demasiado.' })
    expect(recipe.value).toBeNull()
    expect(loading.value).toBe(false)
  })

  it('ignora um segundo pedido enquanto o primeiro está em curso', async () => {
    let resolve
    const requestFn = vi.fn(() => new Promise((r) => (resolve = r)))
    const { generate } = useRecipeGenerator(requestFn)

    const first = generate(INPUT)
    expect(await generate(INPUT)).toBeNull()
    expect(requestFn).toHaveBeenCalledTimes(1)

    resolve({ status: 'ok', recipe: RECIPE })
    await first
  })

  it('limpa o erro anterior ao fazer um novo pedido', async () => {
    const requestFn = vi
      .fn()
      .mockResolvedValueOnce({ status: 'error', code: 'network', message: 'Sem internet.' })
      .mockResolvedValueOnce({ status: 'ok', recipe: RECIPE })
    const { error, recipe, generate } = useRecipeGenerator(requestFn)

    await generate(INPUT)
    expect(error.value).not.toBeNull()
    await generate(INPUT)
    expect(error.value).toBeNull()
    expect(recipe.value).toEqual(RECIPE)
  })

  it('cancelar aborta o pedido e não mostra erro', async () => {
    const requestFn = vi.fn(
      (_input, { signal }) =>
        new Promise((resolve) =>
          signal.addEventListener('abort', () => resolve({ status: 'error', code: 'aborted', message: 'Pedido cancelado.' })),
        ),
    )
    const { loading, error, generate, cancel } = useRecipeGenerator(requestFn)

    const promise = generate(INPUT)
    cancel()
    expect(await promise).toBeNull()
    expect(error.value).toBeNull()
    expect(loading.value).toBe(false)
  })

  it('cancel sem pedido em curso não faz nada', () => {
    const { cancel } = useRecipeGenerator(vi.fn())
    expect(() => cancel()).not.toThrow()
  })

  it('reset limpa erro e receita', async () => {
    const requestFn = vi.fn().mockResolvedValue({ status: 'ok', recipe: RECIPE })
    const { recipe, reset, generate } = useRecipeGenerator(requestFn)
    await generate(INPUT)
    reset()
    expect(recipe.value).toBeNull()
  })
})
