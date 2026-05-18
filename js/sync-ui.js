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

// Bind de twee action-bar knoppen aan de export/import flow.
// Idempotent via body-dataset marker zodat herhaalde init geen dubbele listeners geeft.
export function bindSyncButtons() {
  const exportBtn = document.getElementById('btn-export-db');
  const importBtn = document.getElementById('btn-import-db');
  if (!exportBtn || !importBtn) return;
  if (document.body.dataset.syncButtonsBound === '1') return;
  document.body.dataset.syncButtonsBound = '1';

  exportBtn.addEventListener('click', () => {
    const { json, filename } = exportToFile();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });

  let importing = false;
  importBtn.addEventListener('click', () => {
    if (importing) return;
    importing = true;
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = async (e) => {
      try {
        const file = e.target.files[0];
        if (!file) return;
        const text = await file.text();
        const wilVervangen = confirm(
          'Database importeren:\n\n' +
          'Klik OK om de huidige database VOLLEDIG TE VERVANGEN met het bestand.\n\n' +
          'Klik Annuleren om de bestaande klanten te BEHOUDEN en alleen nieuwe items uit het bestand toe te voegen (samenvoegen).'
        );
        const mode = wilVervangen ? 'vervang' : 'samenvoegen';
        const result = importFromText(text, mode);
        if (!result.success) {
          alert('Importeren mislukt: ' + result.error);
          return;
        }
        alert(`Database geïmporteerd (mode: ${mode}). Pagina wordt vernieuwd.`);
        location.reload();
      } finally {
        importing = false;
      }
    };
    input.click();
  });
}
