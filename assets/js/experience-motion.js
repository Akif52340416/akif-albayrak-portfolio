(function () {
  "use strict";
  // /experience — the archive drawer (concept 05), on top of experience.js.
  // The index rows stay the navigation (and the whole index without JS);
  // this adds a view of the five files that follows the choice:
  //   wide screens  a drawer in 3D next to the rows: the chosen file stands
  //                 in front, the others wait behind it with their tabs in
  //                 sight. A row (hover, focus, arrow keys) or a tab picks a
  //                 file; Enter on the row or a click on the card opens it.
  //   ≤ 980px       a stack of cards in place of the rows: swipe, or the
  //                 buttons / arrow keys, and "Open file" on the card in front
  // Every text on the cards is read from the rows and the files themselves,
  // again after each NL/EN switch: nothing is written twice. Motion is CSS
  // transitions only (none with reduced motion); nothing runs by itself.
  var view = document.getElementById('experienceView');
  var rowsList = document.getElementById('xaRows');
  var preview = document.getElementById('xaPreview');
  if (!view || !rowsList || !preview) return;
  var grid = rowsList.parentNode;
  var rows = [].slice.call(rowsList.querySelectorAll('.xa-row'));
  var n = rows.length;
  if (!n) return;
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var wide = window.matchMedia('(min-width: 981px)');

  function text(el) { return el ? el.textContent.replace(/\s+/g, ' ').trim() : ''; }
  function file(i) { return document.getElementById(rows[i].getAttribute('data-target')); }
  function open(i) { rows[i].click(); }   // experience.js scrolls to the file and focuses it

  // ---- what a card says, from the row and its file ----
  function content(i) {
    var r = rows[i], f = file(i);
    var more = r.querySelector('.xa-row-more [data-i18n]');
    return {
      num: text(r.querySelector('.xa-row-num')),
      nameA: text(f && f.querySelector('.xa-name-a')),
      nameB: text(f && f.querySelector('.xa-name-b')),
      period: text(r.querySelector('.xa-row-period')),
      theme: text(r.querySelector('.xa-row-theme')),
      role: text(r.querySelector('.xa-row-role')),
      desc: text(more),
      now: r.classList.contains('xa-row--now') ? text(f && f.querySelector('.xa-status')) : '',
      skills: f ? [].map.call(f.querySelectorAll('.xa-tech-list li'), text) : [],
      openLabel: text(preview.querySelector('.xa-preview-open [data-i18n]'))
    };
  }
  function esc(s) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;'); }
  function cardHTML(c, button) {
    return '<p class="xa-dc-tab"><span class="xa-dc-num">' + esc(c.num) + '</span><span class="xa-dc-co">' + esc(c.nameA) + '</span></p>' +
      '<div class="xa-dc-body">' +
        '<p class="xa-dc-meta"><span>' + esc(c.period) + '</span><span>' + esc(c.theme) + '</span>' + (c.now ? '<span class="xa-dc-now">' + esc(c.now) + '</span>' : '') + '</p>' +
        '<p class="xa-dc-name">' + esc(c.nameA) + ' <span>' + esc(c.nameB) + '</span></p>' +
        '<p class="xa-dc-role">' + esc(c.role) + '</p>' +
        '<p class="xa-dc-desc">' + esc(c.desc) + '</p>' +
        '<ul class="xa-dc-skills">' + c.skills.map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('') + '</ul>' +
        (button ? '<button type="button" class="xa-dc-open">' : '<p class="xa-dc-open">') + '<span>' + esc(c.openLabel) + '</span> <span class="xa-pink" aria-hidden="true">&rarr;</span>' + (button ? '</button>' : '</p>') +
      '</div>';
  }

  // ======================= the drawer (wide screens) =======================
  var drawer = document.createElement('div');
  drawer.className = 'xa-drawer';
  // a picture of the rows next to it: the rows are what a screen reader and
  // the keyboard use, so the drawer itself is hidden from them
  drawer.setAttribute('aria-hidden', 'true');
  var rig = document.createElement('div');
  rig.className = 'xa-drawer-rig';
  drawer.appendChild(rig);
  var dcards = rows.map(function (r, i) {
    var c = document.createElement('div');
    c.className = 'xa-dc';
    c.style.setProperty('--i', i);
    c.addEventListener('click', function () { if (c.classList.contains('is-front')) open(i); else select(i); });
    rig.appendChild(c);
    return c;
  });
  grid.appendChild(drawer);

  // ======================= the stack (≤ 980px) =======================
  var stack = document.createElement('div');
  stack.className = 'xa-stack';
  stack.setAttribute('role', 'group');
  stack.setAttribute('aria-roledescription', 'carousel');
  var deck = document.createElement('div');
  deck.className = 'xa-stack-deck';
  var scards = rows.map(function (r, i) {
    var c = document.createElement('div');
    c.className = 'xa-sc';
    c.setAttribute('role', 'group');
    c.setAttribute('aria-roledescription', 'slide');
    c.addEventListener('click', function (e) { if (e.target.closest('.xa-dc-open')) open(i); });
    deck.appendChild(c);
    return c;
  });
  var ctrl = document.createElement('div');
  ctrl.className = 'xa-stack-ctrl';
  ctrl.innerHTML = '<button type="button" class="xa-stack-btn" data-d="-1"><span aria-hidden="true">&larr;</span></button>' +
    '<p class="xa-stack-status" aria-live="polite"></p>' +
    '<button type="button" class="xa-stack-btn" data-d="1"><span aria-hidden="true">&rarr;</span></button>';
  var prevBtn = ctrl.children[0], status = ctrl.children[1], nextBtn = ctrl.children[2];
  stack.appendChild(deck);
  stack.appendChild(ctrl);
  grid.appendChild(stack);
  [prevBtn, nextBtn].forEach(function (b) { b.addEventListener('click', function () { select(sel + (+b.getAttribute('data-d'))); }); });
  stack.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); select(sel + (e.key === 'ArrowRight' ? 1 : -1)); }
  });

  // labels in the page's language (the buttons and the group)
  var L = {
    nl: { stack: 'Dossiers, één tegelijk', prev: 'Vorig dossier', next: 'Volgend dossier', of: 'van' },
    en: { stack: 'Files, one at a time', prev: 'Previous file', next: 'Next file', of: 'of' }
  };
  function lang() { return document.documentElement.lang === 'en' ? 'en' : 'nl'; }

  // ---- fill every card (again after a language switch) ----
  function fill() {
    var t = L[lang()];
    rows.forEach(function (r, i) {
      var c = content(i);
      dcards[i].innerHTML = cardHTML(c, false);
      scards[i].innerHTML = cardHTML(c, true);
      scards[i].setAttribute('aria-label', c.num + ' ' + t.of + ' 0' + n + ' — ' + c.nameA + ' ' + c.nameB);
    });
    stack.setAttribute('aria-label', t.stack);
    prevBtn.setAttribute('aria-label', t.prev);
    nextBtn.setAttribute('aria-label', t.next);
    paint();
  }

  // ---- the choice ----
  var sel = 0;
  function select(i) {
    i = Math.max(0, Math.min(n - 1, i));
    if (i === sel) return;
    sel = i;
    paint();
  }
  function paint() {
    // drawer: the chosen one in front, the others behind it in their order
    var rank = 0;
    dcards.forEach(function (c, k) {
      var r = k === sel ? 0 : ++rank;
      c.style.setProperty('--r', r);
      c.classList.toggle('is-front', r === 0);
    });
    // stack: the chosen one on top, the next ones under it; the ones before
    // it are put away (still there, behind, so a swipe back finds them)
    scards.forEach(function (c, k) {
      var d = k - sel;
      c.style.setProperty('--d', d);
      c.classList.toggle('is-front', d === 0);
      c.classList.toggle('is-gone', d < 0);
      c.setAttribute('aria-hidden', d === 0 ? 'false' : 'true');
      if (c.inert !== (d !== 0)) c.inert = d !== 0;
    });
    status.textContent = rows[sel] ? text(rows[sel].querySelector('.xa-row-num')) + ' / 0' + n + ' — ' + text(file(sel) && file(sel).querySelector('.xa-name-a')) : '';
    prevBtn.disabled = sel === 0;
    nextBtn.disabled = sel === n - 1;
  }

  // ---- the rows pick the file: hover, focus; arrow keys walk the rows ----
  rows.forEach(function (r, i) {
    r.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') select(i); });
    r.addEventListener('focus', function () { select(i); });
    r.addEventListener('keydown', function (e) {
      var j = e.key === 'ArrowDown' ? i + 1 : e.key === 'ArrowUp' ? i - 1 : e.key === 'Home' ? 0 : e.key === 'End' ? n - 1 : -1;
      if (j < 0 || j >= n) return;
      e.preventDefault();
      rows[j].focus();
    });
  });

  // ---- the drawer turns slightly towards the mouse (wide screens) ----
  if (finePointer && !reduceMotion) {
    drawer.addEventListener('pointermove', function (e) {
      if (e.pointerType !== 'mouse') return;
      var b = drawer.getBoundingClientRect();
      rig.style.setProperty('--tx', ((e.clientX - b.left) / b.width * 2 - 1).toFixed(3));
      rig.style.setProperty('--ty', ((e.clientY - b.top) / b.height * 2 - 1).toFixed(3));
    });
    drawer.addEventListener('pointerleave', function () { rig.style.setProperty('--tx', 0); rig.style.setProperty('--ty', 0); });
  }

  // ---- swiping the stack: the card on top follows the finger ----
  var drag = null;
  deck.addEventListener('pointerdown', function (e) {
    var c = scards[sel];
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    if (!c.contains(e.target) || e.target.closest('button')) return;
    drag = { x: e.clientX, y: e.clientY, dx: 0, id: e.pointerId, c: c, on: false };
  });
  deck.addEventListener('pointermove', function (e) {
    if (!drag || e.pointerId !== drag.id) return;
    drag.dx = e.clientX - drag.x;
    var dy = e.clientY - drag.y;
    // a vertical move is the page scrolling: let it go
    if (!drag.on) {
      if (Math.abs(dy) > 10 && Math.abs(dy) > Math.abs(drag.dx)) { drag = null; return; }
      if (Math.abs(drag.dx) < 8) return;
      drag.on = true;
      drag.c.classList.add('is-dragging');
      try { drag.c.setPointerCapture(e.pointerId); } catch (err) {}
    }
    // the ends of the stack give a little, but don't let go
    var end = (drag.dx > 0 && sel === 0) || (drag.dx < 0 && sel === n - 1);
    drag.c.style.setProperty('--dx', (end ? drag.dx * 0.3 : drag.dx).toFixed(1) + 'px');
  });
  function endDrag(e) {
    if (!drag || e.pointerId !== drag.id) return;
    var c = drag.c, dx = drag.dx, on = drag.on;
    drag = null;
    if (!on) return;
    c.classList.remove('is-dragging');
    c.style.removeProperty('--dx');
    if (Math.abs(dx) > Math.min(90, deck.offsetWidth * 0.22)) select(sel + (dx < 0 ? 1 : -1));
  }
  deck.addEventListener('pointerup', endDrag);
  deck.addEventListener('pointercancel', endDrag);

  // ---- NL / EN: experience.js rewrites the rows; read them again ----
  if ('MutationObserver' in window) {
    var again = 0;
    new MutationObserver(function () {
      if (again) return;
      again = window.requestAnimationFrame(function () { again = 0; fill(); });
    }).observe(rowsList, { childList: true, subtree: true, characterData: true });
  }
  window.addEventListener('hashchange', function () { setTimeout(fill, 0); });

  view.classList.add('xa-drawer-on');
  fill();
})();
