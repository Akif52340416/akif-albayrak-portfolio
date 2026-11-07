(function () {
  "use strict";
  // NL / EN for /about. The existing "NL · EN" link in the navigation switches
  // the language while /about is open (elsewhere it keeps its old behaviour).
  // Dutch stays in the markup; English lives here. The choice is remembered.
  var EN = {
    photoAlt: 'Akif Albayrak at a viewpoint with the Bosphorus Bridge behind him',
    ch1: 'Who I am',
    iam: "I'm",
    intro: "I'm Akif, 21 years old and in the final year of my Software Development course. I enjoy learning new things, figuring problems out and discovering more and more sides of IT.",
    fact1: '21 years old',
    fact2: 'The Netherlands',
    fact4: 'MBO 4 — final year',
    ch2: 'More than just code',
    traitsTitle: 'More than<br>just code.',
    trait1: 'Curious',
    trait2: 'Social',
    trait3: 'Driven',
    traitsLead: 'Three words that show what kind of person I am.',
    traitCopy1: "When something catches my interest, I want to know how it works and what I can do with it.",
    traitCopy2: "I like working together, but I'm just as happy finding a solution on my own.",
    quote: "I don't need to be able to do everything right away. As long as I keep taking another step forward, I'm happy.",
    photoCap: 'Bosphorus Bridge, Istanbul',
    outsideBig: 'Active, and quite competitive.',
    ch3: 'My route',
    routeTitle: 'From support<br>to software.',
    routeLead: 'Three steps: where I started, where I am now and where I want to go.',
    tlDone: 'Completed',
    tlNow: 'Current programme',
    tlFrom: 'From 2027',
    tlPlan: 'Future plan',
    tlMaybeSr: ', possible direction: ',
    route1: 'My interest in IT started with ICT Support. That is where I learned how systems work, how you solve problems and how you help people when something isn’t working.',
    route2: 'After a while I wanted more than fixing problems: I wanted to build things myself and understand how software works.',
    route3: "I'm now in my final year, and my interests keep getting broader: from building websites to connecting systems and automating processes.",
    route4: 'That variety is exactly what makes IT interesting to me.',
    ch4: 'Outside IT',
    outsideTitle: 'Outside IT.',
    sport1: 'Football',
    sport2: 'Boxing',
    outside1: 'Besides school and programming, I like to stay active. I play football, go to the gym and also enjoy boxing.',
    outside2: "For me, sport is a way to clear my head, challenge myself and keep getting better. I'm quite <em>competitive</em> and like having something to work towards.",
    outside3: 'Also: <em>gaming</em>, a <em>book</em> now and then, and time with friends.',
    also: 'Also',
    gaming: 'Gaming',
    reading: 'Reading',
    next1: "After my current programme I want to keep studying. This is still a plan: I'll find out along the way which direction it will be.",
    skip: 'Skip intro'
  };
  var KEY = 'akif-lang';
  var root = document.getElementById('aboutView');
  var intro = document.getElementById('aboutIntro');
  if (!root) return;
  var nodes = [].slice.call(root.querySelectorAll('[data-i18n]')).concat(intro ? [].slice.call(intro.querySelectorAll('[data-i18n]')) : []);
  var alts = [].slice.call(root.querySelectorAll('[data-i18n-alt]'));
  nodes.forEach(function (el) { el.setAttribute('data-nl', el.innerHTML); });
  alts.forEach(function (el) { el.setAttribute('data-nl-alt', el.getAttribute('alt') || ''); });

  var lang = 'nl';
  try { if (window.localStorage.getItem(KEY) === 'en') lang = 'en'; } catch (e) {}

  function onAbout() { return (window.location.hash || '') === '#/about'; }

  function apply() {
    nodes.forEach(function (el) {
      var k = el.getAttribute('data-i18n');
      el.innerHTML = lang === 'en' && EN[k] ? EN[k] : el.getAttribute('data-nl');
    });
    alts.forEach(function (el) {
      var k = el.getAttribute('data-i18n-alt');
      el.setAttribute('alt', lang === 'en' && EN[k] ? EN[k] : el.getAttribute('data-nl-alt'));
    });
    document.documentElement.lang = onAbout() ? lang : 'nl';
    document.dispatchEvent(new CustomEvent('akif:langchange'));
  }

  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('.nav .lang');
    if (!a || !onAbout()) return;
    e.preventDefault();
    lang = lang === 'en' ? 'nl' : 'en';
    try { window.localStorage.setItem(KEY, lang); } catch (err) {}
    apply();
  });
  window.addEventListener('hashchange', function () {
    // the choice can also be made on /experience: pick it up when coming back
    var saved = 'nl';
    try { if (window.localStorage.getItem(KEY) === 'en') saved = 'en'; } catch (e) {}
    if (saved !== lang) { lang = saved; apply(); }
    document.documentElement.lang = onAbout() ? lang : 'nl';
  });
  apply();
})();
