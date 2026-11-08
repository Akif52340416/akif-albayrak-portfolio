// Smoke test against the Worker running under `wrangler dev` (npm run dev:wrangler),
// with the settings from .dev.vars.example: Turnstile TEST secret, DRY_RUN=1, no Resend key.
//   npm run test:wrangler            (default http://127.0.0.1:8787/contact)
//   WORKER_URL=… EXPECT=captcha npm run test:wrangler   (for a Worker started with a failing test secret)
// The Worker itself calls Cloudflare's real siteverify with the test secret; nothing is sent
// anywhere else, and with DRY_RUN=1 Resend is never called.
const URL_ = process.env.WORKER_URL || 'http://127.0.0.1:8787/contact';
const EXPECT = process.env.EXPECT || 'dryRun';   // what a valid message should get: dryRun | captcha | server
const ORIGIN = 'http://localhost:8000';
const DUMMY = 'XXXX.DUMMY.TOKEN.XXXX';
// Every POST counts towards the rate limit (3 per 60 s per IP), also invalid ones.
// Locally, wrangler dev takes CF-Connecting-IP from the request (in production Cloudflare
// sets it), so each group of checks gets its own random test address.
const NET = '10.' + Math.floor(Math.random() * 250) + '.' + Math.floor(Math.random() * 250) + '.';
let ipN = 0;
const freshIp = () => NET + (++ipN);
let failed = 0;
function check(name, ok, info) {
  console.log((ok ? 'PASS ' : 'FAIL ') + name + (ok ? '' : '  → ' + JSON.stringify(info)));
  if (!ok) failed++;
}
const body = (over = {}) => JSON.stringify(Object.assign({ name: 'Test Persoon', email: 'test@example.com', message: 'Hallo Akif, dit is een wrangler-test.', token: DUMMY, website: '', lang: 'nl', elapsed: 8000 }, over));
async function post(data, { origin = ORIGIN, type = 'application/json', method = 'POST', ip = freshIp() } = {}) {
  const headers = { 'CF-Connecting-IP': ip };
  if (origin) headers.Origin = origin;
  if (type) headers['Content-Type'] = type;
  const r = await fetch(URL_, { method, headers, body: method === 'POST' ? data : undefined });
  const t = await r.text();
  let j = null; try { j = JSON.parse(t); } catch {}
  return { status: r.status, json: j, h: r.headers };
}

// CORS and routing
let r = await post(null, { method: 'OPTIONS' });
check('preflight from the local site: 204 + CORS headers', r.status === 204 && r.h.get('access-control-allow-origin') === ORIGIN, r.status);
r = await post(null, { method: 'OPTIONS', origin: 'https://evil.example' });
check('preflight from another origin: 403, no CORS header', r.status === 403 && !r.h.get('access-control-allow-origin'), r.status);
r = await post(body(), { origin: null });
check('POST without Origin: 403', r.status === 403, r);
r = await post(body(), { origin: 'https://evil.example' });
check('POST from another origin: 403', r.status === 403 && r.json?.error === 'origin', r.json);
r = await post(body(), { type: 'text/plain' });
check('wrong content type: 415', r.status === 415, r.status);
r = await fetch(URL_.replace(/\/contact$/, '/'), { method: 'POST', headers: { Origin: ORIGIN, 'Content-Type': 'application/json', 'CF-Connecting-IP': freshIp() }, body: body() });
check('other path: 404', r.status === 404, r.status);

// validation, honeypot, fill time (these never reach Turnstile)
r = await post(body({ email: 'geen-adres' }));
check('invalid e-mail: 400 invalid [email]', r.status === 400 && r.json?.fields?.includes('email'), r.json);
r = await post(body({ name: 'Eve\r\nBcc: x@y.z' }));
check('line break in name: 400 invalid [name]', r.status === 400 && r.json?.fields?.includes('name'), r.json);
r = await post(body({ message: 'kort' }));
check('message too short: 400 invalid [message]', r.status === 400 && r.json?.fields?.includes('message'), r.json);
r = await post(body({ bcc: 'x@example.com' }));
check('unknown field: 400', r.status === 400, r.json);

// the valid message: real siteverify with Cloudflare's test secret
r = await post(body());
const ok = EXPECT === 'dryRun' ? r.status === 200 && r.json?.ok === true && r.json?.dryRun === true
  : r.status === (EXPECT === 'captcha' ? 403 : 500) && r.json?.error === EXPECT;
check(`valid message → ${EXPECT}`, ok, { status: r.status, json: r.json });
check('a non-dry-run "ok" never appears', !(r.json?.ok === true && r.json?.dryRun !== true), r.json);

r = await post(body({ website: 'https://spam.example' }));
check('honeypot filled: 400 rejected (never "ok")', r.status === 400 && r.json?.error === 'rejected', r.json);
r = await post(body({ elapsed: 200 }));
check('filled in too fast: 400 rejected', r.status === 400 && r.json?.error === 'rejected', r.json);
// rate limit: three requests from one address pass the limiter, the fourth is refused,
// and another address is not affected
const one = freshIp(), seen = [];
for (let i = 0; i < 4; i++) seen.push((await post(body({ email: 'x' }), { ip: one })).status);
check('rate limit: 3 × 400 (invalid but counted), then 429', seen.join() === '400,400,400,429', seen);
r = await post(body({ email: 'x' }), { ip: one });
check('rate limit: 429 has error "rate" + Retry-After 60', r.status === 429 && r.json?.error === 'rate' && r.h.get('retry-after') === '60', { status: r.status, json: r.json });
r = await post(body({ email: 'x' }));
check('rate limit: another address is not affected', r.status === 400, r.status);

console.log(failed ? `\n${failed} failed` : '\nall passed');
process.exit(failed ? 1 : 0);
