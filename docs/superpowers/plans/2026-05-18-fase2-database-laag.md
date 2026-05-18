# Fase 2: Database-laag (klanten + voorzieningen) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Pure data-laag in `js/database.js` met CRUD-operaties voor klanten en voorzieningen, localStorage-persist met versionering, slug-id-generatie, cascade-delete, en export/import — alles TDD-gedreven met ≥25 unit tests.

**Architecture:** Pure functions die een immutable database-object accepteren en een nieuw object retourneren. Side-effect functies (`loadDb` / `saveDb`) wrappen localStorage. Geen UI in deze fase — dat is fase 3+4.

**Tech Stack:** Vanilla JS ES modules, vitest + jsdom, localStorage (synchroon).

---

## File Structure

### Te creëren

| Pad | Doel |
|-----|------|
| `js/database.js` | Pure CRUD-functies + localStorage wrapper |
| `tests/database.test.js` | ≥25 unit tests TDD |

### Niet gewijzigd in deze fase

- Geen wijziging in `main.js`, `form-render.js`, of welk ander bestand dan ook
- UI-koppeling komt in fase 3 (klanten-modal) en fase 4 (voorzieningen-modal)

---

## Datamodel — referentie (uit spec sectie 5)

**localStorage key:** `nen858-database`

```js
{
  versie: 1,
  klanten: [
    {
      id: "uniper-leiden",
      bedrijfsnaam: "Uniper Leiden",
      adres: "Industrieweg 1",
      postcode_plaats: "2316 EX Leiden",
      contactpersoon: "J. Smit",
      opdrachtgever_zelfde_als_locatie: true,
      opdrachtgever_bedrijfsnaam: "",
      opdrachtgever_adres: "",
      opdrachtgever_postcode_plaats: "",
      opdrachtgever_contactpersoon: "",
      opdrachtgever_telefoon: "071-1234567",
      aangemaakt: "2026-05-18"
    }
  ],
  voorzieningen: [
    {
      id: "unip0504",
      klant_id: "uniper-leiden",
      naam: "UNIP0504 OOA03 trafo",
      merk: "ACO",
      type_bouwjaar: "NSF-100 / 2018",
      ns_klasse: "I",
      ns_ls: "15",
      capaciteit_l: "1000",
      mat_afdekking: "Beton",
      inhoud_slibv_l: "700",
      mat_opbouw: "PE",
      inlaat_mm: "160",
      uitlaat_mm: "160",
      type_lozing: "Vrij verval riool",
      lozingsvergunning_kenmerk: "WSL-2024-1287",
      aangemaakt: "2026-05-18"
    }
  ]
}
```

---

## Function-signatures — referentie

```js
// localStorage I/O
export function loadDb()                                 // → Db
export function saveDb(db)                               // → void (throws on quota)

// Slug helpers
export function slugify(text)                            // → string
export function uniqueSlug(base, existingIds)            // → string

// CRUD klanten
export function addKlant(db, klant)                      // → new Db
export function updateKlant(db, id, patch)               // → new Db
export function deleteKlant(db, id)                      // → new Db (incl. cascade)

// CRUD voorzieningen
export function addVoorziening(db, voorziening)          // → new Db
export function updateVoorziening(db, id, patch)         // → new Db
export function deleteVoorziening(db, id)                // → new Db

// Query
export function getVoorzieningenVoor(db, klantId)        // → Voorziening[]

// Sync
export function exportDb(db)                             // → JSON string
export function importDb(currentDb, json, mode)          // → new Db ('vervang' | 'samenvoegen')

// Internal constant
export const STORAGE_KEY = 'nen858-database'
export const CURRENT_VERSION = 1
```

---

## Task 1: Bootstrap `js/database.js` + `loadDb` / `saveDb`

**Files:**
- Create: `js/database.js`
- Create: `tests/database.test.js`

- [ ] **Step 1.1: Write failing test for loadDb (empty state)**

Append to `tests/database.test.js`:

