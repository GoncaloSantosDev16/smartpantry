import "fake-indexeddb/auto";
import { h } from "vue";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { flushPromises, mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { createMemoryHistory, createRouter, RouterView } from "vue-router";
import { db } from "@/db";
import { useRecipesStore } from "@/stores/recipes";
import { DEMO_RECIPE } from "@/services/recipeModel";
import RecipeDetailView from "./RecipeDetailView.vue";

const byId = (wrapper, id) => wrapper.find(`[data-testid="${id}"]`);
const allById = (wrapper, id) => wrapper.findAll(`[data-testid="${id}"]`);

async function open(path, setup) {
  const pinia = createPinia();
  setActivePinia(pinia);
  const store = useRecipesStore();
  await setup?.(store);

  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      {
        path: "/",
        name: "home",
        component: { render: () => h("div", { "data-testid": "home" }) },
      },
      {
        path: "/receitas/preview",
        name: "recipe-preview",
        component: RecipeDetailView,
      },
      {
        path: "/receitas/:id(\\d+)",
        name: "recipe-detail",
        component: RecipeDetailView,
      },
      // SCRUM-145: destino do "Concluir" (resumo da US-21)
      {
        path: "/receitas/preview/resumo",
        name: "meal-summary-preview",
        component: {
          render: () => h("div", { "data-testid": "meal-summary" }),
        },
      },
      {
        path: "/receitas/:id(\\d+)/resumo",
        name: "meal-summary",
        component: {
          render: () => h("div", { "data-testid": "meal-summary" }),
        },
      },
    ],
  });
  router.push(path);
  await router.isReady();

  const wrapper = mount(
    { render: () => h(RouterView) },
    { global: { plugins: [pinia, router] } },
  );
  await flushPromises();
  return { wrapper, router, store };
}

beforeEach(async () => {
  await Promise.all(db.tables.map((t) => t.clear()));
  vi.restoreAllMocks();
});

describe("RecipeDetailView: pré-visualização", () => {
  const withDemo = (store) => store.openPreview(DEMO_RECIPE);

  it("mostra título, descrição, tempos e doses", async () => {
    const { wrapper } = await open("/receitas/preview", withDemo);
    expect(byId(wrapper, "recipe-title").text()).toBe(
      "Arroz de frango com legumes",
    );
    expect(byId(wrapper, "recipe-description").text()).toContain("sobras");
    const meta = byId(wrapper, "recipe-meta").text();
    expect(meta).toContain("Preparação: 10 min");
    expect(meta).toContain("Cozedura: 25 min");
    expect(meta).toContain("Total: 35 min");
    expect(meta).toContain("2 doses");
  });

  it("lista os ingredientes com quantidade e os passos com temporizador", async () => {
    const { wrapper } = await open("/receitas/preview", withDemo);
    const ingredientes = allById(wrapper, "recipe-ingredient");
    expect(ingredientes).toHaveLength(4);
    expect(ingredientes[0].text()).toContain("200 g");
    expect(ingredientes[0].text()).toContain("Arroz");

    expect(allById(wrapper, "recipe-step")).toHaveLength(4);
    const temporizadores = allById(wrapper, "recipe-step-timer").map((t) =>
      t.text(),
    );
    expect(temporizadores).toEqual(["⏱ 5 min", "⏱ 15 min"]);
  });

  it('oferece "Guardar receita" e ainda não está guardada', async () => {
    const { wrapper } = await open("/receitas/preview", withDemo);
    expect(byId(wrapper, "save-recipe").exists()).toBe(true);
    expect(byId(wrapper, "saved-badge").exists()).toBe(false);
  });

  it('guardar persiste no IndexedDB e passa a mostrar "Receita guardada"', async () => {
    const { wrapper, router, store } = await open(
      "/receitas/preview",
      withDemo,
    );
    await byId(wrapper, "save-recipe").trigger("click");
    await flushPromises();

    expect(await db.recipes.count()).toBe(1);
    const [guardada] = await db.recipes.toArray();
    expect(guardada.title).toBe(DEMO_RECIPE.title);

    expect(byId(wrapper, "saved-badge").text()).toContain("Receita guardada");
    expect(byId(wrapper, "save-recipe").exists()).toBe(false);
    expect(router.currentRoute.value.fullPath).toBe(`/receitas/${guardada.id}`);
    expect(store.preview).toBeNull();
  });

  it("um duplo clique em Guardar só grava uma vez", async () => {
    const { wrapper } = await open("/receitas/preview", withDemo);
    const botao = byId(wrapper, "save-recipe");
    botao.trigger("click");
    botao.trigger("click");
    await flushPromises();
    expect(await db.recipes.count()).toBe(1);
  });

  it("mostra um erro e mantém o botão se a gravação falhar", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(db.recipes, "add").mockRejectedValue(new Error("quota"));
    const { wrapper } = await open("/receitas/preview", withDemo);

    await byId(wrapper, "save-recipe").trigger("click");
    await flushPromises();

    expect(byId(wrapper, "save-error").text()).toContain(
      "Não foi possível guardar",
    );
    expect(byId(wrapper, "save-recipe").exists()).toBe(true);
    expect(byId(wrapper, "saved-badge").exists()).toBe(false);
  });

  it("sem receita para mostrar, volta ao início", async () => {
    const { wrapper, router } = await open("/receitas/preview");
    expect(router.currentRoute.value.path).toBe("/");
    expect(byId(wrapper, "home").exists()).toBe(true);
  });

  it("aceita receitas sem passos nem descrição", async () => {
    const { wrapper } = await open("/receitas/preview", (store) =>
      store.openPreview({
        title: "Salada",
        ingredients: [{ name: "Alface", quantity: 1, unit: "un" }],
      }),
    );
    expect(byId(wrapper, "recipe-no-steps").exists()).toBe(true);
    expect(byId(wrapper, "recipe-description").exists()).toBe(false);
  });
});

