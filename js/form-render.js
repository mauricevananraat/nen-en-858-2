import { setField, getField, isBalZichtbaar } from './state.js';
import { calcPercentage, pctKleur, isLegenVereist } from './validation.js';

function fieldHTML(label, path, type = 'text') {
  return `
    <div class="field">
      <label class="field-label">${label}</label>
      <input class="field-input" type="${type}" data-field="${path}">
    </div>
  `;
}

function bindFields(container, state) {
  container.querySelectorAll('[data-field]').forEach(el => {
    const path = el.dataset.field;
    el.value = getField(state, path) ?? '';
    el.addEventListener('input', () => setField(state, path, el.value));
  });
}

export function renderSection1Projectgegevens(container, state) {
  const html = `
    <section class="form-section" data-section="projectgegevens">
      <header class="section-title">1. Projectgegevens</header>
      <div class="section-body">
        <div class="entity-picker">
          <div class="entity-picker-row">
            <label class="entity-picker-label">Klant</label>
            <select class="field-input entity-picker-select" data-picker="klant">
              <option value="">— kies klant —</option>
            </select>
            <button type="button" class="btn-icon" data-action="klant-new" title="Nieuwe klant">+</button>
            <button type="button" class="btn-icon" data-action="klant-edit" title="Klant bewerken" disabled>✎</button>
            <button type="button" class="btn-icon" data-action="klant-delete" title="Klant verwijderen" disabled>🗑</button>
          </div>
          <div class="entity-picker-row">
            <label class="entity-picker-label">Voorziening</label>
            <select class="field-input entity-picker-select" data-picker="voorziening">
              <option value="">— kies klant eerst —</option>
            </select>
            <button type="button" class="btn-icon" data-action="voorziening-new" title="Nieuwe voorziening" disabled>+</button>
            <button type="button" class="btn-icon" data-action="voorziening-edit" title="Voorziening bewerken" disabled>✎</button>
            <button type="button" class="btn-icon" data-action="voorziening-delete" title="Voorziening verwijderen" disabled>🗑</button>
          </div>
        </div>
        <div class="grid-2">
          <fieldset>
            <legend>Locatie</legend>
            ${fieldHTML('Bedrijfsnaam', 'locatie.bedrijfsnaam')}
            ${fieldHTML('Adres', 'locatie.adres')}
            ${fieldHTML('Postcode/Plaats', 'locatie.postcode_plaats')}
            ${fieldHTML('Contactpersoon', 'locatie.contactpersoon')}
            ${fieldHTML('Vorige inspectie', 'locatie.vorige_inspectie', 'date')}
          </fieldset>
          <fieldset>
            <legend>Opdrachtgever</legend>
            ${fieldHTML('Bedrijfsnaam', 'opdrachtgever.bedrijfsnaam')}
            ${fieldHTML('Adres', 'opdrachtgever.adres')}
            ${fieldHTML('Postcode/Plaats', 'opdrachtgever.postcode_plaats')}
            ${fieldHTML('Contactpersoon', 'opdrachtgever.contactpersoon')}
            ${fieldHTML('Telefoon', 'opdrachtgever.telefoon', 'tel')}
          </fieldset>
        </div>
        <fieldset>
          <legend>Inspectiegegevens</legend>
          <div class="grid-3">
            ${fieldHTML('Datum', 'inspectie.datum', 'date')}
            ${fieldHTML('Inspecteur', 'inspectie.inspecteur')}
            ${fieldHTML('Uitvoerend bureau', 'inspectie.uitvoerend_bureau')}
            ${fieldHTML('Extern projectnr', 'inspectie.extern_projectnr')}
            ${fieldHTML('Weersomstandigheden', 'inspectie.weersomstandigheden')}
          </div>
        </fieldset>
        <fieldset>
          <legend>Technische specificaties installatie</legend>
          <div class="grid-3">
            ${fieldHTML('Merk', 'installatie.merk')}
            ${fieldHTML('Type / bouwjaar', 'installatie.type_bouwjaar')}
            ${fieldHTML('NS-klasse', 'installatie.ns_klasse')}
            ${fieldHTML('NS (l/s)', 'installatie.ns_ls', 'number')}
            ${fieldHTML('Capaciteit (L)', 'installatie.capaciteit_l', 'number')}
            ${fieldHTML('Inhoud slibv. (L)', 'installatie.inhoud_slibv_l', 'number')}
            ${fieldHTML('Inlaat Ø (mm)', 'installatie.inlaat_mm', 'number')}
            ${fieldHTML('Uitlaat Ø (mm)', 'installatie.uitlaat_mm', 'number')}
          </div>
          <div class="grid-2">
            ${fieldHTML('Type lozing', 'installatie.type_lozing')}
            ${fieldHTML('Lozingsvergunning kenmerk', 'installatie.lozingsvergunning_kenmerk')}
          </div>
        </fieldset>
        <div class="photo-slot" data-photo-key="overzicht" data-max="2" data-label="Overzichtsfoto's"></div>
        <div class="photo-slot" data-photo-key="installatie" data-max="5" data-label="Detailfoto's installatie"></div>
      </div>
    </section>
  `;
  container.insertAdjacentHTML('beforeend', html);
  bindFields(container, state);
}

