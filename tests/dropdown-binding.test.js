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
