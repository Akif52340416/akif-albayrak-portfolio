// Contact Worker for the portfolio: receives the contact form, checks it and
// passes it on to Resend as a plain-text e-mail.
//
// Order of checks (cheapest first, nothing is sent before all of them pass):
//   route + method → CORS origin → content type + size → rate limit →
//   JSON shape → field validation → honeypot + fill time → Turnstile
//   (success, hostname, action) → Resend (or dry run).
//
// The browser only ever gets a short error code, never details from Turnstile
// or Resend. Nothing that a visitor typed is logged, and neither are keys.
//
// Configuration (wrangler.jsonc "vars", or secrets for the sensitive ones):
//   ALLOWED_ORIGINS       comma-separated exact origins, e.g. https://akif52340416.github.io
//   TURNSTILE_HOSTNAMES   comma-separated hostnames Turnstile must report
//   TURNSTILE_ACTION      the action the widget is rendered with ("contact")
//   TURNSTILE_ALLOW_TEST_KEYS  "1" only in a local .dev.vars: accept answers to
//                         Cloudflare's test keys (no action, hostname example.com)
//   CONTACT_FROM          sender, e.g. "Portfolio <onboarding@resend.dev>"
//   CONTACT_TO            recipient (set as a secret, so it stays out of the repo)
//   DRY_RUN               "1" = check everything but never call Resend
//   TURNSTILE_SECRET_KEY  secret
//   RESEND_API_KEY        secret (only needed when DRY_RUN is not "1")
//   RATE_LIMITER          Workers Rate Limiting binding

export const LIMITS = Object.freeze({
  body: 10 * 1024,     // bytes
  name: 100,
  email: 160,
  messageMin: 10,
  message: 2000,
  token: 2048,
  minFillMs: 2500      // faster than this is not a person typing
});

const FIELDS = new Set(['name', 'email', 'message', 'token', 'website', 'lang', 'elapsed']);
const EMAIL_RE = /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[^\s@<>()[\]\\,;:".]{2,}$/;
// control characters; the message may keep tab and line breaks
const CTRL_ANY = new RegExp('[\x00-\x1F\x7F-\x9F' + String.fromCharCode(0x2028, 0x2029) + ']');
const CTRL_MSG = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/;

const SITEVERIFY = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
const RESEND = 'https://api.resend.com/emails';

function list(v) {
  return String(v || '').split(',').map((s) => s.trim()).filter(Boolean);
}

function log(outcome) {
  // only the outcome code: no addresses, no content, no keys
  console.log(JSON.stringify({ event: 'contact', outcome }));
}

function reply(status, body, origin, extra) {
  const headers = {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    'Vary': 'Origin'
  };
  if (origin) {
    headers['Access-Control-Allow-Origin'] = origin;
    headers['Access-Control-Allow-Methods'] = 'POST, OPTIONS';
    headers['Access-Control-Allow-Headers'] = 'Content-Type';
    headers['Access-Control-Max-Age'] = '600';
  }
  return new Response(body === null ? null : JSON.stringify(body), { status, headers: Object.assign(headers, extra || {}) });
}

function fail(status, error, origin, extra, more) {
  log(error);
  return reply(status, Object.assign({ ok: false, error }, more || {}), origin, extra);
}

// the same rules as the form in the browser, plus control characters
export function validate(data) {
  const bad = [];
  const name = typeof data.name === 'string' ? data.name.trim() : null;
  const email = typeof data.email === 'string' ? data.email.trim() : null;
  const message = typeof data.message === 'string' ? data.message.trim() : null;
  if (!name || name.length > LIMITS.name || CTRL_ANY.test(name)) bad.push('name');
  if (!email || email.length > LIMITS.email || !EMAIL_RE.test(email)) bad.push('email');
  if (!message || message.length < LIMITS.messageMin || message.length > LIMITS.message || CTRL_MSG.test(message)) bad.push('message');
  return { bad, name, email, message };
}

async function verifyTurnstile(token, ip, env) {
  const form = new URLSearchParams();
  form.set('secret', env.TURNSTILE_SECRET_KEY);
  form.set('response', token);
  if (ip) form.set('remoteip', ip);
  const r = await fetch(SITEVERIFY, { method: 'POST', body: form, signal: AbortSignal.timeout(8000) });
  if (!r.ok) throw new Error('siteverify ' + r.status);
  const d = await r.json();
  const hosts = list(env.TURNSTILE_HOSTNAMES);
  // Cloudflare's test keys answer with hostname "example.com", no action and
  // metadata.result_with_testing_key. Such an answer is refused unless local
  // development explicitly allows it (never set in wrangler.jsonc), so a test
  // key that ends up configured in production can never let anything through.
  const testKey = !!(d.metadata && d.metadata.result_with_testing_key === true);
  if (testKey && env.TURNSTILE_ALLOW_TEST_KEYS !== '1') return false;
  const action = env.TURNSTILE_ACTION || 'contact';
  return d.success === true &&
    hosts.includes(d.hostname) &&
    (d.action === action || (testKey && d.action === undefined));
}

async function sendMail(v, lang, env) {
  const subject = 'Portfolio: bericht van ' + v.name.replace(/\s+/g, ' ').slice(0, LIMITS.name);
  const text = [
    'Nieuw bericht via het contactformulier van je portfolio.',
    '',
    'Naam:   ' + v.name,
    'E-mail: ' + v.email,
    'Taal:   ' + (lang === 'en' ? 'Engels' : 'Nederlands'),
    '',
    '--- bericht ---',
    v.message,
    '--- einde ---',
    '',
    'Antwoorden kan direct: dit bericht heeft het adres van de afzender als reply-to.'
  ].join('\n');
  const r = await fetch(RESEND, {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + env.RESEND_API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: env.CONTACT_FROM, to: [env.CONTACT_TO], reply_to: v.email, subject, text }),
    signal: AbortSignal.timeout(10000)
  });
  if (!r.ok) throw new Error('resend ' + r.status);
}

