import { defineStore } from "pinia";
import { db } from "@/db";

// Carregamento em curso, partilhado por todas as chamadas. Sem isto, várias
// navegações seguidas disparavam leituras simultâneas à base de dados.
let carregamentoEmCurso = null;

export const useProfilesStore = defineStore("profiles", {
  state: () => ({ profiles: [], loaded: false, error: null }),
  getters: {
    hasProfiles: (s) => s.profiles.length > 0,
    defaultProfile: (s) => s.profiles.find((p) => p.isDefault) ?? null,
    hasDefaultProfile: (s) => s.profiles.some((p) => p.isDefault),
  },
  actions: {
    async load({ forcar = false } = {}) {
      if (this.loaded && !forcar) return;
      if (carregamentoEmCurso) return carregamentoEmCurso;

      carregamentoEmCurso = (async () => {
        try {
          this.profiles = await db.profiles.toArray();
          this.error = null;
        } catch (err) {
          // O armazenamento local pode estar indisponível: navegação privada,
          // quota esgotada, permissões negadas. Marca-se como carregado à
          // mesma, senão cada navegação voltava a tentar indefinidamente.
          this.profiles = [];
          this.error = err;
          console.error("Não foi possível ler os perfis guardados:", err);
        } finally {
          this.loaded = true;
          carregamentoEmCurso = null;
        }
      })();

      return carregamentoEmCurso;
    },

    async createProfile(data) {
      const profile = await db.transaction("rw", db.profiles, async () => {
        const isDefault = (await db.profiles.count()) === 0;
        const toSave = { ...data, isDefault };
        const id = await db.profiles.add(toSave);
        return { ...toSave, id };
      });
      this.profiles.push(profile);
      return profile;
    },
  },
});
