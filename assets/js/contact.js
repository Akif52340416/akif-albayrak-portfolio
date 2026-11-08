(function () {
  "use strict";
  // /contact — OPEN CHANNEL: NL / EN (the same remembered "akif-lang"
  // choice; the NL · EN link switches it while this page is open), the
  // three questions (active / done states, validation, the honest "not
  // connected yet" state), the message composition that mirrors them, the
  // channel line, copying the e-mail address, the local time and the
  // reveals.
  // Sending: only when the form has a Worker endpoint and a Turnstile site
  // key (data-endpoint / data-sitekey). Without them (the default) the form
  // is NOT sent anywhere: a valid submit only explains that, and offers two
  // things that really happen: the message opened in the visitor's own mail
  // program (a filled-in mailto:) or copied. With them, "sent" is only said
  // when the Worker confirms it; any failure keeps the text and offers the
  // same two ways. A tick only ever marks a copy the clipboard confirmed.
  var view = document.getElementById('contactView');
  if (!view) return;
  var form = document.getElementById('ocForm');
  var status = document.getElementById('ocStatusMsg');
  var MAIL = 'Akif.Albayrak12@hotmail.com';

  // ---- where to send. Local testing (contact-worker/dev/server.mjs):
  // http://localhost:8000/?contact=local#/contact, with Cloudflare's public
  // Turnstile test keys (&ts=fail: always blocked, &ts=interactive: shows
  // the widget). Never anything secret here: the site key is public ----
  var LIVE = (function () {
    var ep = form.getAttribute('data-endpoint') || '';
    var key = form.getAttribute('data-sitekey') || '';
    var h = window.location.hostname, q = window.location.search;
    if ((h === 'localhost' || h === '127.0.0.1') && /[?&]contact=local\b/.test(q)) {
      ep = 'http://localhost:8787/contact';
      key = /[?&]ts=fail\b/.test(q) ? '2x00000000000000000000AB' : /[?&]ts=interactive\b/.test(q) ? '3x00000000000000000000FF' : '1x00000000000000000000AA';
    }
    if (!/^https:\/\//.test(ep) && ep !== 'http://localhost:8787/contact') return null;
    if (!key || !window.fetch || !window.Promise || !window.AbortController) return null;
    return { endpoint: ep, sitekey: key };
  })();

  var EN = {
    ocTag: 'Open channel',
    ocPlace: 'The Netherlands',
    ocL1: "Let's make",
    ocL2: 'contact',
    ocStatusA: 'Channel open',
    ocStatusB: 'Your message, by your own email',
    ocIntro: 'Have an idea, a project, or just want to connect? Feel free to send me a message.',
    ocDirect: 'Rather get in touch directly?',
    ocCopy: 'Copy',
    ocNewTab: ' (opens in a new tab)',
    ocFormTitle: 'Write your message',
    ocQ1: 'Who are you?',
    ocQ2: 'Where can I reach you?',
    ocQ3: "What's on your mind?",
    ocPh1: 'Your name',
    ocPh2: 'name@example.com',
    ocPh3: 'An idea, a question or just hello.',
    ocTo: 'To',
    ocFrom: 'From',
    ocReply: 'Reply to',
    ocHi: 'Hi Akif,',
    ocSign: 'Best,',
    ocDraft: 'Draft · you send it yourself by email',
    ocSend: 'Prepare message',
    ocPending: "This form doesn't send anything itself. Afterwards you open your message in your own email app, or copy it.",
    ocEnd: 'The channel stays open',
    ocMailIt: 'Open in your mail app',
    ocCopyMsg: 'Copy your message',
    // with a Worker
    ocStatusBLive: 'Your message, straight to my inbox',
    ocDraftLive: 'Draft · sent through this form',
    ocSendLive: 'Send message',
    ocPendingLive: 'Your message goes straight to my inbox. I only use your details to reply; this website stores nothing. Cloudflare Turnstile checks for spam.'
  };
  var NL_LIVE = {
    ocStatusB: 'Je bericht rechtstreeks in mijn inbox',
    ocDraft: 'Concept · wordt verstuurd via dit formulier',
    ocSend: 'Verstuur bericht',
    ocPending: 'Je bericht komt rechtstreeks in mijn inbox. Ik gebruik je gegevens alleen om te antwoorden; deze website bewaart niets. Cloudflare Turnstile controleert op spam.'
  };
  var Q = {
    nl: ['Wie ben je?', 'Waar kan ik je bereiken?', 'Wat wil je kwijt?'],
    en: [EN.ocQ1, EN.ocQ2, EN.ocQ3]
  };
  var MSG = {
    nl: {
      empty: 'Je bericht verschijnt hier terwijl je typt.',
      nameMissing: 'Vul je naam in.',
      emailMissing: 'Vul je e-mailadres in.',
      emailInvalid: 'Dit e-mailadres lijkt niet te kloppen. Controleer het even (bijvoorbeeld naam@voorbeeld.nl).',
      msgMissing: 'Schrijf een kort bericht.',
      msgShort: 'Je bericht is nog wat kort. Schrijf minimaal 10 tekens.',
      notSent: '<strong>Je bericht staat klaar.</strong> Dit formulier verstuurt zelf niets: open je bericht hieronder in je eigen e-mailprogramma of kopieer het. Mailen kan ook direct naar <a href="mailto:' + MAIL + '">' + MAIL + '</a>.',
      copied: 'Gekopieerd',
      copiedSr: 'E-mailadres gekopieerd.',
      copyFail: 'Kopiëren lukte niet. Selecteer het e-mailadres en kopieer het zelf.',
      copyFailLabel: 'Niet gelukt',
      msgCopied: 'Bericht gekopieerd',
      msgCopiedSr: 'Je bericht is gekopieerd.',
      msgCopyFail: 'Kopiëren lukte niet. Selecteer je tekst in het berichtveld en kopieer hem zelf.',
      subject: 'Bericht via je portfolio',
      // with a Worker
      nameInvalid: 'Controleer je naam: maximaal 100 tekens, zonder regelafbreking.',
      msgInvalid: 'Controleer je bericht: 10 tot 2000 tekens.',
      sendingBtn: 'Versturen…',
      sending: 'Je bericht wordt verstuurd…',
      sent: '<strong>Bedankt, je bericht is verstuurd.</strong> Ik lees het zelf en reageer zo snel mogelijk op het e-mailadres dat je hebt opgegeven.',
      dryRun: '<strong>Testmodus: je bericht is niet verstuurd.</strong> Alles is gecontroleerd, maar deze testomgeving verstuurt nooit e-mail.',
      errInvalid: '<strong>Je bericht is niet verstuurd.</strong> Controleer de gemarkeerde velden en probeer het opnieuw.',
      errCaptcha: '<strong>Je bericht is niet verstuurd.</strong> De spamcontrole is niet gelukt. Probeer het opnieuw, of open of kopieer je bericht hieronder.',
      errCaptchaLoad: '<strong>Je bericht is niet verstuurd.</strong> De spamcontrole kon niet laden (bijvoorbeeld door een adblocker). Open of kopieer je bericht hieronder, of mail naar <a href="mailto:' + MAIL + '">' + MAIL + '</a>.',
      errRate: '<strong>Je bericht is niet verstuurd.</strong> Er zijn net al een paar berichten verstuurd. Wacht een minuut en probeer het opnieuw, of open of kopieer je bericht hieronder.',
      errServer: '<strong>Je bericht is niet verstuurd.</strong> Er ging iets mis bij het versturen, of er is geen verbinding. Je tekst staat er nog: probeer het later opnieuw, of open of kopieer je bericht hieronder.'
    },
    en: {
      empty: 'Your message appears here as you type.',
      nameMissing: 'Please enter your name.',
      emailMissing: 'Please enter your email address.',
      emailInvalid: "This email address doesn't look right. Please check it (for example name@example.com).",
      msgMissing: 'Please write a short message.',
      msgShort: 'Your message is a little short. Please write at least 10 characters.',
      notSent: "<strong>Your message is ready.</strong> This form doesn't send anything itself: open your message below in your own email app, or copy it. You can also email <a href=\"mailto:" + MAIL + '">' + MAIL + '</a> directly.',
      copied: 'Copied',
      copiedSr: 'Email address copied.',
      copyFail: "Copying didn't work. Please select the email address and copy it yourself.",
      copyFailLabel: "Didn't work",
      msgCopied: 'Message copied',
      msgCopiedSr: 'Your message has been copied.',
      msgCopyFail: "Copying didn't work. Please select your text in the message field and copy it yourself.",
      subject: 'Message via your portfolio',
      // with a Worker
      nameInvalid: 'Please check your name: at most 100 characters, no line breaks.',
      msgInvalid: 'Please check your message: 10 to 2000 characters.',
      sendingBtn: 'Sending…',
      sending: 'Sending your message…',
      sent: '<strong>Thank you, your message has been sent.</strong> I read it myself and will reply as soon as I can to the email address you gave.',
      dryRun: '<strong>Test mode: your message was not sent.</strong> Everything was checked, but this test environment never sends email.',
      errInvalid: '<strong>Your message was not sent.</strong> Please check the highlighted fields and try again.',
      errCaptcha: '<strong>Your message was not sent.</strong> The spam check did not pass. Please try again, or open or copy your message below.',
      errCaptchaLoad: "<strong>Your message was not sent.</strong> The spam check couldn't load (for example because of an ad blocker). Open or copy your message below, or email <a href=\"mailto:" + MAIL + '">' + MAIL + '</a>.',
      errRate: '<strong>Your message was not sent.</strong> A few messages were sent just now. Please wait a minute and try again, or open or copy your message below.',
      errServer: "<strong>Your message was not sent.</strong> Something went wrong while sending, or there's no connection. Your text is still here: please try again later, or open or copy your message below."
    }
  };

  // with a Worker, the notes that say "nothing is sent" say what does happen
  if (LIVE) {
    Object.keys(NL_LIVE).forEach(function (k) {
      [].forEach.call(view.querySelectorAll('[data-i18n="' + k + '"]'), function (el) {
        el.innerHTML = NL_LIVE[k];
        el.setAttribute('data-i18n', k + 'Live');
      });
    });
  }

  var KEY = 'akif-lang';
  var nodes = [].slice.call(view.querySelectorAll('[data-i18n]'));
  var phs = [].slice.call(view.querySelectorAll('[data-i18n-ph]'));
  nodes.forEach(function (el) { el.setAttribute('data-nl', el.innerHTML); });
  phs.forEach(function (el) { el.setAttribute('data-nl-ph', el.getAttribute('placeholder') || ''); });

  function onPage() { return (window.location.hash || '') === '#/contact'; }
  function saved() { try { return window.localStorage.getItem(KEY) === 'en' ? 'en' : 'nl'; } catch (e) { return 'nl'; } }
  var lang = saved();
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var behavior = reduceMotion ? 'auto' : 'smooth';
  function clamp01(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }

  // ---- the three questions: checked on submit; a field marked invalid is
  // re-checked while typing, so its message goes as soon as it's fixed. A
  // question whose answer is right is "done" (its number fills). ----
  var steps = [].slice.call(view.querySelectorAll('.oc-step'));
  var fields = [
    { input: document.getElementById('ocName'), err: document.getElementById('ocNameErr'),
      check: function (v) { return v.trim() ? '' : 'nameMissing'; } },
    { input: document.getElementById('ocEmail'), err: document.getElementById('ocEmailErr'),
      check: function (v, el) { v = v.trim(); if (!v) return 'emailMissing'; return (el.validity.typeMismatch || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) ? 'emailInvalid' : ''; } },
    { input: document.getElementById('ocMessage'), err: document.getElementById('ocMessageErr'),
      check: function (v) { v = v.trim(); if (!v) return 'msgMissing'; return v.length < 10 ? 'msgShort' : ''; } }
  ];
  function setError(f, key) {
    var step = f.input.closest('.oc-step');
    if (key) {
      f.err.dataset.key = key;
      f.err.textContent = MSG[lang][key];
      f.err.hidden = false;
      f.input.setAttribute('aria-invalid', 'true');
      step.classList.add('is-invalid');
    } else {
      delete f.err.dataset.key;
      f.err.textContent = '';
      f.err.hidden = true;
      f.input.removeAttribute('aria-invalid');
      step.classList.remove('is-invalid');
    }
  }

  // ---- the message composition: the letter, the progress, the question ----
  var compStep = document.getElementById('ocCompStep');
  var compLabel = document.getElementById('ocCompLabel');
  var compFrom = document.getElementById('ocCompFrom');
  var compMail = document.getElementById('ocCompMail');
  var compBody = document.getElementById('ocCompBody');
  var compSign = document.getElementById('ocCompSign');
  var segs = [].slice.call(view.querySelectorAll('.oc-comp-bar i'));
  var countN = document.getElementById('ocCountN');
  var active = 0;      // the question in focus (0–2), or the first one still open
  var focused = false;

  function fill(el, value, empty) {
    var was = el.classList.contains('is-empty');
    var now = !value;
    el.textContent = now ? empty : value;
    el.classList.toggle('is-empty', now);
    if (was && !now && !reduceMotion) {
      el.classList.remove('is-fresh');
      void el.offsetWidth;
      el.classList.add('is-fresh');
    }
  }
  function render() {
    var done = fields.map(function (f) { return !f.check(f.input.value, f.input); });
    if (!focused) { active = done.indexOf(false); if (active < 0) active = 2; }
    steps.forEach(function (s, i) {
      s.classList.toggle('is-done', done[i]);
      s.classList.toggle('is-active', focused && i === active);
    });
    segs.forEach(function (g, i) {
      g.classList.toggle('is-done', done[i]);
      g.classList.toggle('is-active', !done[i] && i === active);
    });
    compStep.textContent = '0' + (active + 1);
    compLabel.textContent = Q[lang][active];
    var name = fields[0].input.value.trim();
    fill(compFrom, name, '—');
    fill(compMail, fields[1].input.value.trim(), '—');
    fill(compBody, fields[2].input.value.replace(/^\s+|\s+$/g, ''), MSG[lang].empty);
    fill(compSign, name, '…');
    countN.textContent = fields[2].input.value.length;
  }

  // ---- after a valid submit: the honest message plus the two real ways on.
  // Typing again takes it all away, so nothing is left half-true ----
  var held = document.getElementById('ocHeld');
  var mailIt = document.getElementById('ocMailIt');
  var sendBtn = form.querySelector('.oc-send');
  function letter() {
    return fields[2].input.value.trim() + '\n\n' + fields[0].input.value.trim() + '\n' + fields[1].input.value.trim();
  }
  function setMailto() {
    mailIt.href = 'mailto:' + MAIL + '?subject=' + encodeURIComponent(MSG[lang].subject + ' — ' + fields[0].input.value.trim()) +
      '&body=' + encodeURIComponent(letter());
  }
  // the status line under the button: one message (by key, so it follows
  // the language), with or without the two ways on (mailto / copy)
  var statusKey = null;
  function setStatus(key, withWays) {
    statusKey = key;
    status.innerHTML = key ? MSG[lang][key] : '';
    status.hidden = !key;
    held.hidden = !(key && withWays);
    sendBtn.classList.toggle('is-held', !!(key && withWays));
    if (key && withWays) setMailto();
  }
  function showHeld(on) { setStatus(on ? 'notSent' : null, on); }

  // ---- sending (only with a Worker) ----
  var sending = false;
  var shownAt = Date.now();   // when /contact was opened
  var touchedAt = 0;          // the first time a field was used
  var honeypot = document.getElementById('ocNick');
  var sendLabel = sendBtn.querySelector('[data-i18n]');

  function setBusy(on) {
    sending = on;
    form.setAttribute('aria-busy', on ? 'true' : 'false');
    // aria-disabled, not disabled: the button keeps its focus
    if (on) sendBtn.setAttribute('aria-disabled', 'true'); else sendBtn.removeAttribute('aria-disabled');
    sendBtn.classList.toggle('is-sending', on);
    fields.forEach(function (f) { f.input.readOnly = on; });
    sendLabel.textContent = on ? MSG[lang].sendingBtn : (lang === 'en' ? EN[sendLabel.getAttribute('data-i18n')] : sendLabel.getAttribute('data-nl'));
  }

  // Cloudflare Turnstile: its script only loads once /contact is open, and
  // the widget is re-made when the language changes
  var tsBox = document.getElementById('ocTurnstile');
  var ts = { id: null, lang: null, token: null, failed: false, loading: false, waiters: [] };
  function tsFlush() {
    var w = ts.waiters; ts.waiters = [];
    w.forEach(function (fn) { fn(ts.token); });
  }
  function tsRender() {
    if (!window.turnstile || !tsBox) { ts.failed = true; tsFlush(); return; }
    if (ts.id !== null) { try { window.turnstile.remove(ts.id); } catch (e) {} ts.id = null; }
    ts.token = null; ts.lang = lang;
    try {
      ts.id = window.turnstile.render(tsBox, {
        sitekey: LIVE.sitekey,
        action: 'contact',
        theme: 'dark',
        appearance: 'interaction-only',
        language: lang === 'en' ? 'en' : 'nl',
        'response-field': false,
        callback: function (t) { ts.token = t; ts.failed = false; tsFlush(); },
        'expired-callback': function () { ts.token = null; },
        'timeout-callback': function () { ts.token = null; },
        'error-callback': function () { ts.token = null; tsFlush(); }
      });
    } catch (e) { ts.failed = true; tsFlush(); }
  }
  function tsLoad() {
    if (!LIVE || ts.loading) return;
    ts.loading = true;
    window.ocTurnstileReady = tsRender;
    var s = document.createElement('script');
    s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&onload=ocTurnstileReady';
    s.async = true;
    s.onerror = function () { ts.failed = true; tsFlush(); };
    document.head.appendChild(s);
  }
  function tsToken(ms) {
    if (ts.token) return Promise.resolve(ts.token);
    if (ts.failed) return Promise.resolve(null);
    tsLoad();
    return new Promise(function (resolve) {
      var done = false;
      function finish(v) { if (!done) { done = true; resolve(v); } }
      ts.waiters.push(finish);
      setTimeout(function () { finish(null); }, ms);
    });
  }
  function tsReset() {
    ts.token = null;   // a token is single-use
    if (ts.id !== null && window.turnstile) { try { window.turnstile.reset(ts.id); } catch (e) {} }
  }

  function post(token) {
    var ctrl = new AbortController();
    var timer = setTimeout(function () { ctrl.abort(); }, 20000);
    return window.fetch(LIVE.endpoint, {
      method: 'POST',
      mode: 'cors',
      credentials: 'omit',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: fields[0].input.value.trim(),
        email: fields[1].input.value.trim(),
        message: fields[2].input.value.trim(),
        token: token,
        website: honeypot ? honeypot.value : '',
        lang: lang,
        elapsed: Date.now() - (touchedAt || shownAt)
      }),
      signal: ctrl.signal
    }).then(function (r) {
      clearTimeout(timer);
      return r.json().catch(function () { return {}; }).then(function (d) {
        // "sent" only on an explicit yes from the Worker
        if (r.ok && d && d.ok === true) return { ok: true, dryRun: d.dryRun === true };
        return { ok: false, error: (d && d.error) || 'server', fields: d && d.fields };
      });
    }, function () { clearTimeout(timer); return { ok: false, error: 'server' }; });
  }

  var ERR = { invalid: 'errInvalid', captcha: 'errCaptcha', captchaLoad: 'errCaptchaLoad', rate: 'errRate' };
  var FIELD_ERR = { name: 'nameInvalid', email: 'emailInvalid', message: 'msgInvalid' };
  function send() {
    setBusy(true);
    setStatus('sending', false);
    tsToken(15000).then(function (token) {
      if (!token) return { ok: false, error: ts.failed ? 'captchaLoad' : 'captcha' };
      return post(token);
    }).then(function (res) {
      setBusy(false);
      tsReset();
      if (res.ok && res.dryRun) {
        setStatus('dryRun', false);           // nothing sent: the text stays
      } else if (res.ok) {
        fields.forEach(function (f) { f.input.value = ''; setError(f, ''); });
        touchedAt = 0;
        render();
        setStatus('sent', false);
      } else {
        if (res.error === 'invalid' && res.fields) {
          fields.forEach(function (f) {
            var k = f.input.name;
            if (res.fields.indexOf(k) !== -1) setError(f, FIELD_ERR[k]);
          });
          render();
        }
        setStatus(ERR[res.error] || 'errServer', true);   // the text stays, the two ways on are offered
      }
      status.focus();
    });
  }

  fields.forEach(function (f, i) {
    f.input.addEventListener('input', function () {
      if (!touchedAt) touchedAt = Date.now();
      if (f.input.getAttribute('aria-invalid') === 'true') setError(f, f.check(f.input.value, f.input));
      if (!status.hidden && !sending) setStatus(null);
      render();
    });
    f.input.addEventListener('focus', function () { if (!touchedAt) touchedAt = Date.now(); focused = true; active = i; render(); });
    f.input.addEventListener('blur', function () { focused = false; render(); });
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (sending) return;   // one message at a time
    var firstBad = null;
    fields.forEach(function (f) {
      var key = f.check(f.input.value, f.input);
      setError(f, key);
      if (key && !firstBad) firstBad = f.input;
    });
    render();
    if (firstBad) { setStatus(null); firstBad.focus(); return; }
    if (LIVE) { send(); return; }
    // valid, but there is no sending: say so plainly, keep what was typed
    showHeld(true);
    status.focus();
  });

  // ---- copying (the e-mail address, and after a submit the message). The
  // button says so for a moment; screen readers hear it through the status
  // line. The tick and "Gekopieerd" come only once the clipboard said yes;
  // if it refuses, the button says so and (for the address) the address is
  // selected, so Ctrl+C / long-press still works ----
  var copyStatus = document.getElementById('ocCopyStatus');
  var GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  // the new label decodes from random letters (instant with reduced motion)
  function decode(el, to) {
    if (reduceMotion) { el.textContent = to; return; }
    var t0 = performance.now();
    (function step() {
      var k = Math.min(1, (performance.now() - t0) / 480), out = '';
      for (var i = 0; i < to.length; i++) {
        out += (i / to.length < k || to.charAt(i) === ' ') ? to.charAt(i) : GLYPHS.charAt(Math.floor(Math.random() * GLYPHS.length));
      }
      el.textContent = out;
      if (k < 1) window.requestAnimationFrame(step);
    })();
  }
  function legacyCopy(text, btn) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.cssText = 'position:fixed;left:-9999px;top:0;';
    document.body.appendChild(ta);
    ta.select();
    var ok = false;
    try { ok = document.execCommand('copy'); } catch (e) {}
    document.body.removeChild(ta);
    btn.focus();
    return ok;
  }
  function selectText(el) {
    try { var r = document.createRange(); r.selectNodeContents(el); var s = window.getSelection(); s.removeAllRanges(); s.addRange(r); } catch (e) {}
  }
  function copyButton(btn, getText, keys, fallbackEl) {
    if (!btn) return;
    var label = btn.querySelector('[data-i18n]');
    var timer = null;
    function done(ok) {
      clearTimeout(timer);
      copyStatus.textContent = ok ? MSG[lang][keys.sr] : MSG[lang][keys.fail];
      btn.classList.toggle('is-copied', ok);
      decode(label, ok ? MSG[lang][keys.label] : MSG[lang].copyFailLabel);
      if (!ok && fallbackEl) selectText(fallbackEl);
      timer = setTimeout(function () {
        btn.classList.remove('is-copied');
        label.innerHTML = lang === 'en' ? EN[label.getAttribute('data-i18n')] : label.getAttribute('data-nl');
        copyStatus.textContent = '';
      }, ok ? 2200 : 4000);
    }
    btn.addEventListener('click', function () {
      var text = getText();
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function () { done(true); }, function () { done(legacyCopy(text, btn)); });
      } else {
        done(legacyCopy(text, btn));
      }
    });
  }
  var copyBtn = document.getElementById('ocCopy');
  copyButton(copyBtn, function () { return copyBtn.getAttribute('data-copy'); },
    { label: 'copied', sr: 'copiedSr', fail: 'copyFail' }, copyBtn && copyBtn.parentNode.querySelector('.oc-direct-link'));
  copyButton(document.getElementById('ocCopyMsg'), letter,
    { label: 'msgCopied', sr: 'msgCopiedSr', fail: 'msgCopyFail' }, null);

  // ---- the footer's "Let's talk" points at this very page: here it goes
  // to the first question instead ----
  function goTo(el, focusEl) {
    var y = 0;
    for (var n = el; n; n = n.offsetParent) y += n.offsetTop;
    window.scrollTo({ top: Math.max(0, y - 130), behavior: behavior });
    if (focusEl) focusEl.focus({ preventScroll: true });
  }
  document.addEventListener('click', function (e) {
    var cta = e.target.closest && e.target.closest('.site-footer .sf-cta');
    if (!cta || !onPage()) return;
    e.preventDefault();
    goTo(document.getElementById('ocConvo'), fields[0].input);
  });

  // ---- the channel (from the status dot down, filling with the scroll) and
  // the composition held in view beside the questions (wide screens) ----
  var convo = document.getElementById('ocConvo');
  var channel = document.getElementById('ocChannel');
  var dot = document.getElementById('ocStatusDot');
  var comp = document.getElementById('ocComp');
  var compIn = document.getElementById('ocCompIn');
  function place() {
    if (view.hidden) return;
    var c = convo.getBoundingClientRect(), d = dot.getBoundingClientRect();
    channel.style.setProperty('--oc-channel-top', Math.round(d.top + d.height / 2 - c.top) + 'px');
  }
  var ticking = false;
  function update() {
    ticking = false;
    if (view.hidden) return;
    var vh = window.innerHeight;
    if (!reduceMotion) {
      var r = channel.getBoundingClientRect();
      var c = clamp01((vh * 0.6 - r.top) / (r.height || 1));
      channel.style.setProperty('--c', c.toFixed(4));
      // the light at its head only while the line is on its way
      channel.classList.toggle('is-running', c > 0.01 && c < 0.99);
    }
    // held 120–160px from the top, never past the end of its column
    if (comp.offsetParent && window.innerWidth > 980) {
      var top = Math.min(160, Math.max(120, vh * 0.15));
      var b = comp.getBoundingClientRect();
      var y = Math.max(0, Math.min(top - b.top, b.height - compIn.offsetHeight));
      compIn.style.transform = y ? 'translate3d(0,' + Math.round(y) + 'px,0)' : '';
    }
  }
  function requestUpdate() {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(update);
  }
  window.addEventListener('scroll', requestUpdate, { passive: true });
  window.addEventListener('resize', function () { place(); requestUpdate(); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { place(); requestUpdate(); });

  // ---- the local time in the Netherlands, updated while this page is open ----
  var timeEl = document.getElementById('ocTime');
  var fmt = null;
  try { fmt = new Intl.DateTimeFormat('nl-NL', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Amsterdam' }); } catch (e) {}
  function tick() {
    if (!timeEl || !fmt) return;
    var t = fmt.format(new Date());
    if (timeEl.textContent !== t) timeEl.textContent = t;
  }
  var clock = null;
  function syncClock() {
    if (onPage() && !clock) { tick(); clock = setInterval(tick, 15000); }
    else if (!onPage() && clock) { clearInterval(clock); clock = null; }
  }
  // no time zone support: show only the place
  if (!fmt && timeEl) { var p = timeEl.parentNode; p.removeChild(timeEl.previousSibling); p.removeChild(timeEl); timeEl = null; }

  // ---- language: the NL · EN link while /contact is open ----
  function apply() {
    nodes.forEach(function (el) {
      var k = el.getAttribute('data-i18n');
      el.innerHTML = lang === 'en' && EN[k] ? EN[k] : el.getAttribute('data-nl');
    });
    phs.forEach(function (el) {
      var k = el.getAttribute('data-i18n-ph');
      el.setAttribute('placeholder', lang === 'en' && EN[k] ? EN[k] : el.getAttribute('data-nl-ph'));
    });
    // messages already on screen follow the language too
    fields.forEach(function (f) { if (f.err.dataset.key) f.err.textContent = MSG[lang][f.err.dataset.key]; });
    if (statusKey) { status.innerHTML = MSG[lang][statusKey]; if (!held.hidden) setMailto(); }
    if (sending) sendLabel.textContent = MSG[lang].sendingBtn;
    if (LIVE && onPage()) {
      tsLoad();
      // the widget speaks the page language (not while a message is on its way)
      if (ts.id !== null && ts.lang !== lang && !sending) tsRender();
    }
    if (onPage()) document.documentElement.lang = lang;
    render();
    place();
  }
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('.nav .lang');
    if (!a || !onPage()) return;
    e.preventDefault();
    lang = lang === 'en' ? 'nl' : 'en';
    try { window.localStorage.setItem(KEY, lang); } catch (err) {}
    apply();
  });

  // ---- the hero: the two lines rise, then the status and the rest ----
  var hero = document.getElementById('ocHero');
  function replay() {
    if (!view.classList.contains('oc-armed')) return;
    hero.classList.remove('is-in');
    void hero.offsetWidth;
    window.requestAnimationFrame(function () { window.requestAnimationFrame(function () { hero.classList.add('is-in'); }); });
  }

  window.addEventListener('hashchange', function () {
    var l = saved();
    if (l !== lang) { lang = l; }
    apply();
    syncClock();
    if (onPage()) { shownAt = Date.now(); document.documentElement.lang = lang; place(); requestUpdate(); replay(); }
  });
  apply();
  syncClock();
  requestUpdate();

  if (reduceMotion) return;
  view.classList.add('oc-armed');
  if (onPage()) replay();
})();
