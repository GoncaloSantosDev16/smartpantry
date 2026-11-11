import { defineStore } from "pinia";
import { db } from "@/db";

let carregamentoEmCurso = null;

const normalizar = (nome) => nome.trim().toLocaleLowerCase("pt-PT");

export const useShoppingListStore = defineStore("shoppingList", {
  state: () => ({ items: [], loaded: false, error: null }),
  getters: {
    pendingItems: (s) => s.items.filter((i) => !i.checked),
    checkedItems: (s) => s.items.filter((i) => i.checked),
    pendingCount() {
      return this.pendingItems.length;
    },
  },
  actions: {
    async load({ forcar = false } = {}) {
      if (this.loaded && !forcar) return;
      if (carregamentoEmCurso) return carregamentoEmCurso;

      carregamentoEmCurso = (async () => {
        try {
          this.items = await db.shoppingItems.toArray();
          this.error = null;
        } catch (err) {
          this.items = [];
          this.error = err;
          console.error("Não foi possível ler a lista de compras:", err);
        } finally {
          this.loaded = true;
          carregamentoEmCurso = null;
        }
      })();

      return carregamentoEmCurso;
    },

    async addItem({ name, quantity = 1, unit = "un" }) {
      const nome = (name ?? "").trim();
      const qtd = Number(quantity);
      if (!nome) throw new Error("O nome é obrigatório.");
      if (!Number.isFinite(qtd) || qtd <= 0) throw new Error("A quantidade tem de ser maior que 0.");
      if (unit === "un" && !Number.isInteger(qtd)) throw new Error("Em unidades a quantidade tem de ser um número inteiro.");

      // Item igual ainda por comprar: soma a quantidade em vez de duplicar.
      const existente = this.items.find(
        (i) => !i.checked && i.unit === unit && normalizar(i.name) === normalizar(nome),
      );
      if (existente) {
        const novaQtd = existente.quantity + qtd;
        await db.shoppingItems.update(existente.id, { quantity: novaQtd });
        existente.quantity = novaQtd;
        return existente;
      }

      const item = {
        name: nome,
        quantity: qtd,
        unit,
        checked: false,
        createdAt: new Date().toISOString(),
      };
      const id = await db.shoppingItems.add(item);
      const novo = { ...item, id };
      this.items.push(novo);
      return novo;
    },

    async toggleChecked(id) {
      const item = this.items.find((i) => i.id === id);
      if (!item) return;
      const checked = !item.checked;
      await db.shoppingItems.update(id, { checked });
      item.checked = checked;
    },

    async removeItem(id) {
      await db.shoppingItems.delete(id);
      this.items = this.items.filter((i) => i.id !== id);
    },

    async clearChecked() {
      const ids = this.checkedItems.map((i) => i.id);
      if (!ids.length) return;
      await db.shoppingItems.bulkDelete(ids);
      this.items = this.items.filter((i) => !i.checked);
    },
  },
});
