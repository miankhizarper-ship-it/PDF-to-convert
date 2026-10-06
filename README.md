# FileTools — free, private online file tools

Eleven browser-based file tools in the spirit of iLovePDF and Smallpdf: **plain
HTML, CSS and vanilla JavaScript only.** No framework, no bundler, no build step
and no server. Every byte of every file stays on the device that opened the page
— there is nothing to upload because nothing is ever uploaded.

> **Your files never leave your device. All processing happens in your browser.**

Open `index.html` directly, or serve the folder over any static host.

---

## Live preview

```bash
npx serve .            # or: python3 -m http.server 5173
```

Then browse to the printed address. The site also works straight off the file
system (`file:///…/index.html`) — nothing depends on a server, a module loader or
a service worker.

## The tools

| Tool | Page | What it does | Libraries (CDN) |
| --- | --- | --- | --- |
| DOCX to PDF | `tools/docx-to-pdf.html` | Word → PDF with live A4/Letter/Legal preview; keeps headings, bold/italic, lists, tables and images; page numbers | mammoth.js, html2pdf.js |
| Excel to PDF | `tools/excel-to-pdf.html` | XLSX/XLS/CSV → PDF; per-sheet or all sheets, font size, gridlines, header styling, fit-to-width or split across pages | SheetJS, jsPDF + autotable |
| Image to PDF | `tools/image-to-pdf.html` | Drag-reorder pages, rotate, remove; page size, orientation, margin, fit/fill/original, white or transparent border | jsPDF |
| PDF to Image | `tools/pdf-to-image.html` | Render any page range to PNG/JPG with scale + JPEG quality; single download or ZIP | pdf.js, JSZip |
| Merge PDF | `tools/merge-pdf.html` | Drag to reorder, set document title/author, merge into one file | pdf-lib |
| Split PDF | `tools/split-pdf.html` | Extract a range list (`1-3, 5, 7-9`), one file per range, or every page into a ZIP | pdf-lib, JSZip |
| Compress Image | `tools/compress-image.html` | Quality slider, max width/height, before → after bytes and % saved, batch ZIP | Canvas, JSZip |
| Image Converter | `tools/image-converter.html` | JPG/PNG/WEBP, quality, background fill for transparency, max width | Canvas, JSZip |
| Text to PDF | `tools/text-to-pdf.html` | Font, size, alignment, line spacing, page numbers, word count, live pagination | jsPDF |
| QR Generator | `tools/qr-generator.html` | Text/URL/Wi-Fi QR codes, size, quiet zone, colours, PNG **and** SVG export | qrcode-generator |
| Word Counter | `tools/word-counter.html` | Live words/characters/sentences/paragraphs/reading time, keyword density, copy/download | none |

Every tool page carries the same skeleton: breadcrumb → H1 → description → the
tool itself → **How to use** → **FAQ** → related tools → footer.

## Features

- **One uploader component everywhere.** Large dashed drop zone, drag-over
  highlight, "Choose file" button, accepted-type and size hints, 50 MB guard,
  file list with name, size, thumbnail and remove, keyboard accessible
  (Enter/Space opens the picker, each file is focusable), progress bar, loading
  state, disabled buttons while working, success panel with a big Download and
  "Convert another file".
- **Central tool registry.** `js/tools.js` is the single source of truth. It
  powers the home cards, the header category dropdown, search, breadcrumbs,
  related tools, the sitemap and the tests.
- **Design system.** CSS custom properties for colour, spacing, radius, shadow
  and motion; light and dark themes that follow the system and persist in
  `localStorage`; glassmorphism sticky header; soft gradients; 16–20 px cards.
- **Animations, tastefully.** Staggered card entry, hover lift with an icon
  bounce, drop-zone pulse, animated progress, a drawn checkmark on success,
  toasts that slide in and out, accordion height transitions, theme cross-fade
  and `IntersectionObserver` scroll reveals — all of it switched off for
  `prefers-reduced-motion`.
