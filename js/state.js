export function createState() {
  return {
    meta: {
      interval: 'halfjaarlijks',
      projectnummer: '',
      rapportagedatum: new Date().toISOString().slice(0, 10),
      versie: '2.0'
    },
    locatie:       { bedrijfsnaam: '', adres: '', postcode_plaats: '', contactpersoon: '', vorige_inspectie: '' },
    opdrachtgever: { bedrijfsnaam: '', adres: '', postcode_plaats: '', contactpersoon: '', telefoon: '' },
    inspectie:     { datum: '', uitvoerend_bureau: '', inspecteur: '', extern_projectnr: '', weersomstandigheden: '' },
    installatie: {
      merk: '', type_bouwjaar: '', ns_klasse: '', ns_ls: '',
      capaciteit_l: '', mat_afdekking: '', inhoud_slibv_l: '', mat_opbouw: '',
      inlaat_mm: '', uitlaat_mm: '',
      type_lozing: '', lozingsvergunning_kenmerk: ''
    },
    metingen: {
      olielaagdikte_mm: '', olielaagdikte_max: 80,
      sliblaagdikte_mm: '', sliblaagdikte_max: 400,
      slibvolume_l: '', slibvolume_max: ''
    },
    functietesten: {
      auto_afsluiter:  { resultaat: '', opmerking: '' },
      alarm_olielaag:  { resultaat: '', opmerking: '' },
      alarm_hoogwater: { resultaat: '', opmerking: '' }
    },
    controleput: { schoongemaakt: '', visuele_staat: '' },
    lediging: { obas: '', slibvang: '', kolken: '', recycle: '', wasgoot: '', schoon_water_gevuld: '' },
    bal: {
      verwerker: '',
      transporteur: '',
      afvoerbon: '',
      euralcode: '',
      hoeveelheid_l: '',
      afgevoerd_gewicht_kg: ''
    },
    inwendig: {
      wanden_bodem:           { resultaat: '', opmerking: '' },
      schotten_vlotterkoker:  { resultaat: '', opmerking: '' },
      coalescentiefilter:     { resultaat: '', opmerking: '', actie: '' },
      afsluiter_mechanisch:   { resultaat: '', opmerking: '' },
      naden_aansluitingen:    { resultaat: '', opmerking: '' }
    },
    conclusie: {
      eindoordeel: '', toelichting: '', volgende_inspectie_datum: '',
      inspecteur_naam: '', handtekening_dataurl: ''
    },
    lekdichtheid: {
      testmethode: '',
      testduur_min: '',
      beginniveau_mm: '',
      eindniveau_mm: '',
      gemeten_verlies_mm: '',
      toegestaan_mm_uur: '',
      opmerking: '',
      resultaat: ''
    },
    coating: {
      aanwezig: '',
      type: '',
      leeftijd_jaar: '',
      restlevensduur_jaar: '',
      visuele_staat: '',
      resultaat: ''
    },
    checklist_obas: {
      afdekkingen:            { resultaat: '', opmerking: '' },
      opbouw_obas:            { resultaat: '', opmerking: '' },
      vlotterbal:             { resultaat: '', opmerking: '' },
      vlotterbalschotel:      { resultaat: '', opmerking: '' },
      grofvuilrooster:        { resultaat: '', opmerking: '' },
      inlaat_obas:            { resultaat: '', opmerking: '' },
      uitlaat_obas:           { resultaat: '', opmerking: '' },
      niveau_obas:            { resultaat: '', opmerking: '' },
      capaciteit_obas:        { resultaat: '', opmerking: '' },
      opbouw_slibvangput:     { resultaat: '', opmerking: '' },
      inlaat_slibvangput:     { resultaat: '', opmerking: '' },
      uitlaat_slibvangput:    { resultaat: '', opmerking: '' },
      niveau_slibvangput:     { resultaat: '', opmerking: '' },
      inhoud_slibvangput:     { resultaat: '', opmerking: '' },
      controleput:            { resultaat: '', opmerking: '' },
      niveau_controleput:     { resultaat: '', opmerking: '' },
      lozing:                 { resultaat: '', opmerking: '' },
      effluent_visueel:       { resultaat: '', opmerking: '' },
      coalescentiefilter:     { resultaat: '', opmerking: '' },
      alarm_olielaagdikte:    { resultaat: '', opmerking: '' },
      alarm_hoogwater:        { resultaat: '', opmerking: '' },
      recycleput:             { resultaat: '', opmerking: '' },
      accumat:                { resultaat: '', opmerking: '' },
      afvoerkanaal_gereinigd: { resultaat: '', opmerking: '' }
    },
    fotos: {
      overzicht: [], installatie: [], metingen: [],
      auto_afsluiter: [], alarm_olielaag: [], alarm_hoogwater: [],
      controleput: [], bal: [],
      afvalstroomformulier: [],
      inwendig_wanden: [], inwendig_schotten: [], inwendig_coalescentie: [],
      inwendig_afsluiter: [], inwendig_naden: [],
      lekdichtheid: [], coating: []
    }
  };
}

export function setField(state, path, value) {
  const parts = path.split('.');
  let target = state;
  for (let i = 0; i < parts.length - 1; i++) {
    target = target[parts[i]];
  }
  target[parts[parts.length - 1]] = value;
}

export function getField(state, path) {
  return path.split('.').reduce((acc, p) => (acc == null ? acc : acc[p]), state);
}

export function isBalZichtbaar(state) {
  return Object.values(state.lediging).some(v => v === 'ja');
}

export function exportJson(state) {
  return JSON.stringify(state, null, 2);
}

export function importJson(json) {
  try {
    return JSON.parse(json);
  } catch (e) {
    throw new Error('Concept-bestand bevat ongeldige JSON: ' + e.message);
  }
}
