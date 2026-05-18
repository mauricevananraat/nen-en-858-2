# Fase 4: UI Voorzieningenbeheer — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Voorziening-dropdown enable + filter op gekozen klant, + Nieuw / ✎ Bewerken / 🗑 Verwijderen knoppen, voorziening-modal met 12 installatie-velden. Bij keuze: auto-fill `state.installatie.*`.

**Architecture:** Volgt fase 3-patroon: nieuwe `voorziening-modal.js` (singleton zoals klant-modal) + uitbreiding van `dropdown-binding.js` met `refreshVoorzieningDropdown` / `bindVoorzieningDropdown` / `applyVoorzieningToState`. Klant-dropdown krijgt extra `onKlantChange` callback waarop voorziening-dropdown ververst.

**Tech Stack:** Vanilla JS ES modules, vitest + jsdom, hergebruik fase 2 + 3 modules.

---

## File Structure

### Nieuw

| Pad | Verantwoordelijkheid |
|-----|----------------------|
| `js/voorziening-modal.js` | Modal HTML + init/openNew/openEdit/save (analoog aan klant-modal.js) |
| `tests/voorziening-modal.test.js` | DOM-tests voor modal |

### Gewijzigd

| Pad | Wijziging |
|-----|-----------|
| `js/dropdown-binding.js` | + `applyVoorzieningToState`, `refreshVoorzieningDropdown`, `bindVoorzieningDropdown`; `bindKlantDropdown` krijgt 4e parameter `onKlantChange` (optional, backward-compatible) |
| `js/main.js` | Wire voorziening-modal + voorziening-dropdown + onKlantChange callback |
| `tests/dropdown-binding.test.js` | Tests voor voorziening-helpers + voorziening-dropdown DOM-binding |

### Niet gewijzigd

- `js/database.js` (fase 2 — addVoorziening etc. al aanwezig)
- `js/modal.js` (fase 3 — generieke open/close al aanwezig)
- `js/klant-modal.js` (fase 3 — singleton pattern wordt gekopieerd, niet aangepast)
- `js/form-render.js` (entity-picker HTML al rendered in fase 3 met disabled voorziening-knoppen — die worden in main.js geactiveerd)
- v1-map (`NEN_EN858_2/`)

---

## State-mapping referentie

Bij voorziening-keuze via dropdown wordt deze mapping toegepast (1-op-1):

| Voorziening-veld | State-pad |
|------------------|-----------|
| `merk` | `state.installatie.merk` |
| `type_bouwjaar` | `state.installatie.type_bouwjaar` |
| `ns_klasse` | `state.installatie.ns_klasse` |
| `ns_ls` | `state.installatie.ns_ls` |
| `capaciteit_l` | `state.installatie.capaciteit_l` |
| `mat_afdekking` | `state.installatie.mat_afdekking` |
| `inhoud_slibv_l` | `state.installatie.inhoud_slibv_l` |
| `mat_opbouw` | `state.installatie.mat_opbouw` |
| `inlaat_mm` | `state.installatie.inlaat_mm` |
| `uitlaat_mm` | `state.installatie.uitlaat_mm` |
| `type_lozing` | `state.installatie.type_lozing` |
| `lozingsvergunning_kenmerk` | `state.installatie.lozingsvergunning_kenmerk` |

Database-meta-velden (`id`, `klant_id`, `naam`, `aangemaakt`) worden NIET op state gezet.

---

## Task 1: Voorziening-modal HTML + init + openNew

**Files:**
- Create: `js/voorziening-modal.js`
- Create: `tests/voorziening-modal.test.js`

- [ ] **Step 1.1: Write failing tests in NEW file `tests/voorziening-modal.test.js`**

```js
import { describe, it, expect, beforeEach } from 'vitest';
import { initVoorzieningModal, openVoorzieningModalNew, _resetForTests } from '../js/voorziening-modal.js';
import { saveDb } from '../js/database.js';

describe('voorziening-modal — init + open new', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    localStorage.clear();
    _resetForTests();
  });

  it('initVoorzieningModal voegt modal aan document toe', () => {
    initVoorzieningModal();
    expect(document.getElementById('voorziening-modal')).toBeTruthy();
  });

  it('initVoorzieningModal is idempotent', () => {
    initVoorzieningModal();
    initVoorzieningModal();
    expect(document.querySelectorAll('#voorziening-modal')).toHaveLength(1);
  });

  it('openVoorzieningModalNew opent modal met titel "Nieuwe voorziening"', () => {
    saveDb({
      versie: 1,
      klanten: [{ id: 'uniper', bedrijfsnaam: 'Uniper Leiden' }],
      voorzieningen: []
    });
    initVoorzieningModal();
    openVoorzieningModalNew('uniper');
    const modal = document.getElementById('voorziening-modal');
    expect(modal.classList.contains('modal-open')).toBe(true);
    expect(modal.querySelector('.modal-title').textContent).toBe('Nieuwe voorziening');
  });

  it('openVoorzieningModalNew toont klant-bedrijfsnaam in read-only badge', () => {
    saveDb({
      versie: 1,
      klanten: [{ id: 'uniper', bedrijfsnaam: 'Uniper Leiden' }],
      voorzieningen: []
    });
    initVoorzieningModal();
    openVoorzieningModalNew('uniper');
    const badge = document.querySelector('#voorziening-modal .klant-badge');
    expect(badge).toBeTruthy();
    expect(badge.textContent).toContain('Uniper Leiden');
  });

  it('openVoorzieningModalNew reset het formulier', () => {
    saveDb({
      versie: 1,
      klanten: [{ id: 'uniper', bedrijfsnaam: 'Uniper' }],
      voorzieningen: []
    });
    initVoorzieningModal();
    openVoorzieningModalNew('uniper');
    const naam = document.querySelector('#voorziening-modal [name="naam"]');
    naam.value = 'oude waarde';
    openVoorzieningModalNew('uniper');
    expect(naam.value).toBe('');
  });

  it('heeft 12 installatie-velden + naam-veld', () => {
    saveDb({
      versie: 1,
      klanten: [{ id: 'uniper', bedrijfsnaam: 'Uniper' }],
      voorzieningen: []
    });
    initVoorzieningModal();
    openVoorzieningModalNew('uniper');
    const velden = [
      'naam', 'merk', 'type_bouwjaar', 'ns_klasse', 'ns_ls',
      'capaciteit_l', 'mat_afdekking', 'inhoud_slibv_l', 'mat_opbouw',
      'inlaat_mm', 'uitlaat_mm', 'type_lozing', 'lozingsvergunning_kenmerk'
    ];
    velden.forEach(v => {
      const el = document.querySelector(`#voorziening-modal [name="${v}"]`);
      expect(el, `veld "${v}" ontbreekt`).toBeTruthy();
    });
  });

  it('ns_klasse heeft radio I en II', () => {
    saveDb({
      versie: 1,
      klanten: [{ id: 'u', bedrijfsnaam: 'U' }],
      voorzieningen: []
    });
    initVoorzieningModal();
    openVoorzieningModalNew('u');
    expect(document.querySelector('[name="ns_klasse"][value="I"]')).toBeTruthy();
    expect(document.querySelector('[name="ns_klasse"][value="II"]')).toBeTruthy();
  });

  it('type_lozing heeft 3 radios', () => {
    saveDb({
      versie: 1,
      klanten: [{ id: 'u', bedrijfsnaam: 'U' }],
      voorzieningen: []
    });
    initVoorzieningModal();
    openVoorzieningModalNew('u');
    expect(document.querySelector('[name="type_lozing"][value="Vrij verval riool"]')).toBeTruthy();
    expect(document.querySelector('[name="type_lozing"][value="Oppervlaktewater"]')).toBeTruthy();
    expect(document.querySelector('[name="type_lozing"][value="Anders"]')).toBeTruthy();
  });
});
```

- [ ] **Step 1.2: Run tests — verify FAIL**

```bash
cd "C:/Users/Maurice van Anraat/Documents/.claudeV2/projects/symitech/NEN_EN858_2-v2" && npm test -- tests/voorziening-modal.test.js 2>&1 | tail -10
```

Expected: module not found.

- [ ] **Step 1.3: Create `js/voorziening-modal.js`**

```js
import { openModal, closeModal, bindModalClose } from './modal.js';
import { loadDb, saveDb, addVoorziening, updateVoorziening } from './database.js';

