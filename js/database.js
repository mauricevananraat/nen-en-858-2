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
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  } catch (e) {
    if (e && (e.name === 'QuotaExceededError' || e.code === 22)) {
      throw new Error('Database is vol. Exporteer als backup en verwijder oude klanten.');
    }
    throw e;
  }
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
    klanten: db.klanten.filter(k => k.id !== id),
    voorzieningen: db.voorzieningen.filter(v => v.klant_id !== id)
  };
}

export function addVoorziening(db, voorziening) {
  if (!db.klanten.some(k => k.id === voorziening.klant_id)) {
    throw new Error(`addVoorziening: klant_id "${voorziening.klant_id}" niet gevonden`);
  }
  const existingIds = db.voorzieningen.map(v => v.id);
  const baseSlug = slugify(voorziening.naam || 'voorziening');
  const id = uniqueSlug(baseSlug, existingIds);
  return {
    ...db,
    voorzieningen: [
      ...db.voorzieningen,
      { ...voorziening, id, aangemaakt: today() }
    ]
  };
}

export function updateVoorziening(db, id, patch) {
  const idx = db.voorzieningen.findIndex(v => v.id === id);
  if (idx === -1) {
    throw new Error(`updateVoorziening: id "${id}" niet gevonden`);
  }
  const orig = db.voorzieningen[idx];
  const updated = { ...orig, ...patch, id: orig.id, klant_id: orig.klant_id, aangemaakt: orig.aangemaakt };
  return {
    ...db,
    voorzieningen: db.voorzieningen.map((v, i) => i === idx ? updated : v)
  };
}

export function deleteVoorziening(db, id) {
  return {
    ...db,
    voorzieningen: db.voorzieningen.filter(v => v.id !== id)
  };
}

export function getVoorzieningenVoor(db, klantId) {
  return db.voorzieningen.filter(v => v.klant_id === klantId);
}

export function exportDb(db) {
  return JSON.stringify(db, null, 2);
}

export function importDb(currentDb, json, mode) {
  if (mode !== 'vervang' && mode !== 'samenvoegen') {
    throw new Error(`importDb: onbekende mode "${mode}" — gebruik "vervang" of "samenvoegen"`);
  }
  let imported;
  try {
    imported = JSON.parse(json);
  } catch (e) {
    throw new Error('importDb: bestand bevat geen geldige JSON');
  }
  if (imported.versie !== CURRENT_VERSION) {
    throw new Error(`importDb: versie-mismatch (verwacht ${CURRENT_VERSION}, kreeg ${imported.versie})`);
  }
  if (!Array.isArray(imported.klanten) || !Array.isArray(imported.voorzieningen)) {
    throw new Error('importDb: bestand mist klanten- of voorzieningen-array');
  }
  if (mode === 'vervang') {
    return {
      versie: CURRENT_VERSION,
      klanten: imported.klanten || [],
      voorzieningen: imported.voorzieningen || []
    };
  }
  // mode === 'samenvoegen' — bestaande items winnen bij id-collision
  const existingKlantIds = new Set(currentDb.klanten.map(k => k.id));
  const mergedKlanten = [
    ...currentDb.klanten,
    ...imported.klanten.filter(k => !existingKlantIds.has(k.id))
  ];
  const existingVoorzieningIds = new Set(currentDb.voorzieningen.map(v => v.id));
  const mergedVoorzieningen = [
    ...currentDb.voorzieningen,
    ...imported.voorzieningen.filter(v => !existingVoorzieningIds.has(v.id))
  ];
  return {
    versie: CURRENT_VERSION,
    klanten: mergedKlanten,
    voorzieningen: mergedVoorzieningen
  };
}
