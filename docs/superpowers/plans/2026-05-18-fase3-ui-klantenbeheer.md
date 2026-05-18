# Fase 3: UI Klantenbeheer — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Sectie 1 (Projectgegevens) uitbreiden met klant-dropdown, "+ Nieuw" / "✎ Bewerken" / "🗑 Verwijderen" knoppen, en een klant-modal voor toevoegen/bewerken met "zelfde als locatie"-toggle. Bij keuze van een klant worden `state.locatie.*` en `state.opdrachtgever.*` automatisch ingevuld.

**Architecture:** Twee nieuwe modules (`klant-modal.js`, `dropdown-binding.js`) + aanpassing van `form-render.js` (sectie 1) en `main.js`. Pure helpers (`applyKlantToState`, `isLocatieFilled`) zijn unit-testbaar zonder DOM. Modal is een singleton DOM-element dat eenmalig wordt aangemaakt en hergebruikt voor toevoegen + bewerken.

**Tech Stack:** Vanilla JS ES modules, vitest + jsdom, native `<select>` + `<dialog>`-achtige modal (geen library).

---

## File Structure

### Nieuw

| Pad | Verantwoordelijkheid |
|-----|----------------------|
| `js/modal.js` | Generieke open/close + backdrop + Esc-handler voor modals (herbruikbaar door fase 4) |
| `js/klant-modal.js` | Klant-specifieke modal: HTML-template, init, openNew, openEdit, save-handler |
| `js/dropdown-binding.js` | Klant-dropdown koppeling: refresh, bind events, auto-fill state, overschrijf-bevestiging, delete met cascade-warning |
| `tests/modal.test.js` | Tests voor generic modal helper (open/close, backdrop, esc) |
| `tests/klant-modal.test.js` | Tests voor klant-modal (HTML render, toggle, validatie, save → database) |
| `tests/dropdown-binding.test.js` | Tests voor pure helpers (applyKlantToState, isLocatieFilled) + DOM-integratie |

### Gewijzigd

| Pad | Wijziging |
|-----|-----------|
| `js/form-render.js` | `renderSection1Projectgegevens` krijgt een `entity-picker`-blok bovenaan met klant-dropdown + 3 knoppen + voorziening-placeholder |
| `js/main.js` | Imports + init van klant-modal en dropdown-binding |
| `css/styles.css` | `.entity-picker`, `.modal`, `.modal-backdrop`, `.modal-dialog`, `.btn-icon`, `.checkbox-label` styling |

### Niet gewijzigd

- `js/database.js` (fase 2-laag, klaar)
- `js/state.js`, `js/validation.js`, `js/photos.js`, `js/pdf-builder.js`
- v1-map (`NEN_EN858_2/`)
- Voorziening-knoppen blijven `disabled` in deze fase — dat is fase 4

---

## State-mapping referentie

Bij klant-keuze via dropdown wordt deze mapping toegepast op `state`:

**Klant-velden → `state.locatie.*` (altijd):**

| Klant-veld | State-pad |
|------------|-----------|
| `bedrijfsnaam` | `state.locatie.bedrijfsnaam` |
| `adres` | `state.locatie.adres` |
| `postcode_plaats` | `state.locatie.postcode_plaats` |
| `contactpersoon` | `state.locatie.contactpersoon` |

**Telefoon (altijd op opdrachtgever in v1):**

| Klant-veld | State-pad |
|------------|-----------|
| `opdrachtgever_telefoon` | `state.opdrachtgever.telefoon` |

**Opdrachtgever-velden (conditional op toggle):**

Als `opdrachtgever_zelfde_als_locatie === true`:

| Klant-veld | State-pad |
|------------|-----------|
| `bedrijfsnaam` | `state.opdrachtgever.bedrijfsnaam` |
| `adres` | `state.opdrachtgever.adres` |
| `postcode_plaats` | `state.opdrachtgever.postcode_plaats` |
| `contactpersoon` | `state.opdrachtgever.contactpersoon` |

Als `opdrachtgever_zelfde_als_locatie === false`:

| Klant-veld | State-pad |
|------------|-----------|
| `opdrachtgever_bedrijfsnaam` | `state.opdrachtgever.bedrijfsnaam` |
| `opdrachtgever_adres` | `state.opdrachtgever.adres` |
| `opdrachtgever_postcode_plaats` | `state.opdrachtgever.postcode_plaats` |
| `opdrachtgever_contactpersoon` | `state.opdrachtgever.contactpersoon` |

---

## Task 1: Sectie 1 HTML uitbreiding — entity-picker

**Files:**
- Modify: `js/form-render.js` (functie `renderSection1Projectgegevens`)
- Modify: `tests/form-render.test.js`

- [ ] **Step 1.1: Write failing test in `tests/form-render.test.js`**

Append (at the bottom):

```js
describe('renderSection1Projectgegevens — fase 3 entity-picker', () => {
  let container, state;
  beforeEach(() => {
    container = document.createElement('div');
    state = createState();
    renderSection1Projectgegevens(container, state);
  });

  it('bevat een entity-picker blok bovenaan sectie 1', () => {
    expect(container.querySelector('.entity-picker')).toBeTruthy();
  });

  it('heeft een klant-dropdown met data-picker="klant"', () => {
    expect(container.querySelector('select[data-picker="klant"]')).toBeTruthy();
  });

  it('heeft een voorziening-dropdown met data-picker="voorziening" (placeholder voor fase 4)', () => {
    expect(container.querySelector('select[data-picker="voorziening"]')).toBeTruthy();
  });

  it('heeft klant-actie knoppen: nieuw, bewerken, verwijderen', () => {
    expect(container.querySelector('[data-action="klant-new"]')).toBeTruthy();
    expect(container.querySelector('[data-action="klant-edit"]')).toBeTruthy();
    expect(container.querySelector('[data-action="klant-delete"]')).toBeTruthy();
  });

  it('klant-edit en klant-delete zijn initieel disabled', () => {
    expect(container.querySelector('[data-action="klant-edit"]').disabled).toBe(true);
    expect(container.querySelector('[data-action="klant-delete"]').disabled).toBe(true);
  });

  it('voorziening-acties zijn allemaal disabled (fase 4)', () => {
    expect(container.querySelector('[data-action="voorziening-new"]').disabled).toBe(true);
    expect(container.querySelector('[data-action="voorziening-edit"]').disabled).toBe(true);
    expect(container.querySelector('[data-action="voorziening-delete"]').disabled).toBe(true);
  });
});
```

