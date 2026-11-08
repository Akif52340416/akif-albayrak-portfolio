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

## Testing locally (no Cloudflare account, no e-mail)

```sh
cd contact-worker
npm test        # unit tests: Turnstile and Resend mocked, all other network blocked
npm run dev     # site on http://localhost:8000, Worker on http://localhost:8787
```

Then open <http://localhost:8000/?contact=local#/contact>. The dev server runs the Worker
code unchanged, forces `DRY_RUN=1`, blocks every outgoing request and answers siteverify
locally. The page uses Cloudflare's public Turnstile test site keys:

| URL addition | Turnstile in the browser |
|---|---|
| `?contact=local` | always passes (invisible) |
| `?contact=local&ts=interactive` | shows the widget (checkbox) |
| `?contact=local&ts=fail` | always fails |

Server-side results can be switched while it runs:

```sh
curl -X POST "http://localhost:8787/__mock?turnstile=fail"         # also: pass, wrong-host, wrong-action, down
curl -X POST "http://localhost:8787/__mock?reset=1"                # clear the rate limiter
```

Without `?contact=local` the page behaves exactly like the live site today (no Worker).

## Later: deploying (only after explicit approval)

1. `npm install --save-dev wrangler@4` (rate limiting needs Wrangler 4.36 or later), then
   `npx wrangler login`.
2. Create a Turnstile widget (Cloudflare dashboard → Turnstile): mode *Managed*, hostname
   `akif52340416.github.io`.
3. `npx wrangler secret put TURNSTILE_SECRET_KEY`, `… RESEND_API_KEY`, `… CONTACT_TO`.
4. `npx wrangler deploy` with `DRY_RUN` still `"1"`; test; only then set `DRY_RUN` to `"0"`
   and deploy again.
5. In `index.html`, fill in `data-endpoint` (the Worker URL + `/contact`) and `data-sitekey`
   (the public Turnstile site key) on `#ocForm`.
