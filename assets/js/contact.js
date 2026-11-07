(function () {
  "use strict";
  // /contact — OPEN CHANNEL: NL / EN (the same remembered "akif-lang"
  // choice; the NL · EN link switches it while this page is open), the
  // three questions (active / done states, validation, the honest "not
  // connected yet" state), the message composition that mirrors them, the
  // channel line, copying the e-mail address, the local time and the
  // reveals. The form is NOT sent anywhere: a valid submit only explains
  // that and offers the e-mail address.
  var view = document.getElementById('contactView');
  if (!view) return;
  var form = document.getElementById('ocForm');
  var status = document.getElementById('ocStatusMsg');
  var MAIL = 'Akif.Albayrak12@hotmail.com';

  var EN = {
    ocTag: 'Open channel',
    ocPlace: 'The Netherlands',
    ocL1: "Let's make",
    ocL2: 'contact',
    ocStatusA: 'Channel open',
    ocStatusB: 'Ready for your message',
    ocIntro: 'Have an idea, a project, or just want to connect? Feel free to send me a message.',
    ocDirect: 'Rather get in touch directly?',
    ocCopy: 'Copy',
    ocNewTab: ' (opens in a new tab)',
    ocFormTitle: 'Send a message',
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
    ocDraft: 'Draft · not sent yet',
    ocSend: 'Send message',
    ocPending: "This form isn't connected yet: messages are not being sent. Email always works.",
    ocEnd: 'The channel stays open'
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
      notSent: '<strong>Je bericht is niet verstuurd.</strong> Dit formulier is nog niet aangesloten op een verzenddienst, dus er is niets verzonden. Wil je me nu al bereiken? Mail dan naar <a href="mailto:' + MAIL + '">' + MAIL + '</a>.',
      copied: 'Gekopieerd',
      copiedSr: 'E-mailadres gekopieerd.',
      copyFail: 'Kopiëren lukte niet. Selecteer het e-mailadres en kopieer het zelf.'
    },
    en: {
      empty: 'Your message appears here as you type.',
      nameMissing: 'Please enter your name.',
      emailMissing: 'Please enter your email address.',
      emailInvalid: "This email address doesn't look right. Please check it (for example name@example.com).",
      msgMissing: 'Please write a short message.',
      msgShort: 'Your message is a little short. Please write at least 10 characters.',
      notSent: "<strong>Your message has not been sent.</strong> This form isn't connected to a sending service yet, so nothing was sent. Want to reach me now? Email <a href=\"mailto:" + MAIL + '">' + MAIL + '</a>.',
      copied: 'Copied',
      copiedSr: 'Email address copied.',
      copyFail: "Copying didn't work. Please select the email address and copy it yourself."
    }
  };

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

  fields.forEach(function (f, i) {
    f.input.addEventListener('input', function () {
      if (f.input.getAttribute('aria-invalid') === 'true') setError(f, f.check(f.input.value, f.input));
      if (!status.hidden) status.hidden = true;
      render();
    });
    f.input.addEventListener('focus', function () { focused = true; active = i; render(); });
    f.input.addEventListener('blur', function () { focused = false; render(); });
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var firstBad = null;
    fields.forEach(function (f) {
      var key = f.check(f.input.value, f.input);
      setError(f, key);
      if (key && !firstBad) firstBad = f.input;
    });
    render();
    if (firstBad) { status.hidden = true; firstBad.focus(); return; }
    // valid, but there is no sending yet: say so plainly, keep what was typed
    status.innerHTML = MSG[lang].notSent;
    status.hidden = false;
    status.focus();
  });

  // ---- copy the e-mail address (the button says so for a moment; screen
  // readers hear it through the status line) ----
  var copyBtn = document.getElementById('ocCopy');
  var copyStatus = document.getElementById('ocCopyStatus');
  var copyTimer = null;
  function copied(ok) {
    copyStatus.textContent = ok ? MSG[lang].copiedSr : MSG[lang].copyFail;
    if (!ok) return;
    var label = copyBtn.querySelector('[data-i18n]');
    copyBtn.classList.add('is-copied');
    label.textContent = MSG[lang].copied;
    clearTimeout(copyTimer);
    copyTimer = setTimeout(function () {
      copyBtn.classList.remove('is-copied');
      label.innerHTML = lang === 'en' ? EN.ocCopy : label.getAttribute('data-nl');
      copyStatus.textContent = '';
    }, 2200);
  }
  function legacyCopy(text) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.cssText = 'position:fixed;left:-9999px;top:0;';
    document.body.appendChild(ta);
    ta.select();
    var ok = false;
    try { ok = document.execCommand('copy'); } catch (e) {}
    document.body.removeChild(ta);
    copyBtn.focus();
    return ok;
  }
  if (copyBtn) copyBtn.addEventListener('click', function () {
    var text = copyBtn.getAttribute('data-copy');
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () { copied(true); }, function () { copied(legacyCopy(text)); });
    } else {
      copied(legacyCopy(text));
    }
  });

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
      channel.style.setProperty('--c', clamp01((vh * 0.6 - r.top) / (r.height || 1)).toFixed(4));
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
    if (!status.hidden) status.innerHTML = MSG[lang].notSent;
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
    if (onPage()) { document.documentElement.lang = lang; place(); requestUpdate(); replay(); }
  });
  apply();
  syncClock();
  requestUpdate();

  if (reduceMotion) return;
  view.classList.add('oc-armed');
  if (onPage()) replay();
})();