const MODAL_HTML = `
<div class="modal" id="voorziening-modal" aria-hidden="true">
  <div class="modal-backdrop"></div>
  <div class="modal-dialog">
    <header class="modal-header">
      <h2 class="modal-title">Nieuwe voorziening</h2>
      <button type="button" class="modal-close" data-modal-close aria-label="Sluiten">×</button>
    </header>
    <div class="modal-body">
      <div class="klant-badge"></div>
      <form id="voorziening-form">
        <fieldset>
          <legend>Algemeen</legend>
          <div class="field">
            <label class="field-label">Naam *</label>
            <input class="field-input" type="text" name="naam" required placeholder="bv. UNIP0504 OOA03 trafo">
          </div>
        </fieldset>
        <fieldset>
          <legend>Installatie-specs</legend>
          <div class="field">
            <label class="field-label">Merk</label>
            <input class="field-input" type="text" name="merk">
          </div>
          <div class="field">
            <label class="field-label">Type / bouwjaar</label>
            <input class="field-input" type="text" name="type_bouwjaar">
          </div>
          <div class="field">
            <label class="field-label">NS-klasse</label>
            <div class="radio-row">
              <label class="radio-opt"><input type="radio" name="ns_klasse" value="I"><span>Klasse I (≤5 mg/l)</span></label>
              <label class="radio-opt"><input type="radio" name="ns_klasse" value="II"><span>Klasse II (≤100 mg/l)</span></label>
            </div>
          </div>
          <div class="field">
            <label class="field-label">NS (l/s)</label>
            <input class="field-input" type="number" name="ns_ls">
          </div>
          <div class="field">
            <label class="field-label">Capaciteit (L)</label>
            <input class="field-input" type="number" name="capaciteit_l">
          </div>
          <div class="field">
            <label class="field-label">Materiaal afdekking</label>
            <input class="field-input" type="text" name="mat_afdekking">
          </div>
          <div class="field">
            <label class="field-label">Inhoud slibvanger (L)</label>
            <input class="field-input" type="number" name="inhoud_slibv_l">
          </div>
          <div class="field">
            <label class="field-label">Materiaal opbouw</label>
            <input class="field-input" type="text" name="mat_opbouw">
          </div>
          <div class="field">
            <label class="field-label">Inlaat Ø (mm)</label>
            <input class="field-input" type="number" name="inlaat_mm">
          </div>
          <div class="field">
            <label class="field-label">Uitlaat Ø (mm)</label>
            <input class="field-input" type="number" name="uitlaat_mm">
          </div>
          <div class="field">
            <label class="field-label">Type lozing</label>
            <div class="radio-row">
              <label class="radio-opt"><input type="radio" name="type_lozing" value="Vrij verval riool"><span>Vrij verval riool</span></label>
              <label class="radio-opt"><input type="radio" name="type_lozing" value="Oppervlaktewater"><span>Oppervlaktewater</span></label>
              <label class="radio-opt"><input type="radio" name="type_lozing" value="Anders"><span>Anders</span></label>
            </div>
          </div>
          <div class="field">
            <label class="field-label">Lozingsvergunning kenmerk</label>
            <input class="field-input" type="text" name="lozingsvergunning_kenmerk">
          </div>
        </fieldset>
      </form>
    </div>
    <footer class="modal-footer">
      <button type="button" class="btn btn-secondary" data-modal-close>Annuleer</button>
      <button type="button" class="btn btn-primary" id="voorziening-modal-save">Opslaan</button>
    </footer>
  </div>
</div>
`;

let modalEl = null;
let editingVoorzieningId = null;
let currentKlantId = null;
let onSaveCallback = null;

function getEl(sel) {
  return modalEl ? modalEl.querySelector(sel) : null;
}

export function initVoorzieningModal(onSave) {
  if (modalEl) return;
  const div = document.createElement('div');
  div.innerHTML = MODAL_HTML.trim();
  modalEl = div.firstElementChild;
  document.body.appendChild(modalEl);
  bindModalClose(modalEl);
  getEl('#voorziening-modal-save').addEventListener('click', handleSave);
  onSaveCallback = onSave;
}

const VOORZIENING_FIELDS = [
  'naam', 'merk', 'type_bouwjaar', 'ns_klasse', 'ns_ls',
  'capaciteit_l', 'mat_afdekking', 'inhoud_slibv_l', 'mat_opbouw',
  'inlaat_mm', 'uitlaat_mm', 'type_lozing', 'lozingsvergunning_kenmerk'
];

