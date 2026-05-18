# Fase 6 — Hosting op GitHub Pages + Acceptance test op Samsung S24

**Datum:** 2026-05-18
**Status:** Goedgekeurd door Maurice voor implementatieplanning
**Voorafgaande fases:** 1 (v2 opzet), 2 (database-laag), 3 (UI klantenbeheer), 4 (UI voorzieningenbeheer), 5 (sync UI) — alle ✓
**Baseline:** 249 tests groen + 1 skipped, commit `7882db2`

---

## 1. Doel

Tool van een werkend lokaal prototype naar een **gebruikt** stuk software brengen: live op Maurice's persoonlijke GitHub Pages, en geverifieerd dat alle kritieke flows werken op zijn Samsung Galaxy S24 (Android, Chrome) zodat hij de tool op locatie kan gebruiken voor echte NEN-EN 858-2 inspecties.

Niet-doel: zoeken naar nog-niet-bestaande gebruikers, custom domain, offline-laag, of multi-user scenario's. Die komen pas in beeld als de praktijk uitwijst dat ze nodig zijn.

---

## 2. Resultaat (Definition of Done)

Fase 6 is afgerond als:

1. **Live deploy.** Tool is bereikbaar op `https://<gh-username>.github.io/<repo-naam>/` vanaf zowel de laptop als de Samsung S24.
2. **Acceptance-checklist 100% afgewerkt.** Elke flow in sectie 5 is óf groen (werkt) óf rood-met-doorverwijzing (gedocumenteerd als Fase 7-backlog in `STATUS.md`).
3. **`README.md` aanwezig** met: doel van de tool, hoe te openen op laptop/telefoon, hoe een update te deployen.
4. **`STATUS.md` bijgewerkt:** Fase 6 ✓, met URL en testresultaten.
5. **Working tree clean,** alle wijzigingen gecommit op `main`.

---

## 3. Architectuur

Geen code-architectuur-wijziging in deze fase. De tool blijft een statische HTML+JS+CSS bundel die direct vanaf GitHub Pages CDN wordt geserveerd. Geen build-stap, geen bundler — de bestaande ES-module structuur werkt 1-op-1.

Wat verandert is alleen de **distributiekant:** van lokale `file://` of `npx serve` naar een publieke HTTPS-URL.

```
Lokaal nu:                        GitHub Pages straks:
file:///.../NEN_EN858_2-v2/  →    https://<user>.github.io/<repo>/
  ├ index/HTML/JS/CSS               (zelfde bestanden, server-side)
  ├ tests/, node_modules/           (uitgesloten via .gitignore en/of geen pages-impact)
  └ docs/                           (gepushed maar niet relevant voor pages)
```

GitHub Pages serveert de root van de `main` branch. Geen `gh-pages` branch nodig.

---

## 4. Repo + deploy

### 4.1 Repo-keuze
- **Nieuwe public repo** onder Maurice's persoonlijke GitHub-account
- Repo-naam: voorstel `nen-en-858-2` (definitief af te stemmen met Maurice)
- Zichtbaarheid: **public** (GitHub Pages werkt gratis met public; private vereist GitHub Pro)
- License: niet toevoegen tenzij Maurice expliciet wil (default = "All rights reserved")

### 4.2 Stappen-overzicht (uitvoering, niet in deze spec)
Het exacte plan komt in de plan-fase. Op hoofdlijnen:
1. `.gitignore` valideren — `PROMPTS.md`, `node_modules/`, `.worktrees/`, `tests/` mogelijk uitsluiten
2. Maurice maakt repo aan op github.com (handmatig, ik geef de naam en settings)
3. `git remote add origin <url>` en `git push -u origin main`
4. GitHub Pages aan via repo-settings → Pages → branch `main`, root
5. Wachten op deploy, URL noteren
6. Test op laptop, daarna op Samsung S24

### 4.3 Privacy-borging
- `PROMPTS.md` moet vóór de eerste push in `.gitignore` staan en niet getrackt zijn (regel uit globale CLAUDE.md)
- Geen klantgegevens in test-data files die meegepushed worden
- Geen API-keys of credentials in het project (geen backend, dus niet van toepassing)

---

## 5. Acceptance-checklist op Samsung S24

Alle items te doorlopen op de Samsung Galaxy S24 met Chrome Android. Resultaat per item: **PASS / FAIL / SKIP (met reden)**.

