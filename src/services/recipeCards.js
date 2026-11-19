// SCRUM-118 — Mapeia as receitas do Spoonacular (já normalizadas por searchRecipes)
// para os cartões da grelha.
import { matchIngredients, coveragePercent, formatCoverage } from './recipeCoverage'

const formatAmount = (amount, unit) => {
  const n = Number(amount)
  if (!Number.isFinite(n) || n <= 0) return ''
  const rounded = Math.round(n * 100) / 100
  return `${rounded} ${unit ?? ''}`.trim()
}

/**
 * recipes     = discoverRecipes().recipes
 * pantryNames = discoverRecipes().pantryNames (todos os itens da despensa, em inglês)
 * Ordena pela maior percentagem de ingredientes que já tens.
 */
export function toRecipeCards(recipes = [], pantryNames = []) {
  return (Array.isArray(recipes) ? recipes : [])
    .map((recipe) => {
      const list = recipe.ingredients ?? []
      // SCRUM-113: cruzar as etiquetas dos ingredientes com a despensa
      const matches = matchIngredients(list.map((i) => i.name), pantryNames)

      const ingredients = list.map((i, index) => ({
        name: i.name,
        amount: formatAmount(i.amount, i.unit),
        inPantry: matches[index].inPantry,
      }))
      const matched = ingredients.filter((i) => i.inPantry).length
      // SCRUM-114: percentagem e texto
      const percent = coveragePercent(matched, ingredients.length)

      return {
        id: recipe.id,
        title: recipe.title,
        image: recipe.image ?? null,
        totalMinutes: Number.isFinite(recipe.readyInMinutes) ? recipe.readyInMinutes : null,
        servings: recipe.servings ?? null,
        percent,
        coverageText: formatCoverage(percent),
        matched,
        missing: ingredients.length - matched,
        ingredients,
        steps: recipe.steps ?? [],
      }
    })
    .sort((a, b) => b.percent - a.percent || a.missing - b.missing)
}
