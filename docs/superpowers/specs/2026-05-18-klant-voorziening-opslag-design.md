# Design: Klant- en voorzieningsdatabase voor NEN-EN 858-2 inspectie-tool

**Datum:** 2026-05-18
**Status:** Goedgekeurd voor implementatie
**Versie van applicatie:** v2 (`NEN_EN858_2-v2/`) — v1 blijft naast v2 bestaan en wordt niet gewijzigd

---

## 1. Probleem en doel

### Probleem

In v1 moet bij elke inspectie de klantgegevens (locatie, opdrachtgever, contactpersoon, adres, telefoon) én voorzieningsgegevens (merk, NS-klasse, capaciteit, type lozing, alle installatie-specs) opnieuw worden ingetypt. Symitech inspecteert echter steeds dezelfde klanten met meerdere voorzieningen — Uniper Leiden alleen al heeft 7+ OBAS-installaties. Dat is repetitief, foutgevoelig en tijdrovend.

### Doel

Een **klant- en voorzieningendatabase** waarmee Maurice eenmalig een klant + diens voorzieningen invoert en daarna bij elke inspectie alleen nog hoeft te kiezen via dropdowns. De gegevens worden automatisch in het formulier ingevuld; de inspecteur kan ze blijven aanpassen voor eenmalige afwijkingen.

### Succescriteria

- Eenmalige invoer van klant + voorzieningen volstaat
- Bij nieuwe inspectie: 2 dropdowns vullen 17+ velden automatisch
- Werkt op laptop én telefoon (cross-device sync via JSON-bestand)
- v1 blijft onveranderd naast v2 draaien (geen breaking change voor lopende werkwijze)

---

## 2. Scope

### In scope

