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
  var photoCap = view.querySelector('.ab-photo-cap');
  var opening = view.querySelector('.ab-opening');

  // ---- 01: the opening in three depth planes — the portrait (far), the
  // caption and AKIF. (near) move at different speeds while scrolling; with
  // a mouse on a wide screen they also shift slightly against each other
  // towards the pointer. The intro's photo sequence keeps the screen to
  // itself: nothing follows the pointer while it plays.
  var finePointer = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var depth = { s: 0, px: 0, py: 0, tx: 0, ty: 0 }, depthRunning = false;
  if (finePointer && opening && photoImg) view.classList.add('ab-depth');
  function paintDepth() {
    if (photoImg) photoImg.style.transform = 'translate(' + (-depth.px * 10).toFixed(1) + 'px,' + (depth.s * 24 - depth.py * 6).toFixed(1) + 'px)';
    if (akifMark) akifMark.style.translate = (depth.px * 18 - depth.s * 14).toFixed(1) + 'px ' + (depth.py * 6).toFixed(1) + 'px';
    if (photoCap) photoCap.style.translate = (depth.px * 5).toFixed(1) + 'px ' + (-depth.s * 30).toFixed(1) + 'px';
  }
  function depthFrame() {
    depth.px += (depth.tx - depth.px) * 0.08;
    depth.py += (depth.ty - depth.py) * 0.08;
    var done = Math.abs(depth.tx - depth.px) < 0.002 && Math.abs(depth.ty - depth.py) < 0.002;
    if (done) { depth.px = depth.tx; depth.py = depth.ty; }
    paintDepth();
    if (done || view.hidden) depthRunning = false; else window.requestAnimationFrame(depthFrame);
  }
  function aimDepth(x, y) {
    depth.tx = x; depth.ty = y;
    if (!depthRunning) { depthRunning = true; window.requestAnimationFrame(depthFrame); }
  }
  if (view.classList.contains('ab-depth')) {
    opening.addEventListener('pointermove', function (e) {
      if (e.pointerType !== 'mouse' || window.innerWidth <= 980 || view.classList.contains('ab-intro-hold')) return;
      var r = opening.getBoundingClientRect();
      aimDepth((e.clientX - r.left) / r.width * 2 - 1, (e.clientY - r.top) / r.height * 2 - 1);
    });
    opening.addEventListener('pointerleave', function () { aimDepth(0, 0); });
  }

  var timeline = document.getElementById('aboutTimeline');
  var tlFill = document.getElementById('aboutTlFill');
  var tlSteps = timeline ? [].slice.call(timeline.querySelectorAll('.ab-tl-step')) : [];
  // a light at the end of the growing line (a sibling of the line: the
  // line's fade-out mask would clip it), moved with transform only
  var tlHead = null, tlGrowing = null;
  if (timeline && tlFill) {
    timeline.classList.add('is-armed');
    tlHead = document.createElement('span');
    tlHead.className = 'ab-tl-head';
    tlHead.setAttribute('aria-hidden', 'true');
    timeline.insertBefore(tlHead, timeline.firstChild);
  }
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
    var reach = vh * 0.6 - rail.top, c = clamp01(reach / Math.max(rail.height, 1));
    tlFill.style.transform = 'scaleY(' + c.toFixed(4) + ')';
    if (tlHead) {
      var growing = c > 0.005 && c < 0.995;
      if (growing !== tlGrowing) { tlGrowing = growing; timeline.classList.toggle('is-growing', growing); }
      if (growing) tlHead.style.transform = 'translateY(' + (c * rail.height).toFixed(1) + 'px)';
    }
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

    // 01: the portrait drifts slightly slower than the page, the name a touch
    // sideways, the caption a little faster (see the depth planes above)
    if (photo && photoImg) {
      var pr = photo.getBoundingClientRect();
      depth.s = clamp01(-pr.top / Math.max(pr.height, 1));
      paintDepth();
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
