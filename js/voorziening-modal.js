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

const VOORZIENING_FIELDS = [
  'naam', 'merk', 'type_bouwjaar', 'ns_klasse', 'ns_ls',
  'capaciteit_l', 'mat_afdekking', 'inhoud_slibv_l', 'mat_opbouw',
  'inlaat_mm', 'uitlaat_mm', 'type_lozing', 'lozingsvergunning_kenmerk'
];

let modalEl = null;
let editingVoorzieningId = null;
let currentKlantId = null;
let onSaveCallback = null;

function getEl(sel) {
  return modalEl ? modalEl.querySelector(sel) : null;
}

function fillKlantBadge(klantId) {
  const db = loadDb();
  const klant = db.klanten.find(k => k.id === klantId);
  const badge = getEl('.klant-badge');
  if (klant && badge) {
    badge.textContent = `Klant: ${klant.bedrijfsnaam}`;
  }
}

function setRadios(form) {
  form.querySelectorAll('input[type="radio"]').forEach(r => { r.checked = false; });
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
      const target = form.querySelector(`[name="${f}"][value="${voorziening[f] || ''}"]`);
      if (target) target.checked = true;
    } else {
      input.value = voorziening[f] || '';
    }
  });
  fillKlantBadge(voorziening.klant_id);
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
  let savedVoorzieningId;
  if (editingVoorzieningId) {
    db = updateVoorziening(db, editingVoorzieningId, data);
    savedVoorzieningId = editingVoorzieningId;
  } else {
    db = addVoorziening(db, data);
    savedVoorzieningId = db.voorzieningen[db.voorzieningen.length - 1].id;
  }
  try {
    saveDb(db);
  } catch (e) {
    alert(e.message);
    return;
  }
  closeModal(modalEl);
  if (onSaveCallback) onSaveCallback(db, savedVoorzieningId);
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