function fillKlantBadge(klantId) {
  const db = loadDb();
  const klant = db.klanten.find(k => k.id === klantId);
  const badge = getEl('.klant-badge');
  if (klant && badge) {
    badge.textContent = `Klant: ${klant.bedrijfsnaam}`;
  }
}

function setRadios(form) {
  // Force radios into unchecked state since form.reset() may not always clear them.
  form.querySelectorAll('input[type="radio"]').forEach(r => { r.checked = false; });
}

export function openVoorzieningModalNew(klantId) {
  if (!modalEl) throw new Error('initVoorzieningModal must be called first');
  editingVoorzieningId = null;
  currentKlantId = klantId;
  getEl('.modal-title').textContent = 'Nieuwe voorziening';
  const form = getEl('#voorziening-form');
  form.reset();
  setRadios(form);
  fillKlantBadge(klantId);
  openModal(modalEl);
}

function handleSave() {
  const form = getEl('#voorziening-form');
  const formData = new FormData(form);
  const data = Object.fromEntries(formData);
  data.klant_id = currentKlantId;

  if (!data.naam || !data.naam.trim()) {
    alert('Naam is verplicht');
    return;
  }

  let db = loadDb();
  if (editingVoorzieningId) {
    db = updateVoorziening(db, editingVoorzieningId, data);
  } else {
    db = addVoorziening(db, data);
  }
  try {
    saveDb(db);
  } catch (e) {
    alert(e.message);
    return;
  }
  closeModal(modalEl);
  if (onSaveCallback) onSaveCallback(db);
}

export function _resetForTests() {
  if (modalEl && modalEl.parentNode) {
    modalEl.parentNode.removeChild(modalEl);
  }
  modalEl = null;
  editingVoorzieningId = null;
  currentKlantId = null;
  onSaveCallback = null;
}
```

- [ ] **Step 1.4: Run tests — verify PASS**

```bash
npm test 2>&1 | tail -10
```

Expected: 222 passed (214 + 8 new).

- [ ] **Step 1.5: Commit**

```bash
git add js/voorziening-modal.js tests/voorziening-modal.test.js
git commit -m "$(cat <<'EOF'
feat(voorziening-modal): HTML skeleton + openNew + 12 installatie-velden

Singleton modal analoog aan klant-modal: HTML met 12 velden (naam +
11 installatie-specs). NS-klasse en type_lozing als radios. Klant is
read-only badge — geërfd van geselecteerde klant via klantId-argument.
Save logica gebruikt addVoorziening uit database.js.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: Voorziening-modal openEdit

**Files:**
- Modify: `js/voorziening-modal.js`
- Modify: `tests/voorziening-modal.test.js`

- [ ] **Step 2.1: Append failing tests**

Append to `tests/voorziening-modal.test.js`:

```js
import { openVoorzieningModalEdit } from '../js/voorziening-modal.js';

describe('voorziening-modal — open edit', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    localStorage.clear();
    _resetForTests();
    saveDb({
      versie: 1,
      klanten: [{ id: 'uniper', bedrijfsnaam: 'Uniper Leiden' }],
      voorzieningen: []
    });
  });

  it('openVoorzieningModalEdit titel = "Voorziening bewerken"', () => {
    initVoorzieningModal();
    openVoorzieningModalEdit({
      id: 'v1', klant_id: 'uniper', naam: 'UNIP0504',
      merk: 'ACO'
    });
    expect(document.querySelector('.modal-title').textContent).toBe('Voorziening bewerken');
  });

  it('vult bestaande velden in inclusief radios', () => {
    initVoorzieningModal();
    openVoorzieningModalEdit({
      id: 'v1', klant_id: 'uniper',
      naam: 'UNIP0504 OOA03 trafo',
      merk: 'ACO',
      type_bouwjaar: 'NSF-100 / 2018',
      ns_klasse: 'I',
      ns_ls: '15',
      capaciteit_l: '1000',
      type_lozing: 'Vrij verval riool',
      lozingsvergunning_kenmerk: 'WSL-2024-1287'
    });
    expect(document.querySelector('[name="naam"]').value).toBe('UNIP0504 OOA03 trafo');
    expect(document.querySelector('[name="merk"]').value).toBe('ACO');
    expect(document.querySelector('[name="ns_klasse"][value="I"]').checked).toBe(true);
    expect(document.querySelector('[name="type_lozing"][value="Vrij verval riool"]').checked).toBe(true);
    expect(document.querySelector('[name="lozingsvergunning_kenmerk"]').value).toBe('WSL-2024-1287');
  });

  it('klant-badge toont juiste klant', () => {
    initVoorzieningModal();
    openVoorzieningModalEdit({
      id: 'v1', klant_id: 'uniper', naam: 'X'
    });
    expect(document.querySelector('.klant-badge').textContent).toContain('Uniper Leiden');
  });
});
```

- [ ] **Step 2.2: Run tests — verify FAIL**

```bash
npm test -- tests/voorziening-modal.test.js 2>&1 | tail -10
```

Expected: openVoorzieningModalEdit not exported.

- [ ] **Step 2.3: Add openVoorzieningModalEdit to `js/voorziening-modal.js`**

Add this export function (after `openVoorzieningModalNew`):

```js
export function openVoorzieningModalEdit(voorziening) {
  if (!modalEl) throw new Error('initVoorzieningModal must be called first');
  editingVoorzieningId = voorziening.id;
  currentKlantId = voorziening.klant_id;
  getEl('.modal-title').textContent = 'Voorziening bewerken';
  const form = getEl('#voorziening-form');
  form.reset();
  setRadios(form);
  VOORZIENING_FIELDS.forEach(f => {
    const input = form.querySelector(`[name="${f}"]`);
    if (!input) return;
    if (input.type === 'radio') {
      // Voor radios: zoek de radio met de juiste value en check 'm
      const target = form.querySelector(`[name="${f}"][value="${voorziening[f] || ''}"]`);
      if (target) target.checked = true;
    } else {
      input.value = voorziening[f] || '';
    }
  });
  fillKlantBadge(voorziening.klant_id);
  openModal(modalEl);
}
```

- [ ] **Step 2.4: Run tests — verify PASS**

```bash
npm test 2>&1 | tail -10
```

Expected: 225 passed (222 + 3 new).

- [ ] **Step 2.5: Commit**