export async function handle(request, env) {
  const url = new URL(request.url);
  const reqOrigin = request.headers.get('Origin');
  const allowed = list(env.ALLOWED_ORIGINS);
  const origin = reqOrigin && allowed.includes(reqOrigin) ? reqOrigin : null;

  if (url.pathname !== '/contact') return fail(404, 'not_found', origin);

  if (request.method === 'OPTIONS') {
    if (!origin) return fail(403, 'origin', null);
    return reply(204, null, origin);
  }
  if (request.method !== 'POST') return fail(405, 'method', origin, { 'Allow': 'POST, OPTIONS' });
  // browsers always send Origin on this request; without an allowed one, stop
  if (!origin) return fail(403, 'origin', null);

  const type = (request.headers.get('Content-Type') || '').toLowerCase();
  if (!type.startsWith('application/json')) return fail(415, 'invalid', origin);
  const declared = Number(request.headers.get('Content-Length') || 0);
  if (declared > LIMITS.body) return fail(413, 'invalid', origin);

  // configuration: never half-run a misconfigured Worker
  const dryRun = env.DRY_RUN === '1';
  if (!env.RATE_LIMITER || !env.TURNSTILE_SECRET_KEY || !list(env.TURNSTILE_HOSTNAMES).length ||
      (!dryRun && (!env.RESEND_API_KEY || !env.CONTACT_TO || !env.CONTACT_FROM))) {
    return fail(500, 'server', origin);
  }

  const ip = request.headers.get('CF-Connecting-IP') || '';
  const { success } = await env.RATE_LIMITER.limit({ key: ip || 'unknown' });
  if (!success) return fail(429, 'rate', origin, { 'Retry-After': '60' });

  let raw;
  try { raw = await request.text(); } catch { return fail(400, 'invalid', origin); }
  if (new TextEncoder().encode(raw).length > LIMITS.body) return fail(413, 'invalid', origin);

  let data;
  try { data = JSON.parse(raw); } catch { return fail(400, 'invalid', origin); }
  if (!data || typeof data !== 'object' || Array.isArray(data)) return fail(400, 'invalid', origin);
  for (const k of Object.keys(data)) if (!FIELDS.has(k)) return fail(400, 'invalid', origin);

  const v = validate(data);
  if (v.bad.length) return fail(400, 'invalid', origin, null, { fields: v.bad });

  // honeypot and fill time: only bots get here. They get a plain refusal,
  // never a fake "sent", so no person is ever told something untrue.
  if (data.website !== undefined && data.website !== '') return fail(400, 'rejected', origin);
  const elapsed = Number(data.elapsed);
  if (!Number.isFinite(elapsed) || elapsed < LIMITS.minFillMs) return fail(400, 'rejected', origin);

  const token = data.token;
  if (typeof token !== 'string' || !token || token.length > LIMITS.token) return fail(403, 'captcha', origin);
  let human;
  try { human = await verifyTurnstile(token, ip, env); } catch { return fail(502, 'server', origin); }
  if (!human) return fail(403, 'captcha', origin);

  if (dryRun) {
    log('dry_run');
    return reply(200, { ok: true, dryRun: true }, origin);
  }
  try { await sendMail(v, data.lang, env); } catch { return fail(502, 'server', origin); }
  log('sent');
  return reply(200, { ok: true }, origin);
}

export default {
  async fetch(request, env) {
    try {
      return await handle(request, env);
    } catch {
      log('server');
      return reply(500, { ok: false, error: 'server' }, null);
    }
  }
};
