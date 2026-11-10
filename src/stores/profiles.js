import { defineStore } from "pinia";
import { db } from "@/db";
import {
  guardarPerfilAtivo,
  lerPerfilAtivo,
  limparPerfilAtivo,
} from "@/services/activeProfileStorage";

// Carregamento em curso, partilhado por todas as chamadas. Sem isto, várias
// navegações seguidas disparavam leituras simultâneas à base de dados.
let carregamentoEmCurso = null;

export const useProfilesStore = defineStore("profiles", {
  state: () => ({
    profiles: [],
    loaded: false,
    error: null,
    // SCRUM-104 — id escolhido pelo utilizador. null significa "nenhuma
    // escolha explícita", e nesse caso o perfil ativo é o default.
    activeProfileId: null,
  }),
  getters: {
    hasProfiles: (s) => s.profiles.length > 0,
    defaultProfile: (s) => s.profiles.find((p) => p.isDefault) ?? null,
    hasDefaultProfile: (s) => s.profiles.some((p) => p.isDefault),

    // SCRUM-104 — perfil em uso. Cada perfil tem as suas alergias, por isso
    // quem precisar das restrições alimentares lê-as daqui.
    activeProfile: (s) =>
      s.profiles.find((p) => p.id === s.activeProfileId) ??
      s.profiles.find((p) => p.isDefault) ??
      null,
  },
  actions: {
    async load({ forcar = false } = {}) {
      if (this.loaded && !forcar) return;
      if (carregamentoEmCurso) return carregamentoEmCurso;

      carregamentoEmCurso = (async () => {
        try {
          this.profiles = await db.profiles.toArray();
          this.error = null;
          this.restaurarPerfilAtivo();
        } catch (err) {
          // O armazenamento local pode estar indisponível: navegação privada,
          // quota esgotada, permissões negadas. Marca-se como carregado à
          // mesma, senão cada navegação voltava a tentar indefinidamente.
          this.profiles = [];
          this.activeProfileId = null;
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

    /**
     * SCRUM-104 — Torna ativo o perfil com o id indicado.
     * Devolve false, sem alterar nada, se o perfil não existir.
     */
    setActiveProfile(id) {
      const perfil = this.profiles.find((p) => p.id === id);
      if (!perfil) return false;

      this.activeProfileId = perfil.id;
      // Se o armazenamento falhar, a troca vale na mesma até a app fechar.
      guardarPerfilAtivo(perfil.id);
      return true;
    },

    /**
     * Recupera a escolha guardada. Se o perfil entretanto deixou de existir,
     * a escolha é esquecida e o perfil ativo volta a ser o default.
     */
    restaurarPerfilAtivo() {
      const guardado = lerPerfilAtivo();
      const existe = this.profiles.some((p) => p.id === guardado);

      this.activeProfileId = existe ? guardado : null;
      if (guardado !== null && !existe) limparPerfilAtivo();
    },
  },
});