describe("RecipeDetailView: receita guardada", () => {
  it("lê a receita do IndexedDB e mostra que já está guardada", async () => {
    const id = await db.recipes.add({
      ...DEMO_RECIPE,
      savedAt: "2026-11-09T10:00:00.000Z",
      timesCooked: 0,
    });
    const { wrapper } = await open(`/receitas/${id}`);

    expect(byId(wrapper, "recipe-title").text()).toBe(DEMO_RECIPE.title);
    expect(allById(wrapper, "recipe-ingredient")).toHaveLength(4);
    expect(byId(wrapper, "saved-badge").exists()).toBe(true);
    expect(byId(wrapper, "save-recipe").exists()).toBe(false);
  });

  it('id que não existe mostra "Receita não encontrada"', async () => {
    const { wrapper } = await open("/receitas/9999");
    expect(byId(wrapper, "recipe-not-found").text()).toContain(
      "não encontrada",
    );
  });
});

describe("SCRUM-145: carrossel passo a passo (Cook Mode)", () => {
  async function abrirGuardada() {
    const id = await db.recipes.add({
      ...DEMO_RECIPE,
      savedAt: "2026-11-25T10:00:00.000Z",
      timesCooked: 0,
    });
    return { id, ...(await open(`/receitas/${id}`)) };
  }

  it('mostra "Começar a cozinhar" quando a receita tem passos', async () => {
    const { wrapper } = await abrirGuardada();
    expect(byId(wrapper, "start-cooking").text()).toContain(
      "Começar a cozinhar",
    );
    expect(byId(wrapper, "cooking-carousel").exists()).toBe(false);
  });

  it("não mostra o botão numa receita sem passos", async () => {
    const { wrapper } = await open("/receitas/preview", (store) =>
      store.openPreview({
        title: "Salada",
        ingredients: [{ name: "Alface", quantity: 1, unit: "un" }],
      }),
    );
    expect(byId(wrapper, "start-cooking").exists()).toBe(false);
  });

  it("abre o carrossel no passo 1 no lugar do detalhe", async () => {
    const { wrapper } = await abrirGuardada();
    await byId(wrapper, "start-cooking").trigger("click");

    expect(byId(wrapper, "cooking-step-counter").text()).toBe("Passo 1 de 4");
    expect(allById(wrapper, "recipe-ingredient")).toHaveLength(0);
    // Só existe um finish-recipe de cada vez (o do detalhe fica escondido)
    expect(allById(wrapper, "finish-recipe")).toHaveLength(0);
  });

  it('"Sair" fecha o carrossel e volta ao detalhe', async () => {
    const { wrapper } = await abrirGuardada();
    await byId(wrapper, "start-cooking").trigger("click");
    await byId(wrapper, "cooking-close").trigger("click");

    expect(byId(wrapper, "cooking-carousel").exists()).toBe(false);
    expect(allById(wrapper, "recipe-ingredient")).toHaveLength(4);
    expect(allById(wrapper, "finish-recipe")).toHaveLength(1);
  });

  it('"Concluir" no último passo abre o resumo da US-21 (mealSummaryRoute)', async () => {
    const { wrapper, router, id } = await abrirGuardada();
    await byId(wrapper, "start-cooking").trigger("click");
    for (let i = 0; i < 3; i++)
      await byId(wrapper, "cooking-next").trigger("click");

    expect(allById(wrapper, "finish-recipe")).toHaveLength(1);
    await byId(wrapper, "finish-recipe").trigger("click");
    await flushPromises();

    expect(router.currentRoute.value.name).toBe("meal-summary");
    expect(router.currentRoute.value.params.id).toBe(String(id));
  });

  it('numa receita ainda não guardada, "Concluir" abre o resumo da pré-visualização', async () => {
    const { wrapper, router } = await open("/receitas/preview", (store) =>
      store.openPreview(DEMO_RECIPE),
    );
    await byId(wrapper, "start-cooking").trigger("click");
    for (let i = 0; i < 3; i++)
      await byId(wrapper, "cooking-next").trigger("click");
    await byId(wrapper, "finish-recipe").trigger("click");
    await flushPromises();

    expect(router.currentRoute.value.name).toBe("meal-summary-preview");
  });

  it('o botão "Concluir receita" do detalhe continua a funcionar (US-21)', async () => {
    const { wrapper, router } = await abrirGuardada();
    await byId(wrapper, "finish-recipe").trigger("click");
    await flushPromises();
    expect(router.currentRoute.value.name).toBe("meal-summary");
  });
});
