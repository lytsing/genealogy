;(function () {
  var overlay = null;

  function createOverlay() {
    if (overlay) return overlay;

    overlay = document.createElement("div");
    overlay.className = "lightbox-overlay";

    var closeBtn = document.createElement("button");
    closeBtn.type = "button";
    closeBtn.className = "lightbox-close";
    closeBtn.setAttribute("aria-label", "关闭");
    closeBtn.textContent = "\u00d7";
    overlay.appendChild(closeBtn);

    var imgWrap = document.createElement("div");
    imgWrap.className = "lightbox-img-wrap";
    overlay.appendChild(imgWrap);

    var img = document.createElement("img");
    img.className = "lightbox-img";
    imgWrap.appendChild(img);

    document.body.appendChild(overlay);

    closeBtn.addEventListener("click", closeLightbox);
    overlay.addEventListener("click", function (e) {
      if (e.target === overlay || e.target === imgWrap) closeLightbox();
    });

    return overlay;
  }

  // --- Scroll lock (robust iOS support) ---
  var scrollLockScrollY = 0;

  function lockScroll() {
    scrollLockScrollY = window.scrollY || window.pageYOffset || 0;
    document.body.style.cssText =
      "position:fixed;width:100%;top:-" + scrollLockScrollY + "px;overflow-y:scroll;";
    // Also lock the GitBook scroll container if present
    var inner = document.querySelector(".book-body .body-inner") ||
                document.querySelector(".body-inner");
    if (inner) {
      inner.__savedOverflow = inner.style.overflow;
      inner.style.overflow = "hidden";
    }
  }

  function unlockScroll() {
    document.body.style.cssText = "";
    window.scrollTo(0, scrollLockScrollY);
    var inner = document.querySelector(".book-body .body-inner") ||
                document.querySelector(".body-inner");
    if (inner && inner.__savedOverflow !== undefined) {
      inner.style.overflow = inner.__savedOverflow;
      delete inner.__savedOverflow;
    }
  }

  function openLightbox(src, alt) {
    var el = createOverlay();
    var img = el.querySelector(".lightbox-img");
    img.src = src;
    img.alt = alt || "";

    // Reset any previous transform
    var wrap = el.querySelector(".lightbox-img-wrap");
    wrap.style.transform = "";
    currentScale = 1;
    currentX = 0;
    currentY = 0;

    // Force reflow then add visible class for animation
    el.offsetHeight; // eslint-disable-line no-unused-expressions
    el.classList.add("lightbox-visible");
    lockScroll();
    attachOverlayTouch();

    // Android back button: push a history entry so back closes the lightbox
    if (window.history && window.history.pushState) {
      window.history.pushState({ lightbox: true }, "");
    }
  }

  function closeLightbox() {
    if (!overlay) return;
    detachOverlayTouch();
    overlay.classList.remove("lightbox-visible");
    unlockScroll();
  }

  // Handle Android hardware back button
  window.addEventListener("popstate", function (e) {
    if (overlay && overlay.classList.contains("lightbox-visible")) {
      closeLightbox();
    }
  });

  // --- Pinch-zoom & pan state ---
  var currentScale = 1;
  var currentX = 0;
  var currentY = 0;
  var startDist = 0;
  var startScale = 1;
  var startX = 0;
  var startY = 0;
  var startMidX = 0;
  var startMidY = 0;
  var isPinching = false;
  var isPanning = false;

  function getDistance(t1, t2) {
    var dx = t1.clientX - t2.clientX;
    var dy = t1.clientY - t2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  function getMidpoint(t1, t2) {
    return {
      x: (t1.clientX + t2.clientX) / 2,
      y: (t1.clientY + t2.clientY) / 2
    };
  }

  function applyTransform(wrap) {
    wrap.style.transform =
      "translate(" + currentX + "px, " + currentY + "px) scale(" + currentScale + ")";
  }

  function handleTouchStart(e) {
    if (!overlay || !overlay.classList.contains("lightbox-visible")) return;
    var wrap = overlay.querySelector(".lightbox-img-wrap");
    if (!wrap) return;

    if (e.touches.length === 2) {
      isPinching = true;
      isPanning = false;
      startDist = getDistance(e.touches[0], e.touches[1]);
      startScale = currentScale;
      var mid = getMidpoint(e.touches[0], e.touches[1]);
      startMidX = mid.x;
      startMidY = mid.y;
      startX = currentX;
      startY = currentY;
    } else if (e.touches.length === 1 && currentScale > 1) {
      isPanning = true;
      isPinching = false;
      startMidX = e.touches[0].clientX;
      startMidY = e.touches[0].clientY;
      startX = currentX;
      startY = currentY;
    }
  }

  function handleTouchMove(e) {
    if (!overlay || !overlay.classList.contains("lightbox-visible")) return;
    // Always prevent scroll bleed-through on iOS
    e.preventDefault();
    var wrap = overlay.querySelector(".lightbox-img-wrap");
    if (!wrap) return;

    if (isPinching && e.touches.length === 2) {
      var dist = getDistance(e.touches[0], e.touches[1]);
      var scale = Math.min(Math.max(startScale * (dist / startDist), 1), 5);
      var mid = getMidpoint(e.touches[0], e.touches[1]);

      currentScale = scale;
      currentX = startX + (mid.x - startMidX);
      currentY = startY + (mid.y - startMidY);
      applyTransform(wrap);
    } else if (isPanning && e.touches.length === 1 && currentScale > 1) {
      currentX = startX + (e.touches[0].clientX - startMidX);
      currentY = startY + (e.touches[0].clientY - startMidY);
      applyTransform(wrap);
    }
  }

  function handleTouchEnd() {
    if (isPinching || isPanning) {
      isPinching = false;
      isPanning = false;
      // Snap back to scale 1 if close
      if (currentScale < 1.05) {
        currentScale = 1;
        currentX = 0;
        currentY = 0;
        if (overlay) {
          var wrap = overlay.querySelector(".lightbox-img-wrap");
          if (wrap) {
            wrap.style.transition = "transform 200ms ease";
            applyTransform(wrap);
            setTimeout(function () { wrap.style.transition = ""; }, 200);
          }
        }
      }
    }
  }

  // --- Double-tap to zoom ---
  var lastTap = 0;

  function handleDoubleTap(e) {
    if (!overlay || !overlay.classList.contains("lightbox-visible")) return;
    if (e.touches.length !== 1) return;

    var now = Date.now();
    if (now - lastTap < 300) {
      e.preventDefault();
      var wrap = overlay.querySelector(".lightbox-img-wrap");
      if (!wrap) return;

      if (currentScale > 1.05) {
        currentScale = 1;
        currentX = 0;
        currentY = 0;
      } else {
        currentScale = 2.5;
        // Zoom toward tap point
        var rect = wrap.getBoundingClientRect();
        var cx = rect.left + rect.width / 2;
        var cy = rect.top + rect.height / 2;
        currentX = (cx - e.touches[0].clientX) * 1.5;
        currentY = (cy - e.touches[0].clientY) * 1.5;
      }
      wrap.style.transition = "transform 250ms ease";
      applyTransform(wrap);
      setTimeout(function () { wrap.style.transition = ""; }, 250);
    }
    lastTap = now;
  }

  // Non-passive listeners only while overlay is open (avoids hurting page scroll).
  var overlayTouchBound = false;

  function onOverlayTouchStart(e) {
    handleDoubleTap(e);
    handleTouchStart(e);
  }

  function attachOverlayTouch() {
    if (!overlay || overlayTouchBound) return;
    overlayTouchBound = true;
    overlay.addEventListener("touchstart", onOverlayTouchStart, { passive: false });
    overlay.addEventListener("touchmove", handleTouchMove, { passive: false });
    overlay.addEventListener("touchend", handleTouchEnd, { passive: true });
  }

  function detachOverlayTouch() {
    if (!overlay || !overlayTouchBound) return;
    overlayTouchBound = false;
    overlay.removeEventListener("touchstart", onOverlayTouchStart, { passive: false });
    overlay.removeEventListener("touchmove", handleTouchMove, { passive: false });
    overlay.removeEventListener("touchend", handleTouchEnd, { passive: true });
  }

  // Escape to close
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" || e.keyCode === 27) closeLightbox();
  });

  // Reset zoom/pan when device rotates so the image doesn't drift off-screen
  window.addEventListener("orientationchange", function () {
    if (!overlay || !overlay.classList.contains("lightbox-visible")) return;
    var wrap = overlay.querySelector(".lightbox-img-wrap");
    if (!wrap) return;
    currentScale = 1;
    currentX = 0;
    currentY = 0;
    wrap.style.transition = "transform 200ms ease";
    applyTransform(wrap);
    setTimeout(function () { wrap.style.transition = ""; }, 200);
  });

  // Suppress context menu (long-press on iOS/Android) inside the lightbox
  document.addEventListener("contextmenu", function (e) {
    if (overlay && overlay.classList.contains("lightbox-visible")) {
      e.preventDefault();
    }
  });

  // --- Bind click on images ---
  function setupLightbox() {
    var images = document.querySelectorAll(".markdown-section img");
    for (var i = 0; i < images.length; i++) {
      (function (img) {
        if (img.__lightboxBound) return;
        img.__lightboxBound = true;
        img.style.cursor = "zoom-in";
        img.addEventListener("click", function () {
          openLightbox(img.src, img.alt);
        });
      })(images[i]);
    }
  }

  window.addEventListener("load", setupLightbox);
  if (typeof gitbook !== "undefined" && gitbook.events && gitbook.events.bind) {
    gitbook.events.bind("page.change", setupLightbox);
  }
})();
