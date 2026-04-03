;(function () {
  function forEachNodeList(list, fn) {
    for (var i = 0; i < list.length; i++) fn(list[i], i);
  }

  function optimizeImages() {
    var images = document.querySelectorAll(".markdown-section img");
    forEachNodeList(images, function (img, index) {
      if (!img.getAttribute("decoding")) {
        img.setAttribute("decoding", "async");
      }
      if (!img.getAttribute("loading")) {
        img.setAttribute("loading", index === 0 ? "eager" : "lazy");
      }
      if (index > 0 && !img.getAttribute("fetchpriority")) {
        img.setAttribute("fetchpriority", "low");
      }
      if (index === 0 && !img.getAttribute("fetchpriority")) {
        img.setAttribute("fetchpriority", "high");
      }
    });
  }

  window.addEventListener("load", optimizeImages);
  if (typeof gitbook !== "undefined" && gitbook.events && gitbook.events.bind) {
    gitbook.events.bind("page.change", optimizeImages);
  }
})();
