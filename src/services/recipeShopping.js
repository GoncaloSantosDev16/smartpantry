// SCRUM-126 — Envia para a Store da Lista de Compras (SCRUM-52) os ingredientes em
// falta de uma receita (lista do missingIngredients, SCRUM-124).

const normalize = (name) =>
  String(name ?? "")
    .trim()
    .toLocaleLowerCase("pt-PT");

/**
 * Ingredientes que ainda não estão na lista por comprar.
 * O que já lá está (em qualquer unidade) não volta a ser acrescentado: a store
 * somaria a quantidade de cada vez que se carregasse no botão.
 */
export function notOnShoppingList(missing = [], pendingItems = []) {
  const pending = new Set(pendingItems.map((i) => normalize(i.name)));
  return missing.filter((i) => !pending.has(normalize(i.name)));
}

/**
 * Chama store.addItem para cada ingrediente que falta na lista, com 1 unidade:
 * as quantidades do Spoonacular (chávenas, colheres…) não batem com as da app.
 * Devolve os itens acrescentados.
 */
export async function sendToShoppingList(store, missing = []) {
  await store.load();
  const added = [];
  for (const ingredient of notOnShoppingList(missing, store.pendingItems)) {
    added.push(
      await store.addItem({ name: ingredient.name, quantity: 1, unit: "un" }),
    );
  }
  return added;
}
