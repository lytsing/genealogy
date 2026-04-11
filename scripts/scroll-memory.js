;(function () {
  var KEY_PREFIX = "scroll:";

  function getKey() {
    return KEY_PREFIX + window.location.pathname;
  }

  function getContainer() {
    return (
      document.querySelector(".book-body .body-inner") ||
      document.querySelector(".body-inner") ||
      document.querySelector(".book-body")
    );
  }

  function save() {
    var el = getContainer();
    if (!el) return;
    try {
      sessionStorage.setItem(getKey(), el.scrollTop);
    } catch (e) {}
  }

  function restore() {
    var el = getContainer();
    if (!el) return;
    var saved;
    try {
      saved = parseInt(sessionStorage.getItem(getKey()), 10);
    } catch (e) {}
    if (saved > 0) el.scrollTop = saved;
  }

  function setup() {
    restore();
    var el = getContainer();
    if (!el || el.__scrollMemoryBound) return;
    el.__scrollMemoryBound = true;
    el.addEventListener("scroll", save, { passive: true });
  }

  window.addEventListener("load", setup);

  if (typeof gitbook !== "undefined" && gitbook.events && gitbook.events.bind) {
    gitbook.events.bind("page.change", function () {
      // Let the new page render before restoring
      setTimeout(setup, 50);
    });
  }
})();