// 24-punt visuele checklist conform NEN-EN 858-2 bron-PDF v2.0 ("CHECKLIST INSPECTIE OBAS")
// Volgorde matched exact met bron-PDF — wijzig niet zonder spec-update.
const CHECKLIST_OBAS_ITEMS = [
  [1,  'Afdekkingen',            'afdekkingen'],
  [2,  'Opbouw OBAS',             'opbouw_obas'],
  [3,  'Vlotterbal / Vlotterklep','vlotterbal'],
  [4,  'Vlotterbalschotel',       'vlotterbalschotel'],
  [5,  'Grofvuilrooster',         'grofvuilrooster'],
  [6,  'Inlaat OBAS',             'inlaat_obas'],
  [7,  'Uitlaat OBAS',            'uitlaat_obas'],
  [8,  'Niveau OBAS',             'niveau_obas'],
  [9,  'Capaciteit OBAS',         'capaciteit_obas'],
  [10, 'Opbouw slibvangput',      'opbouw_slibvangput'],
  [11, 'Inlaat slibvangput',      'inlaat_slibvangput'],
  [12, 'Uitlaat slibvangput',     'uitlaat_slibvangput'],
  [13, 'Niveau slibvangput',      'niveau_slibvangput'],
  [14, 'Inhoud slibvangput',      'inhoud_slibvangput'],
  [15, 'Controleput',             'controleput'],
  [16, 'Niveau controleput',      'niveau_controleput'],
  [17, 'Lozing',                  'lozing'],
  [18, 'Effluent (visueel)',      'effluent_visueel'],
  [19, 'Coalescentiefilter',      'coalescentiefilter'],
  [20, 'Alarm olielaagdikte',     'alarm_olielaagdikte'],
  [21, 'Alarm hoogwater',         'alarm_hoogwater'],
  [22, 'Recycleput',              'recycleput'],
  [23, 'Accumat',                 'accumat'],
  [24, 'Afvoerkanaal gereinigd',  'afvoerkanaal_gereinigd']
];

function checklistObasRow(nr, label, key) {
  const base = `checklist_obas.${key}`;
  return `
    <div class="checklist-row" data-check-base="${base}">
      <div class="checklist-nr">${nr}</div>
      <div class="checklist-label">${label}</div>
      <label class="checklist-radio"><input type="radio" name="${base}.resultaat" value="goed"><span class="checklist-radio-box goed">✓</span></label>
      <label class="checklist-radio"><input type="radio" name="${base}.resultaat" value="fout"><span class="checklist-radio-box fout">✗</span></label>
      <label class="checklist-radio"><input type="radio" name="${base}.resultaat" value="nvt"><span class="checklist-radio-box nvt">n.v.t.</span></label>
      <input class="field-input checklist-opmerking" type="text" data-field="${base}.opmerking" placeholder="Opmerking...">
    </div>
  `;
}

