import { createState, exportJson, importJson } from './state.js';
import { buildDocDefinition } from './pdf-builder.js';
import {
  renderSection1Projectgegevens,
  renderSectionChecklistObas,
  renderSection2Metingen,
  renderSection3Functietesten,
  renderSection4Controleput,
  renderSection5LedigingBal,
  renderSection6Inwendig,
  renderSection7Lekdichtheid,
  renderSection8Coating,
  renderSection6Conclusie,
  bindIntervalSwitch
} from './form-render.js';
import { initPhotoSlots } from './photos.js';
import { populateTestData, isTestMode } from './test-data.js';
import { getField } from './state.js';
import { initKlantModal, openKlantModalNew, openKlantModalEdit } from './klant-modal.js';
import { initVoorzieningModal, openVoorzieningModalNew, openVoorzieningModalEdit } from './voorziening-modal.js';
import { bindKlantDropdown, refreshKlantDropdown, applyKlantToState, bindVoorzieningDropdown, refreshVoorzieningDropdown, applyVoorzieningToState, resetInstallatieState } from './dropdown-binding.js';
import { loadDb } from './database.js';

const state = createState();
if (isTestMode()) {
  populateTestData(state);
  console.log('[NEN-EN-858-2] Testdata geladen via ?test=true');
}
window.__inspectie = state; // debug-handle

// Synchroniseer alle DOM-inputs vanuit state (na bv. testdata laden of JSON import).
function syncDomFromState() {
  document.querySelectorAll('[data-field]').forEach(el => {
    const path = el.dataset.field;
    const value = getField(state, path);
    if (value != null) el.value = value;
  });
  document.querySelectorAll('input[type="radio"]').forEach(r => {
    if (!r.name) return;
    const value = getField(state, r.name);
    r.checked = (value === r.value);
  });
  // Re-trigger interval-switch zodat zichtbaarheid sectie 6/7/8 + BAL klopt
  const intervalRadio = document.querySelector(`input[name="interval"][value="${state.meta.interval}"]`);
  if (intervalRadio) {
    intervalRadio.checked = true;
    intervalRadio.dispatchEvent(new Event('change', { bubbles: true }));
  }
  // Re-trigger conditional fields (lekdichtheid testmethode, coating aanwezig)
  ['lekdichtheid.testmethode', 'coating.aanwezig'].forEach(name => {
    const value = getField(state, name);
    if (value) {
      const radio = document.querySelector(`input[name="${name}"][value="${value}"]`);
      if (radio) radio.dispatchEvent(new Event('change', { bubbles: true }));
    }
  });
  // Re-trigger meting auto-pct + advies-blok
  document.querySelectorAll('[data-meting-type]').forEach(el => {
    el.dispatchEvent(new Event('input', { bubbles: true }));
  });
  // Handtekening canvas opnieuw tekenen
  const canvas = document.getElementById('signature-canvas');
  if (canvas && state.conclusie.handtekening_dataurl) {
    const img = new Image();
    img.onload = () => canvas.getContext('2d').drawImage(img, 0, 0);
    img.src = state.conclusie.handtekening_dataurl;
  }
  // Re-render foto-slots (renderSlot is idempotent)
  initPhotoSlots(document, state);
}

const sectiesContainer = document.getElementById('form-secties');

renderSection1Projectgegevens(sectiesContainer, state);
renderSectionChecklistObas(sectiesContainer, state);
renderSection2Metingen(sectiesContainer, state);
renderSection3Functietesten(sectiesContainer, state);
renderSection4Controleput(sectiesContainer, state);
renderSection5LedigingBal(sectiesContainer, state);
renderSection6Inwendig(sectiesContainer, state);
renderSection7Lekdichtheid(sectiesContainer, state);
renderSection8Coating(sectiesContainer, state);
renderSection6Conclusie(sectiesContainer, state);

bindIntervalSwitch(document.body, state);

initPhotoSlots(sectiesContainer, state);

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
// + reset state.installatie zodat oude voorziening-data niet doorlekt naar PDF
bindKlantDropdown(sectiesContainer, state, syncDomFromState, (klantId) => {
  refreshVoorzieningDropdown(sectiesContainer, klantId);
  resetInstallatieState(state);
  syncDomFromState();
});

bindVoorzieningDropdown(sectiesContainer, state, syncDomFromState);

// Wire "+ Nieuw klant" en "✎ Bewerken" knoppen (fase 3)
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

// Wire "+ Nieuw voorziening" en "✎ Bewerken" knoppen (fase 4)
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

// --- Save / Load JSON ---

document.getElementById('btn-save').addEventListener('click', () => {
  const json = exportJson(state);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const projectnr = state.meta.projectnummer || 'concept';
  const datum = state.meta.rapportagedatum || new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `inspectie-${projectnr}-${datum}.json`;
  a.click();
  URL.revokeObjectURL(url);
});

document.getElementById('btn-load').addEventListener('click', () => {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'application/json';
  input.onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const text = await file.text();
      const loaded = importJson(text);
      Object.assign(state, loaded);
      location.reload();
    } catch (err) {
      console.error('importJson failed:', err);
      alert('Bestand kon niet geladen worden: ongeldige JSON-structuur of leesfout.');
    }
  };
  input.click();
});

// --- Testdata-knop (dev/demo) ---

document.getElementById('btn-testdata').addEventListener('click', () => {
  populateTestData(state);
  syncDomFromState();
  console.log('[NEN-EN-858-2] Testdata geladen via knop', state);
});

// --- PDF generatie ---

document.getElementById('btn-pdf').addEventListener('click', () => {
  const fotoSecties = ['installatie', 'metingen', 'controleput'];
  if (state.meta.interval === 'jaarlijks' || state.meta.interval === '5jaarlijks') {
    fotoSecties.push('inwendig_wanden', 'inwendig_schotten', 'inwendig_coalescentie',
                     'inwendig_afsluiter', 'inwendig_naden');
  }
  if (state.meta.interval === '5jaarlijks') {
    fotoSecties.push('lekdichtheid', 'coating');
  }
  const ontbrekend = fotoSecties.filter(k => !state.fotos[k]?.length);
  if (ontbrekend.length) {
    const ok = confirm(`Geen foto's bij: ${ontbrekend.join(', ')}.\n\nDoorgaan met PDF-rapport zonder deze foto's?`);
    if (!ok) return;
  }
  const dd = buildDocDefinition(state);
  const naam = `inspectie-${state.meta.projectnummer || 'rapport'}-${state.meta.rapportagedatum}.pdf`;
  pdfMake.createPdf(dd).download(naam);
});

console.log('[NEN-EN-858-2] Formulier geladen.', state);
