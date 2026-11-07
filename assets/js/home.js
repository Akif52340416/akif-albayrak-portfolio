(function () {
  "use strict";

  function safeGet(id) {
    var el = document.getElementById(id);
    if (!el) console.error("[akif-intro] missing element:", id);
    return el;
  }

  var photoImg = safeGet("photoImg");
  var scrim = safeGet("scrim");
  var scrimLeft = safeGet("scrimLeft");
  var nameGroup = safeGet("nameGroup");
  var akifSpan = safeGet("akifSpan");
  var albayrakSpan = safeGet("albayrakSpan");
  var identityMark = safeGet("identityMark");
  var teaser = safeGet("teaser");
  var infoLabel = safeGet("infoLabel");

  var chapterVeil = safeGet("chapterVeil");

  var blockSupport = safeGet("blockSupport");
  var blockSoftware = safeGet("blockSoftware");
  var blockSystems = safeGet("blockSystems");
  var blockImprovement = safeGet("blockImprovement");

  var trailTag = safeGet("trailTag");
  var tagNum = trailTag ? trailTag.querySelector(".tt-num") : null;
  var tagName = trailTag ? trailTag.querySelector(".tt-name") : null;
  var tagLabels = trailTag ? trailTag.querySelectorAll(".a-label") : [];
  var tagShown = -1;
  var CHAPTERS = ["SUPPORT", "SOFTWARE", "SYSTEMS", "IMPROVEMENT"];

  var prefersReduced = false;
  try {
    if (window.matchMedia) {
      prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    }
  } catch (err) {
    console.error("[akif-intro] matchMedia check failed:", err);
  }

  // the skills of each chapter, shown in the route's label at that chapter's node
  var annotSets = [
    ["HARDWARE", "TROUBLESHOOTING", "END USERS"],   // 01 SUPPORT
    ["HTML / CSS", "JAVASCRIPT", "PHP / C#"],        // 02 SOFTWARE
    ["PYTHON", "SQL", "MACHINE DATA"],               // 03 SYSTEMS
    ["PROCESS", "AUTOMATION", "API'S"]       // 04 IMPROVEMENT
  ];

  function lerp(a, b, t) { return a + (b - a) * t; }
  function clamp01(x) { return Math.min(Math.max(x, 0), 1); }
  function easeInOutCubic(x) {
    return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
  }
  function bump(x, center, width) {
    var d = Math.abs(x - center);
    return d > width ? 0 : 1 - d / width;
  }

  // A clean hand-off: the outgoing content loses hierarchy quickly (short exit
  // window, so it never lingers half-visible), the incoming content only starts
  // gaining hierarchy once the outgoing one is nearly gone — a brief, not a long,
  // overlap. Position shift is small; a touch of blur only at the fringes of each
  // state, never sustained, so no two readable-but-faint texts sit on screen at once.
  function crossfade(el, enter, exit) {
    if (!el) return;
    var enterC = clamp01(enter);
    var exitC = clamp01(exit);
    var op = enterC * (1 - exitC);
    el.style.opacity = String(op);

    var rise = lerp(8, 0, enterC) - 8 * exitC;
    var blurIn = lerp(1.6, 0, enterC);
    var blurOut = lerp(0, 1.6, exitC);
    var blur = Math.min(1.6, blurIn + blurOut);

    el.style.transform = "translateY(" + rise + "px)";
    el.style.filter = blur > 0.02 ? "blur(" + blur + "px)" : "none";
  }

  // remaps a raw 0..1 transition into a short, non-overlapping exit/enter pair:
  // the outgoing block is fully gone well before the incoming one starts appearing
  function stageWindows(t) {
    return {
      outExit: clamp01(t / 0.4),
      inEnter: clamp01((t - 0.34) / 0.5)
    };
  }

  // scroll boundaries, in viewport-heights, for each state change. Every
  // scene keeps its own motion; the windows between them are tighter, so
  // less scrolling passes without anything new (the page used to be 2140vh)
  var B1 = 140; // opening -> 01 support settled
  var B2 = 240; // 01 -> 02 software
  var B3 = 340; // 02 -> 03 systems
  var B4 = 440; // 03 -> 04 improvement settled
  var B5 = 560; // introduction fully closed, chapter break

  // ---- the chapter break: one scene, OPLEIDING — NU / MBO 4, on the same
  // dark veil that already closes the introduction. Each next scene starts
  // while the one before is nearly gone (under 0.3), never while it can
  // still be read, so no stretch of the page is empty for long; every
  // scene keeps the length of its own motion.
  var E0 = 490;  // education starts rising, while the veil closes
  var NC = 600;  // education settled
  var N5 = 660;  // education exits -> canvas clears

  // ---- STILL BUILDING. is the bridge: its own clean state first, then it
  // transforms into the three-project gallery (the evidence, with the link
  // to all work right under it), then closes into the final actions and
  // footer. VIEW ALL WORK no longer has a scene of its own (that was 80vh).
  var S0 = 635;  // STILL BUILDING. starts coming in, as education leaves
  var S1 = 735;  // STILL BUILDING. settled, on its own
  var S2 = 895;  // transform complete: heading shrunk, gallery fully composed
  var S3 = 1035; // gallery hold ends
  var S4 = 1105; // gallery cleared
  var F0 = 1080; // final actions start, as the gallery clears
  var S5 = 1155; // final actions settled
  var S6 = 1215; // footer settled

  var storyCurrent = document.getElementById("storyCurrent");

  var stillBuilding = document.getElementById("stillBuilding");
  var stillBuildingHeading = document.getElementById("stillBuildingHeading");
  var stillBuildingSub = document.getElementById("stillBuildingSub");
  var galleryProjects = document.getElementById("galleryProjects");
  var galleryItems = galleryProjects ? Array.prototype.slice.call(galleryProjects.querySelectorAll(".gallery-item")) : [];
  var finalNav = document.getElementById("finalNav");
  var finalFooter = document.getElementById("finalFooter");
  var finalNameA = document.getElementById("finalNameA");
  var finalNameB = document.getElementById("finalNameB");
  var finalRule = document.getElementById("finalRule");
  var finalRuleFill = finalRule ? finalRule.querySelector(".final-rule-fill") : null;
  var finalRuleHead = finalRule ? finalRule.querySelector(".final-rule-head") : null;
  var ruleNow = 0, headLeaning = false;

  // a layer that can't be seen can't be reached either: no clicks, no Tab
  // stop, not read out. All Home layers are in the page from the start
  // (transparent), so without this Tab visited them before the opening.
  function live(el, on) {
    if (!el) return;
    el.classList.toggle("is-live", on);
    if (el.inert !== !on) el.inert = !on;
  }

  function apply(scrollVh) {

    var mobile = window.innerWidth <= 780;

    var e0 = easeInOutCubic(clamp01(scrollVh / B1));
    var e1 = easeInOutCubic(clamp01((scrollVh - B1) / (B2 - B1)));
    var e2 = easeInOutCubic(clamp01((scrollVh - B2) / (B3 - B2)));
    var e3 = easeInOutCubic(clamp01((scrollVh - B3) / (B4 - B3)));
    var e4 = easeInOutCubic(clamp01((scrollVh - B4) / (B5 - B4))); // introduction -> chapter break

    var idx = e1 + e2 + e3;
    var overallT = clamp01((e0 + idx) / 4);

    if (photoImg) {
      // the drift continues into the chapter break, so the portrait's retreat
      // feels like one continuous motion, not a second separate effect
      var scale = lerp(1, 1.22, clamp01(overallT + e4 * 0.4));
      var objX = lerp(42, mobile ? 50 : 38, overallT);
      var objY = lerp(30, 22, overallT);
      photoImg.style.transform = "scale(" + scale + ")";
      photoImg.style.objectPosition = objX + "% " + objY + "%";
      photoImg.style.filter = "saturate(" + lerp(1, 0.6, clamp01(overallT + e4 * 0.5)) + ") brightness(" + lerp(1, 0.75, clamp01(overallT + e4 * 0.5)) + ")";
    }

    if (scrim) scrim.style.opacity = String(lerp(0, 0.42, overallT));
    if (scrimLeft) scrimLeft.style.opacity = String(lerp(0, 1, clamp01(e0 / 0.6)));

    // the veil: a calm, solid field that takes over from the photo as the
    // dominant visual — the portrait steps back, it does not vanish abruptly
    if (chapterVeil) chapterVeil.style.opacity = String(e4);

    if (nameGroup) {
      var nameProgress = clamp01(e0 / 0.5);
      var groupLeft = lerp(mobile ? 62 : 47, mobile ? 66 : 58, nameProgress);
      var groupTop = lerp(mobile ? 18 : 20, mobile ? 14 : 16, nameProgress);
      nameGroup.style.left = groupLeft + "%";
      nameGroup.style.top = groupTop + "%";
      nameGroup.style.opacity = String(clamp01(1 - nameProgress));

      if (akifSpan) akifSpan.style.fontSize = lerp(mobile ? 32 : 46, mobile ? 22 : 30, nameProgress) + "px";
      if (albayrakSpan) albayrakSpan.style.fontSize = lerp(mobile ? 22 : 32, mobile ? 16 : 20, nameProgress) + "px";
    }

    var markOpacity = clamp01((e0 - 0.4) / 0.2);
    if (identityMark) identityMark.style.opacity = String(markOpacity);
    live(identityMark, markOpacity > 0.6);

    var supportEnter = clamp01((e0 - 0.32) / 0.28);
    var w1 = stageWindows(e1);
    var w2 = stageWindows(e2);
    var w3 = stageWindows(e3);

    crossfade(blockSupport, supportEnter, w1.outExit);
    crossfade(blockSoftware, w1.inEnter, w2.outExit);
    crossfade(blockSystems, w2.inEnter, w3.outExit);
    crossfade(blockImprovement, w3.inEnter, e4);

    var annotIndex = 0;
    if (e1 >= 0.5) annotIndex = 1;
    if (e2 >= 0.5) annotIndex = 2;
    if (e3 >= 0.5) annotIndex = 3;
    var set = annotSets[annotIndex];

    // the route's label: in with chapter 01, out together with the route
    // (460–515vh in home-motion.js), never without it. Between two chapters
    // it is fully gone at the hand-off (where it moves to the next node and
    // changes text), so it is never seen jumping
    var entranceEnvelope = clamp01((e0 - 0.55) / 0.18);
    var handoff = (1 - bump(e1, 0.5, 0.2)) * (1 - bump(e2, 0.5, 0.2)) * (1 - bump(e3, 0.5, 0.2));
    var annotOpacity = entranceEnvelope * handoff * (1 - clamp01((scrollVh - 460) / 55));

    if (trailTag) {
      trailTag.style.opacity = annotOpacity.toFixed(3);
      if (annotIndex !== tagShown) {
        tagShown = annotIndex;
        if (tagNum) tagNum.textContent = "0" + (annotIndex + 1);
        if (tagName) tagName.textContent = CHAPTERS[annotIndex];
        for (var li = 0; li < tagLabels.length; li++) tagLabels[li].textContent = set[li];
      }
    }

    var teaserOpacity = (e3 > 0.85 ? (e3 - 0.85) / 0.15 : 0) * (1 - e4);
    if (teaser) teaser.style.opacity = String(teaserOpacity);
    live(teaser, teaserOpacity > 0.6);

    // ---- the chapter break on the same dark veil that already closed the
    // introduction: OPLEIDING — NU / MBO 4 enters once 04 has gone (e4
    // ends at B5), holds, then leaves the canvas clear for STILL BUILDING.
    var eNC = easeInOutCubic(clamp01((scrollVh - E0) / (NC - E0)));  // chapter break -> education
    var eN5 = easeInOutCubic(clamp01((scrollVh - NC) / (N5 - NC)));  // education exits
    crossfade(storyCurrent, eNC, eN5);

    // ---- STILL BUILDING. is the bridge between story and work. The canvas
    // is already clear (the same veil that closed the introduction); the
    // statement arrives on its own first, holds, then transforms — scale
    // and position shift as the three real projects enter beneath it.
    // Statement -> evidence, one continuous composition, not a hard cut.
    var eA = easeInOutCubic(clamp01((scrollVh - S0) / (S1 - S0))); // clear canvas -> STILL BUILDING. enters
    var eB = easeInOutCubic(clamp01((scrollVh - S1) / (S2 - S1))); // STILL BUILDING. transforms -> gallery composed
    var eC = easeInOutCubic(clamp01((scrollVh - S3) / (S4 - S3))); // gallery hold ends -> clears
    var eD = easeInOutCubic(clamp01((scrollVh - F0) / (S5 - F0))); // gallery clearing -> final actions
    var eE = easeInOutCubic(clamp01((scrollVh - S5) / (S6 - S5))); // final actions -> footer

    var sbOpacity = clamp01(eA);
    if (stillBuilding) stillBuilding.style.opacity = String(sbOpacity * (1 - eC));
    if (stillBuildingHeading) {
      // moves from full-screen center up into a compact heading sitting
      // above the gallery, the same element throughout — never re-created
      stillBuildingHeading.style.transform =
        "translateY(" + lerp(0, -34, eB) + "vh) scale(" + lerp(1, 0.55, eB) + ")";
    }
    if (stillBuildingSub) stillBuildingSub.style.opacity = String(clamp01((eA - 0.3) / 0.7) * (1 - eB));

    // the three-project gallery: staggered entrance as the statement
    // shrinks, held static (and interactive) through the S2-S3 window,
    // then clears together, link to all work included
    var galleryOpacity = clamp01(eB) * (1 - eC);
    if (galleryProjects) galleryProjects.style.opacity = String(galleryOpacity);
    live(galleryProjects, galleryOpacity > 0.6);
    galleryItems.forEach(function (el, i) {
      if (!el) return;
      var t = clamp01(eB * 3 - i);
      el.style.opacity = String(t * (1 - eC));
      el.style.transform = "translateY(" + lerp(16, 0, t) + "px)";
    });

    // the persistent "Software Development · IT — Nederland · 2026" label
    // lives in the same bottom-left corner the footer's "AKIF ALBAYRAK" line
    // lands in. It stays visible through the whole story, but clears well
    // ahead of the final actions/footer — never overlapping — and returns
    // the same way when scrolling back up, since it's recomputed every frame.
    // On phones the gallery fills the screen down to that corner, so there
    // the label steps aside as soon as the gallery comes in. It also steps
    // aside for "Uitgelicht werk", which shares the bottom edge and ran
    // into it on narrow screens.
    if (infoLabel) infoLabel.style.opacity = String(0.88 * (1 - clamp01(eD / 0.6)) * (mobile ? (1 - clamp01(eB)) * (1 - teaserOpacity) : 1));

    // the closing scene: the name returns (AKIF first, ALBAYRAK just after,
    // each rising out of its own line), the pink line draws under it with
    // its light point at the end, then About me / Let's talk and the footer
    // settle on it
    var navOpacity = clamp01(eD);
    if (finalNav) {
      finalNav.style.opacity = String(navOpacity);
      finalNav.style.transform = "translateY(" + lerp(14, 0, navOpacity) + "px)";
      live(finalNav, navOpacity > 0.6);
    }
    var riseA = easeInOutCubic(clamp01(eD * 1.3));
    var riseB = easeInOutCubic(clamp01(eD * 1.3 - 0.25));
    if (finalNameA) finalNameA.style.transform = "translateY(" + lerp(105, 0, riseA).toFixed(2) + "%)";
    if (finalNameB) finalNameB.style.transform = "translateY(" + lerp(105, 0, riseB).toFixed(2) + "%)";
    ruleNow = easeInOutCubic(clamp01((scrollVh - (F0 + S5) / 2) / (S6 - (F0 + S5) / 2)));
    if (finalRuleFill) finalRuleFill.style.transform = "scaleX(" + ruleNow.toFixed(4) + ")";
    if (finalRuleHead) {
      finalRuleHead.style.left = (ruleNow * 100).toFixed(2) + "%";
      finalRuleHead.style.opacity = String(clamp01(ruleNow * 10));
      // the scene is leaving: the light point lets go of the pointer
      if (headLeaning && navOpacity <= 0.6) { headLeaning = false; finalRuleHead.style.transform = ""; }
    }

    var footerOpacity = clamp01(eE);
    if (finalFooter) {
      finalFooter.style.opacity = String(footerOpacity);
      live(finalFooter, footerOpacity > 0.6);
    }

    // the light layer (home-motion.js) follows the same position from this
    // same loop: the trail through the chapters, the light over the
    // education headline and the light behind STILL BUILDING.
    if (window.akifHomeFx) window.akifHomeFx(scrollVh, mobile, { sb: sbOpacity * (1 - eC), eB: eB, nc: eNC, n5: eN5, ch: annotIndex });
  }

  // smoothing: the visible state always eases toward the scroll position instead of
  // snapping to it exactly — this is what makes the information arrival feel smooth
  var targetVh = 0;
  var currentVh = 0;
  var smoothing = prefersReduced ? 1 : 0.085;

  // the loop only runs while there is something to do: it stops once the
  // eased position has reached the scroll position, and it never runs on
  // the other pages. Scroll, resize, the pointer and a page change start
  // it again. apply() depends on nothing but the position and the window
  // size, so a stopped loop shows exactly what a running one would.
  var running = false;

  function readTarget() {
    targetVh = (window.scrollY / window.innerHeight) * 100;
    wake();
  }

  function wake() {
    if (running || document.body.classList.contains("subpage")) return;
    running = true;
    requestAnimationFrame(loop);
  }

  function loop() {
    currentVh += (targetVh - currentVh) * smoothing;
    if (Math.abs(targetVh - currentVh) < 0.02) currentVh = targetVh;
    if (!document.body.classList.contains("subpage")) {
      try {
        apply(currentVh);
      } catch (err) {
        console.error("[akif-intro] apply() failed:", err);
      }
    }
    if (currentVh !== targetVh && !document.body.classList.contains("subpage")) requestAnimationFrame(loop);
    else running = false;
  }

  // the closing scene's light point leans a few pixels towards a mouse
  // pointer nearby (more the closer it is); its CSS transition does the
  // easing, so this is one write per move and no loop of its own
  function leanHead(e) {
    if (!finalRuleHead || !finalRule || e.pointerType !== "mouse") return;
    if (!finalNav.classList.contains("is-live")) return;
    var r = finalRule.getBoundingClientRect();
    var dx = e.clientX - (r.left + r.width * ruleNow), dy = e.clientY - r.top;
    var dist = Math.sqrt(dx * dx + dy * dy) || 1;
    var k = Math.max(0, 1 - dist / 380);
    finalRuleHead.style.transform = "translate(" + (dx / dist * 8 * k).toFixed(1) + "px," + (dy / dist * 5 * k).toFixed(1) + "px)";
    headLeaning = true;
  }

  function onPointerMove(e) {
    leanHead(e);
    // apply() sets the photo's own transform on its next frame, as it always
    // did while the loop never stopped: keep that by running one more frame
    wake();
    if (window.scrollY > 4 || window.innerWidth <= 780 || !photoImg || !nameGroup) return;
    var nx = (e.clientX / window.innerWidth - 0.5) * 2;
    var ny = (e.clientY / window.innerHeight - 0.5) * 2;
    photoImg.style.transform = "scale(1.03) translate(" + (nx * -2) + "px, " + (ny * -1.5) + "px)";
    nameGroup.style.transform = "translate(" + (nx * 5) + "px, " + (ny * 4) + "px)";
  }

  readTarget();
  currentVh = targetVh;
  try {
    apply(currentVh);
  } catch (err) {
    console.error("[akif-intro] initial apply() failed:", err);
  }

  window.addEventListener("scroll", readTarget, { passive: true });
  window.addEventListener("resize", readTarget);
  // back on Home: the router has shown Home and put it at the top. The eased
  // position still holds wherever Home was left (the loop stops on other
  // pages), so easing from there would play every scene backwards. Arriving
  // on a page is not a scroll: start at the real position, drawn right away,
  // in the same frame (the router sends this before anything is painted).
  document.addEventListener("akif:route", function () {
    if (document.body.classList.contains("subpage")) return;
    targetVh = (window.scrollY / window.innerHeight) * 100;
    currentVh = targetVh;
    try {
      apply(currentVh);
    } catch (err) {
      console.error("[akif-intro] apply() on arrival failed:", err);
    }
  });
  wake();

  if (!prefersReduced) {
    window.addEventListener("pointermove", onPointerMove);
  }

  // ---- the keyboard through the story. Home's links only exist (are not
  // inert) while their scene is on screen, so from the heading (where the
  // skip link puts the focus) the next Tab found nothing and left the page.
  // Now Tab / Shift+Tab from the heading or one of Home's links takes the
  // story to the scene of the next link, and focuses that link once it can
  // be seen. A link that is already there gets the browser's own Tab. ----
  var homeView = document.getElementById("homeView");
  var homeHeading = homeView ? homeView.querySelector("h1") : null;
  var stops = [];
  function stopsAt(el, vh) { if (el) [].forEach.call(el.matches("a") ? [el] : el.querySelectorAll("a"), function (a) { stops.push({ el: a, vh: vh }); }); }
  stopsAt(teaser, B4);                      // Uitgelicht werk: with 04
  stopsAt(galleryProjects, (S2 + S3) / 2);  // the three projects + all work
  stopsAt(finalNav, S6);                    // about me / let's talk ...
  stopsAt(finalFooter, S6);                 // ... and the footer, settled together
  function reachable(el) { return !el.closest("[inert]"); }
  var pending = 0;
  function goTo(stop) {
    window.scrollTo(0, stop.vh / 100 * window.innerHeight);
    var t0 = performance.now();
    cancelAnimationFrame(pending);
    (function wait() {
      if (document.body.classList.contains("subpage")) return;
      if (reachable(stop.el)) { stop.el.focus({ preventScroll: true }); return; }
      if (performance.now() - t0 < 2500) pending = requestAnimationFrame(wait);
    })();
  }
  document.addEventListener("keydown", function (e) {
    if (e.key !== "Tab" || e.altKey || e.ctrlKey || e.metaKey || document.body.classList.contains("subpage")) return;
    var a = document.activeElement, i = -1;
    if (a !== homeHeading) {
      for (var k = 0; k < stops.length; k++) if (stops[k].el === a) i = k;
      if (i < 0) return;
    }
    var next = stops[i + (e.shiftKey ? -1 : 1)];
    // the first link back, or the last one on: the browser's own way out
    if (!next || reachable(next.el)) return;
    e.preventDefault();
    goTo(next);
  });
})();
