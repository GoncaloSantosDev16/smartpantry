import "fake-indexeddb/auto";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { db } from "@/db";
import { useProfilesStore } from "./profiles";

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
});
