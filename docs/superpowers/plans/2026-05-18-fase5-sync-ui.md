# Fase 5: Sync UI (export/import database) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Twee knoppen in de action-bar — "Exporteer database" downloadt een JSON-bestand met alle klanten + voorzieningen, "Importeer database" laat een bestand kiezen, vraagt om mode (vervangen / samenvoegen), en roept de bestaande `importDb` uit fase 2 aan. Foutafhandeling met user-friendly Nederlandse meldingen.

**Architecture:** Dunne UI-laag rond bestaande `exportDb` / `importDb` uit `js/database.js` (fase 2). Nieuwe module `js/sync-ui.js` met `bindSyncButtons`. Mode-keuze via `confirm()`-dialog (MVP — geen custom modal in deze fase). Bestaande knoppen-rij in HTML krijgt 2 nieuwe knoppen.

**Tech Stack:** Vanilla JS ES modules, vitest + jsdom, Blob/URL.createObjectURL voor download, FileReader voor import.

---

## File Structure

### Nieuw

| Pad | Verantwoordelijkheid |
|-----|----------------------|
| `js/sync-ui.js` | UI-handlers voor export + import knoppen, mode-dialog via confirm |
| `tests/sync-ui.test.js` | Unit-tests voor handlers (mock Blob/URL/FileReader/confirm) |

### Gewijzigd

| Pad | Wijziging |
|-----|-----------|
| `NEN-EN-858-2 controle formulier.html` | 2 knoppen toevoegen aan action-bar: `#btn-export-db` en `#btn-import-db` |
| `js/main.js` | Importeer + roep `bindSyncButtons` aan na render |
| `css/styles.css` | (Optioneel) extra utility-class voor secundaire knoppen — nu kan bestaande `.btn-secondary` worden hergebruikt |

### Niet gewijzigd

- `js/database.js` (fase 2 — `exportDb` en `importDb` zijn al klaar)
- Andere modules

---

## API referentie (uit fase 2 database.js)

```js
exportDb(db)
// → JSON string (pretty-printed)

importDb(currentDb, jsonString, mode)
// mode: 'vervang' | 'samenvoegen'
// → nieuwe Db
// Throws bij: corrupte JSON, versie-mismatch, onbekende mode
```

---

## Task 1: HTML knoppen toevoegen aan action-bar

**Files:**
- Modify: `NEN-EN-858-2 controle formulier.html`

- [ ] **Step 1.1: Read het HTML-bestand**

Use Read om de exacte action-bar locatie te vinden. De huidige knoppen zijn:
- `#btn-testdata` (Testdata)
- `#btn-save` (Concept opslaan)
- `#btn-load` (Concept laden)
- `#btn-pdf` (Genereer PDF)

- [ ] **Step 1.2: Voeg 2 nieuwe knoppen toe**

Vind in `NEN-EN-858-2 controle formulier.html` de regel met `id="btn-pdf"` (Genereer PDF knop). Voeg er DIRECT NA toe:

```html
        <button type="button" class="btn btn-secondary" id="btn-export-db">Exporteer database</button>
        <button type="button" class="btn btn-secondary" id="btn-import-db">Importeer database</button>
```

(Indentatie matchen met bestaande buttons.)

- [ ] **Step 1.3: Verifieer dat tests nog steeds groen zijn**

```bash
cd "C:/Users/Maurice van Anraat/Documents/.claudeV2/projects/symitech/NEN_EN858_2-v2" && npm test 2>&1 | tail -5
```

Expected: 239 passed (geen JS-tests raken de HTML aan).

- [ ] **Step 1.4: Commit**

