;(function () {
  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text);
    }
    return new Promise(function (resolve, reject) {
      var textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.setAttribute("readonly", "readonly");
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      textarea.style.left = "-9999px";
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      try {
        var ok = document.execCommand("copy");
        document.body.removeChild(textarea);
        if (ok) resolve();
        else reject(new Error("copy failed"));
      } catch (err) {
        document.body.removeChild(textarea);
        reject(err);
      }
    });
  }

  function flashButton(button, ok) {
    var original = button.textContent;
    button.textContent = ok ? "已复制" : "复制失败";
    button.classList.add("share-anchor--flash");
    window.setTimeout(function () {
      button.textContent = original;
      button.classList.remove("share-anchor--flash");
    }, 1200);
  }

  function buildShareUrl(id) {
    var base = window.location.origin + window.location.pathname;
    return base + "#" + encodeURIComponent(id);
  }

  function setupShareLinks() {
    var headings = document.querySelectorAll(".markdown-section h1[id], .markdown-section h2[id], .markdown-section h3[id], .markdown-section h4[id]");
    for (var i = 0; i < headings.length; i++) {
      var heading = headings[i];
      if (heading.querySelector(".share-anchor")) continue;

      var id = heading.getAttribute("id");
      if (!id) continue;

      var button = document.createElement("button");
      button.type = "button";
      button.className = "share-anchor";
      button.setAttribute("aria-label", "复制本节链接");
      button.textContent = "复制链接";

      button.addEventListener("click", (function (targetId, targetBtn) {
        return function () {
          copyText(buildShareUrl(targetId))
            .then(function () {
              flashButton(targetBtn, true);
            })
            .catch(function () {
              flashButton(targetBtn, false);
            });
        };
      })(id, button));

      heading.classList.add("heading-with-share");
      heading.appendChild(button);

      (function (targetHeading) {
        var pressTimer = null;
        var clearPressTimer = function () {
          if (pressTimer) {
            window.clearTimeout(pressTimer);
            pressTimer = null;
          }
        };

        targetHeading.addEventListener("touchstart", function () {
          clearPressTimer();
          pressTimer = window.setTimeout(function () {
            targetHeading.classList.add("show-share");
            window.setTimeout(function () {
              targetHeading.classList.remove("show-share");
            }, 3000);
          }, 420);
        }, { passive: true });

        targetHeading.addEventListener("touchend", clearPressTimer, { passive: true });
        targetHeading.addEventListener("touchcancel", clearPressTimer, { passive: true });
      })(heading);
    }
  }

  window.addEventListener("load", setupShareLinks);
  if (typeof gitbook !== "undefined" && gitbook.events && gitbook.events.bind) {
    gitbook.events.bind("page.change", setupShareLinks);
  }
})();
