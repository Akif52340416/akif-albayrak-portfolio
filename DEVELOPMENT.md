# Ontwikkeling

## Ontwikkelgeschiedenis

Ik heb dit portfolio tussen half oktober en begin november 2026 gebouwd, eerst zonder Git.
Tijdens het werk maakte ik vóór elke grotere wijziging een backup. Toen ik het project op
GitHub zette, heb ik de belangrijkste van die backups **achteraf als commits geïmporteerd**,
zodat de geschiedenis laat zien hoe de site echt gegroeid is.

Spelregels bij die import:

- **Alleen bestaande bestanden.** Elke commit is de inhoud van één backup. Er is niets
  herschreven, opgeschoond of toegevoegd aan de code.
- **Alleen sitebestanden.** Per backup zijn alleen de bestanden genomen die die versie van de
  site laadt (whitelist). Prototypes, screenshots, video's en andere persoonlijke bestanden
  zitten niet in de repository.
- **Aanvullingen alleen met bewijs.** Sommige backups bevatten niet alle afbeeldingen, omdat
  die tussen versies niet veranderden. Die zijn alleen aangevuld als aantoonbaar is dat de
  inhoud toen hetzelfde was: identieke SHA-256 in elke backup die het bestand wel heeft, en
  een bestandsdatum van vóór de snapshot. Elke aanvulling staat in de commitboodschap.
- **Eerlijke datums.** Alle commits hebben de echte importdatum (8 november 2026) als
  author- en commitdatum. Er zijn geen historische datums in Git ingesteld. De oorspronkelijke
  backupdatum (het tijdstip van het nieuwste originele bestand in die backup) staat in de
  tabel hieronder en in elke commitboodschap, samen met de tekst
  "Historische snapshot, achteraf geïmporteerd op …".
- Tags `historie/01-…` t/m `historie/08-…` markeren de acht mijlpalen.

| # | Backupdatum | Mijlpaal | Bron (backup) | Aanvullingen |
|---|---|---|---|---|
| 1 | 16-10-2026 | Eerste complete versie (één HTML-bestand) | `index.voor-experience-redesign.html` | about-sequence, 2 Rotterdam-foto's |
| 2 | 19-10-2026 | Experience en Contact opnieuw ontworpen | `index.voor-about-buiten-it.html` | about-sequence, 2 Rotterdam-foto's |
| 3 | 23-10-2026 | Laatste versie met alles in één HTML-bestand | `index.voor-opsplitsing.html` | about-sequence |
| 4 | 31-10-2026 | Opgesplitst naar losse CSS/JS/afbeeldingen | `voor-fase1-contact/` | about-sequence |
| 5 | 01-11-2026 | Motion voor Contact, Work/cases en Home | `voor-fase3-home-integratie/` | about-sequence, 11 afbeeldingen in assets/img |
| 6 | 04-11-2026 | About, Experience en technische afwerking | `voor-cases-unite-talia/` | about-sequence |
| 7 | 05-11-2026 | Projectcases en afwerking | `voor-integratie-systeem-…/` | – |
| 8 | 06-11-2026 | Nieuw home-systeem, VDH-showcasefix (huidige site) | `volledig-voor-github-…/` | – |

Waarom aanvullen mocht:
- `about-sequence/*`: alle 48 frames zijn gedateerd 12-10-2026, dus vóór de eerste mijlpaal.
  Ze zijn ongewijzigd in elke kopie, en de code van elke snapshot laadt ze.
- `about-photos/akif-rotterdam-*.jpg`: gedateerd 13-10-2026. De HTML van versie 1 en 2 laadt
  ze via `<img src/srcset>`.
- `assets/img/*` in versie 5: gedateerd 23-10-2026 en byte-identiek in alle zeven volledige
  backups (31-10 t/m 06-11).

## Branches

| Branch | Doel |
|---|---|
| `main` | Stabiele versie van de site (nog niet gepubliceerd). |
| `develop` | Integratie van nieuwe wijzigingen. Wordt gecontroleerd, niet gepubliceerd. |
| `feature/<naam>` | Eén wijziging per branch, vanaf `develop`. |

Werkwijze:

```
git switch develop
git switch -c feature/<naam>
# werken, testen (index.html openen of: python -m http.server 8000)
git commit
git switch develop && git merge --no-ff feature/<naam>
# als develop goed is: pull request develop -> main op GitHub, controleren, mergen
```

Aanbevolen instellingen op GitHub (Settings → Branches → branch protection voor `main`):
pull request verplicht, en de check `Check / check` moet slagen.

## Controle-workflow (publiceert niets)

`.github/workflows/check.yml` draait bij elke push naar `main`, `develop` en `feature/**`, en
bij pull requests naar `main`. Hij stelt in de runner een tijdelijke `_site/` samen uit
**alleen** `index.html`, `assets/` en `about-sequence/`, controleert of alle verwijzingen
bestaan en zoekt naar mogelijke geheimen. Er is geen Pages-artifact en geen deploy-stap, en
de workflow heeft alleen leesrechten.

## Website publiceren (nog niet: alleen na expliciete beslissing)

De website staat bewust **nog niet online**. GitHub Pages staat uit. Als het zover is:

1. Settings → Pages → *Build and deployment* → Source: **GitHub Actions**.
2. Een aparte workflow `pages.yml` toevoegen met hetzelfde samenstellen van `_site/`, gevolgd
   door `actions/upload-pages-artifact` en een job met `actions/deploy-pages`, die alleen
   draait bij een push naar `main` (rechten `pages: write`, `id-token: write`).
3. Adres wordt dan `https://akif52340416.github.io/akif-portfolio/`. Alle paden in de site zijn
   relatief, dus de submap werkt zonder aanpassingen.

## Contactformulier (later)

De backend komt in een eigen map/repository `contact-worker/` (Cloudflare Worker + Resend)
en wordt apart gepubliceerd. Afspraken voor dan:

- De Resend-API-sleutel staat **alleen** als Worker-secret (`wrangler secret put`), nooit in
  code, in `.dev.vars` in Git, of in deze repository (`.gitignore` sluit `.env*`, `.dev.vars*`
  en `.wrangler/` al uit).
- De site krijgt alleen de publieke URL van de Worker.
- De Worker accepteert alleen verzoeken vanaf het Pages-domein (CORS) en heeft een
  rate limit/spamcontrole.

## Lokaal testen

- Direct: `index.html` openen (`file://`), want hash-routing werkt zonder server.
- Zoals GitHub Pages het serveert: `python -m http.server 8000` in deze map.
- Controleren: alle routes uit de README, NL en EN, smal (390 px) en breed (1440 px), en
  één keer met *prefers-reduced-motion* (DevTools → Rendering).
