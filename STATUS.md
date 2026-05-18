# v2 Status

**Versie:** 0.2.0
**Datum start:** 2026-05-18

## Fase 1 — v2 opzetten ✓ Afgerond op 2026-05-18

Resultaat:
- v1-broncode succesvol gekopieerd naar v2-map
- package.json: name `nen-en-858-2-controle-formulier-v2`, version `0.2.0`
- Dev-server draait op http://localhost:8766
- Alle 129 v1-tests groen in v2-context
- Git-repo geïnitialiseerd op branch `main` met initial commit

## UX-fix: Photo-knoppen splitsen (camera + upload) ✓ 2026-05-18

Tussen fase 1 en 2: `js/photos.js` split de single "+"-knop in een 📷-camera-knop (`capture="environment"`) en een 🖼️-upload-knop (`multiple`). Reden: `multiple` + `capture` werken niet samen op iOS Safari.

- 5 nieuwe DOM-tests in `tests/photos.test.js`
- Totaal: 134 tests groen

## Fase 2 — Database-laag ✓ Afgerond op 2026-05-18

Resultaat:
- Nieuwe module `js/database.js` met 13 exports (CRUD + helpers + sync)
- Pure-function design: immutable db-object in, nieuwe out
- localStorage-persist met versionering (key `nen858-database`, versie 1)
- Slug-generatie + auto-suffix bij id-collision
- Cascade-delete bij verwijderen klant (voorzieningen mee)
- Export/import JSON met `vervang` en `samenvoegen` modes
- User-friendly error bij quota-overschrijding
- 44 unit tests in `tests/database.test.js` — totaal 178 groen

## Fase 3 — UI Klantenbeheer ✓ Afgerond op 2026-05-18

Resultaat:
- Sectie 1 uitgebreid met entity-picker: klant-dropdown + voorziening-dropdown (placeholder) met +/✎/🗑 knoppen
- Nieuwe module `js/modal.js` — generieke open/close + backdrop + Esc-key
- Nieuwe module `js/klant-modal.js` — toevoegen + bewerken met "zelfde als locatie"-toggle
- Nieuwe module `js/dropdown-binding.js` — pure helpers (`applyKlantToState`, `isLocatieFilled`) + DOM event-binding
- "Overschrijf?"-bevestiging bij al-ingevulde locatie-velden
- Cascade-warning bij delete van klant met voorzieningen
- CSS: entity-picker blok + modal + checkbox-label styling (responsive)
- 36 nieuwe tests (6 entity-picker + 6 modal + 10 klant-modal + 8 helpers + 6 DOM-binding) — totaal **214 groen**

## Fase 4 — UI Voorzieningenbeheer ✓ Afgerond op 2026-05-18

Resultaat:
- Nieuwe module `js/voorziening-modal.js` — singleton modal met 12 installatie-velden + klant-badge (read-only context)
- Uitbreiding `js/dropdown-binding.js`:
  - `applyVoorzieningToState` pure helper
  - `refreshVoorzieningDropdown(container, klantId)` met filter
  - `bindVoorzieningDropdown` event-handlers + delete
  - `bindKlantDropdown` 4e parameter `onKlantChange` callback (backward-compatible)
- `main.js` wire: klant-wijziging ververst voorziening-dropdown automatisch via `onKlantChange`
- Voorziening-knoppen (+ / ✎ / 🗑) volledig functioneel
- CSS: `.klant-badge` en `.radio-row` voor NS-klasse en Type lozing radios
- 24 nieuwe tests (8 modal-new + 3 modal-edit + 3 applyVoorzieningToState + 4 refresh + 3 bindVoorziening + 3 onKlantChange) — totaal **238 groen**

## Fase 5 — Sync UI ✓ Afgerond op 2026-05-18

Resultaat:
- Nieuwe module `js/sync-ui.js` met 3 exports:
  - `exportToFile()` — leest db, returnt {json, filename}
  - `importFromText(jsonText, mode)` — parse + importeert, returnt {success, error?}
  - `bindSyncButtons()` — koppelt #btn-export-db en #btn-import-db aan UI flow
- HTML: 2 nieuwe knoppen in action-bar ("Exporteer database", "Importeer database")
- Mode-keuze via confirm() dialog (MVP)
- Foutmeldingen: corrupte JSON, versie-mismatch, quota-error → user-friendly alerts
- Robuustheid: idempotency-guard na null-check, anchor in DOM voor download, import-lock tegen dubbel-klik
- 11 nieuwe tests in `tests/sync-ui.test.js` (10 actief + 1 skipped) — totaal 249 groen + 1 skipped

## Fase 6 — Hosting + Acceptance test ✓ Afgerond op 2026-05-18

Resultaat:
- Tool **live** op https://mauricevananraat.github.io/nen-en-858-2/
- Public GitHub-repo: https://github.com/mauricevananraat/nen-en-858-2
- GitHub Pages serveert `main` branch op root, automatische deploy bij elke push
- README.md publicatie-klaar met privacy-disclaimer, update-instructies en mobiele instructies
- `.gitignore` valideert: `PROMPTS.md` blijft privé (niet getrackt op GitHub)
- Acceptance-checklist 19/20 PASS + 1 SKIP-HARDWARE (camera-flow)
  - Maurice testte handmatig items 1-6 op echte Samsung Galaxy S24
  - Playwright geautomatiseerd items 1-20 op mobile viewport
  - Volledig rapport: `docs/fase6-acceptance-rapport-2026-05-18.md`
- Code-audit gevonden + gefixt vóór deployment: **5 Critical + 4 Important bugs**
  - C1: `importDb` duidelijke foutmelding bij verkeerd bestandstype
  - C2: Concept laden persistent (geen reload-data-loss meer)
  - C3: Database-bestand via Concept laden geweigerd met duidelijke uitleg
  - C4: `state.installatie` reset na voorziening-delete (geen stale data in PDF)
  - C5: `bindFields` idempotent via `dataset.boundField` marker (geen dubbele listeners)
  - I1: Blob-URL revoke met setTimeout 1000ms (Android Chrome download race)
  - I2: Foto-compressie timeout 200ms → 5000ms (12MP foto's op mobiel)
  - I3: `importJson` wrapt JSON.parse-fouten met context
  - I4: Deep-merge bij concept-import zodat ontbrekende keys defaults krijgen
  - I5: `visibilitychange` als extra reset voor import-lock op Android
  - I6: `unbreakable: true` van top-level `sectionCard` verwijderd (pdfMake-werking bij veel foto's)
- Tests-status: **255 groen + 1 skipped** (was 249 + 1 vóór Fase 6)

## Fase 7-backlog (afhankelijk van praktijkgebruik)

- **Fase 7a (mogelijk):** PWA-laag voor offline gebruik op locatie (service worker + manifest) — alleen als bereik in de praktijk een probleem blijkt
- **Fase 7b (mogelijk):** UX-polish: custom mode-modal voor import (i.p.v. confirm()), emoji-consistentie sync-knoppen, andere items uit acceptance-rapport
- **Fase 7c (mogelijk):** Custom domain (bv. `inspectie.symitech.nl`)