export function renderSectionChecklistObas(container, state) {
  const rows = CHECKLIST_OBAS_ITEMS.map(([nr, label, key]) => checklistObasRow(nr, label, key)).join('');
  const html = `
    <section class="form-section" data-section="checklist-obas" data-interval-only="5jaarlijks">
      <header class="section-title">Checklist Inspectie OBAS</header>
      <div class="section-body">
        <div class="checklist-legend">
          <strong>Legenda:</strong> ✓ = Goed / Akkoord &nbsp;·&nbsp; ✗ = Afwijking / Niet akkoord &nbsp;·&nbsp; n.v.t. = Niet van toepassing
        </div>
        <div class="checklist-grid">
          <div class="checklist-header-row">
            <div class="checklist-nr">Nr.</div>
            <div class="checklist-label">Aandachtspunt</div>
            <div class="checklist-radio-head">✓</div>
            <div class="checklist-radio-head">✗</div>
            <div class="checklist-radio-head">n.v.t.</div>
            <div class="checklist-opm-head">Opmerkingen</div>
          </div>
          ${rows}
        </div>
      </div>
    </section>
  `;
  container.insertAdjacentHTML('beforeend', html);
  const sectie = container.querySelector('[data-section="checklist-obas"]');
  bindCheckRows(sectie, state);
  bindFields(sectie, state);
}

export function renderSection2Metingen(container, state) {
  const html = `
    <section class="form-section" data-section="metingen">
      <header class="section-title">2. Metingen — NEN-EN 858-2 §6.1</header>
      <div class="section-body">
        <div class="meting-grid header">
          <div>Meetpunt</div><div>Gemeten</div><div>Maximum</div><div>% vulling</div>
        </div>
        ${metingRow('Olielaagdikte (mm)', 'olielaag', 'olielaagdikte_mm', 'olielaagdikte_max')}
        ${metingRow('Sliblaagdikte (mm)', 'sliblaag', 'sliblaagdikte_mm', 'sliblaagdikte_max')}
        ${metingRow('Slibvolume (l)',     'slibvolume', 'slibvolume_l', 'slibvolume_max')}
        <div class="advies-blok" data-advies="hidden">
          ⚠️ <strong>Lediging vereist</strong> — minstens 1 meting overschrijdt grenswaarde.
        </div>
        <div class="photo-slot" data-photo-key="metingen" data-max="5" data-label="Foto's metingen"></div>
      </div>
    </section>
  `;
  container.insertAdjacentHTML('beforeend', html);
  bindFields(container, state);
  bindMetingen(container, state);
}

function metingRow(label, type, gemetenPath, maxPath) {
  return `
    <div class="meting-grid">
      <div>${label}</div>
      <input class="field-input" type="number" data-field="metingen.${gemetenPath}" data-meting-type="${type}">
      <input class="field-input" type="number" data-field="metingen.${maxPath}" data-meting-type="${type}">
      <div class="pct-badge" data-pct="${type}">—</div>
    </div>
  `;
}

function getMetingValues(state, type) {
  const gemeten = state.metingen[`${type}dikte_mm`] ?? state.metingen[`${type}_l`];
  const max     = state.metingen[`${type}dikte_max`] ?? state.metingen[`${type}_max`];
  return { gemeten, max };
}

function bindMetingen(container, state) {
  const update = () => {
    ['olielaag', 'sliblaag', 'slibvolume'].forEach(type => {
      const { gemeten, max } = getMetingValues(state, type);
      const pct = calcPercentage(gemeten, max);
      const el = container.querySelector(`[data-pct="${type}"]`);
      if (!el) return;
      el.textContent = pct ? `${pct}%` : '—';
      el.classList.remove('groen', 'oranje', 'rood');
      if (pct) el.classList.add(pctKleur(pct, type));
    });
    const advies = ['olielaag', 'sliblaag', 'slibvolume'].some(type => {
      const { gemeten, max } = getMetingValues(state, type);
      return isLegenVereist(calcPercentage(gemeten, max), type);
    });
    container.querySelector('[data-advies]').dataset.advies = advies ? 'shown' : 'hidden';
  };
  container.querySelectorAll('[data-meting-type]').forEach(el => {
    el.addEventListener('input', update);
  });
  update();
}

function checkRow(label, basePath) {
  return `
    <div class="check-row">
      <div class="check-label"><strong>${label}</strong></div>
      <div class="check-options" data-check-base="${basePath}">
        <label class="opt"><input type="radio" name="${basePath}.resultaat" value="goed"><span>✓ Werkt</span></label>
        <label class="opt"><input type="radio" name="${basePath}.resultaat" value="fout"><span>✗ Defect</span></label>
        <label class="opt"><input type="radio" name="${basePath}.resultaat" value="nvt"><span>n.v.t.</span></label>
      </div>
      <div class="field">
        <label class="field-label">Opmerking</label>
        <input class="field-input" type="text" data-field="${basePath}.opmerking">
      </div>
    </div>
  `;
}

