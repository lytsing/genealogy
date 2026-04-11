;(function () {
  var btn = null;
  var backdrop = null;

  function isMobile() {
    return window.matchMedia("(max-width: 600px)").matches;
  }

  function createBackdrop() {
    if (backdrop) return backdrop;
    backdrop = document.createElement("div");
    backdrop.className = "toc-backdrop";
    document.body.appendChild(backdrop);
    backdrop.addEventListener("click", closeSidebar);
    return backdrop;
  }

  function closeSidebar() {
    var book = document.querySelector(".book");
    if (book) book.classList.remove("with-summary");
    if (backdrop) backdrop.classList.remove("toc-backdrop-visible");
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
      var bd = createBackdrop();
      if (book.classList.contains("with-summary")) {
        bd.classList.add("toc-backdrop-visible");
      } else {
        bd.classList.remove("toc-backdrop-visible");
      }
    });

    return btn;
  }

  function setup() {
    if (!isMobile()) return;
    createButton();
    createBackdrop();
  }

  function onResize() {
    if (!btn) return;
    if (isMobile()) {
      btn.style.display = "";
    } else {
      btn.style.display = "none";
      // Close sidebar when resizing to desktop
      closeSidebar();
    }
  }

  setup();
  document.addEventListener("DOMContentLoaded", setup);
  window.addEventListener("load", setup);
  window.addEventListener("resize", onResize);

  if (typeof gitbook !== "undefined" && gitbook.events && gitbook.events.bind) {
    gitbook.events.bind("page.change", function () {
      setup();
      // Close sidebar on page navigation
      closeSidebar();
    });
  }
})();
