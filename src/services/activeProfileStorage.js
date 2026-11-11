/**
 * SCRUM-104 — Persistência do perfil ativo.
 *
 * Guarda apenas o id do perfil escolhido. Usa o localStorage e não o IndexedDB
 * por ser um valor único, de leitura síncrona, e por evitar uma alteração ao
 * schema do Dexie.
 *
 * Nenhuma função lança: em navegação privada ou com o armazenamento bloqueado
 * o localStorage pode rebentar, e a troca de perfil tem de continuar a
 * funcionar em memória.
 */

export const CHAVE_PERFIL_ATIVO = "smartpantry.activeProfileId";

/** Devolve o id guardado, ou null se não houver nenhum válido. */
export function lerPerfilAtivo() {
  try {
    const valor = localStorage.getItem(CHAVE_PERFIL_ATIVO);
    if (valor === null) return null;
    const id = Number(valor);
    return Number.isInteger(id) && id > 0 ? id : null;
  } catch {
    return null;
  }
}

/** Guarda o id. Devolve false se o armazenamento estiver indisponível. */
export function guardarPerfilAtivo(id) {
  try {
    localStorage.setItem(CHAVE_PERFIL_ATIVO, String(id));
    return true;
  } catch {
    return false;
  }
}

/** Esquece a escolha guardada. */
export function limparPerfilAtivo() {
  try {
    localStorage.removeItem(CHAVE_PERFIL_ATIVO);
  } catch {
    // Sem armazenamento disponível não há nada a limpar.
  }
}
