;(function () {
  var btn = null;

  function isMobile() {
    return window.matchMedia("(max-width: 600px)").matches;
  }

  function createButton() {
    if (btn) return btn;
    btn = document.createElement("button");
    btn.type = "button";
    btn.className = "toc-toggle";
    btn.setAttribute("aria-label", "目录");
    btn.innerHTML = "&#9776;";
    document.body.appendChild(btn);

    btn.addEventListener("click", function () {
      var book = document.querySelector(".book");
      if (!book) return;
      book.classList.remove("without-animation");
      book.classList.toggle("with-summary");
    });

    return btn;
  }

  function setup() {
    if (!isMobile()) return;
    createButton();
  }

  function onResize() {
    if (!btn) return;
    if (isMobile()) {
      btn.style.display = "";
    } else {
      btn.style.display = "none";
    }
  }

  setup();
  document.addEventListener("DOMContentLoaded", setup);
  window.addEventListener("load", setup);
  window.addEventListener("resize", onResize);

  if (typeof gitbook !== "undefined" && gitbook.events && gitbook.events.bind) {
    gitbook.events.bind("page.change", setup);
  }
})();
