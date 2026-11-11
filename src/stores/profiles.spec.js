import "fake-indexeddb/auto";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { db } from "@/db";
import { useProfilesStore } from "./profiles";
import { CHAVE_PERFIL_ATIVO } from "@/services/activeProfileStorage";

const data = {
  name: "Casa",
  servings: 2,
  diets: [],
  allergies: [],
  excludedIngredients: [],
};

describe("profiles store", () => {
  beforeEach(async () => {
    setActivePinia(createPinia());
    await db.profiles.clear();
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("o primeiro perfil criado fica como default", async () => {
    const store = useProfilesStore();
    await store.createProfile(data);
    expect(store.defaultProfile.name).toBe("Casa");
    expect(await db.profiles.count()).toBe(1);
  });

  it("o segundo perfil não é default", async () => {
    const store = useProfilesStore();
    await store.createProfile(data);
    await store.createProfile({ ...data, name: "Amigos" });
    expect(store.profiles.filter((p) => p.isDefault)).toHaveLength(1);
  });

  it("load() lê os perfis guardados", async () => {
    await db.profiles.add({ ...data, isDefault: true });
    const store = useProfilesStore();
    await store.load();
    expect(store.hasProfiles).toBe(true);
    expect(store.hasDefaultProfile).toBe(true);
  });

  it("hasDefaultProfile distingue um perfil sem a marca de default", async () => {
    await db.profiles.add({ ...data, isDefault: false });
    const store = useProfilesStore();
    await store.load();
    expect(store.hasProfiles).toBe(true);
    expect(store.hasDefaultProfile).toBe(false);
  });

  it("não rebenta quando o armazenamento local falha", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(db.profiles, "toArray").mockRejectedValue(
      new Error("storage indisponivel"),
    );

    const store = useProfilesStore();
    await expect(store.load()).resolves.not.toThrow();

    expect(store.error).toBeInstanceOf(Error);
    expect(store.profiles).toEqual([]);
  });

  it("marca como carregado mesmo depois de falhar, para não repetir sem fim", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const toArray = vi
      .spyOn(db.profiles, "toArray")
      .mockRejectedValue(new Error("storage indisponivel"));

    const store = useProfilesStore();
    await store.load();
    await store.load();

    expect(store.loaded).toBe(true);
    expect(toArray).toHaveBeenCalledTimes(1);
  });

  it("chamadas simultâneas só fazem uma leitura", async () => {
    const toArray = vi.spyOn(db.profiles, "toArray");
    const store = useProfilesStore();

    await Promise.all([store.load(), store.load(), store.load()]);

    expect(toArray).toHaveBeenCalledTimes(1);
  });

  it("só um perfil fica default mesmo com criação em simultâneo", async () => {
    const store = useProfilesStore();
    await Promise.all([
      store.createProfile(data),
      store.createProfile({ ...data, name: "Outro" }),
    ]);
    const saved = await db.profiles.toArray();
    expect(saved).toHaveLength(2);
    expect(saved.filter((p) => p.isDefault)).toHaveLength(1);
  });

  it("o perfil sobrevive a um novo arranque da app", async () => {
    await useProfilesStore().createProfile(data);

    setActivePinia(createPinia());
    const fresh = useProfilesStore();
    await fresh.load();

    expect(fresh.defaultProfile.name).toBe("Casa");
  });
  // ------------------------------------------------------------------
  // SCRUM-104 — perfil ativo
  // ------------------------------------------------------------------

  describe("perfil ativo", () => {
    async function criarDoisPerfis() {
      const store = useProfilesStore();
      const casa = await store.createProfile({
        ...data,
        name: "Casa",
        allergies: ["peanut"],
      });
      const ginasio = await store.createProfile({
        ...data,
        name: "Ginásio",
        allergies: ["lactose"],
      });
      return { store, casa, ginasio };
    }

    it("sem escolha feita, o perfil ativo é o default", async () => {
      const { store } = await criarDoisPerfis();
      expect(store.activeProfile.name).toBe("Casa");
    });

    it("sem perfis, não há perfil ativo", () => {
      expect(useProfilesStore().activeProfile).toBeNull();
    });

    it("trocar de perfil muda o perfil ativo e as alergias associadas", async () => {
      const { store, ginasio } = await criarDoisPerfis();

      expect(store.setActiveProfile(ginasio.id)).toBe(true);

      expect(store.activeProfile.name).toBe("Ginásio");
      expect(store.activeProfile.allergies).toEqual(["lactose"]);
    });

    it("trocar de perfil não altera qual é o default", async () => {
      const { store, ginasio } = await criarDoisPerfis();
      store.setActiveProfile(ginasio.id);
      expect(store.defaultProfile.name).toBe("Casa");
    });

    it("recusa trocar para um perfil que não existe", async () => {
      const { store } = await criarDoisPerfis();

      expect(store.setActiveProfile(9999)).toBe(false);

      expect(store.activeProfile.name).toBe("Casa");
    });

    it("a escolha sobrevive a um novo arranque da app", async () => {
      const { store, ginasio } = await criarDoisPerfis();
      store.setActiveProfile(ginasio.id);

      setActivePinia(createPinia());
      const fresh = useProfilesStore();
      await fresh.load();

      expect(fresh.activeProfile.name).toBe("Ginásio");
    });

    it("se o perfil guardado já não existe, volta ao default e esquece-o", async () => {
      await criarDoisPerfis();
      localStorage.setItem(CHAVE_PERFIL_ATIVO, "9999");

      setActivePinia(createPinia());
      const fresh = useProfilesStore();
      await fresh.load();

      expect(fresh.activeProfile.name).toBe("Casa");
      expect(localStorage.getItem(CHAVE_PERFIL_ATIVO)).toBeNull();
    });

    it("a troca funciona mesmo com o armazenamento local indisponível", async () => {
      const { store, ginasio } = await criarDoisPerfis();
      vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
        throw new Error("bloqueado");
      });

      expect(store.setActiveProfile(ginasio.id)).toBe(true);
      expect(store.activeProfile.name).toBe("Ginásio");
    });

    it("sem perfis por falha de leitura, não há perfil ativo", async () => {
      vi.spyOn(console, "error").mockImplementation(() => {});
      vi.spyOn(db.profiles, "toArray").mockRejectedValue(
        new Error("storage indisponivel"),
      );

      const store = useProfilesStore();
      await store.load();

      expect(store.activeProfile).toBeNull();
    });
  });
});