- [ ] **Step 1.2: Run tests — verify FAIL**

```bash
cd "C:/Users/Maurice van Anraat/Documents/.claudeV2/projects/symitech/NEN_EN858_2-v2" && npm test -- tests/form-render.test.js 2>&1 | tail -15
```

Expected: 6 failures — `.entity-picker` not found.

- [ ] **Step 1.3: Update `renderSection1Projectgegevens` in `js/form-render.js`**

Find the function. Replace the existing `<section ...>` HTML template, modifying just the inner `<div class="section-body">` content by adding the entity-picker block as the FIRST child:

Locate this in form-render.js:

```js
export function renderSection1Projectgegevens(container, state) {
  const html = `
    <section class="form-section" data-section="projectgegevens">
      <header class="section-title">1. Projectgegevens</header>
      <div class="section-body">
        <div class="grid-2">
```

Replace with:

```js
export function renderSection1Projectgegevens(container, state) {
  const html = `
    <section class="form-section" data-section="projectgegevens">
      <header class="section-title">1. Projectgegevens</header>
      <div class="section-body">
        <div class="entity-picker">
          <div class="entity-picker-row">
            <label class="entity-picker-label">Klant</label>
            <select class="field-input entity-picker-select" data-picker="klant">
              <option value="">— kies klant —</option>
            </select>
            <button type="button" class="btn-icon" data-action="klant-new" title="Nieuwe klant">+</button>
            <button type="button" class="btn-icon" data-action="klant-edit" title="Klant bewerken" disabled>✎</button>
            <button type="button" class="btn-icon" data-action="klant-delete" title="Klant verwijderen" disabled>🗑</button>
          </div>
          <div class="entity-picker-row">
            <label class="entity-picker-label">Voorziening</label>
            <select class="field-input entity-picker-select" data-picker="voorziening">
              <option value="">— kies klant eerst —</option>
            </select>
            <button type="button" class="btn-icon" data-action="voorziening-new" title="Nieuwe voorziening" disabled>+</button>
            <button type="button" class="btn-icon" data-action="voorziening-edit" title="Voorziening bewerken" disabled>✎</button>
            <button type="button" class="btn-icon" data-action="voorziening-delete" title="Voorziening verwijderen" disabled>🗑</button>
          </div>
        </div>
        <div class="grid-2">
```

(The `<div class="grid-2">` after the new entity-picker remains the existing locatie+opdrachtgever blok — only insertion at the top.)

- [ ] **Step 1.4: Run tests — verify PASS**

```bash
npm test 2>&1 | tail -10
```

Expected: 184 passed (178 + 6 new).

- [ ] **Step 1.5: Commit**

```bash
git add js/form-render.js tests/form-render.test.js
git commit -m "$(cat <<'EOF'
feat(form): voeg entity-picker toe aan sectie 1 (klant + voorziening dropdowns)

Bovenaan sectie 1 staan nu 2 rijen met dropdowns voor klant en
voorziening, elk met nieuwe/bewerk/verwijder-knoppen. Klant-bewerk
en -verwijder beginnen disabled tot er een keuze gemaakt is.
Voorziening-acties blijven disabled in deze fase (fase 4).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: Generic modal helper

**Files:**
- Create: `js/modal.js`
- Create: `tests/modal.test.js`

- [ ] **Step 2.1: Write failing tests in new file `tests/modal.test.js`**

```js
import { describe, it, expect, beforeEach } from 'vitest';
import { openModal, closeModal, bindModalClose } from '../js/modal.js';

function makeModal() {
  const div = document.createElement('div');
  div.innerHTML = `
    <div class="modal" aria-hidden="true">
      <div class="modal-backdrop"></div>
      <div class="modal-dialog">
        <button type="button" data-modal-close>×</button>
        <input type="text" id="first-field">
      </div>
    </div>
  `;
  return div.firstElementChild;
}

describe('openModal / closeModal', () => {
  let modal;
  beforeEach(() => {
    modal = makeModal();
    document.body.appendChild(modal);
  });

  it('openModal voegt modal-open class toe en zet aria-hidden=false', () => {
    openModal(modal);
    expect(modal.classList.contains('modal-open')).toBe(true);
    expect(modal.getAttribute('aria-hidden')).toBe('false');
  });

  it('closeModal verwijdert modal-open en zet aria-hidden=true', () => {
    openModal(modal);
    closeModal(modal);
    expect(modal.classList.contains('modal-open')).toBe(false);
    expect(modal.getAttribute('aria-hidden')).toBe('true');
  });

  it('openModal voegt no-scroll toe aan body', () => {
    openModal(modal);
    expect(document.body.classList.contains('no-scroll')).toBe(true);
    closeModal(modal);
    expect(document.body.classList.contains('no-scroll')).toBe(false);
  });
});

describe('bindModalClose', () => {
  let modal;
  beforeEach(() => {
    modal = makeModal();
    document.body.appendChild(modal);
    bindModalClose(modal);
  });

  it('sluit modal bij click op backdrop', () => {
    openModal(modal);
    modal.querySelector('.modal-backdrop').click();
    expect(modal.classList.contains('modal-open')).toBe(false);
  });

  it('sluit modal bij click op [data-modal-close] knop', () => {
    openModal(modal);
    modal.querySelector('[data-modal-close]').click();
    expect(modal.classList.contains('modal-open')).toBe(false);
  });

  it('sluit modal bij Escape-toets', () => {
    openModal(modal);
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(modal.classList.contains('modal-open')).toBe(false);
  });
});
```

- [ ] **Step 2.2: Run tests — verify FAIL**

```bash
npm test -- tests/modal.test.js 2>&1 | tail -10
```

Expected: module not found.

- [ ] **Step 2.3: Create `js/modal.js`**

```js
export function openModal(modalElement) {
  modalElement.classList.add('modal-open');
  modalElement.setAttribute('aria-hidden', 'false');
  document.body.classList.add('no-scroll');
  const firstInput = modalElement.querySelector('input, select, textarea');
  if (firstInput && firstInput.focus) firstInput.focus();
}

export function closeModal(modalElement) {
  modalElement.classList.remove('modal-open');
  modalElement.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('no-scroll');
}

export function bindModalClose(modalElement) {
  const backdrop = modalElement.querySelector('.modal-backdrop');
  if (backdrop) {
    backdrop.addEventListener('click', () => closeModal(modalElement));
  }
  modalElement.querySelectorAll('[data-modal-close]').forEach(btn => {
    btn.addEventListener('click', () => closeModal(modalElement));
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modalElement.classList.contains('modal-open')) {
      closeModal(modalElement);
    }
  });
}
```

- [ ] **Step 2.4: Run tests — verify PASS**

```bash
npm test 2>&1 | tail -10
```

Expected: 190 passed (184 + 6).

- [ ] **Step 2.5: Commit**

```bash
git add js/modal.js tests/modal.test.js
git commit -m "$(cat <<'EOF'
feat(modal): generic open/close helper met backdrop + Esc-key

