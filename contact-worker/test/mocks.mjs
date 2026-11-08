// Test doubles shared by the unit tests and the local dev server.
// installFetch() replaces the global fetch: Turnstile and Resend are answered
// here, and ANY other request throws. So nothing ever leaves this machine and
// no real e-mail can be sent, whatever the configuration says.

export const DUMMY_TOKEN = 'XXXX.DUMMY.TOKEN.XXXX';

// in-memory stand-in for the Workers Rate Limiting binding
export function createLimiter(limit = 3, periodMs = 60000) {
  const hits = new Map();
  return {
    async limit({ key }) {
      const now = Date.now();
      const h = (hits.get(key) || []).filter((t) => now - t < periodMs);
      if (h.length >= limit) { hits.set(key, h); return { success: false }; }
      h.push(now); hits.set(key, h);
      return { success: true };
    },
    reset() { hits.clear(); }
  };
}

// state.turnstile: 'pass' | 'fail' | 'wrong-host' | 'wrong-action' | 'down'
// state.resend:    'ok' | 'error'
export function installFetch(state) {
  const calls = { siteverify: [], resend: [] };
  const used = new Set();
  const original = globalThis.fetch;
  globalThis.fetch = async (input, init = {}) => {
    const url = typeof input === 'string' ? input : input.url;
    if (url === 'https://challenges.cloudflare.com/turnstile/v0/siteverify') {
      const form = new URLSearchParams(init.body);
      calls.siteverify.push(Object.fromEntries(form));
      if (state.turnstile === 'down') return new Response('unavailable', { status: 503 });
      const token = form.get('response');
      // Cloudflare's test site key always hands out the same dummy token, so
      // the dev server allows repeats (state.allowRepeat); the unit tests don't
      const dup = !state.allowRepeat && used.has(token); used.add(token);
      const pass = state.turnstile !== 'fail' && token === DUMMY_TOKEN && !dup;
      // 'testkey': the exact shape Cloudflare returns for its test secret
      // 1x0000000000000000000000000000000AA (checked against siteverify)
      if (state.turnstile === 'testkey') {
        return Response.json({ success: true, 'error-codes': [], hostname: 'example.com', metadata: { result_with_testing_key: true } });
      }
      return Response.json({
        success: pass,
        'error-codes': pass ? [] : [dup ? 'timeout-or-duplicate' : 'invalid-input-response'],
        hostname: state.turnstile === 'wrong-host' ? 'evil.example' : (state.hostname || 'localhost'),
        action: state.turnstile === 'wrong-action' ? 'login' : 'contact'
      });
    }
    if (url === 'https://api.resend.com/emails') {
      calls.resend.push({ headers: init.headers, body: JSON.parse(init.body) });
      if (state.resend === 'error') return Response.json({ name: 'internal', message: 'boom, key re_secret in here' }, { status: 500 });
      return Response.json({ id: 'mock-id' });
    }
    throw new Error('Blocked outgoing request in test/dev: ' + url);
  };
  return { calls, used, restore() { globalThis.fetch = original; } };
}
