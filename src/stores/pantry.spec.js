import "fake-indexeddb/auto";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { db } from "@/db";
import { usePantryStore } from "./pantry";

const now = new Date(2026, 10, 16, 10, 0, 0);

describe("pantry store", () => {
  beforeEach(async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(now);
    setActivePinia(createPinia());
    await db.pantryItems.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("carrega os itens guardados", async () => {
    await db.pantryItems.bulkAdd([{ name: "Leite" }, { name: "Arroz" }]);
    const store = usePantryStore();
    await store.load();
    expect(store.items.map((i) => i.name)).toEqual(["Leite", "Arroz"]);
  });

  it("adiciona, atualiza e remove itens (e persiste)", async () => {
    const store = usePantryStore();
    const { id } = await store.addItem({ name: "Leite", quantity: 1, unit: "L", expirationDate: "2026-11-30" });
    expect((await db.pantryItems.get(id)).name).toBe("Leite");

    await store.updateItem(id, { quantity: 2 });
    expect(store.items[0].quantity).toBe(2);
    expect((await db.pantryItems.get(id)).quantity).toBe(2);

    await store.removeItem(id);
    expect(store.items).toHaveLength(0);
    expect(await db.pantryItems.get(id)).toBeUndefined();
  });

  describe("SCRUM-106: getter expiringItems", () => {
    it("devolve só os itens com validade <= agora + 48h", async () => {
      await db.pantryItems.bulkAdd([
        { name: "Arroz", expirationDate: "2026-12-30" },
        { name: "Leite", expirationDate: "2026-11-17" },
        { name: "Iogurte", expirationDate: "2026-11-15" },
        { name: "Sal" },
      ]);
      const store = usePantryStore();
      await store.load();

      expect(store.expiringItems.map((i) => i.name)).toEqual(["Iogurte", "Leite"]);
      expect(store.expiringCount).toBe(2);
    });

    it("atualiza logo que se adiciona um produto a expirar", async () => {
      const store = usePantryStore();
      await store.load();
      expect(store.expiringCount).toBe(0);

      await store.addItem({ name: "Leite", expirationDate: "2026-11-17" });
      expect(store.expiringItems.map((i) => i.name)).toEqual(["Leite"]);
    });

    it("refreshNow faz entrar na janela itens que antes estavam fora", async () => {
      const store = usePantryStore();
      await store.addItem({ name: "Queijo", expirationDate: "2026-11-18" });
      expect(store.expiringCount).toBe(0);

      vi.setSystemTime(new Date(2026, 10, 17, 9, 0, 0));
      store.refreshNow();
      expect(store.expiringCount).toBe(1);
    });
  });
});