Herbruikbare modal-utility voor klant-modal (fase 3) en
voorziening-modal (fase 4). Houdt aria-hidden gesynced en
voorkomt body-scroll terwijl modal open is.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: Klant-modal — render + open/close + zelfde-als-locatie toggle

**Files:**
- Create: `js/klant-modal.js`
- Create: `tests/klant-modal.test.js`

- [ ] **Step 3.1: Write failing tests in new file `tests/klant-modal.test.js`**

```js
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { initKlantModal, openKlantModalNew, openKlantModalEdit, _resetForTests } from '../js/klant-modal.js';

describe('klant-modal — init + open new', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    localStorage.clear();
    _resetForTests();
  });

  it('initKlantModal voegt modal aan document toe', () => {
    initKlantModal();
    expect(document.getElementById('klant-modal')).toBeTruthy();
  });

  it('initKlantModal is idempotent (geen dubbele modal bij 2x aanroepen)', () => {
    initKlantModal();
    initKlantModal();
    expect(document.querySelectorAll('#klant-modal')).toHaveLength(1);
  });

  it('openKlantModalNew opent modal met titel "Nieuwe klant"', () => {
    initKlantModal();
    openKlantModalNew();
    const modal = document.getElementById('klant-modal');
    expect(modal.classList.contains('modal-open')).toBe(true);
    expect(modal.querySelector('.modal-title').textContent).toBe('Nieuwe klant');
  });

  it('openKlantModalNew reset het formulier (lege bedrijfsnaam)', () => {
    initKlantModal();
    openKlantModalNew();
    const input = document.querySelector('#klant-modal [name="bedrijfsnaam"]');
    input.value = 'oude waarde';
    openKlantModalNew();
    expect(input.value).toBe('');
  });

  it('toggle "zelfde als locatie" is default aangevinkt', () => {
    initKlantModal();
    openKlantModalNew();
    const toggle = document.querySelector('#klant-modal [name="opdrachtgever_zelfde_als_locatie"]');
    expect(toggle.checked).toBe(true);
  });

  it('opdrachtgever-velden zijn verborgen wanneer toggle aan staat', () => {
    initKlantModal();
    openKlantModalNew();
    const fields = document.querySelector('#klant-modal .opdrachtgever-fields');
    expect(fields.style.display).toBe('none');
  });

  it('opdrachtgever-velden worden zichtbaar wanneer toggle wordt uitgezet', () => {
    initKlantModal();
    openKlantModalNew();
    const toggle = document.querySelector('#klant-modal [name="opdrachtgever_zelfde_als_locatie"]');
    toggle.checked = false;
    toggle.dispatchEvent(new Event('change'));
    const fields = document.querySelector('#klant-modal .opdrachtgever-fields');
    expect(fields.style.display).toBe('');
  });
});

describe('klant-modal — open edit', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    localStorage.clear();
    _resetForTests();
  });

  it('openKlantModalEdit titel = "Klant bewerken"', () => {
    initKlantModal();
    openKlantModalEdit({ id: 'x', bedrijfsnaam: 'Test', opdrachtgever_zelfde_als_locatie: true });
    expect(document.querySelector('.modal-title').textContent).toBe('Klant bewerken');
  });

  it('openKlantModalEdit vult bestaande velden in', () => {
    initKlantModal();
    openKlantModalEdit({
      id: 'x',
      bedrijfsnaam: 'Uniper Leiden',
      adres: 'Industrieweg 1',
      postcode_plaats: '2316 EX Leiden',
      contactpersoon: 'J. Smit',
      opdrachtgever_zelfde_als_locatie: true,
      opdrachtgever_telefoon: '071-1234567'
    });
    expect(document.querySelector('[name="bedrijfsnaam"]').value).toBe('Uniper Leiden');
    expect(document.querySelector('[name="adres"]').value).toBe('Industrieweg 1');
    expect(document.querySelector('[name="opdrachtgever_telefoon"]').value).toBe('071-1234567');
  });

  it('toont opdrachtgever-velden bij edit van klant met zelfde=false', () => {
    initKlantModal();
    openKlantModalEdit({
      id: 'x',
      bedrijfsnaam: 'A',
      opdrachtgever_zelfde_als_locatie: false,
      opdrachtgever_bedrijfsnaam: 'Holding A'
    });
    const fields = document.querySelector('.opdrachtgever-fields');
    expect(fields.style.display).toBe('');
    expect(document.querySelector('[name="opdrachtgever_bedrijfsnaam"]').value).toBe('Holding A');
  });
});
```

- [ ] **Step 3.2: Run tests — verify FAIL**

```bash
npm test -- tests/klant-modal.test.js 2>&1 | tail -10
```

Expected: module not found.

- [ ] **Step 3.3: Create `js/klant-modal.js`**

