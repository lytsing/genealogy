# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with
code in this repository.

## Project Overview

This is a Chinese family genealogy book (黄福军公族谱) built with
[Honkit](https://github.com/honkit/honkit), a GitBook-compatible static site
generator. Content is written in Simplified Chinese Markdown.

## Commands

```bash
npm run serve   # Development server with live reload at localhost:4000
npm run build   # Build static site to _book/
```

Custom CSS and JS are loaded via `_layouts/website/page.html` (Honkit layout
override), so both `serve` and `build` get the same result. No manual post-build
injection is needed. Each asset URL carries `?v={{ asset_v }}` (derived from
`gitbook.time`) for cache busting on rebuilds.

## Architecture

- `SUMMARY.md` — Table of contents; controls the book's chapter structure
- `book.json` — Honkit config (plugins, language, footer settings)
- `_layouts/website/page.html` — Layout override that loads custom CSS/JS via
  `<link>`/`<script>` tags
- `styles/custom.css` — Custom CSS (loaded by layout override)
- `scripts/` — Custom JavaScript files (loaded by layout override, in order):
  - `table-scroll-hints.js` — Horizontal scroll shadow hints on overflowing tables
  - `share-links.js` — "复制链接" button injected into every heading with an `id`
  - `image-performance.js` — `loading="lazy"` / `decoding="async"` on body images
  - `image-lightbox.js` — Click-to-zoom lightbox with pinch/drag on mobile
  - `back-to-top.js` — Floating back-to-top button (hidden inside RN WebView)
  - `swipe-navigation.js` — Edge-swipe gesture for prev/next page on mobile
  - `scroll-memory.js` — Restore scroll position when revisiting a page
  - `reading-progress.js` — Top-of-page reading progress bar
  - `page-toc.js` — Per-page floating TOC of `H2` headings (desktop ≥ 1280px)
- `images/` — Genealogy chart images (JPGs)
- `_book/` — Build output, gitignored

## Content

Pages are Markdown files. The chapter list in `SUMMARY.md` must be updated when
adding new pages. The book uses the `katex` plugin for math rendering and
`tbfed-pagefooter` for timestamped page footers.

### Editing conventions

- **Headings**: `H1` is centered (page/chapter title), `H2`/`H3`/`H4` are
  left-aligned (handled by `styles/custom.css`, do not override per-page).
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