```js
import { describe, it, expect, beforeEach } from 'vitest';
import { loadDb, saveDb, STORAGE_KEY, CURRENT_VERSION } from '../js/database.js';

describe('loadDb / saveDb', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returnt lege default-db als localStorage leeg is', () => {
    const db = loadDb();
    expect(db).toEqual({
      versie: CURRENT_VERSION,
      klanten: [],
      voorzieningen: []
    });
  });

  it('STORAGE_KEY is "nen858-database"', () => {
    expect(STORAGE_KEY).toBe('nen858-database');
  });

  it('CURRENT_VERSION is 1', () => {
    expect(CURRENT_VERSION).toBe(1);
  });
});
```

- [ ] **Step 1.2: Run test — verify FAIL**

```bash
cd "C:/Users/Maurice van Anraat/Documents/.claudeV2/projects/symitech/NEN_EN858_2-v2" && npm test -- tests/database.test.js 2>&1 | tail -10
```

Expected: FAIL — module `../js/database.js` not found.

- [ ] **Step 1.3: Create minimal `js/database.js`**

```js
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
```

- [ ] **Step 1.4: Run test — verify PASS**

```bash
npm test -- tests/database.test.js 2>&1 | tail -10
```

Expected: 3 tests passed in database.test.js.

- [ ] **Step 1.5: Add round-trip test + corrupt-JSON test**

Append to the same describe block in `tests/database.test.js`:

```js
  it('saveDb + loadDb roundtrip behoudt data', () => {
    const db = {
      versie: 1,
      klanten: [{ id: 'test', bedrijfsnaam: 'Test BV' }],
      voorzieningen: []
    };
    saveDb(db);
    const restored = loadDb();
    expect(restored).toEqual(db);
  });

  it('loadDb returnt default-db als localStorage corrupt JSON bevat', () => {
    localStorage.setItem(STORAGE_KEY, '{invalid json');
    const db = loadDb();
    expect(db).toEqual({
      versie: CURRENT_VERSION,
      klanten: [],
      voorzieningen: []
    });
  });
```

- [ ] **Step 1.6: Run all tests — verify 5 in database.test.js + 134 totaal groen**

```bash
npm test 2>&1 | tail -10
```

Expected: 139 tests passed (134 + 5 new).

- [ ] **Step 1.7: Commit**

```bash
git add js/database.js tests/database.test.js
git commit -m "$(cat <<'EOF'
feat(database): bootstrap loadDb/saveDb + localStorage key

Pure I/O wrapper rond localStorage met versionering en
default-db bij lege of corrupte state. Geen CRUD nog —
dat komt in Task 3+.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: Slug-helpers `slugify` + `uniqueSlug`

**Files:**
- Modify: `js/database.js`
- Modify: `tests/database.test.js`

- [ ] **Step 2.1: Write failing tests for slugify**

Append to `tests/database.test.js`:

```js
import { slugify, uniqueSlug } from '../js/database.js';

describe('slugify', () => {
  it('zet "Uniper Leiden" om naar "uniper-leiden"', () => {
    expect(slugify('Uniper Leiden')).toBe('uniper-leiden');
  });

  it('handelt diacrieten af', () => {
    expect(slugify('Café René')).toBe('caf-ren');
  });

  it('strip leading/trailing dashes', () => {
    expect(slugify('  Hallo!  ')).toBe('hallo');
  });

  it('returnt lege string voor lege input', () => {
    expect(slugify('')).toBe('');
  });

  it('returnt lege string voor enkel speciale tekens', () => {
    expect(slugify('@#$%')).toBe('');
  });
});