```js
import { openModal, closeModal, bindModalClose } from './modal.js';
import { loadDb, saveDb, addKlant, updateKlant } from './database.js';

const MODAL_HTML = `
<div class="modal" id="klant-modal" aria-hidden="true">
  <div class="modal-backdrop"></div>
  <div class="modal-dialog">
    <header class="modal-header">
      <h2 class="modal-title">Nieuwe klant</h2>
      <button type="button" class="modal-close" data-modal-close aria-label="Sluiten">×</button>
    </header>
    <div class="modal-body">
      <form id="klant-form">
        <fieldset>
          <legend>Locatie</legend>
          <div class="field">
            <label class="field-label">Bedrijfsnaam *</label>
            <input class="field-input" type="text" name="bedrijfsnaam" required>
          </div>
          <div class="field">
            <label class="field-label">Adres</label>
            <input class="field-input" type="text" name="adres">
          </div>
          <div class="field">
            <label class="field-label">Postcode / Plaats</label>
            <input class="field-input" type="text" name="postcode_plaats">
          </div>
          <div class="field">
            <label class="field-label">Contactpersoon</label>
            <input class="field-input" type="text" name="contactpersoon">
          </div>
        </fieldset>
        <fieldset>
          <legend>Opdrachtgever</legend>
          <label class="checkbox-label">
            <input type="checkbox" name="opdrachtgever_zelfde_als_locatie" checked>
            <span>Zelfde als locatie</span>
          </label>
          <div class="opdrachtgever-fields">
            <div class="field">
              <label class="field-label">Bedrijfsnaam</label>
              <input class="field-input" type="text" name="opdrachtgever_bedrijfsnaam">
            </div>
            <div class="field">
              <label class="field-label">Adres</label>
              <input class="field-input" type="text" name="opdrachtgever_adres">
            </div>
            <div class="field">
              <label class="field-label">Postcode / Plaats</label>
              <input class="field-input" type="text" name="opdrachtgever_postcode_plaats">
            </div>
            <div class="field">
              <label class="field-label">Contactpersoon</label>
              <input class="field-input" type="text" name="opdrachtgever_contactpersoon">
            </div>
          </div>
          <div class="field">
            <label class="field-label">Telefoon</label>
            <input class="field-input" type="tel" name="opdrachtgever_telefoon">
          </div>
        </fieldset>
      </form>
    </div>
    <footer class="modal-footer">
      <button type="button" class="btn btn-secondary" data-modal-close>Annuleer</button>
      <button type="button" class="btn btn-primary" id="klant-modal-save">Opslaan</button>
    </footer>
  </div>
</div>
`;

let modalEl = null;
let editingKlantId = null;
let onSaveCallback = null;

function getEl(sel) {
  return modalEl ? modalEl.querySelector(sel) : null;
}

function updateOpdrachtgeverVisibility() {
  const toggle = getEl('[name="opdrachtgever_zelfde_als_locatie"]');
  const fields = getEl('.opdrachtgever-fields');
  if (toggle && fields) {
    fields.style.display = toggle.checked ? 'none' : '';
  }
}

export function initKlantModal(onSave) {
  if (modalEl) return; // singleton
  const div = document.createElement('div');
  div.innerHTML = MODAL_HTML.trim();
  modalEl = div.firstElementChild;
  document.body.appendChild(modalEl);
  bindModalClose(modalEl);

  getEl('[name="opdrachtgever_zelfde_als_locatie"]').addEventListener('change', updateOpdrachtgeverVisibility);

  getEl('#klant-modal-save').addEventListener('click', handleSave);

  onSaveCallback = onSave;
}

function handleSave() {
  const form = getEl('#klant-form');
  const formData = new FormData(form);
  const data = Object.fromEntries(formData);
  const toggle = getEl('[name="opdrachtgever_zelfde_als_locatie"]');
  data.opdrachtgever_zelfde_als_locatie = !!toggle.checked;

  if (!data.bedrijfsnaam || !data.bedrijfsnaam.trim()) {
    alert('Bedrijfsnaam is verplicht');
    return;
  }

  let db = loadDb();
  if (editingKlantId) {
    db = updateKlant(db, editingKlantId, data);
  } else {
    db = addKlant(db, data);
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

export function openKlantModalNew() {
  if (!modalEl) throw new Error('initKlantModal must be called first');
  editingKlantId = null;
  getEl('.modal-title').textContent = 'Nieuwe klant';
  getEl('#klant-form').reset();
  getEl('[name="opdrachtgever_zelfde_als_locatie"]').checked = true;
  updateOpdrachtgeverVisibility();
  openModal(modalEl);
}

const KLANT_FIELDS = [
  'bedrijfsnaam', 'adres', 'postcode_plaats', 'contactpersoon',
  'opdrachtgever_bedrijfsnaam', 'opdrachtgever_adres',
  'opdrachtgever_postcode_plaats', 'opdrachtgever_contactpersoon',
  'opdrachtgever_telefoon'
];

export function openKlantModalEdit(klant) {
  if (!modalEl) throw new Error('initKlantModal must be called first');
  editingKlantId = klant.id;
  getEl('.modal-title').textContent = 'Klant bewerken';
  const form = getEl('#klant-form');
  form.reset();
  KLANT_FIELDS.forEach(f => {
    const input = form.querySelector(`[name="${f}"]`);
    if (input) input.value = klant[f] || '';
  });
  getEl('[name="opdrachtgever_zelfde_als_locatie"]').checked = !!klant.opdrachtgever_zelfde_als_locatie;
  updateOpdrachtgeverVisibility();
  openModal(modalEl);
}

// Test helper — alleen voor unit tests, niet voor productie-gebruik
export function _resetForTests() {
  if (modalEl && modalEl.parentNode) {
    modalEl.parentNode.removeChild(modalEl);
  }
  modalEl = null;
  editingKlantId = null;
  onSaveCallback = null;
}
```

- [ ] **Step 3.4: Run tests — verify PASS**

```bash
npm test 2>&1 | tail -10
```

Expected: 200 passed (190 + 10 new).

- [ ] **Step 3.5: Commit**

```bash
git add js/klant-modal.js tests/klant-modal.test.js
git commit -m "$(cat <<'EOF'
feat(klant-modal): toevoegen en bewerken via modal-dialog

Singleton modal die hergebruikt wordt voor zowel 'Nieuwe klant' als
'Klant bewerken'. Toggle 'Zelfde als locatie' verbergt opdrachtgever-
velden. Opslaan roept database.addKlant of database.updateKlant aan
en triggert callback voor dropdown-refresh.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: Pure helpers — `applyKlantToState` + `isLocatieFilled`

**Files:**
- Create: `js/dropdown-binding.js`
- Create: `tests/dropdown-binding.test.js`

- [ ] **Step 4.1: Write failing tests in new `tests/dropdown-binding.test.js`**

```js
import { describe, it, expect } from 'vitest';
import { applyKlantToState, isLocatieFilled } from '../js/dropdown-binding.js';
import { createState } from '../js/state.js';

