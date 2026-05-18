import { describe, it, expect, beforeEach } from 'vitest';
import { applyKlantToState, isLocatieFilled, refreshKlantDropdown, bindKlantDropdown, _resetBindGuard } from '../js/dropdown-binding.js';
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
