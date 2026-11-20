// US-10 — % de ingredientes da receita que existem na despensa.

// "Large Eggs!" -> ["large", "eggs"]
const words = (text) =>
  String(text ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean)

// Formas possíveis no singular (inglês): eggs -> egg, tomatoes -> tomato, berries -> berry.
const singulars = (word) => {
  const forms = [word]
  if (word.length > 3 && word.endsWith('ies')) forms.push(word.slice(0, -3) + 'y')
  if (word.length > 3 && word.endsWith('es')) forms.push(word.slice(0, -2))
  if (word.length > 2 && word.endsWith('s')) forms.push(word.slice(0, -1))
  return forms
}

/** Etiquetas de um ingrediente: as palavras do nome, já no singular. */
export function ingredientTags(name) {
  return words(name).map((w) => singulars(w))
}

// Todas as palavras de `needle` aparecem (em alguma forma) em `haystack`.
const covers = (haystack, needle) =>
  needle.length > 0 &&
  needle.every((forms) => haystack.some((other) => other.some((w) => forms.includes(w))))

/**
 * SCRUM-113 — Cruza as etiquetas dos ingredientes da receita com a despensa.
 * "cherry tomatoes" corresponde a "tomato"; "rice" não corresponde a "price".
 * Devolve [{ name, inPantry }] pela mesma ordem da receita.
 */
export function matchIngredients(recipeIngredientNames = [], pantryNames = []) {
  const pantry = pantryNames.map(ingredientTags).filter((t) => t.length > 0)
  return recipeIngredientNames.map((name) => {
    const tags = ingredientTags(name)
    const inPantry = tags.length > 0 && pantry.some((own) => covers(tags, own) || covers(own, tags))
    return { name, inPantry }
  })
}

/** SCRUM-114 — Percentagem arredondada (0–100). Receita sem ingredientes = 0. */
export function coveragePercent(matched, total) {
  if (!Number.isFinite(total) || total <= 0) return 0
  const percent = Math.round((Math.max(0, matched) / total) * 100)
  return Math.min(100, percent)
}

/** SCRUM-114 — "Tem 80% dos ingredientes". */
export function formatCoverage(percent) {
  return `Tem ${percent}% dos ingredientes`
}
