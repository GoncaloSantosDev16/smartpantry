/**
 * SCRUM-22 — Tratamento de falhas de acesso à câmara.
 *
 * Funções puras: recebem um erro (ou o estado do ambiente) e devolvem o que
 * mostrar ao utilizador. Não tocam no DOM nem na câmara, pelo que podem ser
 * testadas sem browser, sem permissões e sem hardware.
 */

export const CODIGOS = {
  CONTEXTO_INSEGURO: "CONTEXTO_INSEGURO",
  SEM_SUPORTE: "SEM_SUPORTE",
  PERMISSAO_NEGADA: "PERMISSAO_NEGADA",
  SEM_CAMARA: "SEM_CAMARA",
  CAMARA_OCUPADA: "CAMARA_OCUPADA",
  CAMARA_INCOMPATIVEL: "CAMARA_INCOMPATIVEL",
  LEITOR_INDISPONIVEL: "LEITOR_INDISPONIVEL",
  DESCONHECIDO: "DESCONHECIDO",
};

const DESCRICOES = {
  [CODIGOS.CONTEXTO_INSEGURO]: {
    titulo: "Ligação não segura",
    mensagem: "A câmara só está disponível em páginas servidas por HTTPS.",
    comoResolver:
      "Abre a aplicação através de um endereço https:// (em desenvolvimento, localhost também funciona).",
    podeTentarDeNovo: false,
    permiteCodigoManual: true,
  },
  [CODIGOS.SEM_SUPORTE]: {
    titulo: "Browser não suportado",
    mensagem: "Este browser não permite o acesso à câmara a partir da página.",
    comoResolver: "Experimenta abrir a aplicação no Chrome ou no Safari.",
    podeTentarDeNovo: false,
    permiteCodigoManual: true,
  },
  [CODIGOS.PERMISSAO_NEGADA]: {
    titulo: "Acesso à câmara recusado",
    mensagem: "A aplicação não tem permissão para usar a câmara.",
    comoResolver:
      "Abre as definições do site no browser (o ícone junto ao endereço), autoriza a câmara e tenta novamente.",
    podeTentarDeNovo: true,
    permiteCodigoManual: true,
  },
  [CODIGOS.SEM_CAMARA]: {
    titulo: "Nenhuma câmara encontrada",
    mensagem: "Não foi detetada nenhuma câmara neste dispositivo.",
    comoResolver: "Liga uma câmara ou introduz o código de barras manualmente.",
    podeTentarDeNovo: false,
    permiteCodigoManual: true,
  },
  [CODIGOS.CAMARA_OCUPADA]: {
    titulo: "Câmara indisponível",
    mensagem: "A câmara está a ser usada por outra aplicação.",
    comoResolver:
      "Fecha as aplicações que possam estar a usar a câmara e tenta novamente.",
    podeTentarDeNovo: true,
    permiteCodigoManual: true,
  },
  [CODIGOS.CAMARA_INCOMPATIVEL]: {
    titulo: "Câmara incompatível",
    mensagem:
      "Nenhuma câmara deste dispositivo satisfaz as características pedidas.",
    comoResolver: "Tenta novamente; será usada a câmara disponível.",
    podeTentarDeNovo: true,
    permiteCodigoManual: true,
  },
  [CODIGOS.LEITOR_INDISPONIVEL]: {
    titulo: "Leitor indisponível",
    mensagem:
      "A câmara abriu, mas o leitor de códigos não conseguiu analisar a imagem.",
    comoResolver:
      "Recarrega a página e tenta novamente, ou introduz o código manualmente.",
    podeTentarDeNovo: true,
    permiteCodigoManual: true,
  },
  [CODIGOS.DESCONHECIDO]: {
    titulo: "Não foi possível iniciar a câmara",
    mensagem: "Ocorreu um erro inesperado ao aceder à câmara.",
    comoResolver: "Tenta novamente. Se persistir, recarrega a página.",
    podeTentarDeNovo: true,
    permiteCodigoManual: true,
  },
};

/**
 * Nomes devolvidos pelo getUserMedia. Inclui os nomes antigos, ainda emitidos
 * por alguns browsers, para que o comportamento não dependa da versão.
 */
const POR_NOME = {
  NotAllowedError: CODIGOS.PERMISSAO_NEGADA,
  PermissionDeniedError: CODIGOS.PERMISSAO_NEGADA,
  SecurityError: CODIGOS.PERMISSAO_NEGADA,
  NotFoundError: CODIGOS.SEM_CAMARA,
  DevicesNotFoundError: CODIGOS.SEM_CAMARA,
  NotReadableError: CODIGOS.CAMARA_OCUPADA,
  TrackStartError: CODIGOS.CAMARA_OCUPADA,
  OverconstrainedError: CODIGOS.CAMARA_INCOMPATIVEL,
  ConstraintNotSatisfiedError: CODIGOS.CAMARA_INCOMPATIVEL,
};

/** Devolve a descrição associada a um código. */
export function descrever(codigo) {
  return {
    codigo,
    ...(DESCRICOES[codigo] ?? DESCRICOES[CODIGOS.DESCONHECIDO]),
  };
}

/** Traduz um erro do getUserMedia na descrição a apresentar. */
export function descreverErroCamara(erro) {
  const codigo = POR_NOME[erro?.name] ?? CODIGOS.DESCONHECIDO;
  return descrever(codigo);
}

/** Falha do leitor de códigos depois de a câmara já estar aberta. */
export function descreverErroLeitor() {
  return descrever(CODIGOS.LEITOR_INDISPONIVEL);
}

/**
 * Verifica as condições que impedem sequer a tentativa de abrir a câmara.
 * Devolve a descrição do problema, ou null se o ambiente estiver em condições.
 *
 * Os valores podem ser injetados, para que os testes não dependam do ambiente
 * real em que correm.
 */
export function verificarAmbiente(ambiente = {}) {
  const {
    contextoSeguro = typeof window !== "undefined"
      ? window.isSecureContext
      : false,
    temAcessoCamara = typeof navigator !== "undefined" &&
      typeof navigator.mediaDevices?.getUserMedia === "function",
  } = ambiente;

  if (!contextoSeguro) return descrever(CODIGOS.CONTEXTO_INSEGURO);
  if (!temAcessoCamara) return descrever(CODIGOS.SEM_SUPORTE);
  return null;
}
