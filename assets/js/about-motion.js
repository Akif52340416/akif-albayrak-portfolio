(function () {
  "use strict";
  // /about motion. Every effect only touches transform/translate/opacity/color,
  // so layout never jumps. The CSS defaults are the finished states: without
  // JS, or with reduced motion, the page is a complete static composition.
  var view = document.getElementById('aboutView');
  if (!view) return;

  // sticky needs body to not be a scroll container (see body.is-about in CSS)
  function syncBodyClass() {
    document.body.classList.toggle('is-about', (window.location.hash || '') === '#/about');
  }
  syncBodyClass();
  window.addEventListener('hashchange', syncBodyClass);

  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion) return;

  function clamp01(v) { return Math.max(0, Math.min(1, v)); }

  var photo = document.getElementById('aboutOpeningPhoto');
  var photoImg = photo ? photo.querySelector('img') : null;
  var akifMark = document.getElementById('aboutAkifMark');

  var timeline = document.getElementById('aboutTimeline');
  var tlFill = document.getElementById('aboutTlFill');
  var tlSteps = timeline ? [].slice.call(timeline.querySelectorAll('.ab-tl-step')) : [];
  if (timeline && tlFill) timeline.classList.add('is-armed');
  var traits = view.querySelectorAll('.ab-trait');

  // ---- 04: the outside-IT spread ----
  var outStage = document.getElementById('aboutOutStage');
  var outVoetbal = outStage ? outStage.querySelector('.ab-out-voetbal') : null;
  var outBoksen = outStage ? outStage.querySelector('.ab-out-boksen') : null;
  var outSplit = outStage ? outStage.querySelector('.ab-out-split') : null;

  // VOETBAL rises letter by letter: its text is split into letters (hidden
  // from screen readers, which read the intact word kept beside them). The
  // NL/EN switch rewrites the word, so it is split again after every switch.
  function splitVoetbal() {
    if (!outSplit) return;
    // an already split word carries its intact form in the .ab-sr copy
    // (the NL text the language switch restores is the split version)
    var intact = outSplit.querySelector('.ab-sr');
    var word = (intact ? intact.textContent : outSplit.textContent).trim();
    var letters = '';
    for (var i = 0; i < word.length; i++) letters += '<span class="ab-out-letter" style="--i:' + i + '">' + word.charAt(i) + '</span>';
    outSplit.innerHTML = '<span class="ab-sr">' + word + '</span><span class="ab-out-letters" aria-hidden="true">' + letters + '</span>';
  }
  document.addEventListener('akif:langchange', splitVoetbal);
  splitVoetbal();

  // ---- 02 / 04: one-time reveals — each trait row (rule draws, word rises,
  // sentence follows) and the outside-IT spread (the pitch draws while
  // VOETBAL rises, then the ropes and BOKSEN's jab, then FITNESS and its
  // reps — one after another, timed in the CSS). ----
  if ('IntersectionObserver' in window) {
    var revealIo = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        (entry.target._abTargets || [entry.target]).forEach(function (el) { el.classList.add('is-in'); });
        revealIo.unobserve(entry.target);
      });
    }, { threshold: 0.3 });
    var traitList = document.getElementById('aboutTraitList');
    if (traitList) {
      traitList.classList.add('is-armed');
      traits.forEach(function (row) { revealIo.observe(row); });
    }
    if (outStage) {
      outStage.classList.add('is-armed');
      var outIo = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          outStage.classList.add('is-in');
          outIo.disconnect();
        });
      }, { threshold: 0.22 });
      outIo.observe(outStage);
    }
  }

  // ---- 04: the route line fills down to ~60% of the viewport; each step
  // lights (node + word) once the fill has reached its node ----
  function updateRoute(vh) {
    if (!timeline || !tlFill) return;
    var rail = tlFill.parentNode.getBoundingClientRect();
    var reach = vh * 0.6 - rail.top;
    tlFill.style.transform = 'scaleY(' + clamp01(reach / Math.max(rail.height, 1)).toFixed(4) + ')';
    tlSteps.forEach(function (s) {
      var node = s.querySelector('.ab-tl-node');
      var y = node ? node.getBoundingClientRect().top : s.getBoundingClientRect().top;
      s.classList.toggle('is-reached', y <= vh * 0.6 + 1);
    });
  }

  var ticking = false;
  function update() {
    ticking = false;
    if (view.hidden) return;
    var vh = window.innerHeight || document.documentElement.clientHeight;
    var vw = window.innerWidth || document.documentElement.clientWidth;

    // 01: the portrait drifts slightly slower than the page, the name a touch sideways
    if (photo && photoImg) {
      var pr = photo.getBoundingClientRect();
      var pp = clamp01(-pr.top / Math.max(pr.height, 1));
      photoImg.style.transform = 'translateY(' + (pp * 24).toFixed(1) + 'px)';
      if (akifMark) akifMark.style.translate = (-pp * 14).toFixed(1) + 'px 0';
    }

    updateRoute(vh);

    // 02: the trait row nearest the middle of the screen is lit
    if (traits.length) {
      traits.forEach(function (el) {
        var r = el.getBoundingClientRect();
        var dist = Math.abs((r.top + r.height / 2) - vh * 0.5) / (vh * 0.5);
        el.style.setProperty('--lit', (1 - clamp01((dist - 0.12) / 0.5)).toFixed(3));
      });
    }

    // 04: a little depth while the spread crosses the screen — VOETBAL
    // slides slightly sideways over its pitch and BOKSEN moves a touch faster
    // than the page. Only translate, never scale.
    if (outStage) {
      var sr = outStage.getBoundingClientRect();
      if (sr.bottom > -100 && sr.top < vh + 100) {
        var k = (clamp01((vh - sr.top) / (vh + sr.height)) - 0.5) * 2; // -1 … 1
        if (outVoetbal) outVoetbal.style.translate = (k * Math.min(28, vw * 0.022)).toFixed(1) + 'px 0';
        if (outBoksen) outBoksen.style.translate = '0 ' + (-k * Math.min(36, vh * 0.045)).toFixed(1) + 'px';
      }
    }
  }

  function onScroll() {
    if (!ticking) {
      ticking = true;
      window.requestAnimationFrame(update);
    }
  }
  function onLayoutChange() {
    window.requestAnimationFrame(update);
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onLayoutChange);
  window.addEventListener('hashchange', onLayoutChange);
  document.addEventListener('akif:langchange', onLayoutChange);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(onLayoutChange);
  onLayoutChange();
})();
