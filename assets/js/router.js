(function () {
  "use strict";

  // Simulated multi-page routing within a single index.html, using the URL
  // hash — this gives real, shareable links (#/work, #/work/van-der-hammen,
  // #/about) that also work when the file is opened directly (file://).
  var homeView = document.getElementById("homeView");
  var workView = document.getElementById("workView");
  var vdhView = document.getElementById("vdhView");
  var uniteView = document.getElementById("uniteView");
  var taliaView = document.getElementById("taliaView");
  var aboutView = document.getElementById("aboutView");
  var experienceView = document.getElementById("experienceView");
  var contactView = document.getElementById("contactView");
  var identityMark = document.getElementById("identityMark");
  var views = [homeView, workView, vdhView, uniteView, taliaView, aboutView, experienceView, contactView];
  var navLinks = document.querySelectorAll('.nav a[href^="#/"]');

  // every page opens at its top (route() below). With the browser's own
  // restoration, Back / Forward put the old position of that history entry
  // back after the route had already gone to the top, so Home could land
  // in the middle of its story. The router decides the position instead.
  try { if ("scrollRestoration" in history) history.scrollRestoration = "manual"; } catch (e) {}

  function route() {
    var hash = window.location.hash || "#/";
    views.forEach(function (v) { if (v) v.hidden = true; });
    document.body.classList.remove("subpage");

    if (hash === "#/work") {
      if (workView) workView.hidden = false;
      document.body.classList.add("subpage");
    } else if (hash === "#/work/van-der-hammen") {
      if (vdhView) vdhView.hidden = false;
      document.body.classList.add("subpage");
    } else if (hash === "#/work/unite-reintegratie") {
      if (uniteView) uniteView.hidden = false;
      document.body.classList.add("subpage");
    } else if (hash === "#/work/talia") {
      if (taliaView) taliaView.hidden = false;
      document.body.classList.add("subpage");
    } else if (hash === "#/about") {
      if (aboutView) aboutView.hidden = false;
      document.body.classList.add("subpage");
    } else if (hash === "#/experience") {
      if (experienceView) experienceView.hidden = false;
      document.body.classList.add("subpage");
    } else if (hash === "#/contact") {
      if (contactView) contactView.hidden = false;
      document.body.classList.add("subpage");
    } else {
      if (homeView) homeView.hidden = false;
    }

    // mark the open section in the navigation (Work includes its case studies)
    Array.prototype.forEach.call(navLinks, function (a) {
      var href = a.getAttribute("href");
      if (hash === href || hash.indexOf(href + "/") === 0) a.setAttribute("aria-current", "page");
      else a.removeAttribute("aria-current");
    });

    if (document.body.classList.contains("subpage")) {
      if (identityMark) { identityMark.style.opacity = "1"; identityMark.inert = false; }
    }

    window.scrollTo(0, 0);
    syncScrolled();
    current = hash;
    labels();
    // the new page is in place and at the top: scripts that keep a page's
    // state (Home's eased scroll position) can start it from here, in the
    // same frame, before anything is painted
    document.dispatchEvent(new CustomEvent("akif:route", { detail: { hash: hash } }));
    // a new page: focus goes to its heading, so a screen reader announces
    // it and the next Tab starts on this page. Not on the first load (the
    // browser starts at the top itself), and never with a scroll.
    if (routed) focusHeading();
    routed = true;
  }

  // ---- the open page's name in the title, and the labels around the pages,
  // in the page's language (each page script sets <html lang>) ----
  var current = "#/", routed = false;
  var TITLES = {
    "#/": ["Akif Albayrak — Software Development", "Akif Albayrak — Software Development"],
    "#/work": ["Werk — Akif Albayrak", "Work — Akif Albayrak"],
    "#/work/van-der-hammen": ["Van der Hammen Gym — Akif Albayrak", "Van der Hammen Gym — Akif Albayrak"],
    "#/work/unite-reintegratie": ["Unite Re-integratie — Akif Albayrak", "Unite Re-integratie — Akif Albayrak"],
    "#/work/talia": ["Talia — Akif Albayrak", "Talia — Akif Albayrak"],
    "#/about": ["Over mij — Akif Albayrak", "About me — Akif Albayrak"],
    "#/experience": ["Ervaring — Akif Albayrak", "Experience — Akif Albayrak"],
    "#/contact": ["Contact — Akif Albayrak", "Contact — Akif Albayrak"]
  };
  var skipLink = document.getElementById("skipLink");
  var nav = document.querySelector(".nav");
  function labels() {
    var en = document.documentElement.lang === "en" ? 1 : 0;
    var t = (TITLES[current] || TITLES["#/"])[en];
    if (document.title !== t) document.title = t;
    if (skipLink) skipLink.textContent = en ? "Skip to content" : "Naar de inhoud";
    if (nav) nav.setAttribute("aria-label", en ? "Main navigation" : "Hoofdnavigatie");
  }
  if ("MutationObserver" in window) {
    new MutationObserver(labels).observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });
  }

  function openView() {
    for (var i = 0; i < views.length; i++) if (views[i] && !views[i].hidden) return views[i];
    return null;
  }
  function focusHeading() {
    var view = openView();
    var h = view && view.querySelector("h1");
    if (!h) return;
    if (!h.hasAttribute("tabindex")) h.setAttribute("tabindex", "-1");
    h.focus({ preventScroll: true });
  }
  // the skip link: to the open page's heading (following "#main" itself
  // would change the hash, which is a route)
  if (skipLink) skipLink.addEventListener("click", function (e) {
    e.preventDefault();
    focusHeading();
  });

  // the nav's backdrop on subpages (see body.subpage .nav::before) only
  // shows once the page has moved, so every page opening stays untouched
  var scrolled = null;
  function syncScrolled() {
    var s = window.scrollY > 8;
    if (s !== scrolled) { scrolled = s; document.body.classList.toggle("is-scrolled", s); }
  }
  window.addEventListener("scroll", syncScrolled, { passive: true });

  window.addEventListener("hashchange", route);
  route();
})();
