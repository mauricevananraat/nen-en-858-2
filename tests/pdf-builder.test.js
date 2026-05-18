import { describe, it, expect } from 'vitest';
import { buildVoorpagina, buildDocDefinition, buildSection1, buildSection2, buildSection3, buildSection4, buildSection5, buildSection6, buildSection6Inwendig, buildSection7Lekdichtheid, buildSection8Coating } from '../js/pdf-builder.js';
import { createState, setField } from '../js/state.js';

describe('buildVoorpagina', () => {
  it('bevat titel met interval-naam', () => {
    const s = createState();
    setField(s, 'meta.interval', 'halfjaarlijks');
    setField(s, 'locatie.bedrijfsnaam', 'Garage van Dijk B.V.');
    const cover = buildVoorpagina(s);
    const txt = JSON.stringify(cover);
    expect(txt).toMatch(/HALFJAARLIJKSE KEURING/);
    expect(txt).toMatch(/Garage van Dijk B\.V\./);
    expect(txt).toMatch(/NEN-EN 858-2:2003/);
  });

  it('bevat geen BRL 7000 in certificeringen', () => {
    const s = createState();
    const cover = buildVoorpagina(s);
    const txt = JSON.stringify(cover);
    expect(txt).not.toMatch(/BRL 7000/i);
    expect(txt).not.toMatch(/BRL SIKB 7000/i);
  });
});

describe('buildDocDefinition', () => {
  it('returns object met content array', () => {
    const s = createState();
    const dd = buildDocDefinition(s);
    expect(dd).toHaveProperty('content');
    expect(Array.isArray(dd.content)).toBe(true);
  });

  it('bevat header en footer functies', () => {
    const s = createState();
    const dd = buildDocDefinition(s);
    expect(typeof dd.header).toBe('function');
    expect(typeof dd.footer).toBe('function');
  });
});

