import "fake-indexeddb/auto";
import { describe, it, expect, beforeEach } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { db } from "@/db";
import { useShoppingListStore } from "@/stores/shoppingList";
import { notOnShoppingList, sendToShoppingList } from "./recipeShopping";

const MISSING = [
  { name: "Cebola", original: "onion" },
  { name: "Alho", original: "garlic" },
];

describe("SCRUM-126: notOnShoppingList", () => {
  it("tira os ingredientes que já estão por comprar (sem ligar a maiúsculas)", () => {
    expect(
      notOnShoppingList(MISSING, [{ name: " cebola ", unit: "kg" }]),
    ).toEqual([{ name: "Alho", original: "garlic" }]);
  });

  it("com a lista vazia devolve todos", () => {
    expect(notOnShoppingList(MISSING, [])).toEqual(MISSING);
    expect(notOnShoppingList(undefined, undefined)).toEqual([]);
  });
});

describe("SCRUM-126: sendToShoppingList", () => {
  beforeEach(async () => {
    setActivePinia(createPinia());
    await db.shoppingItems.clear();
  });

  it("adiciona os ingredientes em falta à store, com 1 unidade", async () => {
    const store = useShoppingListStore();
    const added = await sendToShoppingList(store, MISSING);

    expect(added).toHaveLength(2);
    expect(store.pendingCount).toBe(2);
    expect(store.items.map((i) => [i.name, i.quantity, i.unit])).toEqual([
      ["Cebola", 1, "un"],
      ["Alho", 1, "un"],
    ]);
    expect(await db.shoppingItems.count()).toBe(2);
  });

  it("não acrescenta outra vez o que já está por comprar", async () => {
    const store = useShoppingListStore();
    await store.addItem({ name: "Cebola", quantity: 2, unit: "un" });

    const added = await sendToShoppingList(store, MISSING);

    expect(added.map((i) => i.name)).toEqual(["Alho"]);
    expect(store.pendingCount).toBe(2);
    expect(store.items.find((i) => i.name === "Cebola").quantity).toBe(2);
  });

  it("carregar duas vezes não muda nada da segunda vez", async () => {
    const store = useShoppingListStore();
    await sendToShoppingList(store, MISSING);
    const added = await sendToShoppingList(store, MISSING);

    expect(added).toEqual([]);
    expect(store.pendingCount).toBe(2);
  });

  it("um item já comprado (com check) volta a entrar na lista", async () => {
    const store = useShoppingListStore();
    const { id } = await store.addItem({ name: "Cebola" });
    await store.toggleChecked(id);

    await sendToShoppingList(store, MISSING);

    expect(store.pendingItems.map((i) => i.name)).toEqual(["Cebola", "Alho"]);
  });

  it("lê a lista guardada antes de comparar", async () => {
    await db.shoppingItems.add({
      name: "Alho",
      quantity: 1,
      unit: "un",
      checked: false,
    });
    const store = useShoppingListStore();

    const added = await sendToShoppingList(store, MISSING);

    expect(added.map((i) => i.name)).toEqual(["Cebola"]);
  });
});
