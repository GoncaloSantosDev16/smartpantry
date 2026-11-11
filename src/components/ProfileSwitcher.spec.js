import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mount } from "@vue/test-utils";
import { nextTick } from "vue";
import { createPinia, setActivePinia } from "pinia";
import ProfileSwitcher from "./ProfileSwitcher.vue";
import { useProfilesStore } from "@/stores/profiles";

const CASA = { id: 1, name: "Casa", isDefault: true, allergies: ["peanut"] };
const GINASIO = {
  id: 2,
  name: "Ginásio",
  isDefault: false,
  allergies: ["lactose"],
};

let wrapper;

function montar(perfis) {
  const pinia = createPinia();
  setActivePinia(pinia);
  const store = useProfilesStore();
  store.profiles = perfis;
  store.loaded = true;
  // attachTo é preciso para os cliques fora do menu chegarem ao document
  wrapper = mount(ProfileSwitcher, {
    global: { plugins: [pinia] },
    attachTo: document.body,
  });
  return store;
}

const porId = (id) => wrapper.find(`[data-testid="${id}"]`);
const opcoes = () => wrapper.findAll('[data-testid="profile-option"]');
const opcao = (nome) =>
  wrapper.find(`[data-testid="profile-option"][data-profile-name="${nome}"]`);

describe("ProfileSwitcher", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    wrapper?.unmount();
    wrapper = null;
  });

  it("mostra no cabeçalho o nome do perfil ativo", () => {
    montar([CASA, GINASIO]);
    expect(porId("active-profile-name").text()).toBe("Casa");
  });

  it("não mostra nada quando não há perfis", () => {
    montar([]);
    expect(porId("profile-switcher").exists()).toBe(false);
  });

  it("o menu começa fechado", () => {
    montar([CASA, GINASIO]);
    expect(porId("profile-menu").exists()).toBe(false);
    expect(porId("profile-switcher-toggle").attributes("aria-expanded")).toBe(
      "false",
    );
  });

  it("abrir o menu lista todos os perfis", async () => {
    montar([CASA, GINASIO]);
    await porId("profile-switcher-toggle").trigger("click");

    expect(porId("profile-switcher-toggle").attributes("aria-expanded")).toBe(
      "true",
    );
    expect(opcoes().map((o) => o.attributes("data-profile-name"))).toEqual([
      "Casa",
      "Ginásio",
    ]);
  });

  it("marca o perfil ativo na lista", async () => {
    montar([CASA, GINASIO]);
    await porId("profile-switcher-toggle").trigger("click");

    expect(opcao("Casa").attributes("aria-selected")).toBe("true");
    expect(opcao("Ginásio").attributes("aria-selected")).toBe("false");
  });

  it("escolher um perfil torna-o ativo e fecha o menu", async () => {
    const store = montar([CASA, GINASIO]);
    await porId("profile-switcher-toggle").trigger("click");
    await opcao("Ginásio").trigger("click");

    expect(store.activeProfile.name).toBe("Ginásio");
    expect(store.activeProfile.allergies).toEqual(["lactose"]);
    expect(porId("active-profile-name").text()).toBe("Ginásio");
    expect(porId("profile-menu").exists()).toBe(false);
  });

  it("Escape fecha o menu sem trocar de perfil", async () => {
    const store = montar([CASA, GINASIO]);
    await porId("profile-switcher-toggle").trigger("click");

    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    await nextTick();

    expect(porId("profile-menu").exists()).toBe(false);
    expect(store.activeProfile.name).toBe("Casa");
  });

  it("clicar fora do menu fecha-o", async () => {
    montar([CASA, GINASIO]);
    await porId("profile-switcher-toggle").trigger("click");

    document.body.click();
    await nextTick();

    expect(porId("profile-menu").exists()).toBe(false);
  });

  it("clicar outra vez no botão fecha o menu", async () => {
    montar([CASA, GINASIO]);
    await porId("profile-switcher-toggle").trigger("click");
    await porId("profile-switcher-toggle").trigger("click");

    expect(porId("profile-menu").exists()).toBe(false);
  });
});
