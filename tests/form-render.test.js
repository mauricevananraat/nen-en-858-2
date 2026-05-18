import { describe, it, expect, beforeEach } from 'vitest';
import { renderSection1Projectgegevens } from '../js/form-render.js';
import { createState } from '../js/state.js';

describe('renderSection1Projectgegevens', () => {
  let container, state;
  beforeEach(() => {
    container = document.createElement('div');
    state = createState();
  });

  it('renders sectiekop "1. Projectgegevens"', () => {
    renderSection1Projectgegevens(container, state);
    expect(container.querySelector('.section-title').textContent).toContain('1. Projectgegevens');
  });

  it('renders inputs for locatie + opdrachtgever + inspectie + installatie', () => {
    renderSection1Projectgegevens(container, state);
    expect(container.querySelector('[data-field="locatie.bedrijfsnaam"]')).toBeTruthy();
    expect(container.querySelector('[data-field="opdrachtgever.bedrijfsnaam"]')).toBeTruthy();
    expect(container.querySelector('[data-field="inspectie.inspecteur"]')).toBeTruthy();
    expect(container.querySelector('[data-field="installatie.type_lozing"]')).toBeTruthy();
  });

  it('updates state when input changes', () => {
    renderSection1Projectgegevens(container, state);
    const input = container.querySelector('[data-field="locatie.bedrijfsnaam"]');
    input.value = 'Garage Test BV';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    expect(state.locatie.bedrijfsnaam).toBe('Garage Test BV');
  });
});

import { renderSection2Metingen } from '../js/form-render.js';

describe('renderSection2Metingen', () => {
  let container, state;
  beforeEach(() => {
    container = document.createElement('div');
    state = createState();
  });

  it('renders titel "2. Metingen"', () => {
    renderSection2Metingen(container, state);
    expect(container.querySelector('.section-title').textContent).toContain('2. Metingen');
  });

  it('toont auto-pct wanneer waarde wordt ingevuld', () => {
    renderSection2Metingen(container, state);
    const olielaagInput = container.querySelector('[data-field="metingen.olielaagdikte_mm"]');
    olielaagInput.value = '12';
    olielaagInput.dispatchEvent(new Event('input', { bubbles: true }));
    const pctEl = container.querySelector('[data-pct="olielaag"]');
    expect(pctEl.textContent).toContain('15%');
  });

  it('kleur rood bij grenswaarde overschrijding', () => {
    renderSection2Metingen(container, state);
    const slibInput = container.querySelector('[data-field="metingen.sliblaagdikte_mm"]');
    slibInput.value = '200';
    slibInput.dispatchEvent(new Event('input', { bubbles: true }));
    const pctEl = container.querySelector('[data-pct="sliblaag"]');
    expect(pctEl.classList.contains('rood')).toBe(true);
  });
});

import { renderSection5LedigingBal } from '../js/form-render.js';
import { setField } from '../js/state.js';

describe('renderSection5LedigingBal', () => {
  let container, state;
  beforeEach(() => {
    container = document.createElement('div');
    state = createState();
  });

  it('BAL verborgen wanneer geen lediging Ja', () => {
    renderSection5LedigingBal(container, state);
    expect(container.querySelector('[data-bal-block]').dataset.balBlock).toBe('hidden');
  });

  it('BAL zichtbaar wanneer een lediging Ja', () => {
    renderSection5LedigingBal(container, state);
    setField(state, 'lediging.slibvang', 'ja');
    const radio = container.querySelector('input[name="lediging.slibvang"][value="ja"]');
    radio.checked = true;
    radio.dispatchEvent(new Event('change', { bubbles: true }));
    expect(container.querySelector('[data-bal-block]').dataset.balBlock).toBe('shown');
  });
});

import { renderSection6Inwendig, bindIntervalSwitch } from '../js/form-render.js';

describe('renderSection5LedigingBal — fase 2 BAL uitbreiding', () => {
  let container, state;
  beforeEach(() => {
    container = document.createElement('div');
    state = createState();
  });

  it('BAL-block bevat veld afgevoerd_gewicht_kg', () => {
    renderSection5LedigingBal(container, state);
    expect(container.querySelector('[data-field="bal.afgevoerd_gewicht_kg"]')).toBeTruthy();
  });

  it('BAL-block bevat photo-slot afvalstroomformulier', () => {
    renderSection5LedigingBal(container, state);
    expect(container.querySelector('[data-photo-key="afvalstroomformulier"]')).toBeTruthy();
  });

  it('photo-slot afvalstroomformulier heeft data-max=3', () => {
    renderSection5LedigingBal(container, state);
    const slot = container.querySelector('[data-photo-key="afvalstroomformulier"]');
    expect(slot.dataset.max).toBe('3');
  });

  it('input afgevoerd_gewicht_kg update state', () => {
    renderSection5LedigingBal(container, state);
    const input = container.querySelector('[data-field="bal.afgevoerd_gewicht_kg"]');
    input.value = '1250';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    expect(state.bal.afgevoerd_gewicht_kg).toBe('1250');
  });
});

