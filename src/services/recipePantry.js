// SCRUM-128 — O "+" de um ingrediente em falta, na pesquisa de receitas, manda-o
// diretamente para a despensa.
import { toPortugueseIngredient } from "./ingredientTranslation";

// Categoria por omissão da app (a mesma que se usa quando não se sabe a categoria).
export const DEFAULT_PANTRY_CATEGORY = "Outro";

/**
 * Item da despensa a partir do nome de um ingrediente do Spoonacular.
 * Fica com 1 unidade e sem validade: o utilizador acerta depois na despensa.
 * Devolve null se o nome estiver vazio.
 */
export function toPantryItem(ingredientName) {
  const name = toPortugueseIngredient(ingredientName);
  if (!name) return null;
  return {
    name,
    quantity: 1,
    unit: "un",
    category: DEFAULT_PANTRY_CATEGORY,
    expirationDate: null,
  };
}
