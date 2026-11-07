(function () {
  "use strict";
  // /contact — the interactive layer (concept 06), on top of contact.js:
  //   - a light passes over LAAT VAN / JE HOREN. where the pointer is; on
  //     touch screens it sweeps over the title once, after the lines rose
  //   - the footer's "Laten we praten." leans a little towards the pointer
  //     (this page only, mouse only)
  // Nothing here runs with reduced motion, and nothing runs while the page
  // isn't open: every loop stops as soon as it has settled.
  var view = document.getElementById('contactView');
  var title = document.getElementById('ocTitle');
  if (!view || !title) return;
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion) return;
  var finePointer = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  function onPage() { return (window.location.hash || '') === '#/contact'; }

  // ---------- the light over the title ----------
  var rises = [].slice.call(title.querySelectorAll('.oc-rise'));
  var hero = document.getElementById('ocHero');
  var mx = 0, my = 0, tx = 0, ty = 0, running = false, offTimer = null;
  // the hero's lines are still rising: no light yet
  function ready() { return !view.classList.contains('oc-armed') || hero.classList.contains('is-in'); }

  function paint() {
    rises.forEach(function (el) {
      var r = el.getBoundingClientRect();
      el.style.setProperty('--mx', (mx - r.left).toFixed(1) + 'px');
      el.style.setProperty('--my', (my - r.top).toFixed(1) + 'px');
    });
  }
  function frame() {
    mx += (tx - mx) * 0.16; my += (ty - my) * 0.16;
    paint();
    if (Math.abs(tx - mx) > 0.3 || Math.abs(ty - my) > 0.3) window.requestAnimationFrame(frame);
    else running = false;
  }
  function aim(x, y, jump) {
    tx = x; ty = y;
    if (jump) { mx = x; my = y; }
    if (!running) { running = true; window.requestAnimationFrame(frame); }
  }
  function lightOn() {
    clearTimeout(offTimer);
    title.classList.add('has-light');
    title.style.setProperty('--oc-lo', '1');
  }
  // fade out, then hand the letters back to their plain colour
  function lightOff() {
    title.style.setProperty('--oc-lo', '0');
    clearTimeout(offTimer);
    offTimer = setTimeout(function () { title.classList.remove('has-light'); }, 650);
  }

  if (finePointer) {
    title.addEventListener('pointermove', function (e) {
      if (!ready()) return;
      var fresh = !title.classList.contains('has-light');
      lightOn();
      aim(e.clientX, e.clientY, fresh);
    });
    title.addEventListener('pointerleave', lightOff);
  } else if ('IntersectionObserver' in window) {
    // touch: one slow sweep over the title each time the page opens
    var swept = false;
    var sweep = function () {
      if (swept || !onPage()) return;
      swept = true;
      var t0 = performance.now();
      lightOn();
      (function step(now) {
        var r = title.getBoundingClientRect();
        var k = Math.min(1, (now - t0) / 2400);
        aim(r.left + k * r.width * 1.05, r.top + r.height * (0.25 + 0.5 * k), k === 0);
        if (k < 1 && onPage()) window.requestAnimationFrame(step);
        else lightOff();
      })(t0);
    };
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        // after the two lines have risen (1.2s + the second line's delay)
        setTimeout(function () { if (ready()) sweep(); else setTimeout(sweep, 900); }, 1500);
      });
    }, { threshold: 0.6 });
    io.observe(title);
    window.addEventListener('hashchange', function () { if (onPage()) { swept = false; io.unobserve(title); io.observe(title); } });
  }

  // ---------- the footer's "Laten we praten.", on this page ----------
  var footer = document.getElementById('siteFooter');
  var cta = footer && footer.querySelector('.sf-cta');
  var arrow = cta && cta.querySelector('.sf-arrow');
  if (!finePointer || !cta) return;
  var gx = 0, gy = 0, gtx = 0, gty = 0, pulling = false;
  function pull() {
    gx += (gtx - gx) * 0.12; gy += (gty - gy) * 0.12;
    // translate (not transform): the hover shift in site.css stays as it is
    cta.style.translate = gx.toFixed(2) + 'px ' + gy.toFixed(2) + 'px';
    if (arrow) arrow.style.translate = (gx * 0.8).toFixed(2) + 'px ' + (gy * 0.5).toFixed(2) + 'px';
    if (Math.abs(gtx - gx) > 0.05 || Math.abs(gty - gy) > 0.05) window.requestAnimationFrame(pull);
    else pulling = false;
  }
  function toward(x, y) {
    gtx = x; gty = y;
    if (!pulling) { pulling = true; window.requestAnimationFrame(pull); }
  }
  footer.addEventListener('pointermove', function (e) {
    if (!onPage()) return;
    var r = cta.getBoundingClientRect();
    // only near the line itself; a gentle lean, never more than 14 / 8px
    var near = e.clientX > r.left - 80 && e.clientX < r.right + 80 && e.clientY > r.top - 80 && e.clientY < r.bottom + 80;
    if (!near) { toward(0, 0); return; }
    var dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
    toward(Math.max(-14, Math.min(14, dx * 0.04)), Math.max(-8, Math.min(8, dy * 0.12)));
  });
  footer.addEventListener('pointerleave', function () { toward(0, 0); });
  window.addEventListener('hashchange', function () {
    gx = gy = gtx = gty = 0;
    cta.style.translate = '';
    if (arrow) arrow.style.translate = '';
  });
})();
