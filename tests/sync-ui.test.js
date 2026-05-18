import { describe, it, expect, beforeEach, vi } from 'vitest';
import { exportToFile } from '../js/sync-ui.js';
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
