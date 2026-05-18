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

export function slugify(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function uniqueSlug(base, existingIds) {
  if (!existingIds.includes(base)) return base;
  let n = 2;
  while (existingIds.includes(`${base}-${n}`)) n++;
  return `${base}-${n}`;
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

export function addKlant(db, klant) {
  const existingIds = db.klanten.map(k => k.id);
  const baseSlug = slugify(klant.bedrijfsnaam || 'klant');
  const id = uniqueSlug(baseSlug, existingIds);
  return {
    ...db,
    klanten: [
      ...db.klanten,
      { ...klant, id, aangemaakt: today() }
    ]
  };
}

export function updateKlant(db, id, patch) {
  const idx = db.klanten.findIndex(k => k.id === id);
  if (idx === -1) {
    throw new Error(`updateKlant: id "${id}" niet gevonden`);
  }
  const updated = { ...db.klanten[idx], ...patch, id: db.klanten[idx].id, aangemaakt: db.klanten[idx].aangemaakt };
  return {
    ...db,
    klanten: db.klanten.map((k, i) => i === idx ? updated : k)
  };
}

export function deleteKlant(db, id) {
  return {
    ...db,
    klanten: db.klanten.filter(k => k.id !== id)
  };
  // NOTE: cascade naar voorzieningen komt in Task 5
}
