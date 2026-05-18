import { calcPercentage, isLegenVereist, pctKleur } from './validation.js';

const COLORS = {
  blue: '#005EB8',
  blueLight: '#0078BE',
  blueBg: '#E8F0FA',
  brown: '#94450B',
  brownLight: '#D0A173',
  text: '#1A2B3F',
  green: '#2A8745',
  orange: '#D97A2B',
  red: '#C0392B'
};

const INTERVAL_LABEL = {
  halfjaarlijks: 'HALFJAARLIJKSE KEURING',
  jaarlijks:     'JAARLIJKSE KEURING',
  '5jaarlijks':  '5-JAARLIJKSE KEURING'
};

function sectionTitle(text) {
  return {
    table: { widths: ['*'], body: [[{ text, color: 'white', bold: true, fontSize: 11, fillColor: COLORS.blue, margin: [8, 4, 8, 4] }]] },
    layout: 'noBorders',
    margin: [0, 12, 0, 6]
  };
}

function dataRow(label, value) {
  if (value == null || value === '') return null;
  return {
    columns: [
      { text: label, width: 140, bold: true, color: COLORS.blue, fontSize: 9 },
      { text: String(value), fontSize: 9 }
    ],
    margin: [0, 1, 0, 1]
  };
}

function photoBlock(photos, title) {
  if (!photos?.length) return null;
  return {
    stack: [
      { text: title, fontSize: 9, italics: true, color: '#555', margin: [0, 6, 0, 4] },
      {
        columns: photos.map(p => ({
          stack: [
            // fit: [140, 140] dwingt 1:1 vakje af, ook bij oudere foto's met andere aspect ratio
            { image: p.dataurl, fit: [140, 140] },
            ...(p.bijschrift ? [{ text: p.bijschrift, fontSize: 8, italics: true, alignment: 'center', margin: [0, 2] }] : [])
          ],
          width: 150,
          margin: [0, 0, 6, 0]
        }))
      }
    ]
  };
}

function compact(arr) {
  return arr.filter(x => x != null);
}

// sectionCard wrapt een sectie in een card-look (matched HTML .form-section):
// - blauwe header-rij met witte titel-tekst
// - witte body-rij met content
// - unbreakable verwijderd: pdfMake negeert de hint voor secties groter dan 1 pagina
function sectionCard(title, bodyArray) {
  return {
    table: {
      widths: ['*'],
      body: [
        [{
          text: title,
          color: 'white',
          bold: true,
          fontSize: 11,
          fillColor: COLORS.blue,
          margin: [10, 6, 10, 6]
        }],
        [{
          stack: compact(bodyArray),
          fillColor: '#FFFFFF',
          margin: [10, 10, 10, 10]
        }]
      ]
    },
    layout: {
      hLineWidth: () => 0,
      vLineWidth: () => 0,
      paddingLeft: () => 0,
      paddingRight: () => 0,
      paddingTop: () => 0,
      paddingBottom: () => 0
    },
    margin: [0, 0, 0, 12]
  };
}

// subBlock = fieldset-look: dunne grijze rand met titel als legend
// Houd het sub-blok visueel bij elkaar — geen page-break in het midden
function subBlock(title, rows) {
  return {
    table: {
      widths: ['*'],
      body: [
        [{
          stack: [
            { text: title, color: COLORS.blue, bold: true, fontSize: 9, characterSpacing: 0.5, margin: [0, 0, 0, 4] },
            ...rows
          ],
          margin: [8, 6, 8, 6]
        }]
      ]
    },
    layout: {
      hLineWidth: () => 0.5,
      vLineWidth: () => 0.5,
      hLineColor: () => COLORS.blueBg,
      vLineColor: () => COLORS.blueBg,
      paddingLeft: () => 0,
      paddingRight: () => 0,
      paddingTop: () => 0,
      paddingBottom: () => 0
    },
    margin: [0, 4, 0, 6],
    unbreakable: true
  };
}

