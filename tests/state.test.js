import { describe, it, expect, beforeEach } from 'vitest';
import { createState, setField, getField, isBalZichtbaar, exportJson, importJson } from '../js/state.js';

describe('createState', () => {
  it('creates default state with halfjaarlijks interval', () => {
    const s = createState();
    expect(s.meta.interval).toBe('halfjaarlijks');
    expect(s.locatie.bedrijfsnaam).toBe('');
    expect(s.fotos.overzicht).toEqual([]);
  });
});

describe('setField/getField', () => {
  let s;
  beforeEach(() => { s = createState(); });

  it('sets and gets nested values via dot path', () => {
    setField(s, 'locatie.bedrijfsnaam', 'Garage van Dijk');
    expect(getField(s, 'locatie.bedrijfsnaam')).toBe('Garage van Dijk');
  });

  it('sets metingen value', () => {
    setField(s, 'metingen.olielaagdikte_mm', 12);
    expect(getField(s, 'metingen.olielaagdikte_mm')).toBe(12);
  });
});

describe('isBalZichtbaar', () => {
  it('false when geen lediging Ja', () => {
    const s = createState();
    expect(isBalZichtbaar(s)).toBe(false);
  });
  it('true when minstens een lediging Ja', () => {
    const s = createState();
    setField(s, 'lediging.slibvang', 'ja');
    expect(isBalZichtbaar(s)).toBe(true);
  });
});

describe('exportJson/importJson', () => {
  it('roundtrips state', () => {
    const s = createState();
    setField(s, 'locatie.bedrijfsnaam', 'Test BV');
    setField(s, 'metingen.olielaagdikte_mm', 25);
    const json = exportJson(s);
    const restored = importJson(json);
    expect(restored.locatie.bedrijfsnaam).toBe('Test BV');
    expect(restored.metingen.olielaagdikte_mm).toBe(25);
  });
});

describe('importJson error handling', () => {
  it('throws SyntaxError on corrupte JSON', () => {
    expect(() => importJson('{invalid json}')).toThrow();
  });
  it('throws on lege string', () => {
    expect(() => importJson('')).toThrow();
  });
});

describe('createState fase 2 — bal afgevoerd gewicht', () => {
  it('bal heeft afgevoerd_gewicht_kg veld', () => {
    const s = createState();
    expect(s.bal).toHaveProperty('afgevoerd_gewicht_kg');
    expect(s.bal.afgevoerd_gewicht_kg).toBe('');
  });
});

describe('createState fase 2 — inwendig', () => {
  it('heeft inwendig object met 5 items', () => {
    const s = createState();
    expect(s.inwendig).toBeDefined();
    expect(s.inwendig.wanden_bodem).toEqual({ resultaat: '', opmerking: '' });
    expect(s.inwendig.schotten_vlotterkoker).toEqual({ resultaat: '', opmerking: '' });
    expect(s.inwendig.coalescentiefilter).toEqual({ resultaat: '', opmerking: '', actie: '' });
    expect(s.inwendig.afsluiter_mechanisch).toEqual({ resultaat: '', opmerking: '' });
    expect(s.inwendig.naden_aansluitingen).toEqual({ resultaat: '', opmerking: '' });
  });
});

describe('createState fase 2 — fotos uitbreiding', () => {
  it('heeft afvalstroomformulier en inwendig_* foto-keys', () => {
    const s = createState();
    expect(s.fotos.afvalstroomformulier).toEqual([]);
    expect(s.fotos.inwendig_wanden).toEqual([]);
    expect(s.fotos.inwendig_schotten).toEqual([]);
    expect(s.fotos.inwendig_coalescentie).toEqual([]);
    expect(s.fotos.inwendig_afsluiter).toEqual([]);
    expect(s.fotos.inwendig_naden).toEqual([]);
  });
});

describe('setField op nested inwendig.coalescentiefilter.actie', () => {
  it('zet en leest waarde correct', () => {
    const s = createState();
    setField(s, 'inwendig.coalescentiefilter.actie', 'gereinigd');
    expect(getField(s, 'inwendig.coalescentiefilter.actie')).toBe('gereinigd');
  });
});

describe('createState fase 3 — lekdichtheid', () => {
  it('heeft lekdichtheid object met 7 velden', () => {
    const s = createState();
    expect(s.lekdichtheid).toEqual({
      testmethode: '',
      testduur_min: '',
      beginniveau_mm: '',
      eindniveau_mm: '',
      gemeten_verlies_mm: '',
      toegestaan_mm_uur: '',
      opmerking: '',
      resultaat: ''
    });
  });
});

describe('createState fase 3 — coating', () => {
  it('heeft coating object met 6 velden', () => {
    const s = createState();
    expect(s.coating).toEqual({
      aanwezig: '',
      type: '',
      leeftijd_jaar: '',
      restlevensduur_jaar: '',
      visuele_staat: '',
      resultaat: ''
    });
  });
});

describe('createState fase 3 — fotos', () => {
  it('heeft lekdichtheid en coating foto-arrays', () => {
    const s = createState();
    expect(s.fotos.lekdichtheid).toEqual([]);
    expect(s.fotos.coating).toEqual([]);
  });
});

describe('setField op nested coating.leeftijd_jaar', () => {
  it('zet en leest correct', () => {
    const s = createState();
    setField(s, 'coating.leeftijd_jaar', '8');
    expect(getField(s, 'coating.leeftijd_jaar')).toBe('8');
  });
});

describe('createState fase 4 — checklist_obas (24 aandachtspunten)', () => {
  it('heeft checklist_obas object met 24 items', () => {
    const s = createState();
    expect(s.checklist_obas).toBeDefined();
    expect(Object.keys(s.checklist_obas)).toHaveLength(24);
  });

  it('elk checklist-item heeft resultaat en opmerking als lege string', () => {
    const s = createState();
    Object.values(s.checklist_obas).forEach(item => {
      expect(item).toEqual({ resultaat: '', opmerking: '' });
    });
  });

  it('bevat de 24 verwachte aandachtspunt-keys uit de NEN-EN 858-2 bron-PDF', () => {
    const s = createState();
    const expected = [
      'afdekkingen', 'opbouw_obas', 'vlotterbal', 'vlotterbalschotel',
      'grofvuilrooster', 'inlaat_obas', 'uitlaat_obas', 'niveau_obas',
      'capaciteit_obas', 'opbouw_slibvangput', 'inlaat_slibvangput',
      'uitlaat_slibvangput', 'niveau_slibvangput', 'inhoud_slibvangput',
      'controleput', 'niveau_controleput', 'lozing', 'effluent_visueel',
      'coalescentiefilter', 'alarm_olielaagdikte', 'alarm_hoogwater',
      'recycleput', 'accumat', 'afvoerkanaal_gereinigd'
    ];
    expected.forEach(key => {
      expect(s.checklist_obas).toHaveProperty(key);
    });
  });

  it('setField op checklist_obas.afdekkingen.resultaat werkt', () => {
    const s = createState();
    setField(s, 'checklist_obas.afdekkingen.resultaat', 'goed');
    expect(getField(s, 'checklist_obas.afdekkingen.resultaat')).toBe('goed');
  });
});
