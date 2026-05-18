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
