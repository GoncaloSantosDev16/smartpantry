import "fake-indexeddb/auto";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { db } from "@/db";
import { usePantryStore } from "@/stores/pantry";
import RecipeSuggestionsView from "./RecipeSuggestionsView.vue";

// A pesquisa no Spoonacular é simulada: devolve sempre a mesma receita.
vi.mock("@/services/recipeDiscovery", () => ({
  discoverRecipes: vi.fn(async ({ ingredients }) => ({
    status: "ok",
    pantryNames: ingredients.map((i) =>
      i.name === "Arroz" ? "rice" : i.name.toLowerCase(),
    ),
    recipes: [
      {
        id: 1,
        title: "Garlic Onion Rice",
        readyInMinutes: 20,
        servings: 2,
        ingredients: [
          { name: "rice", amount: 200, unit: "g" },
          { name: "onion", amount: 1, unit: "" },
          { name: "garlic", amount: 2, unit: "cloves" },
        ],
        steps: [],
      },
    ],
  })),
}));

let wrapper;

const ingrediente = (nome) =>
  wrapper.find(`[data-testid="recipe-ingredient"][data-name="${nome}"]`);
const cartao = () => wrapper.find('[data-testid="recipe-card"]');

async function abrirEPesquisar() {
  const pinia = createPinia();
  setActivePinia(pinia);
  wrapper = mount(RecipeSuggestionsView, {
    global: { plugins: [pinia], stubs: { RouterLink: true } },
  });
  await vi.waitFor(() =>
    expect(wrapper.findAll('[data-testid="pantry-ingredient"]')).toHaveLength(
      1,
    ),
  );
  await wrapper.find('[data-testid="recipes-search"]').trigger("click");
  await vi.waitFor(() => expect(cartao().exists()).toBe(true));
}

describe('SCRUM-128: o "+" põe o ingrediente na despensa', () => {
  beforeEach(async () => {
    await db.pantryItems.clear();
    await db.shoppingItems.clear();
    await db.pantryItems.add({
      name: "Arroz",
      quantity: 1,
      unit: "kg",
      category: "Outro",
      expirationDate: null,
    });
  });
  afterEach(() => {
    wrapper?.unmount();
    wrapper = null;
  });

  it("guarda o ingrediente na despensa, em português e com 1 unidade", async () => {
    await abrirEPesquisar();
    await ingrediente("onion")
      .find('[data-testid="recipe-ingredient-to-pantry"]')
      .trigger("click");

    await vi.waitFor(async () => expect(await db.pantryItems.count()).toBe(2));
    const cebola = (await db.pantryItems.toArray()).find(
      (i) => i.name === "Cebola",
    );
    expect(cebola).toMatchObject({
      quantity: 1,
      unit: "un",
      category: "Outro",
      expirationDate: null,
    });
    expect(usePantryStore().items.map((i) => i.name)).toContain("Cebola");
  });

  it('o cartão passa a mostrar o ingrediente como "tens" sem nova pesquisa', async () => {
    await abrirEPesquisar();
    expect(cartao().attributes("data-matched")).toBe("1");

    await ingrediente("onion")
      .find('[data-testid="recipe-ingredient-to-pantry"]')
      .trigger("click");

    await vi.waitFor(() =>
      expect(ingrediente("onion").attributes("data-in-pantry")).toBe("true"),
    );
    expect(cartao().attributes("data-matched")).toBe("2");
    expect(ingrediente("garlic").attributes("data-in-pantry")).toBe("false");
    await vi.waitFor(() =>
      expect(
        wrapper
          .findAll('[data-testid="pantry-ingredient"]')
          .map((e) => e.text()),
      ).toEqual(expect.arrayContaining([expect.stringContaining("Cebola")])),
    );
  });

  it("o botão da lista de compras deixa de contar o ingrediente que já tens", async () => {
    await abrirEPesquisar();
    expect(
      wrapper
        .find('[data-testid="recipe-add-missing"]')
        .attributes("data-count"),
    ).toBe("2");

    await ingrediente("onion")
      .find('[data-testid="recipe-ingredient-to-pantry"]')
      .trigger("click");

    await vi.waitFor(() =>
      expect(
        wrapper
          .find('[data-testid="recipe-add-missing"]')
          .attributes("data-count"),
      ).toBe("1"),
    );
    expect(await db.shoppingItems.count()).toBe(0);
  });

  it("dois cliques seguidos só guardam o ingrediente uma vez", async () => {
    await abrirEPesquisar();
    const mais = ingrediente("onion").find(
      '[data-testid="recipe-ingredient-to-pantry"]',
    );
    await mais.trigger("click");
    await mais.trigger("click");

    await vi.waitFor(() =>
      expect(ingrediente("onion").attributes("data-in-pantry")).toBe("true"),
    );
    await flushPromises();
    expect(await db.pantryItems.count()).toBe(2);
  });
});

describe("SCRUM-127: contador da lista de compras no cabeçalho das receitas", () => {
  beforeEach(async () => {
    await db.pantryItems.clear();
    await db.shoppingItems.clear();
    await db.pantryItems.add({
      name: "Arroz",
      quantity: 1,
      unit: "kg",
      category: "Outro",
      expirationDate: null,
    });
  });
  afterEach(() => {
    wrapper?.unmount();
    wrapper = null;
  });

  const badge = () => wrapper.find('[data-testid="shopping-list-badge"]');

  it("o contador sobe quando se enviam os ingredientes em falta", async () => {
    await abrirEPesquisar();
    expect(wrapper.find('[data-testid="shopping-list-button"]').exists()).toBe(
      true,
    );
    expect(badge().exists()).toBe(false);

    await wrapper.find('[data-testid="recipe-add-missing"]').trigger("click");

    await vi.waitFor(() => expect(badge().exists()).toBe(true));
    expect(badge().text()).toBe("2");
    expect(
      wrapper.find('[data-testid="recipe-missing-on-list"]').exists(),
    ).toBe(true);
  });
});
