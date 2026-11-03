import { describe, it, expect } from "vitest";
import { decidirArranque, ROTA_HOME, ROTA_ONBOARDING } from "./startup";

describe("decidirArranque — primeiro arranque", () => {
  it("encaminha para o onboarding quando não há perfil default", () => {
    expect(
      decidirArranque({ temPerfilDefault: false, rotaDestino: ROTA_HOME }),
    ).toEqual({ name: ROTA_ONBOARDING });
  });

  it("deixa seguir quando já se está no onboarding sem perfil", () => {
    expect(
      decidirArranque({
        temPerfilDefault: false,
        rotaDestino: ROTA_ONBOARDING,
      }),
    ).toBeNull();
  });

  it("força o onboarding mesmo em rotas que não a inicial", () => {
    expect(
      decidirArranque({ temPerfilDefault: false, rotaDestino: "scanner" }),
    ).toEqual({ name: ROTA_ONBOARDING });
  });
});

describe("decidirArranque — arranques seguintes", () => {
  it("deixa seguir quando há perfil default", () => {
    expect(
      decidirArranque({ temPerfilDefault: true, rotaDestino: ROTA_HOME }),
    ).toBeNull();
  });

  it("redireciona para o dashboard quem tenta abrir o onboarding", () => {
    expect(
      decidirArranque({ temPerfilDefault: true, rotaDestino: ROTA_ONBOARDING }),
    ).toEqual({ name: ROTA_HOME });
  });

  it("não interfere com outras rotas", () => {
    expect(
      decidirArranque({ temPerfilDefault: true, rotaDestino: "scanner" }),
    ).toBeNull();
  });
});

describe("decidirArranque — falha de persistência", () => {
  it("encaminha para o onboarding em vez de deixar a aplicação sem destino", () => {
    expect(
      decidirArranque({ erroPersistencia: true, rotaDestino: ROTA_HOME }),
    ).toEqual({ name: ROTA_ONBOARDING });
  });

  it("não entra em ciclo quando o destino já é o onboarding", () => {
    expect(
      decidirArranque({ erroPersistencia: true, rotaDestino: ROTA_ONBOARDING }),
    ).toBeNull();
  });

  it("o erro tem precedência sobre a existência de perfil em memória", () => {
    expect(
      decidirArranque({
        temPerfilDefault: true,
        erroPersistencia: true,
        rotaDestino: ROTA_HOME,
      }),
    ).toEqual({ name: ROTA_ONBOARDING });
  });
});

describe("decidirArranque — robustez", () => {
  it("não rebenta quando é chamada sem argumentos", () => {
    expect(decidirArranque()).toEqual({ name: ROTA_ONBOARDING });
  });
});
