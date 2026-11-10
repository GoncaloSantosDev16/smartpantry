import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  CHAVE_PERFIL_ATIVO,
  guardarPerfilAtivo,
  lerPerfilAtivo,
  limparPerfilAtivo,
} from "./activeProfileStorage";

describe("activeProfileStorage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("devolve null quando nada foi guardado", () => {
    expect(lerPerfilAtivo()).toBeNull();
  });

  it("guarda e volta a ler o id do perfil", () => {
    guardarPerfilAtivo(7);
    expect(lerPerfilAtivo()).toBe(7);
  });

  it.each(["abc", "-1", "0", "1.5", ""])(
    "ignora o valor inválido %j",
    (valor) => {
      localStorage.setItem(CHAVE_PERFIL_ATIVO, valor);
      expect(lerPerfilAtivo()).toBeNull();
    },
  );

  it("limpar esquece a escolha", () => {
    guardarPerfilAtivo(3);
    limparPerfilAtivo();
    expect(lerPerfilAtivo()).toBeNull();
  });

  it("não lança quando o armazenamento está indisponível", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("bloqueado");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("bloqueado");
    });
    vi.spyOn(Storage.prototype, "removeItem").mockImplementation(() => {
      throw new Error("bloqueado");
    });

    expect(lerPerfilAtivo()).toBeNull();
    expect(guardarPerfilAtivo(1)).toBe(false);
    expect(() => limparPerfilAtivo()).not.toThrow();
  });
});