- Database voor klanten (locatie + opdrachtgever in één record)
- Database voor voorzieningen (gekoppeld aan klant)
- Dropdown-keuze in formulier sectie 1
- Modal voor toevoegen + bewerken (inline beheer)
- Export/import JSON-bestand voor cross-device sync
- Foutafhandeling (cascade-delete, overschrijven, quota, corrupte import)
- Hosting via GitHub Pages (Maurice's persoonlijke account)
- 100% test coverage op database-laag

### Buiten scope (later)

- Cloud-backend / multi-user sync
- Klant-foto's / logo's (mogelijk in toekomst, IndexedDB-migratie indien nodig)
- Multi-user authenticatie
- Audit-log (wie wijzigde wanneer)
- Geavanceerd zoeken / filteren binnen klantenlijst
- Verwijderen via Symitech webdienst

---

## 3. Ontwerpkeuzes (besloten tijdens brainstorm)

| Keuze | Besluit | Reden |
|-------|---------|-------|
| **Klant ↔ voorziening relatie** | 1 klant → N voorzieningen | Past bij Symitech-praktijk (Uniper heeft meerdere OBAS-installaties) |
| **UI-patroon** | Inline dropdown in sectie 1 + modal voor beheer | Snelle workflow tijdens inspectie, geen tab-wisseling |
| **Opslag** | `localStorage` (sleutel `nen858-database`) | Past bij scope (~100 klanten, ~50KB data); simpeler dan IndexedDB |
| **Sync tussen devices** | Handmatige JSON-export/import | Past bij bestaande werkwijze (email/USB); geen server-infrastructuur |
| **Klant-model** | Locatie + opdrachtgever in één record met "zelfde als locatie"-toggle | Vaak hetzelfde bedrijf, soms apart (holding); minimale UI-overhead |
| **Versie-isolatie** | Aparte map `NEN_EN858_2-v2/`, eigen poort 8766 | v1 blijft 100% functioneel naast v2 |
| **Hosting** | GitHub Pages (Maurice's persoonlijke account) | Gratis, HTTPS automatisch (vereist voor mobiele camera), eigen URL |

---

## 4. Architectuur

### Modules (in `js/`)

| Module | Verantwoordelijkheid |
|--------|----------------------|
| `database.js` *(nieuw)* | CRUD voor klanten + voorzieningen, localStorage persist, export/import, versionering |
| `klant-modal.js` *(nieuw)* | Modal voor klant toevoegen/bewerken, "zelfde als locatie"-toggle, validatie |
| `voorziening-modal.js` *(nieuw)* | Modal voor voorziening toevoegen/bewerken, klant_id koppeling |
| `dropdown-binding.js` *(nieuw)* | Klant/voorziening dropdowns in sectie 1, auto-fill state, filter voorziening op klant_id |
| `form-render.js` *(aanpassing)* | Sectie 1 uitbreiden met 2 dropdown-rijen vóór de bestaande velden |
| `main.js` *(aanpassing)* | Importeert nieuwe modules, init database-laag, bind dropdowns |

### Lagen-overzicht

```
┌─────────────────────────────────────────────────┐
│  UI                                             │
│  ┌─────────────────┐    ┌──────────────────┐    │
│  │ Sectie 1        │    │ Klant-modal      │    │
│  │ - Dropdowns     │◀──▶│ - Toevoegen      │    │
│  │ - Auto-fill     │    │ - Bewerken       │    │
│  └────────┬────────┘    └────────┬─────────┘    │
│           │                       │              │
│           ▼                       ▼              │
│  ┌─────────────────────────────────────┐         │
│  │ dropdown-binding.js                 │         │
│  │ klant-modal.js / voorziening-modal  │         │
│  └────────────────┬────────────────────┘         │
└───────────────────┼──────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────┐
│  Database laag                                  │
│  ┌─────────────────────────────────────┐        │
│  │ database.js                         │        │
│  │ - loadDb / saveDb                   │        │
│  │ - CRUD klant / voorziening          │        │
│  │ - exportDb / importDb               │        │
│  │ - getVoorzieningenVoor(klantId)     │        │
│  └────────────────┬────────────────────┘        │
└───────────────────┼─────────────────────────────┘
                    │
                    ▼
            ┌───────────────┐
            │  localStorage │
            │  key:         │
            │  nen858-      │
            │  database     │
            └───────────────┘
```

---

## 5. Datamodel

### localStorage-key: `nen858-database`

```js
{
  versie: 1,
  klanten: [
    {
      id: "uniper-leiden",                        // slug uit bedrijfsnaam
      bedrijfsnaam: "Uniper Leiden",
      adres: "Industrieweg 1",
      postcode_plaats: "2316 EX Leiden",
      contactpersoon: "J. Smit",
      // Opdrachtgever:
      opdrachtgever_zelfde_als_locatie: true,
      opdrachtgever_bedrijfsnaam: "",            // leeg als toggle aan
      opdrachtgever_adres: "",
      opdrachtgever_postcode_plaats: "",
      opdrachtgever_contactpersoon: "",
      opdrachtgever_telefoon: "071-1234567",     // telefoon staat altijd bij opdrachtgever
      aangemaakt: "2026-05-18"
    }
  ],
  voorzieningen: [
    {
      id: "unip0504",                             // slug uit naam
      klant_id: "uniper-leiden",                  // referentie
      naam: "UNIP0504 OOA03 trafo",               // display in dropdown
      // installatie-specs (1-op-1 met state.installatie):
      merk: "ACO",
      type_bouwjaar: "NSF-100 / 2018",
      ns_klasse: "I",
      ns_ls: "15",
      capaciteit_l: "1000",
      mat_afdekking: "Beton",
      inhoud_slibv_l: "700",
      mat_opbouw: "PE",
      inlaat_mm: "160",
      uitlaat_mm: "160",
      type_lozing: "Vrij verval riool",
      lozingsvergunning_kenmerk: "WSL-2024-1287",
      aangemaakt: "2026-05-18"
    }
  ]
}
```

### Velden-mapping bij dropdown-keuze

**Klant gekozen → vult:**

| Klant-veld | State-pad |
|------------|-----------|
| bedrijfsnaam | `state.locatie.bedrijfsnaam` |
| adres | `state.locatie.adres` |
| postcode_plaats | `state.locatie.postcode_plaats` |
| contactpersoon | `state.locatie.contactpersoon` |
| opdrachtgever_bedrijfsnaam *(of locatie indien toggle aan)* | `state.opdrachtgever.bedrijfsnaam` |
| opdrachtgever_adres *(of locatie indien toggle aan)* | `state.opdrachtgever.adres` |
| opdrachtgever_postcode_plaats *(of locatie indien toggle aan)* | `state.opdrachtgever.postcode_plaats` |
| opdrachtgever_contactpersoon *(of locatie indien toggle aan)* | `state.opdrachtgever.contactpersoon` |
| opdrachtgever_telefoon | `state.opdrachtgever.telefoon` |

**Voorziening gekozen → vult:**

| Voorziening-veld | State-pad |
|------------------|-----------|
| merk, type_bouwjaar, ns_klasse, ns_ls, capaciteit_l, mat_afdekking, inhoud_slibv_l, mat_opbouw, inlaat_mm, uitlaat_mm, type_lozing, lozingsvergunning_kenmerk | `state.installatie.*` (1-op-1) |

---

## 6. UI-flow

### Sectie 1 — Projectgegevens (uitbreiding bovenaan)

```
┌─────────────────────────────────────────────────────┐
│ 1. PROJECTGEGEVENS                                  │
├─────────────────────────────────────────────────────┤
│ Klant       [Uniper Leiden         ▼] [+] [✎]       │
│ Voorziening [UNIP0504 OOA03 trafo  ▼] [+] [✎]       │
│ ─────────────────────────────────────────────       │
│                                                     │
│ LOCATIE                  OPDRACHTGEVER              │
│ Bedrijfsnaam [Uniper..]  Bedrijfsnaam [Uniper..]    │ ← auto-gevuld
│ Adres        [Industri.] Adres        [Industri.]   │   (bewerkbaar)
│ ...                      Telefoon     [071-...]     │
│                                                     │
│ TECHNISCHE SPECIFICATIES INSTALLATIE                │
│ Merk         [ACO]                                  │ ← auto-gevuld uit
│ Type         [NSF-100..] NS-klasse  [I]             │   voorziening
│ ...                                                 │
└─────────────────────────────────────────────────────┘
```

### Klant-modal

```
┌──── NIEUWE KLANT / KLANT BEWERKEN ────┐
│                                       │
│ LOCATIE                               │
│  Bedrijfsnaam   [_______________]     │ ← verplicht
│  Adres          [_______________]     │
│  Postcode/Plaats [_____________]      │
│  Contactpersoon [_______________]     │
│                                       │
│ OPDRACHTGEVER                         │
│  ☑ Zelfde als locatie                 │
│  ─ velden hieronder verborgen ─       │
│  ☐ Telefoon (altijd zichtbaar)        │
│  [_______________]                    │
│                                       │
│         [Annuleer] [Opslaan]          │
└───────────────────────────────────────┘
```

**Validatie:** bedrijfsnaam verplicht; bij toggle uit zijn opdrachtgever-velden ook verplicht.

### Voorziening-modal

```
┌──── NIEUWE VOORZIENING / BEWERKEN ──────┐
│ Klant: Uniper Leiden                    │ ← read-only (uit klant-dropdown)
│                                         │
│ Naam (display in dropdown)              │
│  [UNIP0504 OOA03 trafo_____________]    │ ← verplicht
│                                         │
│ INSTALLATIE-SPECS                       │
│  Merk           [_______]               │
│  Type/bouwjaar  [_______]               │
│  NS-klasse      ( ) Klasse I            │ ← radio
│                 ( ) Klasse II           │
│  NS (l/s)       [_______]               │
│  Capaciteit (L) [_______]               │
│  Mat. afdekking [_______]               │
│  Inhoud slib (L)[_______]               │
│  Mat. opbouw    [_______]               │
│  Inlaat Ø (mm)  [_______]               │
│  Uitlaat Ø (mm) [_______]               │
│  Type lozing    ( ) Vrij verval riool   │ ← radio
│                 ( ) Oppervlaktewater    │
│                 ( ) Anders [____]       │
│  Vergunning     [_______]               │
│                                         │
│         [Annuleer] [Opslaan]            │
└─────────────────────────────────────────┘
```

### Action-bar uitbreiding

Twee nieuwe knoppen in de actiebalk, naast bestaande "Concept opslaan/laden":

```
[Testdata] [Concept opslaan] [Concept laden] [Genereer PDF] [Exporteer database] [Importeer database]
```

---

## 7. Sync (export / import)

### Export

- Knop `Exporteer database` → downloadt `nen858-klanten-{YYYY-MM-DD}.json`
- Inhoud = volledige `nen858-database` object uit localStorage
- Versieveld voor toekomstige migratie

### Import

- Knop `Importeer database` → file-picker
- Bij gekozen bestand: dialoog met 2 opties:
  - **Vervangen** — huidige database wordt overschreven
  - **Samenvoegen** — nieuwe klanten/voorzieningen worden toegevoegd; bestaande met dezelfde `id` worden behouden
- Bij `versie` mismatch (v1 → v2): waarschuwing tonen, geen import zonder bevestiging

---

## 8. Foutafhandeling

| Scenario | Aanpak |
|----------|--------|
| localStorage leeg (eerste keer) | Lege dropdown + placeholder "+ Klik op de plus om je eerste klant toe te voegen" |
| localStorage quota vol (>5MB) | Alert: "Database is vol. Exporteer als backup en verwijder oude klanten." |
| Klant verwijderen met N voorzieningen | Bevestigingsdialoog: "Klant '{naam}' heeft {N} voorzieningen — die worden ook verwijderd. Doorgaan?" |
| Import: corrupte JSON | Alert: "Bestand kon niet gelezen worden: ongeldige JSON-structuur." |
| Import: versie-mismatch | Waarschuwingsdialoog vóór import |
| Dropdown-keuze terwijl formulier-velden al ingevuld zijn | Bevestigingsdialoog: "Velden zijn al ingevuld. Overschrijven met data van '{klant}'?" |
| Voorziening zonder gekoppelde klant (data-corruptie) | Filter uit dropdown; console-warning in log |
| Slug-collision (twee klanten met dezelfde naam) | Suffix met `-2`, `-3` etc. automatisch toevoegen aan id |

---

## 9. Tests (TDD verplicht)

### Test-bestanden

| Bestand | Aantal tests (schatting) | Coverage |
|---------|--------------------------|----------|
| `tests/database.test.js` | ~20 | loadDb/saveDb roundtrip, CRUD klant, CRUD voorziening, cascade-delete, getVoorzieningenVoor filter, export/import roundtrip, versie-migratie, slug-collision, lege state default |
| `tests/klant-modal.test.js` | ~10 | Modal render, validatie verplichte velden, "zelfde als locatie"-toggle (verberg/toon opdrachtgever-velden), opslaan triggert database.addKlant, edit-mode laadt bestaande data |
| `tests/voorziening-modal.test.js` | ~10 | Modal render, klant_id-koppeling, validatie, opslaan triggert database.addVoorziening, NS-klasse + type-lozing radio's |
| `tests/dropdown-binding.test.js` | ~15 | Dropdown vult van database, klant-keuze vult state, voorziening-dropdown filtert op klant_id, "overschrijf?"-bevestiging, "zelfde als locatie" → opdrachtgever-velden uit locatie kopieren |

### Test-strategie

- **TDD verplicht:** test eerst falen → implementatie → groen → refactor
- Bestaande v1 tests blijven groen (v1 niet veranderd, v2 erft kopie)
- Nieuwe tests parallel aan implementatie, niet aan einde toegevoegd

---

## 10. Hosting

### Keuze: GitHub Pages (Maurice's persoonlijke account)

- Gratis, HTTPS automatisch
- HTTPS is **vereist** voor camera-access op iOS Safari + Firefox Android
- Repo: nog te kiezen (bv `maurice-vananraat/nen858-v2` of vergelijkbaar)
- Branch: `main` of `gh-pages`
- URL: `https://<username>.github.io/<repo>/`

### Setup-werkwijze (fase 6)

1. GitHub-repo aanmaken (Maurice doet dit, Claude begeleidt)
2. v2-map pushen
3. GitHub Pages activeren in repo-settings
4. URL testen op telefoon (camera, modals, PDF, export/import)
5. Eindcheck: 1 echte inspectie volledig doorlopen op telefoon

---

## 11. Implementatie-roadmap

| Fase | Doel | Schatting |
|------|------|-----------|
| **0** | Voorbereiding — spec finaliseren + hosting-besluit | ✓ Vandaag |
| **1** | v2-map opzetten als kopie van v1, smoke-test (alle 129 v1-tests blijven groen) | 1 sessie |
| **2** | `database.js` met CRUD + tests (~20 tests) | 1-2 sessies |
| **3** | UI Klant — dropdown + modal + tests | 1-2 sessies |
| **4** | UI Voorziening — dropdown gefilterd + modal + tests | 1 sessie |
| **5** | Sync + foutafhandeling — export/import + alle dialogen + tests | 1 sessie |
| **6** | Hosting + mobiele test op telefoon | 1 sessie |

**Totaal:** 7-9 sessies. Elke fase volgt het v1-patroon: brainstorm/spec → plan → TDD → review → integreren.

---

## 12. Open punten en risico's

| # | Punt | Risico | Mitigatie |
|---|------|--------|-----------|
| 1 | localStorage quota op telefoon (mobile browsers hebben soms lagere limieten — Safari iOS ~5MB, kan variëren) | Database vol op mobiel terwijl op laptop nog ruimte | Quota-check vóór save, alert + export-suggestie |
| 2 | Slug-collisions bij identieke bedrijfsnamen | Twee klanten met "Garage X" zouden samenvallen | Auto-suffix `-2`, `-3` |
| 3 | GitHub Pages = publieke URL met klantdata | Klantgegevens openbaar zichtbaar als URL uitlekt | Klantdata staat **niet** in repo — alleen in localStorage van de gebruiker. App-code is publiek, data is privé |
| 4 | Toekomstige migratie naar IndexedDB als foto's per klant gewenst zijn | Versie-bump nodig | `versie`-veld in database, migratie-functie in `database.js` |
| 5 | Maurice gebruikt mogelijk meerdere browsers op één device (Chrome / Firefox) | Database is per-browser geïsoleerd | Export/import oplossing volstaat; later eventueel "browser-detect"-waarschuwing |

---

## 13. Niet-doelen

Expliciet **niet** in deze v2:

- Multi-user / login / auth
- Cloud-sync via backend (Firebase, Supabase, Symitech-server)
- Klant-logo's / foto's per klant
- Audit-log (wie wijzigde wat wanneer)
- Geavanceerd zoeken / filteren binnen klantenlijst
- Bulk-import van klantenlijst uit Excel/CSV

Deze blijven mogelijk voor v3 of later.
