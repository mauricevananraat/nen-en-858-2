import { loadDb, exportDb, saveDb, importDb } from './database.js';

// Pure logica voor export: lees db, genereer JSON + filename met datum
export function exportToFile() {
  const db = loadDb();
  const json = exportDb(db);
  const datum = new Date().toISOString().slice(0, 10);
  const filename = `nen858-klanten-${datum}.json`;
  return { json, filename };
}

// Import-helper: parse JSON, roept importDb aan, persist met saveDb.
// Returns { success: boolean, error?: string, db?: Db } voor UI feedback.
export function importFromText(jsonText, mode) {
  let newDb;
  try {
    newDb = importDb(loadDb(), jsonText, mode);
  } catch (e) {
    return { success: false, error: e.message };
  }
  try {
    saveDb(newDb);
  } catch (e) {
    return { success: false, error: e.message };
  }
  return { success: true, db: newDb };
}