describe('uniqueSlug', () => {
  it('returnt base als deze niet conflicteert', () => {
    expect(uniqueSlug('test', ['foo', 'bar'])).toBe('test');
  });

  it('voegt -2 toe bij eerste collision', () => {
    expect(uniqueSlug('test', ['test'])).toBe('test-2');
  });

  it('voegt -3 toe bij tweede collision', () => {
    expect(uniqueSlug('test', ['test', 'test-2'])).toBe('test-3');
  });
});
```

- [ ] **Step 2.2: Run tests — verify 8 new FAIL**

```bash
npm test -- tests/database.test.js 2>&1 | tail -15
```

Expected: 8 failures with "slugify is not exported" / "uniqueSlug is not exported".

- [ ] **Step 2.3: Implement slugify + uniqueSlug**

Append to `js/database.js`:

```js
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
```

- [ ] **Step 2.4: Run tests — verify PASS**

```bash
npm test -- tests/database.test.js 2>&1 | tail -10
```

Expected: 13 tests passed in database.test.js (5 + 8).

- [ ] **Step 2.5: Commit**

```bash
git add js/database.js tests/database.test.js
git commit -m "$(cat <<'EOF'
feat(database): slugify + uniqueSlug helpers

slugify zet vrije tekst om naar URL-safe id (lowercase,
hyphens). uniqueSlug auto-suffixed -2, -3 bij collision.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: CRUD klanten — `addKlant`, `updateKlant`, `deleteKlant`

**Files:**
- Modify: `js/database.js`
- Modify: `tests/database.test.js`

- [ ] **Step 3.1: Write failing tests voor addKlant**

Append to `tests/database.test.js`:

```js
import { addKlant, updateKlant, deleteKlant } from '../js/database.js';

describe('addKlant', () => {
  it('voegt klant toe met auto-gegenereerde id (slug)', () => {
    const db = { versie: 1, klanten: [], voorzieningen: [] };
    const newDb = addKlant(db, {
      bedrijfsnaam: 'Uniper Leiden',
      adres: 'Industrieweg 1',
      postcode_plaats: '2316 EX Leiden',
      contactpersoon: 'J. Smit'
    });
    expect(newDb.klanten).toHaveLength(1);
    expect(newDb.klanten[0].id).toBe('uniper-leiden');
    expect(newDb.klanten[0].bedrijfsnaam).toBe('Uniper Leiden');
  });

  it('voegt aangemaakt-datum toe (ISO YYYY-MM-DD)', () => {
    const db = { versie: 1, klanten: [], voorzieningen: [] };
    const newDb = addKlant(db, { bedrijfsnaam: 'Test BV' });
    expect(newDb.klanten[0].aangemaakt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('muteert input-db niet (immutability)', () => {
    const db = { versie: 1, klanten: [], voorzieningen: [] };
    addKlant(db, { bedrijfsnaam: 'X' });
    expect(db.klanten).toHaveLength(0);
  });

  it('genereert unieke id bij collision', () => {
    const db = {
      versie: 1,
      klanten: [{ id: 'test-bv', bedrijfsnaam: 'Test BV' }],
      voorzieningen: []
    };
    const newDb = addKlant(db, { bedrijfsnaam: 'Test BV' });
    expect(newDb.klanten[1].id).toBe('test-bv-2');
  });
});

describe('updateKlant', () => {
  it('updatet velden behalve id en aangemaakt', () => {
    const db = {
      versie: 1,
      klanten: [{ id: 'test', bedrijfsnaam: 'Oud', aangemaakt: '2026-01-01' }],
      voorzieningen: []
    };
    const newDb = updateKlant(db, 'test', { bedrijfsnaam: 'Nieuw' });
    expect(newDb.klanten[0].bedrijfsnaam).toBe('Nieuw');
    expect(newDb.klanten[0].id).toBe('test');
    expect(newDb.klanten[0].aangemaakt).toBe('2026-01-01');
  });

  it('throws als id niet bestaat', () => {
    const db = { versie: 1, klanten: [], voorzieningen: [] };
    expect(() => updateKlant(db, 'onbekend', { bedrijfsnaam: 'X' })).toThrow();
  });
});

describe('deleteKlant', () => {
  it('verwijdert klant zonder voorzieningen', () => {
    const db = {
      versie: 1,
      klanten: [
        { id: 'a', bedrijfsnaam: 'A' },
        { id: 'b', bedrijfsnaam: 'B' }
      ],
      voorzieningen: []
    };
    const newDb = deleteKlant(db, 'a');
    expect(newDb.klanten).toHaveLength(1);
    expect(newDb.klanten[0].id).toBe('b');
  });

  it('is no-op bij onbekende id', () => {
    const db = {
      versie: 1,
      klanten: [{ id: 'a' }],
      voorzieningen: []
    };
    const newDb = deleteKlant(db, 'onbekend');
    expect(newDb.klanten).toHaveLength(1);
  });
});
```

