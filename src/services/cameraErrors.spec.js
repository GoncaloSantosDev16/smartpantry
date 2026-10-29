import { describe, it, expect } from "vitest";
import {
  CODIGOS,
  descrever,
  descreverErroCamara,
  descreverErroLeitor,
  verificarAmbiente,
} from "./cameraErrors";

/** Constrói um erro com o nome que o getUserMedia usaria. */
function erroDom(name) {
  const erro = new Error(name);
  erro.name = name;
  return erro;
}

describe("descreverErroCamara", () => {
  it.each([
    ["NotAllowedError", CODIGOS.PERMISSAO_NEGADA],
    ["PermissionDeniedError", CODIGOS.PERMISSAO_NEGADA],
    ["SecurityError", CODIGOS.PERMISSAO_NEGADA],
    ["NotFoundError", CODIGOS.SEM_CAMARA],
    ["DevicesNotFoundError", CODIGOS.SEM_CAMARA],
    ["NotReadableError", CODIGOS.CAMARA_OCUPADA],
    ["TrackStartError", CODIGOS.CAMARA_OCUPADA],
    ["OverconstrainedError", CODIGOS.CAMARA_INCOMPATIVEL],
    ["ConstraintNotSatisfiedError", CODIGOS.CAMARA_INCOMPATIVEL],
  ])("traduz %s em %s", (nome, esperado) => {
    expect(descreverErroCamara(erroDom(nome)).codigo).toBe(esperado);
  });

  it("usa o código desconhecido para erros não mapeados", () => {
    expect(descreverErroCamara(erroDom("AlgoNovoError")).codigo).toBe(
      CODIGOS.DESCONHECIDO,
    );
  });

  it("não rebenta quando o erro é nulo", () => {
    expect(descreverErroCamara(null).codigo).toBe(CODIGOS.DESCONHECIDO);
  });

  it("não repete a mesma mensagem para falhas diferentes", () => {
    const permissao = descreverErroCamara(erroDom("NotAllowedError"));
    const semCamara = descreverErroCamara(erroDom("NotFoundError"));
    const ocupada = descreverErroCamara(erroDom("NotReadableError"));

    const mensagens = [permissao, semCamara, ocupada].map((d) => d.mensagem);
    expect(new Set(mensagens).size).toBe(3);
  });
});

describe("verificarAmbiente", () => {
  it("bloqueia quando o contexto não é seguro", () => {
    const resultado = verificarAmbiente({ contextoSeguro: false });
    expect(resultado.codigo).toBe(CODIGOS.CONTEXTO_INSEGURO);
  });

  it("bloqueia quando o browser não dá acesso à câmara", () => {
    const resultado = verificarAmbiente({
      contextoSeguro: true,
      temAcessoCamara: false,
    });
    expect(resultado.codigo).toBe(CODIGOS.SEM_SUPORTE);
  });

  it("não bloqueia quando o ambiente está em condições", () => {
    expect(
      verificarAmbiente({ contextoSeguro: true, temAcessoCamara: true }),
    ).toBeNull();
  });
});

describe("descrições", () => {
  it("toda a descrição tem título, mensagem e caminho de resolução", () => {
    for (const codigo of Object.values(CODIGOS)) {
      const d = descrever(codigo);
      expect(d.titulo, codigo).toBeTruthy();
      expect(d.mensagem, codigo).toBeTruthy();
      expect(d.comoResolver, codigo).toBeTruthy();
    }
  });

  it("permite nova tentativa nas falhas transitórias e não nas definitivas", () => {
    expect(descrever(CODIGOS.CAMARA_OCUPADA).podeTentarDeNovo).toBe(true);
    expect(descrever(CODIGOS.PERMISSAO_NEGADA).podeTentarDeNovo).toBe(true);
    expect(descrever(CODIGOS.CONTEXTO_INSEGURO).podeTentarDeNovo).toBe(false);
    expect(descrever(CODIGOS.SEM_CAMARA).podeTentarDeNovo).toBe(false);
  });

  it("descreve a falha do leitor de forma distinta das falhas de câmara", () => {
    expect(descreverErroLeitor().codigo).toBe(CODIGOS.LEITOR_INDISPONIVEL);
    expect(descreverErroLeitor().mensagem).not.toBe(
      descreverErroCamara(erroDom("NotAllowedError")).mensagem,
    );
  });
});
