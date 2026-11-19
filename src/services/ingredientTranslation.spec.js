import { describe, it, expect } from "vitest";
import {
  toEnglishIngredient,
  toSpoonacularProfile,
  toPortugueseIngredient,
  PORTUGUESE_NAMES,
} from "./ingredientTranslation";
describe("SCRUM-117: toEnglishIngredient", () => {
  it.each([
    ["Ovos", "egg"],
    ["Espinafres", "spinach"],
    ["Limões", "lemon"],
    ["Nozes", "walnuts"],
    ["Pães", "bread"],
    ["Grão-de-bico", "chickpeas"],
    ["Peito de frango", "chicken breast"],
  ])("%s -> %s", (pt, en) => {
    expect(toEnglishIngredient(pt)).toBe(en);
  });

  it("usa a palavra conhecida quando o nome tem mais detalhes", () => {
    expect(toEnglishIngredient("Arroz agulha")).toBe("rice");
    expect(toEnglishIngredient("Leite meio-gordo")).toBe("milk");
  });

  it("nomes desconhecidos passam normalizados", () => {
    expect(toEnglishIngredient("  Nutella ")).toBe("nutella");
    expect(toEnglishIngredient("")).toBe("");
  });
});

describe("SCRUM-117: toSpoonacularProfile", () => {
  it("converte dietas, alergias e excluídos", () => {
    expect(
      toSpoonacularProfile({
        diets: ["vegetarian", "pescatarian"],
        allergies: ["Amendoim", "Frutos secos", "Lactose"],
        excludedIngredients: ["Cogumelos"],
      }),
    ).toEqual({
      diets: ["vegetarian", "pescetarian"],
      allergies: ["peanut", "tree nut", "dairy"],
      excludedIngredients: ["mushrooms"],
    });
  });

  it("alergias sem intolerância equivalente passam a ingredientes excluídos", () => {
    expect(toSpoonacularProfile({ allergies: ["Kiwi"] })).toEqual({
      diets: [],
      allergies: [],
      excludedIngredients: ["kiwi"],
    });
  });

  it("aceita perfil vazio", () => {
    expect(toSpoonacularProfile()).toEqual({
      diets: [],
      allergies: [],
      excludedIngredients: [],
    });
  });
});

describe("SCRUM-124: toPortugueseIngredient", () => {
  it.each([
    ["egg", "Ovos"],
    ["eggs", "Ovos"],
    ["onion", "Cebola"],
    ["tomatoes", "Tomate"],
    ["heavy cream", "Natas"],
    ["Olive Oil", "Azeite"],
    ["grape", "Uvas"],
  ])("%s -> %s", (en, pt) => {
    expect(toPortugueseIngredient(en)).toBe(pt);
  });

  it("nomes desconhecidos ficam como estão, com maiúscula inicial", () => {
    expect(toPortugueseIngredient("  garam   masala ")).toBe("Garam masala");
    expect(toPortugueseIngredient("")).toBe("");
    expect(toPortugueseIngredient(null)).toBe("");
  });

  it("o nome em português volta sempre ao mesmo nome inglês", () => {
    for (const [en, pt] of Object.entries(PORTUGUESE_NAMES)) {
      expect(toEnglishIngredient(pt), `${pt} devia voltar a ${en}`).toBe(en);
    }
  });
});
