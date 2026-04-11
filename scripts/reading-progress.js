;(function () {
  var bar = null;

  function createBar() {
    if (bar) return bar;
    bar = document.createElement("div");
    bar.className = "reading-progress";
    bar.setAttribute("role", "progressbar");
    bar.setAttribute("aria-hidden", "true");
    document.body.appendChild(bar);
    return bar;
  }

  function getContainer() {
    return (
      document.querySelector(".book-body .body-inner") ||
      document.querySelector(".body-inner") ||
      document.querySelector(".book-body")
    );
  }

  function update() {
    var b = createBar();
    var el = getContainer();
    if (!el) return;
    var max = el.scrollHeight - el.clientHeight;
    var pct = max > 0 ? Math.min(100, (el.scrollTop / max) * 100) : 0;
    b.style.width = pct + "%";
  }

  function setup() {
    createBar();
    update();
    var el = getContainer();
    if (!el || el.__progressBound) return;
    el.__progressBound = true;
    el.addEventListener("scroll", update, { passive: true });
  }

  window.addEventListener("load", setup);

  if (typeof gitbook !== "undefined" && gitbook.events && gitbook.events.bind) {
    gitbook.events.bind("page.change", function () {
      // Reset bar and rebind on new page
      if (bar) bar.style.width = "0%";
      var el = getContainer();
      if (el) el.__progressBound = false;
      setTimeout(setup, 0);
    });
  }
})();