describe('renderSection6Inwendig', () => {
  let container, state;
  beforeEach(() => {
    container = document.createElement('div');
    state = createState();
  });

  it('rendert sectiekop "6. Inwendige controle"', () => {
    renderSection6Inwendig(container, state);
    expect(container.querySelector('.section-title').textContent).toContain('6. Inwendige controle');
  });

  it('heeft 5 check-rows voor inwendige items', () => {
    renderSection6Inwendig(container, state);
    expect(container.querySelectorAll('[data-check-base="inwendig.wanden_bodem"]').length).toBe(1);
    expect(container.querySelectorAll('[data-check-base="inwendig.schotten_vlotterkoker"]').length).toBe(1);
    expect(container.querySelectorAll('[data-check-base="inwendig.coalescentiefilter"]').length).toBe(1);
    expect(container.querySelectorAll('[data-check-base="inwendig.afsluiter_mechanisch"]').length).toBe(1);
    expect(container.querySelectorAll('[data-check-base="inwendig.naden_aansluitingen"]').length).toBe(1);
  });

  it('coalescentiefilter heeft extra select voor actie', () => {
    renderSection6Inwendig(container, state);
    const sel = container.querySelector('[data-field="inwendig.coalescentiefilter.actie"]');
    expect(sel).toBeTruthy();
    expect(sel.tagName).toBe('SELECT');
    const options = Array.from(sel.options).map(o => o.value);
    expect(options).toContain('goed');
    expect(options).toContain('gereinigd');
    expect(options).toContain('vervangen');
    expect(options).toContain('nvt');
  });

  it('heeft photo-slots voor 5 inwendige keys', () => {
    renderSection6Inwendig(container, state);
    expect(container.querySelector('[data-photo-key="inwendig_wanden"]')).toBeTruthy();
    expect(container.querySelector('[data-photo-key="inwendig_schotten"]')).toBeTruthy();
    expect(container.querySelector('[data-photo-key="inwendig_coalescentie"]')).toBeTruthy();
    expect(container.querySelector('[data-photo-key="inwendig_afsluiter"]')).toBeTruthy();
    expect(container.querySelector('[data-photo-key="inwendig_naden"]')).toBeTruthy();
  });

  it('check-row update state via radio', () => {
    renderSection6Inwendig(container, state);
    const radio = container.querySelector('input[name="inwendig.wanden_bodem.resultaat"][value="goed"]');
    radio.checked = true;
    radio.dispatchEvent(new Event('change', { bubbles: true }));
    expect(state.inwendig.wanden_bodem.resultaat).toBe('goed');
  });

  it('coalescentiefilter actie-select update state', () => {
    renderSection6Inwendig(container, state);
    const sel = container.querySelector('[data-field="inwendig.coalescentiefilter.actie"]');
    sel.value = 'vervangen';
    sel.dispatchEvent(new Event('change', { bubbles: true }));
    expect(state.inwendig.coalescentiefilter.actie).toBe('vervangen');
  });
});

import { bindConditionalFields, renderSection7Lekdichtheid, renderSection8Coating } from '../js/form-render.js';