function bindCheckRows(container, state) {
  container.querySelectorAll('[data-check-base]').forEach(group => {
    const base = group.dataset.checkBase;
    group.querySelectorAll('input[type="radio"]').forEach(radio => {
      radio.addEventListener('change', () => {
        if (radio.checked) setField(state, `${base}.resultaat`, radio.value);
      });
    });
  });
}

export function renderSection3Functietesten(container, state) {
  const html = `
    <section class="form-section" data-section="functietesten">
      <header class="section-title">3. Functietesten — NEN-EN 858-2 §6.3.1</header>
      <div class="section-body">
        ${checkRow('Auto-afsluiter — visuele check afsluiter / vlotter', 'functietesten.auto_afsluiter')}
        ${checkRow('Alarm olielaagdikte', 'functietesten.alarm_olielaag')}
        ${checkRow('Alarm hoogwater', 'functietesten.alarm_hoogwater')}
        <div class="photo-slot" data-photo-key="auto_afsluiter" data-max="5" data-label="Foto's auto-afsluiter"></div>
        <div class="photo-slot" data-photo-key="alarm_olielaag" data-max="5" data-label="Foto's alarm olielaag"></div>
        <div class="photo-slot" data-photo-key="alarm_hoogwater" data-max="5" data-label="Foto's alarm hoogwater"></div>
      </div>
    </section>
  `;
  container.insertAdjacentHTML('beforeend', html);
  bindFields(container, state);
  bindCheckRows(container, state);
}

export function renderSection4Controleput(container, state) {
  const html = `
    <section class="form-section" data-section="controleput">
      <header class="section-title">4. Controleput / bemonsteringsschacht</header>
      <div class="section-body">
        <div class="check-row">
          <div class="check-label"><strong>Schoongemaakt?</strong></div>
          <div class="check-options" data-check-base="controleput">
            <label class="opt"><input type="radio" name="controleput.schoongemaakt" value="ja"><span>Ja</span></label>
            <label class="opt"><input type="radio" name="controleput.schoongemaakt" value="nee"><span>Nee</span></label>
          </div>
        </div>
        <div class="field">
          <label class="field-label">Visuele staat</label>
          <textarea class="field-input" rows="3" data-field="controleput.visuele_staat"></textarea>
        </div>
        <div class="photo-slot" data-photo-key="controleput" data-max="5" data-label="Foto's controleput"></div>
      </div>
    </section>
  `;
  container.insertAdjacentHTML('beforeend', html);
  container.querySelectorAll('[name="controleput.schoongemaakt"]').forEach(r => {
    r.addEventListener('change', () => { if (r.checked) setField(state, 'controleput.schoongemaakt', r.value); });
  });
  bindFields(container, state);
}

function ledigingRow(label, key) {
  return `
    <div class="check-row">
      <div class="check-label">${label}</div>
      <div class="check-options" data-lediging-key="${key}">
        <label class="opt"><input type="radio" name="lediging.${key}" value="ja"><span>Ja</span></label>
        <label class="opt"><input type="radio" name="lediging.${key}" value="nee"><span>Nee</span></label>
        <label class="opt"><input type="radio" name="lediging.${key}" value="nvt"><span>n.v.t.</span></label>
      </div>
    </div>
  `;
}

