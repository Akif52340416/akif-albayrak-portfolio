(function () {
  // Case studies (Van der Hammen, Unite, Talia). Detail crops and next-project
  // thumbnails reuse the hero screenshot of their case (copying its src), so
  // the image path is written only once per case.
  var views = document.querySelectorAll('.page-cs');
  if (!views.length) return;

  document.querySelectorAll('.page-cs img[data-cs-clone]').forEach(function (img) {
    var source = document.getElementById(img.getAttribute('data-cs-clone'));
    if (source) img.src = source.src;
  });

  // Same fade-up approach as /about: each element reveals once as it enters view.
  // .cs-unveil elements start fully clipped (clip-path), which makes the browser
  // treat them as never intersecting — so those are watched through their parent.
  var els = document.querySelectorAll('.page-cs .cs-reveal, .page-cs .cs-unveil');
  if (!els.length) return;
  if (!('IntersectionObserver' in window)) {
    els.forEach(function (el) { el.classList.add('cs-in'); });
    return;
  }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target._csTargets.forEach(function (el) { el.classList.add('cs-in'); });
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
  els.forEach(function (el) {
    var trigger = el.classList.contains('cs-unveil') ? el.parentElement : el;
    (trigger._csTargets = trigger._csTargets || []).push(el);
    io.observe(trigger);
  });
})();
