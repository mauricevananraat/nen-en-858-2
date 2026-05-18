import { describe, it, expect, beforeEach } from 'vitest';
import { initVoorzieningModal, openVoorzieningModalNew, _resetForTests } from '../js/voorziening-modal.js';
import { saveDb } from '../js/database.js';

describe('voorziening-modal — init + open new', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    localStorage.clear();
    _resetForTests();
  });

  it('initVoorzieningModal voegt modal aan document toe', () => {
    initVoorzieningModal();
    expect(document.getElementById('voorziening-modal')).toBeTruthy();
  });

  it('initVoorzieningModal is idempotent', () => {
    initVoorzieningModal();
    initVoorzieningModal();
    expect(document.querySelectorAll('#voorziening-modal')).toHaveLength(1);
  });

  it('openVoorzieningModalNew opent modal met titel "Nieuwe voorziening"', () => {
    saveDb({
      versie: 1,
      klanten: [{ id: 'uniper', bedrijfsnaam: 'Uniper Leiden' }],
      voorzieningen: []
    });
    initVoorzieningModal();
    openVoorzieningModalNew('uniper');
    const modal = document.getElementById('voorziening-modal');
    expect(modal.classList.contains('modal-open')).toBe(true);
    expect(modal.querySelector('.modal-title').textContent).toBe('Nieuwe voorziening');
  });

  it('openVoorzieningModalNew toont klant-bedrijfsnaam in read-only badge', () => {
    saveDb({
      versie: 1,
      klanten: [{ id: 'uniper', bedrijfsnaam: 'Uniper Leiden' }],
      voorzieningen: []
    });
    initVoorzieningModal();
    openVoorzieningModalNew('uniper');
    const badge = document.querySelector('#voorziening-modal .klant-badge');
    expect(badge).toBeTruthy();
    expect(badge.textContent).toContain('Uniper Leiden');
  });

  it('openVoorzieningModalNew reset het formulier', () => {
    saveDb({
      versie: 1,
      klanten: [{ id: 'uniper', bedrijfsnaam: 'Uniper' }],
      voorzieningen: []
    });
    initVoorzieningModal();
    openVoorzieningModalNew('uniper');
    const naam = document.querySelector('#voorziening-modal [name="naam"]');
    naam.value = 'oude waarde';
    openVoorzieningModalNew('uniper');
    expect(naam.value).toBe('');
  });

  it('heeft 12 installatie-velden + naam-veld', () => {
    saveDb({
      versie: 1,
      klanten: [{ id: 'uniper', bedrijfsnaam: 'Uniper' }],
      voorzieningen: []
    });
    initVoorzieningModal();
    openVoorzieningModalNew('uniper');
    const velden = [
      'naam', 'merk', 'type_bouwjaar', 'ns_klasse', 'ns_ls',
      'capaciteit_l', 'mat_afdekking', 'inhoud_slibv_l', 'mat_opbouw',
      'inlaat_mm', 'uitlaat_mm', 'type_lozing', 'lozingsvergunning_kenmerk'
    ];
    velden.forEach(v => {
      const el = document.querySelector(`#voorziening-modal [name="${v}"]`);
      expect(el, `veld "${v}" ontbreekt`).toBeTruthy();
    });
  });

  it('ns_klasse heeft radio I en II', () => {
    saveDb({
      versie: 1,
      klanten: [{ id: 'u', bedrijfsnaam: 'U' }],
      voorzieningen: []
    });
    initVoorzieningModal();
    openVoorzieningModalNew('u');
    expect(document.querySelector('[name="ns_klasse"][value="I"]')).toBeTruthy();
    expect(document.querySelector('[name="ns_klasse"][value="II"]')).toBeTruthy();
  });

  it('type_lozing heeft 3 radios', () => {
    saveDb({
      versie: 1,
      klanten: [{ id: 'u', bedrijfsnaam: 'U' }],
      voorzieningen: []
    });
    initVoorzieningModal();
    openVoorzieningModalNew('u');
    expect(document.querySelector('[name="type_lozing"][value="Vrij verval riool"]')).toBeTruthy();
    expect(document.querySelector('[name="type_lozing"][value="Oppervlaktewater"]')).toBeTruthy();
    expect(document.querySelector('[name="type_lozing"][value="Anders"]')).toBeTruthy();
  });
});
