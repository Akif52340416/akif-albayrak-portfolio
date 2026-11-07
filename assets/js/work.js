(function () {
  var list = document.getElementById('workList');
  if (!list) return;
  var view = document.getElementById('workView');
  var preview = document.getElementById('workPreview');
  var entries = [].slice.call(list.querySelectorAll('.work-entry'));
  var frames = entries.map(function (e) { return document.getElementById(e.getAttribute('data-preview')); });

  // one project in focus: its preview shows, its row lights up; while the
  // pointer or the keyboard is in the list the other rows step back
  var active = 0;
  function showPreview(i, inList) {
    var was = active;
    active = i;
    frames.forEach(function (frame, k) {
      if (!frame) return;
      frame.classList.toggle('is-shown', k === i);
      // 3D: sets before the one in view wait on the left, the rest on the right
      frame.classList.toggle('is-before', k < i);
      frame.classList.toggle('is-after', k > i);
    });
    entries.forEach(function (entry, k) { entry.classList.toggle('is-active', k === i); });
    list.classList.toggle('has-focus', !!inList);
    if (dots.length) dots.forEach(function (d, k) { d.setAttribute('aria-current', k === i ? 'true' : 'false'); });
    if (view && was !== i) view.style.setProperty('--w3d-acc', accent(i));
  }
  function accent(i) { return getComputedStyle(entries[i]).getPropertyValue('--acc').trim() || '#af2d53'; }

  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var dots = [];

  entries.forEach(function (entry, i) {
    // Hover = preview only; a click follows the link to the case study.
    entry.addEventListener('mouseenter', function () { showPreview(i, true); });
    // Keyboard focus mirrors hover, so Tab-ing through the list previews too.
    entry.addEventListener('focus', function () { showPreview(i, true); });
    // ↑ ↓ Home End move between the projects
    entry.addEventListener('keydown', function (e) {
      var to = { ArrowDown: i + 1, ArrowUp: i - 1, Home: 0, End: entries.length - 1 }[e.key];
      if (to === undefined) return;
      e.preventDefault();
      entries[(to + entries.length) % entries.length].focus();
    });
    entry.addEventListener('click', function (e) {
      // a new tab / window stays the browser's own business
      if (e.button || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      if (!stage) return;
      e.preventDefault();
      var from = active;
      showPreview(i, true);
      openCase(i, from);
    });
  });

  // Leaving the list keeps the last preview, but nothing stays dimmed.
  list.addEventListener('mouseleave', function () { list.classList.remove('has-focus'); });
  list.addEventListener('focusout', function (e) {
    if (!list.contains(e.relatedTarget)) list.classList.remove('has-focus');
  });

  // Without the 3D stage (no preview, or an old browser): the flat previews
  // as before; on phones tapping a project's devices opens its case.
  var supports3d = window.CSS && CSS.supports && CSS.supports('transform-style', 'preserve-3d') && CSS.supports('width', '1cqw');
  var stage = null;
  if (!preview || !view || !supports3d) {
    frames.forEach(function (frame, i) {
      if (!frame) return;
      frame.setAttribute('aria-hidden', 'true');
      frame.addEventListener('click', function () { window.location.hash = entries[i].getAttribute('href'); });
    });
    return;
  }

  // ---------- the 3D stage (concept 02) ----------
  // The same devices and screenshots, set in depth: laptop, tablet and
  // phone at different distances; the set of the project in focus faces
  // you, the others wait turned away into the depth. The light under it
  // takes the project's own colour. The pointer turns the whole set a
  // little; on touch screens dragging turns it and a swipe changes project.
  stage = preview;
  view.classList.add('w3d');
  var glow = document.createElement('div'); glow.className = 'w3d-glow'; glow.setAttribute('aria-hidden', 'true');
  var floor = document.createElement('div'); floor.className = 'w3d-floor'; floor.setAttribute('aria-hidden', 'true');
  var scene = document.createElement('div'); scene.className = 'w3d-scene';
  var rig = document.createElement('div'); rig.className = 'w3d-rig';
  frames.forEach(function (frame) { if (frame) { frame.setAttribute('aria-hidden', 'true'); rig.appendChild(frame); } });
  scene.appendChild(rig);
  preview.appendChild(glow);
  preview.appendChild(floor);
  preview.appendChild(scene);

  // dots (phones): one per project, right under the devices
  var dotWrap = document.createElement('div');
  dotWrap.className = 'w3d-dots';
  dotWrap.setAttribute('role', 'group');
  entries.forEach(function (entry, i) {
    var b = document.createElement('button');
    b.type = 'button';
    b.setAttribute('aria-label', entry.querySelector('.work-name').textContent.trim());
    b.addEventListener('click', function () { showPreview(i, false); });
    dotWrap.appendChild(b);
    dots.push(b);
  });
  preview.parentNode.insertBefore(dotWrap, preview.nextSibling);
  function dotLabel() {
    var en = false;
    try { en = window.localStorage.getItem('akif-lang') === 'en'; } catch (e) {}
    dotWrap.setAttribute('aria-label', en ? 'Choose a project' : 'Kies een project');
  }
  dotLabel();
  document.addEventListener('akif:langchange', dotLabel);
  window.addEventListener('hashchange', dotLabel);

  view.style.setProperty('--w3d-acc', accent(0));
  showPreview(0, false);

  // ---- the turn: a calm three-quarter view; the pointer adds a little ----
  var BASE_Y = -16, BASE_X = 9;
  var ry = BASE_Y, rx = BASE_X, ty = BASE_Y, tx = BASE_X, gx = -20, tgx = -20, running = false;
  function frame() {
    var k = reduceMotion ? 1 : 0.08;
    ry += (ty - ry) * k; rx += (tx - rx) * k; gx += (tgx - gx) * k;
    rig.style.transform = 'rotateX(' + rx.toFixed(2) + 'deg) rotateY(' + ry.toFixed(2) + 'deg)';
    rig.style.setProperty('--gx', gx.toFixed(1) + '%');
    floor.style.transform = 'translateX(' + ((ry - BASE_Y) * -0.6).toFixed(1) + 'px)';
    // stops as soon as it has settled
    if (Math.abs(ty - ry) > 0.01 || Math.abs(tx - rx) > 0.01 || Math.abs(tgx - gx) > 0.1) window.requestAnimationFrame(frame);
    else running = false;
  }
  function turn(y, x, g) {
    ty = y; tx = x; tgx = g;
    if (!running) { running = true; window.requestAnimationFrame(frame); }
  }
  turn(BASE_Y, BASE_X, -20);

  function pointerIn(e) {
    var r = preview.getBoundingClientRect();
    return { x: Math.max(-1, Math.min(1, ((e.clientX - r.left) / r.width) * 2 - 1)), y: Math.max(-1, Math.min(1, ((e.clientY - r.top) / r.height) * 2 - 1)) };
  }
  if (finePointer && !reduceMotion) {
    view.addEventListener('pointermove', function (e) {
      if (e.pointerType !== 'mouse') return;
      var q = pointerIn(e);
      turn(BASE_Y + q.x * 9, BASE_X - q.y * 5, q.x * 60);
    });
    view.addEventListener('pointerleave', function () { turn(BASE_Y, BASE_X, -20); });
  }

  // touch / pen: drag turns the set, a swipe changes project, a tap opens it
  var drag = null;
  preview.addEventListener('pointerdown', function (e) {
    if (e.pointerType === 'mouse') return;
    drag = { x: e.clientX, y: e.clientY, dx: 0, dy: 0 };
  });
  preview.addEventListener('pointermove', function (e) {
    if (!drag) return;
    drag.dx = e.clientX - drag.x; drag.dy = e.clientY - drag.y;
    if (!reduceMotion) turn(BASE_Y + Math.max(-28, Math.min(28, drag.dx / 6)), BASE_X, drag.dx / 3);
  });
  function endDrag() {
    if (!drag) return;
    var d = drag; drag = null;
    turn(BASE_Y, BASE_X, -20);
    if (Math.abs(d.dx) > 50 && Math.abs(d.dx) > Math.abs(d.dy)) {
      showPreview(Math.max(0, Math.min(entries.length - 1, active + (d.dx < 0 ? 1 : -1))), false);
    } else if (Math.abs(d.dx) < 8 && Math.abs(d.dy) < 8) {
      openCase(active, active);
    }
  }
  preview.addEventListener('pointerup', endDrag);
  preview.addEventListener('pointercancel', function () { drag = null; turn(BASE_Y, BASE_X, -20); });
  // a mouse click on the devices opens the project in view
  preview.addEventListener('click', function (e) { if (e.pointerType === 'mouse' || (finePointer && !e.pointerType)) openCase(active, active); });

  // ---- opening a case: the laptop screen grows into the page, then the
  // case itself takes over (the router changes page under the cover) ----
  var cover = null;
  function openCase(i, from) {
    var href = entries[i].getAttribute('href');
    if (reduceMotion || cover) { window.location.hash = href; return; }
    // every set's laptop stands on the same spot while it faces you; a set
    // that is still turning in would give a slanted start
    var screen = frames[from === undefined ? i : from].querySelector('.mini-laptop .mini-screen');
    var src = frames[i].querySelector('.mini-laptop img');
    if (!screen || !src) { window.location.hash = href; return; }
    var r = screen.getBoundingClientRect(), vw = window.innerWidth, vh = window.innerHeight;
    cover = document.createElement('div');
    cover.className = 'w3d-open';
    cover.setAttribute('aria-hidden', 'true');
    var img = document.createElement('img');
    img.src = src.getAttribute('src');
    img.alt = '';
    img.style.objectPosition = src.style.objectPosition || 'top center';
    cover.appendChild(img);
    document.body.appendChild(cover);
    var grow = cover.animate([
      { transform: 'translate(' + r.left + 'px,' + r.top + 'px) scale(' + (r.width / vw) + ',' + (r.height / vh) + ')', borderRadius: '4px' },
      { transform: 'none', borderRadius: '0px' }
    ], { duration: 720, easing: 'cubic-bezier(.65,0,.25,1)', fill: 'forwards' });
    grow.onfinish = function () {
      window.location.hash = href;
      // the case is now laid out under the cover: let it fade away
      window.requestAnimationFrame(function () {
        var fade = cover.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 480, easing: 'ease', fill: 'forwards' });
        fade.onfinish = function () { if (cover) cover.remove(); cover = null; };
      });
    };
  }

  // back on /work: nothing stays dimmed from before
  window.addEventListener('hashchange', function () { list.classList.remove('has-focus'); });
})();
