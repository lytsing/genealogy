/**
 * Collapse the `<br><br>` artifacts that HonKit's markdown renderer emits.
 *
 * HonKit serializes a single markdown line break (`<br>` or two-trailing-space)
 * as XML-style `<br></br>`. Chromium's HTML parser sees the stray `</br>` end
 * tag and parses it as another `<br>` start tag, so a single intended line
 * break renders as TWO line breaks — most visible in poetry / verse blocks
 * (e.g. 谱首寄语 的《族谱出版诗四首》). This walks the markdown body once on
 * load and merges adjacent <br>s back to a single break.
 *
 * The same fix is also applied during PDF extraction in
 * `scripts/build-pdf.js` (extractSection), since the PDF flow doesn't load
 * runtime scripts.
 */
(function () {
  function fix(root) {
    // Walk every <br> and remove only those whose IMMEDIATE preceding DOM
    // node (text or element) is also a <br>. The CSS adjacent selector
    // `br + br` is wrong here — it skips text nodes and would collapse a
    // legitimate sequence of `text<br>text<br>text<br>` to a single break.
    var brs = root.querySelectorAll("br");
    for (var i = 0; i < brs.length; i++) {
      var br = brs[i];
      var prev = br.previousSibling;
      if (prev && prev.nodeName === "BR") br.remove();
    }
  }
  function run() {
    var section = document.querySelector(".markdown-section");
    if (section) fix(section);
  }
  // Run once on initial load AND whenever HonKit swaps in a new page.
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", run);
  } else {
    run();
  }
  if (window.gitbook && gitbook.events) {
    gitbook.events.bind("page.change", run);
  }
})();
