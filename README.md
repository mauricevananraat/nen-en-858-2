# NEN-EN 858-2 Controle Formulier — v2

Inspectietool voor Olie/Benzine Afscheidingsinstallaties (OBAS) volgens NEN-EN 858-2. Ondersteunt halfjaarlijkse, jaarlijkse en 5-jaarlijkse controles. Genereert PDF-rapportages volgens Symitech huisstijl.

**Live:** `<PAGES_URL>` *(URL invullen na Task 5)*

## Openen op laptop

Open de URL hierboven in Chrome, Edge of Firefox.

## Openen op telefoon (Samsung / Android)

1. Open de URL in Chrome Android.
2. Optioneel — voeg toe aan startscherm: menu (drie puntjes) → "Toevoegen aan startscherm". De tool opent dan als een app-icoontje.

## Belangrijkste functies

- **Klantenbeheer:** klant- en opdrachtgevergegevens éénmalig invoeren, daarna herbruikbaar via dropdown.
- **Voorzieningenbeheer:** per klant meerdere OBAS-installaties opslaan met technische specs.
- **3 inspectie-cycli:** halfjaarlijks, jaarlijks (incl. uitgebreide controle), 5-jaarlijks (incl. 24-punts checklist + interne controle).
- **Foto's:** camera-knop voor directe foto's, upload-knop voor bestaand materiaal.
- **Handtekening:** touch-canvas voor handtekening op locatie.
- **PDF-rapport:** complete rapportage in Symitech-stijl, downloadbaar.
- **Sync laptop ↔ telefoon:** exporteer database als JSON, importeer op ander apparaat (vervang of samenvoegen).

## Privacy & data

- **Alle data blijft lokaal** in de browser (`localStorage`).
- Geen cloud-sync, geen externe API's, geen analytics.
- Inspectie-data en klantgegevens verlaten je apparaat alleen wanneer jij ze handmatig exporteert.

## Updaten van de live-versie

Voor de eigenaar: push naar `main` → GitHub Pages publiceert automatisch binnen ±1 minuut. Forceer een refresh in de browser met `Ctrl+F5` (laptop) of via een pull-to-refresh (Android).

## Lokaal draaien

```bash
py -m http.server 8766
```

Open vervolgens `http://localhost:8766/NEN-EN-858-2%20controle%20formulier.html`.

## Tests

```bash
npm install   # eenmalig
npm test
```

Verwacht: 249 tests groen + 1 skipped (baseline na Fase 5).

## Architectuur

- Vanilla JavaScript ES modules, geen framework
- Vitest + jsdom voor tests
- pdfMake voor PDF-generatie

Volledige spec: `docs/superpowers/specs/2026-05-18-klant-voorziening-opslag-design.md`.

## Status

Alle 6 ontwikkelfases afgerond. Zie `STATUS.md` voor de detailgeschiedenis.
