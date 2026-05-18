// Test-data utility: vult state met realistische OBAS-data + 1:1 testfoto's.
// Activeer via URL-parameter ?test=true of via knop in action-bar.
// Niet in unit tests gebruikt — pure dev/demo helper.

function makeTestPhoto(label, hue = 200) {
  const size = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  const grad = ctx.createLinearGradient(0, 0, size, size);
  grad.addColorStop(0, `hsl(${hue}, 50%, 55%)`);
  grad.addColorStop(1, `hsl(${(hue + 35) % 360}, 60%, 35%)`);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  // diagonale streep voor visuele identificatie
  ctx.fillStyle = 'rgba(255,255,255,0.15)';
  ctx.beginPath();
  ctx.moveTo(0, size);
  ctx.lineTo(size, 0);
  ctx.lineTo(size, size * 0.3);
  ctx.lineTo(size * 0.3, size);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = 'white';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = 'bold 80px sans-serif';
  ctx.fillText('TESTFOTO', size / 2, size / 2 - 50);
  ctx.font = '52px sans-serif';
  ctx.fillText(label, size / 2, size / 2 + 50);

  return canvas.toDataURL('image/jpeg', 0.85);
}

function makePhotos(label, count, hue) {
  const out = [];
  for (let i = 1; i <= count; i++) {
    out.push({
      dataurl: makeTestPhoto(`${label} ${i}`, hue + i * 7),
      bijschrift: `${label} foto ${i}`
    });
  }
  return out;
}

function makeSignature() {
  const w = 500;
  const h = 120;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  ctx.strokeStyle = '#1A2B3F';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(60, 80);
  ctx.bezierCurveTo(120, 30, 180, 110, 240, 60);
  ctx.bezierCurveTo(280, 40, 320, 90, 380, 50);
  ctx.lineTo(420, 90);
  ctx.stroke();
  return canvas.toDataURL('image/png');
}

