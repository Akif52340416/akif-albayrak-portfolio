# Development

## History

I built this portfolio between mid-October and early November 2026, at first without Git.
Before every larger change I made a backup. When I moved the project to GitHub, I imported
the most important backups **as commits, afterwards**, so the history shows how the site
actually grew.

Rules for that import:

- **Existing files only.** Each commit is the content of one backup. No code was rewritten,
  cleaned up or added.
- **Site files only.** From each backup I took only the files that version of the site loads.
  Prototypes, screenshots, videos and other personal files are not in the repository.
- **Additions only with proof.** Some backups did not include every image, because those files
  had not changed between versions. They were only added where it can be shown that the
  content was the same at the time: an identical SHA-256 hash in every backup that does
  contain the file, and a file date before the snapshot. Every addition is listed in the
  commit message.
- **Honest dates.** All commits carry the real import date (8 November 2026) as author and
  commit date. No historical dates were set in Git. The original backup date (the time of the
  newest original file in that backup) is in the table below and in each commit message,
  together with the line "Historische snapshot, achteraf geïmporteerd op …" (historical
  snapshot, imported afterwards). The commit messages of the imported snapshots are in Dutch.
- Tags `historie/01-…` to `historie/08-…` mark the eight milestones.

| # | Backup date | Milestone | Source (backup) | Added files |
|---|---|---|---|---|
| 1 | 16 Oct 2026 | First complete version: one HTML file with inline CSS, JS and images | `index.voor-experience-redesign.html` | about-sequence, 2 Rotterdam photos |
| 2 | 19 Oct 2026 | Experience rebuilt as five chapters; new Contact form | `index.voor-about-buiten-it.html` | about-sequence, 2 Rotterdam photos |
| 3 | 23 Oct 2026 | Content trimmed, translation fixes; last single-file version | `index.voor-opsplitsing.html` | about-sequence |
| 4 | 31 Oct 2026 | Split into separate CSS, JS and image files | `voor-fase1-contact/` | about-sequence |
| 5 | 1 Nov 2026 | Motion for Contact, Work/cases and Home | `voor-fase3-home-integratie/` | about-sequence, 11 images in assets/img |
| 6 | 4 Nov 2026 | Motion for About and Experience; skip link, `<main>`, router scroll handling | `voor-cases-unite-talia/` | about-sequence |
| 7 | 5 Nov 2026 | Case studies and finishing touches | `voor-integratie-systeem-…/` | – |
| 8 | 6 Nov 2026 | New home system; fix for the Van der Hammen showcase | `volledig-voor-github-…/` | – |

Why the additions were allowed:
- `about-sequence/*`: all 48 frames are dated 12 Oct 2026, before the first milestone. They
  are identical in every copy, and the code of every snapshot loads them.
- `about-photos/akif-rotterdam-*.jpg`: dated 13 Oct 2026. The HTML of versions 1 and 2 loads
  them through `<img src/srcset>`.
- `assets/img/*` in version 5: dated 23 Oct 2026 and byte-identical in all seven complete
  backups (31 Oct to 6 Nov).

Versions 1 and 2 still have Dutch text on the Home page in English mode. That is how those
versions were; it was fixed in version 3.

## After the import

Work after the import goes through `develop`:

- Favicon (`assets/icons/`): a bold "A" with the rose square that is used as a full stop
  elsewhere on the site.
- Open Graph image (`assets/img/og-image.jpg`, 1200 × 630) and canonical, Open Graph and
  Twitter Card tags in `index.html`.
- This documentation, in English.
- Self-hosted Instrument Sans (`assets/fonts/`, `assets/css/fonts.css`): the same WOFF2 files,
  weight range (400–700) and `unicode-range` subsets that Google Fonts served, so the
  typography is unchanged and no third-party requests remain. License: SIL OFL 1.1
  (`assets/fonts/OFL.txt`).

## Branches

| Branch | Purpose |
|---|---|
| `main` | Stable version of the site. Not published yet. |
| `develop` | Integration of new work. Checked by CI, not published. |
| `feature/<name>` | One change per branch, branched from `develop`. |

Workflow:

