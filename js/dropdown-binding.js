import { setField } from './state.js';
import { loadDb, saveDb, deleteKlant, getVoorzieningenVoor } from './database.js';

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

const INSTALLATIE_VELDEN = [
  'merk', 'type_bouwjaar', 'ns_klasse', 'ns_ls',
  'capaciteit_l', 'mat_afdekking', 'inhoud_slibv_l', 'mat_opbouw',
  'inlaat_mm', 'uitlaat_mm',
  'type_lozing', 'lozingsvergunning_kenmerk'
];

export function applyVoorzieningToState(voorziening, state) {
  INSTALLATIE_VELDEN.forEach(f => setField(state, `installatie.${f}`, voorziening[f] || ''));
}

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

// bindKlantDropdown is niet idempotent — een tweede aanroep dupliceert listeners.
// Guard via dataset-marker zodat onbedoeld dubbel binden faalt-safe is.
export function bindKlantDropdown(container, state, syncDom) {
  if (container.dataset.klantDropdownBound === '1') return;
  container.dataset.klantDropdownBound = '1';

  refreshKlantDropdown(container);
  const select = container.querySelector('[data-picker="klant"]');
  const editBtn = container.querySelector('[data-action="klant-edit"]');
  const deleteBtn = container.querySelector('[data-action="klant-delete"]');

  // Tracker voor vorige selectie zodat cancel-flow daar naar terug kan keren.
  let previousValue = '';

  select.addEventListener('change', () => {
    const klantId = select.value;
    if (!klantId) {
      previousValue = '';
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
        // Terug naar vorige selectie ipv leegmaken — anders raakt state ↔ UI uit sync.
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
  });
}

// Test helper — reset idempotency-guard tussen tests
export function _resetBindGuard(container) {
  delete container.dataset.klantDropdownBound;
}

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