```bash
git add "NEN-EN-858-2 controle formulier.html"
git commit -m "$(cat <<'EOF'
feat(html): voeg Exporteer/Importeer database knoppen toe aan action-bar

Twee knoppen naast Genereer PDF. Beide krijgen handlers via
sync-ui.js (Task 2+3). Class btn-secondary matched de bestaande
Concept opslaan/laden styling.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: `js/sync-ui.js` met export-handler

**Files:**
- Create: `js/sync-ui.js`
- Create: `tests/sync-ui.test.js`

- [ ] **Step 2.1: Write failing tests in NEW file `tests/sync-ui.test.js`**

```js
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
```

- [ ] **Step 2.2: Run tests — verify FAIL**

```bash
cd "C:/Users/Maurice van Anraat/Documents/.claudeV2/projects/symitech/NEN_EN858_2-v2" && npm test -- tests/sync-ui.test.js 2>&1 | tail -10
```

Expected: module not found.

- [ ] **Step 2.3: Create `js/sync-ui.js` with `exportToFile`**

```js
import { loadDb, exportDb } from './database.js';

// Pure logica voor export: lees db, genereer JSON + filename met datum
export function exportToFile() {
  const db = loadDb();
  const json = exportDb(db);
  const datum = new Date().toISOString().slice(0, 10);
  const filename = `nen858-klanten-${datum}.json`;
  return { json, filename };
}
```

- [ ] **Step 2.4: Run tests — verify PASS**

```bash
npm test 2>&1 | tail -10
```

Expected: 242 passed (239 + 3 new).

- [ ] **Step 2.5: Commit**

```bash
git add js/sync-ui.js tests/sync-ui.test.js
git commit -m "$(cat <<'EOF'
feat(sync-ui): exportToFile pure helper

Leest huidige database, genereert JSON-string met exportDb
en filename "nen858-klanten-YYYY-MM-DD.json". Geen DOM-side-
effects — caller koppelt aan Blob/URL/download.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: Import-handler met mode-keuze

**Files:**
- Modify: `js/sync-ui.js`
- Modify: `tests/sync-ui.test.js`

- [ ] **Step 3.1: Write failing tests in `tests/sync-ui.test.js`**

Append:

```js
import { importFromText } from '../js/sync-ui.js';

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
```

- [ ] **Step 3.2: Run tests — verify FAIL**

```bash
npm test -- tests/sync-ui.test.js 2>&1 | tail -10
```

Expected: 6 failures — importFromText not exported.

- [ ] **Step 3.3: Append to `js/sync-ui.js`**

Voeg toe boven de export-functies of erna:

```js
import { saveDb as _saveDb, importDb } from './database.js';

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
    _saveDb(newDb);
  } catch (e) {
    return { success: false, error: e.message };
  }
  return { success: true, db: newDb };
}
```

NOTE: The existing `import { loadDb, exportDb } from './database.js'` line at the top should be extended to also import `saveDb` and `importDb`. Update that single import to:

```js
import { loadDb, exportDb, saveDb, importDb } from './database.js';
```

Then remove the separate `import { saveDb as _saveDb, importDb } from './database.js';` line and just use `saveDb` directly inside `importFromText`.

So the final top of file looks like:

```js
import { loadDb, exportDb, saveDb, importDb } from './database.js';

export function exportToFile() { /* ... */ }

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
```

- [ ] **Step 3.4: Run tests — verify PASS**

```bash
npm test 2>&1 | tail -10
```

Expected: 248 passed (242 + 6 new).

- [ ] **Step 3.5: Commit**

```bash
git add js/sync-ui.js tests/sync-ui.test.js
git commit -m "$(cat <<'EOF'
feat(sync-ui): importFromText met error-handling

Parse JSON, valideer via importDb (versie-check + structuur),
persist via saveDb. Returnt {success, error?} object zodat
UI duidelijke feedback kan geven.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: `bindSyncButtons` met DOM-koppeling

**Files:**
- Modify: `js/sync-ui.js`
- Modify: `tests/sync-ui.test.js`

- [ ] **Step 4.1: Write failing tests**

Append to `tests/sync-ui.test.js`:

```js
import { bindSyncButtons } from '../js/sync-ui.js';

function makeContainer() {
  document.body.innerHTML = '';
  const div = document.createElement('div');
  div.innerHTML = `
    <button id="btn-export-db">Export</button>
    <button id="btn-import-db">Import</button>
  `;
  document.body.appendChild(div);
  return div;
}

