// SCRUM-144 — Associa a cada passo de uma receita os ingredientes da receita que
// aparecem no texto desse passo ("Refoga a cenoura no azeite" -> Cenoura, Azeite).
// Funciona com qualquer receita (Spoonacular, IA ou guardada), porque só precisa
// do texto dos passos e dos nomes dos ingredientes.
import { normalizeName } from "./ingredientTranslation";

// Palavras que não identificam um ingrediente ("Frango COM legumes", "olive OIL of…").
const STOP_WORDS = new Set([
  // português
  "de",
  "da",
  "do",
  "das",
  "dos",
  "com",
  "sem",
  "para",
  "por",
  "em",
  "na",
  "no",
  "nas",
  "nos",
  "ao",
  "aos",
  "um",
  "uma",
  "e",
  "o",
  "a",
  "os",
  "as",
  // inglês (receitas do Spoonacular)
  "of",
  "and",
  "the",
  "with",
  "for",
  "to",
  "in",
  "or",
  "fresh",
  "large",
  "small",
  "medium",
]);

// Singular simples, para "ovos" bater com "ovo" e "limões" com "limão".
function singular(word) {
  if (word.endsWith("oes") || word.endsWith("aes"))
    return word.slice(0, -3) + "ao";
  if (word.length > 3 && word.endsWith("s")) return word.slice(0, -1);
  return word;
}

/** Palavras do nome que servem para encontrar o ingrediente no texto. */
function keywords(name) {
  return normalizeName(name)
    .split(" ")
    .filter((word) => word.length >= 3 && !STOP_WORDS.has(word))
    .map(singular);
}

/**
 * Ingredientes da receita usados num passo, pela ordem em que aparecem na receita.
 * Um ingrediente conta se alguma palavra do seu nome aparecer no texto do passo
 * ("Frango cozido" é encontrado em "Mistura o frango…"), sem ligar a maiúsculas,
 * acentos nem plurais.
 */
export function ingredientsForStep(step, ingredients = []) {
  const words = new Set(
    normalizeName(step?.text).split(" ").filter(Boolean).map(singular),
  );
  if (words.size === 0) return [];

  return ingredients.filter((ingredient) =>
    keywords(ingredient?.name).some((word) => words.has(word)),
  );
}

/** Passos da receita, cada um com a lista `ingredients` dos ingredientes que usa. */
export function stepsWithIngredients(recipe) {
  const ingredients = Array.isArray(recipe?.ingredients)
    ? recipe.ingredients
    : [];
  const steps = Array.isArray(recipe?.steps) ? recipe.steps : [];
  return steps.map((step) => ({
    ...step,
    ingredients: ingredientsForStep(step, ingredients),
  }));
}