describe('isLocatieFilled', () => {
  it('false bij lege state', () => {
    expect(isLocatieFilled(createState())).toBe(false);
  });

  it('true bij ingevulde bedrijfsnaam', () => {
    const s = createState();
    s.locatie.bedrijfsnaam = 'Test BV';
    expect(isLocatieFilled(s)).toBe(true);
  });

  it('true bij ingevuld adres (zonder bedrijfsnaam)', () => {
    const s = createState();
    s.locatie.adres = 'Industrieweg 1';
    expect(isLocatieFilled(s)).toBe(true);
  });

  it('false bij alleen spaties', () => {
    const s = createState();
    s.locatie.bedrijfsnaam = '   ';
    expect(isLocatieFilled(s)).toBe(false);
  });
});

describe('applyKlantToState — zelfde als locatie', () => {
  it('kopieert locatie-velden naar state.locatie', () => {
    const s = createState();
    const klant = {
      id: 'test',
      bedrijfsnaam: 'Uniper Leiden',
      adres: 'Industrieweg 1',
      postcode_plaats: '2316 EX Leiden',
      contactpersoon: 'J. Smit',
      opdrachtgever_zelfde_als_locatie: true,
      opdrachtgever_telefoon: '071-1234567'
    };
    applyKlantToState(klant, s);
    expect(s.locatie.bedrijfsnaam).toBe('Uniper Leiden');
    expect(s.locatie.adres).toBe('Industrieweg 1');
    expect(s.locatie.postcode_plaats).toBe('2316 EX Leiden');
    expect(s.locatie.contactpersoon).toBe('J. Smit');
  });

  it('bij zelfde=true: opdrachtgever-velden = locatie-velden', () => {
    const s = createState();
    const klant = {
      bedrijfsnaam: 'A',
      adres: 'B',
      postcode_plaats: 'C',
      contactpersoon: 'D',
      opdrachtgever_zelfde_als_locatie: true,
      opdrachtgever_telefoon: '0123'
    };
    applyKlantToState(klant, s);
    expect(s.opdrachtgever.bedrijfsnaam).toBe('A');
    expect(s.opdrachtgever.adres).toBe('B');
    expect(s.opdrachtgever.postcode_plaats).toBe('C');
    expect(s.opdrachtgever.contactpersoon).toBe('D');
    expect(s.opdrachtgever.telefoon).toBe('0123');
  });
});

describe('applyKlantToState — afwijkende opdrachtgever', () => {
  it('kopieert opdrachtgever-velden uit opdrachtgever_*-prefix', () => {
    const s = createState();
    const klant = {
      bedrijfsnaam: 'Uniper Leiden',
      adres: 'Industrieweg 1',
      postcode_plaats: '2316 EX Leiden',
      contactpersoon: 'J. Smit',
      opdrachtgever_zelfde_als_locatie: false,
      opdrachtgever_bedrijfsnaam: 'Uniper Holding NL',
      opdrachtgever_adres: 'Hoofdkantoor 1',
      opdrachtgever_postcode_plaats: '1000 AA Amsterdam',
      opdrachtgever_contactpersoon: 'P. Janssen',
      opdrachtgever_telefoon: '020-9876543'
    };
    applyKlantToState(klant, s);
    expect(s.opdrachtgever.bedrijfsnaam).toBe('Uniper Holding NL');
    expect(s.opdrachtgever.adres).toBe('Hoofdkantoor 1');
    expect(s.opdrachtgever.postcode_plaats).toBe('1000 AA Amsterdam');
    expect(s.opdrachtgever.contactpersoon).toBe('P. Janssen');
    expect(s.opdrachtgever.telefoon).toBe('020-9876543');
  });

  it('locatie blijft Uniper Leiden ook bij afwijkende opdrachtgever', () => {
    const s = createState();
    const klant = {
      bedrijfsnaam: 'Uniper Leiden',
      opdrachtgever_zelfde_als_locatie: false,
      opdrachtgever_bedrijfsnaam: 'Holding'
    };
    applyKlantToState(klant, s);
    expect(s.locatie.bedrijfsnaam).toBe('Uniper Leiden');
  });
});
```

- [ ] **Step 4.2: Run tests — verify FAIL**

```bash
npm test -- tests/dropdown-binding.test.js 2>&1 | tail -10
```

Expected: module not found.

- [ ] **Step 4.3: Create `js/dropdown-binding.js` with pure helpers only**

```js
import { setField } from './state.js';

const KLANT_VELDEN = ['bedrijfsnaam', 'adres', 'postcode_plaats', 'contactpersoon'];

export function isLocatieFilled(state) {
  return KLANT_VELDEN.some(f => {
    const v = state.locatie[f];
    return typeof v === 'string' && v.trim() !== '';
  });
}

export function applyKlantToState(klant, state) {
  KLANT_VELDEN.forEach(f => setField(state, `locatie.${f}`, klant[f] || ''));
  setField(state, 'opdrachtgever.telefoon', klant.opdrachtgever_telefoon || '');
  if (klant.opdrachtgever_zelfde_als_locatie) {
    KLANT_VELDEN.forEach(f => setField(state, `opdrachtgever.${f}`, klant[f] || ''));
  } else {
    KLANT_VELDEN.forEach(f => setField(state, `opdrachtgever.${f}`, klant[`opdrachtgever_${f}`] || ''));
  }
}
```

- [ ] **Step 4.4: Run tests — verify PASS**

```bash
npm test 2>&1 | tail -10
```

Expected: 209 passed (200 + 9).

- [ ] **Step 4.5: Commit**

```bash
git add js/dropdown-binding.js tests/dropdown-binding.test.js
git commit -m "$(cat <<'EOF'
feat(dropdown): pure helpers applyKlantToState + isLocatieFilled

Twee pure functies die de mapping verzorgen van een klant-record
uit de database naar state.locatie + state.opdrachtgever. Toggle
'zelfde als locatie' wordt gerespecteerd: bij true kopieren we
de locatie-velden ook naar opdrachtgever; bij false gebruiken we
de opdrachtgever_*-prefix velden.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: Dropdown-binding — DOM events + database-integratie

**Files:**
- Modify: `js/dropdown-binding.js`
- Modify: `tests/dropdown-binding.test.js`

- [ ] **Step 5.1: Write failing DOM-integration tests**

Append to `tests/dropdown-binding.test.js`:

```js
import { refreshKlantDropdown, bindKlantDropdown, _resetGlobalEscListener } from '../js/dropdown-binding.js';
import { saveDb } from '../js/database.js';

function makeContainer() {
  const c = document.createElement('div');
  c.innerHTML = `
    <select data-picker="klant">
      <option value="">— kies klant —</option>
    </select>
    <button data-action="klant-new">+</button>
    <button data-action="klant-edit" disabled>✎</button>
    <button data-action="klant-delete" disabled>🗑</button>
  `;
  return c;
}

describe('refreshKlantDropdown', () => {
  beforeEach(() => localStorage.clear());

  it('vult dropdown met alle klanten uit database', () => {
    saveDb({
      versie: 1,
      klanten: [
        { id: 'a', bedrijfsnaam: 'A BV' },
        { id: 'b', bedrijfsnaam: 'B BV' }
      ],
      voorzieningen: []
    });
    const container = makeContainer();
    refreshKlantDropdown(container);
    const select = container.querySelector('[data-picker="klant"]');
    const options = [...select.querySelectorAll('option')];
    expect(options).toHaveLength(3); // placeholder + 2 klanten
    expect(options[1].textContent).toBe('A BV');
    expect(options[2].textContent).toBe('B BV');
  });

  it('behoudt huidige selectie na refresh als die nog bestaat', () => {
    saveDb({
      versie: 1,
      klanten: [{ id: 'x', bedrijfsnaam: 'X' }],
      voorzieningen: []
    });
    const container = makeContainer();
    refreshKlantDropdown(container);
    container.querySelector('[data-picker="klant"]').value = 'x';
    refreshKlantDropdown(container);
    expect(container.querySelector('[data-picker="klant"]').value).toBe('x');
  });
});

describe('bindKlantDropdown — keuze-flow', () => {
  beforeEach(() => {
    localStorage.clear();
    _resetGlobalEscListener();
  });

  it('bij keuze: edit + delete worden enabled', () => {
    saveDb({
      versie: 1,
      klanten: [{ id: 'a', bedrijfsnaam: 'A', opdrachtgever_zelfde_als_locatie: true }],
      voorzieningen: []
    });
    const container = makeContainer();
    const state = createState();
    bindKlantDropdown(container, state);
    const select = container.querySelector('[data-picker="klant"]');
    select.value = 'a';
    select.dispatchEvent(new Event('change'));
    expect(container.querySelector('[data-action="klant-edit"]').disabled).toBe(false);
    expect(container.querySelector('[data-action="klant-delete"]').disabled).toBe(false);
  });

  it('bij keuze: state.locatie wordt gevuld', () => {
    saveDb({
      versie: 1,
      klanten: [{
        id: 'a', bedrijfsnaam: 'Test BV', adres: 'Straat 1',
        opdrachtgever_zelfde_als_locatie: true
      }],
      voorzieningen: []
    });
    const container = makeContainer();
    const state = createState();
    bindKlantDropdown(container, state);
    const select = container.querySelector('[data-picker="klant"]');
    select.value = 'a';
    select.dispatchEvent(new Event('change'));
    expect(state.locatie.bedrijfsnaam).toBe('Test BV');
    expect(state.locatie.adres).toBe('Straat 1');
  });

  it('bij keuze met gevulde locatie: confirm-dialog gevraagd', () => {
    saveDb({
      versie: 1,
      klanten: [{ id: 'a', bedrijfsnaam: 'Nieuw', opdrachtgever_zelfde_als_locatie: true }],
      voorzieningen: []
    });
    const container = makeContainer();
    const state = createState();
    state.locatie.bedrijfsnaam = 'Bestaand';
    bindKlantDropdown(container, state);

    let confirmCalled = false;
    const origConfirm = window.confirm;
    window.confirm = () => { confirmCalled = true; return false; };
    try {
      const select = container.querySelector('[data-picker="klant"]');
      select.value = 'a';
      select.dispatchEvent(new Event('change'));
      expect(confirmCalled).toBe(true);
      // Bij annuleren: state niet overschreven
      expect(state.locatie.bedrijfsnaam).toBe('Bestaand');
    } finally {
      window.confirm = origConfirm;
    }
  });

  it('bij keuze met gevulde locatie + confirm OK: state wel overschreven', () => {
    saveDb({
      versie: 1,
      klanten: [{ id: 'a', bedrijfsnaam: 'Nieuw', opdrachtgever_zelfde_als_locatie: true }],
      voorzieningen: []
    });
    const container = makeContainer();
    const state = createState();
    state.locatie.bedrijfsnaam = 'Bestaand';
    bindKlantDropdown(container, state);

    const origConfirm = window.confirm;
    window.confirm = () => true;
    try {
      const select = container.querySelector('[data-picker="klant"]');
      select.value = 'a';
      select.dispatchEvent(new Event('change'));
      expect(state.locatie.bedrijfsnaam).toBe('Nieuw');
    } finally {
      window.confirm = origConfirm;
    }
  });
});
```

- [ ] **Step 5.2: Run tests — verify FAIL**

```bash
npm test -- tests/dropdown-binding.test.js 2>&1 | tail -15
```

Expected: 7 failures — refreshKlantDropdown/bindKlantDropdown not exported.

- [ ] **Step 5.3: Extend `js/dropdown-binding.js` with DOM-binding**

Append to `js/dropdown-binding.js`:

```js
import { loadDb, saveDb, deleteKlant, getVoorzieningenVoor } from './database.js';

export function refreshKlantDropdown(container) {
  const select = container.querySelector('[data-picker="klant"]');
  if (!select) return;
  const currentValue = select.value;
  const db = loadDb();
  select.innerHTML = '<option value="">— kies klant —</option>';
  db.klanten.forEach(k => {
    const opt = document.createElement('option');
    opt.value = k.id;
    opt.textContent = k.bedrijfsnaam;
    select.appendChild(opt);
  });
  if (db.klanten.some(k => k.id === currentValue)) {
    select.value = currentValue;
  }
}

export function bindKlantDropdown(container, state, syncDom) {
  refreshKlantDropdown(container);
  const select = container.querySelector('[data-picker="klant"]');
  const editBtn = container.querySelector('[data-action="klant-edit"]');
  const deleteBtn = container.querySelector('[data-action="klant-delete"]');

  select.addEventListener('change', () => {
    const klantId = select.value;
    if (!klantId) {
      editBtn.disabled = true;
      deleteBtn.disabled = true;
      return;
    }
    const db = loadDb();
    const klant = db.klanten.find(k => k.id === klantId);
    if (!klant) return;
    if (isLocatieFilled(state)) {
      const ok = confirm(`Velden zijn al ingevuld. Overschrijven met data van "${klant.bedrijfsnaam}"?`);
      if (!ok) {
        select.value = '';
        editBtn.disabled = true;
        deleteBtn.disabled = true;
        return;
      }
    }
    applyKlantToState(klant, state);
    if (syncDom) syncDom();
    editBtn.disabled = false;
    deleteBtn.disabled = false;
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
    editBtn.disabled = true;
    deleteBtn.disabled = true;
  });
}

// Test helper — alleen voor unit tests
export function _resetGlobalEscListener() {
  // placeholder — momenteel geen globale listeners om te resetten
}
```