- **Responsive 320 px → 4K.** Mobile-first grid, `clamp()` typography, a tool
  grid that goes 1 → 2 → 3 → 4 columns, 44 px touch targets, no horizontal
  scroll, `viewport` meta everywhere.
- **SEO.** Unique title/description/canonical/Open Graph/Twitter per page,
  JSON-LD `WebApplication` + `FAQPage` + `BreadcrumbList` on tool pages,
  `WebSite` with a search action on the home page, semantic landmarks, one H1
  per page, `sitemap.xml`, `robots.txt`, per-page `defer`red libraries.
- **Accessibility.** ARIA labels and descriptions, `aria-live` status regions,
  `role="status"` progress, visible `:focus-visible` rings, reduced-motion
  support, contrast-checked colour pairs in both themes.
- **Privacy by construction.** No analytics, no fonts loaded from a tracking
  CDN (only `fonts.googleapis.com`), no cookies, no network calls after page
  load except the library files themselves.

## Folder structure

```
├── index.html              home page: hero, search, category chips, tool grid,
│                           how it works, why choose us, FAQ
├── about.html              about / mission
├── privacy.html            privacy policy (no tracking, nothing uploaded)
├── contact.html            mailto contact form with validation
├── sitemap.xml             every public URL
├── robots.txt
├── favicon.svg
├── css/
│   └── style.css           the whole design system, sectioned and commented
├── js/
│   ├── tools.js            ⭐ the central registry — everything starts here
│   ├── common.js           shared runtime (window.FT): theme, header/footer,
│   │                       uploader, toasts, progress, PDF geometry, helpers
│   ├── home.js             home page: chips, search, card rendering
│   ├── static-page.js      about/privacy chrome
│   ├── contact.js          contact form validation
│   └── <tool-slug>.js      one script per tool (11 files)
├── tools/
│   └── <tool-slug>.html    11 tool pages, generated by .qa/gen-pages.py
└── .qa/                    test harness (not part of the shipped site)
    ├── run-tests.mjs       node .qa/run-tests.mjs → 47 checks
    ├── env.mjs             jsdom loader + browser-API shims
    ├── sample-files.mjs    generated DOCX/XLSX/CSV/PDF/PNG fixtures
    ├── gen-pages.py        the generator behind tools/*.html
    ├── fetch-vendor.mjs    downloads the pinned libraries for offline testing
    └── cdn-pins.json       the exact CDN URLs the pages are allowed to use
```

Nothing else is required: no `package.json`, no lockfile, no `node_modules` in
the site itself.

## Third-party libraries

Loaded **only on the page that needs them**, always `defer`, always pinned to an
exact version on jsDelivr:

| Package | Version | Used by |
| --- | --- | --- |
| mammoth.js | 1.13.0 | docx-to-pdf |
| html2pdf.js | 0.14.0 | docx-to-pdf |
| xlsx (SheetJS) | 0.18.5 | excel-to-pdf |
| jsPDF | 3.0.4 | excel-to-pdf, image-to-pdf, text-to-pdf |
| jspdf-autotable | 5.0.8 | excel-to-pdf |
| pdf-lib | 1.17.1 | merge-pdf, split-pdf |
| pdfjs-dist (legacy UMD build) | 3.11.174 | pdf-to-image |
| JSZip | 3.10.2 | pdf-to-image, split-pdf, compress-image, image-converter |
| qrcode-generator | 2.0.4 | qr-generator |

Two version notes worth keeping: `pdfjs-dist` v4+ ships ESM only, so 3.11.174 is
the last release with a classic `build/pdf.min.js` + `pdf.worker.min.js` pair;
and the npm `qrcode` package has no browser bundle, so `qrcode-generator` (a
classic global) is used instead.

## How to add a tool

