/**
 * US-11 — Filtros pessoais nas receitas.
 *
 * SCRUM-120: lê as restrições (dietas, alergias e ingredientes excluídos) do
 *            perfil ativo, num formato limpo e sempre igual.
 * SCRUM-121: monta o perfil enviado à GenAI e à API de receitas. Com os filtros
 *            desligados as restrições vão vazias, mas as doses continuam.
 * SCRUM-122: guarda o estado do toggle entre arranques. Começa ligado.
 *
 * Funções puras ou à prova de falhas do armazenamento: nenhuma lança.
 */

export const CHAVE_FILTROS_PESSOAIS = "smartpantry.personalFilters";

const SEM_RESTRICOES = Object.freeze({
  diets: [],
  allergies: [],
  excludedIngredients: [],
});

// Tira espaços, valores vazios e repetidos. Perfis antigos ou incompletos
// podem não ter estes campos, ou tê-los com outro tipo.
function limparLista(valores) {
  if (!Array.isArray(valores)) return [];
  const limpos = valores
    .map((v) => String(v ?? "").trim())
    .filter((v) => v.length > 0);
  return [...new Set(limpos)];
}

/**
 * SCRUM-120 — Restrições do perfil indicado.
 * Devolve listas vazias quando não há perfil ou os filtros estão desligados.
 */
export function restricoesDoPerfil(profile, filtrosLigados = true) {
  if (!profile || !filtrosLigados) {
    return {
      diets: [...SEM_RESTRICOES.diets],
      allergies: [...SEM_RESTRICOES.allergies],
      excludedIngredients: [...SEM_RESTRICOES.excludedIngredients],
    };
  }
  return {
    diets: limparLista(profile.diets),
    allergies: limparLista(profile.allergies),
    excludedIngredients: limparLista(profile.excludedIngredients),
  };
}

/** Verdadeiro se houver pelo menos uma restrição. */
export function temRestricoes(restricoes) {
  return (
    (restricoes?.diets?.length ?? 0) +
      (restricoes?.allergies?.length ?? 0) +
      (restricoes?.excludedIngredients?.length ?? 0) >
    0
  );
}

/**
 * SCRUM-121 — Perfil a enviar à GenAI (buildRecipePrompt) e ao Spoonacular
 * (toSpoonacularProfile). Os dois serviços já leem estes mesmos campos.
 * As doses não são uma restrição, por isso vão sempre.
 */
export function perfilParaPedido(profile, filtrosLigados = true) {
  return {
    servings: profile?.servings,
    ...restricoesDoPerfil(profile, filtrosLigados),
  };
}

/** SCRUM-122 — Estado guardado do toggle. Sem nada guardado, está ligado. */
export function lerFiltrosPessoais() {
  try {
    return localStorage.getItem(CHAVE_FILTROS_PESSOAIS) !== "off";
  } catch {
    return true;
  }
}

/** Guarda o estado. Devolve false se o armazenamento estiver indisponível. */
export function guardarFiltrosPessoais(ligado) {
  try {
    localStorage.setItem(CHAVE_FILTROS_PESSOAIS, ligado ? "on" : "off");
    return true;
  } catch {
    return false;
  }
}
