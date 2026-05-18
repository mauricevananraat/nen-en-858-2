# Fase 6 — Hosting op GitHub Pages + Acceptance test Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deploy de tool naar Maurice's persoonlijke GitHub Pages en valideer dat alle kritieke flows werken op zijn Samsung Galaxy S24 (Android, Chrome).

**Architecture:** Geen code-architectuur-wijziging. De statische HTML+JS+CSS bundel wordt 1-op-1 vanaf de root van de `main` branch geserveerd door GitHub Pages. Geen build-stap. Maurice voert handmatig de GitHub-handelingen uit (account, repo aanmaken, Pages activeren); Claude geeft per stap de exacte commando's en wacht op bevestiging.

**Tech Stack:** Git, GitHub, GitHub Pages, Chrome Android (Samsung S24), bestaande vitest test-suite als regressie-veiligheidsnet.

**Spec:** `docs/superpowers/specs/2026-05-18-fase6-hosting-acceptance-design.md` (commit `da295cc`)
**Baseline:** 249 tests groen + 1 skipped, commit `7882db2`

---

## Variabelen — vul vóór Task 4 in

Vervang in alle commando's hieronder:

| Placeholder | Waarde | Waar bekend |
|-------------|--------|-------------|
| `<GH_USER>` | Jouw GitHub-username | Task 3 (Maurice bepaalt) |
| `<REPO>` | Repo-naam, voorstel: `nen-en-858-2` | Task 3 (Maurice bepaalt) |
| `<PAGES_URL>` | `https://<GH_USER>.github.io/<REPO>/` | Task 5 (na Pages-activatie) |

---

## File Structure

### Nieuw

| Pad | Verantwoordelijkheid |
|-----|----------------------|
| `docs/fase6-acceptance-rapport-2026-05-18.md` | Resultaten van de 20-item acceptance-checklist + bug-classificatie |
| `docs/fase6-screenshots/` (optioneel) | Schermafdrukken van failures, alleen aanmaken indien nodig |

### Gewijzigd

| Pad | Wijziging |
|-----|-----------|
| `.gitignore` | `.worktrees/` toevoegen, verifieer dat `PROMPTS.md` erin staat (al aanwezig) |
| `README.md` | Update voor publicatie — vermelding GitHub Pages URL, hoe te updaten, hoe te openen op telefoon, privacy-disclaimer |
| `STATUS.md` | Fase 6 ✓ + URL + verwijzing naar acceptance-rapport + eventueel Fase 7-backlog |

### Niet gewijzigd (mits geen Critical bug)

- `js/`, `css/`, `tests/`, `NEN-EN-858-2 controle formulier.html`, `index.html`, `assets/`

---

## Task 1: .gitignore valideren + `.worktrees/` toevoegen

**Files:**
- Modify: `.gitignore`

- [ ] **Step 1.1: Lees huidige `.gitignore`**

Verwachte inhoud (al aanwezig):
```
node_modules/
.superpowers/
*.log
PROMPTS.md
```

- [ ] **Step 1.2: Voeg `.worktrees/` toe aan `.gitignore`**

De gewenste eindcontent:
```
node_modules/
.superpowers/
.worktrees/
*.log
PROMPTS.md
```

- [ ] **Step 1.3: Verifieer dat `PROMPTS.md` niet getrackt is**

```bash
cd "C:/Users/Maurice van Anraat/Documents/.claudeV2/projects/symitech/NEN_EN858_2-v2" && git ls-files | grep -i prompts
```

Expected: lege output. Als `PROMPTS.md` wel staat:
```bash
git rm --cached PROMPTS.md
```

- [ ] **Step 1.4: Run tests om baseline te bevestigen**

```bash
npm test 2>&1 | tail -5
```

Expected: `Tests  249 passed | 1 skipped (250)`.

- [ ] **Step 1.5: Commit**

```bash
git add .gitignore
git commit -m "$(cat <<'EOF'
chore(gitignore): voeg .worktrees/ toe

Voorkomt dat lokale superpowers worktree-mappen per ongeluk
mee gepushed worden naar publieke repo.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: README.md updaten voor publicatie

**Files:**
- Modify: `README.md`

- [ ] **Step 2.1: Vervang volledige `README.md` met onderstaande content**

```markdown
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
```

NOTE: De regel `**Live:** <PAGES_URL>` blijft als placeholder staan tot Task 5. In Task 10 wordt deze vervangen door de echte URL.

- [ ] **Step 2.2: Commit**

```bash
git add README.md
git commit -m "$(cat <<'EOF'
docs(readme): herschrijf voor publicatie op GitHub Pages

