import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  CHAVE_FILTROS_PESSOAIS,
  guardarFiltrosPessoais,
  lerFiltrosPessoais,
  perfilParaPedido,
  restricoesDoPerfil,
  temRestricoes,
} from "./personalFilters";
import { buildRecipePrompt } from "./genaiPrompts";
import { generateRecipe } from "./genai";
import { toSpoonacularProfile } from "./ingredientTranslation";

const CASA = {
  id: 1,
  name: "Casa",
  servings: 4,
  diets: ["vegetarian"],
  allergies: ["amendoim"],
  excludedIngredients: ["cogumelos"],
};

const GINASIO = {
  id: 2,
  name: "Ginásio",
  servings: 1,
  diets: [],
  allergies: ["lactose"],
  excludedIngredients: [],
};

// ----------------------------------------------------------------------
// SCRUM-120 — ler as restrições do perfil ativo
// ----------------------------------------------------------------------

describe("SCRUM-120: restricoesDoPerfil", () => {
  it("devolve as dietas, alergias e exclusões do perfil", () => {
    expect(restricoesDoPerfil(CASA)).toEqual({
      diets: ["vegetarian"],
      allergies: ["amendoim"],
      excludedIngredients: ["cogumelos"],
    });
  });

  it("perfis diferentes devolvem restrições diferentes", () => {
    expect(restricoesDoPerfil(GINASIO).allergies).toEqual(["lactose"]);
    expect(restricoesDoPerfil(GINASIO).allergies).not.toContain("amendoim");
  });

  it("sem perfil, devolve listas vazias", () => {
    expect(restricoesDoPerfil(null)).toEqual({
      diets: [],
      allergies: [],
      excludedIngredients: [],
    });
  });

  it("com os filtros desligados, devolve listas vazias", () => {
    expect(temRestricoes(restricoesDoPerfil(CASA, false))).toBe(false);
  });

  it("não rebenta com um perfil sem os campos de restrições", () => {
    expect(restricoesDoPerfil({ id: 3, name: "Antigo" })).toEqual({
      diets: [],
      allergies: [],
      excludedIngredients: [],
    });
  });

  it("limpa espaços, valores vazios e repetidos", () => {
    const sujo = { allergies: [" amendoim ", "", null, "amendoim", "soja"] };
    expect(restricoesDoPerfil(sujo).allergies).toEqual(["amendoim", "soja"]);
  });

  it("não altera o perfil original", () => {
    const perfil = { allergies: ["amendoim"] };
    restricoesDoPerfil(perfil).allergies.push("soja");
    expect(perfil.allergies).toEqual(["amendoim"]);
  });
});

describe("SCRUM-120: temRestricoes", () => {
  it("é verdadeiro com pelo menos uma restrição", () => {
    expect(
      temRestricoes({
        diets: [],
        allergies: ["soja"],
        excludedIngredients: [],
      }),
    ).toBe(true);
  });

  it("é falso sem restrições ou sem argumento", () => {
    expect(
      temRestricoes({ diets: [], allergies: [], excludedIngredients: [] }),
    ).toBe(false);
    expect(temRestricoes(undefined)).toBe(false);
  });
});

// ----------------------------------------------------------------------
// SCRUM-121 — restrições no pedido à GenAI e à API de receitas
// ----------------------------------------------------------------------

describe("SCRUM-121: perfilParaPedido", () => {
  it("com os filtros ligados, leva as doses e as restrições", () => {
    expect(perfilParaPedido(CASA, true)).toEqual({
      servings: 4,
      diets: ["vegetarian"],
      allergies: ["amendoim"],
      excludedIngredients: ["cogumelos"],
    });
  });

  it("com os filtros desligados, leva as doses mas nenhuma restrição", () => {
    expect(perfilParaPedido(CASA, false)).toEqual({
      servings: 4,
      diets: [],
      allergies: [],
      excludedIngredients: [],
    });
  });
});

