(function () {
  "use strict";
  // /about intro: 24 real photographs taken in quick succession at the bridge
  // (originals 12.33.45 -> 12.34.15, in shot order, two exact duplicates left
  // out), played as hard cuts on one canvas. Every frame is shown at full
  // photo height, so the whole body stays visible; the body is kept at the same
  // screen position and scale from frame to frame (measured per photo). Frames
  // fill the whole viewport: on landscape screens the portrait photos are
  // cropped top and bottom around one fixed focal point (head near the top,
  // upper body in view); on portrait screens the whole body fits. No zoom
  // animation, no crossfades. Plays once per session, never with reduced motion, and falls
  // back to the page itself if the frames can't load in time.
  var DIR = 'about-sequence/' + ((window.innerWidth || 1200) < 700 ? '960' : '1200') + '/';
  var SRC = [];
  for (var f = 1; f <= 24; f++) SRC.push(DIR + 'frame-' + (f < 10 ? '0' : '') + f + '.webp');
  // cx = horizontal centre of the body in the photo (fraction of its width).
  // g = shooting position: in g1 the camera stood slightly further back, so
  // those frames are drawn 11% larger to keep the body the same size (body spans
  // 0.35->0.95 of the photo height in g0 and 0.34->0.88 in g1).
  // ms = how long the frame stays: an even rhythm, the last frame holds.
  // head = top of the head in the photo (fraction of its height)
  var GROUP = [{ s: 1, head: 0.35 }, { s: 1.111, head: 0.34 }];
  var META = [
    { cx: 0.447, g: 0, ms: 220 },
    { cx: 0.447, g: 0, ms: 80 },
    { cx: 0.45, g: 0, ms: 80 },
    { cx: 0.44, g: 0, ms: 80 },
    { cx: 0.423, g: 0, ms: 80 },
    { cx: 0.43, g: 0, ms: 80 },
    { cx: 0.44, g: 0, ms: 80 },
    { cx: 0.45, g: 0, ms: 80 },
    { cx: 0.463, g: 0, ms: 80 },
    { cx: 0.437, g: 0, ms: 80 },
    { cx: 0.417, g: 0, ms: 80 },
    { cx: 0.413, g: 0, ms: 80 },
    { cx: 0.417, g: 0, ms: 80 },
    { cx: 0.437, g: 0, ms: 80 },
    { cx: 0.45, g: 0, ms: 80 },
    { cx: 0.457, g: 0, ms: 80 },
    { cx: 0.447, g: 0, ms: 80 },
    { cx: 0.487, g: 1, ms: 80 },
    { cx: 0.493, g: 1, ms: 80 },
    { cx: 0.497, g: 1, ms: 80 },
    { cx: 0.497, g: 1, ms: 80 },
    { cx: 0.5, g: 1, ms: 80 },
    { cx: 0.5, g: 1, ms: 80 },
    { cx: 0.497, g: 1, ms: 800 }
  ];
  var KEY = 'akif-about-intro-seen';
  var LOAD_TIMEOUT = 2800;

  var view = document.getElementById('aboutView');
  var overlay = document.getElementById('aboutIntro');
  if (!view || !overlay) return;
  var canvas = overlay.querySelector('canvas');
  var skipBtn = overlay.querySelector('.ab-seq-skip');
  var photo = document.getElementById('aboutOpeningPhoto');
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function seen() { try { return window.sessionStorage.getItem(KEY) === '1'; } catch (e) { return false; } }
  function markSeen() { try { window.sessionStorage.setItem(KEY, '1'); } catch (e) {} }

  var current = null;

  function maybePlay() {
    if ((window.location.hash || '') !== '#/about') {
      if (current) current.stop(false);
      return;
    }
    if (current || reduceMotion || seen() || !canvas.getContext) return;
    current = play();
  }

  function play() {
    markSeen();
    var ctx = canvas.getContext('2d');
    var imgs = [];
    var timers = [];
    var finished = false;
    var anim = null;

    view.classList.add('ab-intro-hold');
    overlay.classList.add('is-on');

    function later(fn, ms) { timers.push(setTimeout(fn, ms)); }

    // layout in CSS px: every frame covers the viewport edge to edge. The scale
    // is the same for the whole sequence (cover + 6% headroom so the body can be
    // kept in place horizontally), so the body stays the same size throughout.
    var L = null;
    function sizeCanvas() {
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      var vw = window.innerWidth, vh = window.innerHeight;
      canvas.width = Math.round(vw * dpr);
      canvas.height = Math.round(vh * dpr);
      // head top sits at 14% of the viewport height on landscape screens,
      // a little lower on portrait screens where the full body fits anyway
      L = { dpr: dpr, vw: vw, vh: vh, headAt: vh * (vw > vh ? 0.14 : 0.2) };
    }

    function draw(k) {
      var img = imgs[k], m = META[k] || META[META.length - 1], gr = GROUP[m.g];
      var d = L.dpr, vw = L.vw, vh = L.vh, iw = img.naturalWidth, ih = img.naturalHeight;
      var s = Math.max(vw / iw, vh / ih) * 1.06 * gr.s;
      var dw = iw * s, dh = ih * s;
      // keep the body centred and the head at a fixed height, but never leave a gap
      var x = Math.min(0, Math.max(vw - dw, vw / 2 - m.cx * dw));
      var y = Math.min(0, Math.max(vh - dh, L.headAt - gr.head * dh));
      ctx.drawImage(img, x * d, y * d, dw * d, dh * d);
    }
    // any interaction reveals the skip control; scrolling is held for the ~2s
    function onInteract() { overlay.classList.add('show-skip'); }
    function onWheel(e) { e.preventDefault(); onInteract(); }
    function onKey(e) { onInteract(); if (e.key === 'Escape') stop(true, true); }
    function onSkip() { stop(true, true); }
    window.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('touchmove', onWheel, { passive: false });
    window.addEventListener('pointermove', onInteract);
    window.addEventListener('pointerdown', onInteract);
    window.addEventListener('keydown', onKey);
    skipBtn.addEventListener('click', onSkip);

    function cleanup() {
      timers.forEach(clearTimeout);
      timers = [];
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('touchmove', onWheel);
      window.removeEventListener('pointermove', onInteract);
      window.removeEventListener('pointerdown', onInteract);
      window.removeEventListener('keydown', onKey);
      skipBtn.removeEventListener('click', onSkip);
      if (anim) { anim.cancel(); anim = null; }
      overlay.classList.remove('is-on', 'show-skip');
      // release the decoded frames
      canvas.width = 0;
      canvas.height = 0;
      imgs.forEach(function (img) { img.removeAttribute('src'); });
      imgs = [];
      current = null;
    }

    // hand-over: the last frame narrows to the hero portrait's place, then fades
    // into it; the opening text rises in while that happens
    function stop(animate, fast) {
      if (finished) return;
      finished = true;
      timers.forEach(clearTimeout);
      timers = [];
      if (!animate || !overlay.animate) {
        view.classList.remove('ab-intro-hold');
        cleanup();
        return;
      }
      var r = photo ? photo.getBoundingClientRect() : null;
      var vw = window.innerWidth, vh = window.innerHeight;
      var keys;
      if (!fast && r && r.width > 0 && r.height > 0) {
        var target = 'inset(' + Math.max(0, r.top).toFixed(0) + 'px ' + Math.max(0, vw - r.right).toFixed(0) + 'px ' +
                     Math.max(0, vh - r.bottom).toFixed(0) + 'px ' + Math.max(0, r.left).toFixed(0) + 'px)';
        keys = [
          { clipPath: 'inset(0px 0px 0px 0px)', opacity: 1 },
          { clipPath: target, opacity: 1, offset: 0.55 },
          { clipPath: target, opacity: 0 }
        ];
      } else {
        keys = [{ opacity: 1 }, { opacity: 0 }];
      }
      var duration = fast ? 380 : 1150;
      anim = overlay.animate(keys, { duration: duration, easing: 'cubic-bezier(.65,0,.25,1)', fill: 'forwards' });
      later(function () { view.classList.remove('ab-intro-hold'); }, fast ? 120 : 620);
      anim.onfinish = cleanup;
      // safety net: animations can be paused (e.g. a background tab); never leave the overlay up
      later(cleanup, duration + 200);
    }

    function run() {
      if (finished) return;
      sizeCanvas();
      var k = 0;
      (function step() {
        if (finished) return;
        draw(k);
        var ms = (META[k] || META[META.length - 1]).ms;
        k++;
        if (k < imgs.length) later(step, ms);
        else later(function () { stop(true, false); }, ms);
      })();
    }

    // decode every frame up front (no flicker); if that takes too long or fails,
    // drop the intro and show the page instead of a broken sequence
    function ready(img) {
      return new Promise(function (res, rej) {
        function decoded() {
          if (!img.decode) { res(); return; }
          var t = setTimeout(res, 300);
          img.decode().then(function () { clearTimeout(t); res(); }, function () { clearTimeout(t); res(); });
        }
        if (img.complete && img.naturalWidth) decoded();
        else { img.onload = decoded; img.onerror = rej; }
      });
    }
    imgs = SRC.map(function (src) { var img = new Image(); img.decoding = 'async'; img.src = src; return img; });
    var decodes = imgs.map(ready);
    var timeout = new Promise(function (res, rej) { later(function () { rej(new Error('timeout')); }, LOAD_TIMEOUT); });
    Promise.race([Promise.all(decodes), timeout]).then(function () {
      timers.forEach(clearTimeout);
      timers = [];
      run();
    }, function () { stop(true, true); });

    return { stop: stop };
  }

  window.addEventListener('hashchange', function () { setTimeout(maybePlay, 0); });
  maybePlay();
})();