Doelgroep: gebruiker die de tool via de live URL opent op laptop
of Samsung-telefoon. Beschrijft functies, privacy-aanpak (alleen
lokaal), hoe te updaten en hoe lokaal te draaien. URL-placeholder
wordt in Task 10 ingevuld zodra GitHub Pages live is.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: GitHub-repo aanmaken (handmatige stap door Maurice)

**Files:** geen lokale wijzigingen.

- [ ] **Step 3.1: Claude pauzeert en geeft Maurice deze instructies**

Maurice voert handmatig op github.com uit:

1. Ga naar https://github.com/new (login indien nodig).
2. **Repository name:** `nen-en-858-2` (of een andere naam — onthou welke je kiest, je hebt 'm nodig in Task 4).
3. **Description (optioneel):** `Inspectietool NEN-EN 858-2 voor olie/benzine afscheiders — Symitech B.V.`
4. **Public** selecteren (Pages werkt gratis met public repos).
5. **LAAT UITGEVINKT:** "Add a README file", "Add .gitignore", "Choose a license". We hebben deze al lokaal.
6. Klik "Create repository".
7. Op de volgende pagina: kopieer de **HTTPS URL** uit het kader "Quick setup". Vorm: `https://github.com/<GH_USER>/<REPO>.git`.

- [ ] **Step 3.2: Maurice meldt aan Claude**

Maurice deelt:
- GitHub username (voor `<GH_USER>`)
- Gekozen repo-naam (voor `<REPO>`)
- Volledige HTTPS-URL (voor `git remote add`)

Claude wacht expliciet op deze drie gegevens vóór Task 4 start.

- [ ] **Step 3.3: Verifieer dat je nog niet ingelogd bent vanaf de commandline**

```bash
cd "C:/Users/Maurice van Anraat/Documents/.claudeV2/projects/symitech/NEN_EN858_2-v2" && git config user.email && git config user.name
```

Expected: Maurice's git-identity verschijnt. Als leeg of fout: instellen met
```bash
git config user.email "<jouw-email>"
git config user.name "<jouw-naam>"
```

(`<jouw-email>` en `<jouw-naam>` invullen door Maurice. Niet `--global` gebruiken; alleen voor deze repo.)

---

## Task 4: Origin koppelen + initial push

**Files:** geen lokale wijzigingen (alleen git config + push).

- [ ] **Step 4.1: Voeg `origin` toe**

Vervang `<GH_USER>` en `<REPO>` met de waarden uit Task 3.

```bash
cd "C:/Users/Maurice van Anraat/Documents/.claudeV2/projects/symitech/NEN_EN858_2-v2" && git remote add origin https://github.com/<GH_USER>/<REPO>.git
```

Expected: geen output, exit code 0.

- [ ] **Step 4.2: Verifieer remote**

```bash
git remote -v
```

Expected: twee regels (`fetch` + `push`) met de juiste URL.

- [ ] **Step 4.3: Check status**

```bash
git status
```

Expected: `On branch main / nothing to commit, working tree clean`.

Als er nog uncommitted bestanden zijn (bv. untracked plan-docs uit eerdere fases): controleer of ze meegepushed moeten worden:
```bash
git add docs/superpowers/plans/*.md
git commit -m "docs(plans): commit fase 2-6 implementatieplannen"
```

- [ ] **Step 4.4: Push naar GitHub**

```bash
git push -u origin main
```

Expected: progress-bars en uiteindelijk `Branch 'main' set up to track 'origin/main'`. Bij authenticatieprompt: GitHub vraagt om een Personal Access Token (PAT), niet om je wachtwoord. Als je geen PAT hebt: maak er een op https://github.com/settings/tokens/new (scope: `repo`).

- [ ] **Step 4.5: Verifieer op GitHub**

Open in browser: `https://github.com/<GH_USER>/<REPO>` — alle bestanden moeten zichtbaar zijn.

---

## Task 5: GitHub Pages activeren (handmatige stap door Maurice)

**Files:** geen lokale wijzigingen.

- [ ] **Step 5.1: Maurice activeert Pages**

1. Open `https://github.com/<GH_USER>/<REPO>/settings/pages`.
2. **Source:** "Deploy from a branch".
3. **Branch:** `main` selecteren, folder: `/ (root)`.
4. Klik **Save**.
5. Wacht ±1-2 minuten. Bij verversen van de pagina verschijnt bovenaan een groen kader: `Your site is live at https://<GH_USER>.github.io/<REPO>/`.

- [ ] **Step 5.2: Maurice deelt de live-URL met Claude**

Vorm: `https://<GH_USER>.github.io/<REPO>/`

Sla deze op als `<PAGES_URL>` voor gebruik in Task 6, 10 en de README-update.

- [ ] **Step 5.3: De URL is nog niet direct bereikbaar voor de tool**

GitHub Pages serveert standaard `index.html` op de root. Open de URL en verifieer:
- Verwachting: een keuze-pagina (huidige `index.html`) of de inspectie-form direct.
- Als de keuzepagina verschijnt, klik door naar het formulier.

Als de pagina een 404 toont, wacht 1 minuut en refresh.

---

## Task 6: Smoke test op laptop

**Files:** geen wijzigingen.

- [ ] **Step 6.1: Open `<PAGES_URL>` in Chrome op laptop**

Controleer:
- Geen 404
- Geen JavaScript-fouten in de browser-console (F12 → Console)
- Stylesheet laadt (form ziet er gestyled uit, geen ongestylde tekst)

- [ ] **Step 6.2: Klein functioneel rondje op laptop**

Voer uit in volgorde:
1. Klik "+" naast Klant — modal opent
2. Vul "Test BV" in als bedrijfsnaam, sla op — klant verschijnt in dropdown, geselecteerd
3. Klik "+" naast Voorziening — modal opent met "Klant: Test BV" badge
4. Vul "Test-installatie 01" als naam, sla op — voorziening verschijnt en is geselecteerd
5. Klik "Exporteer database" — JSON downloads
6. Klik "Importeer database" → kies de zojuist gedownloade JSON → OK (vervangen) → reload met succes-alert

- [ ] **Step 6.3: Documenteer eventuele afwijking**

Als iets niet werkt op laptop maar wel lokaal: er is een verschil tussen `file://` of `localhost` en GitHub Pages (bv. relatieve paden, CORS, of mixed content). Noteer welke stap faalde en stop Task 6 totdat het opgelost is.

Veel-voorkomende verschillen:
- **Pad-case-sensitivity:** GitHub Pages is case-sensitive, Windows niet. `Symitech_logo.png` ≠ `symitech_logo.png` werkt lokaal maar niet op Pages.
- **Spaties in bestandsnaam:** `NEN-EN-858-2 controle formulier.html` heeft een spatie. Url-encoding moet `%20` worden bij verwijzingen.

Bij geen afwijking: door naar Task 7.

---

## Task 7: Acceptance-checklist op Samsung S24

**Files:** wordt vastgelegd in Task 9.

- [ ] **Step 7.1: Open `<PAGES_URL>` op Samsung S24 in Chrome**

Acties:
1. Typ de URL in Chrome adresbalk (of scan een QR die naar de URL wijst — handig vanaf laptop).
2. Geef Chrome eventuele permissies (camera, opslag) als die later gevraagd worden.
3. Voeg toe aan startscherm: menu → "Toevoegen aan startscherm" (optioneel).

- [ ] **Step 7.2: Werk de 20-item checklist af**

Per item: PASS / FAIL / SKIP. Bij FAIL: classificeer als **Critical / Important / Cosmetic** (zie spec §5.1) en noteer korte beschrijving + screenshot indien mogelijk.

| # | Categorie | Flow | Verwacht |
|---|-----------|------|----------|
| 1 | Laad | Tool URL opent, formulier rendert | Pagina volledig, geen console-errors |
| 2 | Klant new | "+ Nieuwe klant"-knop → modal → bedrijfsnaam + adres → opslaan | Klant geselecteerd in dropdown |
| 3 | Klant edit | "✎ Bewerken" → modal pre-filled → wijzig naam → opslaan | Dropdown toont nieuwe naam |
| 4 | Klant delete | "🗑 Verwijderen" → confirm → klant + voorzieningen weg | Dropdown leeg, voorziening-knoppen disabled |
| 5 | Voorziening new | Maak weer klant → "+ Nieuwe voorziening" → naam + NS-klasse + capaciteit → opslaan | Voorziening geselecteerd |
| 6 | Voorziening edit/delete | Idem als 3-4 voor voorziening | Werkt parallel aan klant |
| 7 | Sectie 1 | Projectnummer, datum, inspecteur invullen | Velden blijven bij sectie-switch |
| 8 | Sectie 2 metingen | Slibvanger-meting invoeren | Auto-pct getoond, advies-blok verschijnt bij grenswaarde |
| 9 | Sectie 3-5 | Functietesten, controleput, lediging+BAL invullen | Alle radios/inputs reageren |
| 10 | Interval | Switch halfjaar → jaar → 5-jaar | Secties 6/7/8 + BAL tonen/verbergen per interval |
| 11 | Checklist OBAS | Bij interval=5-jaar: 24-punts checklist zichtbaar | Alle 24 items invulbaar |
| 12 | Foto camera | 📷-knop in foto-slot | Android camera-app opent, foto verschijnt na maken |
| 13 | Foto upload | 🖼️-knop in foto-slot | Fotobibliotheek opent, meerdere selectie werkt |
| 14 | Foto delete | X-knop op foto | Foto verwijderd uit slot |
| 15 | Handtekening | Touch op canvas in sectie 9 | Lijn volgt vinger, "wissen" werkt |
| 16 | PDF | "📄 Genereer PDF" | Chrome downloadt PDF, opent, klantgegevens + foto's + handtekening zichtbaar |
| 17 | Concept | "💾 Concept opslaan" → JSON download. "📂 Concept laden" → upload | Formulier herstelt volledig |
| 18 | DB-export | "Exporteer database"-knop | `nen858-klanten-YYYY-MM-DD.json` download |
| 19 | DB-import laptop→telefoon | Laptop: export → upload naar Drive/mail → telefoon: download → import (mode: vervangen) | Klant+voorziening verschijnen na reload |
| 20 | DB-import telefoon→laptop | Telefoon: export → deel naar laptop → laptop: import (mode: vervangen) | Klant+voorziening verschijnen na reload |

- [ ] **Step 7.3: Telling van resultaten**

Aan het eind van het rondje:
- **Aantal PASS:** _ / 20
- **Aantal Critical FAIL:** _
- **Aantal Important FAIL:** _
- **Aantal Cosmetic FAIL:** _

Als **Critical FAIL > 0**: ga naar Task 8. Anders: ga naar Task 9.

---

## Task 8: Critical bugs fixen (alleen als nodig)

**Files:** afhankelijk van de bug.

- [ ] **Step 8.1: Per Critical bug — reproduceer**

Documenteer:
- Welke stap uit checklist faalt
- Welke browser-console-melding (F12 in Chrome remote-debug via USB, of Eruda toevoegen voor on-device console)
- Welk verwacht vs. werkelijk gedrag

- [ ] **Step 8.2: Per Critical bug — schrijf een falende test**

Per de globale TDD-regel: voeg een test toe in het juiste `tests/*.test.js` bestand die de bug reproduceert in jsdom. Als de bug Android-specifiek is en niet reproduceerbaar in jsdom, documenteer dit in de test als een `it.skip` met een commentaar waarom.

- [ ] **Step 8.3: Per Critical bug — fix de code**

Minimale wijziging om de falende test te laten slagen. Niet uitbreiden.

- [ ] **Step 8.4: Run tests**

```bash
cd "C:/Users/Maurice van Anraat/Documents/.claudeV2/projects/symitech/NEN_EN858_2-v2" && npm test 2>&1 | tail -5
```

Expected: alle tests groen, totaal ≥ 250 (was 249 + 1 skipped).

- [ ] **Step 8.5: Commit per bug**

```bash
git add <gewijzigde bestanden>
git commit -m "$(cat <<'EOF'
fix(<scope>): <korte bugbeschrijving>

Gevonden tijdens Fase 6 acceptance-test op Samsung S24.
Reproductie: <welke checklist-item / hoe>.
Fix: <wat is er gewijzigd, kort>.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

- [ ] **Step 8.6: Push en herhaal acceptance-checklist voor de gefixte items**

```bash
git push
```

Wacht ±1 minuut, force-refresh op telefoon (pull-to-refresh of Chrome menu → opnieuw laden), test opnieuw. Bij PASS: door naar volgende Critical bug of Task 9. Bij blijvende FAIL: blijf in Task 8.

---

## Task 9: Acceptance-rapport schrijven

**Files:**
- Create: `docs/fase6-acceptance-rapport-2026-05-18.md`

- [ ] **Step 9.1: Maak het rapport**

Vervang `<...>` met daadwerkelijke waarden uit Task 7 (en eventuele Task 8 iteraties).

```markdown
# Fase 6 — Acceptance-rapport

**Datum:** 2026-05-18
**Apparaat:** Samsung Galaxy S24 (Android), Chrome
**URL:** <PAGES_URL>
**Tester:** Maurice van Anraat
**Baseline commit:** <SHA na Task 8 fixes, of 7882db2 als geen fixes>

## Samenvatting

- **PASS:** <aantal> / 20
- **FAIL (Critical):** <aantal>, alle gefixt
- **FAIL (Important):** <aantal>, naar backlog
- **FAIL (Cosmetic):** <aantal>, naar backlog
- **SKIP:** <aantal>

## Detail per checklist-item

| # | Categorie | Flow | Resultaat | Opmerking |
|---|-----------|------|-----------|-----------|
| 1 | Laad | Tool URL opent, formulier rendert | PASS / FAIL | <indien fail: classificatie + beschrijving> |
| 2 | Klant new | Nieuwe klant toevoegen via modal | PASS / FAIL | |
| 3 | Klant edit | Bestaande klant bewerken | PASS / FAIL | |
| 4 | Klant delete | Klant + voorzieningen cascade-verwijderen | PASS / FAIL | |
| 5 | Voorziening new | Voorziening bij klant toevoegen | PASS / FAIL | |
| 6 | Voorziening edit/delete | Voorziening bewerken/verwijderen | PASS / FAIL | |
| 7 | Sectie 1 | Projectgegevens persistent | PASS / FAIL | |
| 8 | Sectie 2 | Auto-pct en advies-blok | PASS / FAIL | |
| 9 | Sectie 3-5 | Functietesten/controleput/lediging | PASS / FAIL | |
| 10 | Interval | Halfjaar/jaar/5jaar switch | PASS / FAIL | |
| 11 | Checklist OBAS | 24-punts checklist 5-jaarlijks | PASS / FAIL | |
| 12 | Foto camera | Android-camera opent | PASS / FAIL | |
| 13 | Foto upload | Fotobibliotheek, multi-select | PASS / FAIL | |
| 14 | Foto delete | Verwijderen uit slot | PASS / FAIL | |
| 15 | Handtekening | Touch-canvas | PASS / FAIL | |
| 16 | PDF | PDF-generatie op telefoon | PASS / FAIL | |
| 17 | Concept JSON | Opslaan/laden | PASS / FAIL | |
| 18 | DB-export | Database naar JSON-bestand | PASS / FAIL | |
| 19 | DB-import laptop→telefoon | Sync werkt | PASS / FAIL | |
| 20 | DB-import telefoon→laptop | Sync omgekeerd | PASS / FAIL | |

## Fase 7-backlog (Important + Cosmetic FAILs)

<Lijst van Important en Cosmetic items. Per item: # uit checklist, categorie, beschrijving, eventuele screenshot-link.>

Bijvoorbeeld:
- **Item 12 (Important)** — Camera-knop opent eerst bestand-picker voordat camera kan, op Samsung S24 Chrome. Workaround: 2× tikken. Fix: `accept="image/*"` met `capture` attribuut anders bekijken.
- **Item 16 (Cosmetic)** — PDF-titel toont placeholder "rapport" als projectnummer leeg is in plaats van "concept".

## Conclusie

<Eén alinea: is de tool praktisch bruikbaar voor echte inspecties? Welke beperkingen blijven? Aanbeveling voor Fase 7?>
```

- [ ] **Step 9.2: Commit**

```bash
git add docs/fase6-acceptance-rapport-2026-05-18.md
git commit -m "$(cat <<'EOF'
docs(fase6): acceptance-rapport Samsung S24 (Chrome Android)

20-item checklist afgewerkt op live URL. Critical bugs gefixt
en doorgepusht voorafgaand aan dit rapport. Important +
Cosmetic items zijn vastgelegd als Fase 7-backlog.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

```bash
git push
```

---

## Task 10: STATUS.md update + README URL invullen + finale commit

**Files:**
- Modify: `STATUS.md`
- Modify: `README.md` (URL-placeholder invullen)

- [ ] **Step 10.1: Vervang `<PAGES_URL>` in `README.md`**

In `README.md` staat een regel:
```
**Live:** `<PAGES_URL>` *(URL invullen na Task 5)*
```

Vervang door (voorbeeld):
```
**Live:** https://maurice-symitech.github.io/nen-en-858-2/
```

(Met de werkelijke URL uit Task 5.)

- [ ] **Step 10.2: Update `STATUS.md` — vervang het "## Volgende fase"-blok aan het einde door:**

```markdown
## Fase 6 — Hosting + Acceptance test ✓ Afgerond op 2026-05-18

Resultaat:
- Tool live op GitHub Pages: <PAGES_URL>
- Acceptance-checklist 20/20 afgewerkt op Samsung Galaxy S24 (Chrome Android)
- Critical bugs: <aantal> gevonden en gefixt
- Important/Cosmetic backlog: <aantal> items, zie `docs/fase6-acceptance-rapport-2026-05-18.md`
- README publiek-gereed met privacy-disclaimer en update-instructies
- `.gitignore` valideert: `PROMPTS.md` blijft privé
- Tests-status na fixes: <eindstand> groen + 1 skipped

## Fase 7-backlog (afhankelijk van praktijkgebruik)

- **Fase 7a (mogelijk):** PWA-laag voor offline gebruik op locatie (service worker + manifest) — alleen als bereik in de praktijk een probleem blijkt
- **Fase 7b (mogelijk):** UX-polish: custom mode-modal voor import (i.p.v. confirm()), emoji-consistentie sync-knoppen, andere items uit acceptance-rapport
- **Fase 7c (mogelijk):** Custom domain (bv. `inspectie.symitech.nl`)
```

- [ ] **Step 10.3: Commit**

```bash
git add STATUS.md README.md
git commit -m "$(cat <<'EOF'
docs: mark fase 6 afgerond + vul Pages-URL in README

GitHub Pages live, acceptance-checklist 20/20 afgewerkt op
Samsung Galaxy S24. Fase 7 backlog vastgelegd in STATUS.md
voor toekomstige verbeteringen op basis van praktijkgebruik.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

```bash
git push
```

- [ ] **Step 10.4: Definition of Done check**

```bash
cd "C:/Users/Maurice van Anraat/Documents/.claudeV2/projects/symitech/NEN_EN858_2-v2"
npm test 2>&1 | tail -5
git log --oneline -10
git status
```

Expected:
- Tests: minstens 249 passed + 1 skipped (meer als Task 8 fixes tests toevoegden)
- Git log toont 5-7 Fase 6 commits (`chore(gitignore)`, `docs(readme)`, eventuele `fix(...)` commits, `docs(fase6)`, `docs:` finale)
- `git status`: working tree clean
- Browser-test: `<PAGES_URL>` opent op zowel laptop als Samsung S24

Bij alles ✓ is Fase 6 afgesloten.

---

## Risico's en mitigaties

| Risico | Mitigatie |
|--------|-----------|
| Per ongeluk `PROMPTS.md` pushen | Task 1 verifieert; `git status` voor push in Task 4 |
| GitHub Pages 404 na activeren | Task 5 noemt 1-minuut wachttijd; refresh |
| Authenticatieprobleem (HTTPS / PAT) | Task 4.4 verwijst naar PAT-instructie |
| Case-sensitivity-bug (lokaal werkt, Pages niet) | Task 6 noemt expliciet; smoke test vóór telefoon |
| Critical bug op Android-only feature (bv. camera) | Task 8 met TDD + bedienings-fallback (upload knop) |
| Test-suite faalt na fix | Task 8.4 verifieert; bij faal: niet committen |
| GitHub Pages caching | README sectie "Updaten van de live-versie" instrueert Ctrl+F5 |
| Repo per ongeluk private gemaakt | Pages werkt dan niet zonder Pro; Task 3.1 stap 4 onderstreept "Public" |

---

## Niet in deze fase

- **PWA / service worker / manifest** — alleen als praktijk dit eist (Fase 7a)
- **Custom domain** — Fase 7c
- **Open-source maken / LICENSE-bestand** — Maurice beslist later
- **CI/CD pipeline** — overkill voor één persoon en statische site
- **Bugs die als Important/Cosmetic geclassificeerd zijn** — Fase 7b backlog
