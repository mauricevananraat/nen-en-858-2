# NEN-EN 858-2 Controle Formulier — v2

Tweede versie van de Symitech OBAS-inspectietool.
**v1 blijft naast v2 bestaan** — zie `../NEN_EN858_2/` voor de productieversie.

## Verschil met v1

| Aspect | v1 | v2 |
|--------|----|----|
| Poort (dev) | 8765 | 8766 |
| Klantenbeheer | Nee | Ja (localStorage + dropdowns) |
| Voorzieningenbeheer | Nee | Ja (gekoppeld aan klant) |
| Cross-device sync | Handmatig per inspectie-JSON | Database-export/import |
| Hosting | Lokaal | GitHub Pages (later) |

## Starten

Dubbelklik `Start formulier.bat` of run handmatig:

```bash
py -m http.server 8766
```

Open vervolgens http://localhost:8766/NEN-EN-858-2%20controle%20formulier.html

## Testen

```bash
npm install   # eenmalig
npm test
```

Verwacht: 129 tests groen (geërfd van v1) + nieuwe tests die per fase bijkomen.

## Roadmap

Zie `docs/superpowers/specs/2026-05-18-klant-voorziening-opslag-design.md` voor de complete v2-spec.

Fasen:
1. ✓ v2 opzetten als kopie van v1
2. Database-laag (CRUD + tests)
3. UI klantenbeheer (dropdown + modal)
4. UI voorzieningenbeheer (dropdown + modal)
5. Sync (export/import database)
6. Hosting op GitHub Pages + mobiele test
