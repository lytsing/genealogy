;(function () {
  function updateHintState(table) {
    var max = table.scrollWidth - table.clientWidth;
    var x = table.scrollLeft || 0;
    var canScroll = max > 4;

    if (!canScroll) {
      table.classList.remove("table-scrollable");
      table.classList.remove("table-hint-left");
      table.classList.remove("table-hint-right");
      return;
    }

    table.classList.add("table-scrollable");

    if (x > 4) table.classList.add("table-hint-left");
    else table.classList.remove("table-hint-left");

    if (x < max - 4) table.classList.add("table-hint-right");
    else table.classList.remove("table-hint-right");
  }

  function bindTable(table) {
    if (table.__hintBound) return;
    table.__hintBound = true;
    table.addEventListener("scroll", function () {
      updateHintState(table);
    });
    updateHintState(table);
  }

  function setupTableScrollHints() {
    var tables = document.querySelectorAll(".markdown-section table");
    for (var i = 0; i < tables.length; i++) {
      bindTable(tables[i]);
      updateHintState(tables[i]);
    }
  }

  window.addEventListener("load", setupTableScrollHints);
  window.addEventListener("resize", setupTableScrollHints);

  if (typeof gitbook !== "undefined" && gitbook.events && gitbook.events.bind) {
    gitbook.events.bind("page.change", setupTableScrollHints);
  }
})();
