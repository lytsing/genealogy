;(function () {
  var DESKTOP_QUERY = "(min-width: 1280px)";
  var SCROLL_OFFSET = 20; // 跳转时距离顶部的留白

  function getScrollContainer() {
    return (
      document.querySelector(".book-body .body-inner") ||
      document.querySelector(".body-inner") ||
      document.querySelector(".book-body")
    );
  }

  function getHeadingText(heading) {
    // 克隆后剔除 share-links.js 注入的"复制链接"按钮，再取纯文本
    var clone = heading.cloneNode(true);
    var anchor = clone.querySelector(".share-anchor");
    if (anchor) anchor.remove();
    return clone.textContent.replace(/\s+/g, " ").trim();
  }

  function clearToc() {
    var existing = document.querySelector(".page-toc");
    if (existing) existing.remove();
  }

  function scrollItemIntoView(item) {
    var nav = document.querySelector(".page-toc");
    if (!nav) return;
    var top = item.offsetTop;
    var bottom = top + item.offsetHeight;
    var navTop = nav.scrollTop;
    var navBottom = navTop + nav.clientHeight;
    if (top < navTop + 8) {
      nav.scrollTop = top - 8;
    } else if (bottom > navBottom - 8) {
      nav.scrollTop = bottom - nav.clientHeight + 8;
    }
  }

  function setupActiveTracking(items) {
    var container = getScrollContainer();
    if (!container || !window.IntersectionObserver) return null;

    var visible = new Map();
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          visible.set(entry.target, entry.isIntersecting);
        });

        // 选第一个仍在可视区的标题作为"当前节"
        var active = null;
        for (var i = 0; i < items.length; i++) {
          if (visible.get(items[i].heading)) {
            active = items[i];
            break;
          }
        }

        // 若都不在视区（如向下滚到了某节中间），回退到"已经经过的最后一个"
        if (!active) {
          var scrollTop = container.scrollTop + 80;
          for (var j = items.length - 1; j >= 0; j--) {
            if (items[j].heading.offsetTop <= scrollTop) {
              active = items[j];
              break;
            }
          }
        }

        items.forEach(function (it) {
          if (it === active) {
            it.element.classList.add("page-toc__item--active");
            scrollItemIntoView(it.element);
          } else {
            it.element.classList.remove("page-toc__item--active");
          }
        });
      },
      {
        root: container,
        rootMargin: "-15% 0px -70% 0px",
        threshold: 0,
      }
    );

    items.forEach(function (it) {
      observer.observe(it.heading);
    });
    return observer;
  }

  function buildToc() {
    clearToc();

    if (!window.matchMedia(DESKTOP_QUERY).matches) return;

    var headings = document.querySelectorAll(".markdown-section h2[id]");
    if (headings.length < 2) return;

    var nav = document.createElement("nav");
    nav.className = "page-toc";
    nav.setAttribute("aria-label", "本页目录");

    var title = document.createElement("div");
    title.className = "page-toc__title";
    title.textContent = "本页目录";
    nav.appendChild(title);

    var list = document.createElement("ul");
    list.className = "page-toc__list";

    var items = [];
    Array.prototype.forEach.call(headings, function (h) {
      var item = document.createElement("li");
      item.className = "page-toc__item";

      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "page-toc__link";
      btn.textContent = getHeadingText(h);

      btn.addEventListener("click", function () {
        var container = getScrollContainer();
        if (!container) return;
        container.scrollTo({
          top: Math.max(0, h.offsetTop - SCROLL_OFFSET),
          behavior: "smooth",
        });
        if (history.replaceState) {
          history.replaceState(null, "", "#" + encodeURIComponent(h.id));
        }
      });

      item.appendChild(btn);
      list.appendChild(item);
      items.push({ element: item, button: btn, heading: h });
    });

    nav.appendChild(list);
    document.body.appendChild(nav);

    setupActiveTracking(items);
  }

  // resize 节流：避免拖拽窗口频繁重建
  var resizeTimer = null;
  function scheduleRebuild() {
    if (resizeTimer) window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(buildToc, 150);
  }

  window.addEventListener("load", function () {
    // 延后一拍，等 share-links.js 注入完按钮再读 textContent
    window.setTimeout(buildToc, 0);
  });
  window.addEventListener("resize", scheduleRebuild);

  if (typeof gitbook !== "undefined" && gitbook.events && gitbook.events.bind) {
    gitbook.events.bind("page.change", function () {
      window.setTimeout(buildToc, 0);
    });
  }
})();
