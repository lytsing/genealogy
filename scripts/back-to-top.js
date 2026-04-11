;(function () {
  var btn = null;
  var SHOW_THRESHOLD = 300;

  function createButton() {
    if (btn) return btn;
    btn = document.createElement("button");
    btn.type = "button";
    btn.className = "back-to-top";
    btn.setAttribute("aria-label", "回到顶部");
    btn.innerHTML = "&#8593;";
    document.body.appendChild(btn);

    btn.addEventListener("click", function () {
      // Scroll all candidates to top (smooth scroll may throw on older WebViews)
      var candidates = [
        document.querySelector(".book-body .body-inner"),
        document.querySelector(".body-inner"),
        document.querySelector(".book-body"),
        document.querySelector(".page-wrapper")
      ];
      for (var i = 0; i < candidates.length; i++) {
        var el = candidates[i];
        if (el && el.scrollTop > 0) {
          try {
            if (typeof el.scrollTo === "function") {
              el.scrollTo({ top: 0, behavior: "smooth" });
            } else {
              el.scrollTop = 0;
            }
          } catch (e) {
            el.scrollTop = 0;
          }
        }
      }
      try {
        window.scrollTo({ top: 0, behavior: "smooth" });
      } catch (e) {
        try {
          window.scrollTo(0, 0);
        } catch (e2) {
          if (document.documentElement) document.documentElement.scrollTop = 0;
          if (document.body) document.body.scrollTop = 0;
        }
      }
    });

    return btn;
  }

  function getScrollTop() {
    var candidates = [
      document.querySelector(".book-body .body-inner"),
      document.querySelector(".body-inner"),
      document.querySelector(".book-body"),
      document.querySelector(".page-wrapper")
    ];
    var max = 0;
    for (var i = 0; i < candidates.length; i++) {
      if (candidates[i] && candidates[i].scrollTop > max) {
        max = candidates[i].scrollTop;
      }
    }
    if (window.pageYOffset > max) max = window.pageYOffset;
    return max;
  }

  function onScroll() {
    var button = createButton();
    if (getScrollTop() > SHOW_THRESHOLD) {
      button.classList.add("back-to-top-visible");
    } else {
      button.classList.remove("back-to-top-visible");
    }
  }

  function bindScroll() {
    var targets = [
      document.querySelector(".book-body .body-inner"),
      document.querySelector(".body-inner"),
      document.querySelector(".book-body"),
      document.querySelector(".page-wrapper")
    ];
    for (var i = 0; i < targets.length; i++) {
      if (targets[i] && !targets[i].__backToTopBound) {
        targets[i].__backToTopBound = true;
        targets[i].addEventListener("scroll", onScroll, { passive: true });
      }
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  // Run immediately since DOM exists at this point in the page
  bindScroll();
  document.addEventListener("DOMContentLoaded", bindScroll);
  window.addEventListener("load", bindScroll);

  if (typeof gitbook !== "undefined" && gitbook.events && gitbook.events.bind) {
    gitbook.events.bind("page.change", bindScroll);
  }
})();