```bash
git add js/voorziening-modal.js tests/voorziening-modal.test.js
git commit -m "$(cat <<'EOF'
feat(voorziening-modal): openEdit met prefilled radios

openVoorzieningModalEdit vult de 12 velden uit het voorziening-record.
Radios (ns_klasse, type_lozing) krijgen .checked = true op de matching
value-radio. Klant-badge toont de gekoppelde klant.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: `applyVoorzieningToState` pure helper

**Files:**
- Modify: `js/dropdown-binding.js`
- Modify: `tests/dropdown-binding.test.js`

- [ ] **Step 3.1: Append failing tests to `tests/dropdown-binding.test.js`**

```js
import { applyVoorzieningToState } from '../js/dropdown-binding.js';

describe('applyVoorzieningToState', () => {
  it('kopieert alle 12 installatie-velden naar state.installatie', () => {
    const s = createState();
    const voorziening = {
      id: 'unip0504',
      klant_id: 'uniper',
      naam: 'UNIP0504 OOA03 trafo',
      merk: 'ACO',
      type_bouwjaar: 'NSF-100 / 2018',
      ns_klasse: 'I',
      ns_ls: '15',
      capaciteit_l: '1000',
      mat_afdekking: 'Beton',
      inhoud_slibv_l: '700',
      mat_opbouw: 'PE',
      inlaat_mm: '160',
      uitlaat_mm: '160',
      type_lozing: 'Vrij verval riool',
      lozingsvergunning_kenmerk: 'WSL-2024-1287'
    };
    applyVoorzieningToState(voorziening, s);
    expect(s.installatie.merk).toBe('ACO');
    expect(s.installatie.type_bouwjaar).toBe('NSF-100 / 2018');
    expect(s.installatie.ns_klasse).toBe('I');
    expect(s.installatie.ns_ls).toBe('15');
    expect(s.installatie.capaciteit_l).toBe('1000');
    expect(s.installatie.mat_afdekking).toBe('Beton');
    expect(s.installatie.inhoud_slibv_l).toBe('700');
    expect(s.installatie.mat_opbouw).toBe('PE');
    expect(s.installatie.inlaat_mm).toBe('160');
    expect(s.installatie.uitlaat_mm).toBe('160');
    expect(s.installatie.type_lozing).toBe('Vrij verval riool');
    expect(s.installatie.lozingsvergunning_kenmerk).toBe('WSL-2024-1287');
  });

  it('zet meta-velden (id, klant_id, naam, aangemaakt) NIET op state', () => {
    const s = createState();
    const voorziening = {
      id: 'v1', klant_id: 'k1', naam: 'V', aangemaakt: '2026-05-18',
      merk: 'X'
    };
    applyVoorzieningToState(voorziening, s);
    expect(s.installatie).not.toHaveProperty('id');
    expect(s.installatie).not.toHaveProperty('klant_id');
    expect(s.installatie).not.toHaveProperty('naam');
    expect(s.installatie).not.toHaveProperty('aangemaakt');
  });

  it('lege voorziening-velden worden lege strings op state', () => {
    const s = createState();
    s.installatie.merk = 'oudewaarde';
    applyVoorzieningToState({ id: 'v1', klant_id: 'k1', naam: 'V' }, s);
    expect(s.installatie.merk).toBe('');
  });
});
```

- [ ] **Step 3.2: Run tests — verify FAIL**

```bash
npm test -- tests/dropdown-binding.test.js 2>&1 | tail -10
```

Expected: applyVoorzieningToState not exported.

- [ ] **Step 3.3: Append to `js/dropdown-binding.js`** (after `applyKlantToState`)

```js
const INSTALLATIE_VELDEN = [
  'merk', 'type_bouwjaar', 'ns_klasse', 'ns_ls',
  'capaciteit_l', 'mat_afdekking', 'inhoud_slibv_l', 'mat_opbouw',
  'inlaat_mm', 'uitlaat_mm',
  'type_lozing', 'lozingsvergunning_kenmerk'
];

export function applyVoorzieningToState(voorziening, state) {
  INSTALLATIE_VELDEN.forEach(f => setField(state, `installatie.${f}`, voorziening[f] || ''));
}
```

- [ ] **Step 3.4: Run tests — verify PASS**

```bash
npm test 2>&1 | tail -10
```

Expected: 228 passed (225 + 3 new).

- [ ] **Step 3.5: Commit**

```bash
git add js/dropdown-binding.js tests/dropdown-binding.test.js
git commit -m "$(cat <<'EOF'
feat(dropdown): applyVoorzieningToState pure helper

Kopieert 12 installatie-velden uit voorziening-record naar
state.installatie. Meta-velden (id, klant_id, naam, aangemaakt)
worden niet gezet — die zijn database-eigen.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: `refreshVoorzieningDropdown` + filter op klant_id

**Files:**
- Modify: `js/dropdown-binding.js`
- Modify: `tests/dropdown-binding.test.js`

- [ ] **Step 4.1: Append failing tests**