export function renderSection5LedigingBal(container, state) {
  const html = `
    <section class="form-section" data-section="lediging-bal">
      <header class="section-title">5. Lediging + BAL-registratie</header>
      <div class="section-body">
        <div class="section-info" data-interval-only="jaarlijks">
          Bij jaarlijkse keuring is lediging Symitech-werkwijze. Vul de lediging-velden en BAL-registratie in.
        </div>
        ${ledigingRow('Lediging OBAS nodig?', 'obas')}
        ${ledigingRow('Lediging slibvangput nodig?', 'slibvang')}
        ${ledigingRow('Lediging kolken nodig?', 'kolken')}
        ${ledigingRow('Lediging recycleput nodig?', 'recycle')}
        ${ledigingRow('Lediging wasgoot nodig?', 'wasgoot')}
        ${ledigingRow('Na lediging gevuld met schoon water?', 'schoon_water_gevuld')}

        <div class="bal-block" data-bal-block="hidden">
          <h4>BAL-registratie (verplicht bij lediging)</h4>
          <div class="grid-2">
            <div class="field"><label class="field-label">Verwerker / inzamelaar</label><input class="field-input" data-field="bal.verwerker"></div>
            <div class="field"><label class="field-label">Transporteur</label><input class="field-input" data-field="bal.transporteur"></div>
            <div class="field"><label class="field-label">Afvoerbon-nr + datum</label><input class="field-input" data-field="bal.afvoerbon"></div>
            <div class="field"><label class="field-label">Euralcode</label><input class="field-input" data-field="bal.euralcode"></div>
            <div class="field"><label class="field-label">Hoeveelheid (L olie/slib)</label><input class="field-input" type="number" data-field="bal.hoeveelheid_l"></div>
            <div class="field"><label class="field-label">Afgevoerd gewicht (kg) — zuigwagen</label><input class="field-input" type="number" data-field="bal.afgevoerd_gewicht_kg"></div>
          </div>
          <div class="photo-slot" data-photo-key="bal" data-max="5" data-label="Foto's afvoerbon"></div>
          <div class="photo-slot" data-photo-key="afvalstroomformulier" data-max="3" data-label="Afvalstroomformulier (foto's)"></div>
        </div>
      </div>
    </section>
  `;
  container.insertAdjacentHTML('beforeend', html);

  container.querySelectorAll('[data-lediging-key]').forEach(group => {
    const key = group.dataset.ledigingKey;
    group.querySelectorAll('input[type="radio"]').forEach(radio => {
      radio.addEventListener('change', () => {
        if (radio.checked) {
          setField(state, `lediging.${key}`, radio.value);
          updateBalVisibility(container, state);
        }
      });
    });
  });
  bindFields(container, state);
}

function updateBalVisibility(container, state) {
  const block = container.querySelector('[data-bal-block]');
  block.dataset.balBlock = isBalZichtbaar(state) ? 'shown' : 'hidden';
}

export function renderSection6Conclusie(container, state) {
  const html = `
    <section class="form-section" data-section="conclusie">
      <header class="section-title">6. Conclusie en eindoordeel</header>
      <div class="section-body">
        <div class="check-row">
          <div class="check-label"><strong>Eindoordeel</strong></div>
          <div class="check-options" data-eindoordeel>
            <label class="opt"><input type="radio" name="conclusie.eindoordeel" value="goedgekeurd"><span>Goedgekeurd</span></label>
            <label class="opt"><input type="radio" name="conclusie.eindoordeel" value="voorwaardelijk"><span>Voorwaardelijk</span></label>
            <label class="opt"><input type="radio" name="conclusie.eindoordeel" value="afgekeurd"><span>Afgekeurd</span></label>
          </div>
        </div>
        <div class="field">
          <label class="field-label">Toelichting / Aanbevelingen</label>
          <textarea class="field-input" rows="4" data-field="conclusie.toelichting"></textarea>
        </div>
        <div class="grid-2">
          <div class="field"><label class="field-label">Aanbevolen volgende inspectie</label><input class="field-input" type="date" data-field="conclusie.volgende_inspectie_datum"></div>
          <div class="field"><label class="field-label">Inspecteur (naam)</label><input class="field-input" data-field="conclusie.inspecteur_naam"></div>
        </div>
        <div class="field">
          <label class="field-label">Handtekening</label>
          <canvas id="signature-canvas" width="500" height="120" class="signature-canvas"></canvas>
          <button type="button" class="btn btn-secondary" id="btn-clear-sig">Wissen</button>
        </div>
      </div>
    </section>
  `;
  container.insertAdjacentHTML('beforeend', html);
  const sectieConclusie = container.querySelector('[data-section="conclusie"]');
  sectieConclusie.querySelectorAll('[data-eindoordeel] input').forEach(r => {
    r.addEventListener('change', () => { if (r.checked) setField(state, 'conclusie.eindoordeel', r.value); });
  });
  bindFields(sectieConclusie, state);
  bindSignature(container, state);
}