```
git switch develop
git switch -c feature/<name>
# work and test (open index.html, or: python -m http.server 8000)
git commit
git switch develop && git merge --no-ff feature/<name>
# when develop is ready: pull request develop -> main on GitHub, review, merge
```

Recommended on GitHub (Settings → Branches → protection rule for `main`): require a pull
request and require the `Check / check` status to pass.

## CI check (publishes nothing)

`.github/workflows/check.yml` runs on every push to `main`, `develop` and `feature/**`, on
pull requests to `main`, and manually (`workflow_dispatch`, available from the Actions tab
once the file is on the default branch). In the runner it assembles a temporary `_site/` from
**only** `index.html`, `assets/` and `about-sequence/`, then:

- checks that every referenced file exists, including the fonts referenced from the CSS;
- fails if `index.html` or the CSS loads a stylesheet, script or font from another domain;
- scans for anything that looks like a secret.

It has read-only permissions, a 5-minute time limit, no Pages artifact and no deploy step.

The workflow only runs if Actions is enabled for the repository (Settings → Actions →
General). The repository uses the most restrictive settings that still work:

- *Actions permissions*: allow actions created by GitHub only (Marketplace verified creators
  off). The workflow uses only `actions/checkout`, so nothing else is needed.
- *Workflow permissions*: read repository contents and packages.

## Publishing the website (not yet: only after an explicit decision)

The website is deliberately **not live**. GitHub Pages is off. When it is time:

1. Settings → Pages → *Build and deployment* → Source: **GitHub Actions**.
2. Add a separate `pages.yml` workflow that assembles `_site/` the same way, then runs
   `actions/upload-pages-artifact` and a job with `actions/deploy-pages`, only on pushes to
   `main` (permissions `pages: write`, `id-token: write`).
3. The site will then be at `https://akif52340416.github.io/akif-albayrak-portfolio/`. All
   paths in the site are relative, so the subpath works without changes.

Before launch, check:

- The canonical URL, `og:url`, `og:image` and `twitter:image` in `index.html` point to
  `https://akif52340416.github.io/akif-albayrak-portfolio/`. If the site moves to a custom
  domain, update them.
- After publishing, open the LinkedIn Post Inspector
  (<https://www.linkedin.com/post-inspector/>) with the URL to make LinkedIn fetch the
  preview. Social previews cannot work before the site is reachable over HTTPS.

## Contact form

The backend lives in `contact-worker/` (Cloudflare Worker + Turnstile + Resend); see
[contact-worker/README.md](contact-worker/README.md) for what it checks, its configuration
and local testing. It is **not deployed**: `data-endpoint` and `data-sitekey` on `#ocForm`
in `index.html` are empty, so the form keeps its old behaviour (validation, then mailto or
copy). Once both are filled in, `contact.js` sends through the Worker, says "sent" only when
the Worker confirms it, and on any failure keeps the text and offers mailto and copy.
The Turnstile script is only loaded once `#/contact` is opened. Ground rules:

- The Resend API key is stored **only** as a Worker secret (`wrangler secret put`), never in
  code, never in a committed `.dev.vars`, and never in this repository. `.gitignore` already
  excludes `.env*`, `.dev.vars*` and `.wrangler/`.
- The site only gets the Worker's public URL and Turnstile's public site key.
- The Worker only accepts requests from the site's own domain (CORS) and has rate limiting
  and basic spam protection.
- `DRY_RUN` stays `"1"` until real sending has been approved.
- Local test, no deploy and no e-mail (details in `contact-worker/README.md`):
  `cd contact-worker && npm ci && npm test`, then either `npm run dev` (mocked) or
  `npm run dev:wrangler` + `npm run dev:site` (the real Workers runtime via `wrangler dev
  --local`), and open <http://localhost:8000/?contact=local#/contact>.

## Testing locally

- Directly: open `index.html` (`file://`). Hash routing works without a server.
- As GitHub Pages serves it: `python -m http.server 8000` in this folder.
- What to check: every route from the README, Dutch and English, narrow (390 px) and wide
  (1440 px), and once with *prefers-reduced-motion* turned on (DevTools → Rendering).
