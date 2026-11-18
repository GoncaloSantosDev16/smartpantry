import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import PersonalFiltersToggle from "./PersonalFiltersToggle.vue";
import { useProfilesStore } from "@/stores/profiles";
import { CHAVE_FILTROS_PESSOAIS } from "@/services/personalFilters";

const CASA = {
  id: 1,
  name: "Casa",
  isDefault: true,
  diets: ["vegetarian"],
  allergies: ["peanut"],
  excludedIngredients: [],
};
const GINASIO = {
  id: 2,
  name: "Ginásio",
  isDefault: false,
  diets: [],
  allergies: ["lactose"],
  excludedIngredients: [],
};
const SEM_NADA = { id: 3, name: "Livre", isDefault: false };

let wrapper;

function montar(perfis = [CASA, GINASIO]) {
  const pinia = createPinia();
  setActivePinia(pinia);
  const store = useProfilesStore();
  store.profiles = perfis;
  store.loaded = true;
  wrapper = mount(PersonalFiltersToggle, { global: { plugins: [pinia] } });
  return store;
}

const toggle = () => wrapper.find('[data-testid="personal-filters-toggle"]');
const restricoes = () =>
  wrapper
    .findAll('[data-testid="personal-restriction"]')
    .map((e) => e.attributes("data-restriction"));

describe("SCRUM-122: PersonalFiltersToggle", () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => {
    wrapper?.unmount();
    wrapper = null;
  });

  it("começa ligado", () => {
    montar();
    expect(toggle().attributes("role")).toBe("switch");
    expect(toggle().attributes("aria-checked")).toBe("true");
  });

  it("mostra as restrições do perfil ativo", () => {
    montar();
    expect(restricoes()).toEqual(["vegetarian", "peanut"]);
    expect(wrapper.text()).toContain("Vegetariano");
    expect(wrapper.text()).toContain("Sem peanut");
  });

  it("clicar desliga os filtros e esconde as restrições", async () => {
    const store = montar();
    await toggle().trigger("click");

    expect(toggle().attributes("aria-checked")).toBe("false");
    expect(store.personalFiltersEnabled).toBe(false);
    expect(restricoes()).toEqual([]);
    expect(wrapper.find('[data-testid="personal-filters-off"]').exists()).toBe(
      true,
    );
  });

  it("clicar outra vez volta a ligar", async () => {
    montar();
    await toggle().trigger("click");
    await toggle().trigger("click");
    expect(toggle().attributes("aria-checked")).toBe("true");
    expect(restricoes()).toEqual(["vegetarian", "peanut"]);
  });

  it("a escolha fica guardada", async () => {
    montar();
    await toggle().trigger("click");
    expect(localStorage.getItem(CHAVE_FILTROS_PESSOAIS)).toBe("off");
  });

  it("começa desligado se essa foi a última escolha", () => {
    localStorage.setItem(CHAVE_FILTROS_PESSOAIS, "off");
    montar();
    expect(toggle().attributes("aria-checked")).toBe("false");
  });

  it("trocar de perfil atualiza as restrições mostradas", async () => {
    const store = montar();
    store.setActiveProfile(GINASIO.id);
    await wrapper.vm.$nextTick();
    expect(restricoes()).toEqual(["lactose"]);
  });

  it("avisa quando o perfil não tem restrições", () => {
    montar([{ ...SEM_NADA, isDefault: true }]);
    expect(
      wrapper.find('[data-testid="personal-restrictions-none"]').exists(),
    ).toBe(true);
  });
});