export function bindIntervalSwitch(container, state) {
  const apply = (interval) => {
    state.meta.interval = interval;
    container.querySelectorAll('[data-interval-only]').forEach(el => {
      const allowed = el.dataset.intervalOnly.split(',').map(s => s.trim());
      const show = allowed.includes(interval) || (interval === '5jaarlijks' && allowed.includes('jaarlijks'));
      el.style.display = show ? '' : 'none';
    });
    const bal = container.querySelector('[data-bal-block]');
    if (bal) {
      const moetTonen = interval === 'jaarlijks' || interval === '5jaarlijks' || isBalZichtbaar(state);
      bal.dataset.balBlock = moetTonen ? 'shown' : 'hidden';
    }
  };
  container.querySelectorAll('input[name="interval"]').forEach(radio => {
    radio.addEventListener('change', () => {
      if (radio.checked) apply(radio.value);
    });
  });
  apply(state.meta.interval);
}

function inwendigCheckRow(label, key, withActie = false) {
  const base = `inwendig.${key}`;
  const actieHtml = withActie ? `
    <div class="field">
      <label class="field-label">Uitgevoerde actie</label>
      <select class="field-input" data-field="${base}.actie">
        <option value="">— kies —</option>
        <option value="goed">Goed (geen actie nodig)</option>
        <option value="gereinigd">Gereinigd</option>
        <option value="vervangen">Vervangen</option>
        <option value="nvt">n.v.t.</option>
      </select>
    </div>
  ` : '';
  return `
    <div class="check-row inwendig-row">
      <div class="check-label"><strong>${label}</strong></div>
      <div class="check-options" data-check-base="${base}">
        <label class="opt"><input type="radio" name="${base}.resultaat" value="goed"><span>✓ Goed</span></label>
        <label class="opt"><input type="radio" name="${base}.resultaat" value="fout"><span>✗ Defect</span></label>
        <label class="opt"><input type="radio" name="${base}.resultaat" value="nvt"><span>n.v.t.</span></label>
      </div>
      <div class="field">
        <label class="field-label">Opmerking</label>
        <input class="field-input" type="text" data-field="${base}.opmerking">
      </div>
      ${actieHtml}
    </div>
  `;
}

export function renderSection6Inwendig(container, state) {
  const html = `
    <section class="form-section" data-section="inwendig" data-interval-only="jaarlijks">
      <header class="section-title">6. Inwendige controle (na lediging)</header>
      <div class="section-body">
        <p class="section-info">Visuele controle in de lege OBAS — onderdeel van Symitech jaarlijkse werkwijze.</p>
        ${inwendigCheckRow('Wanden + bodem visueel (scheuren / lekkage / aantasting)', 'wanden_bodem')}
        <div class="photo-slot" data-photo-key="inwendig_wanden" data-max="5" data-label="Foto's wanden + bodem"></div>
        ${inwendigCheckRow('Schotten / inlaatschot / vlotterkoker', 'schotten_vlotterkoker')}
        <div class="photo-slot" data-photo-key="inwendig_schotten" data-max="5" data-label="Foto's schotten / vlotterkoker"></div>
        ${inwendigCheckRow('Coalescentiefilter — staat / vervuiling', 'coalescentiefilter', true)}
        <div class="photo-slot" data-photo-key="inwendig_coalescentie" data-max="5" data-label="Foto's coalescentiefilter"></div>
        ${inwendigCheckRow('Auto-afsluiter mechanisch (vlotter handmatig opgetild)', 'afsluiter_mechanisch')}
        <div class="photo-slot" data-photo-key="inwendig_afsluiter" data-max="5" data-label="Foto's afsluiter mechanisch"></div>
        ${inwendigCheckRow('Naden / aansluitingen / doorvoeren', 'naden_aansluitingen')}
        <div class="photo-slot" data-photo-key="inwendig_naden" data-max="5" data-label="Foto's naden / aansluitingen"></div>
      </div>
    </section>
  `;
  container.insertAdjacentHTML('beforeend', html);
  const sectie = container.querySelector('[data-section="inwendig"]');
  bindCheckRows(sectie, state);
  bindFields(sectie, state);
  sectie.querySelectorAll('select[data-field]').forEach(sel => {
    sel.addEventListener('change', () => setField(state, sel.dataset.field, sel.value));
  });
}

