(function () {
  "use strict";
  // Home — the system window beside the four chapters (it took the place of
  // the pink route). One window beside the portrait; its content follows the
  // story:
  //   01 SUPPORT      a service-desk ticket, Open → In progress → Resolved
  //   02 SOFTWARE     an editor writes three small files; the preview shows
  //                   the website component those lines build
  //   03 SYSTEMS      machine → Python → SQL → overview, data travelling
  //   04 IMPROVEMENT  an automation flow (a concept) running to its end
  // It has no loop of its own: it hooks into window.akifHomeFx, which home.js
  // calls from its own eased scroll loop (and right away on arriving on Home,
  // the route fix). Every state is a function of the scroll position alone,
  // so scrolling back always lands on the matching state, and every write
  // to the page only happens when the value changes.
  var homeView = document.getElementById('homeView');
  if (!homeView || !window.akifHomeFx) return;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function clamp01(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function map(v, a, b) { return clamp01((v - a) / (b - a)); }
  function lang() { return document.documentElement.lang === 'en' ? 'en' : 'nl'; }
  function esc(s) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

  // ---------- the story's timing (vh), the same moments as the chapters on the left ----------
  // the hand-offs: where the chapter text on the left changes (its old block
  // is gone, the new one starts); each scene builds while its chapter is read
  // around each hand-off the old scene leaves (from 8vh before to 6vh after
  // it) while the new one already comes in (from 6vh before to 8vh after):
  // at the hand-off both stand at ~0.43, so the window is never empty and
  // never shows two scenes in full; the old one moves up and the new one up
  // into place, one motion. The bar's words dim for ±8vh only
  var MIDS = [186, 286, 386], OUT = [8, 6], IN = [6, 8], DIP = 8;
  // finished a little before each chapter has settled (140/240/340/440 + ~6),
  // so the complete state is there while the chapter is still fully read
  var BUILD = [[88, 146], [192, 246], [292, 346], [392, 444]];
  var SHOW = [62, 100], HIDE = [468, 510];

  var T = {
    nl: {
      chapters: ['support', 'software', 'systems', 'improvement'],
      status: { open: 'open', progress: 'bezig', resolved: 'opgelost', writing: 'schrijven', live: 'live', processing: 'verwerken', current: 'actueel', waiting: 'wacht op trigger', running: 'actief', done: 'voltooid' },
      t1: { id: 'INC-2041 · voorbeeldticket', title: 'Laptop maakt geen verbinding met wifi', meta: [['Melder', 'Medewerker'], ['Werkplek', 'Laptop'], ['Prioriteit', 'Normaal']], pill: ['Open', 'In progress', 'Resolved'],
            steps: [['Melding', 'Ticket ontvangen', 'via de servicedesk'], ['Diagnose', 'Oorzaak gezocht', ''], ['Oplossing', 'Adapter ingeschakeld', 'driver bijgewerkt'], ['Gesloten', 'Gebruiker heeft weer verbinding', 'ticket opgelost']],
            checks: ['Netwerk', 'Account', 'Wifi-adapter'] },
      link: 'Bekijk case',
      t3: { title: 'Machinegegevens verwerken', sub: 'datastroom · voorbeelddata', nodes: [['Machine', 'M-04'], ['Python', 'collector.py'], ['SQL', 'metingen'], ['Overzicht', 'monitoring']],
            panes: ['Machine · meting', 'Python · verwerken', 'SQL · tabel metingen', 'Overzicht · laatste metingen'], head: ['machine', 'tijd', '°C'], foot: 'voorbeeldwaarden · laatste meting 12:05',
            mline: ['{ "machine": "M-04", "temp": 71.4 }', 'parse → afronden → opslaan', 'INSERT INTO metingen · 3 rijen', 'M-07 · 73,1 °C · hoogste meting'] },
      t4: { title: 'Aanvraag verwerken', concept: 'concept', end: 'Afgerond', step: 'stap {n} van 4', done: 'flow voltooid',
            steps: [['Trigger', 'Nieuwe aanvraag ontvangen', 'formulier · webhook'], ['API', 'Gegevens ophalen', 'GET /api/aanvragen/{id}'], ['Verwerken', 'Prioriteit bepalen', "if prioriteit == 'hoog'"], ['Bijwerken', 'Opslaan en melden', 'SQL · e-mail']] },
      concept: 'concept'
    },
    en: {
      chapters: ['support', 'software', 'systems', 'improvement'],
      status: { open: 'open', progress: 'in progress', resolved: 'resolved', writing: 'writing', live: 'live', processing: 'processing', current: 'up to date', waiting: 'waiting for trigger', running: 'running', done: 'completed' },
      t1: { id: 'INC-2041 · sample ticket', title: "Laptop won't connect to Wi-Fi", meta: [['Reported by', 'Employee'], ['Device', 'Laptop'], ['Priority', 'Normal']], pill: ['Open', 'In progress', 'Resolved'],
            steps: [['Report', 'Ticket received', 'via the service desk'], ['Diagnosis', 'Cause found', ''], ['Fix', 'Adapter switched on', 'driver updated'], ['Closed', 'User is connected again', 'ticket resolved']],
            checks: ['Network', 'Account', 'Wi-Fi adapter'] },
      link: 'View case',
      t3: { title: 'Processing machine data', sub: 'data flow · sample data', nodes: [['Machine', 'M-04'], ['Python', 'collector.py'], ['SQL', 'readings'], ['Overview', 'monitoring']],
            panes: ['Machine · reading', 'Python · processing', 'SQL · table readings', 'Overview · latest readings'], head: ['machine', 'time', '°C'], foot: 'sample values · last reading 12:05',
            mline: ['{ "machine": "M-04", "temp": 71.4 }', 'parse → round → store', 'INSERT INTO readings · 3 rows', 'M-07 · 73.1 °C · highest reading'] },
      t4: { title: 'Process a request', concept: 'concept', end: 'Completed', step: 'step {n} of 4', done: 'flow completed',
            steps: [['Trigger', 'New request received', 'form · webhook'], ['API', 'Fetch the data', 'GET /api/requests/{id}'], ['Process', 'Set the priority', "if priority == 'high'"], ['Update', 'Save and notify', 'SQL · e-mail']] },
      concept: 'concept'
    }
  };
  var SKILLS = ['Hardware · Troubleshooting · End users', 'HTML / CSS · JavaScript · PHP / C#', 'Python · SQL · Machine data', "Process · Automation · API's"];

  // ---- icons: simple strokes, one weight ----
  var I = {
    bell: '<svg viewBox="0 0 16 16"><path d="M4 11V7a4 4 0 0 1 8 0v4l1 1.5H3zM6.5 14a1.6 1.6 0 0 0 3 0"/></svg>',
    search: '<svg viewBox="0 0 16 16"><circle cx="7" cy="7" r="4.5"/><path d="m10.5 10.5 3.5 3.5"/></svg>',
    wrench: '<svg viewBox="0 0 16 16"><path d="M10.5 2.2a3.5 3.5 0 0 0-4 4.6L2.3 11a1.5 1.5 0 0 0 2.1 2.1l4.3-4.2a3.5 3.5 0 0 0 4.6-4L11 7.2 8.8 5z"/></svg>',
    check: '<svg viewBox="0 0 16 16"><path d="m3 8.5 3 3 7-7"/></svg>',
    bolt: '<svg viewBox="0 0 16 16"><path d="M9 1.5 3.5 9H8l-1 5.5L12.5 7H8z"/></svg>',
    braces: '<svg viewBox="0 0 16 16"><path d="M5.5 2.5c-2 0-2 1.5-2 3s-1 2.5-2 2.5c1 0 2 1 2 2.5s0 3 2 3M10.5 2.5c2 0 2 1.5 2 3s1 2.5 2 2.5c-1 0-2 1-2 2.5s0 3-2 3"/></svg>',
    branch: '<svg viewBox="0 0 16 16"><path d="M4 2.5v11M4 8h4.5a3 3 0 0 0 3-3V2.5M11.5 13.5V11"/><circle cx="11.5" cy="9.5" r="1.5"/></svg>',
    db: '<svg viewBox="0 0 16 16"><ellipse cx="8" cy="3.5" rx="5" ry="2"/><path d="M3 3.5v9c0 1.1 2.2 2 5 2s5-.9 5-2v-9M3 8c0 1.1 2.2 2 5 2s5-.9 5-2"/></svg>',
    machine: '<svg viewBox="0 0 16 16"><rect x="2" y="4" width="12" height="9" rx="1.5"/><path d="M5 4V2.5M11 4V2.5M5 8.5h2M9.5 8.5h1.5"/></svg>',
    code: '<svg viewBox="0 0 16 16"><path d="m5.5 4.5-3.5 3.5 3.5 3.5M10.5 4.5 14 8l-3.5 3.5M9 2.5 7 13.5"/></svg>',
    chart: '<svg viewBox="0 0 16 16"><path d="M2.5 13.5h11M4.5 11V8M8 11V4.5M11.5 11V6.5"/></svg>',
    cursor: '<svg viewBox="0 0 16 16"><path d="M3 2l9 6.5-4 .8 2.4 4.2-1.6.9-2.4-4.2L3 13z"/></svg>'
  };

  // ---------- the window ----------
  var sx = document.createElement('aside');
  sx.className = 'sx';
  // an illustration of the story beside it: the chapter text says it in
  // words, so screen readers skip it; it has nothing to focus or click
  sx.setAttribute('aria-hidden', 'true');
  sx.innerHTML =
    '<div class="sx-frame">' +
      '<div class="sx-bar"><span class="sx-path">akif / <b class="sx-where"></b></span><span class="sx-status"><i></i><span class="sx-state"></span></span></div>' +
      '<div class="sx-body">' +
        // 01
        '<section class="sx-scene sx-s1"><div class="sx-head"><div><span class="sx-sub s1-id"></span><h3 class="sx-title s1-title"></h3></div><span class="sx-pill s1-pill"></span></div>' +
          '<div class="sx-ticket-meta">' + [0, 1, 2].map(function () { return '<div><b></b><span></span></div>'; }).join('') + '</div>' +
          stepsHTML([I.bell, I.search, I.wrench, I.check], false) + '<div class="sx-mline s1-m"></div></section>' +
        // 02
        '<section class="sx-scene sx-s2"><div class="sx-tabs">' + ['index.html', 'style.css', 'app.js'].map(function (n) { return '<span class="sx-tab"><i></i>' + n + '</span>'; }).join('') + '</div>' +
          '<div class="sx-editor"><div class="sx-editor-in"></div></div>' +
          '<div class="sx-preview"><div class="sx-preview-bar"><span>index.html</span><span class="s2-pv"></span></div>' +
          '<div class="sx-stage"><div class="pv-card"><h3>Van der Hammen Gym</h3><p>HTML · CSS · JavaScript</p><span class="pv-link"></span><span class="pv-cursor">' + I.cursor + '</span></div></div></div></section>' +
        // 03
        '<section class="sx-scene sx-s3"><div class="sx-head"><div><span class="sx-sub s3-sub"></span><h3 class="sx-title s3-title"></h3></div><span class="sx-chip s3-chip"></span></div>' +
          '<div class="sx-sys">' + [I.machine, I.code, I.db, I.chart].map(function (ic) { return '<div class="sx-node"><span class="sx-ico">' + ic + '</span><b></b><span></span></div>'; }).join('') +
            [0, 1, 2].map(function () { return '<span class="sx-link"><i></i></span><span class="sx-pulse"></span>'; }).join('') + '</div>' +
          '<div class="sx-detail">' +
            '<div class="sx-dpane"><span class="sx-dlabel"></span><pre class="sx-pre">{\n  "machine": "M-04",\n  "temp": 71.4,\n  "status": "run"\n}</pre></div>' +
            '<div class="sx-dpane"><span class="sx-dlabel"></span><pre class="sx-pre s3-py"></pre></div>' +
            '<div class="sx-dpane"><span class="sx-dlabel"></span><table class="sx-table"><thead><tr><th></th><th></th><th></th></tr></thead><tbody>' +
              [['M-02', '12:04', '68.9'], ['M-04', '12:04', '71.4'], ['M-07', '12:05', '73.1']].map(function (r) { return '<tr><td>' + r[0] + '</td><td>' + r[1] + '</td><td>' + r[2] + '</td></tr>'; }).join('') + '</tbody></table></div>' +
            '<div class="sx-dpane"><span class="sx-dlabel"></span><ul class="sx-bars">' +
              [['M-02', 68.9], ['M-04', 71.4], ['M-07', 73.1]].map(function (r, i) { return '<li' + (i === 2 ? ' class="is-hi"' : '') + '><span>' + r[0] + '</span><span class="sx-bar-track"><i style="--w:' + ((r[1] - 50) / 30).toFixed(3) + '"></i></span><span class="s3-val">' + r[1] + '</span></li>'; }).join('') +
              '</ul><div class="sx-bars-foot"></div></div>' +
          '</div><div class="sx-mline s3-m"></div></section>' +
        // 04
        '<section class="sx-scene sx-s4"><div class="sx-head"><div><span class="sx-sub">flow</span><h3 class="sx-title s4-title"></h3></div><span class="sx-chip s4-chip"></span></div>' +
          stepsHTML([I.bolt, I.braces, I.branch, I.db], true) +
          '<div class="sx-run"><span class="s4-run"></span><span class="sx-run-bar"><i></i><i></i><i></i><i></i></span></div><div class="sx-mline s4-m"></div></section>' +
      '</div>' +
      '<div class="sx-foot"><span class="sx-story"><i></i><i></i><i></i><i></i><b class="sx-num"></b></span><span class="sx-skills"></span></div>' +
    '</div>';
  homeView.appendChild(sx);

  function stepsHTML(icons, withEnd) {
    return '<ol class="sx-steps"><span class="sx-wire"><i></i></span><span class="sx-token"></span>' +
      icons.map(function (ic) { return '<li class="sx-step"><span class="sx-ico">' + ic + '</span><span class="sx-txt"><b></b><span></span></span><span class="sx-kind"></span></li>'; }).join('') +
      '</ol>' + (withEnd ? '<div class="sx-end"><span class="sx-end-dot"></span><b></b></div>' : '');
  }
  function q(s, r) { return (r || sx).querySelector(s); }
  function qa(s, r) { return [].slice.call((r || sx).querySelectorAll(s)); }
  var scenes = qa('.sx-scene');

  // ---------- the steps (01 and 04): a run going through them, with the light ----------
  function Steps(scene) {
    var ol = q('.sx-steps', scene), items = qa('.sx-step', scene), end = q('.sx-end', scene);
    var wire = q('.sx-wire', scene), fill = wire.firstChild, token = q('.sx-token', scene), centres = [], phone = false;
    return {
      items: items, end: end,
      measure: function () {
        phone = window.innerWidth <= 780;
        var box = ol.getBoundingClientRect(), k = (sx.getBoundingClientRect().width / sx.offsetWidth) || 1;
        function c(el) { var r = el.getBoundingClientRect(); return [(r.left + r.width / 2 - box.left) / k, (r.top + r.height / 2 - box.top) / k]; }
        centres = items.map(function (it) { return c(q('.sx-ico', it)); });
        if (end && !phone) centres.push(c(q('.sx-end-dot', end)));
        var a = centres[0], b = centres[centres.length - 1];
        if (phone) { wire.style.cssText = 'left:' + a[0] + 'px;top:' + a[1] + 'px;width:' + (b[0] - a[0]) + 'px;height:1px'; fill.style.transformOrigin = '0 50%'; }
        else { wire.style.cssText = 'left:' + (a[0] - 0.5) + 'px;top:' + a[1] + 'px;height:' + (b[1] - a[1]) + 'px;width:1px'; fill.style.transformOrigin = '50% 0'; }
      },
      // t: 0..n (n = the number of steps): in step i while i <= t < i + 1
      update: function (t) {
        var n = items.length, end_ = centres.length - 1;
        items.forEach(function (it, i) { it.classList.toggle('is-done', t >= i + 1); it.classList.toggle('is-busy', t > i && t < i + 1); });
        if (end) end.classList.toggle('is-done', t >= n);
        var pos = Math.min(t, end_), k = Math.min(end_, Math.floor(pos)), f = pos - k, a = centres[k] || [0, 0], b = centres[Math.min(end_, k + 1)] || a;
        token.style.transform = 'translate(' + (a[0] + (b[0] - a[0]) * f).toFixed(1) + 'px,' + (a[1] + (b[1] - a[1]) * f).toFixed(1) + 'px)';
        token.style.opacity = t > 0 && t < n && !reduce ? 1 : 0;
        fill.style.transform = (phone ? 'scaleX(' : 'scaleY(') + (end_ > 0 ? pos / end_ : 0).toFixed(4) + ')';
      }
    };
  }

  // ===================== 01 — the service desk =====================
  var s1 = scenes[0], st1 = Steps(s1), pill = q('.s1-pill', s1), checks = null;
  function label1(L) {
    q('.s1-id', s1).textContent = L.t1.id;
    q('.s1-title', s1).textContent = L.t1.title;
    qa('.sx-ticket-meta > div', s1).forEach(function (d, i) { d.firstChild.textContent = L.t1.meta[i][0]; d.lastChild.textContent = L.t1.meta[i][1]; });
    st1.items.forEach(function (it, i) { q('b', it).textContent = L.t1.steps[i][1]; q('.sx-kind', it).textContent = L.t1.steps[i][0]; q('.sx-txt span', it).textContent = L.t1.steps[i][2]; });
    // the diagnosis: three checks, the last one finds the cause
    var sub = q('.sx-txt span', st1.items[1]);
    sub.className = 'sx-checks';
    sub.innerHTML = L.t1.checks.map(function (c, i) { return '<em class="' + (i < 2 ? 'ok' : 'bad') + '">' + c + '</em>'; }).join('');
    checks = qa('em', sub);
  }
  function update1(p, L) {
    var t = p * 4, ps = t >= 4 ? 2 : t >= 1 ? 1 : 0;
    st1.update(t);
    checks.forEach(function (c, i) { c.classList.toggle('is-on', t >= 1.25 + i * 0.25); });
    pill.textContent = L.t1.pill[ps];
    pill.setAttribute('data-s', ['open', 'progress', 'resolved'][ps]);
    var now = Math.min(3, Math.floor(t));
    q('.s1-m', s1).textContent = t >= 4 ? 'Resolved · ' + L.t1.steps[3][1] : L.t1.steps[now][0] + ' · ' + L.t1.steps[now][1];
    return t >= 4 ? ['done', L.status.resolved] : t >= 1 ? ['busy', L.status.progress] : ['idle', L.status.open];
  }

  // ===================== 02 — the editor and the website it builds =====================
  // three small files, every line at most 37 characters (it fits the
  // narrowest window); each finished line adds exactly what the preview gains
  function prop(p, v) { return [['', '  '], ['t-prop', p], ['t-dim', ': '], ['', v], ['t-dim', ';']]; }
  function files(L) {
    return [
      { name: 'index.html', lines: [
        [['t-tag', '<article'], ['t-attr', ' class='], ['t-str', '"card"'], ['t-tag', '>']],
        [['', '  '], ['t-tag', '<h3>'], ['', 'Van der Hammen Gym'], ['t-tag', '</h3>']],
        [['', '  '], ['t-tag', '<p>'], ['', 'HTML · CSS · JavaScript'], ['t-tag', '</p>']],
        [['', '  '], ['t-tag', '<a'], ['t-attr', ' class='], ['t-str', '"btn"'], ['t-attr', ' href='], ['t-str', '"#/work"'], ['t-tag', '>']],
        [['', '    ' + L.link], ['t-tag', '</a>']],
        [['t-tag', '</article>']]
      ] },
      { name: 'style.css', lines: [
        [['t-sel', '.card'], ['t-dim', ' {']],
        prop('font', '15px system-ui'),
        prop('padding', '20px'),
        prop('border-radius', '12px'),
        prop('background', '#141210'),
        prop('color', '#f7f3ea'),
        [['t-dim', '}']],
        [['t-sel', '.btn'], ['t-dim', ' {']],
        prop('padding', '6px 14px'),
        prop('background', '#af2d53'),
        [['', '  '], ['t-prop', 'color'], ['t-dim', ': '], ['', '#fff'], ['t-dim', '; '], ['t-prop', 'border-radius'], ['t-dim', ': '], ['', '99px'], ['t-dim', ';']],
        [['t-dim', '}']]
      ] },
      { name: 'app.js', lines: [
        [['t-kw', 'const'], ['', ' card =']],
        [['', '  document.'], ['t-fn', 'querySelector'], ['', '('], ['t-str', "'.card'"], ['', ');']],
        [['', 'card.onmouseenter = () =>']],
        [['', '  card.classList.'], ['t-fn', 'add'], ['', '('], ['t-str', "'is-active'"], ['', ');']]
      ] }
    ];
  }
  // which finished line (index in all three files together) adds which class
  var ADDS = [[0, 'h-card'], [1, 'h-h3'], [2, 'h-p'], [4, 'h-a'], [7, 'c-font'], [8, 'c-pad'], [9, 'c-rad'], [10, 'c-bg'], [11, 'c-col'], [14, 'b-pad'], [15, 'b-bg'], [16, 'b-col'], [21, 'is-active']];
  var s2 = scenes[1], tabs = qa('.sx-tab', s2), editorIn = q('.sx-editor-in', s2), pvCard = q('.pv-card', s2), pvState = q('.s2-pv', s2);
  var F2 = [], flat = [], total2 = 0, shownFile = -1, rows = [];
  function label2(L) {
    F2 = files(L); flat = []; total2 = 0;
    F2.forEach(function (f, fi) { f.lines.forEach(function (l, li) { var len = l.reduce(function (s, t) { return s + t[1].length; }, 0); flat.push({ f: fi, i: li, tokens: l, len: len }); total2 += len; }); });
    q('.pv-link', s2).textContent = L.link;
    shownFile = -1;
  }
  function render(tokens, n) {
    var html = '', left = n;
    for (var k = 0; k < tokens.length && left > 0; k++) { var s = tokens[k][1].slice(0, left); left -= s.length; html += tokens[k][0] ? '<span class="' + tokens[k][0] + '">' + esc(s) + '</span>' : esc(s); }
    return html;
  }
  function showFile(fi) {
    shownFile = fi;
    editorIn.innerHTML = '';
    rows = F2[fi].lines.map(function (l, i) {
      var r = document.createElement('div');
      r.className = 'sx-ln';
      r.innerHTML = '<span class="n">' + (i + 1) + '</span><span class="c"></span>';
      editorIn.appendChild(r);
      return { row: r, c: r.lastChild, shown: -1 };
    });
  }
  function update2(p, L) {
    var n = Math.round(p * total2), rest = n, done = 0, cur = -1;
    var shownChars = flat.map(function (l, gi) { var s = Math.max(0, Math.min(l.len, rest)); rest -= s; if (s === l.len && done === gi) done = gi + 1; return s; });
    cur = done < flat.length ? done : -1;
    // the file being written is the one on screen; finished at the end: the last file
    var fi = cur >= 0 ? flat[cur].f : F2.length - 1;
    if (fi !== shownFile) showFile(fi);
    var phone = window.innerWidth <= 780, lh = phone ? 13 : 19.5, vis = phone ? 3 : 9, curLine = cur >= 0 ? flat[cur].i : F2[fi].lines.length - 1;
    flat.forEach(function (l, gi) {
      if (l.f !== fi) return;
      var r = rows[l.i], s = shownChars[gi];
      if (s !== r.shown) { r.shown = s; r.c.innerHTML = render(l.tokens, s) + (gi === cur ? '<span class="sx-caret"></span>' : ''); }
      var exists = s > 0 || gi === cur || (l.i === 0 && cur >= 0 && flat[cur].f === fi);
      r.row.style.visibility = exists ? '' : 'hidden';
      r.row.classList.toggle('is-now', gi === cur);
    });
    // keep the line being written in view (on phones: in the middle of three)
    var off = phone ? Math.max(0, curLine - 1) : Math.max(0, curLine - (vis - 2));
    off = Math.min(off, Math.max(0, F2[fi].lines.length - vis));
    editorIn.style.transform = 'translateY(' + (-off * lh) + 'px)';
    tabs.forEach(function (t, i) { t.classList.toggle('is-now', i === fi && cur >= 0); t.classList.toggle('is-done', cur < 0 ? true : i < fi); });
    ADDS.forEach(function (a) { pvCard.classList.toggle(a[1], done > a[0]); });
    var live = cur < 0;
    pvState.textContent = live ? 'live' : 'preview';
    pvState.classList.toggle('is-live', live);
    return live ? ['done', L.status.live] : ['busy', L.status.writing];
  }

  // ===================== 03 — systems that talk to each other =====================
  var s3 = scenes[2], nodes = qa('.sx-node', s3), links = qa('.sx-link', s3), pulses = qa('.sx-pulse', s3), panes = qa('.sx-dpane', s3);
  var rowsT = qa('.sx-table tbody tr', s3), bars = qa('.sx-bar-track i', s3), linkGeo = [];
  function label3(L) {
    q('.s3-title', s3).textContent = L.t3.title;
    q('.s3-sub', s3).textContent = L.t3.sub;
    q('.s3-chip', s3).textContent = L.concept;
    nodes.forEach(function (n, i) { q('b', n).textContent = L.t3.nodes[i][0]; n.lastChild.textContent = L.t3.nodes[i][1]; });
    panes.forEach(function (p, i) { q('.sx-dlabel', p).innerHTML = '<em>0' + (i + 1) + '</em>' + esc(L.t3.panes[i]); });
    q('.s3-py', s3).innerHTML = '<span class="t-kw">row</span> = parse(payload)\nrow[<span class="t-str">"temp"</span>] = round(row[<span class="t-str">"temp"</span>], 1)\ndb.insert(<span class="t-str">"' + (lang() === 'en' ? 'readings' : 'metingen') + '"</span>, row)';
    qa('th', s3).forEach(function (th, i) { th.textContent = L.t3.head[i]; });
    q('.sx-bars-foot', s3).textContent = L.t3.foot;
    qa('.s3-val', s3).forEach(function (v, i) { var n = [68.9, 71.4, 73.1][i]; v.textContent = (lang() === 'en' ? n.toFixed(1) : n.toFixed(1).replace('.', ',')) + ' °C'; });
  }
  function measure3() {
    var box = q('.sx-sys', s3).getBoundingClientRect(), k = (sx.getBoundingClientRect().width / sx.offsetWidth) || 1;
    var c = nodes.map(function (n) { var r = q('.sx-ico', n).getBoundingClientRect(); return [(r.left - box.left) / k, (r.top + r.height / 2 - box.top) / k, r.width / k]; });
    linkGeo = links.map(function (l, i) {
      var x0 = c[i][0] + c[i][2] + 6, x1 = c[i + 1][0] - 6, y = c[i][1];
      l.style.cssText = 'left:' + x0 + 'px;top:' + y + 'px;width:' + Math.max(0, x1 - x0) + 'px';
      return [x0, x1, y];
    });
  }
  function update3(p, L) {
    var s = p * 4; // node k is in view while k <= s < k + 1
    var now = Math.min(3, Math.floor(s));
    nodes.forEach(function (n, i) { n.classList.toggle('is-on', s > 0 && i <= now); n.classList.toggle('is-now', s > 0 && s < 4 && i === now); });
    // the data travelling: over link j while the stage goes from j + 0.45 to j + 1
    links.forEach(function (l, j) {
      var f = map(s, j + 0.45, j + 1), g = linkGeo[j] || [0, 0, 0];
      l.firstChild.style.transform = 'scaleX(' + f.toFixed(3) + ')';
      pulses[j].style.transform = 'translate(' + (g[0] + (g[1] - g[0]) * f).toFixed(1) + 'px,' + g[2].toFixed(1) + 'px)';
      pulses[j].style.opacity = f > 0 && f < 1 && !reduce ? 1 : 0;
    });
    panes.forEach(function (pn, i) { pn.classList.toggle('is-on', i === now); });
    rowsT.forEach(function (r, i) { r.classList.toggle('is-on', s >= 2.2 + i * 0.25 || s >= 3); });
    bars.forEach(function (b) { b.style.transform = 'scaleX(' + (s >= 3 ? b.style.getPropertyValue('--w') : 0) + ')'; });
    q('.s3-m', s3).textContent = L.t3.mline[now];
    return s >= 4 ? ['done', L.status.current] : s > 0 ? ['busy', L.status.processing] : ['idle', L.status.waiting];
  }

  // ===================== 04 — the automation flow (a concept) =====================
  var s4 = scenes[3], st4 = Steps(s4), runSegs = qa('.sx-run-bar i', s4);
  function label4(L) {
    q('.s4-title', s4).textContent = L.t4.title;
    q('.s4-chip', s4).textContent = L.t4.concept;
    st4.items.forEach(function (it, i) { q('b', it).textContent = L.t4.steps[i][1]; q('.sx-txt span', it).textContent = L.t4.steps[i][2]; q('.sx-kind', it).textContent = L.t4.steps[i][0]; });
    q('b', st4.end).textContent = L.t4.end;
  }
  function update4(p, L) {
    var t = p * 4;
    st4.update(t);
    var nStep = Math.min(4, Math.floor(t) + 1);
    var txt = t >= 4 ? L.t4.done : t > 0 ? L.t4.step.replace('{n}', nStep) : L.status.waiting;
    q('.s4-run', s4).textContent = txt;
    q('.s4-m', s4).textContent = t >= 4 ? L.t4.done : t > 0 ? L.t4.steps[nStep - 1][0] + ' · ' + L.t4.steps[nStep - 1][1] : L.status.waiting;
    runSegs.forEach(function (seg, i) { seg.className = t >= i + 1 ? 'is-done' : (t > i ? 'is-busy' : ''); });
    return t >= 4 ? ['done', L.status.done] : t > 0 ? ['busy', L.status.running] : ['idle', L.status.waiting];
  }

  var UPDATE = [update1, update2, update3, update4];
  var storySegs = qa('.sx-story i');

  // ---------- layout: measured once per size ----------
  var layoutKey = '';
  function measure() {
    var key = window.innerWidth + 'x' + window.innerHeight;
    if (key === layoutKey) return;
    layoutKey = key;
    var h = window.innerHeight, phone = window.innerWidth <= 780, need = 42 + 420 + 40 + 2, fit;
    if (phone) {
      // phones: the card sits between the longest chapter list and the
      // bottom edge (the same size in every chapter); it never covers the
      // list, and where there is far too little room it steps aside
      sx.style.setProperty('--sx-fit', 1);
      sx.classList.remove('is-away');
      var listBottom = Math.max.apply(null, qa('.story-block .stage-list', homeView).map(function (l) { return l.getBoundingClientRect().bottom; }));
      var room = h - 76 - (listBottom + 16);
      fit = Math.min(1, room / sx.offsetHeight);
      if (fit < 0.7) sx.classList.add('is-away');
    } else {
      fit = Math.min(1, (h - h * 0.16 - 24) / need);
    }
    sx.style.setProperty('--sx-fit', fit.toFixed(3));
    st1.measure(); st4.measure(); measure3();
    last = {};
  }
  var labelled = '';
  function labels() {
    labelled = lang();
    var L = T[labelled];
    label1(L); label2(L); label3(L); label4(L);
    last = {};
  }

  // ---------- the state for a scroll position (vh) ----------
  var last = {};
  function set(key, v, fn) { if (last[key] !== v) { last[key] = v; fn(v); } }
  function update(vh) {
    // a language chosen on /about, /experience or /contact comes back with
    // the page, without akif:langchange: the window follows <html lang>
    if (lang() !== labelled) { labels(); layoutKey = ''; }
    measure();
    var L = T[lang()];
    // the window: in with chapter 01, out with the chapter break
    var show = map(vh, SHOW[0], SHOW[1]) * (1 - map(vh, HIDE[0], HIDE[1]));
    set('show', show.toFixed(3), function (v) {
      sx.style.opacity = v;
      sx.style.transform = 'translateY(' + ((1 - Math.min(1, +v * 1.4)) * 14).toFixed(1) + 'px)';
    });
    // the chapter in view: the same hand-off moments as the text on the left
    var cur = vh < MIDS[0] ? 0 : vh < MIDS[1] ? 1 : vh < MIDS[2] ? 2 : 3;
    // the scenes: the old one rises a little and goes while the new one rises
    // into place (a short overlap around the hand-off, never an empty window)
    scenes.forEach(function (sc, k) {
      var a = k === 0 ? 1 : map(vh, MIDS[k - 1] - IN[0], MIDS[k - 1] + IN[1]);
      var b = k === 3 ? 0 : map(vh, MIDS[k] - OUT[0], MIDS[k] + OUT[1]);
      var o = a * (1 - b);
      set('o' + k, o.toFixed(3), function (v) {
        sc.style.opacity = v;
        sc.style.transform = reduce ? '' : 'translateY(' + ((1 - a) * 12 - b * 12).toFixed(1) + 'px)';
        sc.classList.toggle('is-on', +v > 0);
      });
    });
    // each scene's own progress; reduced motion: every chapter shown complete
    // (home.js eases towards the scroll position and snaps within 0.02vh, so
    // the last thousandth counts as done); rounded to the same thousandths the
    // cache keys on, so a scene is never left drawn at a value it skips
    var P = BUILD.map(function (r, k) { var p = reduce ? (k <= cur ? 1 : 0) : map(vh, r[0], r[1]); return p > 0.995 ? 1 : +p.toFixed(3); });
    var res = null;
    P.forEach(function (p, k) {
      var r = null;
      set('p' + k, p.toFixed(3), function () { r = UPDATE[k](p, L); last['r' + k] = r; });
      if (k === cur) res = r || last['r' + k];
    });
    if (!res) res = UPDATE[cur](P[cur], L);
    // the bar and the foot: the chapter in view; its words dim out and back
    // in around each hand-off, so they never change while they can be read
    var near = Math.min.apply(null, MIDS.map(function (m) { return Math.abs(vh - m); }));
    var dip = reduce ? 1 : clamp01(near / DIP);
    set('dip', dip.toFixed(2), function (v) { q('.sx-path').style.opacity = v; q('.sx-state').style.opacity = v; q('.sx-skills').style.opacity = v; });
    set('cur', cur + lang(), function () {
      q('.sx-where').textContent = L.chapters[cur];
      q('.sx-num').textContent = '0' + (cur + 1);
      q('.sx-skills').textContent = SKILLS[cur];
    });
    set('state', res[0], function (v) { sx.setAttribute('data-state', v); });
    set('word', res[1], function (v) { q('.sx-state').textContent = v; });
    // the story so far: four parts, each filling as its chapter is built
    storySegs.forEach(function (seg, k) {
      set('seg' + k, P[k].toFixed(3) + (k < cur), function () { seg.style.setProperty('--f', P[k].toFixed(3)); seg.classList.toggle('is-past', k < cur); });
    });
  }

  labels();
  var lastVh = (window.scrollY / window.innerHeight) * 100;
  update(lastVh);
  var orig = window.akifHomeFx;
  window.akifHomeFx = function (vh, mobile, s) { orig(vh, mobile, s); lastVh = vh; update(vh); };
  window.addEventListener('resize', function () { layoutKey = ''; update(lastVh); });
  // another language: other text lengths, so measure again (the chapter
  // lists on phones, the flow's rows)
  document.addEventListener('akif:langchange', function () { labels(); layoutKey = ''; update(lastVh); });
  // back on Home: i18n.js sets the page language on hashchange, after the
  // router drew Home (this listener comes after both)
  window.addEventListener('hashchange', function () { if (!homeView.hidden && lang() !== labelled) update(lastVh); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { layoutKey = ''; update(lastVh); });
})();
