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

## Volgende fase

Fase 6 — Hosting op GitHub Pages + mobiele test op telefoon.