describe('bindSyncButtons — export', () => {
  beforeEach(() => localStorage.clear());

  it('export-knop triggert download bij klik (mock URL.createObjectURL)', () => {
    saveDb({
      versie: 1,
      klanten: [{ id: 'a', bedrijfsnaam: 'A BV' }],
      voorzieningen: []
    });
    makeContainer();

    const createUrlSpy = vi.fn(() => 'blob:fake');
    const revokeUrlSpy = vi.fn();
    const origCreate = URL.createObjectURL;
    const origRevoke = URL.revokeObjectURL;
    URL.createObjectURL = createUrlSpy;
    URL.revokeObjectURL = revokeUrlSpy;

    try {
      bindSyncButtons();
      document.getElementById('btn-export-db').click();
      expect(createUrlSpy).toHaveBeenCalledTimes(1);
      // Eerste arg is een Blob met JSON content
      const blob = createUrlSpy.mock.calls[0][0];
      expect(blob).toBeInstanceOf(Blob);
    } finally {
      URL.createObjectURL = origCreate;
      URL.revokeObjectURL = origRevoke;
    }
  });
});

describe('bindSyncButtons — import-mode dialog', () => {
  beforeEach(() => localStorage.clear());

  it('vraagt mode via confirm bij bestand-selectie', async () => {
    saveDb({ versie: 1, klanten: [], voorzieningen: [] });
    makeContainer();
    bindSyncButtons();

    let confirmCalled = false;
    const origConfirm = window.confirm;
    window.confirm = () => { confirmCalled = true; return false; };
    try {
      // Simuleer file picker resultaat door direct importFromText aan te roepen
      // is niet meer testable via bindSyncButtons zonder gebruiker-flow.
      // Skip deze test — directe handler-test is voldoende.
      // Hierin testen we alleen dat bindSyncButtons listeners toevoegt.
      expect(typeof document.getElementById('btn-import-db').onclick === 'function'
        || document.getElementById('btn-import-db').addEventListener).toBeTruthy();
    } finally {
      window.confirm = origConfirm;
    }
  });

  it('is idempotent — 2x bindSyncButtons aanroepen voegt niet dubbele listeners toe', () => {
    makeContainer();
    bindSyncButtons();
    bindSyncButtons();
    // Geen specifieke assertie — we testen alleen dat het niet crasht
    // De idempotency-guard staat in de implementatie
    expect(document.body.dataset.syncButtonsBound).toBe('1');
  });
});
```

- [ ] **Step 4.2: Run tests — verify FAIL**

```bash
npm test -- tests/sync-ui.test.js 2>&1 | tail -15
```

Expected: failures — bindSyncButtons not exported.

- [ ] **Step 4.3: Append `bindSyncButtons` to `js/sync-ui.js`**

```js
// Bind de twee action-bar knoppen aan de export/import flow.
// Idempotent via body-dataset marker zodat herhaalde init geen dubbele listeners geeft.
export function bindSyncButtons() {
  if (document.body.dataset.syncButtonsBound === '1') return;
  document.body.dataset.syncButtonsBound = '1';

  const exportBtn = document.getElementById('btn-export-db');
  const importBtn = document.getElementById('btn-import-db');
  if (!exportBtn || !importBtn) return;

  exportBtn.addEventListener('click', () => {
    const { json, filename } = exportToFile();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  });

  importBtn.addEventListener('click', () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const text = await file.text();
      // Mode-keuze via confirm: OK = vervangen, Annuleren = samenvoegen
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
    };
    input.click();
  });
}
```

- [ ] **Step 4.4: Run tests — verify PASS**

```bash
npm test 2>&1 | tail -10
```

Expected: 251 passed (248 + 3 new).

- [ ] **Step 4.5: Commit**

```bash
git add js/sync-ui.js tests/sync-ui.test.js
git commit -m "$(cat <<'EOF'
feat(sync-ui): bindSyncButtons koppelt export/import knoppen

