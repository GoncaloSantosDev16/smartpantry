import { db } from "@/db";

const EXPORT_VERSION = 1;

/**
 * SCRUM-147 — Recolhe um retrato completo de todas as tabelas do IndexedDB (Dexie)
 * e das chaves guardadas no localStorage.
 */
export async function collectExportData() {
  const indexedDBData = {};

  for (const table of db.tables) {
    indexedDBData[table.name] = await table.toArray();
  }

  const localStorageData = {};
  for (let i = 0; i < localStorage.length; i += 1) {
    const key = localStorage.key(i);
    if (key !== null) {
      localStorageData[key] = localStorage.getItem(key);
    }
  }

  return {
    app: "SmartPantry",
    version: EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    indexedDB: indexedDBData,
    localStorage: localStorageData,
  };
}

/**
 * Serializa um objeto para JSON formatado e força a transferência no browser.
 */
export function downloadJsonFile(data, filename) {
  const dateStamp = new Date().toISOString().slice(0, 10);
  const resolvedName = filename || `smartpantry-backup-${dateStamp}.json`;
  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = resolvedName;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  return resolvedName;
}

/**
 * Recolhe todos os dados locais da aplicação e descarrega o ficheiro JSON.
 */
export async function exportAllDataToJson(filename) {
  const data = await collectExportData();
  const savedFilename = downloadJsonFile(data, filename);
  return { filename: savedFilename, data };
}