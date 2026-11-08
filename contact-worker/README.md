# contact-worker

Cloudflare Worker behind the portfolio's contact form. It checks a message and passes it
on to [Resend](https://resend.com) as a plain-text e-mail. Status: **built and tested
locally, not deployed.** Until it is deployed and its URL is set in `index.html`, the form
works as before (validation, then mailto or copy).

## What it does

```
form (index.html + assets/js/contact.js)
  └─ POST JSON {name, email, message, token, website, lang, elapsed} → /contact
       1. route + method (POST /contact; OPTIONS for the CORS preflight)
       2. Origin must be in ALLOWED_ORIGINS (exact match), otherwise 403
       3. Content-Type application/json, body ≤ 10 KB
       4. rate limit: 3 requests per 60 s per IP (Workers Rate Limiting binding)
       5. JSON shape: an object with known fields only
       6. validation: name 1–100, e-mail ≤ 160 and well-formed, message 10–2000,
          no control characters (no line breaks in the name)
       7. honeypot empty and filled in over ≥ 2.5 s, otherwise refused (never a fake "sent")
       8. Turnstile siteverify: success AND hostname in TURNSTILE_HOSTNAMES AND
          action = TURNSTILE_ACTION
       9. Resend: from CONTACT_FROM, to CONTACT_TO, reply_to = the visitor's address,
          plain text only. With DRY_RUN=1 this step is skipped.
  ←  {ok:true} | {ok:true, dryRun:true} | {ok:false, error:"invalid"|"rejected"|"captcha"|"rate"|"server"|"origin"}
```

The browser only gets those codes, never details from Turnstile or Resend. The Worker logs
only an outcome code per request: never the message, the name, an address or a key.

## Configuration

| Name | Kind | Value |
|---|---|---|
| `ALLOWED_ORIGINS` | var | `https://akif52340416.github.io` |
| `TURNSTILE_HOSTNAMES` | var | `akif52340416.github.io` |
| `TURNSTILE_ACTION` | var | `contact` |
| `TURNSTILE_ALLOW_TEST_KEYS` | local only | `"1"` in `.dev.vars`; never in `wrangler.jsonc` |
| `CONTACT_FROM` | var | `Akif Albayrak Portfolio <onboarding@resend.dev>` |
| `DRY_RUN` | var | `"1"`: check everything, send nothing. Real sending only after approval. |
| `RATE_LIMITER` | binding | `ratelimits` in `wrangler.jsonc` |
| `TURNSTILE_SECRET_KEY` | **secret** | from the Turnstile widget |
| `RESEND_API_KEY` | **secret** | Resend API key with *Sending access* only |
| `CONTACT_TO` | **secret** | the recipient (kept out of the repository) |

Secrets are only ever set with `npx wrangler secret put <NAME>` (the value is typed into
the terminal prompt) or, for local `wrangler dev`, in `.dev.vars`, which Git ignores.
`.dev.vars.example` shows the shape with Cloudflare's public test keys.

`onboarding@resend.dev` (Resend's test sender, no own domain needed) only delivers to the
e-mail address the Resend account was created with. `CONTACT_TO` must be that address.

## Testing locally (no deploy, no e-mail)

Requirements: Node.js 20 or later. Once, in this folder: `npm ci` (installs the pinned
Wrangler from `package-lock.json` into `node_modules/`, which Git ignores).

| Command | What it does |
|---|---|
| `npm test` | Unit tests (`test/*.test.mjs`): Turnstile and Resend mocked, every other request blocked. No install needed; this is what CI runs. |
| `npm run dev` | Site on :8000 + the Worker code in a small Node server on :8787 (mocked siteverify, forced `DRY_RUN=1`, no outgoing requests). |
| `npm run dev:wrangler` | The real Worker runtime: `wrangler dev --local` on :8787, using `wrangler.jsonc` + `.dev.vars`. Local only, no remote bindings. |
| `npm run dev:site` | Only the site on :8000 (to use with `dev:wrangler`). |
| `npm run test:wrangler` | Smoke test against a running `dev:wrangler` (CORS, validation, honeypot, Turnstile, rate limit, dry run). |

### With Wrangler (the official runtime)

```sh
cp .dev.vars.example .dev.vars    # once; .dev.vars is ignored by Git
npm run dev:wrangler              # terminal 1: Worker on http://127.0.0.1:8787/contact
npm run dev:site                  # terminal 2: site on http://localhost:8000
npm run test:wrangler             # terminal 3: smoke test
```

Then open <http://localhost:8000/?contact=local#/contact>.

`.dev.vars` holds Cloudflare's public Turnstile **test** secret, so the Worker calls the real
siteverify, which answers with hostname `example.com`, no action and
`metadata.result_with_testing_key`. The Worker refuses such answers unless
`TURNSTILE_ALLOW_TEST_KEYS=1`, which is only ever set in `.dev.vars`, never in
`wrangler.jsonc`. `DRY_RUN=1` and an empty `RESEND_API_KEY` mean nothing can be sent. Even with
`DRY_RUN=0` the Worker refuses every request while the key is missing.

Other cases, by starting a second instance with `--var` (this overrides `.dev.vars`):

```sh
npx wrangler dev --local --port 8788 --var TURNSTILE_SECRET_KEY:2x0000000000000000000000000000000AA
WORKER_URL=http://127.0.0.1:8788/contact EXPECT=captcha npm run test:wrangler
```

| `--var` | A valid message gets |
|---|---|
| `TURNSTILE_SECRET_KEY:2x0000000000000000000000000000000AA` (always fails) | `captcha` |
| `TURNSTILE_SECRET_KEY:3x0000000000000000000000000000000AA` (token already spent) | `captcha` |
| `TURNSTILE_ALLOW_TEST_KEYS:0` (production behaviour) | `captcha` |
| `TURNSTILE_HOSTNAMES:akif52340416.github.io` | `captcha` |
| `DRY_RUN:0` (without a Resend key) | `server`, for every request |

Locally, `wrangler dev` takes `CF-Connecting-IP` from the request, so the smoke test gives each
check its own test address. In production Cloudflare sets that header itself. Every POST counts
towards the limit of 3 per 60 seconds, also invalid ones.

### Turnstile in the browser

The page uses Cloudflare's public test site keys:

| URL addition | Turnstile in the browser |
|---|---|
| `?contact=local` | always passes (invisible) |
| `?contact=local&ts=interactive` | shows the widget (checkbox) |
| `?contact=local&ts=fail` | always fails |

With `npm run dev`, the server-side result can be switched while it runs:

```sh
curl -X POST "http://localhost:8787/__mock?turnstile=fail"         # also: pass, wrong-host, wrong-action, testkey, down
curl -X POST "http://localhost:8787/__mock?reset=1"                # clear the rate limiter
```

Without `?contact=local` the page behaves exactly like the live site today (no Worker).

## Later: deploying (only after explicit approval)

1. `npm ci` (Wrangler is pinned in `package-lock.json`), then `npx wrangler login`.
2. Create a Turnstile widget (Cloudflare dashboard → Turnstile): mode *Managed*, hostname
   `akif52340416.github.io`.
3. `npx wrangler secret put TURNSTILE_SECRET_KEY`, `… RESEND_API_KEY`, `… CONTACT_TO`.
4. `npx wrangler deploy` with `DRY_RUN` still `"1"`; test; only then set `DRY_RUN` to `"0"`
   and deploy again.
5. In `index.html`, fill in `data-endpoint` (the Worker URL + `/contact`) and `data-sitekey`
   (the public Turnstile site key) on `#ocForm`.
