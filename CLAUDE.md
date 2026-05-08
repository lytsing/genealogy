# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with
code in this repository.

## Project Overview

This is a Chinese family genealogy book (黄福军公族谱) built with
[Honkit](https://github.com/honkit/honkit), a GitBook-compatible static site
generator. Content is written in Simplified Chinese Markdown.

## Commands

```bash
npm run serve            # Development server with live reload at localhost:4000
npm run build            # Build static site to _book/
npm run pdf [out.pdf]    # Build book.pdf via headless Chromium (default: ./book.pdf)
```

Custom CSS and JS are loaded via `_layouts/website/page.html` (Honkit layout
override), so both `serve` and `build` get the same result. No manual post-build
injection is needed. Each asset URL carries `?v={{ asset_v }}` (derived from
`gitbook.time`) for cache busting on rebuilds.

### PDF build (`npm run pdf`)

Do **not** use `npx honkit pdf …`. HonKit's built-in PDF flow goes through
Calibre's `ebook-convert`, which on Calibre 9.x produces a PDF whose outline
(left-side bookmarks) collapses every chapter to page 1
([honkit/honkit#117](https://github.com/honkit/honkit/issues/117)).

`scripts/build-pdf.js` instead:
1. Runs `honkit build` if `_book/` is missing.
2. Reads `SUMMARY.md` for chapter order (mapping `README.md` → `index.html`).
3. Pulls the `<section class="normal markdown-section">` body out of each
   chapter HTML, drops the per-page `tbfed-pagefooter` timestamp, and
   concatenates them into a single print-friendly HTML at
   `_book/_print-all.html` (auto-deleted after the run).
4. Sets `<base href>` to `_book/` so relative image / KaTeX paths resolve.
5. Loads:
   - `gitbook/honkit-plugin-katex/katex.min.css` — KaTeX math rendering
   - `gitbook/style.css` — for Bootstrap-style `.alert*` classes + Font
     Awesome (used by `{% hint style='…' %}` blocks). Loaded **before**
     `custom.css` so our typography still wins where they overlap.
   - `gitbook/gitbook-plugin-hints/plugin-hints.css` — `.hints-icon` /
     `.hints-container` table-cell layout
   - `styles/custom.css` — main typography
   - inline print overrides — hide all chrome (sidebar, search,
     share-anchor, page-toc, back-to-top, page-footer), restore native
     `<table>` layout (custom.css's web-scroll behavior would clip wide
     tables in print), and force `page-break-before: always` between
     chapters.
6. **Cover**: replaces the rendered `README.md` (a small H1 + cover image)
   with a print-friendly cover layout: enlarged scan + subtitle + electronic
   edition attribution. The H1 is dropped because the cover scan already
   contains the title / 主编 / 编写组 / 印刷年月.
7. **Printed TOC** is inserted right after the cover, listing every chapter
   from `SUMMARY.md` (excluding the cover) with its page number. Page
   numbers are populated by a **two-pass render**: pass 1 renders with
   width-stable empty placeholders, then `readOutlinePages()` walks the
   auto-generated PDF outline (via `pdf-lib`) to map each chapter title
   to its page; pass 2 re-renders with the numbers filled in. CSS
   `target-counter()` was tried first but is not implemented in
   Chromium's headless print pipeline (verified empirically — pages
   render blank).
8. **Inlines external image links** during HTML extraction: any
   `<a href="assets/images/page-XX.jpg">` is replaced with a `<figure>`
   containing the actual image + caption, so the paper genealogy scans
   show up inline in the PDF instead of as dead links.
9. **Print-tuned typography**: H1 is dialed down from GitBook's default
   ~24pt to 20pt (closer to traditional Chinese book hierarchies; Calibre
   uses ~16.5pt for reference), H2 to 14pt, H3/H4 to 12.5/11.5pt with
   bold weight. Body links are recolored from bright blue to body color
   (#333) with a subtle gray underline since they're not clickable on
   paper anyway.
10. Calls puppeteer `page.pdf({ tagged: true, outline: true, … })` so
    Chromium auto-generates a clickable PDF outline from `<h1>`/`<h2>`/`<h3>`.
11. Re-opens the resulting PDF with **`pdf-lib`** to write proper UTF-8
    metadata (Title / Author / Subject / Keywords / Creator / Producer)
    sourced from `book.json`. Chromium otherwise emits a garbled Title and
    leaves Author/Subject/Keywords blank. The outline tree and tagged-PDF
    structure are preserved across this re-save.

`styles/pdf.css` is intentionally NOT loaded by this flow — its
`@page { @bottom-center { content: counter(page) }}` would draw a second
page number stacked on top of puppeteer's `footerTemplate`. The file stays
in the repo only as a fallback for `npx honkit pdf`.

If you change website chrome (new floating element, new auto-injected button,
etc.), add a hide rule to the `/* PDF print overrides */` block in
`scripts/build-pdf.js`, otherwise it will leak into the PDF.

## Architecture

- `SUMMARY.md` — Table of contents; controls the book's chapter structure
- `book.json` — Honkit config (plugins, language, footer settings)
- `_layouts/website/page.html` — Layout override that loads custom CSS/JS via
  `<link>`/`<script>` tags
- `styles/custom.css` — Web-only CSS (loaded by `_layouts/website/page.html`).
  Does **not** apply to PDF/ebook output.
- `styles/pdf.css` — PDF-only CSS (declared via `styles.pdf` in `book.json`,
  used by `npx honkit pdf ./ ./book.pdf`). When changing typography that
  should appear in both web and PDF (heading alignment, font, etc.), update
  **both** files.
- `scripts/` — JavaScript files. Web-runtime scripts are loaded by
  `_layouts/website/page.html` in this order; `build-pdf.js` is a Node-side
  build tool, **not** loaded into pages:
  - `fix-double-br.js` — Collapse the duplicate `<br><br>`s caused by
    HonKit serializing `<br>` as `<br></br>` (Chromium re-parses the stray
    `</br>` as another `<br>`). Same fix is applied during PDF extraction.
  - `table-scroll-hints.js` — Horizontal scroll shadow hints on overflowing tables
  - `share-links.js` — "复制链接" button injected into every heading with an `id`
  - `image-performance.js` — `loading="lazy"` / `decoding="async"` on body images
  - `image-lightbox.js` — Click-to-zoom lightbox with pinch/drag on mobile
  - `back-to-top.js` — Floating back-to-top button (hidden inside RN WebView)
  - `swipe-navigation.js` — Edge-swipe gesture for prev/next page on mobile
  - `scroll-memory.js` — Restore scroll position when revisiting a page
  - `reading-progress.js` — Top-of-page reading progress bar
  - `page-toc.js` — Per-page floating TOC of `H2` headings (desktop ≥ 1280px)
  - `build-pdf.js` — Node script run by `npm run pdf` (see PDF build section)
- `images/` — Genealogy chart images (JPGs)
- `_book/` — Build output, gitignored

## Content

Pages are Markdown files. The chapter list in `SUMMARY.md` must be updated when
adding new pages. The book uses the `katex` plugin for math rendering and
`tbfed-pagefooter` for timestamped page footers.

### Editing conventions

- **Headings**: `H1` is centered (page/chapter title), `H2`/`H3`/`H4` are
  left-aligned. Implemented in **both** `styles/custom.css` (web) and
  `styles/pdf.css` (PDF) — keep them in sync. Do not override per-page.
- **Punctuation**: Use full-width Chinese punctuation throughout, including
  `（）` `；` `：` `，` `。` `"" ''`. Avoid mixing half-width `()` `;` `:`
  with Chinese text.
- **Number / unit spacing**: Insert one space between Arabic numerals and
  adjacent CJK characters, e.g. `2008 年 10 月 15 日`, `约 2 米`,
  `公元 871 年`. Do **not** add spaces around full-width punctuation.
- **Pinyin annotations**: Use the form `字 pīnyīn`. Footnote pinyin entries
  use `[^n]: 字 pīnyīn（释义）` with full-width parens.
- **Trailing newline**: End every Markdown file with a single `\n`. No
  multiple blank lines at EOF.
- **Errata log**: When fixing typos or wording in existing content, add a
  row to `xiu-ding-shuo-ming.md` so readers can see the revision history.

### Per-page TOC

`scripts/page-toc.js` auto-generates a right-side TOC from `H2` headings
on viewports ≥ 1280px when a page has 2+ `H2`s. It coexists with
`share-links.js` by extracting heading text from a clone with the share
button stripped.
