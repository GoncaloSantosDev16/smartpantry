// SCRUM-117 — Pesquisa de receitas de catálogo (Spoonacular) com a despensa e o perfil ativo.
import { searchRecipes } from './recipesApi'
import { toEnglishIngredient, toSpoonacularProfile } from './ingredientTranslation'

// Com demasiados ingredientes obrigatórios o Spoonacular deixa de encontrar receitas.
// A lista vem ordenada por validade, por isso enviam-se os que expiram primeiro.
export const MAX_SEARCH_INGREDIENTS = 8

/**
 * ingredients = lista de buildPantryIngredientList
 * profile     = perfil ativo { diets, allergies, excludedIngredients }
 * Devolve { status: 'ok', recipes, pantryNames } ou { status: 'error', code, message }.
 * pantryNames = todos os nomes da despensa em inglês, para calcular o que tens e o que falta.
 */
export async function discoverRecipes({ ingredients = [], profile = {} } = {}, { signal, number = 12 } = {}) {
  const pantryNames = [...new Set(ingredients.map((i) => toEnglishIngredient(i?.name)).filter(Boolean))]
  if (pantryNames.length === 0) {
    return { status: 'error', code: 'no-ingredients', message: 'A despensa está vazia.' }
  }

  const result = await searchRecipes(pantryNames.slice(0, MAX_SEARCH_INGREDIENTS), toSpoonacularProfile(profile), {
    number,
    signal,
  })
  if (result.status !== 'ok') return result
  return { status: 'ok', recipes: result.recipes, pantryNames }
}
