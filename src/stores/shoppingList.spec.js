import "fake-indexeddb/auto";
import { describe, it, expect, beforeEach } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { db } from "@/db";
import { useShoppingListStore } from "./shoppingList";

describe("shoppingList store", () => {
  beforeEach(async () => {
    setActivePinia(createPinia());
    await db.shoppingItems.clear();
  });

  it("adiciona um item e persiste-o", async () => {
    const store = useShoppingListStore();
    const item = await store.addItem({ name: " Leite ", quantity: 2, unit: "L" });

    expect(item).toMatchObject({ name: "Leite", quantity: 2, unit: "L", checked: false });
    expect(await db.shoppingItems.get(item.id)).toMatchObject({ name: "Leite" });
    expect(store.pendingCount).toBe(1);
  });

  it("rejeita nome vazio e quantidade inválida", async () => {
    const store = useShoppingListStore();
    await expect(store.addItem({ name: "  " })).rejects.toThrow();
    await expect(store.addItem({ name: "Ovos", quantity: 0 })).rejects.toThrow();
    expect(await db.shoppingItems.count()).toBe(0);
  });

  it("em unidades só aceita quantidades inteiras", async () => {
    const store = useShoppingListStore();
    await expect(store.addItem({ name: "Pêssego", quantity: 2.5, unit: "un" })).rejects.toThrow(/inteiro/);
    await expect(store.addItem({ name: "Farinha", quantity: 0.5, unit: "kg" })).resolves.toMatchObject({ quantity: 0.5 });
    expect(await db.shoppingItems.count()).toBe(1);
  });

  it("soma a quantidade de um item pendente igual em vez de duplicar", async () => {
    const store = useShoppingListStore();
    await store.addItem({ name: "Ovos", quantity: 6, unit: "un" });
    await store.addItem({ name: "ovos", quantity: 6, unit: "un" });

    expect(store.items).toHaveLength(1);
    expect(store.items[0].quantity).toBe(12);
  });

  it("dar check retira o item do contador e persiste o estado", async () => {
    const store = useShoppingListStore();
    const { id } = await store.addItem({ name: "Pão" });

    await store.toggleChecked(id);
    expect(store.pendingCount).toBe(0);
    expect((await db.shoppingItems.get(id)).checked).toBe(true);

    await store.toggleChecked(id);
    expect(store.pendingCount).toBe(1);
  });

  it("remove um item", async () => {
    const store = useShoppingListStore();
    const { id } = await store.addItem({ name: "Arroz" });

    await store.removeItem(id);
    expect(store.items).toHaveLength(0);
    expect(await db.shoppingItems.get(id)).toBeUndefined();
  });

  it("limpa apenas os itens comprados", async () => {
    const store = useShoppingListStore();
    const a = await store.addItem({ name: "Arroz" });
    await store.addItem({ name: "Massa" });
    await store.toggleChecked(a.id);

    await store.clearChecked();
    expect(store.items.map((i) => i.name)).toEqual(["Massa"]);
    expect(await db.shoppingItems.count()).toBe(1);
  });

  it("carrega os itens guardados", async () => {
    await db.shoppingItems.bulkAdd([
      { name: "Leite", quantity: 1, unit: "L", checked: false },
      { name: "Sal", quantity: 1, unit: "un", checked: true },
    ]);
    const store = useShoppingListStore();
    await store.load();

    expect(store.items).toHaveLength(2);
    expect(store.pendingCount).toBe(1);
  });
});
