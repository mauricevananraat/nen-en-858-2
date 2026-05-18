# Fase 1: v2-map opzetten als kopie van v1 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** v1-applicatie (NEN_EN858_2) als basis kopiëren naar een nieuwe geïsoleerde map (NEN_EN858_2-v2), eigen poort 8766, eigen versienummer 0.2.0, eigen git-repo. Smoke-test bevestigt: alle 129 v1-tests blijven groen in v2-context én de tool start zelfstandig op http://localhost:8766.

**Architecture:** Cherry-picked file-copy van v1 naar v2 (alleen code + tests + docs, geen klant-data/bron-PDFs/node_modules). Configuratie-aanpassingen (package.json, Start-bat, README). Smoke-test met `npm install`, `npm test` en dev-server. Git-init voor latere GitHub Pages-deployment.

**Tech Stack:** Vanilla JS modules, vitest + jsdom, pdfmake, Python http.server (dev), GitBash voor file ops.

---

## File Structure

### Te kopiëren van v1 naar v2

| Bron (v1) | Doel (v2) | Reden |
|-----------|-----------|-------|
| `assets/` | `assets/` | pdfmake + vfs_fonts + certificaat-logos |
| `css/styles.css` | `css/styles.css` | UI-styling |
| `js/*.js` (alle modules) | `js/*.js` | Volledige applicatielogica |
| `tests/*.test.js` (alle tests) | `tests/*.test.js` | 129 bestaande tests |
| `index.html` | `index.html` | Entry-redirect |
| `NEN-EN-858-2 controle formulier.html` | idem | Hoofd-HTML |
| `vitest.config.js` | idem | Test-config |
| `package-lock.json` | idem | Dep-lock |
| `.gitignore` | idem | Standaard exclusies |
| `symitech_logo.png` | idem | Huisstijl-asset |
| `package.json` | idem (aanpassen) | name + version-bump |
| `Start formulier.bat` | idem (aanpassen) | Poort 8766 |

### Niet kopiëren (blijft in v1)

| Pad | Reden |
|-----|-------|
| `node_modules/` | Opnieuw installeren in v2 met `npm install` |
| `.playwright-mcp/` | Lokale playwright-cache |
| `PROMPTS.md` | Privé prompt-log van v1-fase |
| `STATUS.md` | v1-ontwikkelhistorie, v2 begint met schone status-log |
| `ANALYSE.md` | Analyse-document hoort bij v1-onderzoek |
| `858-2 Leiden/` | Klant-data referentiemateriaal |
| `*.pdf` (origineel_formulier, 5_jaarlijkse_*) | Bron-research |
| `generate_5jaarlijks_form.py` | Archief, vervangen door pdfmake |
| `reports/` | v1-audit-rapporten |
| `docs/superpowers/specs/2026-04-28-*.md` | v1-spec, niet relevant voor v2 |
| `docs/superpowers/plans/2026-04-28-*.md` | v1-plan |

### Nieuw in v2

| Pad | Inhoud |
|-----|--------|
| `README.md` | Uitleg v1 vs v2, hoe te starten |
| `STATUS.md` | Lege/initiële status voor v2 |
| `docs/superpowers/specs/2026-05-18-klant-voorziening-opslag-design.md` | Al aanwezig (geschreven tijdens brainstorm) |
| `docs/superpowers/plans/2026-05-18-fase1-v2-opzetten.md` | Dit plan |
| `.git/` | Nieuwe git-repo (voor GitHub Pages later) |

---

## Task 1: v2-map vullen met v1-broncode

**Werkdirectory:** `C:/Users/Maurice van Anraat/Documents/.claudeV2/projects/symitech/`