```js
import { refreshVoorzieningDropdown } from '../js/dropdown-binding.js';

describe('refreshVoorzieningDropdown', () => {
  beforeEach(() => localStorage.clear());

  function makeFullContainer() {
    const c = document.createElement('div');
    c.innerHTML = `
      <select data-picker="klant"><option value="">— kies klant —</option></select>
      <select data-picker="voorziening"><option value="">— kies klant eerst —</option></select>
      <button data-action="voorziening-new" disabled>+</button>
      <button data-action="voorziening-edit" disabled>✎</button>
      <button data-action="voorziening-delete" disabled>🗑</button>
    `;
    return c;
  }

  it('zonder klant_id: dropdown bevat alleen placeholder en is disabled', () => {
    const container = makeFullContainer();
    refreshVoorzieningDropdown(container, null);
    const select = container.querySelector('[data-picker="voorziening"]');
    expect(select.disabled).toBe(true);
    expect(select.querySelectorAll('option')).toHaveLength(1);
    expect(container.querySelector('[data-action="voorziening-new"]').disabled).toBe(true);
  });

  it('met klant_id: dropdown enabled + + knop enabled', () => {
    saveDb({
      versie: 1,
      klanten: [{ id: 'uniper' }],
      voorzieningen: [
        { id: 'v1', klant_id: 'uniper', naam: 'V1' }
      ]
    });
    const container = makeFullContainer();
    refreshVoorzieningDropdown(container, 'uniper');
    const select = container.querySelector('[data-picker="voorziening"]');
    expect(select.disabled).toBe(false);
    expect(container.querySelector('[data-action="voorziening-new"]').disabled).toBe(false);
  });

  it('toont alleen voorzieningen van gekozen klant', () => {
    saveDb({
      versie: 1,
      klanten: [{ id: 'a' }, { id: 'b' }],
      voorzieningen: [
        { id: 'a1', klant_id: 'a', naam: 'A1' },
        { id: 'b1', klant_id: 'b', naam: 'B1' },
        { id: 'a2', klant_id: 'a', naam: 'A2' }
      ]
    });
    const container = makeFullContainer();
    refreshVoorzieningDropdown(container, 'a');
    const opts = [...container.querySelector('[data-picker="voorziening"]').querySelectorAll('option')];
    expect(opts).toHaveLength(3); // placeholder + 2 voorzieningen van klant a
    expect(opts[1].textContent).toBe('A1');
    expect(opts[2].textContent).toBe('A2');
  });

  it('placeholder-tekst is "— kies voorziening —" als klant gekozen', () => {
    saveDb({ versie: 1, klanten: [{ id: 'a' }], voorzieningen: [] });
    const container = makeFullContainer();
    refreshVoorzieningDropdown(container, 'a');
    const placeholder = container.querySelector('[data-picker="voorziening"] option');
    expect(placeholder.textContent).toBe('— kies voorziening —');
  });
});
```

- [ ] **Step 4.2: Run tests — verify FAIL**

```bash
npm test -- tests/dropdown-binding.test.js 2>&1 | tail -10
```

Expected: refreshVoorzieningDropdown not exported.

- [ ] **Step 4.3: Append to `js/dropdown-binding.js`**

```js
export function refreshVoorzieningDropdown(container, klantId) {
  const select = container.querySelector('[data-picker="voorziening"]');
  const newBtn = container.querySelector('[data-action="voorziening-new"]');
  const editBtn = container.querySelector('[data-action="voorziening-edit"]');
  const deleteBtn = container.querySelector('[data-action="voorziening-delete"]');
  if (!select) return;

  if (!klantId) {
    select.disabled = true;
    select.innerHTML = '<option value="">— kies klant eerst —</option>';
    if (newBtn) newBtn.disabled = true;
    if (editBtn) editBtn.disabled = true;
    if (deleteBtn) deleteBtn.disabled = true;
    return;
  }

  select.disabled = false;
  if (newBtn) newBtn.disabled = false;
  select.innerHTML = '<option value="">— kies voorziening —</option>';
  const voorzieningen = getVoorzieningenVoor(loadDb(), klantId);
  voorzieningen.forEach(v => {
    const opt = document.createElement('option');
    opt.value = v.id;
    opt.textContent = v.naam;
    select.appendChild(opt);
  });
  // Edit + delete blijven disabled tot keuze
  if (editBtn) editBtn.disabled = true;
  if (deleteBtn) deleteBtn.disabled = true;
}
```

- [ ] **Step 4.4: Run tests — verify PASS**

```bash
npm test 2>&1 | tail -10
```

Expected: 232 passed (228 + 4 new).

- [ ] **Step 4.5: Commit**

```bash
git add js/dropdown-binding.js tests/dropdown-binding.test.js
git commit -m "$(cat <<'EOF'
feat(dropdown): refreshVoorzieningDropdown gefilterd op klant_id

Zonder klant: dropdown disabled met placeholder "— kies klant eerst —".
Met klant: enabled + "+ Nieuw" knop enabled, opties uit
getVoorzieningenVoor(klantId). Edit/delete blijven disabled tot keuze.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: `bindVoorzieningDropdown`

**Files:**
- Modify: `js/dropdown-binding.js`
- Modify: `tests/dropdown-binding.test.js`

- [ ] **Step 5.1: Append failing tests**

```js
import { bindVoorzieningDropdown } from '../js/dropdown-binding.js';

describe('bindVoorzieningDropdown — keuze + delete', () => {
  function makeFullContainer() {
    const c = document.createElement('div');
    c.innerHTML = `
      <select data-picker="klant"><option value="">— kies klant —</option></select>
      <select data-picker="voorziening"><option value="">— kies klant eerst —</option></select>
      <button data-action="voorziening-new" disabled>+</button>
      <button data-action="voorziening-edit" disabled>✎</button>
      <button data-action="voorziening-delete" disabled>🗑</button>
    `;
    return c;
  }

  beforeEach(() => localStorage.clear());

  it('bij voorziening-keuze: edit + delete worden enabled', () => {
    saveDb({
      versie: 1,
      klanten: [{ id: 'u' }],
      voorzieningen: [{ id: 'v1', klant_id: 'u', naam: 'V1', merk: 'ACO' }]
    });
    const container = makeFullContainer();
    const state = createState();
    bindVoorzieningDropdown(container, state);
    refreshVoorzieningDropdown(container, 'u');
    const select = container.querySelector('[data-picker="voorziening"]');
    select.value = 'v1';
    select.dispatchEvent(new Event('change'));
    expect(container.querySelector('[data-action="voorziening-edit"]').disabled).toBe(false);
    expect(container.querySelector('[data-action="voorziening-delete"]').disabled).toBe(false);
  });

  it('bij voorziening-keuze: state.installatie wordt gevuld', () => {
    saveDb({
      versie: 1,
      klanten: [{ id: 'u' }],
      voorzieningen: [{
        id: 'v1', klant_id: 'u', naam: 'V1',
        merk: 'ACO', ns_klasse: 'I', capaciteit_l: '1000'
      }]
    });
    const container = makeFullContainer();
    const state = createState();
    bindVoorzieningDropdown(container, state);
    refreshVoorzieningDropdown(container, 'u');
    const select = container.querySelector('[data-picker="voorziening"]');
    select.value = 'v1';
    select.dispatchEvent(new Event('change'));
    expect(state.installatie.merk).toBe('ACO');
    expect(state.installatie.ns_klasse).toBe('I');
    expect(state.installatie.capaciteit_l).toBe('1000');
  });

  it('delete-knop vraagt confirm en verwijdert na ok', () => {
    saveDb({
      versie: 1,
      klanten: [{ id: 'u' }],
      voorzieningen: [{ id: 'v1', klant_id: 'u', naam: 'V1' }]
    });
    const container = makeFullContainer();
    const state = createState();
    bindVoorzieningDropdown(container, state);
    refreshVoorzieningDropdown(container, 'u');
    const select = container.querySelector('[data-picker="voorziening"]');
    select.value = 'v1';
    select.dispatchEvent(new Event('change'));

    const origConfirm = window.confirm;
    window.confirm = () => true;
    try {
      container.querySelector('[data-action="voorziening-delete"]').click();
      const db = JSON.parse(localStorage.getItem('nen858-database'));
      expect(db.voorzieningen).toHaveLength(0);
    } finally {
      window.confirm = origConfirm;
    }
  });
});
```

- [ ] **Step 5.2: Run tests — verify FAIL**

```bash
npm test -- tests/dropdown-binding.test.js 2>&1 | tail -10
```

Expected: bindVoorzieningDropdown not exported.

- [ ] **Step 5.3: Append to `js/dropdown-binding.js`**

```js
import { deleteVoorziening } from './database.js';