describe('bindConditionalFields', () => {
  let container;
  beforeEach(() => {
    container = document.createElement('div');
    container.innerHTML = `
      <input type="radio" name="x.choice" value="a">
      <input type="radio" name="x.choice" value="b">
      <div data-show-when="x.choice:a">A-detail</div>
      <div data-show-when="x.choice:b,c">BC-detail</div>
    `;
  });

  it('verbergt alle data-show-when bij init', () => {
    bindConditionalFields(container);
    expect(container.querySelector('[data-show-when="x.choice:a"]').style.display).toBe('none');
    expect(container.querySelector('[data-show-when="x.choice:b,c"]').style.display).toBe('none');
  });

  it('toont matchende blok bij radio-change', () => {
    bindConditionalFields(container);
    const radioB = container.querySelector('input[value="b"]');
    radioB.checked = true;
    radioB.dispatchEvent(new Event('change', { bubbles: true }));
    expect(container.querySelector('[data-show-when="x.choice:a"]').style.display).toBe('none');
    expect(container.querySelector('[data-show-when="x.choice:b,c"]').style.display).not.toBe('none');
  });

  it('verbergt opnieuw bij switch naar non-matchende waarde', () => {
    bindConditionalFields(container);
    const radioA = container.querySelector('input[value="a"]');
    const radioB = container.querySelector('input[value="b"]');
    radioB.checked = true;
    radioB.dispatchEvent(new Event('change', { bubbles: true }));
    radioA.checked = true;
    radioB.checked = false;
    radioA.dispatchEvent(new Event('change', { bubbles: true }));
    expect(container.querySelector('[data-show-when="x.choice:b,c"]').style.display).toBe('none');
    expect(container.querySelector('[data-show-when="x.choice:a"]').style.display).not.toBe('none');
  });
});

describe('bindIntervalSwitch', () => {
  let container, state;
  beforeEach(() => {
    container = document.createElement('div');
    container.innerHTML = `
      <input type="radio" name="interval" value="halfjaarlijks" checked>
      <input type="radio" name="interval" value="jaarlijks">
      <input type="radio" name="interval" value="5jaarlijks">
      <section data-section="lediging-bal">
        <div class="bal-block" data-bal-block="hidden"></div>
      </section>
      <section data-section="inwendig" data-interval-only="jaarlijks"></section>
    `;
    state = createState();
  });

  it('bij halfjaarlijks: inwendig sectie verborgen', () => {
    bindIntervalSwitch(container, state);
    const inwendig = container.querySelector('[data-section="inwendig"]');
    expect(inwendig.style.display).toBe('none');
  });

  it('bij jaarlijks: inwendig sectie zichtbaar + BAL forced shown', () => {
    bindIntervalSwitch(container, state);
    const radio = container.querySelector('input[value="jaarlijks"]');
    radio.checked = true;
    radio.dispatchEvent(new Event('change', { bubbles: true }));
    const inwendig = container.querySelector('[data-section="inwendig"]');
    const bal = container.querySelector('[data-bal-block]');
    expect(inwendig.style.display).not.toBe('none');
    expect(bal.dataset.balBlock).toBe('shown');
    expect(state.meta.interval).toBe('jaarlijks');
  });

  it('bij switch jaarlijks → halfjaarlijks: inwendig verborgen, BAL conditioneel hidden', () => {
    bindIntervalSwitch(container, state);
    const jaarlijks = container.querySelector('input[value="jaarlijks"]');
    const halfjaarlijks = container.querySelector('input[value="halfjaarlijks"]');
    jaarlijks.checked = true;
    jaarlijks.dispatchEvent(new Event('change', { bubbles: true }));
    halfjaarlijks.checked = true;
    halfjaarlijks.dispatchEvent(new Event('change', { bubbles: true }));
    const inwendig = container.querySelector('[data-section="inwendig"]');
    expect(inwendig.style.display).toBe('none');
    expect(state.meta.interval).toBe('halfjaarlijks');
  });
});