1. **Register it** in `js/tools.js` — one object in the `TOOLS` array:

   ```js
   {
     slug: "pdf-to-word",
     name: "PDF to Word",
     tagline: "Turn PDFs into editable Word documents",
     category: "pdf",
     icon: "fileText",            // key in FT.icons, or inline SVG markup
     keywords: ["pdf", "docx", "word", "convert", "editable"],
     accept: ["application/pdf"],
     maxFileMB: 50,
     multiple: false,
     featured: false,
     order: 45
   }
   ```

   The card, the search index, the category dropdown, the breadcrumb, the
   related-tools grid and the sitemap test all pick it up automatically.

2. **Create the page.** Either hand-write `tools/pdf-to-word.html` from an
   existing page, or add an entry to `.qa/gen-pages.py` (title, description,
   keywords, controls markup, how-to steps, FAQ, scripts) and re-run
   `python3 .qa/gen-pages.py` — it regenerates every tool page and `sitemap.xml`
   from the registry, so the two can never drift apart.

3. **Write `js/pdf-to-word.js`.** Follow the pattern used by every other tool:

   ```js
   (function () {
     "use strict";
     const FT = window.FT;
     const uploader = FT.createUploader({ /* id, accept, multiple, maxSizeMB */ });
     // ...read files, do the work, call FT.downloadBlob(...)
   })();
   ```

   Reuse `FT.createProgress`, `FT.createLoader`, `FT.renderResult`,
   `FT.setBusy`, `FT.runTask` (which handles busy state, progress, success
   message, error toast and button re-enabling for you), `FT.friendlyError` and
   `FT.requireLib`.

4. **Add a library?** Only via a pinned `<script defer>` on that one page, and
   add the URL to `.qa/cdn-pins.json` — the test suite fails any page that loads
   something unlisted.

5. **Run the checks**: `node .qa/run-tests.mjs`.

## Testing

```bash
cd .qa && npm install          # jsdom + fixture builders + the pinned libraries
node .qa/fetch-vendor.mjs      # one-off: caches the CDN libraries locally
node .qa/run-tests.mjs         # 47 checks
```

The harness loads the **real pages** in jsdom, executes the **real scripts** and
runs the **real libraries** against generated fixtures (a genuine DOCX built with
the `docx` package containing headings, bold/italic, a bullet list, a table and
an embedded image; a two-sheet XLSX; a CSV; a 5-page PDF; random-noise PNGs).
It asserts on real output: that the merged PDF opens and has 5 pages, that the
split produces exactly the requested pages, that the QR SVG contains the right
module count, that the DOCX preview contains `<h1>`, `<strong>`, `<em>`, two
`<li>` items, a table and a base64 `<img>`, that ZIPs unzip to the expected
entries, that no page logs a console error, that every CDN URL is pinned, and
that the design tokens, breakpoints and touch targets are present.

**What the harness cannot do:** jsdom has no real canvas rasteriser, so the
pixel stages — html2canvas' render of the DOCX preview into the PDF, and
pdf.js' rasterisation of a page — cannot execute. Those two paths are exercised
up to the point where the browser hands work to the canvas (the preview HTML,
the options object, the error and success paths around them) and need a visual
check in a real browser. Everything else is executed end to end.

## Deploying

The site is a folder of static files — deploy it as-is.

**Netlify** — drag the folder onto the Netlify dashboard, or:

```bash
netlify deploy --prod --dir .
```

**Vercel**

```bash
vercel --prod        # framework preset: Other, output directory: ./
```

**GitHub Pages**

```bash
git push origin main
# Settings → Pages → Deploy from a branch → main / (root)
```

No rewrite rules, no `_redirects`, no environment variables. If you host the site
in a sub-directory rather than at the root, change `SITE.url` in `js/tools.js`
and regenerate the canonical/OG tags (or simply point `SITE.url` at the new
base URL before running `python3 .qa/gen-pages.py`).

## Browser support

Evergreen Chrome, Edge, Firefox and Safari. `canvas.toBlob` with
`image/webp` is feature-detected and refused with a clear message where it is
missing; `createImageBitmap` is used when available and falls back to
`createObjectURL` + `Image`.

## Licence

MIT.
