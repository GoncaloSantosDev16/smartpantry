/**
 * SCRUM-67 — Decisão de arranque da aplicação.
 *
 * Função pura: recebe o estado e devolve para onde navegar, sem tocar no
 * router, na base de dados nem no browser. É isso que permite cobrir todas as
 * combinações com testes sem arrancar a aplicação.
 */

export const ROTA_ONBOARDING = "onboarding";
export const ROTA_HOME = "home";

/**
 * @param {object}  estado
 * @param {boolean} estado.temPerfilDefault  existe perfil marcado como default
 * @param {boolean} estado.erroPersistencia  a leitura do armazenamento falhou
 * @param {string}  estado.rotaDestino       nome da rota para onde se navega
 * @returns {{ name: string } | null} destino a forçar, ou null para deixar seguir
 */
export function decidirArranque({
  temPerfilDefault = false,
  erroPersistencia = false,
  rotaDestino = null,
} = {}) {
  // Sem conseguir ler o armazenamento não há como saber se já existe perfil.
  // O onboarding é o único ecrã que funciona sem dados carregados, por isso é
  // para lá que se encaminha — em vez de deixar a aplicação em branco, que era
  // o que acontecia quando o erro propagava para fora do guard.
  if (erroPersistencia) {
    return rotaDestino === ROTA_ONBOARDING ? null : { name: ROTA_ONBOARDING };
  }

  // Primeiro arranque: ainda não há perfil default.
  if (!temPerfilDefault) {
    return rotaDestino === ROTA_ONBOARDING ? null : { name: ROTA_ONBOARDING };
  }

  // Já há perfil: o onboarding deixa de fazer sentido.
  if (rotaDestino === ROTA_ONBOARDING) {
    return { name: ROTA_HOME };
  }

  return null;
}
