import { describe, it, expect, afterEach } from "vitest";
import { mount } from "@vue/test-utils";
import { DEMO_RECIPE } from "@/services/recipeModel";
import CookingCarousel from "./CookingCarousel.vue";

let wrapper;

function montar(recipe = DEMO_RECIPE) {
  wrapper = mount(CookingCarousel, { props: { recipe } });
  return wrapper;
}

const byId = (id) => wrapper.find(`[data-testid="${id}"]`);
const ingredientes = () =>
  wrapper
    .findAll('[data-testid="cooking-step-ingredient"]')
    .map((e) => e.attributes("data-name"));

// O jsdom não tem PointerEvent: cria-se um MouseEvent com o nome do evento de ponteiro.
async function deslizar(distancia) {
  const zona = byId("cooking-step").element;
  zona.dispatchEvent(
    new MouseEvent("pointerdown", { clientX: 200, bubbles: true }),
  );
  zona.dispatchEvent(
    new MouseEvent("pointerup", { clientX: 200 + distancia, bubbles: true }),
  );
  await wrapper.vm.$nextTick();
}

afterEach(() => {
  wrapper?.unmount();
  wrapper = null;
});

describe("SCRUM-145: mostrar um passo de cada vez", () => {
  it("começa no passo 1 com o texto e os ingredientes desse passo", () => {
    montar();
    expect(byId("cooking-step-counter").text()).toBe("Passo 1 de 4");
    expect(byId("cooking-carousel").attributes("data-step")).toBe("1");
    expect(byId("cooking-carousel").attributes("data-total")).toBe("4");
    expect(byId("cooking-step-text").text()).toBe(
      "Corta o frango e a cenoura em pedaços pequenos.",
    );
    expect(ingredientes()).toEqual(["Frango cozido", "Cenoura"]);
  });

  it("mostra a quantidade de cada ingrediente do passo", () => {
    montar();
    const [frango] = wrapper.findAll('[data-testid="cooking-step-ingredient"]');
    expect(frango.text()).toContain("300 g");
    expect(frango.text()).toContain("Frango cozido");
  });

  it("mostra o temporizador só nos passos que o têm", async () => {
    montar();
    expect(byId("cooking-step-timer").exists()).toBe(false);
    await byId("cooking-next").trigger("click");
    expect(byId("cooking-step-timer").text()).toContain("5 min");
  });

  it("avisa quando um passo não usa ingredientes da lista", () => {
    montar({
      ...DEMO_RECIPE,
      steps: [{ text: "Pré-aquece o forno a 180 graus.", timerSeconds: null }],
    });
    expect(byId("cooking-step-no-ingredients").exists()).toBe(true);
    expect(ingredientes()).toEqual([]);
  });

  it("não mostra nada se a receita não tiver passos", () => {
    montar({ ...DEMO_RECIPE, steps: [] });
    expect(byId("cooking-carousel").exists()).toBe(false);
  });
});

describe("SCRUM-145: navegação Anterior / Seguinte", () => {
  it('"Anterior" está desativado no primeiro passo', () => {
    montar();
    expect(byId("cooking-previous").attributes("disabled")).toBeDefined();
  });

  it('"Seguinte" avança e "Anterior" recua', async () => {
    montar();
    await byId("cooking-next").trigger("click");
    await byId("cooking-next").trigger("click");
    expect(byId("cooking-step-counter").text()).toBe("Passo 3 de 4");
    expect(ingredientes()).toEqual(["Arroz"]);

    await byId("cooking-previous").trigger("click");
    expect(byId("cooking-step-counter").text()).toBe("Passo 2 de 4");
    expect(ingredientes()).toEqual(["Cenoura", "Azeite"]);
    expect(byId("cooking-previous").attributes("disabled")).toBeUndefined();
  });

  it('no último passo "Seguinte" dá lugar a "Concluir" (finish-recipe)', async () => {
    montar();
    for (let i = 0; i < 3; i++) await byId("cooking-next").trigger("click");

    expect(byId("cooking-step-counter").text()).toBe("Passo 4 de 4");
    expect(byId("cooking-next").exists()).toBe(false);
    expect(byId("finish-recipe").text()).toContain("Concluir");
  });

  it('"Concluir" emite finish e "Sair" emite close', async () => {
    montar();
    for (let i = 0; i < 3; i++) await byId("cooking-next").trigger("click");
    await byId("finish-recipe").trigger("click");
    await byId("cooking-close").trigger("click");

    expect(wrapper.emitted("finish")).toHaveLength(1);
    expect(wrapper.emitted("close")).toHaveLength(1);
  });
});

describe("SCRUM-145: deslizar com o dedo", () => {
  it("deslizar para a esquerda avança e para a direita recua", async () => {
    montar();
    await deslizar(-120);
    expect(byId("cooking-step-counter").text()).toBe("Passo 2 de 4");
    await deslizar(120);
    expect(byId("cooking-step-counter").text()).toBe("Passo 1 de 4");
  });

  it("um toque curto não muda de passo", async () => {
    montar();
    await deslizar(-20);
    expect(byId("cooking-step-counter").text()).toBe("Passo 1 de 4");
  });

  it("não passa do primeiro nem do último passo", async () => {
    montar();
    await deslizar(120);
    expect(byId("cooking-step-counter").text()).toBe("Passo 1 de 4");
    for (let i = 0; i < 5; i++) await deslizar(-120);
    expect(byId("cooking-step-counter").text()).toBe("Passo 4 de 4");
  });
});
