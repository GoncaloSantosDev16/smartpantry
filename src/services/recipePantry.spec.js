import { describe, it, expect } from "vitest";
import { toPantryItem } from "./recipePantry";
import { validateItem } from "./pantryHelpers";
import { toEnglishIngredient } from "./ingredientTranslation";

describe("SCRUM-128: toPantryItem", () => {
  it("cria o item da despensa em português, com 1 unidade e sem validade", () => {
    expect(toPantryItem("onion")).toEqual({
      name: "Cebola",
      quantity: 1,
      unit: "un",
      category: "Outro",
      expirationDate: null,
    });
  });

  it("é um item válido para a despensa", () => {
    expect(validateItem(toPantryItem("heavy cream"))).toEqual({});
  });

  it("o nome guardado volta a corresponder ao ingrediente da receita", () => {
    expect(toEnglishIngredient(toPantryItem("eggs").name)).toBe("egg");
    expect(toEnglishIngredient(toPantryItem("garam masala").name)).toBe(
      "garam masala",
    );
  });

  it("devolve null sem nome", () => {
    expect(toPantryItem("")).toBeNull();
    expect(toPantryItem(undefined)).toBeNull();
  });
});
