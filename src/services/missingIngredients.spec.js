import { describe, it, expect } from "vitest";
import { missingIngredients } from "./missingIngredients";
import { toRecipeCards } from "./recipeCards";

const card = (ingredients) => ({ id: 1, title: "Receita", ingredients });

describe("SCRUM-124: missingIngredients", () => {
  it("devolve só os ingredientes em falta, com o nome em português", () => {
    const result = missingIngredients(
      card([
        { name: "rice", amount: "200 g", inPantry: true },
        { name: "onion", amount: "1", inPantry: false },
        { name: "garlic", amount: "2 cloves", inPantry: false },
      ]),
    );
    expect(result).toEqual([
      { name: "Cebola", original: "onion" },
      { name: "Alho", original: "garlic" },
    ]);
  });

  it("funciona com os cartões reais do toRecipeCards", () => {
    const [cartao] = toRecipeCards(
      [
        {
          id: 7,
          title: "Tomato Rice",
          ingredients: [
            { name: "rice", amount: 200, unit: "g" },
            { name: "tomatoes", amount: 2, unit: "" },
            { name: "heavy cream", amount: 0.5, unit: "cup" },
          ],
        },
      ],
      ["rice"],
    );
    expect(missingIngredients(cartao).map((i) => i.name)).toEqual([
      "Tomate",
      "Natas",
    ]);
  });

  it("não repete ingredientes que aparecem duas vezes na receita", () => {
    const result = missingIngredients(
      card([
        { name: "salt", inPantry: false },
        { name: "Salt", inPantry: false },
        { name: "eggs", inPantry: false },
        { name: "egg", inPantry: false },
      ]),
    );
    expect(result.map((i) => i.name)).toEqual(["Sal", "Ovos"]);
  });

  it("ingredientes que o dicionário não conhece ficam com o nome original", () => {
    expect(
      missingIngredients(card([{ name: "garam masala", inPantry: false }])),
    ).toEqual([{ name: "Garam masala", original: "garam masala" }]);
  });

  it("devolve uma lista vazia quando não falta nada ou o cartão é inválido", () => {
    expect(
      missingIngredients(card([{ name: "rice", inPantry: true }])),
    ).toEqual([]);
    expect(missingIngredients(card([{ name: "  ", inPantry: false }]))).toEqual(
      [],
    );
    expect(missingIngredients(null)).toEqual([]);
    expect(missingIngredients({})).toEqual([]);
  });
});
