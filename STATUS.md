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
- 40 nieuwe unit tests in `tests/database.test.js` — totaal 174 groen

## Volgende fase

Fase 3 — UI Klantenbeheer (dropdown + modal in sectie 1). Zie spec sectie 6.