**Files:**
- Create: `NEN_EN858_2-v2/assets/` (kopie)
- Create: `NEN_EN858_2-v2/css/styles.css`
- Create: `NEN_EN858_2-v2/js/*.js` (8 bestanden)
- Create: `NEN_EN858_2-v2/tests/*.test.js` (5 bestanden)
- Create: `NEN_EN858_2-v2/index.html`
- Create: `NEN_EN858_2-v2/NEN-EN-858-2 controle formulier.html`
- Create: `NEN_EN858_2-v2/vitest.config.js`
- Create: `NEN_EN858_2-v2/package-lock.json`
- Create: `NEN_EN858_2-v2/.gitignore`
- Create: `NEN_EN858_2-v2/symitech_logo.png`
- Create: `NEN_EN858_2-v2/package.json` (later aangepast in Task 2)
- Create: `NEN_EN858_2-v2/Start formulier.bat` (later aangepast in Task 2)

- [ ] **Step 1: Kopieer mappen en bestanden vanuit v1**

Run (bash, werkdirectory = `projects/symitech/`):

```bash
cp -r "NEN_EN858_2/assets"   "NEN_EN858_2-v2/"
cp -r "NEN_EN858_2/css"      "NEN_EN858_2-v2/"
cp -r "NEN_EN858_2/js"       "NEN_EN858_2-v2/"
cp -r "NEN_EN858_2/tests"    "NEN_EN858_2-v2/"
cp "NEN_EN858_2/index.html"                          "NEN_EN858_2-v2/"
cp "NEN_EN858_2/NEN-EN-858-2 controle formulier.html" "NEN_EN858_2-v2/"
cp "NEN_EN858_2/vitest.config.js"                    "NEN_EN858_2-v2/"
cp "NEN_EN858_2/package.json"                        "NEN_EN858_2-v2/"
cp "NEN_EN858_2/package-lock.json"                   "NEN_EN858_2-v2/"
cp "NEN_EN858_2/.gitignore"                          "NEN_EN858_2-v2/"
cp "NEN_EN858_2/Start formulier.bat"                 "NEN_EN858_2-v2/"
cp "NEN_EN858_2/symitech_logo.png"                   "NEN_EN858_2-v2/"
```

Expected: geen errors, alle bestanden gekopieerd.

- [ ] **Step 2: Verifieer structuur van v2-map**

Run:

```bash
ls -la "NEN_EN858_2-v2/" | grep -v "^d.*node_modules\|^d.*\\.playwright" | sort
```

Expected output bevat:
```
.gitignore
NEN-EN-858-2 controle formulier.html
Start formulier.bat
assets
css
docs
index.html
js
package-lock.json
package.json
symitech_logo.png
tests
vitest.config.js
```

(`docs/` was al aanwezig met spec; rest moet erbij staan)

- [ ] **Step 3: Verifieer js/ en tests/ inhoud**

Run:

```bash
ls "NEN_EN858_2-v2/js/" && echo "---" && ls "NEN_EN858_2-v2/tests/"
```

Expected js/ (7 bestanden — `database.js` komt pas in fase 2):
```
form-render.js
main.js
pdf-builder.js
photos.js
state.js
test-data.js
validation.js
```

Expected tests/ (5 bestanden):
```
form-render.test.js
pdf-builder.test.js
photos.test.js
state.test.js
validation.test.js
```

---

## Task 2: Configuratie aanpassen voor v2

**Files:**
- Modify: `NEN_EN858_2-v2/package.json`
- Modify: `NEN_EN858_2-v2/Start formulier.bat`
- Create: `NEN_EN858_2-v2/README.md`
- Create: `NEN_EN858_2-v2/STATUS.md`

- [ ] **Step 1: package.json aanpassen — name + version**

Read het bestand en pas aan:

`NEN_EN858_2-v2/package.json`:

```json
{
  "name": "nen-en-858-2-controle-formulier-v2",
  "version": "0.2.0",
  "private": true,
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "devDependencies": {
    "vitest": "^1.6.0",
    "jsdom": "^24.0.0",
    "@vitest/ui": "^1.6.0"
  }
}
```

