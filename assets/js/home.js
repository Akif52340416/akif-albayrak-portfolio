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

  var annotHardware = safeGet("annotHardware");
  var annotTrouble = safeGet("annotTrouble");
  var annotEndUsers = safeGet("annotEndUsers");

  var prefersReduced = false;
  try {
    if (window.matchMedia) {
      prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    }
  } catch (err) {
    console.error("[akif-intro] matchMedia check failed:", err);
  }

  // three persistent anchor points; only their label text changes as the story develops
  var annotSets = [
    ["HARDWARE", "TROUBLESHOOTING", "END USERS"],   // 01 SUPPORT
    ["HTML / CSS", "JAVASCRIPT", "PHP / C#"],        // 02 SOFTWARE
    ["PYTHON", "SQL", "MACHINE DATA"],               // 03 SYSTEMS
    ["PROCESS", "AUTOMATION", "IT / SOFTWARE"]       // 04 IMPROVEMENT
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
  // dark veil that already closes the introduction
  var NC = 670;  // education settled
  var N5 = 730;  // education exits -> canvas clears

  // ---- STILL BUILDING. is the bridge: its own clean state first, then it
  // transforms into the three-project gallery (the evidence, with the link
  // to all work right under it), then closes into the final actions and
  // footer. VIEW ALL WORK no longer has a scene of its own (that was 80vh).
  var S1 = 830;  // STILL BUILDING. settled, on its own
  var S2 = 990;  // transform complete: heading shrunk, gallery fully composed
  var S3 = 1130; // gallery hold ends
  var S4 = 1200; // gallery cleared
  var S5 = 1250; // final actions settled
  var S6 = 1310; // footer settled

  var storyCurrent = document.getElementById("storyCurrent");

  var stillBuilding = document.getElementById("stillBuilding");
  var stillBuildingHeading = document.getElementById("stillBuildingHeading");
  var stillBuildingSub = document.getElementById("stillBuildingSub");
  var galleryProjects = document.getElementById("galleryProjects");
  var galleryItems = galleryProjects ? Array.prototype.slice.call(galleryProjects.querySelectorAll(".gallery-item")) : [];
  var finalNav = document.getElementById("finalNav");
  var finalFooter = document.getElementById("finalFooter");

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

    var entranceEnvelope = clamp01((e0 - 0.55) / 0.18);
    var dip = 1 - 0.4 * (bump(e1, 0.5, 0.1) + bump(e2, 0.5, 0.1) + bump(e3, 0.5, 0.1));
    var annotOpacity = entranceEnvelope * dip * (1 - e4);
    var structured = annotIndex >= 1;

    [annotHardware, annotTrouble, annotEndUsers].forEach(function (el, i) {
      if (!el) return;
      el.style.opacity = String(annotOpacity);
      var label = el.querySelector(".a-label");
      if (label) label.textContent = set[i];
      el.classList.toggle("structured", structured);
    });

    var teaserOpacity = (e3 > 0.85 ? (e3 - 0.85) / 0.15 : 0) * (1 - e4);
    if (teaser) teaser.style.opacity = String(teaserOpacity);
    live(teaser, teaserOpacity > 0.6);

    // ---- the chapter break on the same dark veil that already closed the
    // introduction: OPLEIDING — NU / MBO 4 enters once 04 has gone (e4
    // ends at B5), holds, then leaves the canvas clear for STILL BUILDING.
    var eNC = easeInOutCubic(clamp01((scrollVh - B5) / (NC - B5)));  // chapter break -> education
    var eN5 = easeInOutCubic(clamp01((scrollVh - NC) / (N5 - NC)));  // education exits
    crossfade(storyCurrent, eNC, eN5);

    // ---- STILL BUILDING. is the bridge between story and work. The canvas
    // is already clear (the same veil that closed the introduction); the
    // statement arrives on its own first, holds, then transforms — scale
    // and position shift as the three real projects enter beneath it.
    // Statement -> evidence, one continuous composition, not a hard cut.
    var eA = easeInOutCubic(clamp01((scrollVh - N5) / (S1 - N5))); // clear canvas -> STILL BUILDING. enters
    var eB = easeInOutCubic(clamp01((scrollVh - S1) / (S2 - S1))); // STILL BUILDING. transforms -> gallery composed
    var eC = easeInOutCubic(clamp01((scrollVh - S3) / (S4 - S3))); // gallery hold ends -> clears
    var eD = easeInOutCubic(clamp01((scrollVh - S4) / (S5 - S4))); // canvas clear -> final actions
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

    // final actions: About me / Let's talk, then the minimal footer joins
    var navOpacity = clamp01(eD);
    if (finalNav) {
      finalNav.style.opacity = String(navOpacity);
      finalNav.style.transform = "translateY(" + lerp(14, 0, navOpacity) + "px)";
      live(finalNav, navOpacity > 0.6);
    }

    var footerOpacity = clamp01(eE);
    if (finalFooter) {
      finalFooter.style.opacity = String(footerOpacity);
      live(finalFooter, footerOpacity > 0.6);
    }

    // the light layer (home-motion.js) follows the same position from this
    // same loop: the trail through the chapters, the light over the
    // education headline and the light behind STILL BUILDING.
    if (window.akifHomeFx) window.akifHomeFx(scrollVh, mobile, { sb: sbOpacity * (1 - eC), eB: eB, nc: eNC, n5: eN5 });
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

  function onPointerMove(e) {
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
  // back on Home: router.js loads after this script, so its hashchange
  // handler (which removes .subpage) runs after this one; wait one tick
  window.addEventListener("hashchange", function () { setTimeout(readTarget, 0); });
  wake();

  if (!prefersReduced) {
    window.addEventListener("pointermove", onPointerMove);
  }
})();
