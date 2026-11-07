# Akif Albayrak: portfolio

Persoonlijk portfolio van Akif Albayrak (Software Development / IT). Het is één statische
website zonder build-stap of framework: HTML, CSS en vanilla JavaScript.

*Personal portfolio website, plain HTML/CSS/JS, available in Dutch and English.*

## Inhoud

| Pagina | Route |
|---|---|
| Home | `#/` |
| Work: overzicht | `#/work` |
| Case: Van der Hammen | `#/work/van-der-hammen` |
| Case: Unite Re-integratie | `#/work/unite-reintegratie` |
| Case: Talia | `#/work/talia` |
| About | `#/about` |
| Experience | `#/experience` |
| Contact | `#/contact` |

- **Hash-routing** (`router.js`): elke pagina heeft een eigen deelbare link en werkt ook
  vanaf `file://` en op GitHub Pages zonder serverconfiguratie.
- **Nederlands / Engels**: de keuze wordt bewaard in `localStorage` (`akif-lang`).
- **Animaties** per pagina (`*-motion.js`, `motion.css`, `home-system.*`). Met
  `prefers-reduced-motion` worden ze overgeslagen.
- **About-intro**: 24 foto's als korte sequentie op een canvas (`about-sequence/960` voor
  smalle schermen, `about-sequence/1200` voor brede).

## Structuur

```
index.html
assets/
  css/   site.css, motion.css, home-system.css
  js/    router, i18n, per pagina een script + motion-script
  img/   portret, homefoto, screenshots van de drie cases (desktop/tablet/mobiel)
about-sequence/
  960/   frame-01.webp … frame-24.webp
  1200/  frame-01.webp … frame-24.webp
```

## Lokaal bekijken

Open `index.html` direct in de browser, of start een eenvoudige server in deze map:

```
python -m http.server 8000
```

en ga naar <http://localhost:8000/>.

## Status

Het portfolio is **in ontwikkeling** en staat **nog niet online**. Deze repository laat de
code en de ontwikkelgeschiedenis zien. GitHub Pages staat uit, en de enige workflow
(`.github/workflows/check.yml`) controleert alleen of alle bestanden en verwijzingen kloppen;
hij publiceert niets. Nieuwe wijzigingen gaan via `develop` of een `feature/…`-branch. Zie
[DEVELOPMENT.md](DEVELOPMENT.md).

## Contactformulier

Het formulier controleert de invoer, maar verstuurt nu nog niets. De bezoeker kan het
bericht kopiëren of via e-mail versturen. Later komt er een eigen backend (Cloudflare Worker
+ Resend) in een aparte map/repository `contact-worker/`.

## Geschiedenis

De eerste acht commits zijn **echte historische versies uit mijn eigen backups**
(16 oktober – 6 november 2026), die ik **achteraf in Git heb geïmporteerd**. Er is geen code
verzonnen of aangepast. Hoe dat gedaan is, welke bestanden aangevuld zijn en waarom, staat in
[DEVELOPMENT.md](DEVELOPMENT.md).