- [ ] **Step 3.2: Run tests — verify 8 new FAIL**

```bash
npm test -- tests/database.test.js 2>&1 | tail -10
```

Expected: 8 failures with "addKlant is not exported" etc.

- [ ] **Step 3.3: Implement CRUD klanten**

Append to `js/database.js`:

```js
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
```

- [ ] **Step 3.4: Run tests — verify PASS**

```bash
npm test -- tests/database.test.js 2>&1 | tail -10
```

Expected: 21 tests passed in database.test.js (13 + 8).

- [ ] **Step 3.5: Commit**

```bash
git add js/database.js tests/database.test.js
git commit -m "$(cat <<'EOF'
feat(database): CRUD klanten (add / update / delete)

Pure functions die nieuwe db retourneren. addKlant
auto-genereert slug-id en aangemaakt-datum. updateKlant
beschermt id + aangemaakt tegen overschrijving.
Cascade-delete naar voorzieningen volgt in Task 5.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: CRUD voorzieningen + `getVoorzieningenVoor`

**Files:**
- Modify: `js/database.js`
- Modify: `tests/database.test.js`

- [ ] **Step 4.1: Write failing tests**

Append to `tests/database.test.js`:

```js
import { addVoorziening, updateVoorziening, deleteVoorziening, getVoorzieningenVoor } from '../js/database.js';

