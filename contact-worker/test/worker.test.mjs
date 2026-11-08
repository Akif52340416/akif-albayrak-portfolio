// Unit tests for the contact Worker. Run: node --test test/
// No network: Turnstile and Resend are mocked and every other request throws.
import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import worker, { LIMITS } from '../src/index.js';
import { createLimiter, installFetch, DUMMY_TOKEN } from './mocks.mjs';

const ORIGIN = 'https://akif52340416.github.io';
const MESSAGE = 'Hallo Akif, dit is een testbericht met genoeg tekens.';
let state, net, logs, origLog, origErr;

function env(over = {}) {
  return Object.assign({
    ALLOWED_ORIGINS: ORIGIN + ', http://localhost:8000',
    TURNSTILE_HOSTNAMES: 'akif52340416.github.io',
    TURNSTILE_ACTION: 'contact',
    CONTACT_FROM: 'Portfolio <onboarding@resend.dev>',
    CONTACT_TO: 'owner@example.com',
    TURNSTILE_SECRET_KEY: 'test-turnstile-secret',
    RESEND_API_KEY: 'test-resend-key',
    DRY_RUN: '0',
    RATE_LIMITER: createLimiter(3, 60000)
  }, over);
}
function body(over = {}) {
  return Object.assign({ name: 'Test Persoon', email: 'test@example.com', message: MESSAGE, token: DUMMY_TOKEN, website: '', lang: 'nl', elapsed: 8000 }, over);
}
function req(data, { origin = ORIGIN, method = 'POST', path = '/contact', type = 'application/json', ip = '203.0.113.7', raw } = {}) {
  const headers = { 'CF-Connecting-IP': ip };
  if (origin) headers.Origin = origin;
  if (type) headers['Content-Type'] = type;
  const init = { method, headers };
  if (method === 'POST') init.body = raw !== undefined ? raw : JSON.stringify(data);
  return new Request('https://contact.example.workers.dev' + path, init);
}
async function call(data, opts, e) {
  const r = await worker.fetch(req(data, opts), e || env());
  const text = await r.text();
  return { status: r.status, headers: r.headers, json: text ? JSON.parse(text) : null, text };
}

beforeEach(() => {
  state = { turnstile: 'pass', resend: 'ok', hostname: 'akif52340416.github.io' };
  net = installFetch(state);
  logs = []; origLog = console.log; origErr = console.error;
  console.log = (...a) => logs.push(a.join(' ')); console.error = (...a) => logs.push(a.join(' '));
});
afterEach(() => { net.restore(); console.log = origLog; console.error = origErr; });

// ---------- happy path ----------
test('valid message is sent to Resend with a validated reply-to', async () => {
  const r = await call(body());
  assert.equal(r.status, 200);
  assert.deepEqual(r.json, { ok: true });
  assert.equal(net.calls.resend.length, 1);
  const sent = net.calls.resend[0];
  assert.equal(sent.headers.Authorization, 'Bearer test-resend-key');
  assert.deepEqual(sent.body.to, ['owner@example.com']);
  assert.equal(sent.body.from, 'Portfolio <onboarding@resend.dev>');
  assert.equal(sent.body.reply_to, 'test@example.com');
  assert.match(sent.body.subject, /Test Persoon/);
  assert.ok(sent.body.text.includes(MESSAGE));
  assert.equal(sent.body.html, undefined, 'plain text only');
  assert.equal(r.headers.get('Access-Control-Allow-Origin'), ORIGIN);
  assert.equal(r.headers.get('Cache-Control'), 'no-store');
});

test('siteverify gets the secret, the token and the visitor IP', async () => {
  await call(body());
  assert.deepEqual(net.calls.siteverify[0], { secret: 'test-turnstile-secret', response: DUMMY_TOKEN, remoteip: '203.0.113.7' });
});

test('DRY_RUN=1 checks everything but never calls Resend', async () => {
  const r = await call(body(), {}, env({ DRY_RUN: '1', RESEND_API_KEY: undefined, CONTACT_TO: undefined }));
  assert.equal(r.status, 200);
  assert.deepEqual(r.json, { ok: true, dryRun: true });
  assert.equal(net.calls.siteverify.length, 1);
  assert.equal(net.calls.resend.length, 0);
});