Update the top imports section by adding `createState` import in the test file. Verify the existing test file already has it; if not, add it.

In `tests/dropdown-binding.test.js`, ensure this line exists at the top:

```js
import { createState } from '../js/state.js';
```

- [ ] **Step 5.4: Run tests — verify PASS**

```bash
npm test 2>&1 | tail -10
```

Expected: 216 passed (209 + 7).

- [ ] **Step 5.5: Commit**

```bash
git add js/dropdown-binding.js tests/dropdown-binding.test.js
git commit -m "$(cat <<'EOF'
feat(dropdown): klant-dropdown event-handlers + delete met cascade-warning

refreshKlantDropdown laadt klanten uit localStorage en behoudt
huidige selectie indien nog geldig. bindKlantDropdown vraagt
'overschrijven?' bevestiging als velden al gevuld zijn. Delete
toont cascade-waarschuwing met aantal voorzieningen.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 6: CSS styling voor modal + entity-picker

**Files:**
- Modify: `css/styles.css`

- [ ] **Step 6.1: Append CSS to `css/styles.css`**

Add at the end of the file:

```css
/* Entity-picker (klant + voorziening dropdowns in sectie 1) */
.entity-picker {
  background: var(--blue-bg);
  border-radius: 6px;
  padding: 12px;
  margin-bottom: 16px;
  border-left: 3px solid var(--blue);
}
.entity-picker-row {
  display: grid;
  grid-template-columns: 100px 1fr auto auto auto;
  gap: 8px;
  align-items: center;
  margin-bottom: 8px;
}
.entity-picker-row:last-child { margin-bottom: 0; }
.entity-picker-label {
  font-weight: 600;
  color: var(--blue);
  font-size: 13px;
}
.entity-picker-select {
  width: 100%;
}
.btn-icon {
  width: 36px;
  height: 36px;
  border: 1px solid var(--grey-mid);
  background: white;
  border-radius: 4px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  color: var(--blue);
  transition: all 0.15s;
}
.btn-icon:hover:not(:disabled) {
  background: var(--blue);
  color: white;
  border-color: var(--blue);
}
.btn-icon:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
@media (max-width: 768px) {
  .entity-picker-row {
    grid-template-columns: 1fr;
    gap: 4px;
  }
  .entity-picker-label { font-size: 14px; }
}

/* Modal */
.modal {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: none;
  align-items: center;
  justify-content: center;
}
.modal.modal-open {
  display: flex;
}
.modal-backdrop {
  position: absolute;
  inset: 0;
  background: rgba(26, 43, 63, 0.5);
}
.modal-dialog {
  position: relative;
  background: white;
  border-radius: 8px;
  max-width: 600px;
  width: 90%;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.25);
  overflow: hidden;
}
.modal-header {
  padding: 16px 20px;
  background: var(--blue);
  color: white;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.modal-title {
  font-size: 16px;
  font-weight: 600;
  margin: 0;
}
.modal-close {
  background: transparent;
  border: none;
  color: white;
  font-size: 24px;
  cursor: pointer;
  padding: 0 4px;
  line-height: 1;
}
.modal-body {
  padding: 16px 20px;
  overflow-y: auto;
  flex: 1;
}
.modal-body fieldset {
  margin-bottom: 16px;
}
.modal-body fieldset:last-child {
  margin-bottom: 0;
}
.modal-footer {
  padding: 12px 20px;
  border-top: 1px solid var(--grey-mid);
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}
.modal-footer .btn {
  flex: 0 0 auto;
  min-width: 120px;
}
.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  margin-bottom: 12px;
  cursor: pointer;
}
.checkbox-label input[type="checkbox"] {
  width: 18px;
  height: 18px;
}
.no-scroll {
  overflow: hidden;
}
@media (max-width: 768px) {
  .modal-dialog {
    width: 100%;
    height: 100%;
    max-height: 100vh;
    border-radius: 0;
  }
}
```

- [ ] **Step 6.2: Verify CSS doesn't break tests**

```bash
npm test 2>&1 | tail -5
```

Expected: still 216 passed (CSS doesn't affect tests).

- [ ] **Step 6.3: Commit**

```bash
git add css/styles.css
git commit -m "$(cat <<'EOF'
style(css): entity-picker + modal styling

Entity-picker krijgt eigen blok bovenaan sectie 1 met lichtblauwe
achtergrond en blue-left-border. Modal heeft donker overlay, witte
dialog met blue header. Mobile: full-screen modal.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 7: main.js integratie + browser smoke-test

**Files:**
- Modify: `js/main.js`

- [ ] **Step 7.1: Update `js/main.js` to wire modal + dropdown**

Add imports near the top (after existing imports):

```js
import { initKlantModal } from './klant-modal.js';
import { bindKlantDropdown, refreshKlantDropdown } from './dropdown-binding.js';
```

After the line `renderSection1Projectgegevens(sectiesContainer, state);` and AFTER all other render calls (so the DOM exists), add:

```js
// --- Fase 3: Klanten-UI ---

initKlantModal((newDb) => {
  // Na opslaan in modal: dropdown verversen
  refreshKlantDropdown(sectiesContainer);
});

bindKlantDropdown(sectiesContainer, state, syncDomFromState);

// Wire "+ Nieuw klant" en "✎ Bewerken" knoppen
sectiesContainer.querySelector('[data-action="klant-new"]').addEventListener('click', () => {
  openKlantModalNew();
});
sectiesContainer.querySelector('[data-action="klant-edit"]').addEventListener('click', () => {
  const klantId = sectiesContainer.querySelector('[data-picker="klant"]').value;
  if (!klantId) return;
  const db = loadDb();
  const klant = db.klanten.find(k => k.id === klantId);
  if (klant) openKlantModalEdit(klant);
});
```

Also add to the imports block:

