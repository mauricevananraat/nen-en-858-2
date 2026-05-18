import { describe, it, expect, beforeEach } from 'vitest';
import { loadDb, saveDb, STORAGE_KEY, CURRENT_VERSION } from '../js/database.js';
import { slugify, uniqueSlug } from '../js/database.js';

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
});

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

import { addKlant, updateKlant, deleteKlant } from '../js/database.js';
import { addVoorziening, updateVoorziening, deleteVoorziening, getVoorzieningenVoor } from '../js/database.js';

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
    expect(a.bedrijfsnaam).toBe('A-bestaand');
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
