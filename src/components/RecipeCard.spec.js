import { describe, it, expect, afterEach } from "vitest";
import { mount } from "@vue/test-utils";
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

function montar(card = CARD) {
  wrapper = mount(RecipeCard, { props: { card } });
  return wrapper;
}

const botao = () => wrapper.find('[data-testid="recipe-add-missing"]');

describe('SCRUM-125: botão "Adicionar à lista de compras" no cartão', () => {
  afterEach(() => {
    wrapper?.unmount();
    wrapper = null;
  });

  it("mostra quantos ingredientes faltam", () => {
    montar();
    expect(botao().exists()).toBe(true);
    expect(botao().text()).toContain("Adicionar 2 à lista de compras");
    expect(botao().attributes("data-count")).toBe("2");
    expect(botao().attributes("title")).toBe("Cebola, Alho");
  });

  it("não aparece quando já tens todos os ingredientes", () => {
    montar({
      ...CARD,
      matched: 1,
      missing: 0,
      ingredients: [{ name: "rice", amount: "200 g", inPantry: true }],
    });
    expect(botao().exists()).toBe(false);
  });

  it("ao carregar envia a lista dos ingredientes em falta", async () => {
    montar();
    await botao().trigger("click");
    expect(wrapper.emitted("add-missing")).toEqual([
      [
        [
          { name: "Cebola", original: "onion" },
          { name: "Alho", original: "garlic" },
        ],
      ],
    ]);
  });
});
