// US-15 (SCRUM-43) — Contador de vezes que a receita foi cozinhada.
// O contador (timesCooked) é guardado com a receita no IndexedDB e sobe em
// recipes.markCooked(), chamado quando se conclui a refeição no resumo (US-21).
// Aqui fica só a leitura e o texto a mostrar ao utilizador.

/** Número de vezes que a receita foi cozinhada (0 se não tiver contador válido). */
export function timesCookedCount(recipe) {
  const count = Number(recipe?.timesCooked)
  return Number.isInteger(count) && count > 0 ? count : 0
}

/** Texto do contador: "Ainda não cozinhada", "Cozinhada 1 vez", "Cozinhada 3 vezes". */
export function formatTimesCooked(count) {
  const n = Number.isInteger(count) && count > 0 ? count : 0
  if (n === 0) return 'Ainda não cozinhada'
  return `Cozinhada ${n} ${n === 1 ? 'vez' : 'vezes'}`
}