| # | Categorie | Flow |
|---|-----------|------|
| 1 | Laad | Tool URL opent in Chrome, formulier rendert zonder console-errors |
| 2 | Klant | "+" knop → modal → bedrijfsnaam/adres invullen → opslaan → klant verschijnt geselecteerd in dropdown |
| 3 | Klant | Klant-edit knop → modal vult met huidige data → wijzigen → opslaan → dropdown toont gewijzigde naam |
| 4 | Klant | Klant-delete knop → confirm → klant + bijbehorende voorzieningen weg (cascade) |
| 5 | Voorziening | Voor gekozen klant: "+" → modal → naam + NS-klasse + capaciteit → opslaan → verschijnt in voorziening-dropdown |
| 6 | Voorziening | Edit + delete idem als klant |
| 7 | Sectie 1 | Projectgegevens (nummer, datum, inspecteur, etc.) invullen, blijven na sectie-switch |
| 8 | Sectie 2 | Metingen invoeren → `auto-pct` berekening werkt → advies-blok verschijnt bij grenswaarde |
| 9 | Sectie 3-5 | Functietesten, controleput, lediging+BAL invullen — alle radios/inputs werken |
| 10 | Interval | Switch tussen halfjaarlijks/jaarlijks/5-jaarlijks toont/verbergt correcte secties |
| 11 | Checklist | Bij 5-jaarlijks: 24-punts checklist OBAS zichtbaar en invulbaar |
| 12 | Foto's | 📷 camera-knop opent Android-camera → foto maken → foto verschijnt in slot |
| 13 | Foto's | 🖼️ upload-knop opent fotobibliotheek → meerdere foto's selecteren → alle verschijnen |
| 14 | Foto's | Foto verwijderen via X-knop werkt |
| 15 | Handtekening | Canvas reageert op touch → handtekening zichtbaar → reset werkt |
| 16 | PDF | "Genereer PDF" → Chrome downloadt PDF → PDF opent → inhoud klopt (klantgegevens, metingen, foto's, handtekening) |
| 17 | Concept | "Concept opslaan" downloadt JSON → "Concept laden" upload → formulier herstelt |
| 18 | DB-export | "Exporteer database" downloadt `nen858-klanten-YYYY-MM-DD.json` |
| 19 | DB-import laptop→telefoon | Laptop: export → upload naar Drive → telefoon: download + import (mode "vervangen") → klanten/voorzieningen verschijnen |
| 20 | DB-import telefoon→laptop | Idem omgekeerd |

### 5.1 Bug-classificatie tijdens test

| Type | Definitie | Actie |
|------|-----------|-------|
| **Critical** | Functioneel kapot, geen workaround, blokkeert echte gebruik | Fix nu, blokkeert Fase 6 |
| **Important** | Werkt maar UX schuurt of randvoorwaarde mist | Documenteer in `STATUS.md` als Fase 7-backlog |
| **Cosmetic** | Visueel rommelig, geen impact op functie | Documenteer in backlog |

### 5.2 Rapportage van de test
De resultaten worden opgeslagen in een nieuw bestand `docs/fase6-acceptance-rapport-YYYY-MM-DD.md`:
- Per item de status (PASS/FAIL/SKIP)
- Bij FAIL: korte bugbeschrijving + classificatie
- Screenshot waar nuttig (in `docs/fase6-screenshots/`)

---

## 6. Bestanden die wijzigen

| Pad | Wijziging |
|-----|-----------|
| `.gitignore` | Valideren — `PROMPTS.md`, `node_modules/`, `.worktrees/` aanwezig. `tests/` wordt **wel** gepushed (geen secrets, hoort bij de repo). |
| `README.md` | Nieuw — doel, hoe openen op laptop/telefoon, hoe update deployen |
| `STATUS.md` | Update — Fase 6 ✓ + URL + testresultaten |
| `docs/fase6-acceptance-rapport-YYYY-MM-DD.md` | Nieuw — testresultaten |
| `docs/fase6-screenshots/` | Nieuw (optioneel) — screenshots van failures |

Naar verwachting **geen** wijzigingen aan `js/`, `css/`, `tests/` of de HTML — die zijn klaar. Uitzondering: als de acceptance-test (sectie 5) een **Critical** bug vindt, wordt die binnen Fase 6 gefixt en kan de bijbehorende module wel wijzigen.

---

## 7. Niet in scope

- **PWA / offline-first** — service worker + manifest. Beoordeel na de acceptance-test of het nodig is.
- **Custom domain** — `inspectie.symitech.nl` of vergelijkbaar. Later.
- **v1 parallel hosten** — niet nodig, v1 staat lokaal.
- **Cloud-sync, multi-user, encryption** — bewust uitgesloten in eerdere fases.
- **Build-pipeline / CI** — geen meerwaarde voor een statische one-person tool.
- **Open-source maken** — Maurice beslist later.

---

## 8. Risico's en mitigaties

| Risico | Mitigatie |
|--------|-----------|
| Per ongeluk `PROMPTS.md` pushen → privé-data publiek | `.gitignore` controle vóór eerste push; `git status` checken |
| Klantgegevens in testdata → publiek zichtbaar | Testdata-bestand controleren; geen echte klanten in `test-data.js` |
| Mobiele camera/file-picker werkt anders dan op desktop | Acceptance-test 12-14 dekt dit; bekende afwijking → fix vóór sluiten |
| PDF-rendering verschilt tussen browsers | pdfmake is consistent; visueel verifiëren tijdens test |
| URL-router op GitHub Pages werkt anders dan `file://` | Geen routing in deze tool, dus niet relevant |
| GitHub Pages caching → updates komen niet door | Maurice leert in README hoe te force-refreshen (cmd+shift+R / Ctrl+F5) |

---

## 9. Volgende fase (na 6)

Afhankelijk van uitkomst acceptance-test:
- **Fase 7a (mogelijk):** PWA-laag toevoegen als offline-werken een gebleken behoefte is
- **Fase 7b (mogelijk):** UX-polish van Fase 7-backlog items
- **Fase 7c (mogelijk):** Custom domain, branding-pagina, of intake voor andere inspecteurs