export function bindVoorzieningDropdown(container, state, syncDom) {
  if (container.dataset.voorzieningDropdownBound === '1') return;
  container.dataset.voorzieningDropdownBound = '1';

  const select = container.querySelector('[data-picker="voorziening"]');
  const editBtn = container.querySelector('[data-action="voorziening-edit"]');
  const deleteBtn = container.querySelector('[data-action="voorziening-delete"]');

  select.addEventListener('change', () => {
    const id = select.value;
    if (!id) {
      editBtn.disabled = true;
      deleteBtn.disabled = true;
      return;
    }
    const db = loadDb();
    const voorziening = db.voorzieningen.find(v => v.id === id);
    if (!voorziening) return;
    applyVoorzieningToState(voorziening, state);
    if (syncDom) syncDom();
    editBtn.disabled = false;
    deleteBtn.disabled = false;
  });

  deleteBtn.addEventListener('click', () => {
    const db = loadDb();
    const voorziening = db.voorzieningen.find(v => v.id === select.value);
    if (!voorziening) return;
    if (!confirm(`Weet je zeker dat je voorziening "${voorziening.naam}" wilt verwijderen?`)) return;
    const newDb = deleteVoorziening(db, voorziening.id);
    try {
      saveDb(newDb);
    } catch (e) {
      alert(e.message);
      return;
    }
    // Refresh dropdown via klant_id
    refreshVoorzieningDropdown(container, voorziening.klant_id);
    editBtn.disabled = true;
    deleteBtn.disabled = true;
  });
}

export function _resetVoorzieningBindGuard(container) {
  delete container.dataset.voorzieningDropdownBound;
}
```

Update the existing `_resetBindGuard` helper or add the new test helper. Both should be exportable so tests can clear state. The existing `_resetBindGuard(container)` clears klant; the new one clears voorziening.

- [ ] **Step 5.4: Run tests — verify PASS**

```bash
npm test 2>&1 | tail -10
```

Expected: 235 passed (232 + 3 new).

- [ ] **Step 5.5: Commit**

```bash
git add js/dropdown-binding.js tests/dropdown-binding.test.js
git commit -m "$(cat <<'EOF'
feat(dropdown): bindVoorzieningDropdown event-handlers + delete

Bij voorziening-keuze: applyVoorzieningToState vult state.installatie.*.
Delete vraagt confirm en roept database.deleteVoorziening aan,
daarna refreshVoorzieningDropdown. Idempotency-guard via dataset-marker.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 6: `bindKlantDropdown` uitbreiden met `onKlantChange` callback

**Files:**
- Modify: `js/dropdown-binding.js`
- Modify: `tests/dropdown-binding.test.js`

Reden: bij klant-wijziging moet voorziening-dropdown ververst worden. Cleanste API: 4e parameter callback. Backward compatible: optional.

- [ ] **Step 6.1: Append failing test**

```js
describe('bindKlantDropdown — onKlantChange callback', () => {
  beforeEach(() => localStorage.clear());

  it('roept onKlantChange aan na klant-keuze met klant-id', () => {
    saveDb({
      versie: 1,
      klanten: [{ id: 'a', bedrijfsnaam: 'A', opdrachtgever_zelfde_als_locatie: true }],
      voorzieningen: []
    });
    const container = makeContainer();
    const state = createState();
    let receivedId = null;
    bindKlantDropdown(container, state, null, (klantId) => { receivedId = klantId; });
    const select = container.querySelector('[data-picker="klant"]');
    select.value = 'a';
    select.dispatchEvent(new Event('change'));
    expect(receivedId).toBe('a');
  });

  it('roept onKlantChange met null bij dropdown-leegmaken', () => {
    saveDb({
      versie: 1,
      klanten: [{ id: 'a', bedrijfsnaam: 'A', opdrachtgever_zelfde_als_locatie: true }],
      voorzieningen: []
    });
    const container = makeContainer();
    const state = createState();
    let receivedId = 'placeholder';
    bindKlantDropdown(container, state, null, (klantId) => { receivedId = klantId; });
    const select = container.querySelector('[data-picker="klant"]');
    select.value = '';
    select.dispatchEvent(new Event('change'));
    expect(receivedId).toBeNull();
  });

  it('roept onKlantChange NIET aan bij confirm-cancel (state niet overschreven)', () => {
    saveDb({
      versie: 1,
      klanten: [{ id: 'a', bedrijfsnaam: 'Nieuw', opdrachtgever_zelfde_als_locatie: true }],
      voorzieningen: []
    });
    const container = makeContainer();
    const state = createState();
    state.locatie.bedrijfsnaam = 'Bestaand';
    let called = false;
    bindKlantDropdown(container, state, null, () => { called = true; });

    const origConfirm = window.confirm;
    window.confirm = () => false;
    try {
      const select = container.querySelector('[data-picker="klant"]');
      select.value = 'a';
      select.dispatchEvent(new Event('change'));
      expect(called).toBe(false);
    } finally {
      window.confirm = origConfirm;
    }
  });
});
```

- [ ] **Step 6.2: Run tests — verify FAIL**

```bash
npm test -- tests/dropdown-binding.test.js 2>&1 | tail -10
```

Expected: 3 failures — onKlantChange parameter wordt nog niet gerespecteerd.

- [ ] **Step 6.3: Update `bindKlantDropdown` in `js/dropdown-binding.js`**

Find the existing `bindKlantDropdown` function and replace it with:

