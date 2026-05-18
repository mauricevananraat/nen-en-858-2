import { describe, it, expect, beforeEach, vi } from 'vitest';
import { exportToFile, importFromText } from '../js/sync-ui.js';
import { saveDb } from '../js/database.js';

describe('exportToFile', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('genereert filename met YYYY-MM-DD datum', () => {
    saveDb({ versie: 1, klanten: [], voorzieningen: [] });
    const result = exportToFile();
    expect(result.filename).toMatch(/^nen858-klanten-\d{4}-\d{2}-\d{2}\.json$/);
  });

  it('returnt JSON-string van huidige db', () => {
    saveDb({
      versie: 1,
      klanten: [{ id: 'a', bedrijfsnaam: 'A BV' }],
      voorzieningen: []
    });
    const result = exportToFile();
    const parsed = JSON.parse(result.json);
    expect(parsed.klanten).toHaveLength(1);
    expect(parsed.klanten[0].bedrijfsnaam).toBe('A BV');
  });

  it('returnt object met json + filename', () => {
    saveDb({ versie: 1, klanten: [], voorzieningen: [] });
    const result = exportToFile();
    expect(result).toHaveProperty('json');
    expect(result).toHaveProperty('filename');
    expect(typeof result.json).toBe('string');
    expect(typeof result.filename).toBe('string');
  });
});

describe('importFromText — mode vervang', () => {
  beforeEach(() => localStorage.clear());

  it('vervangt database wanneer mode = vervang', () => {
    saveDb({
      versie: 1,
      klanten: [{ id: 'oud', bedrijfsnaam: 'Oud BV' }],
      voorzieningen: []
    });
    const imported = JSON.stringify({
      versie: 1,
      klanten: [{ id: 'nieuw', bedrijfsnaam: 'Nieuw BV' }],
      voorzieningen: []
    });
    const result = importFromText(imported, 'vervang');
    expect(result.success).toBe(true);
    const stored = JSON.parse(localStorage.getItem('nen858-database'));
    expect(stored.klanten).toHaveLength(1);
    expect(stored.klanten[0].id).toBe('nieuw');
  });
});

describe('importFromText — mode samenvoegen', () => {
  beforeEach(() => localStorage.clear());

  it('voegt nieuwe klanten toe, behoudt bestaande', () => {
    saveDb({
      versie: 1,
      klanten: [{ id: 'a', bedrijfsnaam: 'A-bestaand' }],
      voorzieningen: []
    });
    const imported = JSON.stringify({
      versie: 1,
      klanten: [
        { id: 'a', bedrijfsnaam: 'A-import' },
        { id: 'b', bedrijfsnaam: 'B-nieuw' }
      ],
      voorzieningen: []
    });
    const result = importFromText(imported, 'samenvoegen');
    expect(result.success).toBe(true);
    const stored = JSON.parse(localStorage.getItem('nen858-database'));
    expect(stored.klanten).toHaveLength(2);
    expect(stored.klanten.find(k => k.id === 'a').bedrijfsnaam).toBe('A-bestaand');
  });
});

describe('importFromText — error handling', () => {
  beforeEach(() => localStorage.clear());

  it('returnt success=false + error-message bij corrupte JSON', () => {
    const result = importFromText('{invalid', 'vervang');
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/JSON/i);
  });

  it('returnt success=false + error bij versie-mismatch', () => {
    const imported = JSON.stringify({ versie: 999, klanten: [], voorzieningen: [] });
    const result = importFromText(imported, 'vervang');
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/versie/i);
  });

  it('returnt success=false bij saveDb-fout (mock localStorage quota)', () => {
    const imported = JSON.stringify({ versie: 1, klanten: [], voorzieningen: [] });
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = () => { throw new Error('Database is vol.'); };
    try {
      const result = importFromText(imported, 'vervang');
      expect(result.success).toBe(false);
      expect(result.error).toMatch(/vol/i);
    } finally {
      Storage.prototype.setItem = original;
    }
  });
});
