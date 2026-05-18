import { describe, it, expect, beforeEach } from 'vitest';
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
