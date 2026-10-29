import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import BarcodeScanner from "./BarcodeScanner.vue";
import { CODIGOS, descrever } from "@/services/cameraErrors";

// O leitor real carrega WebAssembly; aqui só interessa o caminho dos erros.
vi.mock("barcode-detector", () => ({
  BarcodeDetector: class {
    async detect() {
      return [];
    }
  },
}));

function erroDom(name) {
  const erro = new Error(name);
  erro.name = name;
  return erro;
}

function simularCamara(getUserMedia) {
  Object.defineProperty(navigator, "mediaDevices", {
    configurable: true,
    writable: true,
    value: { getUserMedia },
  });
}

function simularContextoSeguro(valor) {
  Object.defineProperty(window, "isSecureContext", {
    configurable: true,
    writable: true,
    value: valor,
  });
}

/** Stream falso que regista se as tracks foram paradas. */
function streamFalso() {
  const track = { stop: vi.fn() };
  return { getTracks: () => [track], _track: track };
}

async function iniciar(wrapper) {
  await wrapper.find("button").trigger("click");
  await flushPromises();
}

describe("BarcodeScanner — falhas de acesso à câmara", () => {
  beforeEach(() => {
    simularContextoSeguro(true);
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("mostra mensagem de permissão recusada quando o utilizador nega", async () => {
    simularCamara(vi.fn().mockRejectedValue(erroDom("NotAllowedError")));
    const wrapper = mount(BarcodeScanner);

    await iniciar(wrapper);

    const caixa = wrapper.find('[data-testid="erro-camara"]');
    expect(caixa.exists()).toBe(true);
    expect(caixa.text()).toContain(descrever(CODIGOS.PERMISSAO_NEGADA).titulo);
  });

  it("distingue ausência de câmara de falta de permissão", async () => {
    simularCamara(vi.fn().mockRejectedValue(erroDom("NotFoundError")));
    const wrapper = mount(BarcodeScanner);

    await iniciar(wrapper);

    const texto = wrapper.find('[data-testid="erro-camara"]').text();
    expect(texto).toContain(descrever(CODIGOS.SEM_CAMARA).titulo);
    expect(texto).not.toContain(descrever(CODIGOS.PERMISSAO_NEGADA).titulo);
  });

  it("indica que a câmara está ocupada por outra aplicação", async () => {
    simularCamara(vi.fn().mockRejectedValue(erroDom("NotReadableError")));
    const wrapper = mount(BarcodeScanner);

    await iniciar(wrapper);

    expect(wrapper.find('[data-testid="erro-camara"]').text()).toContain(
      descrever(CODIGOS.CAMARA_OCUPADA).titulo,
    );
  });

  it("não chega a pedir a câmara quando a ligação não é segura", async () => {
    simularContextoSeguro(false);
    const getUserMedia = vi.fn();
    simularCamara(getUserMedia);
    const wrapper = mount(BarcodeScanner);

    await iniciar(wrapper);

    expect(getUserMedia).not.toHaveBeenCalled();
    expect(wrapper.find('[data-testid="erro-camara"]').text()).toContain(
      descrever(CODIGOS.CONTEXTO_INSEGURO).titulo,
    );
  });

  it("oferece nova tentativa nas falhas recuperáveis", async () => {
    simularCamara(vi.fn().mockRejectedValue(erroDom("NotReadableError")));
    const wrapper = mount(BarcodeScanner);

    await iniciar(wrapper);

    expect(wrapper.find('[data-testid="tentar-de-novo"]').exists()).toBe(true);
  });

  it("não oferece nova tentativa quando não há câmara no dispositivo", async () => {
    simularCamara(vi.fn().mockRejectedValue(erroDom("NotFoundError")));
    const wrapper = mount(BarcodeScanner);

    await iniciar(wrapper);

    expect(wrapper.find('[data-testid="tentar-de-novo"]').exists()).toBe(false);
  });

  it("limpa o erro quando a tentativa seguinte tem sucesso", async () => {
    const getUserMedia = vi
      .fn()
      .mockRejectedValueOnce(erroDom("NotReadableError"))
      .mockResolvedValueOnce(streamFalso());
    simularCamara(getUserMedia);
    const wrapper = mount(BarcodeScanner);

    await iniciar(wrapper);
    expect(wrapper.find('[data-testid="erro-camara"]').exists()).toBe(true);

    await wrapper.find('[data-testid="tentar-de-novo"]').trigger("click");
    await flushPromises();

    expect(wrapper.find('[data-testid="erro-camara"]').exists()).toBe(false);
  });

  it("liberta a câmara quando o componente é destruído", async () => {
    const stream = streamFalso();
    simularCamara(vi.fn().mockResolvedValue(stream));
    const wrapper = mount(BarcodeScanner);

    await iniciar(wrapper);
    wrapper.unmount();

    expect(stream._track.stop).toHaveBeenCalled();
  });
});
