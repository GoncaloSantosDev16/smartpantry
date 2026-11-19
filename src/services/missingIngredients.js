// SCRUM-124 — Isola, de um cartão de receita (toRecipeCards), os ingredientes que
// estão "Em Falta" na despensa (inPantry: false).
import { normalizeName, toPortugueseIngredient } from "./ingredientTranslation";

/**
 * Devolve [{ name, original }]:
 *   name     = nome a mostrar ao utilizador, em português quando o dicionário o conhece;
 *   original = nome do Spoonacular (inglês), o mesmo que está no cartão.
 * Ingredientes repetidos na receita (ex.: "salt" em dois passos) aparecem uma vez.
 */
export function missingIngredients(card) {
  const seen = new Set();
  const missing = [];

  for (const ingredient of card?.ingredients ?? []) {
    if (ingredient?.inPantry) continue;
    const name = toPortugueseIngredient(ingredient?.name);
    const key = normalizeName(name);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    missing.push({ name, original: ingredient.name });
  }

  return missing;
}
