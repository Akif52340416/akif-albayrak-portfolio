(function () {
  "use strict";
  // Site footer: NL / EN (the remembered "akif-lang" choice that /about and
  // /experience switch), the reveal when it scrolls into view (played again
  // on every page), and "back to top".
  var footer = document.getElementById('siteFooter');
  if (!footer) return;

  var EN = {
    sfAsk: 'Got an idea?',
    sfTalk: "Let's talk.",
    sfSub: 'From an initial idea to something that actually works.',
    sfTop: 'Back to top',
    sfMade: 'Designed &amp; developed by Akif Albayrak'
  };
  var KEY = 'akif-lang';
  var nodes = [].slice.call(footer.querySelectorAll('[data-i18n]'));
  nodes.forEach(function (el) { el.setAttribute('data-nl', el.innerHTML); });

  function saved() { try { return window.localStorage.getItem(KEY) === 'en' ? 'en' : 'nl'; } catch (e) { return 'nl'; } }
  var lang = null;
  function apply() {
    var l = saved();
    if (l === lang) return;
    lang = l;
    nodes.forEach(function (el) {
      var k = el.getAttribute('data-i18n');
      el.innerHTML = lang === 'en' && EN[k] ? EN[k] : el.getAttribute('data-nl');
    });
  }
  // the switch itself lives in the page scripts; pick up their choice after them
  document.addEventListener('click', function (e) {
    if (e.target.closest && e.target.closest('.nav .lang')) setTimeout(apply, 0);
  });
  document.addEventListener('akif:langchange', apply);
  window.addEventListener('hashchange', apply);
  apply();

  // ---- back to top: smooth (instant with reduced motion), then focus goes
  // to the start of the page so keyboard users continue from the top ----
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var topBtn = document.getElementById('sfTop');
  if (topBtn) topBtn.addEventListener('click', function () {
    window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
    var first = document.querySelector('.nav a');
    if (first) first.focus({ preventScroll: true });
  });

  // ---- reveal: the two lines rise, the sentence and the base row follow ----
  if (reduceMotion || !('IntersectionObserver' in window)) return;
  footer.classList.add('is-armed');
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) { footer.classList.add('is-in'); io.unobserve(footer); }
    });
  }, { threshold: 0.2 });
  io.observe(footer);
  // a new page starts at the top: hide the footer again so it reveals once more
  window.addEventListener('hashchange', function () {
    footer.classList.remove('is-in');
    io.unobserve(footer);
    io.observe(footer);
  });
})();