```js
export function bindKlantDropdown(container, state, syncDom, onKlantChange) {
  if (container.dataset.klantDropdownBound === '1') return;
  container.dataset.klantDropdownBound = '1';

  refreshKlantDropdown(container);
  const select = container.querySelector('[data-picker="klant"]');
  const editBtn = container.querySelector('[data-action="klant-edit"]');
  const deleteBtn = container.querySelector('[data-action="klant-delete"]');

  let previousValue = '';

  select.addEventListener('change', () => {
    const klantId = select.value;
    if (!klantId) {
      previousValue = '';
      editBtn.disabled = true;
      deleteBtn.disabled = true;
      if (onKlantChange) onKlantChange(null);
      return;
    }
    const db = loadDb();
    const klant = db.klanten.find(k => k.id === klantId);
    if (!klant) return;
    if (isLocatieFilled(state)) {
      const ok = confirm(`Velden zijn al ingevuld. Overschrijven met data van "${klant.bedrijfsnaam}"?`);
      if (!ok) {
        select.value = previousValue;
        editBtn.disabled = !previousValue;
        deleteBtn.disabled = !previousValue;
        return;
      }
    }
    applyKlantToState(klant, state);
    if (syncDom) syncDom();
    previousValue = klantId;
    editBtn.disabled = false;
    deleteBtn.disabled = false;
    if (onKlantChange) onKlantChange(klantId);
  });

  deleteBtn.addEventListener('click', () => {
    const db = loadDb();
    const klant = db.klanten.find(k => k.id === select.value);
    if (!klant) return;
    const voorzieningen = getVoorzieningenVoor(db, klant.id);
    let msg = `Weet je zeker dat je "${klant.bedrijfsnaam}" wilt verwijderen?`;
    if (voorzieningen.length > 0) {
      const meervoud = voorzieningen.length === 1 ? '' : 'en';
      msg += `\n\nDeze klant heeft ${voorzieningen.length} voorziening${meervoud} — die worden ook verwijderd.`;
    }
    if (!confirm(msg)) return;
    const newDb = deleteKlant(db, klant.id);
    try {
      saveDb(newDb);
    } catch (e) {
      alert(e.message);
      return;
    }
    refreshKlantDropdown(container);
    select.value = '';
    previousValue = '';
    editBtn.disabled = true;
    deleteBtn.disabled = true;
    if (onKlantChange) onKlantChange(null);
  });
}
```

- [ ] **Step 6.4: Run tests — verify PASS**

```bash
npm test 2>&1 | tail -10
```

Expected: 238 passed (235 + 3 new).

- [ ] **Step 6.5: Commit**

```bash
git add js/dropdown-binding.js tests/dropdown-binding.test.js
git commit -m "$(cat <<'EOF'
feat(dropdown): bindKlantDropdown krijgt onKlantChange callback (4e param)

Bij klant-keuze, leegmaken of delete wordt onKlantChange aangeroepen
met de nieuwe klant-id (of null). Backward-compatible — parameter is
optional. Bij confirm-cancel wordt callback NIET aangeroepen (state
is niet gewijzigd).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 7: main.js — wire voorziening-modal + voorziening-dropdown

**Files:**
- Modify: `js/main.js`

- [ ] **Step 7.1: Read current `js/main.js`**

Use Read to see the current state. The fase-3 wire block looks like:

```js
// --- Fase 3: Klanten-UI ---

initKlantModal((newDb) => {
  refreshKlantDropdown(sectiesContainer);
  const selectedId = sectiesContainer.querySelector('[data-picker="klant"]').value;
  if (selectedId) {
    const klant = newDb.klanten.find(k => k.id === selectedId);
    if (klant) {
      applyKlantToState(klant, state);
      syncDomFromState();
    }
  }
});

bindKlantDropdown(sectiesContainer, state, syncDomFromState);
```

- [ ] **Step 7.2: Add voorziening-modal imports + init + wire**

Add imports near top:

```js
import { initVoorzieningModal, openVoorzieningModalNew, openVoorzieningModalEdit } from './voorziening-modal.js';
import { bindVoorzieningDropdown, refreshVoorzieningDropdown, applyVoorzieningToState } from './dropdown-binding.js';
```

Replace the `bindKlantDropdown(sectiesContainer, state, syncDomFromState);` line and add voorziening-init right after the existing klant-section. The full new block should be:

```js
// --- Fase 3: Klanten-UI ---

initKlantModal((newDb) => {
  refreshKlantDropdown(sectiesContainer);
  const selectedId = sectiesContainer.querySelector('[data-picker="klant"]').value;
  if (selectedId) {
    const klant = newDb.klanten.find(k => k.id === selectedId);
    if (klant) {
      applyKlantToState(klant, state);
      syncDomFromState();
    }
  }
});

// --- Fase 4: Voorzieningen-UI ---

initVoorzieningModal((newDb) => {
  // Na opslaan: ververs dropdown voor huidige klant + sync als bewerkte voorziening nog gekozen
  const klantId = sectiesContainer.querySelector('[data-picker="klant"]').value;
  refreshVoorzieningDropdown(sectiesContainer, klantId || null);
  const voorzId = sectiesContainer.querySelector('[data-picker="voorziening"]').value;
  if (voorzId) {
    const v = newDb.voorzieningen.find(x => x.id === voorzId);
    if (v) {
      applyVoorzieningToState(v, state);
      syncDomFromState();
    }
  }
});

// Klant-dropdown: bij wijziging ververst voorziening-dropdown met klant-filter
bindKlantDropdown(sectiesContainer, state, syncDomFromState, (klantId) => {
  refreshVoorzieningDropdown(sectiesContainer, klantId);
});

bindVoorzieningDropdown(sectiesContainer, state, syncDomFromState);

// Wire "+ Nieuw klant" en "✎ Bewerken" knoppen (bestaand uit fase 3)
const klantNewBtn = sectiesContainer.querySelector('[data-action="klant-new"]');
if (klantNewBtn) {
  klantNewBtn.addEventListener('click', () => openKlantModalNew());
}
const klantEditBtn = sectiesContainer.querySelector('[data-action="klant-edit"]');
if (klantEditBtn) {
  klantEditBtn.addEventListener('click', () => {
    const klantId = sectiesContainer.querySelector('[data-picker="klant"]').value;
    if (!klantId) return;
    const db = loadDb();
    const klant = db.klanten.find(k => k.id === klantId);
    if (klant) openKlantModalEdit(klant);
  });
}

