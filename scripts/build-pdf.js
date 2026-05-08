#!/usr/bin/env node
/**
 * Build a PDF from the HonKit website output using headless Chromium.
 *
 * Why this exists: HonKit's built-in PDF flow goes through Calibre's
 * ebook-convert, which on Calibre 9.x produces a PDF whose outline (left-side
 * bookmarks) collapses every chapter to page 1 — see HonKit issue #117. This
 * script bypasses Calibre, concatenates the already-rendered chapter HTML
 * files, and prints them with Chromium, which yields a clickable, accurate
 * PDF outline auto-generated from H1/H2 headings.
 *
 * Usage:
 *   npm run pdf            -> writes ./book.pdf
 *   npm run pdf -- foo.pdf -> writes ./foo.pdf
 */
"use strict";

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const ROOT = path.resolve(__dirname, "..");
const BOOK_DIR = path.join(ROOT, "_book");
const OUT_PDF = path.resolve(process.argv[2] || path.join(ROOT, "book.pdf"));

function ensureBuild() {
  if (!fs.existsSync(path.join(BOOK_DIR, "index.html"))) {
    console.log("[pdf] _book/ missing — running honkit build first…");
    const r = spawnSync("npx", ["honkit", "build"], {
      cwd: ROOT,
      stdio: "inherit",
    });
    if (r.status !== 0) process.exit(r.status || 1);
  }
}

function readSummary() {
  const md = fs.readFileSync(path.join(ROOT, "SUMMARY.md"), "utf8");
  const items = [];
  const re = /^\s*-\s*\[([^\]]+)\]\(([^)]+\.md)\)/gm;
  let m;
  while ((m = re.exec(md))) {
    // HonKit renames README.md -> index.html.
    const htmlName =
      m[2].toLowerCase() === "readme.md"
        ? "index.html"
        : m[2].replace(/\.md$/, ".html");
    items.push({ title: m[1], html: htmlName });
  }
  return items;
}

