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
