# Akif Albayrak — portfolio

The personal portfolio of Akif Albayrak, a Software Development student in the Netherlands.
It is a single static website written in plain HTML, CSS and JavaScript, with no framework
and no build step. The site is available in Dutch and English.

> **Status: in development, not live yet.** This repository shows the code and how it
> developed. GitHub Pages is switched off and nothing is deployed. Once the site is
> published, it will be available at
> `https://akif52340416.github.io/akif-albayrak-portfolio/`.

## Pages

| Page | Route |
|---|---|
| Home | `#/` |
| Work: overview | `#/work` |
| Case: Van der Hammen Gym | `#/work/van-der-hammen` |
| Case: Unite Re-integratie | `#/work/unite-reintegratie` |
| Case: Talia | `#/work/talia` |
| About | `#/about` |
| Experience | `#/experience` |
| Contact | `#/contact` |

## How it works

- **Hash routing** (`assets/js/router.js`). Every page has its own shareable link. Because
  routing uses the URL hash, the site works from `file://` and under a GitHub Pages subpath
  without any server configuration. The router also sets the page title and the scroll
  position.
- **Dutch and English.** Dutch is the default and lives in the markup. English text is
  matched per fragment in `i18n.js` (About, Experience and Contact have their own scripts).
  The choice is stored in `localStorage` (`akif-lang`).
- **Motion.** Each page has its own motion script (`*-motion.js`, `home-system.js`), built on
  `requestAnimationFrame` and `IntersectionObserver`. On the subpages, animation loops stop
  when nothing is moving.
  With `prefers-reduced-motion` the animations and the About photo intro are skipped.
- **About intro.** 24 photos are played as a short sequence on a `<canvas>`. Small screens
  load `about-sequence/960/`, larger screens load `about-sequence/1200/`.
- **Layout.** CSS custom properties, Grid and fluid sizes with `clamp()`. No CSS framework.
- **Accessibility.** A skip link, a `<main>` landmark, ARIA labels in both languages, and
  `inert` on content that is hidden.

## Project structure

```
index.html
assets/
  css/    site.css, motion.css, home-system.css
  js/     router, i18n, one script per page plus its motion script
  img/    portrait, home photo, screenshots of the three cases, Open Graph image
  icons/  favicon.svg, favicon.ico, apple-touch-icon.png
about-sequence/
  960/    frame-01.webp … frame-24.webp
  1200/   frame-01.webp … frame-24.webp
```

## Running it locally

Open `index.html` in a browser, or serve the folder:

```
python -m http.server 8000
```

and go to <http://localhost:8000/>.

## Contact form

The form validates its fields but does not send anything yet. After a valid submit the
visitor can copy the message or send it with their own e-mail client. A small backend
(Cloudflare Worker with Resend) is planned as a separate project.

## Development history

The site was built between mid-October and early November 2026, at first without Git. The
first eight commits are real snapshots from my own backups, **imported into Git afterwards**.
Their commit dates are the import date, and each commit message gives the original backup
date.

1. 16 Oct 2026: first complete version, everything in one HTML file
2. 19 Oct 2026: Experience and Contact redesigned
3. 23 Oct 2026: content trimmed, translation fixes (last single-file version)
4. 31 Oct 2026: split into separate CSS, JavaScript and image files
5. 1 Nov 2026: motion for Contact, Work/cases and Home
6. 4 Nov 2026: motion for About and Experience, accessibility and router improvements
7. 5 Nov 2026: case studies and finishing touches
8. 6 Nov 2026: new home system and a fix for the Van der Hammen showcase

[DEVELOPMENT.md](DEVELOPMENT.md) describes how the import was done, which files were added
to incomplete backups and why, the branch workflow, and what still needs to happen before
launch.