describe('renderSection7Lekdichtheid', () => {
  let container, state;
  beforeEach(() => {
    container = document.createElement('div');
    state = createState();
  });

  it('rendert sectiekop "7. Lekdichtheidstest"', () => {
    renderSection7Lekdichtheid(container, state);
    expect(container.querySelector('.section-title').textContent).toContain('7. Lekdichtheidstest');
  });

  it('heeft 3 testmethode-opties', () => {
    renderSection7Lekdichtheid(container, state);
    expect(container.querySelector('input[name="lekdichtheid.testmethode"][value="visueel"]')).toBeTruthy();
    expect(container.querySelector('input[name="lekdichtheid.testmethode"][value="hydrologisch"]')).toBeTruthy();
    expect(container.querySelector('input[name="lekdichtheid.testmethode"][value="gecombineerd"]')).toBeTruthy();
  });

  it('detail-velden zijn initieel verborgen', () => {
    renderSection7Lekdichtheid(container, state);
    const beginEl = container.querySelector('[data-field="lekdichtheid.beginniveau_mm"]');
    const detailBlock = beginEl.closest('[data-show-when]');
    expect(detailBlock.style.display).toBe('none');
  });

  it('detail-velden tonen bij methode hydrologisch', () => {
    renderSection7Lekdichtheid(container, state);
    const radio = container.querySelector('input[value="hydrologisch"]');
    radio.checked = true;
    radio.dispatchEvent(new Event('change', { bubbles: true }));
    const detailBlock = container.querySelector('[data-show-when*="hydrologisch"]');
    expect(detailBlock.style.display).not.toBe('none');
  });

  it('photo-slot lekdichtheid aanwezig', () => {
    renderSection7Lekdichtheid(container, state);
    expect(container.querySelector('[data-photo-key="lekdichtheid"]')).toBeTruthy();
  });

  it('testmethode update state bij selectie', () => {
    renderSection7Lekdichtheid(container, state);
    const radio = container.querySelector('input[value="visueel"]');
    radio.checked = true;
    radio.dispatchEvent(new Event('change', { bubbles: true }));
    expect(state.lekdichtheid.testmethode).toBe('visueel');
  });

  it('resultaat-keuze update state', () => {
    renderSection7Lekdichtheid(container, state);
    const radio = container.querySelector('input[name="lekdichtheid.resultaat"][value="voldoet"]');
    radio.checked = true;
    radio.dispatchEvent(new Event('change', { bubbles: true }));
    expect(state.lekdichtheid.resultaat).toBe('voldoet');
  });

  it('berekent gemeten_verlies_mm automatisch (begin - eind)', () => {
    renderSection7Lekdichtheid(container, state);
    const begin = container.querySelector('[data-field="lekdichtheid.beginniveau_mm"]');
    const eind  = container.querySelector('[data-field="lekdichtheid.eindniveau_mm"]');
    begin.value = '500';
    begin.dispatchEvent(new Event('input', { bubbles: true }));
    eind.value = '498';
    eind.dispatchEvent(new Event('input', { bubbles: true }));
    expect(state.lekdichtheid.gemeten_verlies_mm).toBe('2');
  });
});

describe('renderSection8Coating', () => {
  let container, state;
  beforeEach(() => {
    container = document.createElement('div');
    state = createState();
  });

  it('rendert sectiekop "8. Coating-inspectie"', () => {
    renderSection8Coating(container, state);
    expect(container.querySelector('.section-title').textContent).toContain('8. Coating-inspectie');
  });

  it('heeft "Coating aanwezig?" radio met ja/nee', () => {
    renderSection8Coating(container, state);
    expect(container.querySelector('input[name="coating.aanwezig"][value="ja"]')).toBeTruthy();
    expect(container.querySelector('input[name="coating.aanwezig"][value="nee"]')).toBeTruthy();
  });

  it('detail-velden zijn initieel verborgen', () => {
    renderSection8Coating(container, state);
    const typeEl = container.querySelector('[data-field="coating.type"]');
    const detailBlock = typeEl.closest('[data-show-when]');
    expect(detailBlock.style.display).toBe('none');
  });

  it('detail-velden tonen bij aanwezig=ja', () => {
    renderSection8Coating(container, state);
    const radio = container.querySelector('input[name="coating.aanwezig"][value="ja"]');
    radio.checked = true;
    radio.dispatchEvent(new Event('change', { bubbles: true }));
    const detailBlock = container.querySelector('[data-show-when*="ja"]');
    expect(detailBlock.style.display).not.toBe('none');
  });

  it('photo-slot coating aanwezig', () => {
    renderSection8Coating(container, state);
    expect(container.querySelector('[data-photo-key="coating"]')).toBeTruthy();
  });

  it('aanwezig-keuze update state', () => {
    renderSection8Coating(container, state);
    const radio = container.querySelector('input[name="coating.aanwezig"][value="nee"]');
    radio.checked = true;
    radio.dispatchEvent(new Event('change', { bubbles: true }));
    expect(state.coating.aanwezig).toBe('nee');
  });
});

import { renderSectionChecklistObas } from '../js/form-render.js';

