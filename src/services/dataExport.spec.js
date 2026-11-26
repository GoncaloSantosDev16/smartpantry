import "fake-indexeddb/auto";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { db } from "@/db";
import {
  collectExportData,
  downloadJsonFile,
  exportAllDataToJson,
} from "./dataExport";

describe("dataExport service (SCRUM-147)", () => {
  beforeEach(async () => {
    await Promise.all(db.tables.map((t) => t.clear()));
    localStorage.clear();
    URL.createObjectURL = vi.fn(() => "blob:smartpantry-backup");
    URL.revokeObjectURL = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("recolhe todas as tabelas do Dexie e chaves do localStorage com metadados", async () => {
    await db.profiles.add({
      name: "Casa",
      servings: 2,
      diets: ["vegetarian"],
      allergies: ["peanut"],
      excludedIngredients: [],
      isDefault: true,
    });
    localStorage.setItem("smartpantry_test_pref", "true");

    const snapshot = await collectExportData();

    expect(snapshot.app).toBe("SmartPantry");
    expect(snapshot.version).toBe(1);
    expect(typeof snapshot.exportedAt).toBe("string");
    expect(snapshot.indexedDB.profiles).toHaveLength(1);
    expect(snapshot.indexedDB.profiles[0].name).toBe("Casa");
    expect(snapshot.localStorage.smartpantry_test_pref).toBe("true");
  });

  it("funciona mesmo quando a base de dados e o localStorage estão vazios", async () => {
    const snapshot = await collectExportData();

    expect(snapshot.indexedDB.profiles).toEqual([]);
    expect(snapshot.localStorage).toEqual({});
  });

  it("gera o ficheiro JSON e dispara a transferência no browser", async () => {
    const clickSpy = vi
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(() => {});

    const result = await exportAllDataToJson("backup-teste.json");

    expect(URL.createObjectURL).toHaveBeenCalledTimes(1);
    const blobArg = URL.createObjectURL.mock.calls[0][0];
    expect(blobArg).toBeInstanceOf(Blob);
    expect(blobArg.type).toBe("application/json");
    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith(
      "blob:smartpantry-backup",
    );
    expect(result.filename).toBe("backup-teste.json");
    expect(result.data.app).toBe("SmartPantry");
  });

  it("usa um nome de ficheiro com a data atual por omissão", () => {
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});

    const filename = downloadJsonFile({ ok: true });

    expect(filename).toMatch(/^smartpantry-backup-\d{4}-\d{2}-\d{2}\.json$/);
  });
});