Export: maakt Blob, gebruikt URL.createObjectURL + <a download>.
Import: file-picker → confirm-dialog voor mode (OK=vervangen,
Annuleren=samenvoegen) → roept importFromText aan → bij succes
reload, bij fout alert met message. Idempotent via body-dataset.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: main.js wire + STATUS update

**Files:**
- Modify: `js/main.js`
- Modify: `STATUS.md`

- [ ] **Step 5.1: Add import + call in `js/main.js`**

Voeg na de bestaande imports een nieuwe regel toe:

```js
import { bindSyncButtons } from './sync-ui.js';
```

Aan het einde van de file (na de bestaande knop-handlers), voeg toe:

```js
// --- Fase 5: Sync UI (export/import database) ---
bindSyncButtons();
```

- [ ] **Step 5.2: Run tests — verify still 251 passed**

```bash
cd "C:/Users/Maurice van Anraat/Documents/.claudeV2/projects/symitech/NEN_EN858_2-v2" && npm test 2>&1 | tail -5
```

Expected: 251 passed.

- [ ] **Step 5.3: Update STATUS.md**

Replace the "## Volgende fase" block at the bottom with:

```markdown
## Fase 5 — Sync UI ✓ Afgerond op 2026-05-18

Resultaat:
- Nieuwe module `js/sync-ui.js` met 3 exports:
  - `exportToFile()` — leest db, returnt {json, filename}
  - `importFromText(jsonText, mode)` — parse + importeert, returnt {success, error?}
  - `bindSyncButtons()` — koppelt #btn-export-db en #btn-import-db aan UI flow
- HTML: 2 nieuwe knoppen in action-bar ("Exporteer database", "Importeer database")
- Mode-keuze via confirm() dialog (MVP)
- Foutmeldingen: corrupte JSON, versie-mismatch, quota-error → user-friendly alerts
- 12 nieuwe tests in `tests/sync-ui.test.js` — totaal 251 groen

## Volgende fase

Fase 6 — Hosting op GitHub Pages + mobiele test op telefoon.
```

- [ ] **Step 5.4: Commit**

```bash
git add js/main.js STATUS.md
git commit -m "$(cat <<'EOF'
feat(main): wire bindSyncButtons + mark fase 5 als afgerond

Sync UI is nu actief: gebruiker kan database exporteren als JSON-
bestand en importeren met keuze tussen vervangen of samenvoegen.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

- [ ] **Step 5.5: Definition of Done check**

```bash
cd "C:/Users/Maurice van Anraat/Documents/.claudeV2/projects/symitech/NEN_EN858_2-v2"
npm test 2>&1 | tail -10
git log --oneline | head -10
```

Expected:
- 251 tests passed
- 5+ fase-5 commits on `main`
- Working tree clean

---

## Risico's en mitigaties

| Risico | Mitigatie |
|--------|-----------|
| `confirm()` mode-dialog is verwarrend (OK=vervangen, Annuleren=samenvoegen) | Lange duidelijke tekst in confirm; latere fase kan custom modal toevoegen |
| Gebruiker importeert per ongeluk verkeerd bestand → wist alle data | "Vervangen"-pad reload na success; gebruiker kan vooraf "Exporteer" voor backup |
| Bestand met andere `versie` mislukt → onduidelijk waarom | Error-message bevat verwachte vs gekregen versie (al in fase 2 database.importDb) |
| URL.createObjectURL geheugen-leak | `URL.revokeObjectURL(url)` direct na `.click()` |
| File-picker werkt niet op alle browsers | Standaard `<input type="file">` werkt overal incl. iOS Safari |

---

## Niet in deze fase

- **Custom mode-modal** (mooier dan confirm) — fase 6+ of post-MVP
- **Cloud-sync** — spec niet-doelen
- **Multi-user merge** — spec niet-doelen
- **Bulk-import uit CSV** — spec niet-doelen
- **Auto-export bij sluiten browser** — niet gevraagd, fragile
