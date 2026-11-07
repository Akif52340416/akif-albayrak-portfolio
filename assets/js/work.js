(function () {
  var list = document.getElementById('workList');
  if (!list) return;
  var entries = list.querySelectorAll('.work-entry');
  var frames = document.querySelectorAll('.work-preview-frame');

  // one project in focus: its preview shows, its row lights up; while the
  // pointer or the keyboard is in the list the other rows step back
  function showPreview(targetId, inList) {
    frames.forEach(function (frame) {
      frame.classList.toggle('is-shown', frame.id === targetId);
    });
    entries.forEach(function (entry) {
      entry.classList.toggle('is-active', entry.getAttribute('data-preview') === targetId);
    });
    list.classList.toggle('has-focus', !!inList);
  }

  entries.forEach(function (entry) {
    var targetId = entry.getAttribute('data-preview');
    if (!targetId) return;
    // Hover = preview only; a click follows the link to the case study.
    entry.addEventListener('mouseenter', function () { showPreview(targetId, true); });
    // Keyboard focus mirrors hover, so Tab-ing through the list previews too.
    entry.addEventListener('focus', function () { showPreview(targetId, true); });

    // On phones every project shows its own devices under its row; tapping
    // them opens the same case study as the row.
    var frame = document.getElementById(targetId);
    if (frame) {
      frame.setAttribute('aria-hidden', 'true');
      frame.addEventListener('click', function () { window.location.hash = entry.getAttribute('href'); });
    }
  });

  // Leaving the list keeps the last preview, but nothing stays dimmed.
  list.addEventListener('mouseleave', function () { list.classList.remove('has-focus'); });
  list.addEventListener('focusout', function (e) {
    if (!list.contains(e.relatedTarget)) list.classList.remove('has-focus');
  });
})();
