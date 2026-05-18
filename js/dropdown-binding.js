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
