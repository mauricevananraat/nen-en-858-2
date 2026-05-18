import { loadDb, exportDb } from './database.js';

// Pure logica voor export: lees db, genereer JSON + filename met datum
export function exportToFile() {
  const db = loadDb();
  const json = exportDb(db);
  const datum = new Date().toISOString().slice(0, 10);
  const filename = `nen858-klanten-${datum}.json`;
  return { json, filename };
}
