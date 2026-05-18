import { describe, it, expect, beforeEach } from 'vitest';
import { applyKlantToState, isLocatieFilled, refreshKlantDropdown, bindKlantDropdown, _resetBindGuard, applyVoorzieningToState } from '../js/dropdown-binding.js';
import { createState } from '../js/state.js';
import { saveDb } from '../js/database.js';
import { _resetForTests as _resetModalEsc } from '../js/modal.js';

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
    _resetModalEsc();
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

import { resetInstallatieState, _resetVoorzieningBindGuard } from '../js/dropdown-binding.js';

describe('bindVoorzieningDropdown — delete reset installatie state', () => {
  it('reset state.installatie wanneer de geselecteerde voorziening wordt verwijderd', () => {
    const klantId = 'k-test';
    const voorzId = 'v-test';
    saveDb({
      versie: 1,
      klanten: [{ id: klantId, bedrijfsnaam: 'Test BV' }],
      voorzieningen: [{
        id: voorzId,
        klant_id: klantId,
        naam: 'Test installatie',
        merk: 'TestMerk',
        ns_klasse: 'I',
        capaciteit_l: 1000
      }]
    });

    const state = createState();
    state.installatie.merk = 'TestMerk';
    state.installatie.ns_klasse = 'I';
    state.installatie.capaciteit_l = 1000;

    const container = document.createElement('div');
    container.innerHTML = `
      <select data-picker="klant"><option value="${klantId}">Test BV</option></select>
      <button data-action="klant-edit" disabled></button>
      <button data-action="klant-delete" disabled></button>
      <select data-picker="voorziening"><option value="${voorzId}">Test installatie</option></select>
      <button data-action="voorziening-edit" disabled></button>
      <button data-action="voorziening-delete" disabled></button>
    `;
    document.body.appendChild(container);

    const klantSelect = container.querySelector('[data-picker="klant"]');
    klantSelect.value = klantId;
    const voorzSelect = container.querySelector('[data-picker="voorziening"]');
    voorzSelect.value = voorzId;
    container.querySelector('[data-action="voorziening-delete"]').disabled = false;

    let syncCalled = false;
    bindVoorzieningDropdown(container, state, () => { syncCalled = true; });

    const origConfirm = window.confirm;
    window.confirm = () => true;

    try {
      container.querySelector('[data-action="voorziening-delete"]').click();
      expect(state.installatie.merk).toBe('');
      expect(state.installatie.ns_klasse).toBe('');
      expect(state.installatie.capaciteit_l).toBe('');
      expect(syncCalled).toBe(true);
    } finally {
      window.confirm = origConfirm;
      document.body.removeChild(container);
    }
  });
});

describe('resetInstallatieState', () => {
  it('zet alle 12 installatie-velden terug naar lege string', () => {
    const s = createState();
    s.installatie.merk = 'ACO';
    s.installatie.type_bouwjaar = 'NSF-100';
    s.installatie.ns_klasse = 'I';
    s.installatie.capaciteit_l = '1000';
    s.installatie.type_lozing = 'Vrij verval riool';
    s.installatie.lozingsvergunning_kenmerk = 'WSL-123';

    resetInstallatieState(s);

    expect(s.installatie.merk).toBe('');
    expect(s.installatie.type_bouwjaar).toBe('');
    expect(s.installatie.ns_klasse).toBe('');
    expect(s.installatie.capaciteit_l).toBe('');
    expect(s.installatie.type_lozing).toBe('');
    expect(s.installatie.lozingsvergunning_kenmerk).toBe('');
  });
});