// ---------- validation ----------
const invalid = [
  ['empty name', { name: '   ' }, 'name'],
  ['name too long', { name: 'a'.repeat(LIMITS.name + 1) }, 'name'],
  ['line break in name (header injection)', { name: 'Eve\r\nBcc: x@y.z' }, 'name'],
  ['name not a string', { name: 42 }, 'name'],
  ['empty email', { email: '' }, 'email'],
  ['email without domain', { email: 'test@' }, 'email'],
  ['email with spaces', { email: 'a b@example.com' }, 'email'],
  ['two addresses', { email: 'a@example.com,b@example.com' }, 'email'],
  ['email too long', { email: 'a'.repeat(150) + '@example.com' }, 'email'],
  ['message too short', { message: 'kort' }, 'message'],
  ['message too long', { message: 'a'.repeat(LIMITS.message + 1) }, 'message'],
  ['control character in message', { message: 'Hallo\u0000 dit is een bericht' }, 'message']
];
for (const [label, over, field] of invalid) {
  test('invalid input: ' + label, async () => {
    const r = await call(body(over));
    assert.equal(r.status, 400);
    assert.equal(r.json.error, 'invalid');
    assert.ok(r.json.fields.includes(field), JSON.stringify(r.json));
    assert.equal(net.calls.siteverify.length, 0, 'no Turnstile call for invalid input');
    assert.equal(net.calls.resend.length, 0);
  });
}

test('a message with line breaks and accents is accepted', async () => {
  const r = await call(body({ message: 'Hoi Akif,\n\nIk zag je portfolio — erg mooi! Groet,\nRenée' }));
  assert.equal(r.status, 200);
});

test('unknown fields are refused', async () => {
  const r = await call(Object.assign(body(), { bcc: 'x@example.com' }));
  assert.equal(r.status, 400); assert.equal(r.json.error, 'invalid');
});
test('broken JSON is refused', async () => {
  const r = await call(null, { raw: '{"name":' });
  assert.equal(r.status, 400); assert.equal(r.json.error, 'invalid');
});
test('a JSON array is refused', async () => {
  const r = await call(null, { raw: '[]' });
  assert.equal(r.status, 400);
});
test('wrong content type is refused', async () => {
  const r = await call(body(), { type: 'text/plain' });
  assert.equal(r.status, 415);
});
test('a body over 10 KB is refused', async () => {
  const r = await call(null, { raw: JSON.stringify(body({ message: 'a'.repeat(11000) })) });
  assert.equal(r.status, 413);
  assert.equal(net.calls.siteverify.length, 0);
});

// ---------- spam ----------
test('honeypot filled: refused, nothing verified or sent, no fake success', async () => {
  const r = await call(body({ website: 'https://spam.example' }));
  assert.equal(r.status, 400);
  assert.equal(r.json.ok, false);
  assert.equal(r.json.error, 'rejected');
  assert.equal(net.calls.siteverify.length, 0);
  assert.equal(net.calls.resend.length, 0);
});
test('filled in faster than a person can: refused', async () => {
  const r = await call(body({ elapsed: 300 }));
  assert.equal(r.status, 400); assert.equal(r.json.error, 'rejected');
  assert.equal(net.calls.resend.length, 0);
});
test('missing fill time: refused', async () => {
  const b = body(); delete b.elapsed;
  const r = await call(b);
  assert.equal(r.json.error, 'rejected');
});

// ---------- Turnstile ----------
test('Turnstile fails: refused, nothing sent', async () => {
  state.turnstile = 'fail';
  const r = await call(body());
  assert.equal(r.status, 403); assert.equal(r.json.error, 'captcha');
  assert.equal(net.calls.resend.length, 0);
});
test('Turnstile token for another hostname: refused', async () => {
  state.turnstile = 'wrong-host';
  const r = await call(body());
  assert.equal(r.status, 403); assert.equal(r.json.error, 'captcha');
  assert.equal(net.calls.resend.length, 0);
});
test('Turnstile token for another action: refused', async () => {
  state.turnstile = 'wrong-action';
  const r = await call(body());
  assert.equal(r.status, 403); assert.equal(r.json.error, 'captcha');
});
test('answer to a Cloudflare test key: refused by default (production safety)', async () => {
  state.turnstile = 'testkey';
  const r = await call(body(), {}, env({ TURNSTILE_HOSTNAMES: 'example.com' }));
  assert.equal(r.status, 403); assert.equal(r.json.error, 'captcha');
  assert.equal(net.calls.resend.length, 0);
});
test('answer to a test key: accepted only with TURNSTILE_ALLOW_TEST_KEYS=1 and a listed hostname', async () => {
  state.turnstile = 'testkey';
  const ok = await call(body(), {}, env({ TURNSTILE_ALLOW_TEST_KEYS: '1', TURNSTILE_HOSTNAMES: 'example.com', DRY_RUN: '1' }));
  assert.equal(ok.status, 200); assert.equal(ok.json.dryRun, true);
  const host = await call(body(), {}, env({ TURNSTILE_ALLOW_TEST_KEYS: '1', TURNSTILE_HOSTNAMES: 'localhost', DRY_RUN: '1' }));
  assert.equal(host.status, 403, 'hostname is still checked');
});
test('TURNSTILE_ALLOW_TEST_KEYS does not relax the action for real answers', async () => {
  state.turnstile = 'wrong-action';
  const r = await call(body(), {}, env({ TURNSTILE_ALLOW_TEST_KEYS: '1' }));
  assert.equal(r.status, 403); assert.equal(r.json.error, 'captcha');
});
test('missing token: refused without calling siteverify', async () => {
  const r = await call(body({ token: '' }));
  assert.equal(r.status, 403); assert.equal(r.json.error, 'captcha');
  assert.equal(net.calls.siteverify.length, 0);
});
test('Turnstile unreachable: generic server error', async () => {
  state.turnstile = 'down';
  const r = await call(body());
  assert.equal(r.status, 502); assert.equal(r.json.error, 'server');
  assert.equal(net.calls.resend.length, 0);
});