function subHeader(text) {
  return {
    text,
    bold: true,
    color: COLORS.blue,
    fontSize: 10,
    margin: [0, 8, 0, 4],
    decoration: 'underline'
  };
}

export function buildVoorpagina(state) {
  const intervalLabel = INTERVAL_LABEL[state.meta.interval] || 'KEURING';
  return {
    stack: [
      {
        canvas: [
          { type: 'rect', x: 0, y: 0, w: 595 - 80, h: 130, color: COLORS.blue }
        ]
      },
      {
        text: [
          { text: 'INSPECTIEFORMULIER OBAS\n', fontSize: 22, bold: true, color: 'white' },
          { text: intervalLabel + '\n', fontSize: 16, color: 'white' },
          { text: 'Olie/Benzine Afscheider — NEN-EN 858-2:2003', fontSize: 10, italics: true, color: 'white' }
        ],
        alignment: 'center',
        relativePosition: { x: 0, y: -110 },
        margin: [0, 30, 0, 60]
      },
      {
        stack: [
          { text: 'PROJECTNUMMER', fontSize: 7, color: 'white', bold: true, alignment: 'right' },
          { text: state.meta.projectnummer || '—', fontSize: 9, color: 'white', alignment: 'right', margin: [0, 0, 0, 4] },
          { text: 'RAPPORTAGEDATUM', fontSize: 7, color: 'white', bold: true, alignment: 'right' },
          { text: state.meta.rapportagedatum || '—', fontSize: 9, color: 'white', alignment: 'right', margin: [0, 0, 0, 4] },
          { text: 'VERSIE', fontSize: 7, color: 'white', bold: true, alignment: 'right' },
          { text: state.meta.versie || '—', fontSize: 9, color: 'white', alignment: 'right' }
        ],
        absolutePosition: { x: 400, y: 30 }
      },
      { text: ' ', margin: [0, 0, 0, 30] },
      {
        table: {
          widths: ['*'],
          body: [[{
            stack: [
              { text: 'LOCATIE', bold: true, color: 'white', fontSize: 11, characterSpacing: 1, margin: [0, 0, 0, 4] },
              { text: state.locatie.bedrijfsnaam || '—', fontSize: 14, color: 'white' },
              { text: state.locatie.adres || '—', fontSize: 10, color: COLORS.blueBg },
              { text: state.locatie.postcode_plaats || '—', fontSize: 10, color: COLORS.blueBg, margin: [0, 0, 0, 12] },
              { text: 'INSPECTIEDATUM', bold: true, color: 'white', fontSize: 11, characterSpacing: 1 },
              { text: state.inspectie.datum || '—', fontSize: 12, color: 'white', margin: [0, 0, 0, 8] },
              { text: 'INSPECTEUR', bold: true, color: 'white', fontSize: 11, characterSpacing: 1 },
              { text: state.inspectie.inspecteur || '—', fontSize: 12, color: 'white' }
            ],
            fillColor: COLORS.blue,
            margin: [12, 12, 12, 12]
          }]]
        },
        layout: 'noBorders',
        margin: [40, 0, 40, 20]
      },
      ...(state.fotos.overzicht?.length ? [{
        columns: state.fotos.overzicht.slice(0, 2).map(p => ({
          image: p.dataurl,
          width: 220,
          margin: [4, 4]
        }))
      }] : []),
      {
        canvas: [
          { type: 'rect', x: 0, y: 0, w: 595 - 80, h: 50, linearGradient: [COLORS.brown, COLORS.brownLight] }
        ],
        absolutePosition: { x: 40, y: 750 }
      },
      {
        columns: [
          { text: 'ISO 9001', alignment: 'center', color: 'white', fontSize: 9, bold: true },
          { text: 'VCA',      alignment: 'center', color: 'white', fontSize: 9, bold: true },
          { text: 'BRL 7700', alignment: 'center', color: 'white', fontSize: 9, bold: true },
          { text: 'SIKB',     alignment: 'center', color: 'white', fontSize: 9, bold: true }
        ],
        absolutePosition: { x: 40, y: 770 }
      }
    ],
    pageBreak: 'after'
  };
}