```js
import { openKlantModalNew, openKlantModalEdit } from './klant-modal.js';
import { loadDb } from './database.js';
```

(Combine with the earlier `initKlantModal` import — one line per import statement is fine.)

- [ ] **Step 7.2: Run tests — verify still 216 passed**

```bash
npm test 2>&1 | tail -5
```

Expected: 216 passed (no new tests but no regressions).

- [ ] **Step 7.3: Browser smoke-test (manual)**

Start the dev-server:

```bash
cd "C:/Users/Maurice van Anraat/Documents/.claudeV2/projects/symitech/NEN_EN858_2-v2" && py -m http.server 8766
```

(Use `run_in_background: true` for the Bash tool.)

Open Firefox to `http://localhost:8766/NEN-EN-858-2%20controle%20formulier.html`.

Maurice verifies manually:
- Bovenaan sectie 1 staan klant + voorziening dropdowns met knoppen
- Klik op "+" naast klant → modal opent met "Nieuwe klant"
- "Zelfde als locatie"-checkbox staat default aangevinkt, opdrachtgever-velden zijn verborgen
- Uitvinken → opdrachtgever-velden zichtbaar
- Vul bedrijfsnaam in (bijv. "Uniper Leiden"), klik Opslaan
- Modal sluit, dropdown bevat nu "Uniper Leiden"
- Kies "Uniper Leiden" → bedrijfsnaam, adres etc. in sectie 1 worden gevuld
- "✎" wordt enabled, klik → modal opent met velden gevuld
- "🗑" verwijdert klant na bevestiging
- ESC en backdrop-click sluiten modal

- [ ] **Step 7.4: Stop dev-server**

KillBash with the task ID from Step 7.3.

- [ ] **Step 7.5: Commit**

```bash
git add js/main.js
git commit -m "$(cat <<'EOF'
feat(main): wire klant-modal + dropdown in app-init

initKlantModal wordt aangeroepen na render, bindKlantDropdown
luistert op keuze/edit/delete events. '+' en '✎' knoppen openen
modal in respectievelijk nieuw- en bewerk-modus.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 8: STATUS-update + Definition of Done

**Files:**
- Modify: `STATUS.md`

- [ ] **Step 8.1: Overwrite STATUS.md**

Replace `STATUS.md` content with:

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

## UX-fix: Photo-knoppen splitsen (camera + upload) ✓ 2026-05-18

Tussen fase 1 en 2: `js/photos.js` split de single "+"-knop in een 📷-camera-knop (`capture="environment"`) en een 🖼️-upload-knop (`multiple`). Reden: `multiple` + `capture` werken niet samen op iOS Safari.

- 5 nieuwe DOM-tests in `tests/photos.test.js`
- Totaal: 134 tests groen

## Fase 2 — Database-laag ✓ Afgerond op 2026-05-18

Resultaat:
- Nieuwe module `js/database.js` met 13 exports (CRUD + helpers + sync)
- Pure-function design: immutable db-object in, nieuwe out
- localStorage-persist met versionering (key `nen858-database`, versie 1)
- Slug-generatie + auto-suffix bij id-collision
- Cascade-delete bij verwijderen klant (voorzieningen mee)
- Export/import JSON met `vervang` en `samenvoegen` modes
- User-friendly error bij quota-overschrijding
- 44 nieuwe unit tests in `tests/database.test.js` — totaal 178 groen

## Fase 3 — UI Klantenbeheer ✓ Afgerond op 2026-05-18

Resultaat:
- Sectie 1 uitgebreid met entity-picker: klant-dropdown + voorziening-dropdown (placeholder) met +/✎/🗑 knoppen
- Nieuwe module `js/modal.js` — generieke open/close + backdrop + Esc-key
- Nieuwe module `js/klant-modal.js` — toevoegen + bewerken met "zelfde als locatie"-toggle
- Nieuwe module `js/dropdown-binding.js` — pure helpers (`applyKlantToState`, `isLocatieFilled`) + DOM event-binding
- "Overschrijf?"-bevestiging bij al-ingevulde locatie-velden
- Cascade-warning bij delete van klant met voorzieningen
- CSS: entity-picker blok + modal + checkbox-label
- ~30 nieuwe tests verspreid over modal/klant-modal/dropdown-binding/form-render — totaal ~216 groen

## Volgende fase

Fase 4 — UI Voorzieningenbeheer (dropdown gefilterd op klant + modal voor toevoegen). Zie spec sectie 6.
```

- [ ] **Step 8.2: Commit**

```bash
git add STATUS.md
git commit -m "$(cat <<'EOF'
docs: mark fase 3 als afgerond in STATUS.md

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

- [ ] **Step 8.3: Definition of Done check**

```bash
cd "C:/Users/Maurice van Anraat/Documents/.claudeV2/projects/symitech/NEN_EN858_2-v2"
npm test 2>&1 | tail -10
git log --oneline | head -12
```

Expected:
- ~216 tests passed (5+ test files)
- 8+ commits on `main` for fase 3 (Tasks 1-8)
- Working tree clean

---

## Risico's en mitigaties

| Risico | Mitigatie |
|--------|-----------|
| Modal blokkeert achterliggende UI maar oude data blijft zichtbaar bij heropenen | `_resetForTests` helper voor unit-tests; productie-flow reset altijd via `openKlantModalNew`/`openKlantModalEdit` |
| `confirm()` browser-popup is lelijk — UX-zorg | OK voor MVP; vervangbaar door eigen dialog in toekomstige fase |
| Dropdown lijst wordt traag bij >100 klanten | Out of scope (spec niet-doelen); alfabetische sortering wel meegenomen via plain string compare |
| State-overschrijven schrikt gebruiker af | Confirm-dialog vermijdt silent data-loss; test 5.3 dekt cancel-flow |
| Verwijderen klant met veel voorzieningen wist data ongezien | Cascade-warning toont expliciet aantal voorzieningen vóór bevestiging |

---

## Niet in deze fase

- **Voorziening-dropdown functionality** — knoppen zijn disabled, alleen placeholder rendered. Komt in fase 4.
- **Klant-zoekfunctie / filter** — out of scope
- **Klanten alfabetisch sorteren** — out of scope (volgorde = volgorde van toevoegen via aangemaakt-veld)
- **Modal-animaties** — geen fade/slide, alleen show/hide
- **Inline-edit van klantgegevens in sectie 1** — alleen via modal