describe("SCRUM-121: prompt da GenAI", () => {
  const ingredients = [{ name: "Arroz", quantity: 200, unit: "g" }];

  it("com os filtros ligados, o prompt inclui as alergias e as exclusões", () => {
    const prompt = buildRecipePrompt({
      ingredients,
      profile: perfilParaPedido(CASA, true),
    });
    expect(prompt).toContain("Alergias (NUNCA usar): amendoim");
    expect(prompt).toContain("Ingredientes excluídos (NUNCA usar): cogumelos");
    expect(prompt).toContain("Estilos alimentares: vegetarian");
  });

  it("com os filtros desligados, o prompt não leva restrições pessoais", () => {
    const prompt = buildRecipePrompt({
      ingredients,
      profile: perfilParaPedido(CASA, false),
    });
    expect(prompt).toContain("Alergias (NUNCA usar): nenhum");
    expect(prompt).not.toContain("amendoim");
    expect(prompt).not.toContain("cogumelos");
  });

  it("as doses do perfil vão no prompt mesmo com os filtros desligados", () => {
    const prompt = buildRecipePrompt({
      ingredients,
      profile: perfilParaPedido(CASA, false),
    });
    expect(prompt).toContain("Número de doses: 4");
  });

  it("trocar de perfil troca as alergias enviadas", () => {
    const prompt = buildRecipePrompt({
      ingredients,
      profile: perfilParaPedido(GINASIO, true),
    });
    expect(prompt).toContain("lactose");
    expect(prompt).not.toContain("amendoim");
  });

  describe("pedido real à API da GenAI", () => {
    beforeEach(() => vi.stubEnv("VITE_GENAI_API_KEY", "chave-de-teste"));
    afterEach(() => vi.unstubAllEnvs());

    const respostaValida = {
      ok: true,
      status: 200,
      json: async () => ({
        candidates: [
          {
            finishReason: "STOP",
            content: {
              parts: [
                {
                  text: JSON.stringify({
                    title: "Arroz simples",
                    description: "Teste.",
                    prepTimeMinutes: 5,
                    cookTimeMinutes: 15,
                    servings: 4,
                    ingredients: [{ name: "Arroz", quantity: 200, unit: "g" }],
                    steps: [{ text: "Coze o arroz.", timerSeconds: 900 }],
                  }),
                },
              ],
            },
          },
        ],
      }),
    };

    const textoEnviado = (fetchImpl) =>
      JSON.parse(fetchImpl.mock.calls[0][1].body).contents[0].parts[0].text;

    it("o texto enviado à GenAI contém as alergias do perfil ativo", async () => {
      const fetchImpl = vi.fn().mockResolvedValue(respostaValida);
      await generateRecipe(
        { ingredients, profile: perfilParaPedido(CASA, true) },
        { fetchImpl },
      );
      expect(textoEnviado(fetchImpl)).toContain("amendoim");
    });

    it("com os filtros desligados, o texto enviado não contém as alergias", async () => {
      const fetchImpl = vi.fn().mockResolvedValue(respostaValida);
      await generateRecipe(
        { ingredients, profile: perfilParaPedido(CASA, false) },
        { fetchImpl },
      );
      expect(textoEnviado(fetchImpl)).not.toContain("amendoim");
    });
  });
});

describe("SCRUM-121: perfil enviado ao Spoonacular", () => {
  it("com os filtros ligados, leva a dieta e as restrições", () => {
    const spoonacular = toSpoonacularProfile(perfilParaPedido(CASA, true));
    expect(spoonacular.diets.length).toBeGreaterThan(0);
    expect(
      spoonacular.allergies.length + spoonacular.excludedIngredients.length,
    ).toBeGreaterThan(0);
  });

  it("com os filtros desligados, não leva nenhuma restrição", () => {
    expect(toSpoonacularProfile(perfilParaPedido(CASA, false))).toEqual({
      diets: [],
      allergies: [],
      excludedIngredients: [],
    });
  });
});

// ----------------------------------------------------------------------
// SCRUM-122 — estado do toggle entre arranques
// ----------------------------------------------------------------------

describe("SCRUM-122: estado guardado dos filtros", () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => vi.restoreAllMocks());

  it("sem nada guardado, os filtros estão ligados", () => {
    expect(lerFiltrosPessoais()).toBe(true);
  });

  it("guarda e volta a ler o estado desligado", () => {
    guardarFiltrosPessoais(false);
    expect(localStorage.getItem(CHAVE_FILTROS_PESSOAIS)).toBe("off");
    expect(lerFiltrosPessoais()).toBe(false);
  });

  it("guarda e volta a ler o estado ligado", () => {
    guardarFiltrosPessoais(false);
    guardarFiltrosPessoais(true);
    expect(lerFiltrosPessoais()).toBe(true);
  });

  it("um valor desconhecido conta como ligado, que é o mais seguro", () => {
    localStorage.setItem(CHAVE_FILTROS_PESSOAIS, "talvez");
    expect(lerFiltrosPessoais()).toBe(true);
  });

  it("com o armazenamento indisponível, fica ligado e não lança", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("bloqueado");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("bloqueado");
    });
    expect(lerFiltrosPessoais()).toBe(true);
    expect(guardarFiltrosPessoais(false)).toBe(false);
  });
});
