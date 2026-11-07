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
  }

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
