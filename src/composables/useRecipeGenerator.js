// TS-04 / SCRUM-94: estado reativo (loading, erro, resultado) de um pedido à IA.
// Os ecrãs usam isto em vez de repetir try/catch e flags de loading:
//
//   const { loading, error, recipe, generate, cancel } = useRecipeGenerator()
//   await generate({ ingredients, profile })
//
// O pedido real vem de genai.js (que nunca lança exceções); aqui só se gere o estado.

import { ref } from 'vue'
import { generateRecipe } from '@/services/genai'

export function useRecipeGenerator(requestFn = generateRecipe) {
  const loading = ref(false)
  const error = ref(null) // { code, message } ou null
  const recipe = ref(null)
  let controller = null

  /** Devolve a receita, ou null se falhar, for cancelado ou já houver um pedido em curso. */
  async function generate(input) {
    if (loading.value) return null // evita pedidos duplicados (duplo clique)

    loading.value = true
    error.value = null
    recipe.value = null
    controller = new AbortController()

    try {
      const result = await requestFn(input, { signal: controller.signal })
      if (result.status === 'ok') {
        recipe.value = result.recipe
        return result.recipe
      }
      // Cancelar não é um erro para mostrar ao utilizador
      if (result.code !== 'aborted') error.value = { code: result.code, message: result.message }
      return null
    } finally {
      loading.value = false
      controller = null
    }
  }

  function cancel() {
    controller?.abort()
  }

  function reset() {
    error.value = null
    recipe.value = null
  }

  return { loading, error, recipe, generate, cancel, reset }
}
