// SCRUM-118 — Mapeia as receitas do Spoonacular (já normalizadas por searchRecipes)
// para os cartões da grelha.
import { computeOverlap } from './recipesApi'

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
      const names = (recipe.ingredients ?? []).map((i) => i.name)
      const overlap = computeOverlap(names, pantryNames)
      const inStock = new Set(overlap.inStock)

      const ingredients = (recipe.ingredients ?? []).map((i) => ({
        name: i.name,
        amount: formatAmount(i.amount, i.unit),
        inPantry: inStock.has(String(i.name ?? '').trim().toLowerCase()),
      }))
      const matched = ingredients.filter((i) => i.inPantry).length

      return {
        id: recipe.id,
        title: recipe.title,
        image: recipe.image ?? null,
        totalMinutes: Number.isFinite(recipe.readyInMinutes) ? recipe.readyInMinutes : null,
        servings: recipe.servings ?? null,
        percent: overlap.percent,
        matched,
        missing: ingredients.length - matched,
        ingredients,
        steps: recipe.steps ?? [],
      }
    })
    .sort((a, b) => b.percent - a.percent || a.missing - b.missing)
}
