(function () {
  "use strict";
  // /experience — THE EXPERIENCE ARCHIVE: NL / EN (the same remembered
  // "akif-lang" choice as /about), the hero intro, the archive index
  // (preview on hover / focus, the middle row on phones, a click opens the
  // file), the archive transition (scroll-linked --p / --e / --q on each
  // file and the fixed indicator) and the fade-ups. Nothing holds the
  // scroll; motion only touches opacity / transform. With reduced motion
  // (or without JS) every file simply stands open.
  var view = document.getElementById('experienceView');
  if (!view) return;

  var EN = {
    heroTag: 'The archive',
    heroMeta: '05 files',
    now: 'now',
    heroL1: 'Experience.',
    heroL2: 'Not just',
    heroL3: 'on paper',
    toIndex: 'To the index',
    intro1: "During my internships I got to know different sides of IT. I gained experience with IT support, software development and researching opportunities for automation.",
    intro2: "From solving technical problems to working on software and systems. Below you can see where I've worked and which technologies I've gained experience with.",
    indexTitle: 'Five files, in order',
    indexHint: 'Choose a file to open it',
    openFile: 'Open file',
    th1: 'Foundation',
    th2: 'Systems',
    th3: 'Development',
    th4: 'Automation',
    th5: 'Integration',
    ix1: 'IT support at the ICT Service Desk: laptops, monitors and workstations.',
    ix2: 'My second internship at the ICT Service Desk, with the same activities as at Ceva.',
    ix3: 'My first internship in software development: helping to build a web client version of UniWeb.',
    ix4: 'Collecting and processing data from production machines, with Python and Microsoft SQL Server.',
    ix5: 'Automation with Power Automate and research into API connections.',
    file: 'File',
    endFile: 'End of file',
    endArchive: 'End of the archive',
    period: 'Period',
    role: 'Role',
    field: 'Track',
    dept: 'Department',
    tasks: 'Activities',
    tasksBoth: 'Activities · at Ceva and Hydro',
    skillsSub: 'Skills',
    mar2022: 'Mar 2022',
    oct2022: 'Oct 2022',
    ch1Lead: 'My first internship at the ICT Service Desk. This is where I learned how IT works in practice and how to help users.',
    desk1: 'Configuring laptops.',
    desk2: 'Setting up monitors.',
    desk3: 'Setting up and organising new workstations.',
    desk4: 'Managing and maintaining the ticketing system.',
    skWorkplace: 'Workstation management',
    skTicketing: 'Ticketing systems',
    flow1: 'Report',
    flow2: 'Ticket',
    flow3: 'In progress',
    flow4: 'Resolved',
    cap2: 'The ticketing system as a work process. Illustration.',
    hydroLead: 'At Hydro Extrusion I worked at the ICT Service Desk again. I helped users with IT questions, set up workstations and gained experience in a different organisation.',
    seeTasks: 'The activities in file 01',
    ch2Lead: 'My first internship in software development, at Infotech BV, around the UniWeb software package.',
    infoDesc1: 'At Infotech BV I did my internship in software development, working on the UniWeb client.',
    infoDesc2: 'First I got to know UniWeb by completing an assignment with it. After that I helped convert the package into a web client version, so it could be made available over the company network.',
    illus: 'illustration',
    info1: 'Completing an assignment to get to know UniWeb.',
    info2: 'Helping to convert UniWeb into a web client.',
    info3: 'Working in an existing codebase.',
    info4: 'Working in a professional IT environment.',
    skSoftDev: 'Software development',
    skWebclient: 'Web client development',
    skCodebase: 'Existing codebase',
    ch3Lead: 'Collecting data from production machines, connecting systems and automating processes. My two most recent internships are about how systems work together.',
    node1: 'Production machines',
    node2: 'Python collector',
    node4: 'Monitoring',
    cap4: 'From machine data to monitoring. An illustration, not a system diagram.',
    adcDesc1: 'At ADC Nederland I worked on a solution for collecting and processing data from production machines.',
    adcDesc2: 'Along the way I gained experience with Python, databases and processing data from different systems.',
    adc1: 'Researching and developing a Python collector.',
    adc2: 'Working with Microsoft SQL Server.',
    adc3: 'Collecting and processing machine data.',
    adc4: 'Researching data from an external production platform.',
    adc5: 'Working on a machine monitoring solution.',
    dataProc: 'Data processing',
    current: 'Current internship',
    hubA: 'Processes',
    hubB: 'API connections',
    hubC: 'Systems',
    hubCore: 'Automation',
    cap5: 'Processes, systems and the connections between them. Illustration.',
    barilRole: 'IT &amp; Automation',
    barilDesc1: "At Baril Coatings I work on automation with Power Automate: I set up flows and develop them further. I also research how systems can be connected through APIs.",
    barilDesc2: 'The flows are still in development. Alongside the automation, I help with IT support and setting up devices and workstations.',
    baril1: 'Setting up and developing Power Automate flows.',
    baril2: 'Researching API connections and system integrations.',
    baril3: 'Researching how manual processes can be automated.',
    baril4: 'IT support and setting up devices and workstations.',
    skProcAuto: 'Process automation',
    skApiInt: 'API connections',
    skProblem: 'Problem analysis',
    appNum: 'Appendix',
    appTitle: 'Toolkit',
    skillsIntro: "Through my studies, projects and internships I've worked with a range of programming languages, tools and systems. I keep discovering new technologies and expanding my knowledge.",
    lvlCore: 'Used regularly',
    lvlCoreNote: 'Technologies I use often in my studies and projects.',
    lvlBasic: 'Basic knowledge',
    lvlBasicNote: "I've worked with these and know the basics.",
    lvlIntern: 'Internships &amp; research',
    lvlInternNote: 'Only worked with or researched during an internship.',
    restApis: 'REST APIs',
    outroLead: "You've seen where I gained my experience.",
    outroL1: 'Now see what',
    outroL2: "I've built"
  };
  var KEY = 'akif-lang';
  var nodes = [].slice.call(view.querySelectorAll('[data-i18n]'));
  nodes.forEach(function (el) { el.setAttribute('data-nl', el.innerHTML); });

  function onPage() { return (window.location.hash || '') === '#/experience'; }
  function saved() { try { return window.localStorage.getItem(KEY) === 'en' ? 'en' : 'nl'; } catch (e) { return 'nl'; } }
  var lang = saved();
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var behavior = reduceMotion ? 'auto' : 'smooth';

  function clamp01(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function easeOut(t) { return 1 - Math.pow(1 - t, 3); }

  // ---- going to a place on the page: measured from the layout (offsetTop),
  // so an element mid fade-up (translateY) lands right; focus follows ----
  function goTo(target) {
    var y = 0;
    for (var n = target; n; n = n.offsetParent) y += n.offsetTop;
    window.scrollTo({ top: Math.max(0, y - 100), behavior: behavior });
    if (!target.hasAttribute('tabindex') && !/^(BUTTON|A)$/.test(target.tagName)) target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
  }
  view.querySelectorAll('.xa-jump, .xa-link').forEach(function (b) {
    b.addEventListener('click', function () {
      var t = document.getElementById(b.getAttribute('data-target'));
      if (t) goTo(t);
    });
  });

  // ---- the index: a row in focus lights up and fills the preview beside
  // it; on phones (no preview) the row in the middle of the screen does ----
  var rowsList = document.getElementById('xaRows');
  var rows = [].slice.call(view.querySelectorAll('.xa-row'));
  var preview = document.getElementById('xaPreview');
  var prevNum = document.getElementById('xaPrevNum');
  var prevTheme = document.getElementById('xaPrevTheme');
  var prevDesc = document.getElementById('xaPrevDesc');
  var pointed = null;   // row under the mouse / keyboard focus
  var middle = null;    // phones: the row in the middle of the screen

  function text(el) { return el ? el.textContent.replace(/\s+/g, ' ').trim() : ''; }
  function stacked() { return !preview || !preview.offsetParent; }
  function paintRows() {
    var on = pointed || (stacked() ? middle : null);
    rows.forEach(function (r) { r.classList.toggle('is-on', r === on); });
    rowsList.classList.toggle('is-focused', !!pointed);
    if (!preview || stacked()) return;
    preview.classList.toggle('is-shown', !!pointed);
    if (!pointed) return;
    prevNum.textContent = text(pointed.querySelector('.xa-row-num'));
    prevTheme.textContent = text(pointed.querySelector('.xa-row-period')) + ' · ' + text(pointed.querySelector('.xa-row-theme'));
    prevDesc.textContent = text(pointed.querySelector('.xa-row-desc'));
    // level with its row: measured against the grid both share
    var y = pointed.getBoundingClientRect().top - preview.parentNode.getBoundingClientRect().top;
    preview.style.setProperty('--y', Math.max(0, Math.round(y)) + 'px');
  }
  function isMouse(e) { return !e.pointerType || e.pointerType === 'mouse'; }
  rows.forEach(function (r) {
    r.addEventListener('pointerenter', function (e) { if (isMouse(e)) { pointed = r; paintRows(); } });
    r.addEventListener('pointerleave', function (e) { if (isMouse(e) && pointed === r) { pointed = null; paintRows(); } });
    r.addEventListener('focus', function () { pointed = r; paintRows(); });
    r.addEventListener('blur', function () { if (pointed === r) { pointed = null; paintRows(); } });
    r.addEventListener('click', function () {
      var t = document.getElementById(r.getAttribute('data-target'));
      if (t) goTo(t);
    });
  });

  // ---- the archive transition: per file --p (its card entering, the name
  // slides together), --e (leaving: the content steps back), --q (its end
  // rule draws); the indicator rolls to the file in view ----
  var files = [].slice.call(view.querySelectorAll('.xa-ch'));
  var ind = document.getElementById('xaInd');
  var indStrip = document.getElementById('xaIndStrip');
  var indName = document.getElementById('xaIndName');
  var indBars = ind ? [].slice.call(ind.querySelectorAll('.xa-ind-bar i')) : [];
  var current = -1;
  // the page view is its own stacking layer (z-index 5) under the nav (10);
  // on phones the indicator sits in the nav band, so it lives on <body>.
  // It only shows while /experience is open (is-on).
  if (ind) document.body.appendChild(ind);

  function setVar(el, name, v) {
    var s = v.toFixed(3);
    if (el.style.getPropertyValue(name) !== s) el.style.setProperty(name, s);
  }
  function setIndicator(i) {
    if (i === current) return;
    current = i;
    if (i < 0) return;
    indStrip.style.setProperty('--n', i);
    indName.textContent = files[i].getAttribute('data-name');
    indBars.forEach(function (b, k) { b.classList.toggle('is-done', k <= i); });
  }

  var ticking = false;
  function update() {
    ticking = false;
    if (view.hidden) return;
    var vh = window.innerHeight;
    var mid = vh * 0.5;
    var active = -1;
    files.forEach(function (f, i) {
      var r = f.getBoundingClientRect();
      if (r.top <= mid) active = i;
      if (r.bottom < -vh || r.top > vh * 2) return;   // far away: leave as is
      if (!reduceMotion) {
        var card = f.firstElementChild.getBoundingClientRect();
        setVar(f, '--p', easeOut(clamp01((vh - card.top) / (vh * 0.75))));
        setVar(f, '--e', clamp01((vh * 0.4 - r.bottom) / (vh * 0.4)));
        var end = f.querySelector('.xa-end').getBoundingClientRect();
        setVar(f, '--q', easeOut(clamp01((vh * 0.95 - end.top) / (vh * 0.35))));
      }
    });
    // the indicator: from the first file until the last one has gone by
    var last = files[files.length - 1].getBoundingClientRect();
    var inFiles = active > -1 && last.bottom > vh * 0.5;
    if (inFiles) setIndicator(active);
    if (ind) ind.classList.toggle('is-on', inFiles);

    // phones: the index row closest to the middle of the screen
    if (stacked()) {
      var best = null, dist = Infinity;
      rows.forEach(function (r) {
        var b = r.getBoundingClientRect();
        var d = Math.abs(b.top + b.height / 2 - mid);
        if (b.bottom > 0 && b.top < vh && d < dist) { dist = d; best = r; }
      });
      var listBox = rowsList.getBoundingClientRect();
      if (listBox.bottom < vh * 0.2 || listBox.top > vh * 0.8) best = null;
      if (best !== middle) { middle = best; paintRows(); }
    }
  }
  function requestUpdate() {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(update);
  }
  window.addEventListener('scroll', requestUpdate, { passive: true });
  window.addEventListener('resize', function () { requestUpdate(); if (pointed) paintRows(); });

  // ---- language ----
  function apply() {
    nodes.forEach(function (el) {
      var k = el.getAttribute('data-i18n');
      el.innerHTML = lang === 'en' && EN[k] ? EN[k] : el.getAttribute('data-nl');
    });
    if (pointed) paintRows();
    if (onPage()) document.documentElement.lang = lang;
  }
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('.nav .lang');
    if (!a || !onPage()) return;
    e.preventDefault();
    lang = lang === 'en' ? 'nl' : 'en';
    try { window.localStorage.setItem(KEY, lang); } catch (err) {}
    apply();
  });

  // ---- the hero intro: the lines rise, the rules draw, the numbers tick ----
  var hero = document.getElementById('xaHero');
  function playIntro() {
    if (!hero || !view.classList.contains('xa-armed')) return;
    hero.classList.remove('is-in');
    void hero.offsetWidth;
    window.requestAnimationFrame(function () {
      window.requestAnimationFrame(function () { hero.classList.add('is-in'); });
    });
  }

  window.addEventListener('hashchange', function () {
    var l = saved();
    if (l !== lang) lang = l;
    apply();
    if (onPage()) { playIntro(); requestUpdate(); }
    else if (ind) ind.classList.remove('is-on');
  });
  apply();
  requestUpdate();

  // ---- the five endless details (the pulse by file 05 in the index and in
  // its file, the editor caret, the data stream, the dashed hub lines) only
  // move while they are on screen and the tab is in view; paused otherwise
  // (see motion.css). Without IntersectionObserver they simply keep going. ----
  if ('IntersectionObserver' in window) {
    var hosts = [].slice.call(view.querySelectorAll('.xa-row--now, .xa-status, .xa-editor, .xa-stream, .xa-hub'));
    var seen = [];
    var playing = function () {
      hosts.forEach(function (h, i) {
        var on = !!seen[i] && !document.hidden;
        if (h.classList.contains('is-playing') !== on) h.classList.toggle('is-playing', on);
      });
    };
    var animIo = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { seen[hosts.indexOf(e.target)] = e.isIntersecting; });
      playing();
    });
    hosts.forEach(function (h) { h.classList.add('xa-anim'); animIo.observe(h); });
    document.addEventListener('visibilitychange', playing);
  }

  if (reduceMotion || !('IntersectionObserver' in window)) return;
  view.classList.add('xa-armed');

  // ---- fade-ups, once each ----
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-in');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
  view.querySelectorAll('.xa-reveal').forEach(function (el) { io.observe(el); });

  if (onPage()) playIntro();
})();