Wijzigingen: `name` krijgt suffix `-v2`, `version` `0.1.0` → `0.2.0`. Rest blijft identiek.

- [ ] **Step 2: Start formulier.bat aanpassen — poort 8766**

Read het bestand. De relevante regel:

```bat
set PORT=8765
```

Wijzig naar:

```bat
set PORT=8766
```

Alle andere regels blijven onveranderd. De `URL=` variabele gebruikt `%PORT%` dus die volgt automatisch.

- [ ] **Step 3: README.md aanmaken**

Create `NEN_EN858_2-v2/README.md`:

```markdown
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
```

- [ ] **Step 4: STATUS.md leegmaken voor v2**

Create `NEN_EN858_2-v2/STATUS.md`:

```markdown
# v2 Status

**Versie:** 0.2.0
**Datum start:** 2026-05-18

## Fase 1 — v2 opzetten

Status: in uitvoering

- v1-broncode gekopieerd naar v2-map
- package.json bumped naar 0.2.0
- Dev-server geconfigureerd voor poort 8766
- Smoke-test: tests groen, dev-server start

(Verdere fasen worden hieronder bijgehouden tijdens v2-ontwikkeling.)
```

---

## Task 3: Smoke-test — npm install + tests + dev server

**Files:** geen wijzigingen, alleen verificatie

- [ ] **Step 1: npm install in v2-map**

Run (werkdirectory = `NEN_EN858_2-v2/`):

```bash
cd "C:/Users/Maurice van Anraat/Documents/.claudeV2/projects/symitech/NEN_EN858_2-v2" && npm install
```

Expected: dependencies geïnstalleerd zonder errors, `node_modules/` aangemaakt, geen `npm ERR!` regels.

- [ ] **Step 2: Tests draaien — verifieer 129 groen**

Run:

```bash
npm test 2>&1 | tail -10
```

Expected output (uitgangswaarde — niet meer, niet minder):

```
 ✓ tests/validation.test.js  (12 tests)
 ✓ tests/state.test.js       (20 tests)
 ✓ tests/pdf-builder.test.js (48 tests)
 ✓ tests/photos.test.js       (1 test)
 ✓ tests/form-render.test.js (48 tests)

 Test Files  5 passed (5)
       Tests  129 passed (129)
```

Geen failures, alle 5 test files passen, totaal 129 tests groen.

- [ ] **Step 3: Dev-server smoke-test (background)**

Start de server in de achtergrond via de Bash-tool met `run_in_background: true`:

```bash
cd "C:/Users/Maurice van Anraat/Documents/.claudeV2/projects/symitech/NEN_EN858_2-v2" && py -m http.server 8766
```

Bewaar het task-ID van de achtergrond-process voor later afsluiten.

Check vervolgens of poort 8766 luistert:

```bash
curl -s -o /dev/null -w "%{http_code}\n" "http://localhost:8766/NEN-EN-858-2%20controle%20formulier.html"
```

Expected: `200`.

- [ ] **Step 4: Browser-smoke-test door Maurice**

Open in Firefox (via Bash):

```bash
start "" "C:\Program Files\Mozilla Firefox\firefox.exe" "http://localhost:8766/NEN-EN-858-2%20controle%20formulier.html"
```

Maurice verifieert handmatig:
- Formulier laadt
- 3 interval-radio's werken (halfjaarlijks / jaarlijks / 5-jaarlijks)
- "Testdata" knop vult de velden
- "Genereer PDF" maakt een PDF aan

Geen functionele wijzigingen ten opzichte van v1 verwacht.

- [ ] **Step 5: Stop achtergrond-server**

Kill de Python-server via de Bash-tool met het task-ID uit Step 3 (`KillBash` tool met de ID, of equivalent). Verifieer met:

```bash
curl -s -o /dev/null -w "%{http_code}\n" "http://localhost:8766/" 2>&1 || echo "Server gestopt"
```