// ---------- double submission ----------
test('the same token twice: the second one is refused, one e-mail only', async () => {
  const e = env();
  const a = await call(body(), {}, e);
  const b = await call(body(), {}, e);
  assert.equal(a.status, 200);
  assert.equal(b.status, 403); assert.equal(b.json.error, 'captcha');
  assert.equal(net.calls.resend.length, 1);
});

// ---------- rate limiting ----------
test('the 4th request within a minute from one IP is limited', async () => {
  const e = env();
  for (let i = 0; i < 3; i++) await call(body({ token: 'x' + i }), {}, e);
  const r = await call(body(), {}, e);
  assert.equal(r.status, 429); assert.equal(r.json.error, 'rate');
  assert.equal(r.headers.get('Retry-After'), '60');
  assert.equal(r.headers.get('Access-Control-Allow-Origin'), ORIGIN, 'the page can read the error');
  const other = await call(body(), { ip: '198.51.100.9' }, e);
  assert.equal(other.status, 200, 'another IP is not affected');
});

// ---------- CORS / routing ----------
test('preflight from an allowed origin', async () => {
  const r = await call(null, { method: 'OPTIONS' });
  assert.equal(r.status, 204);
  assert.equal(r.headers.get('Access-Control-Allow-Origin'), ORIGIN);
  assert.equal(r.headers.get('Access-Control-Allow-Methods'), 'POST, OPTIONS');
  assert.equal(r.headers.get('Access-Control-Allow-Headers'), 'Content-Type');
  assert.equal(r.headers.get('Vary'), 'Origin');
});
test('preflight from another origin is refused', async () => {
  const r = await call(null, { method: 'OPTIONS', origin: 'https://evil.example' });
  assert.equal(r.status, 403);
  assert.equal(r.headers.get('Access-Control-Allow-Origin'), null);
});
test('POST from another origin: refused before anything else', async () => {
  const r = await call(body(), { origin: 'https://akif52340416.github.io.evil.example' });
  assert.equal(r.status, 403); assert.equal(r.json.error, 'origin');
  assert.equal(r.headers.get('Access-Control-Allow-Origin'), null);
  assert.equal(net.calls.siteverify.length, 0);
});
test('POST without Origin (e.g. curl) is refused', async () => {
  const r = await call(body(), { origin: null });
  assert.equal(r.status, 403);
});
test('http instead of https is another origin', async () => {
  const r = await call(body(), { origin: 'http://akif52340416.github.io' });
  assert.equal(r.status, 403);
});
test('GET is not allowed', async () => {
  const r = await call(null, { method: 'GET' });
  assert.equal(r.status, 405);
  assert.equal(r.headers.get('Allow'), 'POST, OPTIONS');
});
test('other paths are 404', async () => {
  const r = await call(body(), { path: '/' });
  assert.equal(r.status, 404);
});

// ---------- safe errors and configuration ----------
test('Resend error: generic message, no details leaked', async () => {
  state.resend = 'error';
  const r = await call(body());
  assert.equal(r.status, 502);
  assert.deepEqual(r.json, { ok: false, error: 'server' });
  assert.ok(!r.text.includes('boom') && !r.text.includes('re_secret'));
});
test('missing recipient while sending for real: server error, nothing sent', async () => {
  const r = await call(body(), {}, env({ CONTACT_TO: '' }));
  assert.equal(r.status, 500); assert.equal(r.json.error, 'server');
  assert.equal(net.calls.siteverify.length, 0);
  assert.equal(net.calls.resend.length, 0);
});
test('missing rate limiter: server error (fails closed)', async () => {
  const r = await call(body(), {}, env({ RATE_LIMITER: undefined }));
  assert.equal(r.status, 500);
});

test('logs never contain the message, the address, the name or a key', async () => {
  await call(body());
  state.resend = 'error';
  await call(body({ token: 'other' }));
  await call(body({ email: 'broken@' }));
  const all = logs.join('\n');
  assert.ok(logs.length >= 3);
  for (const secret of [MESSAGE, 'test@example.com', 'Test Persoon', 'test-resend-key', 'test-turnstile-secret', 'owner@example.com', DUMMY_TOKEN]) {
    assert.ok(!all.includes(secret), 'log leaks: ' + secret);
  }
});

test('the mock blocks every real outgoing request', async () => {
  await assert.rejects(() => fetch('https://example.com/'), /Blocked outgoing request/);
});