describe('buildSection1', () => {
  it('bevat sectiekop en velden', () => {
    const s = createState();
    setField(s, 'locatie.bedrijfsnaam', 'Test BV');
    const sec = buildSection1(s);
    const txt = JSON.stringify(sec);
    expect(txt).toMatch(/PROJECTGEGEVENS/);
    expect(txt).toMatch(/Test BV/);
  });
  it('toont fotos.installatie alleen als aanwezig', () => {
    const s = createState();
    const secZonder = buildSection1(s);
    expect(JSON.stringify(secZonder)).not.toMatch(/Foto's installatie/);
    s.fotos.installatie.push({ dataurl: 'data:image/png;base64,abc', bijschrift: '' });
    const secMet = buildSection1(s);
    expect(JSON.stringify(secMet)).toMatch(/Foto's installatie/);
  });
});

describe('buildSection2', () => {
  it('toont metingen met percentages', () => {
    const s = createState();
    setField(s, 'metingen.olielaagdikte_mm', 12);
    setField(s, 'metingen.olielaagdikte_max', 80);
    const sec = buildSection2(s);
    expect(JSON.stringify(sec)).toMatch(/Olielaagdikte/);
    expect(JSON.stringify(sec)).toMatch(/15%/);
  });
});

describe('buildSection3', () => {
  it('toont alleen functietesten met resultaat', () => {
    const s = createState();
    setField(s, 'functietesten.auto_afsluiter.resultaat', 'goed');
    const sec = buildSection3(s);
    const txt = JSON.stringify(sec);
    expect(txt).toMatch(/Auto-afsluiter/);
    expect(txt).toMatch(/Werkt|goed/);
  });
});

describe('buildSection4', () => {
  it('returnt null bij lege controleput-state', () => {
    const s = createState();
    expect(buildSection4(s)).toBeNull();
  });
  it('toont schoongemaakt en visuele staat', () => {
    const s = createState();
    setField(s, 'controleput.schoongemaakt', 'ja');
    setField(s, 'controleput.visuele_staat', 'Geen afwijkingen');
    const sec = buildSection4(s);
    const txt = JSON.stringify(sec);
    expect(txt).toMatch(/CONTROLEPUT/);
    expect(txt).toMatch(/Ja/);
    expect(txt).toMatch(/Geen afwijkingen/);
  });
});

describe('buildSection5', () => {
  it('returnt null als geen lediging Ja', () => {
    const s = createState();
    expect(buildSection5(s)).toBeNull();
  });
  it('toont lediging + BAL als slibvang Ja', () => {
    const s = createState();
    setField(s, 'lediging.slibvang', 'ja');
    setField(s, 'bal.verwerker', 'Van Vliet B.V.');
    const sec = buildSection5(s);
    const txt = JSON.stringify(sec);
    expect(txt).toMatch(/LEDIGING/);
    expect(txt).toMatch(/Van Vliet B\.V\./);
  });
});

describe('buildSection6', () => {
  it('returnt null als geen eindoordeel', () => {
    const s = createState();
    expect(buildSection6(s)).toBeNull();
  });
  it('toont eindoordeel + handtekening', () => {
    const s = createState();
    setField(s, 'conclusie.eindoordeel', 'goedgekeurd');
    setField(s, 'conclusie.inspecteur_naam', 'M. de Vries');
    setField(s, 'conclusie.handtekening_dataurl', 'data:image/png;base64,iVBORw==');
    const sec = buildSection6(s);
    const txt = JSON.stringify(sec);
    expect(txt).toMatch(/Goedgekeurd/);
    expect(txt).toMatch(/M\. de Vries/);
  });
});

describe('buildSection6Inwendig', () => {
  it('returnt null bij interval halfjaarlijks ongeacht state', () => {
    const s = createState();
    setField(s, 'meta.interval', 'halfjaarlijks');
    setField(s, 'inwendig.wanden_bodem.resultaat', 'goed');
    expect(buildSection6Inwendig(s)).toBeNull();
  });

  it('returnt null bij jaarlijks als alle inwendige items leeg', () => {
    const s = createState();
    setField(s, 'meta.interval', 'jaarlijks');
    expect(buildSection6Inwendig(s)).toBeNull();
  });

  it('toont items bij jaarlijks met ingevulde state', () => {
    const s = createState();
    setField(s, 'meta.interval', 'jaarlijks');
    setField(s, 'inwendig.wanden_bodem.resultaat', 'goed');
    setField(s, 'inwendig.coalescentiefilter.resultaat', 'fout');
    setField(s, 'inwendig.coalescentiefilter.actie', 'vervangen');
    const sec = buildSection6Inwendig(s);
    const txt = JSON.stringify(sec);
    expect(txt).toMatch(/INWENDIGE CONTROLE/);
    expect(txt).toMatch(/Wanden \+ bodem|Wanden\/bodem|Wanden/);
    expect(txt).toMatch(/Coalescentiefilter/);
    expect(txt).toMatch(/vervangen/i);
  });

  it('toont items bij 5jaarlijks met ingevulde state (regressie)', () => {
    const s = createState();
    setField(s, 'meta.interval', '5jaarlijks');
    setField(s, 'inwendig.wanden_bodem.resultaat', 'goed');
    const sec = buildSection6Inwendig(s);
    const txt = JSON.stringify(sec);
    expect(txt).toMatch(/INWENDIGE CONTROLE/);
    expect(txt).toMatch(/Goed|goed/);
  });
});

describe('buildSection6 (Conclusie) — dynamische nummering', () => {
  it('label "6." bij halfjaarlijks', () => {
    const s = createState();
    setField(s, 'meta.interval', 'halfjaarlijks');
    setField(s, 'conclusie.eindoordeel', 'goedgekeurd');
    const sec = buildSection6(s);
    expect(JSON.stringify(sec)).toMatch(/6\. CONCLUSIE/);
  });

  it('label "7." bij jaarlijks', () => {
    const s = createState();
    setField(s, 'meta.interval', 'jaarlijks');
    setField(s, 'conclusie.eindoordeel', 'goedgekeurd');
    const sec = buildSection6(s);
    expect(JSON.stringify(sec)).toMatch(/7\. CONCLUSIE/);
  });
});

describe('buildSection5 — afgevoerd gewicht in PDF', () => {
  it('toont afgevoerd gewicht als ingevuld', () => {
    const s = createState();
    setField(s, 'lediging.slibvang', 'ja');
    setField(s, 'bal.afgevoerd_gewicht_kg', '1250');
    const sec = buildSection5(s);
    expect(JSON.stringify(sec)).toMatch(/1250/);
    expect(JSON.stringify(sec)).toMatch(/Afgevoerd gewicht|Gewicht/);
  });
});

describe('buildVoorpagina — JAARLIJKSE KEURING bij interval=jaarlijks', () => {
  it('titel toont JAARLIJKSE KEURING', () => {
    const s = createState();
    setField(s, 'meta.interval', 'jaarlijks');
    const cover = buildVoorpagina(s);
    expect(JSON.stringify(cover)).toMatch(/JAARLIJKSE KEURING/);
  });
});

describe('buildSection5 — fase 2 jaarlijks-gedrag', () => {
  it('toont sectie bij jaarlijks zonder lediging-vinkje', () => {
    const s = createState();
    setField(s, 'meta.interval', 'jaarlijks');
    setField(s, 'bal.verwerker', 'Test BV');
    const sec = buildSection5(s);
    expect(sec).not.toBeNull();
    expect(JSON.stringify(sec)).toMatch(/Test BV/);
  });

  it('blijft null bij halfjaarlijks zonder lediging', () => {
    const s = createState();
    setField(s, 'meta.interval', 'halfjaarlijks');
    expect(buildSection5(s)).toBeNull();
  });
});

describe('buildSection7Lekdichtheid', () => {
  it('null bij interval halfjaarlijks', () => {
    const s = createState();
    setField(s, 'meta.interval', 'halfjaarlijks');
    setField(s, 'lekdichtheid.testmethode', 'visueel');
    expect(buildSection7Lekdichtheid(s)).toBeNull();
  });
  it('null bij 5jaarlijks zonder testmethode', () => {
    const s = createState();
    setField(s, 'meta.interval', '5jaarlijks');
    expect(buildSection7Lekdichtheid(s)).toBeNull();
  });
  it('toont content bij 5jaarlijks met methode hydrologisch', () => {
    const s = createState();
    setField(s, 'meta.interval', '5jaarlijks');
    setField(s, 'lekdichtheid.testmethode', 'hydrologisch');
    setField(s, 'lekdichtheid.beginniveau_mm', '500');
    setField(s, 'lekdichtheid.eindniveau_mm', '498');
    setField(s, 'lekdichtheid.resultaat', 'voldoet');
    const sec = buildSection7Lekdichtheid(s);
    const txt = JSON.stringify(sec);
    expect(txt).toMatch(/LEKDICHTHEIDSTEST/);
    expect(txt).toMatch(/Hydrologisch/i);
    expect(txt).toMatch(/Voldoet/i);
    expect(txt).toMatch(/500/);
  });
  it('toont alleen beperkte velden bij methode visueel', () => {
    const s = createState();
    setField(s, 'meta.interval', '5jaarlijks');
    setField(s, 'lekdichtheid.testmethode', 'visueel');
    setField(s, 'lekdichtheid.beginniveau_mm', '500');
    setField(s, 'lekdichtheid.resultaat', 'voldoet');
    const sec = buildSection7Lekdichtheid(s);
    const txt = JSON.stringify(sec);
    expect(txt).toMatch(/Visueel/i);
    expect(txt).not.toMatch(/500/);
    expect(txt).not.toMatch(/Begin-niveau|Beginniveau/);
  });
});

describe('buildSection8Coating', () => {
  it('null bij interval halfjaarlijks', () => {
    const s = createState();
    setField(s, 'meta.interval', 'halfjaarlijks');
    setField(s, 'coating.aanwezig', 'ja');
    expect(buildSection8Coating(s)).toBeNull();
  });
  it('null bij 5jaarlijks zonder aanwezig-keuze', () => {
    const s = createState();
    setField(s, 'meta.interval', '5jaarlijks');
    expect(buildSection8Coating(s)).toBeNull();
  });
  it('toont alleen "Coating aanwezig: Nee" bij aanwezig=nee', () => {
    const s = createState();
    setField(s, 'meta.interval', '5jaarlijks');
    setField(s, 'coating.aanwezig', 'nee');
    const sec = buildSection8Coating(s);
    const txt = JSON.stringify(sec);
    expect(txt).toMatch(/COATING-INSPECTIE/);
    expect(txt).toMatch(/Nee/i);
  });
  it('toont detail-velden bij aanwezig=ja', () => {
    const s = createState();
    setField(s, 'meta.interval', '5jaarlijks');
    setField(s, 'coating.aanwezig', 'ja');
    setField(s, 'coating.type', 'epoxy');
    setField(s, 'coating.leeftijd_jaar', '8');
    setField(s, 'coating.resultaat', 'voldoet');
    const sec = buildSection8Coating(s);
    const txt = JSON.stringify(sec);
    expect(txt).toMatch(/epoxy/);
    expect(txt).toMatch(/8/);
    expect(txt).toMatch(/Voldoet/i);
  });
});

describe('buildSection6 (Conclusie) — nummer 9 bij 5jaarlijks', () => {
  it('label "9." bij 5jaarlijks', () => {
    const s = createState();
    setField(s, 'meta.interval', '5jaarlijks');
    setField(s, 'conclusie.eindoordeel', 'goedgekeurd');
    const sec = buildSection6(s);
    expect(JSON.stringify(sec)).toMatch(/9\. CONCLUSIE/);
  });
});

describe('buildVoorpagina — 5-JAARLIJKSE bij interval=5jaarlijks', () => {
  it('toont 5-JAARLIJKSE KEURING', () => {
    const s = createState();
    setField(s, 'meta.interval', '5jaarlijks');
    expect(JSON.stringify(buildVoorpagina(s))).toMatch(/5-JAARLIJKSE KEURING/);
  });
});

describe('buildVoorpagina — meta velden header', () => {
  it('toont projectnummer / rapportagedatum / versie', () => {
    const s = createState();
    setField(s, 'meta.projectnummer', '24-1287');
    setField(s, 'meta.rapportagedatum', '2026-04-28');
    setField(s, 'meta.versie', '2.0');
    const cover = buildVoorpagina(s);
    const txt = JSON.stringify(cover);
    expect(txt).toMatch(/24-1287/);
    expect(txt).toMatch(/2026-04-28/);
    expect(txt).toMatch(/2\.0/);
    expect(txt).toMatch(/PROJECTNUMMER/);
    expect(txt).toMatch(/RAPPORTAGEDATUM/);
    expect(txt).toMatch(/VERSIE/);
  });
});

describe('buildSection1 — alle uitgebreide velden', () => {
  it('toont alle locatie-velden inclusief vorige inspectie', () => {
    const s = createState();
    setField(s, 'locatie.bedrijfsnaam', 'Loc BV');
    setField(s, 'locatie.contactpersoon', 'J. Jansen');
    setField(s, 'locatie.vorige_inspectie', '2025-10-28');
    const sec = buildSection1(s);
    const txt = JSON.stringify(sec);
    expect(txt).toMatch(/Loc BV/);
    expect(txt).toMatch(/J\. Jansen/);
    expect(txt).toMatch(/2025-10-28/);
  });

  it('toont volledige opdrachtgever-blok', () => {
    const s = createState();
    setField(s, 'opdrachtgever.bedrijfsnaam', 'Opdr BV');
    setField(s, 'opdrachtgever.adres', 'Hoofdstraat 1');
    setField(s, 'opdrachtgever.postcode_plaats', '1234 AB Amsterdam');
    setField(s, 'opdrachtgever.contactpersoon', 'P. Pieters');
    setField(s, 'opdrachtgever.telefoon', '0612345678');
    const sec = buildSection1(s);
    const txt = JSON.stringify(sec);
    expect(txt).toMatch(/Opdr BV/);
    expect(txt).toMatch(/Hoofdstraat 1/);
    expect(txt).toMatch(/1234 AB Amsterdam/);
    expect(txt).toMatch(/P\. Pieters/);
    expect(txt).toMatch(/0612345678/);
    expect(txt).toMatch(/OPDRACHTGEVER/);
  });

  it('toont uitvoerend bureau + extern projectnr', () => {
    const s = createState();
    setField(s, 'inspectie.uitvoerend_bureau', 'Symitech B.V.');
    setField(s, 'inspectie.extern_projectnr', 'EXT-2024-99');
    const sec = buildSection1(s);
    const txt = JSON.stringify(sec);
    expect(txt).toMatch(/Symitech B\.V\./);
    expect(txt).toMatch(/EXT-2024-99/);
  });

  it('toont alle uitgebreide installatie-velden', () => {
    const s = createState();
    setField(s, 'installatie.type_bouwjaar', 'NSF-100 / 2018');
    setField(s, 'installatie.ns_ls', '15');
    setField(s, 'installatie.mat_afdekking', 'Beton');
    setField(s, 'installatie.inhoud_slibv_l', '700');
    setField(s, 'installatie.mat_opbouw', 'Kunststof');
    setField(s, 'installatie.inlaat_mm', '160');
    setField(s, 'installatie.uitlaat_mm', '160');
    const sec = buildSection1(s);
    const txt = JSON.stringify(sec);
    expect(txt).toMatch(/NSF-100 \/ 2018/);
    expect(txt).toMatch(/Beton/);
    expect(txt).toMatch(/Kunststof/);
    expect(txt).toMatch(/700/);
    expect(txt).toMatch(/15/);
    expect(txt).toMatch(/160/);
  });

  it('toont subkoppen voor de 4 blokken', () => {
    const s = createState();
    setField(s, 'locatie.bedrijfsnaam', 'X');
    setField(s, 'opdrachtgever.bedrijfsnaam', 'Y');
    setField(s, 'inspectie.inspecteur', 'Z');
    setField(s, 'installatie.merk', 'A');
    const sec = buildSection1(s);
    const txt = JSON.stringify(sec);
    expect(txt).toMatch(/LOCATIE/);
    expect(txt).toMatch(/OPDRACHTGEVER/);
    expect(txt).toMatch(/INSPECTIEGEGEVENS/);
    expect(txt).toMatch(/TECHNISCHE SPECIFICATIES/);
  });

  it('laat lege subblokken weg', () => {
    const s = createState();
    setField(s, 'locatie.bedrijfsnaam', 'X');
    const sec = buildSection1(s);
    const txt = JSON.stringify(sec);
    // Opdrachtgever-blok heeft geen velden ingevuld — subkop "OPDRACHTGEVER" mag niet voorkomen
    expect(txt).not.toMatch(/OPDRACHTGEVER/);
  });
});

import { buildSectionChecklistObas } from '../js/pdf-builder.js';

describe('buildSectionChecklistObas — fase 4 (24-punt visuele checklist)', () => {
  it('returnt null bij interval=halfjaarlijks', () => {
    const s = createState();
    setField(s, 'meta.interval', 'halfjaarlijks');
    setField(s, 'checklist_obas.afdekkingen.resultaat', 'goed');
    expect(buildSectionChecklistObas(s)).toBeNull();
  });

  it('returnt null bij interval=jaarlijks', () => {
    const s = createState();
    setField(s, 'meta.interval', 'jaarlijks');
    setField(s, 'checklist_obas.afdekkingen.resultaat', 'goed');
    expect(buildSectionChecklistObas(s)).toBeNull();
  });

  it('returnt null bij 5jaarlijks zonder enige data', () => {
    const s = createState();
    setField(s, 'meta.interval', '5jaarlijks');
    expect(buildSectionChecklistObas(s)).toBeNull();
  });

  it('toont sectie bij 5jaarlijks met minstens 1 ingevuld item', () => {
    const s = createState();
    setField(s, 'meta.interval', '5jaarlijks');
    setField(s, 'checklist_obas.afdekkingen.resultaat', 'goed');
    const sec = buildSectionChecklistObas(s);
    expect(sec).not.toBeNull();
    const txt = JSON.stringify(sec);
    expect(txt).toMatch(/CHECKLIST INSPECTIE OBAS/);
    expect(txt).toMatch(/Afdekkingen/);
  });

  it('toont alle 24 aandachtspunten in PDF-output', () => {
    const s = createState();
    setField(s, 'meta.interval', '5jaarlijks');
    setField(s, 'checklist_obas.afdekkingen.resultaat', 'goed');
    const sec = buildSectionChecklistObas(s);
    const txt = JSON.stringify(sec);
    const expectedLabels = [
      'Afdekkingen', 'Opbouw OBAS', 'Vlotterbal', 'Vlotterbalschotel',
      'Grofvuilrooster', 'Inlaat OBAS', 'Uitlaat OBAS', 'Niveau OBAS',
      'Capaciteit OBAS', 'Opbouw slibvangput', 'Inlaat slibvangput',
      'Uitlaat slibvangput', 'Niveau slibvangput', 'Inhoud slibvangput',
      'Controleput', 'Niveau controleput', 'Lozing', 'Effluent',
      'Coalescentiefilter', 'Alarm olielaagdikte', 'Alarm hoogwater',
      'Recycleput', 'Accumat', 'Afvoerkanaal gereinigd'
    ];
    expectedLabels.forEach(label => {
      expect(txt).toContain(label);
    });
  });

  it('toont opmerking bij ingevuld item', () => {
    const s = createState();
    setField(s, 'meta.interval', '5jaarlijks');
    setField(s, 'checklist_obas.opbouw_obas.resultaat', 'fout');
    setField(s, 'checklist_obas.opbouw_obas.opmerking', 'Scheur in zijwand');
    const sec = buildSectionChecklistObas(s);
    expect(JSON.stringify(sec)).toMatch(/Scheur in zijwand/);
  });
});

describe('buildDocDefinition — checklist_obas opgenomen', () => {
  it('content-array bevat checklist_obas-output bij 5jaarlijks met data', () => {
    const s = createState();
    setField(s, 'meta.interval', '5jaarlijks');
    setField(s, 'checklist_obas.afdekkingen.resultaat', 'goed');
    const dd = buildDocDefinition(s);
    const txt = JSON.stringify(dd);
    expect(txt).toMatch(/CHECKLIST INSPECTIE OBAS/);
  });
});
