(function () {
  "use strict";
  // Case studies — the interactive layer (concept 03), different per case,
  // only with the screenshots and texts each case already has:
  //   Van der Hammen  "Bold on every screen": the device showcase becomes a
  //                   held scene while scrolling — tablet and phone swing in
  //                   beside the laptop, then each device comes forward in
  //                   turn (Desktop · Tablet · Mobiel). The design detail
  //                   zooms from the whole homepage into its crop before the
  //                   three pins land. The result numbers count up once.
  //   Unite           "Clear on every screen": the three screens of its own
  //                   list (Desktop / Tablet / Mobiel) each bring their device
  //                   forward — on hover, and once in turn when the list comes
  //                   into view. The headline detail settles into focus.
  //   Talia           "Calm on every screen": nothing lights up; the three
  //                   devices stand at different depths and drift a little at
  //                   different speeds, and the homepage print settles down.
  // With reduced motion nothing here runs: every case stays exactly as it
  // was. One frame loop for whichever case is open; it stops when settled.
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion) return;

  function clamp01(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function map(v, a, b) { return clamp01((v - a) / (b - a)); }
  function ease(x) { return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; }
  function lang() { try { return window.localStorage.getItem('akif-lang') === 'en' ? 'en' : 'nl'; } catch (e) { return 'nl'; } }

  var jobs = {};        // per view id: a function(now) that returns true while still moving
  var running = false;
  function current() {
    var h = window.location.hash || '';
    return h === '#/work/van-der-hammen' ? 'vdhView' : h === '#/work/unite-reintegratie' ? 'uniteView' : h === '#/work/talia' ? 'taliaView' : null;
  }
  function frame() {
    var id = current(), again = false;
    if (id && jobs[id]) jobs[id].forEach(function (job) { if (job()) again = true; });
    if (again) window.requestAnimationFrame(frame); else running = false;
  }
  function wake() { if (!running && current()) { running = true; window.requestAnimationFrame(frame); } }
  function add(id, job) { (jobs[id] = jobs[id] || []).push(job); }
  window.addEventListener('scroll', wake, { passive: true });
  window.addEventListener('resize', wake);
  window.addEventListener('hashchange', function () { setTimeout(wake, 60); });

  // ---------- a crop that zooms in from a wider view of the same page ----------
  // The crop shows a window onto the full screenshot (--x / --y / --w in
  // site.css). Here the window starts wider and closes in on the crop. The
  // image's own width changes (no scaled layer), so it is drawn sharp at
  // every step. done(true) once it has fully arrived.
  function zoomCrop(crop, from, to, done) {
    var img = crop.querySelector('img');
    if (!img) return;
    var X = +getComputedStyle(crop).getPropertyValue('--x'), Y = +getComputedStyle(crop).getPropertyValue('--y'), W = +getComputedStyle(crop).getPropertyValue('--w');
    var zx = from.x === undefined ? X : from.x, zy = from.y === undefined ? Y : from.y, zw = from.w;
    var cur = -1, arrived = null;
    crop.classList.add('is-zooming');
    add(crop.closest('.page-cs').id, function () {
      var r = crop.getBoundingClientRect(), vh = window.innerHeight;
      if (r.bottom < -50 || r.top > vh + 50) return false;
      // wide while it enters, in focus by the time its centre reaches 55%
      var t = ease(map(vh - r.top, vh * to.start, vh * 0.45 + r.height * 0.5));
      var next = cur < 0 ? t : cur + (t - cur) * 0.18;
      if (Math.abs(t - next) < 0.001) next = t;
      if (next === cur) return false;
      cur = next;
      var w = lerp(zw, W, cur), x = lerp(zx, X, cur), y = lerp(zy, Y, cur);
      img.style.width = (100 / w) + '%';
      img.style.transform = 'translate(' + (-x * 100).toFixed(3) + '%,' + (-y * 100).toFixed(3) + '%)';
      var a = cur > 0.985;
      if (a !== arrived) { arrived = a; if (done) done(a); }
      return cur !== t;
    });
  }

  // ======================= Van der Hammen =======================
  (function () {
    var view = document.getElementById('vdhView');
    if (!view) return;

    // ---- the held device scene (wide, tall enough screens only) ----
    var stage = view.querySelector('.cs-stage');
    var showcase = stage && stage.querySelector('.vdh-showcase');
    var devices = showcase && showcase.querySelector('.vdh-devices');
    var held = window.matchMedia('(min-width: 781px) and (min-height: 640px)');
    if (devices) {
      var lap = devices.querySelector('.vdh-laptop'), tab = devices.querySelector('.vdh-tablet'), pho = devices.querySelector('.vdh-phone');
      // The showcase and its scroll room share their own box: the sticky
      // showcase is held only within it, so it lets go exactly when the
      // scene ends (p = 1) — before the text under it, never on top of it.
      var hold = document.createElement('div');
      hold.className = 'vdh-hold';
      showcase.parentNode.insertBefore(hold, showcase);
      hold.appendChild(showcase);
      var room = document.createElement('div');
      room.className = 'vdh-room';
      room.setAttribute('aria-hidden', 'true');
      hold.appendChild(room);
      // the three names under the devices, the one in front lit
      var steps = document.createElement('ol');
      steps.className = 'vdh-steps';
      steps.setAttribute('aria-hidden', 'true');
      var NAMES = { nl: ['Desktop', 'Tablet', 'Mobiel'], en: ['Desktop', 'Tablet', 'Mobile'] };
      [0, 1, 2].forEach(function () { steps.appendChild(document.createElement('li')); });
      showcase.appendChild(steps);
      var name = function () { NAMES[lang()].forEach(function (n, i) { steps.children[i].textContent = n; }); };
      name();
      document.addEventListener('akif:langchange', name);
      window.addEventListener('hashchange', name);

      var on = function () {
        view.classList.toggle('vdh-montage', held.matches);
        // body already clips x with overflow-x: clip (hidden would turn it
        // into a scroll box and stop position: sticky); the class stays as
        // the hook for this case's held scene. Only while this case is open.
        document.body.classList.toggle('cs-held', held.matches && current() === 'vdhView');
        if (!held.matches) [lap, tab, pho].forEach(function (el) { el.style.transform = ''; el.style.opacity = ''; el.style.removeProperty('--dim'); });
        wake();
      };
      on();
      if (held.addEventListener) held.addEventListener('change', on);
      window.addEventListener('hashchange', function () { setTimeout(on, 0); });

      var cur = -1, lit = -1;
      add('vdhView', function () {
        if (!held.matches) return false;
        var inner = showcase.parentNode.getBoundingClientRect();
        var top = parseFloat(getComputedStyle(showcase).top) || 0;
        var target = clamp01((top - inner.top) / Math.max(1, room.offsetHeight));
        var p = cur < 0 ? target : cur + (target - cur) * 0.14;
        if (Math.abs(target - p) < 0.0005) p = target;
        if (p === cur) return false;
        cur = p;
        // 0 → .26: tablet and phone swing in beside the laptop
        var inn = ease(map(p, 0.02, 0.26));
        // .3 → .9: Desktop, Tablet, Mobiel come forward in turn
        var focus = [map(p, 0.28, 0.34) * (1 - map(p, 0.46, 0.52)), map(p, 0.48, 0.54) * (1 - map(p, 0.66, 0.72)), map(p, 0.68, 0.74) * (1 - map(p, 0.88, 0.94))];
        var any = Math.max(focus[0], focus[1], focus[2]);
        lap.style.transform = 'translate3d(' + lerp(8, 0, inn).toFixed(2) + '%,0,' + (focus[0] * 40).toFixed(1) + 'px)';
        tab.style.transform = 'translate3d(' + lerp(-70, 0, inn).toFixed(2) + '%,' + (-focus[1] * 3).toFixed(2) + '%,' + (focus[1] * 60).toFixed(1) + 'px) rotateY(' + lerp(48, 0, inn).toFixed(2) + 'deg)';
        pho.style.transform = 'translate3d(' + lerp(60, 0, inn).toFixed(2) + '%,' + lerp(40, -focus[2] * 3, inn).toFixed(2) + '%,' + (focus[2] * 70).toFixed(1) + 'px) rotateY(' + lerp(-40, 0, inn).toFixed(2) + 'deg)';
        tab.style.opacity = pho.style.opacity = inn.toFixed(3);
        // the devices that are not in front step back a little
        [lap, tab, pho].forEach(function (el, i) { el.style.setProperty('--dim', (0.55 * any * (1 - focus[i])).toFixed(3)); });
        var now = focus.indexOf(any);
        if (any < 0.5) now = -1;
        if (now !== lit) { lit = now; [].forEach.call(steps.children, function (li, i) { li.classList.toggle('is-on', i === now); }); }
        steps.style.opacity = map(p, 0.24, 0.3).toFixed(3);
        return p !== target;
      });
    }

    // ---- the design detail: from the whole homepage into the crop, then the pins ----
    var crop = view.querySelector('.cs-design-crop');
    if (crop) zoomCrop(crop, { x: 0, y: 0, w: 0.74 }, { start: 0.15 }, function (a) { crop.classList.toggle('is-zoomed', a); });

    // ---- the result numbers count up once, as they come into view ----
    var bigs = [].slice.call(view.querySelectorAll('.cs-numbers .cs-big'));
    if (bigs.length && 'IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (!e.isIntersecting) return;
          io.unobserve(e.target);
          var el = e.target, to = +el.textContent, t0 = performance.now();
          if (!(to > 0)) return;
          (function step(now) {
            var k = Math.min(1, (now - t0) / 900);
            el.textContent = String(Math.round(to * (1 - Math.pow(1 - k, 3))));
            if (k < 1) window.requestAnimationFrame(step);
          })(t0);
        });
      }, { threshold: 0.6 });
      bigs.forEach(function (b) { io.observe(b); });
    }
  })();

  // ======================= Unite =======================
  (function () {
    var view = document.getElementById('uniteView');
    if (!view) return;
    var devices = view.querySelector('.vdh-devices');
    var rows = [].slice.call(view.querySelectorAll('.u-screens li'));
    if (devices && rows.length === 3) {
      var frames = [devices.querySelector('.vdh-laptop'), devices.querySelector('.vdh-tablet'), devices.querySelector('.vdh-phone')];
      view.classList.add('u-linked');
      var pointing = -1, auto = -1, timer = null, played = false;
      var paint = function () {
        var k = pointing > -1 ? pointing : auto;
        frames.forEach(function (f, i) { f.classList.toggle('is-forward', i === k); f.classList.toggle('is-back', k > -1 && i !== k); });
        rows.forEach(function (r, i) { r.classList.toggle('is-forward', i === k); });
      };
      rows.forEach(function (row, i) {
        row.addEventListener('mouseenter', function () { pointing = i; paint(); });
        row.addEventListener('mouseleave', function () { pointing = -1; paint(); });
      });
      // once, when the devices are well in view (the list sits right under
      // them): Desktop → Tablet → Mobiel, then all three at rest
      if ('IntersectionObserver' in window) {
        var io = new IntersectionObserver(function (entries) {
          entries.forEach(function (e) {
            if (!e.isIntersecting || played) return;
            played = true;
            var i = 0;
            (function next() {
              auto = i < 3 ? i : -1;
              paint();
              if (i++ < 3) timer = setTimeout(next, 1300);
            })();
          });
        }, { threshold: 0.75 });
        io.observe(devices);
        window.addEventListener('hashchange', function () { clearTimeout(timer); auto = -1; played = false; paint(); io.unobserve(devices); io.observe(devices); });
      }
    }
    // the headline detail settles into focus (a short way, no pins)
    var crop = view.querySelector('.u-headline-crop');
    if (crop) zoomCrop(crop, { w: 0.3 }, { start: 0.1 }, null);
  })();

  // ======================= Talia =======================
  (function () {
    var view = document.getElementById('taliaView');
    if (!view) return;
    var stage = view.querySelector('.t-stage');
    var devices = stage && stage.querySelector('.vdh-devices');
    if (devices) {
      // farther back moves less: laptop, tablet, phone
      var layers = [[devices.querySelector('.vdh-laptop'), 14], [devices.querySelector('.vdh-tablet'), 34], [devices.querySelector('.vdh-phone'), 56]];
      view.classList.add('t-depth');
      var cur = -2;
      add('taliaView', function () {
        var r = devices.getBoundingClientRect(), vh = window.innerHeight;
        if (r.bottom < -100 || r.top > vh + 100) return false;
        // -1 entering at the bottom … 1 leaving at the top
        var t = Math.max(-1, Math.min(1, ((r.top + r.height / 2) - vh / 2) / (vh / 2 + r.height / 2)));
        var p = cur < -1.5 ? t : cur + (t - cur) * 0.12;
        if (Math.abs(t - p) < 0.001) p = t;
        if (p === cur) return false;
        cur = p;
        layers.forEach(function (l) { l[0].style.transform = 'translate3d(0,' + (p * l[1]).toFixed(1) + 'px,0)'; });
        return p !== t;
      });
    }
    // the homepage print settles down as it reaches the middle of the screen
    var print = view.querySelector('.t-print');
    if (print) {
      var pc = -1;
      add('taliaView', function () {
        var r = print.getBoundingClientRect(), vh = window.innerHeight;
        if (r.bottom < -50 || r.top > vh + 50) return false;
        var t = ease(map(vh - r.top, vh * 0.05, vh * 0.55));
        var p = pc < 0 ? t : pc + (t - pc) * 0.12;
        if (Math.abs(t - p) < 0.001) p = t;
        if (p === pc) return false;
        pc = p;
        print.style.setProperty('--settle', p.toFixed(3));
        return p !== t;
      });
    }
  })();

  wake();
})();