export function bindConditionalFields(container) {
  const apply = (name, value) => {
    container.querySelectorAll(`[data-show-when^="${name}:"]`).forEach(el => {
      const allowed = el.dataset.showWhen.split(':')[1].split(',').map(s => s.trim());
      el.style.display = allowed.includes(value) ? '' : 'none';
    });
  };
  // initieel verbergen
  container.querySelectorAll('[data-show-when]').forEach(el => { el.style.display = 'none'; });
  // luisteren op alle radios met name uit show-when targets
  const radios = new Set();
  container.querySelectorAll('[data-show-when]').forEach(el => {
    const name = el.dataset.showWhen.split(':')[0];
    radios.add(name);
  });
  radios.forEach(name => {
    container.querySelectorAll(`input[type="radio"][name="${name}"]`).forEach(radio => {
      radio.addEventListener('change', () => {
        if (radio.checked) apply(name, radio.value);
      });
    });
  });
}

export function renderSection7Lekdichtheid(container, state) {
  const html = `
    <section class="form-section" data-section="lekdichtheid" data-interval-only="5jaarlijks">
      <header class="section-title">7. Lekdichtheidstest — NEN-EN 858-2 §6.3.3</header>
      <div class="section-body">
        <p class="section-info">Test op lekdichtheid van de installatie. Methode is ter beoordeling van de inspecteur.</p>

        <div class="check-row">
          <div class="check-label"><strong>Testmethode</strong></div>
          <div class="check-options" data-radio-base="lekdichtheid.testmethode">
            <label class="opt"><input type="radio" name="lekdichtheid.testmethode" value="visueel"><span>Visueel</span></label>
            <label class="opt"><input type="radio" name="lekdichtheid.testmethode" value="hydrologisch"><span>Hydrologisch</span></label>
            <label class="opt"><input type="radio" name="lekdichtheid.testmethode" value="gecombineerd"><span>Gecombineerd</span></label>
          </div>
        </div>

        <div data-show-when="lekdichtheid.testmethode:hydrologisch,gecombineerd">
          <div class="grid-3">
            <div class="field"><label class="field-label">Testduur (min, ≥15)</label><input class="field-input" type="number" min="0" data-field="lekdichtheid.testduur_min"></div>
            <div class="field"><label class="field-label">Begin-niveau (mm)</label><input class="field-input" type="number" data-field="lekdichtheid.beginniveau_mm" data-niveau="begin"></div>
            <div class="field"><label class="field-label">Eind-niveau (mm)</label><input class="field-input" type="number" data-field="lekdichtheid.eindniveau_mm" data-niveau="eind"></div>
            <div class="field"><label class="field-label">Gemeten verlies (mm)</label><input class="field-input" type="number" data-field="lekdichtheid.gemeten_verlies_mm" readonly></div>
            <div class="field"><label class="field-label">Toegestaan (mm/uur)</label><input class="field-input" type="number" data-field="lekdichtheid.toegestaan_mm_uur"></div>
          </div>
        </div>

        <div class="field">
          <label class="field-label">Opmerking / bevindingen</label>
          <textarea class="field-input" rows="3" data-field="lekdichtheid.opmerking"></textarea>
        </div>

        <div class="check-row">
          <div class="check-label"><strong>Resultaat lekdichtheidstest</strong></div>
          <div class="check-options">
            <label class="opt"><input type="radio" name="lekdichtheid.resultaat" value="voldoet"><span>✓ Voldoet</span></label>
            <label class="opt"><input type="radio" name="lekdichtheid.resultaat" value="voldoet_niet"><span>✗ Voldoet niet</span></label>
            <label class="opt"><input type="radio" name="lekdichtheid.resultaat" value="nvt"><span>n.v.t.</span></label>
          </div>
        </div>

        <div class="photo-slot" data-photo-key="lekdichtheid" data-max="5" data-label="Foto's testopstelling / lekkage"></div>
      </div>
    </section>
  `;
  container.insertAdjacentHTML('beforeend', html);
  const sectie = container.querySelector('[data-section="lekdichtheid"]');
  bindFields(sectie, state);
  // testmethode + resultaat radios koppelen aan state
  sectie.querySelectorAll('input[type="radio"]').forEach(radio => {
    radio.addEventListener('change', () => {
      if (radio.checked) setField(state, radio.name, radio.value);
    });
  });
  // auto-bereken gemeten_verlies_mm = beginniveau - eindniveau
  const recalc = () => {
    const begin = parseFloat(state.lekdichtheid.beginniveau_mm);
    const eind  = parseFloat(state.lekdichtheid.eindniveau_mm);
    if (!isNaN(begin) && !isNaN(eind)) {
      const verlies = begin - eind;
      setField(state, 'lekdichtheid.gemeten_verlies_mm', String(verlies));
      const verliesEl = sectie.querySelector('[data-field="lekdichtheid.gemeten_verlies_mm"]');
      if (verliesEl) verliesEl.value = String(verlies);
    }
  };
  sectie.querySelectorAll('[data-niveau]').forEach(el => {
    el.addEventListener('input', recalc);
  });
  bindConditionalFields(sectie);
}