export function buildDocDefinition(state) {
  return {
    pageSize: 'A4',
    pageMargins: [40, 60, 40, 60],
    header: (currentPage) => currentPage === 1 ? null : ({
      canvas: [{ type: 'rect', x: 40, y: 20, w: 515, h: 25, linearGradient: [COLORS.brown, COLORS.brownLight] }]
    }),
    footer: (currentPage, pageCount) => ({
      columns: [
        { text: 'Symitech B.V. · Landsweg 4, 3237 KG Vierpolders', alignment: 'left', fontSize: 8, color: '#666', margin: [40, 0, 0, 0] },
        { text: `Pagina ${currentPage} van ${pageCount}`, alignment: 'right', fontSize: 8, color: '#666', margin: [0, 0, 40, 0] }
      ]
    }),
    content: compact([
      buildVoorpagina(state),
      buildSection1(state),
      buildSectionChecklistObas(state),
      buildSection2(state),
      buildSection3(state),
      buildSection4(state),
      buildSection5(state),
      buildSection6Inwendig(state),
      buildSection7Lekdichtheid(state),
      buildSection8Coating(state),
      buildSection6(state)
    ]),
    defaultStyle: { fontSize: 10, color: COLORS.text }
  };
}

export function buildSection1(state) {
  const i = state.installatie;

  const locatieRows = compact([
    dataRow('Bedrijfsnaam',     state.locatie.bedrijfsnaam),
    dataRow('Adres',            state.locatie.adres),
    dataRow('Postcode/Plaats',  state.locatie.postcode_plaats),
    dataRow('Contactpersoon',   state.locatie.contactpersoon),
    dataRow('Vorige inspectie', state.locatie.vorige_inspectie)
  ]);

  const opdrachtgeverRows = compact([
    dataRow('Bedrijfsnaam',     state.opdrachtgever.bedrijfsnaam),
    dataRow('Adres',            state.opdrachtgever.adres),
    dataRow('Postcode/Plaats',  state.opdrachtgever.postcode_plaats),
    dataRow('Contactpersoon',   state.opdrachtgever.contactpersoon),
    dataRow('Telefoon',         state.opdrachtgever.telefoon)
  ]);

  const inspectieRows = compact([
    dataRow('Datum',                state.inspectie.datum),
    dataRow('Uitvoerend bureau',    state.inspectie.uitvoerend_bureau),
    dataRow('Inspecteur',           state.inspectie.inspecteur),
    dataRow('Extern projectnr',     state.inspectie.extern_projectnr),
    dataRow('Weersomstandigheden',  state.inspectie.weersomstandigheden)
  ]);

  const installatieRows = compact([
    dataRow('Merk',                  i.merk),
    dataRow('Type / bouwjaar',       i.type_bouwjaar),
    dataRow('NS-klasse',             i.ns_klasse),
    dataRow('NS (l/s)',              i.ns_ls),
    dataRow('Capaciteit',            i.capaciteit_l ? `${i.capaciteit_l} L` : null),
    dataRow('Inhoud slibvanger',     i.inhoud_slibv_l ? `${i.inhoud_slibv_l} L` : null),
    dataRow('Materiaal afdekking',   i.mat_afdekking),
    dataRow('Materiaal opbouw',      i.mat_opbouw),
    dataRow('Inlaat Ø (mm)',         i.inlaat_mm),
    dataRow('Uitlaat Ø (mm)',        i.uitlaat_mm),
    dataRow('Type lozing',           i.type_lozing),
    dataRow('Lozingsvergunning',     i.lozingsvergunning_kenmerk)
  ]);

  // Locatie + Opdrachtgever NAAST ELKAAR (match HTML grid-2 layout)
  const locatieOpdrachtgeverColumns = (locatieRows.length || opdrachtgeverRows.length) ? [{
    columns: [
      { width: '*', stack: [locatieRows.length       ? subBlock('LOCATIE',       locatieRows)       : { text: '' }] },
      { width: 12, text: '' },
      { width: '*', stack: [opdrachtgeverRows.length ? subBlock('OPDRACHTGEVER', opdrachtgeverRows) : { text: '' }] }
    ]
  }] : [];

  return sectionCard('1. PROJECTGEGEVENS', [
    ...locatieOpdrachtgeverColumns,
    ...(inspectieRows.length   ? [subBlock('INSPECTIEGEGEVENS',                   inspectieRows)]   : []),
    ...(installatieRows.length ? [subBlock('TECHNISCHE SPECIFICATIES INSTALLATIE', installatieRows)] : []),
    photoBlock(state.fotos.installatie, "Foto's installatie:")
  ]);
}

