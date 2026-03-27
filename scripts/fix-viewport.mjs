import { readdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";

const BOOK_DIR = path.resolve(process.cwd(), "_book");
const TARGET = 'name="viewport"';
const NEW_TAG =
  '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">';
const LIVERELOAD_SCRIPT_REGEX =
  /[ \t]*<script\s+src="[^"]*gitbook-plugin-livereload[^"]*"><\/script>\s*\n?/gi;
const EXTERNAL_SCRIPT_REGEX = /<script\s+src="[^"]+"[^>]*><\/script>/gi;
const IMG_TAG_REGEX = /<img\b[^>]*>/gi;
const SEARCH_INPUT_REGEX =
  /<input\s+type="text"\s+placeholder="输入并搜索"\s*\/>/gi;
const PWA_HEAD_TAGS = [
  '<meta name="theme-color" content="#ffffff">',
  '<link rel="manifest" href="manifest.webmanifest">',
];
const SW_REGISTER_SCRIPT = `<script>
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  });
}
</script>`;
const MANIFEST_CONTENT = {
  name: "黄福军公族谱",
  short_name: "黄福军公族谱",
  description: "广西平果市旧城",
  lang: "zh-Hans",
  start_url: "./index.html",
  scope: "./",
  display: "standalone",
  background_color: "#ffffff",
  theme_color: "#ffffff",
  icons: [
    {
      src: "gitbook/images/apple-touch-icon-precomposed-152.png",
      sizes: "152x152",
      type: "image/png",
      purpose: "any",
    },
  ],
};
const SW_CONTENT = `const CACHE_NAME = "genealogy-book-v1";
const ASSETS_TO_CACHE = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./gitbook/style.css",
  "./gitbook/gitbook.js",
  "./gitbook/theme.js"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE)),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key)),
      ),
    ),
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) {
        return cached;
      }

      return fetch(event.request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          return response;
        })
        .catch(() => caches.match("./index.html"));
    }),
  );
});
`;

async function walk(dir) {
  const entries = await readdir(dir);
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry);
    const info = await stat(fullPath);

    if (info.isDirectory()) {
      files.push(...(await walk(fullPath)));
      continue;
    }

    if (entry.endsWith(".html")) {
      files.push(fullPath);
    }
  }

  return files;
}

function replaceViewportTag(html) {
  const viewportTagRegex = /<meta\s+name="viewport"\s+content="[^"]*"\s*\/?>/i;

  if (!viewportTagRegex.test(html)) {
    return null;
  }

  return html.replace(viewportTagRegex, NEW_TAG);
}

function removeLivereloadScript(html) {
  return html.replace(LIVERELOAD_SCRIPT_REGEX, "");
}

function addDeferToExternalScripts(html) {
  return html.replace(EXTERNAL_SCRIPT_REGEX, (tag) => {
    if (/\sdefer(\s|>)/i.test(tag)) {
      return tag;
    }

    return tag.replace("<script ", "<script defer ");
  });
}

function optimizeImageTags(html) {
  return html.replace(IMG_TAG_REGEX, (tag) => {
    let nextTag = tag;

    // Upgrade image URLs to HTTPS to avoid mixed-content failures.
    nextTag = nextTag.replace(/src="http:\/\//i, 'src="https://');

    if (!/\sloading=/i.test(nextTag)) {
      nextTag = nextTag.replace("<img ", '<img loading="lazy" ');
    }

    if (!/\sdecoding=/i.test(nextTag)) {
      nextTag = nextTag.replace("<img ", '<img decoding="async" ');
    }

    return nextTag;
  });
}

function injectPwaHeadTags(html) {
  if (!html.includes("</head>")) {
    return html;
  }

  let next = html;
  for (const tag of PWA_HEAD_TAGS) {
    if (!next.includes(tag)) {
      next = next.replace("</head>", `    ${tag}\n</head>`);
    }
  }

  return next;
}

function injectSwRegisterScript(html) {
  if (!html.includes("</body>")) {
    return html;
  }

  if (html.includes('navigator.serviceWorker.register("sw.js")')) {
    return html;
  }

  return html.replace("</body>", `${SW_REGISTER_SCRIPT}\n</body>`);
}

function optimizeSearchInput(html) {
  return html.replace(
    SEARCH_INPUT_REGEX,
    '<input type="search" placeholder="输入并搜索" aria-label="站内搜索" enterkeyhint="search" />',
  );
}

async function main() {
  const htmlFiles = await walk(BOOK_DIR);
  let viewportUpdated = 0;
  let livereloadRemoved = 0;
  let deferUpdated = 0;
  let imageUpdated = 0;
  let pwaInjected = 0;
  let searchInputUpdated = 0;
  let touchedFiles = 0;

  for (const filePath of htmlFiles) {
    const content = await readFile(filePath, "utf8");
    let next = content;
    let fileChanged = false;

    if (next.includes(TARGET)) {
      const withViewport = replaceViewportTag(next);
      if (withViewport && withViewport !== next) {
        next = withViewport;
        viewportUpdated += 1;
        fileChanged = true;
      }
    }

    const withoutLivereload = removeLivereloadScript(next);
    if (withoutLivereload !== next) {
      next = withoutLivereload;
      livereloadRemoved += 1;
      fileChanged = true;
    }

    const withDeferredScripts = addDeferToExternalScripts(next);
    if (withDeferredScripts !== next) {
      next = withDeferredScripts;
      deferUpdated += 1;
      fileChanged = true;
    }

    const withOptimizedImages = optimizeImageTags(next);
    if (withOptimizedImages !== next) {
      next = withOptimizedImages;
      imageUpdated += 1;
      fileChanged = true;
    }

    const withPwaHeadTags = injectPwaHeadTags(next);
    const withPwa = injectSwRegisterScript(withPwaHeadTags);
    if (withPwa !== next) {
      next = withPwa;
      pwaInjected += 1;
      fileChanged = true;
    }

    const withSearchInput = optimizeSearchInput(next);
    if (withSearchInput !== next) {
      next = withSearchInput;
      searchInputUpdated += 1;
      fileChanged = true;
    }

    if (!fileChanged) {
      continue;
    }

    await writeFile(filePath, next, "utf8");
    touchedFiles += 1;
  }

  await writeFile(
    path.join(BOOK_DIR, "manifest.webmanifest"),
    `${JSON.stringify(MANIFEST_CONTENT, null, 2)}\n`,
    "utf8",
  );
  await writeFile(path.join(BOOK_DIR, "sw.js"), SW_CONTENT, "utf8");

  console.log(
    `Post-build HTML fixes applied to ${touchedFiles} files (viewport: ${viewportUpdated}, livereload removed: ${livereloadRemoved}, deferred scripts: ${deferUpdated}, optimized images: ${imageUpdated}, pwa injected: ${pwaInjected}, search input upgraded: ${searchInputUpdated}).`,
  );
}

main().catch((error) => {
  console.error("Failed to run post-build HTML fixes:", error);
  process.exitCode = 1;
});
