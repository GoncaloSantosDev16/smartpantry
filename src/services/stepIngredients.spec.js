import { describe, it, expect } from "vitest";
import { ingredientsForStep, stepsWithIngredients } from "./stepIngredients";
import { DEMO_RECIPE } from "./recipeModel";

const nomes = (lista) => lista.map((i) => i.name);

describe("SCRUM-144: ingredientsForStep", () => {
  const INGREDIENTES = DEMO_RECIPE.ingredients; // Arroz, Frango cozido, Cenoura, Azeite

  it("encontra os ingredientes cujo nome aparece no texto do passo", () => {
    expect(
      nomes(
        ingredientsForStep(
          { text: "Refoga a cenoura no azeite." },
          INGREDIENTES,
        ),
      ),
    ).toEqual(["Cenoura", "Azeite"]);
  });

  it('basta uma palavra do nome ("Frango cozido" em "Mistura o frango")', () => {
    expect(
      nomes(
        ingredientsForStep(
          { text: "Mistura o frango, prova o sal e serve." },
          INGREDIENTES,
        ),
      ),
    ).toEqual(["Frango cozido"]);
  });

  it("mantém a ordem da receita e devolve os objetos completos (com quantidade)", () => {
    const resultado = ingredientsForStep(
      { text: "Corta a cenoura e o frango." },
      INGREDIENTES,
    );
    expect(resultado).toEqual([
      { name: "Frango cozido", quantity: 300, unit: "g" },
      { name: "Cenoura", quantity: 2, unit: "un" },
    ]);
  });

  it("não liga a maiúsculas, acentos nem plurais", () => {
    const ingredientes = [
      { name: "Ovos", quantity: 2, unit: "un" },
      { name: "Limão", quantity: 1, unit: "un" },
      { name: "Pão", quantity: 1, unit: "un" },
    ];
    expect(
      nomes(
        ingredientsForStep(
          { text: "BATE O OVO e junta o sumo dos LIMOES." },
          ingredientes,
        ),
      ),
    ).toEqual(["Ovos", "Limão"]);
    expect(
      nomes(ingredientsForStep({ text: "Torra os pães." }, ingredientes)),
    ).toEqual(["Pão"]);
  });

  it('ignora palavras de ligação ("de", "com") e não confunde palavras parecidas', () => {
    const ingredientes = [
      { name: "Polpa de tomate", quantity: 1, unit: "un" },
      { name: "Sal", quantity: 1, unit: "g" },
    ];
    expect(
      nomes(
        ingredientsForStep({ text: "Junta a polpa de tomate." }, ingredientes),
      ),
    ).toEqual(["Polpa de tomate"]);
    expect(
      nomes(
        ingredientsForStep(
          { text: "Deixa repousar de seguida." },
          ingredientes,
        ),
      ),
    ).toEqual([]);
    expect(
      nomes(ingredientsForStep({ text: "Salteia os legumes." }, ingredientes)),
    ).toEqual([]);
  });

  it("funciona com receitas em inglês (Spoonacular)", () => {
    const ingredientes = [
      { name: "olive oil", quantity: 1, unit: "tbsp" },
      { name: "onions", quantity: 2, unit: "" },
    ];
    expect(
      nomes(
        ingredientsForStep({ text: "Fry the onion in the oil." }, ingredientes),
      ),
    ).toEqual(["olive oil", "onions"]);
  });

  it("um passo sem ingredientes da receita devolve uma lista vazia", () => {
    expect(
      ingredientsForStep({ text: "Pré-aquece o forno." }, INGREDIENTES),
    ).toEqual([]);
    expect(ingredientsForStep({ text: "" }, INGREDIENTES)).toEqual([]);
    expect(ingredientsForStep(null, INGREDIENTES)).toEqual([]);
    expect(ingredientsForStep({ text: "Corta a cenoura." })).toEqual([]);
  });
});

describe("SCRUM-144: stepsWithIngredients", () => {
  it("junta a cada passo da receita de exemplo os seus ingredientes", () => {
    const passos = stepsWithIngredients(DEMO_RECIPE);
    expect(passos.map((p) => nomes(p.ingredients))).toEqual([
      ["Frango cozido", "Cenoura"],
      ["Cenoura", "Azeite"],
      ["Arroz"],
      ["Frango cozido"],
    ]);
  });

  it("mantém o texto e o temporizador de cada passo", () => {
    const [primeiro, segundo] = stepsWithIngredients(DEMO_RECIPE);
    expect(primeiro).toMatchObject({
      text: "Corta o frango e a cenoura em pedaços pequenos.",
      timerSeconds: null,
    });
    expect(segundo).toMatchObject({
      text: "Refoga a cenoura no azeite.",
      timerSeconds: 300,
    });
  });

  it("aceita receitas sem passos ou inválidas", () => {
    expect(stepsWithIngredients({ ingredients: [], steps: [] })).toEqual([]);
    expect(stepsWithIngredients(null)).toEqual([]);
  });
});