describe('renderSectionChecklistObas — fase 4 (24-punt visuele checklist)', () => {
  let container, state;
  beforeEach(() => {
    container = document.createElement('div');
    state = createState();
  });

  it('rendert sectie met data-section="checklist-obas"', () => {
    renderSectionChecklistObas(container, state);
    expect(container.querySelector('[data-section="checklist-obas"]')).toBeTruthy();
  });

  it('sectie heeft data-interval-only="5jaarlijks"', () => {
    renderSectionChecklistObas(container, state);
    const sectie = container.querySelector('[data-section="checklist-obas"]');
    expect(sectie.dataset.intervalOnly).toBe('5jaarlijks');
  });

  it('rendert sectiekop met "Checklist Inspectie OBAS"', () => {
    renderSectionChecklistObas(container, state);
    expect(container.querySelector('.section-title').textContent).toContain('Checklist Inspectie OBAS');
  });

  it('rendert legenda met ✓ / ✗ / n.v.t.', () => {
    renderSectionChecklistObas(container, state);
    const legend = container.querySelector('.checklist-legend');
    expect(legend).toBeTruthy();
    expect(legend.textContent).toContain('Goed');
    expect(legend.textContent).toContain('Afwijking');
    expect(legend.textContent).toContain('n.v.t.');
  });

  it('rendert 24 checklist-rijen', () => {
    renderSectionChecklistObas(container, state);
    const rows = container.querySelectorAll('.checklist-row');
    expect(rows).toHaveLength(24);
  });

  it('elke rij heeft 3 radio-opties (goed/fout/nvt)', () => {
    renderSectionChecklistObas(container, state);
    const rows = container.querySelectorAll('.checklist-row');
    rows.forEach(row => {
      expect(row.querySelector('input[type="radio"][value="goed"]')).toBeTruthy();
      expect(row.querySelector('input[type="radio"][value="fout"]')).toBeTruthy();
      expect(row.querySelector('input[type="radio"][value="nvt"]')).toBeTruthy();
    });
  });

  it('elke rij heeft opmerking-input', () => {
    renderSectionChecklistObas(container, state);
    const rows = container.querySelectorAll('.checklist-row');
    rows.forEach(row => {
      expect(row.querySelector('input[data-field$=".opmerking"]')).toBeTruthy();
    });
  });

  it('rij 1 toont "Afdekkingen", rij 24 toont "Afvoerkanaal gereinigd"', () => {
    renderSectionChecklistObas(container, state);
    const labels = [...container.querySelectorAll('.checklist-row .checklist-label')].map(el => el.textContent.trim());
    expect(labels[0]).toBe('Afdekkingen');
    expect(labels[23]).toBe('Afvoerkanaal gereinigd');
  });

  it('radio-keuze updatet state.checklist_obas', () => {
    renderSectionChecklistObas(container, state);
    const radio = container.querySelector('input[name="checklist_obas.afdekkingen.resultaat"][value="goed"]');
    radio.checked = true;
    radio.dispatchEvent(new Event('change', { bubbles: true }));
    expect(state.checklist_obas.afdekkingen.resultaat).toBe('goed');
  });

  it('opmerking-input updatet state', () => {
    renderSectionChecklistObas(container, state);
    const opm = container.querySelector('input[data-field="checklist_obas.opbouw_obas.opmerking"]');
    opm.value = 'Lichte corrosie zichtbaar';
    opm.dispatchEvent(new Event('input', { bubbles: true }));
    expect(state.checklist_obas.opbouw_obas.opmerking).toBe('Lichte corrosie zichtbaar');
  });
});

describe('renderSection1Projectgegevens — fase 3 entity-picker', () => {
  let container, state;
  beforeEach(() => {
    container = document.createElement('div');
    state = createState();
    renderSection1Projectgegevens(container, state);
  });

  it('bevat een entity-picker blok bovenaan sectie 1', () => {
    expect(container.querySelector('.entity-picker')).toBeTruthy();
  });

  it('heeft een klant-dropdown met data-picker="klant"', () => {
    expect(container.querySelector('select[data-picker="klant"]')).toBeTruthy();
  });

  it('heeft een voorziening-dropdown met data-picker="voorziening" (placeholder voor fase 4)', () => {
    expect(container.querySelector('select[data-picker="voorziening"]')).toBeTruthy();
  });

  it('heeft klant-actie knoppen: nieuw, bewerken, verwijderen', () => {
    expect(container.querySelector('[data-action="klant-new"]')).toBeTruthy();
    expect(container.querySelector('[data-action="klant-edit"]')).toBeTruthy();
    expect(container.querySelector('[data-action="klant-delete"]')).toBeTruthy();
  });

  it('klant-edit en klant-delete zijn initieel disabled', () => {
    expect(container.querySelector('[data-action="klant-edit"]').disabled).toBe(true);
    expect(container.querySelector('[data-action="klant-delete"]').disabled).toBe(true);
  });

  it('voorziening-acties zijn allemaal disabled (fase 4)', () => {
    expect(container.querySelector('[data-action="voorziening-new"]').disabled).toBe(true);
    expect(container.querySelector('[data-action="voorziening-edit"]').disabled).toBe(true);
    expect(container.querySelector('[data-action="voorziening-delete"]').disabled).toBe(true);
  });
});