// 24-punt visuele checklist conform NEN-EN 858-2 bron-PDF v2.0
// Volgorde matched exact met form-render.js — wijzig op één plek.
const CHECKLIST_OBAS_ITEMS = [
  [1,  'Afdekkingen',             'afdekkingen'],
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

const CHECKLIST_RESULTAAT_GLYPH = { goed: '✓', fout: '✗', nvt: 'n.v.t.' };
const CHECKLIST_RESULTAAT_COLOR = { goed: COLORS.green, fout: COLORS.red, nvt: '#888' };

export function buildSectionChecklistObas(state) {
  if (state.meta.interval !== '5jaarlijks') return null;
  const c = state.checklist_obas;
  const heeftData = CHECKLIST_OBAS_ITEMS.some(([, , key]) => c[key]?.resultaat || c[key]?.opmerking);
  if (!heeftData) return null;

  const headerCells = [
    { text: 'Nr.',          color: 'white', bold: true, fontSize: 9, alignment: 'center', fillColor: COLORS.blue, margin: [4, 4, 4, 4] },
    { text: 'Aandachtspunt',color: 'white', bold: true, fontSize: 9,                       fillColor: COLORS.blue, margin: [6, 4, 4, 4] },
    { text: 'Resultaat',    color: 'white', bold: true, fontSize: 9, alignment: 'center', fillColor: COLORS.blue, margin: [4, 4, 4, 4] },
    { text: 'Opmerkingen',  color: 'white', bold: true, fontSize: 9,                       fillColor: COLORS.blue, margin: [6, 4, 4, 4] }
  ];

  const dataRows = CHECKLIST_OBAS_ITEMS.map(([nr, label, key]) => {
    const item = c[key] || {};
    const heeftResult = !!item.resultaat;
    return [
      { text: String(nr),                fontSize: 9, alignment: 'center', color: COLORS.blue, bold: true, margin: [2, 3, 2, 3] },
      { text: label,                     fontSize: 9, margin: [6, 3, 4, 3] },
      {
        text:      heeftResult ? CHECKLIST_RESULTAAT_GLYPH[item.resultaat] : '—',
        color:     heeftResult ? CHECKLIST_RESULTAAT_COLOR[item.resultaat] : '#CCC',
        bold:      heeftResult,
        fontSize:  10,
        alignment: 'center',
        margin:    [2, 3, 2, 3]
      },
      { text: item.opmerking || '', fontSize: 8, italics: true, color: '#555', margin: [6, 3, 4, 3] }
    ];
  });

  return sectionCard('CHECKLIST INSPECTIE OBAS', [
    {
      text: 'Legenda: ✓ = Goed / Akkoord  ·  ✗ = Afwijking / Niet akkoord  ·  n.v.t. = Niet van toepassing',
      fontSize: 8, italics: true, color: '#666',
      margin: [0, 0, 0, 6]
    },
    {
      table: {
        headerRows: 1,
        widths: [24, '*', 50, '*'],
        body: [headerCells, ...dataRows]
      },
      layout: {
        fillColor: (rowIdx) => (rowIdx === 0 ? null : rowIdx % 2 === 0 ? COLORS.blueBg : null),
        hLineWidth: () => 0.4,
        vLineWidth: () => 0.4,
        hLineColor: () => '#CCC',
        vLineColor: () => '#CCC'
      }
    }
  ]);
}

// Kleur-mapping voor meting-percentages — visuele consistentie met HTML pct-badge
const PCT_COLORS = { groen: COLORS.green, oranje: COLORS.orange, rood: COLORS.red };

// metingRow: label + waardes + gekleurd percentage + LEGEN-flag indien grenswaarde overschreden
function metingRow(label, state, type, dikteKey, maxKey) {
  const gemeten = state.metingen[dikteKey];
  const max     = state.metingen[maxKey];
  if (gemeten == null || gemeten === '') return null;
  const pct = calcPercentage(gemeten, max);
  const kleur = pctKleur(pct, type);
  const legen = isLegenVereist(pct, type);
  return {
    columns: [
      { text: label, width: 140, bold: true, color: COLORS.blue, fontSize: 9 },
      {
        text: [
          { text: `${gemeten} / ${max || '—'} → `, color: COLORS.text },
          { text: `${pct}%`, color: PCT_COLORS[kleur] || COLORS.text, bold: true },
          ...(legen ? [{ text: '  ⚠ LEGEN VEREIST', color: COLORS.red, bold: true }] : [])
        ],
        fontSize: 9
      }
    ],
    margin: [0, 1, 0, 1]
  };
}

export function buildSection2(state) {
  const heeftData = state.metingen.olielaagdikte_mm !== '' || state.metingen.sliblaagdikte_mm !== '' || state.metingen.slibvolume_l !== '';
  if (!heeftData) return null;
  return sectionCard('2. METINGEN — NEN-EN 858-2 §6.1', [
    metingRow('Olielaagdikte (mm)',  state, 'olielaag',   'olielaagdikte_mm', 'olielaagdikte_max'),
    metingRow('Sliblaagdikte (mm)',  state, 'sliblaag',   'sliblaagdikte_mm', 'sliblaagdikte_max'),
    metingRow('Slibvolume (l)',      state, 'slibvolume', 'slibvolume_l',     'slibvolume_max'),
    photoBlock(state.fotos.metingen, "Foto's metingen:")
  ]);
}

const RESULTAAT_LABEL = { goed: '✓ Werkt', fout: '✗ Defect', nvt: 'n.v.t.' };

// Kleur-mapping voor check-results — visuele consistentie met HTML knop-stijl
const RESULTAAT_COLORS  = { goed: COLORS.green, fout: COLORS.red, nvt: '#888' };
const VOLDOET_COLORS    = { voldoet: COLORS.green, voldoet_niet: COLORS.red, nvt: '#888' };

// resultRow: label + gekleurd resultaat + opmerking, met lichtblauwe achtergrond (matched HTML .check-row)
function resultRow(label, resultCode, resultLabel, opmerking, colorMap) {
  if (!resultCode) return null;
  const color = colorMap[resultCode] || COLORS.text;
  return {
    table: {
      widths: ['*'],
      body: [[{
        columns: [
          { text: label, width: 140, bold: true, color: COLORS.blue, fontSize: 9 },
          {
            text: [
              { text: resultLabel, color, bold: true },
              ...(opmerking ? [{ text: ` — ${opmerking}`, color: COLORS.text, bold: false }] : [])
            ],
            fontSize: 9
          }
        ],
        fillColor: COLORS.blueBg,
        margin: [6, 4, 6, 4]
      }]]
    },
    layout: 'noBorders',
    margin: [0, 2, 0, 2]
  };
}

function functieRow(state, key, label) {
  const f = state.functietesten[key];
  if (!f.resultaat) return null;
  return resultRow(label, f.resultaat, RESULTAAT_LABEL[f.resultaat], f.opmerking, RESULTAAT_COLORS);
}

export function buildSection3(state) {
  const rows = compact([
    functieRow(state, 'auto_afsluiter',  'Auto-afsluiter'),
    functieRow(state, 'alarm_olielaag',  'Alarm olielaag'),
    functieRow(state, 'alarm_hoogwater', 'Alarm hoogwater')
  ]);
  if (!rows.length) return null;
  return sectionCard('3. FUNCTIETESTEN — NEN-EN 858-2 §6.3.1', [
    ...rows,
    photoBlock(state.fotos.auto_afsluiter,  "Foto's auto-afsluiter:"),
    photoBlock(state.fotos.alarm_olielaag,  "Foto's alarm olielaag:"),
    photoBlock(state.fotos.alarm_hoogwater, "Foto's alarm hoogwater:")
  ]);
}

export function buildSection4(state) {
  if (!state.controleput.schoongemaakt && !state.controleput.visuele_staat) return null;
  return sectionCard('4. CONTROLEPUT / BEMONSTERINGSSCHACHT', [
    dataRow('Schoongemaakt', state.controleput.schoongemaakt === 'ja' ? 'Ja' : state.controleput.schoongemaakt === 'nee' ? 'Nee' : null),
    dataRow('Visuele staat', state.controleput.visuele_staat),
    photoBlock(state.fotos.controleput, "Foto's controleput:")
  ]);
}

const LEDIGING_LABEL = {
  obas: 'Lediging OBAS',
  slibvang: 'Lediging slibvangput',
  kolken: 'Lediging kolken',
  recycle: 'Lediging recycleput',
  wasgoot: 'Lediging wasgoot',
  schoon_water_gevuld: 'Na lediging gevuld met schoon water'
};

const JA_NEE_LABEL = { ja: 'Ja', nee: 'Nee', nvt: 'n.v.t.' };

export function buildSection5(state) {
  const heeftLediging = Object.values(state.lediging).some(v => v === 'ja');
  const isJaarlijks = state.meta.interval === 'jaarlijks' || state.meta.interval === '5jaarlijks';
  if (!heeftLediging && !isJaarlijks) return null;
  const ledigingRows = Object.entries(state.lediging)
    .filter(([_, v]) => v)
    .map(([k, v]) => dataRow(LEDIGING_LABEL[k], JA_NEE_LABEL[v]))
    .filter(Boolean);
  const balRows = compact([
    dataRow('Verwerker',          state.bal.verwerker),
    dataRow('Transporteur',       state.bal.transporteur),
    dataRow('Afvoerbon',          state.bal.afvoerbon),
    dataRow('Euralcode',          state.bal.euralcode),
    dataRow('Hoeveelheid',        state.bal.hoeveelheid_l ? `${state.bal.hoeveelheid_l} L` : null),
    dataRow('Afgevoerd gewicht',  state.bal.afgevoerd_gewicht_kg ? `${state.bal.afgevoerd_gewicht_kg} kg` : null)
  ]);
  return sectionCard('5. LEDIGING + BAL-REGISTRATIE', [
    ...ledigingRows,
    ...(balRows.length ? [
      { text: 'BAL-registratie', bold: true, color: COLORS.blue, fontSize: 10, margin: [0, 8, 0, 4] },
      ...balRows,
      photoBlock(state.fotos.bal,                   "Foto's afvoerbon:"),
      photoBlock(state.fotos.afvalstroomformulier,  "Afvalstroomformulier:")
    ] : [])
  ]);
}

const INWENDIG_LABELS = {
  wanden_bodem:           'Wanden + bodem',
  schotten_vlotterkoker:  'Schotten / vlotterkoker',
  coalescentiefilter:     'Coalescentiefilter',
  afsluiter_mechanisch:   'Auto-afsluiter mechanisch',
  naden_aansluitingen:    'Naden / aansluitingen'
};

const ACTIE_LABEL = {
  goed: 'Goed (geen actie)',
  gereinigd: 'Gereinigd',
  vervangen: 'Vervangen',
  nvt: 'n.v.t.'
};

// Aparte mapping voor inwendige checks: "Goed" past beter bij visuele staat
// dan "Werkt" (RESULTAAT_LABEL is voor functietesten).
const INWENDIG_RESULTAAT_LABEL = {
  goed: '✓ Goed',
  fout: '✗ Defect',
  nvt: 'n.v.t.'
};

function inwendigRow(state, key) {
  const item = state.inwendig[key];
  if (!item.resultaat) return null;
  return resultRow(INWENDIG_LABELS[key], item.resultaat, INWENDIG_RESULTAAT_LABEL[item.resultaat], item.opmerking, RESULTAAT_COLORS);
}

export function buildSection6Inwendig(state) {
  if (state.meta.interval !== 'jaarlijks' && state.meta.interval !== '5jaarlijks') return null;
  const rows = compact([
    inwendigRow(state, 'wanden_bodem'),
    inwendigRow(state, 'schotten_vlotterkoker'),
    inwendigRow(state, 'coalescentiefilter'),
    inwendigRow(state, 'afsluiter_mechanisch'),
    inwendigRow(state, 'naden_aansluitingen')
  ]);
  if (!rows.length) return null;
  const coalActie = state.inwendig.coalescentiefilter?.actie;
  return sectionCard('6. INWENDIGE CONTROLE (na lediging)', [
    ...rows,
    coalActie ? dataRow('Coalescentiefilter — actie', ACTIE_LABEL[coalActie] || coalActie) : null,
    photoBlock(state.fotos.inwendig_wanden,       "Foto's wanden + bodem:"),
    photoBlock(state.fotos.inwendig_schotten,     "Foto's schotten / vlotterkoker:"),
    photoBlock(state.fotos.inwendig_coalescentie, "Foto's coalescentiefilter:"),
    photoBlock(state.fotos.inwendig_afsluiter,    "Foto's afsluiter mechanisch:"),
    photoBlock(state.fotos.inwendig_naden,        "Foto's naden / aansluitingen:")
  ]);
}

const EINDOORDEEL_LABEL = {
  goedgekeurd: { text: 'Goedgekeurd', color: COLORS.green },
  voorwaardelijk: { text: 'Voorwaardelijk goedgekeurd', color: COLORS.orange },
  afgekeurd: { text: 'Afgekeurd', color: COLORS.red }
};

function conclusieNummer(state) {
  if (state.meta.interval === '5jaarlijks') return '9';
  if (state.meta.interval === 'jaarlijks') return '7';
  return '6';
}

const TESTMETHODE_LABEL = {
  visueel: 'Visueel',
  hydrologisch: 'Hydrologisch',
  gecombineerd: 'Gecombineerd'
};

const RESULTAAT_VOLDOET_LABEL = {
  voldoet: '✓ Voldoet',
  voldoet_niet: '✗ Voldoet niet',
  nvt: 'n.v.t.'
};

export function buildSection7Lekdichtheid(state) {
  if (state.meta.interval !== '5jaarlijks') return null;
  if (!state.lekdichtheid.testmethode) return null;
  const l = state.lekdichtheid;
  const isHydroOfGecomb = l.testmethode === 'hydrologisch' || l.testmethode === 'gecombineerd';
  const rows = compact([
    dataRow('Testmethode', TESTMETHODE_LABEL[l.testmethode] || l.testmethode),
    isHydroOfGecomb ? dataRow('Testduur (min)',         l.testduur_min) : null,
    isHydroOfGecomb ? dataRow('Begin-niveau (mm)',      l.beginniveau_mm) : null,
    isHydroOfGecomb ? dataRow('Eind-niveau (mm)',       l.eindniveau_mm) : null,
    isHydroOfGecomb ? dataRow('Gemeten verlies (mm)',   l.gemeten_verlies_mm) : null,
    isHydroOfGecomb ? dataRow('Toegestaan (mm/uur)',    l.toegestaan_mm_uur) : null,
    l.opmerking ? dataRow('Opmerking', l.opmerking) : null,
    l.resultaat ? resultRow('Resultaat', l.resultaat, RESULTAAT_VOLDOET_LABEL[l.resultaat], '', VOLDOET_COLORS) : null
  ]);
  return sectionCard('7. LEKDICHTHEIDSTEST — NEN-EN 858-2 §6.3.3', [
    ...rows,
    photoBlock(state.fotos.lekdichtheid, "Foto's testopstelling / lekkage:")
  ]);
}

export function buildSection8Coating(state) {
  if (state.meta.interval !== '5jaarlijks') return null;
  if (!state.coating.aanwezig) return null;
  const c = state.coating;
  const rows = compact([
    dataRow('Coating aanwezig', c.aanwezig === 'ja' ? 'Ja' : 'Nee'),
    c.aanwezig === 'ja' ? dataRow('Type',              c.type) : null,
    c.aanwezig === 'ja' ? dataRow('Leeftijd (jaar)',   c.leeftijd_jaar) : null,
    c.aanwezig === 'ja' ? dataRow('Restlevensduur',    c.restlevensduur_jaar ? `${c.restlevensduur_jaar} jaar` : null) : null,
    c.aanwezig === 'ja' ? dataRow('Visuele staat',     c.visuele_staat) : null,
    c.resultaat ? resultRow('Resultaat', c.resultaat, RESULTAAT_VOLDOET_LABEL[c.resultaat], '', VOLDOET_COLORS) : null
  ]);
  return sectionCard('8. COATING-INSPECTIE', [
    ...rows,
    photoBlock(state.fotos.coating, "Foto's coating:")
  ]);
}

export function buildSection6(state) {
  if (!state.conclusie.eindoordeel) return null;
  const oordeel = EINDOORDEEL_LABEL[state.conclusie.eindoordeel];
  return sectionCard(conclusieNummer(state) + '. CONCLUSIE EN EINDOORDEEL', [
    {
      columns: [
        { text: 'Eindoordeel', width: 140, bold: true, color: COLORS.blue, fontSize: 9 },
        { text: oordeel.text, color: oordeel.color, bold: true, fontSize: 11 }
      ],
      margin: [0, 4]
    },
    ...(state.conclusie.toelichting ? [{
      text: state.conclusie.toelichting, fontSize: 9, italics: true,
      margin: [0, 4, 0, 4],
      background: COLORS.blueBg
    }] : []),
    dataRow('Volgende inspectie', state.conclusie.volgende_inspectie_datum),
    {
      table: {
        widths: ['*'],
        body: [[{
          stack: compact([
            { text: 'Inspecteur', bold: true, color: COLORS.blue, fontSize: 10, margin: [0, 0, 0, 4] },
            dataRow('Naam', state.conclusie.inspecteur_naam),
            dataRow('Datum', state.inspectie.datum),
            ...(state.conclusie.handtekening_dataurl ? [{
              image: state.conclusie.handtekening_dataurl,
              width: 200,
              margin: [0, 6, 0, 0]
            }] : [{ text: '(geen handtekening)', italics: true, color: '#888', fontSize: 9 }])
          ]),
          margin: [12, 12, 12, 12],
          fillColor: '#FAFAFA'
        }]]
      },
      layout: 'noBorders',
      margin: [0, 16, 0, 0]
    }
  ]);
}