function extractSection(html) {
  const start = html.indexOf('<section class="normal markdown-section">');
  if (start < 0) return null;
  const end = html.indexOf("</section>", start);
  if (end < 0) return null;
  let body = html.slice(start, end + "</section>".length);

  // Drop the per-page footer + its inline scripts injected by tbfed-pagefooter
  body = body.replace(
    /<footer class="page-footer"[\s\S]*?<\/footer>\s*(?:<script[^>]*>[\s\S]*?<\/script>\s*){0,3}/g,
    ""
  );
  // Defensive cleanup: strip any share-anchor / page-toc that may have been
  // serialized statically (currently they're JS-injected, so usually absent).
  body = body.replace(/<button class="share-anchor[\s\S]*?<\/button>/g, "");
  body = body.replace(/<aside class="page-toc[\s\S]*?<\/aside>/g, "");

  // Drop the manual "← 继续向右滑动查看更多 →" hints under wide tables —
  // they only make sense in the scrollable web view and become misleading
  // ("nowhere to scroll") in the fully-rendered PDF.
  body = body.replace(
    /<p>\s*<em>[^<]*滑动查看[^<]*<\/em>\s*<\/p>/g,
    ""
  );

  return body;
}

function buildCombinedHtml(items) {
  const customCss = fs.readFileSync(
    path.join(ROOT, "styles/custom.css"),
    "utf8"
  );
  // Note: styles/pdf.css is intentionally NOT loaded here. It's a Calibre-era
  // stylesheet whose @page { @bottom-center { content: counter(page) } } rule
  // would draw a second page number stacked on top of puppeteer's
  // footerTemplate. custom.css + the inline print overrides below cover the
  // typography this flow needs.

  const sections = [];
  for (const it of items) {
    const file = path.join(BOOK_DIR, it.html);
    if (!fs.existsSync(file)) {
      console.warn("[pdf] missing:", file);
      continue;
    }
    const html = fs.readFileSync(file, "utf8");
    const sec = extractSection(html);
    if (!sec) {
      console.warn("[pdf] could not extract markdown-section from:", it.html);
      continue;
    }
    sections.push(`<article class="pdf-chapter">${sec}</article>`);
  }

  // Trailing slash so relative URLs (e.g. images/foo.jpg, gitbook/...) resolve.
  const baseHref = "file://" + BOOK_DIR + "/";

  return `<!DOCTYPE html>
<html lang="zh-hans">
<head>
<meta charset="UTF-8">
<base href="${baseHref}">
<title>黄福军公族谱</title>

<link rel="stylesheet" href="gitbook/honkit-plugin-katex/katex.min.css">

<!-- gitbook/style.css supplies Bootstrap-style .alert* classes + Font Awesome
     icons for the {% hint style='…' %} blocks. Loaded BEFORE custom.css so
     our typography rules still win where they overlap. The bundled relative
     url(fonts/fontawesome/…) inside that file resolves correctly because it
     uses the stylesheet's own URL as base. -->
<link rel="stylesheet" href="gitbook/style.css">
<link rel="stylesheet" href="gitbook/gitbook-plugin-hints/plugin-hints.css">

<style>
${customCss}
</style>

<style>
/* ===== PDF print overrides ===== */
html, body { background: #fff !important; margin: 0; padding: 0; }

/* Hide all website chrome that may have leaked through */
.book-summary, .book-header, .navigation,
.reading-progress, .back-to-top, .share-anchor, .page-toc,
.lightbox-overlay, footer.page-footer { display: none !important; }

.markdown-section {
  padding: 0 !important;
  max-width: none !important;
  font-size: 12pt;
  line-height: 1.85;
}

/* One chapter = one page-break boundary */
.pdf-chapter { page-break-before: always; break-before: page; }
.pdf-chapter:first-child { page-break-before: auto; break-before: auto; }

/* Cover page: contain title + image on a single A4 page.
   A4 content area ≈ 261mm tall; reserve room for H1 + page footer. */
.pdf-chapter:first-child {
  page-break-inside: avoid;
  break-inside: avoid;
}
.pdf-chapter:first-child .markdown-section img {
  display: block;
  max-width: 100%;
  max-height: 200mm;
  width: auto;
  height: auto;
  margin: 0 auto;
}

/* Avoid orphan headings at the bottom of a page */
.pdf-chapter h1, .pdf-chapter h2, .pdf-chapter h3, .pdf-chapter h4 {
  page-break-after: avoid;
  break-after: avoid-page;
}

/* Avoid lone-line widows/orphans across page breaks */
.markdown-section p, .markdown-section li {
  orphans: 2;
  widows: 2;
}

/* Headings: tighter line-height than body so multi-line titles don't gap */
.pdf-chapter h1,
.pdf-chapter h2,
.pdf-chapter h3,
.pdf-chapter h4 { line-height: 1.4; }

/* Blockquotes (e.g. 《遣子诗》): give them a real card so they read as a
   distinct quoted block, not just an indent. */
.markdown-section blockquote {
  background: #f6f6f6 !important;
  /* Darker, thicker left bar so blockquote is unambiguously distinct
     from the code-block panel (which has only a thin uniform border). */
  border-left: 4px solid #999 !important;
  border-radius: 0 4px 4px 0;
  padding: 0.7em 0.95em !important;
  margin: 1em 0 !important;
  page-break-inside: avoid;
  break-inside: avoid;
}
.markdown-section blockquote p {
  margin: 0.35em 0 !important;
  text-indent: 0 !important;     /* override custom.css's 2em indent */
}

/* === Code blocks: undo custom.css's web-only horizontal-scroll behavior === */
/* In print, "overflow-x:auto" silently clips ASCII-art charts (e.g. the wide
   班序 row in 上始祖分枝图). Restore visible overflow + match Calibre's actual
   PDF rendering size (verified at 6.75pt via pdfminer) so the box-drawing
   glyphs occupy the same width as the npx-honkit-pdf flow produces. */
.markdown-section pre {
  /* Visually distinct from blockquote (which keeps the left-bar accent):
     code panels are a flat, uniformly-bordered card. */
  background: #f5f5f5 !important;
  border: 1px solid #e1e1e1 !important;
  border-left-width: 1px !important;      /* explicitly cancel custom.css's accent */
  border-radius: 4px !important;
  padding: 10px 12px !important;
  margin: 0.8em 0;
  color: #333 !important;
  overflow: visible !important;
  white-space: pre !important;            /* preserve ASCII charts column-by-column */
  page-break-inside: avoid;
  break-inside: avoid;
  font-size: 6.75pt !important;
  line-height: 1.5 !important;
  font-family: "Menlo", "Monaco", "Consolas", "Courier New", monospace !important;
}
.markdown-section pre > code,
.markdown-section pre code {
  font-size: 1em !important;              /* don't compound-shrink under <pre> */
  background: transparent !important;
  border: none !important;
  padding: 0 !important;
  white-space: inherit !important;
  font-family: inherit !important;
}
/* Inline <code> outside of <pre> stays at body size so it matches surrounding text. */
.markdown-section :not(pre) > code {
  font-size: 0.92em !important;
  font-family: "Monaco", "Menlo", "Consolas", "Courier New", monospace !important;
}

/* === Tables: undo custom.css's web-only horizontal-scroll behavior === */
/* In print, "display:block; overflow-x:auto" silently clips wide tables.
   Restore native <table> layout so columns shrink/wrap to fit the page. */
.markdown-section table {
  display: table !important;
  width: 100% !important;
  max-width: 100% !important;
  overflow: visible !important;
  border-collapse: collapse !important;
  border-radius: 0 !important;
  table-layout: auto;
  margin: 0.8em 0;
  font-size: 0.92em;
  box-shadow: none !important;        /* kill table-scroll-hints.js shadows */
}
.markdown-section table th,
.markdown-section table td {
  border: 1px solid #ccc !important;
  padding: 6px 7px !important;
  white-space: normal !important;     /* override custom.css th nowrap */
  word-break: break-word;
  vertical-align: middle;
  text-align: center;
}
.markdown-section table th {
  background-color: #ececec !important;
  color: #222 !important;
  font-weight: 600;
}
.markdown-section table tbody tr:nth-child(odd) {
  background-color: #fafafa;
}
/* Repeat thead on each page if a table overflows; allow body rows to break,
   but keep individual rows intact. */
.markdown-section table thead { display: table-header-group; }
.markdown-section table tr { page-break-inside: avoid; break-inside: avoid; }

/* Images may still span pages awkwardly — give them a soft try-to-keep rule
   without forcing huge whitespace gaps. */
.markdown-section img { page-break-inside: avoid; break-inside: avoid; }

/* Ensure colored backgrounds (e.g. blockquote, code) print */
* { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }

@page { size: A4; margin: 18mm 16mm; }
</style>
</head>
<body class="book">
${sections.join("\n")}
</body>
</html>`;
}

(async () => {
  ensureBuild();
  const items = readSummary();
  if (items.length === 0) {
    console.error("[pdf] no chapters found in SUMMARY.md");
    process.exit(1);
  }
  console.log(`[pdf] found ${items.length} chapters`);

  const combined = buildCombinedHtml(items);
  const tmpHtml = path.join(BOOK_DIR, "_print-all.html");
  fs.writeFileSync(tmpHtml, combined, "utf8");

  let puppeteer;
  try {
    puppeteer = require("puppeteer");
  } catch (e) {
    console.error(
      "[pdf] puppeteer is not installed. Run: npm install --save-dev puppeteer"
    );
    process.exit(1);
  }

  // Prefer a system Chromium-family browser so we don't depend on the
  // ~150MB binary that puppeteer pins to a specific Chrome version. Fall
  // back to puppeteer's bundled Chromium if no system browser is found.
  const systemCandidates = [
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary",
    "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
    "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
    "/usr/bin/microsoft-edge",
  ];
  let executablePath;
  for (const p of systemCandidates) {
    if (fs.existsSync(p)) {
      executablePath = p;
      break;
    }
  }

  const launchOpts = executablePath ? { executablePath } : {};
  if (executablePath) {
    console.log("[pdf] using system browser:", executablePath);
  } else {
    console.log("[pdf] launching puppeteer's bundled Chromium…");
  }
  let browser;
  try {
    browser = await puppeteer.launch(launchOpts);
  } catch (e) {
    if (!executablePath && /Could not find Chrome/i.test(String(e))) {
      console.error(
        "\n[pdf] puppeteer's bundled Chromium has not been downloaded yet.\n" +
          "      Run one of:\n" +
          "        npx puppeteer browsers install chrome\n" +
          "      or install Google Chrome / Microsoft Edge from the App Store.\n"
      );
      process.exit(1);
    }
    throw e;
  }
  try {
    const page = await browser.newPage();
    await page.goto("file://" + tmpHtml, {
      waitUntil: "networkidle0",
      timeout: 60000,
    });
    // Give web fonts a beat to settle before paginating.
    await page.evaluate(() => document.fonts && document.fonts.ready);

    await page.pdf({
      path: OUT_PDF,
      format: "A4",
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: '<div style="font-size:0;"></div>',
      footerTemplate:
        '<div style="font-size:9pt;width:100%;text-align:center;color:#888;font-family:\'PingFang SC\',\'Hiragino Sans GB\',sans-serif"><span class="pageNumber"></span> / <span class="totalPages"></span></div>',
      margin: { top: "18mm", bottom: "18mm", left: "16mm", right: "16mm" },
      // Chromium auto-derives outline entries from <h1>/<h2>/<h3> when these
      // are enabled (puppeteer ≥ 22 / Chromium ≥ 119).
      tagged: true,
      outline: true,
    });
    console.log("[pdf] wrote", OUT_PDF);
  } finally {
    await browser.close();
    try {
      fs.unlinkSync(tmpHtml);
    } catch (_) {}
  }
})().catch((err) => {
  console.error("[pdf] failed:", err);
  process.exit(1);
});
