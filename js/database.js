export const STORAGE_KEY = 'nen858-database';
export const CURRENT_VERSION = 1;

function defaultDb() {
  return {
    versie: CURRENT_VERSION,
    klanten: [],
    voorzieningen: []
  };
}

export function loadDb() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return defaultDb();
  try {
    return JSON.parse(raw);
  } catch (e) {
    console.warn('database.js: corrupt JSON in localStorage, returning default db', e);
    return defaultDb();
  }
}

export function saveDb(db) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
}
