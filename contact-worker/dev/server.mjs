// Local test environment: no Cloudflare account, no deploy, no e-mail.
//
//   node contact-worker/dev/server.mjs
//   → site:   http://localhost:8000/?contact=local#/contact
//   → Worker: http://localhost:8787/contact
//
// The Worker code runs unchanged. Around it:
//   - DRY_RUN is forced to "1": Resend is never called;
//   - the global fetch is replaced (test/mocks.mjs): siteverify is answered
//     locally and every other outgoing request is blocked;
//   - the rate limiter is the in-memory stand-in (3 per minute per IP).
// The Turnstile widget itself is Cloudflare's real script with the public
// test site key, so the browser part is real; its dummy token is what the
// local siteverify accepts.
//
// Switch the simulated Turnstile result while it runs (for testing):
//   POST http://localhost:8787/__mock?turnstile=pass|fail|wrong-host|wrong-action|down
//   POST http://localhost:8787/__mock?reset=1      (clears the rate limiter)
//
// With --site-only (npm run dev:site) it only serves the site, so the real
// Worker can run under `wrangler dev` on :8787 instead (npm run dev:wrangler).
import { createServer } from 'node:http';
import { createReadStream, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import worker from '../src/index.js';
import { createLimiter, installFetch } from '../test/mocks.mjs';

const SITE_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const SITE_PORT = +(process.env.SITE_PORT || 8000);
const WORKER_PORT = +(process.env.WORKER_PORT || 8787);

const SITE_ONLY = process.argv.includes('--site-only');
const state = { turnstile: process.env.TURNSTILE || 'pass', resend: 'ok', hostname: 'localhost', allowRepeat: true };
const net = SITE_ONLY ? null : installFetch(state);
const limiter = createLimiter(3, 60000);
const env = {
  ALLOWED_ORIGINS: `http://localhost:${SITE_PORT},http://127.0.0.1:${SITE_PORT}`,
  TURNSTILE_HOSTNAMES: 'localhost,127.0.0.1',
  TURNSTILE_ACTION: 'contact',
  CONTACT_FROM: 'Portfolio (dev) <onboarding@resend.dev>',
  CONTACT_TO: 'nobody@example.invalid',
  TURNSTILE_SECRET_KEY: '1x0000000000000000000000000000000AA',
  DRY_RUN: '1',                       // forced: this server never sends e-mail
  RATE_LIMITER: limiter
};

// ---- the Worker ----
if (!SITE_ONLY) createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${WORKER_PORT}`);
  if (url.pathname === '/__mock' && req.method === 'POST') {
    if (url.searchParams.has('turnstile')) state.turnstile = url.searchParams.get('turnstile');
    if (url.searchParams.has('reset')) limiter.reset();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ turnstile: state.turnstile, siteverify: net.calls.siteverify.length, resend: net.calls.resend.length }));
  }
  const chunks = [];
  for await (const c of req) chunks.push(c);
  const headers = new Headers();
  for (const [k, v] of Object.entries(req.headers)) if (typeof v === 'string') headers.set(k, v);
  headers.set('CF-Connecting-IP', req.socket.remoteAddress || '');
  const request = new Request(url, {
    method: req.method, headers,
    body: ['GET', 'HEAD', 'OPTIONS'].includes(req.method) ? undefined : Buffer.concat(chunks)
  });
  const r = await worker.fetch(request, env);
  res.writeHead(r.status, Object.fromEntries(r.headers));
  res.end(Buffer.from(await r.arrayBuffer()));
  console.log(`[worker] ${req.method} ${url.pathname} → ${r.status}`);
}).listen(WORKER_PORT, '127.0.0.1');

// ---- the site (read-only static files from the repository root) ----
const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.jpg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.woff2': 'font/woff2' };
createServer((req, res) => {
  let rel = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (rel === '/') rel = '/index.html';
  const file = path.resolve(SITE_ROOT, '.' + rel);
  const ok = file.startsWith(SITE_ROOT + path.sep) && !/[\\/](\.|contact-worker[\\/]|node_modules)/.test(file.slice(SITE_ROOT.length));
  let st; try { st = ok && statSync(file); } catch {}
  if (req.method !== 'GET' || !st || !st.isFile()) { res.writeHead(404); return res.end('404'); }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
  createReadStream(file).pipe(res);
}).listen(SITE_PORT, '127.0.0.1');

console.log(`Site:   http://localhost:${SITE_PORT}/?contact=local#/contact`);
console.log(SITE_ONLY
  ? `Worker: not started here; run \`npm run dev:wrangler\` for http://localhost:${WORKER_PORT}/contact`
  : `Worker: http://localhost:${WORKER_PORT}/contact  (DRY_RUN, Turnstile mock: ${state.turnstile}, no outgoing requests)`);
