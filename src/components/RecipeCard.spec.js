import "fake-indexeddb/auto";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { db } from "@/db";
import { useShoppingListStore } from "@/stores/shoppingList";
import RecipeCard from "./RecipeCard.vue";

const CARD = {
  id: 1,
  title: "Garlic Onion Rice",
  image: null,
  totalMinutes: 20,
  servings: 2,
  percent: 33,
  matched: 1,
  missing: 2,
  ingredients: [
    { name: "rice", amount: "200 g", inPantry: true },
    { name: "onion", amount: "1", inPantry: false },
    { name: "garlic", amount: "2 cloves", inPantry: false },
  ],
  steps: [],
};

let wrapper;
let store;

async function montar(card = CARD) {
  const pinia = createPinia();
  setActivePinia(pinia);
  store = useShoppingListStore();
  wrapper = mount(RecipeCard, {
    props: { card },
    global: { plugins: [pinia] },
  });
  await vi.waitFor(() => expect(store.loaded).toBe(true));
  return wrapper;
}

const botao = () => wrapper.find('[data-testid="recipe-add-missing"]');
const naLista = () => wrapper.find('[data-testid="recipe-missing-on-list"]');

describe('SCRUM-125: botão "Adicionar à lista de compras" no cartão', () => {
  beforeEach(async () => {
    await db.shoppingItems.clear();
  });
  afterEach(() => {
    wrapper?.unmount();
    wrapper = null;
  });

  it("mostra quantos ingredientes faltam", async () => {
    await montar();
    expect(botao().exists()).toBe(true);
    expect(botao().text()).toContain("Adicionar 2 à lista de compras");
    expect(botao().attributes("data-count")).toBe("2");
    expect(botao().attributes("title")).toBe("Cebola, Alho");
  });

  it("não aparece quando já tens todos os ingredientes", async () => {
    await montar({
      ...CARD,
      matched: 1,
      missing: 0,
      ingredients: [{ name: "rice", amount: "200 g", inPantry: true }],
    });
    expect(botao().exists()).toBe(false);
    expect(naLista().exists()).toBe(false);
  });
});

describe("SCRUM-126: o botão envia os ingredientes para a Store da Lista de Compras", () => {
  beforeEach(async () => {
    await db.shoppingItems.clear();
  });
  afterEach(() => {
    wrapper?.unmount();
    wrapper = null;
  });

  it("ao carregar adiciona os ingredientes em falta e o contador sobe", async () => {
    await montar();
    await botao().trigger("click");
    await vi.waitFor(() => expect(store.pendingCount).toBe(2));
    await flushPromises();

    expect(store.pendingItems.map((i) => i.name)).toEqual(["Cebola", "Alho"]);
    expect(wrapper.emitted("added-to-shopping-list")[0][0]).toHaveLength(2);
    expect(botao().exists()).toBe(false);
    expect(naLista().text()).toContain("Na lista de compras");
  });

  it("só conta os que ainda não estão na lista", async () => {
    await montar();
    await store.addItem({ name: "Cebola" });
    await flushPromises();

    expect(botao().text()).toContain("Adicionar 1 à lista de compras");
    expect(botao().attributes("title")).toBe("Alho");

    await botao().trigger("click");
    await vi.waitFor(() => expect(store.pendingCount).toBe(2));

    expect(store.items.find((i) => i.name === "Cebola").quantity).toBe(1);
  });

  it("já sabe o que está na lista guardada ao abrir a página", async () => {
    await db.shoppingItems.add({
      name: "Alho",
      quantity: 1,
      unit: "un",
      checked: false,
    });
    await montar();
    await flushPromises();

    expect(botao().text()).toContain("Adicionar 1 à lista de compras");
    expect(botao().attributes("title")).toBe("Cebola");
  });

  it("volta a mostrar o botão se um ingrediente sair da lista", async () => {
    await montar();
    await botao().trigger("click");
    await vi.waitFor(() => expect(store.pendingCount).toBe(2));
    await flushPromises();
    expect(naLista().exists()).toBe(true);

    await store.removeItem(store.items.find((i) => i.name === "Alho").id);
    await flushPromises();

    expect(botao().text()).toContain("Adicionar 1 à lista de compras");
  });
});

describe('SCRUM-128: o "+" de um ingrediente em falta', () => {
  beforeEach(async () => {
    await db.shoppingItems.clear();
  });
  afterEach(() => {
    wrapper?.unmount();
    wrapper = null;
  });

  it("só aparece nos ingredientes em falta", async () => {
    await montar();
    const mais = wrapper.findAll('[data-testid="recipe-ingredient-to-pantry"]');
    expect(mais).toHaveLength(2);
    expect(mais[0].attributes("aria-label")).toBe("Adicionar onion à despensa");
  });

  it("ao carregar pede para pôr esse ingrediente na despensa", async () => {
    await montar();
    await wrapper
      .find('[data-name="garlic"] [data-testid="recipe-ingredient-to-pantry"]')
      .trigger("click");
    expect(wrapper.emitted("add-to-pantry")).toEqual([
      [{ name: "garlic", amount: "2 cloves", inPantry: false }],
    ]);
  });
});