describe('addVoorziening', () => {
  it('voegt voorziening toe met id uit naam + aangemaakt-datum', () => {
    const db = {
      versie: 1,
      klanten: [{ id: 'uniper-leiden', bedrijfsnaam: 'Uniper Leiden' }],
      voorzieningen: []
    };
    const newDb = addVoorziening(db, {
      klant_id: 'uniper-leiden',
      naam: 'UNIP0504 OOA03 trafo',
      merk: 'ACO'
    });
    expect(newDb.voorzieningen).toHaveLength(1);
    expect(newDb.voorzieningen[0].id).toBe('unip0504-ooa03-trafo');
    expect(newDb.voorzieningen[0].klant_id).toBe('uniper-leiden');
    expect(newDb.voorzieningen[0].aangemaakt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('throws als klant_id niet bestaat', () => {
    const db = { versie: 1, klanten: [], voorzieningen: [] };
    expect(() => addVoorziening(db, { klant_id: 'fantoom', naam: 'X' })).toThrow();
  });

  it('genereert unieke id bij naam-collision', () => {
    const db = {
      versie: 1,
      klanten: [{ id: 'uniper' }],
      voorzieningen: [{ id: 'trafo', klant_id: 'uniper', naam: 'Trafo' }]
    };
    const newDb = addVoorziening(db, { klant_id: 'uniper', naam: 'Trafo' });
    expect(newDb.voorzieningen[1].id).toBe('trafo-2');
  });

  it('muteert input-db niet', () => {
    const db = {
      versie: 1,
      klanten: [{ id: 'u' }],
      voorzieningen: []
    };
    addVoorziening(db, { klant_id: 'u', naam: 'X' });
    expect(db.voorzieningen).toHaveLength(0);
  });
});

describe('updateVoorziening', () => {
  it('updatet velden behalve id, klant_id en aangemaakt', () => {
    const db = {
      versie: 1,
      klanten: [{ id: 'u' }],
      voorzieningen: [{
        id: 'v1',
        klant_id: 'u',
        naam: 'Oud',
        merk: 'A',
        aangemaakt: '2026-01-01'
      }]
    };
    const newDb = updateVoorziening(db, 'v1', { naam: 'Nieuw', merk: 'B', klant_id: 'anders' });
    expect(newDb.voorzieningen[0].naam).toBe('Nieuw');
    expect(newDb.voorzieningen[0].merk).toBe('B');
    expect(newDb.voorzieningen[0].id).toBe('v1');
    expect(newDb.voorzieningen[0].klant_id).toBe('u');
    expect(newDb.voorzieningen[0].aangemaakt).toBe('2026-01-01');
  });

  it('throws als id niet bestaat', () => {
    const db = { versie: 1, klanten: [], voorzieningen: [] };
    expect(() => updateVoorziening(db, 'fantoom', { naam: 'X' })).toThrow();
  });
});

describe('deleteVoorziening', () => {
  it('verwijdert voorziening', () => {
    const db = {
      versie: 1,
      klanten: [{ id: 'u' }],
      voorzieningen: [
        { id: 'a', klant_id: 'u', naam: 'A' },
        { id: 'b', klant_id: 'u', naam: 'B' }
      ]
    };
    const newDb = deleteVoorziening(db, 'a');
    expect(newDb.voorzieningen).toHaveLength(1);
    expect(newDb.voorzieningen[0].id).toBe('b');
  });
});

describe('getVoorzieningenVoor', () => {
  it('returnt alleen voorzieningen van gegeven klant_id', () => {
    const db = {
      versie: 1,
      klanten: [{ id: 'a' }, { id: 'b' }],
      voorzieningen: [
        { id: 'v1', klant_id: 'a' },
        { id: 'v2', klant_id: 'b' },
        { id: 'v3', klant_id: 'a' }
      ]
    };
    const v = getVoorzieningenVoor(db, 'a');
    expect(v).toHaveLength(2);
    expect(v.map(x => x.id)).toEqual(['v1', 'v3']);
  });

  it('returnt lege array bij onbekende klant_id', () => {
    const db = { versie: 1, klanten: [], voorzieningen: [] };
    expect(getVoorzieningenVoor(db, 'onbekend')).toEqual([]);
  });
});
```

- [ ] **Step 4.2: Run tests — verify FAIL**

```bash
npm test -- tests/database.test.js 2>&1 | tail -15
```

Expected: 9 new failures.

- [ ] **Step 4.3: Implement CRUD voorzieningen**

Append to `js/database.js`:

```js
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
```

- [ ] **Step 4.4: Run tests — verify PASS**

```bash
npm test -- tests/database.test.js 2>&1 | tail -10
```

Expected: 30 tests passed in database.test.js (21 + 9).

- [ ] **Step 4.5: Commit**

```bash
git add js/database.js tests/database.test.js
git commit -m "$(cat <<'EOF'
feat(database): CRUD voorzieningen + getVoorzieningenVoor filter

addVoorziening valideert klant_id existence en gebruikt slug
op naam-veld. updateVoorziening beschermt id/klant_id/aangemaakt.
getVoorzieningenVoor filtert op klant_id (gebruikt door UI in fase 4).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: Cascade-delete bij `deleteKlant`

**Files:**
- Modify: `js/database.js`
- Modify: `tests/database.test.js`

- [ ] **Step 5.1: Write failing cascade-delete test**

Append to `tests/database.test.js`:

```js
describe('deleteKlant — cascade', () => {
  it('verwijdert ook alle voorzieningen van die klant', () => {
    const db = {
      versie: 1,
      klanten: [
        { id: 'uniper', bedrijfsnaam: 'Uniper' },
        { id: 'garage', bedrijfsnaam: 'Garage' }
      ],
      voorzieningen: [
        { id: 'u1', klant_id: 'uniper', naam: 'U1' },
        { id: 'u2', klant_id: 'uniper', naam: 'U2' },
        { id: 'g1', klant_id: 'garage', naam: 'G1' }
      ]
    };
    const newDb = deleteKlant(db, 'uniper');
    expect(newDb.klanten).toHaveLength(1);
    expect(newDb.klanten[0].id).toBe('garage');
    expect(newDb.voorzieningen).toHaveLength(1);
    expect(newDb.voorzieningen[0].id).toBe('g1');
  });

  it('laat voorzieningen ongemoeid bij onbekende klant-id', () => {
    const db = {
      versie: 1,
      klanten: [{ id: 'a' }],
      voorzieningen: [{ id: 'v1', klant_id: 'a' }]
    };
    const newDb = deleteKlant(db, 'onbekend');
    expect(newDb.voorzieningen).toHaveLength(1);
  });
});
```

- [ ] **Step 5.2: Run tests — verify cascade-test FAIL**

```bash
npm test -- tests/database.test.js 2>&1 | tail -10
```

Expected: 1 failure in cascade-test (huidige deleteKlant verwijdert geen voorzieningen).

- [ ] **Step 5.3: Update deleteKlant met cascade**

Replace existing `deleteKlant` in `js/database.js` with:

```js
export function deleteKlant(db, id) {
  return {
    ...db,
    klanten: db.klanten.filter(k => k.id !== id),
    voorzieningen: db.voorzieningen.filter(v => v.klant_id !== id)
  };
}
```

- [ ] **Step 5.4: Run tests — verify PASS**

```bash
npm test -- tests/database.test.js 2>&1 | tail -10
```

Expected: 32 tests passed (30 + 2 cascade-tests).

- [ ] **Step 5.5: Commit**

```bash
git add js/database.js tests/database.test.js
git commit -m "$(cat <<'EOF'
feat(database): cascade-delete bij deleteKlant

Bij verwijderen van een klant worden automatisch alle
gekoppelde voorzieningen verwijderd. Spec sectie 8:
foutafhandeling vereist bevestigingsdialoog in UI-fase.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 6: Export / Import — `exportDb` + `importDb`

**Files:**
- Modify: `js/database.js`
- Modify: `tests/database.test.js`

- [ ] **Step 6.1: Write failing tests**

Append to `tests/database.test.js`:

```js
import { exportDb, importDb } from '../js/database.js';

describe('exportDb', () => {
  it('returnt JSON-string met volledig db-object', () => {
    const db = {
      versie: 1,
      klanten: [{ id: 'a', bedrijfsnaam: 'A' }],
      voorzieningen: []
    };
    const json = exportDb(db);
    expect(typeof json).toBe('string');
    const parsed = JSON.parse(json);
    expect(parsed).toEqual(db);
  });
});

describe('importDb — mode "vervang"', () => {
  it('vervangt bestaande database compleet', () => {
    const current = {
      versie: 1,
      klanten: [{ id: 'oud' }],
      voorzieningen: [{ id: 'v1', klant_id: 'oud' }]
    };
    const imported = JSON.stringify({
      versie: 1,
      klanten: [{ id: 'nieuw', bedrijfsnaam: 'Nieuw' }],
      voorzieningen: []
    });
    const newDb = importDb(current, imported, 'vervang');
    expect(newDb.klanten).toHaveLength(1);
    expect(newDb.klanten[0].id).toBe('nieuw');
    expect(newDb.voorzieningen).toHaveLength(0);
  });
});

describe('importDb — mode "samenvoegen"', () => {
  it('voegt nieuwe klanten toe, bestaande (zelfde id) blijven behouden', () => {
    const current = {
      versie: 1,
      klanten: [{ id: 'a', bedrijfsnaam: 'A-bestaand' }],
      voorzieningen: []
    };
    const imported = JSON.stringify({
      versie: 1,
      klanten: [
        { id: 'a', bedrijfsnaam: 'A-geimporteerd' },
        { id: 'b', bedrijfsnaam: 'B-nieuw' }
      ],
      voorzieningen: []
    });
    const newDb = importDb(current, imported, 'samenvoegen');
    expect(newDb.klanten).toHaveLength(2);
    const a = newDb.klanten.find(k => k.id === 'a');
    expect(a.bedrijfsnaam).toBe('A-bestaand');  // bestaande wint
    const b = newDb.klanten.find(k => k.id === 'b');
    expect(b.bedrijfsnaam).toBe('B-nieuw');
  });

  it('voegt voorzieningen op dezelfde manier samen', () => {
    const current = {
      versie: 1,
      klanten: [{ id: 'k' }],
      voorzieningen: [{ id: 'v1', klant_id: 'k', naam: 'V1-bestaand' }]
    };
    const imported = JSON.stringify({
      versie: 1,
      klanten: [{ id: 'k' }],
      voorzieningen: [
        { id: 'v1', klant_id: 'k', naam: 'V1-geimporteerd' },
        { id: 'v2', klant_id: 'k', naam: 'V2-nieuw' }
      ]
    });
    const newDb = importDb(current, imported, 'samenvoegen');
    expect(newDb.voorzieningen).toHaveLength(2);
    expect(newDb.voorzieningen.find(v => v.id === 'v1').naam).toBe('V1-bestaand');
    expect(newDb.voorzieningen.find(v => v.id === 'v2').naam).toBe('V2-nieuw');
  });
});

describe('importDb — error handling', () => {
  it('throws bij corrupte JSON', () => {
    const current = { versie: 1, klanten: [], voorzieningen: [] };
    expect(() => importDb(current, '{invalid', 'vervang')).toThrow();
  });

  it('throws bij versie-mismatch', () => {
    const current = { versie: 1, klanten: [], voorzieningen: [] };
    const imported = JSON.stringify({ versie: 999, klanten: [], voorzieningen: [] });
    expect(() => importDb(current, imported, 'vervang')).toThrow(/versie/i);
  });

  it('throws bij onbekende mode', () => {
    const current = { versie: 1, klanten: [], voorzieningen: [] };
    const imported = JSON.stringify(current);
    expect(() => importDb(current, imported, 'fantasie')).toThrow(/mode/i);
  });
});
```

- [ ] **Step 6.2: Run tests — verify FAIL**

```bash
npm test -- tests/database.test.js 2>&1 | tail -15
```

Expected: 7 new failures.

- [ ] **Step 6.3: Implement exportDb + importDb**

Append to `js/database.js`:

```js
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
    ...(imported.klanten || []).filter(k => !existingKlantIds.has(k.id))
  ];
  const existingVoorzieningIds = new Set(currentDb.voorzieningen.map(v => v.id));
  const mergedVoorzieningen = [
    ...currentDb.voorzieningen,
    ...(imported.voorzieningen || []).filter(v => !existingVoorzieningIds.has(v.id))
  ];
  return {
    versie: CURRENT_VERSION,
    klanten: mergedKlanten,
    voorzieningen: mergedVoorzieningen
  };
}
```

- [ ] **Step 6.4: Run tests — verify PASS**

```bash
npm test -- tests/database.test.js 2>&1 | tail -10
```

Expected: 39 tests passed (32 + 7).

- [ ] **Step 6.5: Commit**

```bash
git add js/database.js tests/database.test.js
git commit -m "$(cat <<'EOF'
feat(database): exportDb + importDb met vervang/samenvoegen modes

Pretty-printed JSON-export. Import valideert JSON-syntaxis en
versie-veld. Samenvoegen: bestaande items winnen bij id-collision
(spec sectie 7). Errors voor: ongeldig JSON, versie-mismatch,
onbekende mode.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 7: Quota-error handling bij `saveDb`

**Files:**
- Modify: `js/database.js`
- Modify: `tests/database.test.js`

- [ ] **Step 7.1: Write failing test voor QuotaExceededError**

Append to `tests/database.test.js`:

```js
describe('saveDb — quota handling', () => {
  it('throws een herkenbare QuotaError bij localStorage QuotaExceededError', () => {
    const db = { versie: 1, klanten: [], voorzieningen: [] };
    // Mock localStorage.setItem om QuotaExceededError te gooien
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = () => {
      const err = new DOMException('Quota exceeded', 'QuotaExceededError');
      throw err;
    };
    try {
      expect(() => saveDb(db)).toThrow(/quota|database is vol/i);
    } finally {
      Storage.prototype.setItem = original;
    }
  });
});
```

- [ ] **Step 7.2: Run tests — verify FAIL**

```bash
npm test -- tests/database.test.js 2>&1 | tail -10
```

Expected: 1 failure — huidige saveDb gooit de raw DOMException door.

- [ ] **Step 7.3: Wrap saveDb met user-friendly error**

Replace existing `saveDb` in `js/database.js` with:

```js
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
```

- [ ] **Step 7.4: Run tests — verify PASS**

```bash
npm test -- tests/database.test.js 2>&1 | tail -10
```

Expected: 40 tests passed (39 + 1).

- [ ] **Step 7.5: Run all tests — verify alles groen**

```bash
npm test 2>&1 | tail -10
```

Expected: 174 tests passed (134 baseline + 40 new in database.test.js).

- [ ] **Step 7.6: Commit**

```bash
git add js/database.js tests/database.test.js
git commit -m "$(cat <<'EOF'
feat(database): user-friendly error bij localStorage quota

saveDb vangt QuotaExceededError en gooit een Nederlandse melding
met actie-suggestie. Alle 40 database-tests groen + 134 bestaande.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 8: STATUS.md update + fase-afsluiting

**Files:**
- Modify: `STATUS.md`

- [ ] **Step 8.1: Update STATUS.md met fase 2-afronding**

Overwrite `STATUS.md` with:

```markdown
# v2 Status

**Versie:** 0.2.0
**Datum start:** 2026-05-18

## Fase 1 — v2 opzetten ✓ Afgerond op 2026-05-18

Resultaat:
- v1-broncode succesvol gekopieerd naar v2-map
- package.json: name `nen-en-858-2-controle-formulier-v2`, version `0.2.0`
- Dev-server draait op http://localhost:8766
- Alle 129 v1-tests groen in v2-context
- Git-repo geïnitialiseerd op branch `main` met initial commit

## Fase 2 — Database-laag ✓ Afgerond op 2026-05-18

Resultaat:
- Nieuwe module `js/database.js` met 13 exports (CRUD + helpers + sync)
- Pure-function design: immutable db-object in, nieuwe out
- localStorage-persist met versionering (key `nen858-database`, versie 1)
- Slug-generatie + auto-suffix bij id-collision
- Cascade-delete bij verwijderen klant (voorzieningen mee)
- Export/import JSON met `vervang` en `samenvoegen` modes
- User-friendly error bij quota-overschrijding
- 40 nieuwe unit tests in `tests/database.test.js` — totaal 174 groen

## Volgende fase

Fase 3 — UI Klantenbeheer (dropdown + modal in sectie 1). Zie spec sectie 6.
```

- [ ] **Step 8.2: Commit STATUS**

```bash
git add STATUS.md
git commit -m "$(cat <<'EOF'
docs: mark fase 2 als afgerond in STATUS.md

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

- [ ] **Step 8.3: Definition of Done check**

Verify:

```bash
cd "C:/Users/Maurice van Anraat/Documents/.claudeV2/projects/symitech/NEN_EN858_2-v2"
npm test 2>&1 | tail -10
git log --oneline | head -10
```

Expected:
- 174 tests passed (5 test files)
- 8+ commits on `main` (initial + photo-fix + 7 fase-2 commits + STATUS)
- working tree clean

---

## Risico's en mitigaties

| Risico | Mitigatie in plan |
|--------|-------------------|
| Mutatie-bugs (db gewijzigd door functie) | Expliciete immutability-test in Task 3 + 4 (`expect(db.klanten).toHaveLength(0)`) |
| Slug-collision niet gedetecteerd | Task 2 + Task 3 test met bestaande id |
| Import-versie-mismatch crasht stilletjes | Task 6 test voor versie-mismatch + duidelijke error |
| Quota-error blokkeert UI | Task 7 user-friendly Nederlandse error met actie |
| Cascade vergeten bij deleteKlant | Task 5 dedicated cascade-test |

---

## Niet in deze fase

- **UI** — dropdown, modal, knoppen → fase 3 + 4
- **Foto's per klant** — out of scope (zie spec niet-doelen)
- **Audit-log** — wie wijzigde wat → spec niet-doelen
- **Cloud-sync** → spec niet-doelen
- **Bulk-import uit CSV** → spec niet-doelen