export function populateTestData(state) {
  const today = new Date().toISOString().slice(0, 10);
  const halfYearAgo = new Date(Date.now() - 182 * 86400e3).toISOString().slice(0, 10);
  const sixMonthsForward = new Date(Date.now() + 182 * 86400e3).toISOString().slice(0, 10);

  Object.assign(state.meta, {
    interval: '5jaarlijks',
    projectnummer: '24-1287',
    rapportagedatum: today,
    versie: '2.0'
  });

  Object.assign(state.locatie, {
    bedrijfsnaam: 'Garage van Dijk B.V.',
    adres: 'Industrieweg 12',
    postcode_plaats: '2316 EX Leiden',
    contactpersoon: 'J. van Dijk',
    vorige_inspectie: halfYearAgo
  });

  Object.assign(state.opdrachtgever, {
    bedrijfsnaam: 'Holding van Dijk B.V.',
    adres: 'Stadsplein 5',
    postcode_plaats: '2311 AB Leiden',
    contactpersoon: 'P. van Dijk',
    telefoon: '071-1234567'
  });

  Object.assign(state.inspectie, {
    datum: today,
    uitvoerend_bureau: 'Symitech B.V.',
    inspecteur: 'M. de Vries',
    extern_projectnr: 'EXT-2024-99',
    weersomstandigheden: 'Droog, 14°C, bewolkt'
  });

  Object.assign(state.installatie, {
    merk: 'ACO',
    type_bouwjaar: 'NSF-100 / 2018',
    ns_klasse: 'I',
    ns_ls: '15',
    capaciteit_l: '1000',
    mat_afdekking: 'Beton',
    inhoud_slibv_l: '700',
    mat_opbouw: 'Polyethyleen',
    inlaat_mm: '160',
    uitlaat_mm: '160',
    type_lozing: 'Vrij verval riool',
    lozingsvergunning_kenmerk: 'WSL-2024-1287'
  });

  Object.assign(state.metingen, {
    olielaagdikte_mm: '12',
    olielaagdikte_max: 80,
    sliblaagdikte_mm: '180',
    sliblaagdikte_max: 400,
    slibvolume_l: '320',
    slibvolume_max: '700'
  });

  state.functietesten.auto_afsluiter  = { resultaat: 'goed', opmerking: 'Vlotter beweegt vrij, dichting intact' };
  state.functietesten.alarm_olielaag  = { resultaat: 'goed', opmerking: 'Sensor reageert correct bij testniveau' };
  state.functietesten.alarm_hoogwater = { resultaat: 'fout', opmerking: 'Sensor reageert niet — vervangen voor volgende inspectie' };

  Object.assign(state.controleput, {
    schoongemaakt: 'ja',
    visuele_staat: 'Geen afwijkingen, controleput in goede staat'
  });

  Object.assign(state.lediging, {
    obas: 'ja',
    slibvang: 'ja',
    kolken: 'nee',
    recycle: 'nvt',
    wasgoot: 'nvt',
    schoon_water_gevuld: 'ja'
  });

  Object.assign(state.bal, {
    verwerker: 'Van Vliet B.V.',
    transporteur: 'Van Vliet Transport',
    afvoerbon: 'BAL-2026-04-1287 d.d. ' + today,
    euralcode: '13 05 02*',
    hoeveelheid_l: '320',
    afgevoerd_gewicht_kg: '1250'
  });

  state.inwendig.wanden_bodem          = { resultaat: 'goed', opmerking: 'Geen scheuren of aantasting waargenomen' };
  state.inwendig.schotten_vlotterkoker = { resultaat: 'goed', opmerking: 'Schotten in goede staat' };
  state.inwendig.coalescentiefilter    = { resultaat: 'fout', opmerking: 'Filter sterk vervuild, vervangen', actie: 'vervangen' };
  state.inwendig.afsluiter_mechanisch  = { resultaat: 'goed', opmerking: 'Vlotter handmatig opgetild — afsluiter sluit correct' };
  state.inwendig.naden_aansluitingen   = { resultaat: 'goed', opmerking: 'Aansluitingen waterdicht' };

  Object.assign(state.lekdichtheid, {
    testmethode: 'hydrologisch',
    testduur_min: '60',
    beginniveau_mm: '1000',
    eindniveau_mm: '998',
    gemeten_verlies_mm: '2',
    toegestaan_mm_uur: '3',
    opmerking: 'Testopstelling conform protocol 6703 §4.2',
    resultaat: 'voldoet'
  });

  Object.assign(state.coating, {
    aanwezig: 'ja',
    type: 'Epoxy 2-componenten',
    leeftijd_jaar: '8',
    restlevensduur_jaar: '4',
    visuele_staat: 'Lichte craquelé op enkele plekken, geen blaarvorming of hechtingsverlies. Visueel in goede staat.',
    resultaat: 'voldoet'
  });

  // 24-punt visuele checklist conform NEN-EN 858-2 bron-PDF v2.0
  Object.assign(state.checklist_obas, {
    afdekkingen:            { resultaat: 'goed', opmerking: 'Gietijzeren afdekking, intact, sluit goed' },
    opbouw_obas:            { resultaat: 'goed', opmerking: 'PE-opbouw, geen scheuren of vervorming' },
    vlotterbal:             { resultaat: 'goed', opmerking: 'Vlotter beweegt vrij in koker' },
    vlotterbalschotel:      { resultaat: 'goed', opmerking: 'Dichting intact, geen aantasting' },
    grofvuilrooster:        { resultaat: 'nvt',  opmerking: 'Geen rooster aanwezig op deze installatie' },
    inlaat_obas:            { resultaat: 'goed', opmerking: 'Inlaat vrij van obstructie' },
    uitlaat_obas:           { resultaat: 'goed', opmerking: 'Uitlaat vrij doorstromend' },
    niveau_obas:            { resultaat: 'goed', opmerking: 'Waterniveau conform fabrieksspec' },
    capaciteit_obas:        { resultaat: 'goed', opmerking: '1000 L, voldoet aan ontwerp' },
    opbouw_slibvangput:     { resultaat: 'goed', opmerking: 'Beton zonder zichtbare schade' },
    inlaat_slibvangput:     { resultaat: 'goed', opmerking: 'Inlaat vrij' },
    uitlaat_slibvangput:    { resultaat: 'goed', opmerking: 'Uitlaat naar OBAS vrij' },
    niveau_slibvangput:     { resultaat: 'goed', opmerking: 'Waterniveau correct' },
    inhoud_slibvangput:     { resultaat: 'fout', opmerking: 'Slibvolume 46% — lediging aanbevolen voor volgende periode' },
    controleput:            { resultaat: 'goed', opmerking: 'Schoon en bemonsterbaar' },
    niveau_controleput:     { resultaat: 'goed', opmerking: 'Niveau gelijk met uitlaat OBAS' },
    lozing:                 { resultaat: 'goed', opmerking: 'Vrij verval riool, geen terugslag' },
    effluent_visueel:       { resultaat: 'goed', opmerking: 'Helder, geen oliedrijflaag' },
    coalescentiefilter:     { resultaat: 'fout', opmerking: 'Sterk vervuild — vervangen tijdens inwendige controle' },
    alarm_olielaagdikte:    { resultaat: 'goed', opmerking: 'Reageert correct bij testniveau' },
    alarm_hoogwater:        { resultaat: 'fout', opmerking: 'Sensor reageert niet — vervangen voor volgende inspectie' },
    recycleput:             { resultaat: 'nvt',  opmerking: 'Niet van toepassing op deze installatie' },
    accumat:                { resultaat: 'nvt',  opmerking: 'Geen accumat geïnstalleerd' },
    afvoerkanaal_gereinigd: { resultaat: 'goed', opmerking: 'Afvoerkanaal vrij van bezinksel' }
  });

  Object.assign(state.conclusie, {
    eindoordeel: 'voorwaardelijk',
    toelichting: 'Installatie functioneert. Alarm hoogwater defect — vervangen voor volgende halfjaarlijkse inspectie. Coalescentiefilter vervangen tijdens deze keuring.',
    volgende_inspectie_datum: sixMonthsForward,
    inspecteur_naam: 'M. de Vries',
    handtekening_dataurl: makeSignature()
  });

  // Foto's per sectie — 1-2 per slot voor compacte demo
  state.fotos.overzicht           = makePhotos('Overzicht',          2, 200);
  state.fotos.installatie         = makePhotos('Installatie',        2, 220);
  state.fotos.metingen            = makePhotos('Metingen',           1, 240);
  state.fotos.auto_afsluiter      = makePhotos('Auto-afsluiter',     1, 30);
  state.fotos.alarm_olielaag      = makePhotos('Alarm olielaag',     1, 60);
  state.fotos.alarm_hoogwater     = makePhotos('Alarm hoogwater',    1, 0);
  state.fotos.controleput         = makePhotos('Controleput',        1, 280);
  state.fotos.bal                 = makePhotos('Afvoerbon',          1, 100);
  state.fotos.afvalstroomformulier = makePhotos('Afvalstroom',       1, 120);
  state.fotos.inwendig_wanden       = makePhotos('Wanden + bodem',     1, 320);
  state.fotos.inwendig_schotten     = makePhotos('Schotten',           1, 340);
  state.fotos.inwendig_coalescentie = makePhotos('Coalescentiefilter', 1, 0);
  state.fotos.inwendig_afsluiter    = makePhotos('Afsluiter',          1, 30);
  state.fotos.inwendig_naden        = makePhotos('Naden',              1, 60);
  state.fotos.lekdichtheid          = makePhotos('Lekdichtheid',       1, 180);
  state.fotos.coating               = makePhotos('Coating',            1, 280);

  return state;
}

export function isTestMode() {
  if (typeof window === 'undefined') return false;
  return new URLSearchParams(window.location.search).get('test') === 'true';
}