export function renderSection8Coating(container, state) {
  const html = `
    <section class="form-section" data-section="coating" data-interval-only="5jaarlijks">
      <header class="section-title">8. Coating-inspectie</header>
      <div class="section-body">
        <div class="check-row">
          <div class="check-label"><strong>Coating aanwezig?</strong></div>
          <div class="check-options">
            <label class="opt"><input type="radio" name="coating.aanwezig" value="ja"><span>Ja</span></label>
            <label class="opt"><input type="radio" name="coating.aanwezig" value="nee"><span>Nee</span></label>
          </div>
        </div>

        <div data-show-when="coating.aanwezig:ja">
          <div class="grid-2">
            <div class="field"><label class="field-label">Type coating</label><input class="field-input" data-field="coating.type"></div>
            <div class="field"><label class="field-label">Leeftijd (jaar)</label><input class="field-input" type="number" data-field="coating.leeftijd_jaar"></div>
            <div class="field"><label class="field-label">Geschatte restlevensduur (jaar)</label><input class="field-input" type="number" data-field="coating.restlevensduur_jaar"></div>
          </div>
          <div class="field">
            <label class="field-label">Visuele staat (craquelé / blaarvorming / hechtingsverlies / beschadigingen)</label>
            <textarea class="field-input" rows="3" data-field="coating.visuele_staat"></textarea>
          </div>
        </div>

        <div class="check-row">
          <div class="check-label"><strong>Coating voldoet</strong></div>
          <div class="check-options">
            <label class="opt"><input type="radio" name="coating.resultaat" value="voldoet"><span>✓ Voldoet</span></label>
            <label class="opt"><input type="radio" name="coating.resultaat" value="voldoet_niet"><span>✗ Voldoet niet</span></label>
            <label class="opt"><input type="radio" name="coating.resultaat" value="nvt"><span>n.v.t.</span></label>
          </div>
        </div>

        <div class="photo-slot" data-photo-key="coating" data-max="5" data-label="Foto's coating"></div>
      </div>
    </section>
  `;
  container.insertAdjacentHTML('beforeend', html);
  const sectie = container.querySelector('[data-section="coating"]');
  bindFields(sectie, state);
  sectie.querySelectorAll('input[type="radio"]').forEach(radio => {
    radio.addEventListener('change', () => {
      if (radio.checked) setField(state, radio.name, radio.value);
    });
  });
  bindConditionalFields(sectie);
}

function bindSignature(container, state) {
  const canvas = container.querySelector('#signature-canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return; // jsdom canvas heeft geen volledige 2d context
  ctx.strokeStyle = '#1A2B3F';
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  let drawing = false;
  const getPos = (e) => {
    const rect = canvas.getBoundingClientRect();
    const t = e.touches?.[0];
    return { x: (t?.clientX ?? e.clientX) - rect.left, y: (t?.clientY ?? e.clientY) - rect.top };
  };
  const start = (e) => { drawing = true; const p = getPos(e); ctx.beginPath(); ctx.moveTo(p.x, p.y); e.preventDefault(); };
  const move  = (e) => { if (!drawing) return; const p = getPos(e); ctx.lineTo(p.x, p.y); ctx.stroke(); e.preventDefault(); };
  const end   = () => { drawing = false; setField(state, 'conclusie.handtekening_dataurl', canvas.toDataURL('image/png')); };
  canvas.addEventListener('mousedown', start);
  canvas.addEventListener('mousemove', move);
  canvas.addEventListener('mouseup', end);
  canvas.addEventListener('mouseleave', end);
  canvas.addEventListener('touchstart', start);
  canvas.addEventListener('touchmove', move);
  canvas.addEventListener('touchend', end);
  const clearBtn = container.querySelector('#btn-clear-sig');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      setField(state, 'conclusie.handtekening_dataurl', '');
    });
  }
}