// Wire "+ Nieuw voorziening" en "✎ Bewerken" knoppen
const voorzNewBtn = sectiesContainer.querySelector('[data-action="voorziening-new"]');
if (voorzNewBtn) {
  voorzNewBtn.addEventListener('click', () => {
    const klantId = sectiesContainer.querySelector('[data-picker="klant"]').value;
    if (!klantId) return; // knop is disabled zonder klant maar guard voor zekerheid
    openVoorzieningModalNew(klantId);
  });
}
const voorzEditBtn = sectiesContainer.querySelector('[data-action="voorziening-edit"]');
if (voorzEditBtn) {
  voorzEditBtn.addEventListener('click', () => {
    const id = sectiesContainer.querySelector('[data-picker="voorziening"]').value;
    if (!id) return;
    const db = loadDb();
    const v = db.voorzieningen.find(x => x.id === id);
    if (v) openVoorzieningModalEdit(v);
  });
}
```

Replace the existing fase-3 block with this complete new block (which includes fase 3 logic untouched + new fase 4 lines).

- [ ] **Step 7.3: Run tests — verify still 238 passed**

```bash
cd "C:/Users/Maurice van Anraat/Documents/.claudeV2/projects/symitech/NEN_EN858_2-v2" && npm test 2>&1 | tail -5
```

Expected: 238 passed.

- [ ] **Step 7.4: Commit**

```bash
git add js/main.js
git commit -m "$(cat <<'EOF'
feat(main): wire voorziening-modal + voorziening-dropdown

initVoorzieningModal callback ververst dropdown na opslaan en past
state opnieuw toe als bewerkte voorziening nog gekozen is.
bindKlantDropdown krijgt onKlantChange callback → ververst voorziening-
dropdown bij klant-wijziging (filter op klant_id).
"+ Nieuw" en "✎ Bewerken" knoppen voor voorzieningen aangesloten.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 8: CSS voor radio-row + klant-badge

**Files:**
- Modify: `css/styles.css`

- [ ] **Step 8.1: Append CSS**

```css
/* Voorziening-modal: klant-badge + radio-row */
.klant-badge {
  background: var(--blue-bg);
  color: var(--blue);
  padding: 8px 12px;
  border-radius: 4px;
  font-weight: 600;
  font-size: 13px;
  margin-bottom: 16px;
  border-left: 3px solid var(--blue);
}
.radio-row {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.radio-row .radio-opt {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  font-size: 13px;
}
.radio-row .radio-opt input {
  margin: 0;
}
.radio-row .radio-opt span {
  padding: 4px 8px;
  border: 1px solid var(--grey-mid);
  border-radius: 4px;
  background: white;
  transition: all 0.15s;
}
.radio-row .radio-opt input:checked + span {
  background: var(--blue);
  color: white;
  border-color: var(--blue);
}
```

- [ ] **Step 8.2: Verify**

```bash
npm test 2>&1 | tail -5
```

Expected: 238 passed (CSS doesn't affect tests).

- [ ] **Step 8.3: Commit**

```bash
git add css/styles.css
git commit -m "$(cat <<'EOF'
style(css): klant-badge + radio-row voor voorziening-modal

Klant-badge in modal-header met blue accent. Radio-row toont
NS-klasse en type_lozing horizontaal naast elkaar met checked-state.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 9: STATUS-update + Definition of Done

**Files:**
- Modify: `STATUS.md`

- [ ] **Step 9.1: Update STATUS.md**

Append after the fase 3 section, and update the "Volgende fase":

```markdown
## Fase 4 — UI Voorzieningenbeheer ✓ Afgerond op 2026-05-18

Resultaat:
- Nieuwe module `js/voorziening-modal.js` — singleton modal analoog aan klant-modal, met 12 installatie-velden + naam + klant-badge
- Uitbreiding `js/dropdown-binding.js`:
  - `applyVoorzieningToState` pure helper
  - `refreshVoorzieningDropdown` met klant_id-filter
  - `bindVoorzieningDropdown` event-handlers + delete
  - `bindKlantDropdown` heeft 4e parameter `onKlantChange` callback
- `main.js` wire: klant-wijziging ververst voorziening-dropdown; voorziening-keuze vult `state.installatie.*`
- CSS: `.klant-badge` en `.radio-row` styling
- ~24 nieuwe tests (8 modal-new + 3 modal-edit + 3 helper + 4 refresh + 3 bind + 3 onKlantChange) — totaal ~238 groen

## Volgende fase

Fase 5 — Sync (export/import database) + foutafhandeling. Zie spec sectie 7 + 8.
```

- [ ] **Step 9.2: Commit**

```bash
git add STATUS.md
git commit -m "$(cat <<'EOF'
docs: mark fase 4 als afgerond in STATUS.md

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

- [ ] **Step 9.3: Definition of Done check**

```bash
cd "C:/Users/Maurice van Anraat/Documents/.claudeV2/projects/symitech/NEN_EN858_2-v2"
npm test 2>&1 | tail -10
git log --oneline | head -12
```

Expected:
- ~238 tests passed (6+ test files)
- 9+ commits on `main` voor fase 4
- Working tree clean

---

## Risico's en mitigaties

| Risico | Mitigatie |
|--------|-----------|
| Voorziening-dropdown raakt out-of-sync bij klant-switch | onKlantChange callback ververst dropdown direct in dezelfde event-cycle (Task 6) |
| Modal blijft "stale" data tonen tussen new/edit | `setRadios(form) + form.reset()` reset álles bij elke open-call |
| Radios reageren niet op `form.reset()` in jsdom | Helper `setRadios` doet expliciet `r.checked = false` |
| Klant verwijderen wist voorzieningen (cascade) maar dropdown niet | onKlantChange-cb met `null` (Task 6 step 6.3) ververst voorziening-dropdown naar lege state |
| Verwijderen voorziening tijdens lopende inspectie wist `state.installatie` niet | Acceptabel: state-velden blijven invulbaar; gebruiker ziet via dropdown-leegheid dat voorziening weg is |

---

## Niet in deze fase

- **Validatie van NS-klasse vs coalescentiefilter consistency** — out of scope
- **Voorziening dupliceren** — out of scope
- **Bulk-import van voorzieningen uit Excel** — niet in v2
- **Sortering binnen voorziening-dropdown** — natural order (toegevoegd-volgorde)
- **Sync (export/import database)** — fase 5
