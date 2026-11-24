import { defineStore } from "pinia";
import { db } from "@/db";
import { filterExpiringItems } from "@/services/expiration";

let carregamentoEmCurso = null;

export const usePantryStore = defineStore("pantry", {
  state: () => ({
    items: [],
    loaded: false,
    error: null,
    // Instante de referência para as validades. É estado (e não Date.now() no
    // getter) para o getter ser reativo: refreshNow() atualiza-o periodicamente.
    now: Date.now(),
  }),
  getters: {
    // SCRUM-106 — itens com validade <= agora + 48h, os mais urgentes primeiro.
    expiringItems: (s) => filterExpiringItems(s.items, s.now),
    expiringCount() {
      return this.expiringItems.length;
    },
  },
  actions: {
    async load({ forcar = false } = {}) {
      if (this.loaded && !forcar) return;
      if (carregamentoEmCurso) return carregamentoEmCurso;

      carregamentoEmCurso = (async () => {
        try {
          this.items = await db.pantryItems.toArray();
          this.error = null;
        } catch (err) {
          this.items = [];
          this.error = err;
          console.error("Erro ao carregar a despensa:", err);
        } finally {
          this.now = Date.now();
          this.loaded = true;
          carregamentoEmCurso = null;
        }
      })();

      return carregamentoEmCurso;
    },

    async addItem(item) {
      const toSave = { ...item };
      const id = await db.pantryItems.add(toSave);
      const saved = { ...toSave, id };
      this.items.push(saved);
      this.now = Date.now();
      return saved;
    },

    async updateItem(id, changes) {
      await db.pantryItems.update(id, { ...changes });
      const index = this.items.findIndex((i) => i.id === id);
      if (index !== -1) this.items[index] = { ...this.items[index], ...changes, id };
      this.now = Date.now();
    },

    async removeItem(id) {
      await db.pantryItems.delete(id);
      this.items = this.items.filter((i) => i.id !== id);
    },

    // US-21 — Aplica o resumo de ingredientes consumidos (planConsumption) numa só
    // transação: ou fica tudo descontado, ou nada.
    async consumeItems(operations = []) {
      if (operations.length === 0) return;
      await db.transaction("rw", db.pantryItems, async () => {
        for (const op of operations) {
          if (op.remove) await db.pantryItems.delete(op.id);
          else await db.pantryItems.update(op.id, { quantity: op.quantity });
        }
      });
      const removed = new Set(operations.filter((op) => op.remove).map((op) => op.id));
      const updated = new Map(operations.filter((op) => !op.remove).map((op) => [op.id, op.quantity]));
      this.items = this.items
        .filter((i) => !removed.has(i.id))
        .map((i) => (updated.has(i.id) ? { ...i, quantity: updated.get(i.id) } : i));
      this.now = Date.now();
    },

    refreshNow() {
      this.now = Date.now();
    },
  },
});