Expected: timeout of connection refused (server is uit).

---

## Task 4: Git-repo initialiseren in v2

**Files:**
- Create: `NEN_EN858_2-v2/.git/` (git-init)
- Modify: `NEN_EN858_2-v2/.gitignore` (verifieer node_modules etc. excluded)

- [ ] **Step 1: Verifieer .gitignore inhoud**

Read `NEN_EN858_2-v2/.gitignore`:

Expected inhoud (gekopieerd uit v1):

```
node_modules/
.vitest/
*.log
.DS_Store
PROMPTS.md
```

Als `PROMPTS.md` of `node_modules/` ontbreekt: append toevoegen.

- [ ] **Step 2: Git init in v2-map**

Run:

```bash
cd "C:/Users/Maurice van Anraat/Documents/.claudeV2/projects/symitech/NEN_EN858_2-v2" && git init -b main
```

Expected: `Initialized empty Git repository in .../NEN_EN858_2-v2/.git/`.

Branch-naam: `main` (volgt moderne convention, sluit aan op GitHub default).

- [ ] **Step 3: Git status check vóór commit**

Run:

```bash
git status --short
```

Expected: lijst untracked files met code, tests, docs. `node_modules/` mag **niet** in de lijst staan (gefilterd door .gitignore).

- [ ] **Step 4: Initial commit**

Run:

```bash
git add .
git commit -m "feat: initial v2 setup as copy of v1

- Cherry-picked code + tests + docs from v1
- package.json bumped to 0.2.0, name suffixed -v2
- Dev-server moved to port 8766 (v1 keeps 8765)
- README + STATUS bootstrap for v2
- Spec voor klant-/voorzieningsdatabase reeds aanwezig
"
```

Expected: `[main (root-commit) <hash>] feat: initial v2 setup as copy of v1` met N files changed.

- [ ] **Step 5: Verifieer clean state**

Run:

```bash
git log --oneline -1 && git status
```

Expected:
- `<hash> feat: initial v2 setup as copy of v1`
- `On branch main`
- `nothing to commit, working tree clean`

---

## Task 5: Eindcheck en fase-afsluiting

**Files:**
- Modify: `NEN_EN858_2-v2/STATUS.md`

- [ ] **Step 1: STATUS.md bijwerken met afgeronde fase 1**

Update `NEN_EN858_2-v2/STATUS.md`:

```markdown
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

## Volgende fase

Fase 2 — Database-laag (`js/database.js` + CRUD-tests). Zie spec sectie 4 + 5.
```

- [ ] **Step 2: Commit STATUS-update**

Run:

```bash
git add STATUS.md
git commit -m "docs: mark fase 1 als afgerond in STATUS.md"
```

Expected: tweede commit op main.

- [ ] **Step 3: Definition of Done check**

Checklist:
- [x] v2-map bestaat als `projects/symitech/NEN_EN858_2-v2/`
- [x] v2 draait op poort 8766
- [x] v1 blijft op poort 8765, ongewijzigd
- [x] `npm test` in v2 → 129/129 groen
- [x] Git-repo geïnitialiseerd, 2 commits op `main`
- [x] README + STATUS aanwezig
- [x] Spec `2026-05-18-klant-voorziening-opslag-design.md` op zijn plek

Als alle vinkjes staan: fase 1 is klaar voor fase 2 (database-laag).

---

## Niet vergeten

- v1 mag **niet** aangepast worden tijdens deze fase. Als per ongeluk v1-bestand bewerkt: revert via git in v1 (mocht die git-tracked zijn) of handmatig herstellen.
- Geen functionele wijzigingen aan v2 in deze fase — alleen kopie + configuratie. Echte v2-features (database, dropdowns, modals) zijn fase 2+.
- Foto- en bron-PDFs uit v1 worden **niet** gekopieerd. Als referentie nodig: blijven beschikbaar in `../NEN_EN858_2/`.
