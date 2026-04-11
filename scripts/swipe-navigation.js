;(function () {
  var touchStartX = 0;
  var touchStartY = 0;
  var touchStartTime = 0;
  var touchStartEl = null;

  // Minimum horizontal distance to count as a swipe
  var SWIPE_MIN_X = 60;
  // Max ratio |dy|/|dx| — keeps it clearly horizontal
  var SWIPE_MAX_RATIO = 0.5;
  // Max duration in ms — longer drags are scrolling, not swiping
  var SWIPE_MAX_MS = 400;
  // Edge exclusion zone — reserve first/last 20px for iOS/Android system gestures
  var EDGE_GUARD = 20;

  // Returns true if the element (or any ancestor) scrolls horizontally
  function isHorizontalScrollable(el) {
    while (el && el !== document.body) {
      var tag = (el.tagName || "").toLowerCase();
      if (tag === "table" || tag === "pre") return true;
      var ox = window.getComputedStyle(el).overflowX;
      if ((ox === "auto" || ox === "scroll") && el.scrollWidth > el.clientWidth) {
        return true;
      }
      el = el.parentElement;
    }
    return false;
  }

  function onTouchStart(e) {
    if (e.touches.length !== 1) return;
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
    touchStartTime = Date.now();
    touchStartEl = e.target;
  }

  function onTouchEnd(e) {
    if (e.changedTouches.length !== 1) return;

    var dx = e.changedTouches[0].clientX - touchStartX;
    var dy = e.changedTouches[0].clientY - touchStartY;
    var dt = Date.now() - touchStartTime;
    var screenW = window.innerWidth;

    // Ignore weak, vertical, slow, or edge-origin gestures
    if (Math.abs(dx) < SWIPE_MIN_X) return;
    if (Math.abs(dy) > Math.abs(dx) * SWIPE_MAX_RATIO) return;
    if (dt > SWIPE_MAX_MS) return;
    if (touchStartX < EDGE_GUARD || touchStartX > screenW - EDGE_GUARD) return;

    // Don't fire when touching a horizontally scrollable element
    if (isHorizontalScrollable(touchStartEl)) return;

    if (dx > 0) {
      var prev = document.querySelector("a.navigation-prev");
      if (prev && prev.href) window.location.href = prev.href;
    } else {
      var next = document.querySelector("a.navigation-next");
      if (next && next.href) window.location.href = next.href;
    }
  }

  function setup() {
    var target = document.querySelector(".book-body") || document.body;
    if (!target || target.__swipeNavBound) return;
    target.__swipeNavBound = true;
    target.addEventListener("touchstart", onTouchStart, { passive: true });
    target.addEventListener("touchend", onTouchEnd, { passive: true });
  }

  setup();
  document.addEventListener("DOMContentLoaded", setup);
  window.addEventListener("load", setup);

  if (typeof gitbook !== "undefined" && gitbook.events && gitbook.events.bind) {
    gitbook.events.bind("page.change", setup);
  }
})();
