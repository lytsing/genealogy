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
injection is needed.

## Architecture

- `SUMMARY.md` — Table of contents; controls the book's chapter structure
- `book.json` — Honkit config (plugins, language, footer settings)
- `_layouts/website/page.html` — Layout override that loads custom CSS/JS via
  `<link>`/`<script>` tags
- `styles/custom.css` — Custom CSS (loaded by layout override)
- `scripts/` — Custom JavaScript files (loaded by layout override):
  `table-scroll-hints.js`, `share-links.js`, `image-performance.js`,
  `image-lightbox.js`
- `images/` — Genealogy chart images (JPGs)
- `_book/` — Build output, gitignored

## Content

Pages are Markdown files. The chapter list in `SUMMARY.md` must be updated when
adding new pages. The book uses the `katex` plugin for math rendering and
`tbfed-pagefooter` for timestamped page footers.
