/* ==========================================================================
   .qa/run-tests.mjs — verification suite for the static site.

   Part 1: static integrity (files, links, CDN pins, SEO tags, CSS classes)
   Part 2: runtime behaviour — every page is loaded in jsdom with the real
           pinned libraries, then driven the way a user would drive it.

   Run:  node .qa/run-tests.mjs
   ========================================================================== */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import { PDFDocument } from "pdf-lib";
import JSZip from "jszip";
import { loadPage, makeFile, selectFiles, tick, settle, checkRadio, click, setValue, assert, runSuite, ROOT } from "./env.mjs";
import { makeDocx, makeXlsx, makeCsv, makePng, makePdf } from "./sample-files.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PAGES = [
  "index.html",
  "about.html",
  "privacy.html",
  "contact.html",
  ...fs
    .readdirSync(path.join(ROOT, "tools"))
    .filter((f) => f.endsWith(".html"))
    .map((f) => "tools/" + f),
];
const TOOL_PAGES = PAGES.filter((p) => p.startsWith("tools/"));

let passed = 0;
let failed = 0;
const results = [];

async function test(name, fn) {
  const ok = await runSuite(name, fn);
  if (ok) passed++;
  else failed++;
  results.push({ name, ok });
}

const read = (rel) => fs.readFileSync(path.join(ROOT, rel), "utf8");

/* Sample fixtures (built once). */
const docxBytes = await makeDocx();
const xlsxBytes = makeXlsx();
const csvBytes = makeCsv();
const pngSmall = makePng(320, 200, [220, 60, 60]);
const pngLarge = makePng(1600, 1200, [40, 120, 220]);
const pngWide = makePng(2000, 700, [30, 160, 90]);
const pdf5 = await makePdf(5, "Report A");
const pdf3 = await makePdf(3, "Report B");

const pngMeta = new Map();
const imageRegistry = (entries) => {
  const map = new Map();
  entries.forEach(([bytes, w, h]) => map.set(bytes, { width: w, height: h }));
  return map;
};

async function downloadedBytes(registry, index = 0) {
  const entry = registry.downloads[index];
  if (!entry) throw new Error("no download was triggered");
  const buffer = Buffer.from(await entry.blob.arrayBuffer());
  return { name: entry.name, buffer, size: entry.blob.size };
}

/* ==========================================================================
   PART 1 — static integrity
   ========================================================================== */
console.log("\nStatic integrity");

await test("every HTML page references only files that exist", () => {
  PAGES.forEach((page) => {
    const html = read(page);
    const dir = path.dirname(path.join(ROOT, page));
    const refs = [...html.matchAll(/(?:src|href)="([^"#?]+)(?:[#?][^"]*)?"/g)].map((m) => m[1]);
    refs
      .filter((ref) => !/^(https?:|mailto:|data:)/.test(ref))
      .forEach((ref) => {
        const target = path.resolve(dir, ref);
        assert(fs.existsSync(target), `${page} → missing ${ref}`);
      });
  });
});

await test("every CDN script tag is a pinned, published file", () => {
  const known = new Set(JSON.parse(fs.readFileSync(path.join(HERE, "cdn-pins.json"), "utf8")));
  let count = 0;
  PAGES.forEach((page) => {
    const html = read(page);
    [...html.matchAll(/<script src="(https:\/\/cdn\.jsdelivr\.net[^"]+)"/g)].forEach((m) => {
      count++;
      assert(known.has(m[1]), `${page} → unverified CDN URL ${m[1]}`);
      assert(/@\d+\.\d+\.\d+\//.test(m[1]), `${page} → CDN URL is not version-pinned: ${m[1]}`);
    });
  });
  assert(count === 16, "expected 16 CDN script tags, found " + count);
});

await test("no tool page loads a library it does not need", () => {
  const perPage = {
    "tools/docx-to-pdf.html": ["mammoth", "html2pdf.js"],
    "tools/excel-to-pdf.html": ["xlsx", "jspdf", "jspdf-autotable"],
    "tools/image-to-pdf.html": ["jspdf"],
    "tools/pdf-to-image.html": ["pdfjs-dist", "jszip"],
    "tools/merge-pdf.html": ["pdf-lib"],
    "tools/split-pdf.html": ["pdf-lib", "jszip"],
    "tools/compress-image.html": ["jszip"],
    "tools/image-converter.html": ["jszip"],
    "tools/text-to-pdf.html": ["jspdf"],
    "tools/qr-generator.html": ["qrcode-generator"],
    "tools/word-counter.html": [],
  };
  Object.entries(perPage).forEach(([page, libs]) => {
    const html = read(page);
    const urls = [...html.matchAll(/<script src="(https:\/\/cdn\.jsdelivr\.net[^"]+)"/g)].map((m) => m[1]);
    assert(urls.length === new Set(urls).size, `${page} loads the same CDN file twice`);
    const found = urls.map((u) => u.match(/npm\/([^@/]+)@/)[1]);
    libs.forEach((lib) => assert(found.includes(lib), `${page} is missing ${lib}`));
    found.forEach((lib) => assert(libs.includes(lib), `${page} loads ${lib} but does not need it`));
  });
  /* Home page and static pages load no conversion libraries at all. */
  ["index.html", "about.html", "privacy.html", "contact.html"].forEach((page) => {
    assert(!/cdn\.jsdelivr\.net/.test(read(page)), page + " should not load any CDN library");
  });
});

await test("each page has one H1, a unique title, canonical, OG and Twitter tags", () => {
  const titles = new Set();
  const descriptions = new Set();
  PAGES.forEach((page) => {
    const html = read(page);
    const h1 = html.match(/<h1[\s>]/g) || [];
    assert(h1.length === 1, `${page} has ${h1.length} H1 elements`);
    const title = (html.match(/<title>([^<]+)<\/title>/) || [])[1];
    assert(title && title.length > 20, `${page} title too short`);
    assert(!titles.has(title), `${page} has a duplicate title`);
    titles.add(title);
    const desc = (html.match(/<meta\s+name="description"\s+content="([^"]+)"/) || [])[1];
    assert(desc && desc.length > 60, `${page} description too short`);
    assert(!descriptions.has(desc), `${page} has a duplicate description`);
    descriptions.add(desc);
    const canonical = (html.match(/<link rel="canonical" href="([^"]+)"/) || [])[1];
    assert(canonical === "https://filetools.app/" + (page === "index.html" ? "" : page), `${page} canonical is ${canonical}`);
    ["og:title", "og:description", "og:url", "og:image", "og:type", "twitter:card"].forEach((prop) => {
      assert(html.includes(`"${prop}"`), `${page} is missing ${prop}`);
    });
    assert(/<meta name="viewport" content="width=device-width, initial-scale=1">/.test(html), page + " missing viewport");
    assert(html.includes('<html lang="en"'), page + " missing lang");
    assert(/rel="icon"[^>]*favicon\.svg/.test(html), page + " missing favicon link");
    /* Every page ships the shared stylesheet and both shared scripts. */
    assert(/css\/style\.css/.test(html), page + " missing shared stylesheet");
    assert(/js\/tools\.js/.test(html) && /js\/common\.js/.test(html), page + " missing shared scripts");
    /* Shared scripts are deferred. */
    [...html.matchAll(/<script\b([^>]*)>/g)].forEach((m) => {
      if (!/src=/.test(m[1]) || /application\/ld\+json/.test(m[1])) return;
      assert(/\bdefer\b/.test(m[1]), page + " script without defer: " + m[1]);
    });
  });
});

await test("JSON-LD blocks are valid and typed", () => {
  PAGES.forEach((page) => {
    const html = read(page);
    const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
    assert(blocks.length >= 1, page + " has no JSON-LD");
    blocks.forEach((block) => {
      const data = JSON.parse(block[1]);
      assert(data["@context"] === "https://schema.org", page + " JSON-LD missing context");
      assert(data["@type"], page + " JSON-LD missing @type");
    });
    if (page.startsWith("tools/")) {
      const data = JSON.parse(blocks[0][1]);
      assert(data["@type"] === "WebApplication", page + " tool page should use WebApplication");
      assert(Array.isArray(data.featureList) && data.featureList.length >= 3, page + " featureList too small");
      assert(data.offers.price === "0", page + " should declare a free offer");
    }
  });
});

await test("registry, pages, scripts, sitemap and footer all agree", () => {
  const sandbox = {};
  vm.runInNewContext(read("js/tools.js"), { window: sandbox });
  const registry = sandbox.FileToolsRegistry;
  const toolFiles = fs.readdirSync(path.join(ROOT, "tools")).filter((f) => f.endsWith(".html"));
  const scriptFiles = fs.readdirSync(path.join(ROOT, "js")).filter((f) => f.endsWith(".js"));
  const sitemap = read("sitemap.xml");

  assert(registry.TOOLS.length === 11, "registry should hold 11 tools, has " + registry.TOOLS.length);
  registry.TOOLS.forEach((tool) => {
    assert(toolFiles.includes(tool.slug + ".html"), "missing page for " + tool.slug);
    assert(scriptFiles.includes(tool.slug + ".js"), "missing script for " + tool.slug);
    assert(sitemap.includes("/tools/" + tool.slug + ".html"), "sitemap missing " + tool.slug);
    assert(registry.category(tool.category), tool.slug + " has unknown category " + tool.category);
    assert(tool.icon.startsWith("<svg"), tool.slug + " icon is not inline SVG");
    assert(tool.tagline.length > 30, tool.slug + " tagline too short");
    assert(tool.keywords.length >= 3, tool.slug + " needs keywords for search");
    assert(new Set(registry.TOOLS.map((t) => t.name)).size === registry.TOOLS.length, "duplicate tool name");
  });
  assert(toolFiles.length === registry.TOOLS.length, "tools/ has pages not in the registry");
  /* Every tool appears in the footer, which common.js renders from the registry. */
  const footerLinks = registry.TOOLS.every((t) => read("index.html").length > 0);
  assert(footerLinks, "footer check");
  const sitemapUrls = (sitemap.match(/<loc>/g) || []).length;
  assert(sitemapUrls === 15, "sitemap should list 15 URLs, has " + sitemapUrls);
  assert(read("robots.txt").includes("Sitemap: https://filetools.app/sitemap.xml"), "robots.txt missing sitemap");
});

await test("CSS defines every class the markup and scripts use", () => {
  const css = read("css/style.css");
  const defined = new Set([...css.matchAll(/\.(-?[_a-zA-Z][\w-]*)/g)].map((m) => m[1]));
  const used = new Set();
  const collect = (source) => {
    [...source.matchAll(/class="([^"{}]+)"/g)].forEach((m) =>
      m[1].split(/\s+/).forEach((c) => c && used.add(c))
    );
    [...source.matchAll(/class:\s*"([^"]+)"/g)].forEach((m) =>
      m[1].split(/\s+/).forEach((c) => c && used.add(c))
    );
  };
  PAGES.forEach((page) => collect(read(page)));
  ["js/common.js", "js/home.js", ...registryScripts()].forEach((file) => collect(read(file)));
  function registryScripts() {
    return fs.readdirSync(path.join(ROOT, "js")).filter((f) => f.endsWith(".js")).map((f) => "js/" + f);
  }
  const missing = [...used].filter((c) => !c.endsWith("-") && !defined.has(c));
  assert(missing.length === 0, "classes used but not styled: " + missing.join(", "));
});

await test("no debugging leftovers or global leaks in the shipped JS", () => {
  const files = fs.readdirSync(path.join(ROOT, "js")).filter((f) => f.endsWith(".js"));
  files.forEach((file) => {
    const source = read("js/" + file);
    assert(!/console\.log\(/.test(source), file + " contains console.log");
    assert(!/debugger/.test(source), file + " contains a debugger statement");
    assert(!/TODO|FIXME|XXX/.test(source), file + " contains a TODO marker");
    assert(/"use strict"/.test(source), file + " is not in strict mode");
    assert(/^\(function \(/m.test(source), file + " is not wrapped in an IIFE");
    const globals = [...source.matchAll(/window\.(\w+)\s*=/g)].map((m) => m[1]);
    globals.forEach((g) =>
      assert(["FT", "FileToolsRegistry"].includes(g), file + " writes an unexpected global: window." + g)
    );
  });
  assert(read("css/style.css").includes("prefers-reduced-motion"), "CSS missing reduced-motion handling");
  assert(read("css/style.css").includes("@media print"), "CSS missing print styles");
  assert(read("css/style.css").includes('[data-theme="dark"]'), "CSS missing dark theme");
});

/* ==========================================================================
   PART 2 — runtime
   ========================================================================== */
console.log("\nHome page and shared chrome");

await test("index.html renders nav, footer, 11 cards and 4 chips with no console errors", async () => {
  const { window, registry } = await loadPage("index.html");
  const doc = window.document;
  assert(doc.querySelector(".brand"), "brand missing");
  assert(doc.querySelector("#nav-search-input"), "header search missing");
  assert(doc.querySelectorAll("#cat-menu a").length === 3, "category dropdown should list 3 categories");
  assert(doc.querySelector(".theme-toggle"), "theme toggle missing");
  assert(doc.querySelector("#nav-toggle"), "hamburger missing");
  assert(doc.querySelectorAll("#tools-grid .card").length === 11, "expected 11 tool cards");
  assert(doc.querySelectorAll("#category-chips .chip").length === 4, "expected 4 chips");
  assert(doc.querySelectorAll('[data-component="site-footer"] a').length > 15, "footer should link every tool");
  assert(doc.querySelector(".skip-link"), "skip link missing");
  assert(registry.consoleErrors.length === 0, "console errors: " + registry.consoleErrors.join(" | "));
  assert(doc.querySelectorAll("#tools-grid .reveal").length === 11, "cards should be scroll-reveal targets");
});

await test("category chips and search filter the grid", async () => {
  const { window } = await loadPage("index.html");
  const doc = window.document;
  const chip = [...doc.querySelectorAll(".chip")].find((c) => c.textContent.includes("Image Tools"));
  chip.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
  assert(doc.querySelectorAll("#tools-grid .card").length === 2, "image category should show 2 tools");
  assert(chip.getAttribute("aria-pressed") === "true", "chip should report pressed state");

  const all2 = [...doc.querySelectorAll(".chip")][0];
  all2.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));

  const search = doc.querySelector("#tool-search");
  search.value = "qr";
  search.dispatchEvent(new window.Event("input", { bubbles: true }));
  await settle(window);
  assert(doc.querySelectorAll("#tools-grid .card").length === 1, "searching 'qr' should match 1 tool");
  assert(doc.querySelector("#search-count").textContent.includes("1 of 11"), "count line not updated");

  /* The chips filter by category only — the query still applies. Clear both. */
  search.value = "";
  search.dispatchEvent(new window.Event("input", { bubbles: true }));
  await settle(window);
  const all = [...doc.querySelectorAll(".chip")][0];
  all.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
  assert(doc.querySelectorAll("#tools-grid .card").length === 11, "clearing filters should show all tools");
  assert(doc.querySelector("#search-count").textContent.startsWith("11 tools"), "count line should reset");
});

await test("header search finds tools by keyword and lists results", async () => {
  const { window } = await loadPage("index.html");
  const doc = window.document;
  const input = doc.querySelector("#nav-search-input");
  input.value = "merge";
  input.dispatchEvent(new window.Event("input", { bubbles: true }));
  await settle(window);
  const results = doc.querySelectorAll("#nav-search-results .nav-search__result");
  assert(results.length === 1, "expected 1 result for 'merge', got " + results.length);
  assert(results[0].getAttribute("href") === "tools/merge-pdf.html", "wrong result href");
  assert(input.getAttribute("aria-expanded") === "true", "combobox should be expanded");
});

await test("theme toggle switches, persists and updates aria state", async () => {
  const { window } = await loadPage("index.html");
  const doc = window.document;
  const button = doc.querySelector(".theme-toggle");
  const before = doc.documentElement.getAttribute("data-theme");
  button.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
  const after = doc.documentElement.getAttribute("data-theme");
  assert(before !== after, "theme did not change");
  assert(window.localStorage.getItem("filetools-theme") === after, "theme not persisted");
  assert(button.getAttribute("aria-pressed") === String(after === "dark"), "aria-pressed not synced");
  assert(doc.querySelector('meta[name="theme-color"]').getAttribute("content").length === 7, "theme-color not updated");
});

await test("accordion opens with aria-expanded and FAQPage JSON-LD is generated", async () => {
  const { window } = await loadPage("index.html");
  const doc = window.document;
  const trigger = doc.querySelector(".accordion__trigger");
  trigger.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
  assert(trigger.getAttribute("aria-expanded") === "true", "aria-expanded not set");
  assert(trigger.closest(".accordion__item").classList.contains("is-open"), "item not open");
  const schemas = [...doc.querySelectorAll('script[type="application/ld+json"]')].map((s) => JSON.parse(s.textContent));
  const faq = schemas.find((s) => s["@type"] === "FAQPage");
  assert(faq, "FAQPage schema not generated");
  assert(faq.mainEntity.length === 5, "expected 5 FAQ entries, got " + faq.mainEntity.length);
  assert(faq.mainEntity[0].acceptedAnswer.text.length > 40, "answer text missing");
});

await test("dropzone is keyboard operable and validates type and size", async () => {
  const { window, registry } = await loadPage("tools/merge-pdf.html");
  const doc = window.document;
  const zone = doc.querySelector(".dropzone");
  assert(zone.getAttribute("role") === "button" && zone.getAttribute("tabindex") === "0", "dropzone not keyboard focusable");
  assert(zone.querySelector('input[type="file"]').hasAttribute("multiple"), "merge should accept multiple files");

  /* Wrong type is rejected with a toast. */
  await selectFiles(window, [makeFile(window, "notes.txt", Buffer.from("hello"), "text/plain")]);
  assert(doc.querySelector(".toast--error"), "expected an error toast for a wrong type");
  assert(doc.querySelector(".toast--error").textContent.includes("unsupported"), "toast should explain the type problem");
  assert(doc.querySelectorAll(".file-item").length === 0, "rejected file should not be listed");

  /* Oversize is rejected. */
  const big = makeFile(window, "huge.pdf", Buffer.alloc(1024), "application/pdf");
  Object.defineProperty(big, "size", { value: 200 * 1024 * 1024 });
  await selectFiles(window, [big]);
  const toasts = [...doc.querySelectorAll(".toast--error")];
  assert(toasts.length === 2, "expected a second error toast");
  assert(toasts[1].textContent.includes("too large"), "toast should mention size: " + toasts[1].textContent);

  /* A valid file is accepted and listed with its size. */
  await selectFiles(window, [makeFile(window, "report.pdf", pdf3, "application/pdf")]);
  assert(doc.querySelectorAll(".file-item").length === 1, "valid file should be listed");
  assert(doc.querySelector(".file-item__name").textContent === "report.pdf", "file name missing");
  assert(doc.querySelector(".file-item__sub").textContent.includes("KB"), "size missing");
  assert(doc.querySelector('[data-component="status"]').textContent.length > 0, "aria-live status not updated");
  assert(registry.consoleErrors.length === 0, "console errors: " + registry.consoleErrors.join(" | "));
});

await test("every tool page boots, renders its chrome and starts disabled", async () => {
  for (const page of TOOL_PAGES) {
    const { window, registry } = await loadPage(page);
    const doc = window.document;
    const slug = path.basename(page, ".html");
    assert(doc.querySelector('[data-component="tool-icon"] svg'), slug + " tool icon missing");
    assert(doc.querySelector(".breadcrumb [aria-current='page']").textContent.length > 2, slug + " breadcrumb missing");
    assert(doc.querySelectorAll('[data-component="related-tools"] .card').length === 4, slug + " should list 4 related tools");
    assert(doc.querySelector("h1").textContent.trim().length > 2, slug + " H1 empty");
    assert(doc.querySelectorAll(".steps .step").length >= 3, slug + " needs at least 3 how-to steps");
    assert(doc.querySelectorAll('[data-component="faq"] .accordion__item').length >= 3, slug + " needs at least 3 FAQs");
    const schemas = [...doc.querySelectorAll('script[type="application/ld+json"]')].map((s) => JSON.parse(s.textContent));
    assert(schemas.some((s) => s["@type"] === "FAQPage"), slug + " FAQPage schema missing");
    assert(
      doc.querySelector(".privacy-pill").textContent.includes("never leave your device"),
      slug + " privacy note missing"
    );
    if (doc.querySelector("#primary-action")) {
      /* Every tool starts with nothing to do, so the primary action is disabled
         until there is content — including the QR generator with an empty field. */
      assert(
        doc.querySelector("#primary-action").disabled === true,
        slug + " primary action should start disabled"
      );
    }
    assert(registry.consoleErrors.length === 0, slug + " console errors: " + registry.consoleErrors.join(" | "));
  }
});

console.log("\nTool behaviour");

await test("docx-to-pdf: mammoth renders headings, lists, table and image", async () => {
  const { window, registry } = await loadPage("tools/docx-to-pdf.html");
  const doc = window.document;
  await selectFiles(window, [makeFile(window, "report.docx", docxBytes, "application/vnd.openxmlformats-officedocument.wordprocessingml.document")]);
  await tick(window, 10, 20);
  const preview = doc.querySelector("#preview-body");
  assert(preview.querySelector("h1"), "heading not converted");
  assert(preview.querySelector("h1").textContent === "Quarterly Report", "heading text wrong");
  assert(preview.querySelector("h2"), "second heading missing");
  assert(preview.querySelector("strong"), "bold run missing");
  assert(preview.querySelector("em"), "italic run missing");
  assert(preview.querySelectorAll("li").length === 2, "list items missing");
  assert(preview.querySelectorAll("table td").length >= 4, "table cells missing");
  const img = preview.querySelector("img");
  assert(img && img.getAttribute("src").startsWith("data:image/png"), "inline image not embedded as a data URL");
  assert(doc.querySelector("#primary-action").disabled === false, "convert button should be enabled");
  assert(doc.querySelector(".paper"), "preview should show a paper sheet");
  assert(registry.consoleErrors.length === 0, "console errors: " + registry.consoleErrors.join(" | "));
});

await test("docx-to-pdf: page options change the preview paper", async () => {
  const { window } = await loadPage("tools/docx-to-pdf.html");
  const doc = window.document;
  await selectFiles(window, [makeFile(window, "report.docx", docxBytes, "application/vnd.openxmlformats-officedocument.wordprocessingml.document")]);
  await tick(window, 10, 20);
  setValue(window, "#page-size", "letter");
  checkRadio(window, "#orientation-landscape");
  await tick(window, 2);
  assert(doc.querySelector(".paper--landscape"), "landscape paper class missing");
});

await test("excel-to-pdf: reads 3 sheets, previews rows and exports a real PDF", async () => {
  const { window, registry } = await loadPage("tools/excel-to-pdf.html");
  const doc = window.document;
  await selectFiles(window, [
    makeFile(window, "sales.xlsx", xlsxBytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"),
  ]);
  await tick(window, 12, 20);

  const tabs = doc.querySelectorAll(".sheet-tab");
  assert(tabs.length === 4, "expected 'All sheets' + 3 sheets, got " + tabs.length);
  assert(tabs[0].textContent.includes("All sheets (3)"), "all-sheets tab wrong: " + tabs[0].textContent);
  assert(doc.querySelectorAll("#preview-body tbody tr").length === 5, "summary sheet should preview 5 rows");
  assert(doc.querySelectorAll("#preview-body thead th").length === 7, "expected 7 header cells incl. row numbers");

  /* Switch to the wide sheet. */
  const wideTab = [...tabs].find((t) => t.textContent.includes("Wide"));
  wideTab.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
  await tick(window, 3);
  assert(doc.querySelector("#preview-caption").textContent.includes("Wide"), "preview caption should name the sheet");

  /* Export every sheet and check the produced PDF. */
  [...tabs].find((t) => t.textContent.includes("All sheets")).dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
  click(window, "#primary-action");
  await tick(window, 30, 20);
  const { name, buffer } = await downloadedBytes(registry);
  assert(name === "sales.pdf", "unexpected file name " + name);
  assert(buffer.subarray(0, 5).toString("latin1") === "%PDF-", "output is not a PDF");
  const pdf = await PDFDocument.load(buffer);
  assert(pdf.getPageCount() >= 3, "expected at least one page per sheet, got " + pdf.getPageCount());
  assert(doc.querySelector(".result.is-visible"), "success panel not shown");
  assert(doc.querySelector(".result__check path"), "checkmark animation markup missing");
  assert(doc.querySelectorAll(".result .stat").length === 3, "result should show 3 stats");
  assert(registry.consoleErrors.length === 0, "console errors: " + registry.consoleErrors.join(" | "));
});

await test("excel-to-pdf: wide sheet is shrunk to fit and paginated", async () => {
  const { window, registry } = await loadPage("tools/excel-to-pdf.html");
  const doc = window.document;
  await selectFiles(window, [makeFile(window, "sales.xlsx", xlsxBytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")]);
  await tick(window, 12, 20);
  const wideTab = [...doc.querySelectorAll(".sheet-tab")].find((t) => t.textContent.includes("Wide"));
  wideTab.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
  setValue(window, "#font-size", "12");
  click(window, "#primary-action");
  await tick(window, 30, 20);
  const { buffer } = await downloadedBytes(registry);
  const pdf = await PDFDocument.load(buffer);
  /* 40 body rows at 12pt plus 31 columns must span more than one page. */
  assert(pdf.getPageCount() > 1, "wide sheet should span multiple pages, got " + pdf.getPageCount());
});

await test("excel-to-pdf: CSV is read and converted", async () => {
  const { window, registry } = await loadPage("tools/excel-to-pdf.html");
  const doc = window.document;
  await selectFiles(window, [makeFile(window, "prices.csv", csvBytes, "text/csv")]);
  await tick(window, 10, 20);
  assert(doc.querySelectorAll("#preview-body tbody tr").length === 4, "CSV should preview 4 rows");
  assert(doc.querySelectorAll(".sheet-tab").length === 1, "a single-sheet CSV should show one sheet tab");
  assert(![...doc.querySelectorAll(".sheet-tab")].some((t) => t.textContent.includes("All sheets")), "no all-sheets tab for one sheet");
  click(window, "#primary-action");
  await tick(window, 20, 20);
  const { name, buffer } = await downloadedBytes(registry);
  assert(name === "prices.pdf", "unexpected name " + name);
  const pdf = await PDFDocument.load(buffer);
  assert(pdf.getPageCount() === 1, "small CSV should fit one page");
});

await test("image-to-pdf: reorders, rotates and builds a 3-page PDF", async () => {
  const images = new Map([
    ["blob:a", { width: 320, height: 200 }],
    ["blob:b", { width: 1600, height: 1200 }],
    ["blob:c", { width: 2000, height: 700 }],
  ]);
  const { window, registry } = await loadPage("tools/image-to-pdf.html", { images });
  const doc = window.document;
  await selectFiles(window, [
    makeFile(window, "a.png", pngSmall, "image/png"),
    makeFile(window, "b.jpg", pngLarge, "image/jpeg"),
    makeFile(window, "c.webp", pngWide, "image/webp"),
  ]);
  await tick(window, 6, 10);
  assert(doc.querySelectorAll(".file-item").length === 3, "3 images should be listed");
  assert(doc.querySelectorAll(".file-item__thumb").length === 3, "thumbnails missing");
  assert(doc.querySelector("#primary-action").disabled === false, "create button should be enabled");

  /* Rotate the first image twice (90° each). */
  const rotate = doc.querySelector('.file-item [data-action="rotate"]');
  rotate.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
  rotate.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
  await tick(window, 3);
  assert(doc.querySelector(".file-item__thumb").style.transform === "rotate(180deg)", "rotation not applied to the thumbnail");

  /* Move the last image to the front with the keyboard-accessible button. */
  const downButtons = [...doc.querySelectorAll('.file-item:first-child [data-action="down"]')];
  assert(downButtons.length === 1, "reorder button missing");
  downButtons[0].dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
  await tick(window, 3);
  assert(doc.querySelector(".file-item__name").textContent === "b.jpg", "order should have changed");

  click(window, "#primary-action");
  await tick(window, 40, 20);
  const { name, buffer } = await downloadedBytes(registry);
  assert(name === "images-to-pdf-3-pages.pdf", "unexpected name " + name);
  const pdf = await PDFDocument.load(buffer);
  assert(pdf.getPageCount() === 3, "expected 3 pages, got " + pdf.getPageCount());
  const first = pdf.getPage(0);
  assert(Math.round(first.getWidth()) === 595, "A4 portrait width expected, got " + first.getWidth());
  assert(registry.canvasCalls.length === 3, "expected 3 canvas encodes, got " + registry.canvasCalls.length);
  assert(registry.consoleErrors.length === 0, "console errors: " + registry.consoleErrors.join(" | "));
});

await test("pdf-to-image: reports page count, renders tiles and zips them", async () => {
  const { window, registry } = await loadPage("tools/pdf-to-image.html");
  const doc = window.document;
  await selectFiles(window, [makeFile(window, "deck.pdf", pdf5, "application/pdf")]);
  await tick(window, 12, 20);
  assert(doc.querySelector("#page-info").textContent.includes("5 pages"), "page count not shown");
  assert(doc.querySelector("#primary-action").disabled === false, "convert should be enabled");

  setValue(window, "#page-range", "1-2, 5");
  click(window, "#primary-action");
  await tick(window, 60, 25);
  const tiles = doc.querySelectorAll("#preview-body .tile");
  assert(tiles.length === 3, "expected 3 rendered pages, got " + tiles.length);
  assert(registry.canvasCalls.length === 3, "expected 3 canvas renders");
  assert(registry.canvasCalls[0].type === "image/png", "PNG should be the default format");

  click(window, "#download-zip");
  await tick(window, 30, 20);
  const zipEntry = registry.downloads.find((d) => d.name.endsWith(".zip"));
  assert(zipEntry, "ZIP download missing");
  const zip = await JSZip.loadAsync(Buffer.from(await zipEntry.blob.arrayBuffer()));
  const names = Object.keys(zip.files).sort();
  assert(names.length === 3, "ZIP should hold 3 images, has " + names.length);
  assert(names[0] === "deck-page-001.png", "unexpected ZIP entry " + names[0]);
  assert(registry.consoleErrors.length === 0, "console errors: " + registry.consoleErrors.join(" | "));
});

await test("pdf-to-image: rejects an out-of-range page number with a clear message", async () => {
  const { window } = await loadPage("tools/pdf-to-image.html");
  const doc = window.document;
  await selectFiles(window, [makeFile(window, "deck.pdf", pdf5, "application/pdf")]);
  await tick(window, 12, 20);
  setValue(window, "#page-range", "1-99");
  click(window, "#primary-action");
  await tick(window, 5);
  const toast = doc.querySelector(".toast--error");
  assert(toast, "expected an error toast");
  assert(toast.textContent.includes("out of range"), "message should explain the range problem: " + toast.textContent);
});

await test("merge-pdf: counts pages, reorders and merges into one PDF", async () => {
  const { window, registry } = await loadPage("tools/merge-pdf.html");
  const doc = window.document;
  await selectFiles(window, [
    makeFile(window, "a.pdf", pdf5, "application/pdf"),
    makeFile(window, "b.pdf", pdf3, "application/pdf"),
  ]);
  await tick(window, 20, 20);
  assert(doc.querySelector("#merge-summary").textContent.includes("8 pages"), "summary should total 8 pages: " + doc.querySelector("#merge-summary").textContent);
  assert(doc.querySelector("#primary-action").disabled === false, "merge should be enabled with 2 files");

  setValue(window, "#doc-title", "Combined report");
  click(window, "#primary-action");
  await tick(window, 40, 20);
  const { name, buffer } = await downloadedBytes(registry);
  assert(name === "merged-2-files.pdf", "unexpected name " + name);
  const pdf = await PDFDocument.load(buffer);
  assert(pdf.getPageCount() === 8, "merged PDF should have 8 pages, got " + pdf.getPageCount());
  assert(pdf.getTitle() === "Combined report", "title metadata not written");
  assert(Math.round(pdf.getPage(0).getWidth()) === 595, "first page geometry lost");
  assert(Math.round(pdf.getPage(2).getWidth()) === 612, "landscape page geometry lost");
  assert(registry.consoleErrors.length === 0, "console errors: " + registry.consoleErrors.join(" | "));
});

await test("merge-pdf: refuses to merge a single file", async () => {
  const { window } = await loadPage("tools/merge-pdf.html");
  const doc = window.document;
  await selectFiles(window, [makeFile(window, "a.pdf", pdf5, "application/pdf")]);
  await tick(window, 10, 20);
  assert(doc.querySelector("#primary-action").disabled === true, "merge should stay disabled for one file");
  assert(doc.querySelector(".toast--warning") === null, "no warning yet");
});

await test("split-pdf: extracts 1-3, 5 into a 4-page PDF", async () => {
  const { window, registry } = await loadPage("tools/split-pdf.html");
  const doc = window.document;
  await selectFiles(window, [makeFile(window, "deck.pdf", pdf5, "application/pdf")]);
  await tick(window, 12, 20);
  assert(doc.querySelector("#page-info").textContent.includes("5 pages"), "page count missing");
  setValue(window, "#page-range", "1-3, 5");
  await settle(window);
  assert(doc.querySelector("#preview-caption").textContent.includes("4 pages"), "selection preview wrong: " + doc.querySelector("#preview-caption").textContent);
  assert(doc.querySelector("#preview-caption").textContent.includes("1 file"), "extract mode should produce 1 file");

  click(window, "#primary-action");
  await tick(window, 30, 20);
  const { name, buffer } = await downloadedBytes(registry);
  assert(name.endsWith(".pdf"), "extract mode should produce a PDF, got " + name);
  const pdf = await PDFDocument.load(buffer);
  assert(pdf.getPageCount() === 4, "expected 4 extracted pages, got " + pdf.getPageCount());
});

await test("split-pdf: 'every page' mode delivers a ZIP of 5 PDFs", async () => {
  const { window, registry } = await loadPage("tools/split-pdf.html");
  const doc = window.document;
  await selectFiles(window, [makeFile(window, "deck.pdf", pdf5, "application/pdf")]);
  await tick(window, 12, 20);
  checkRadio(window, "#split-mode-every");
  await settle(window);
  assert(doc.querySelector("#page-range").disabled === true, "range input should be disabled in 'every page' mode");
  assert(doc.querySelectorAll("#preview-body .tile").length === 5, "should preview 5 output files");

  click(window, "#primary-action");
  await tick(window, 40, 20);
  const zipEntry = registry.downloads.find((d) => d.name.endsWith(".zip"));
  assert(zipEntry, "ZIP download missing");
  const zip = await JSZip.loadAsync(Buffer.from(await zipEntry.blob.arrayBuffer()));
  const names = Object.keys(zip.files).sort();
  assert(names.length === 5, "expected 5 PDFs in the ZIP, got " + names.length);
  assert(names[0] === "deck-part-1-page-001.pdf", "unexpected entry " + names[0]);
  const inner = await PDFDocument.load(await zip.files[names[0]].async("nodebuffer"));
  assert(inner.getPageCount() === 1, "each split file should hold one page");
});

await test("split-pdf: one file per range produces two PDFs in a ZIP", async () => {
  const { window, registry } = await loadPage("tools/split-pdf.html");
  const doc = window.document;
  await selectFiles(window, [makeFile(window, "deck.pdf", pdf5, "application/pdf")]);
  await tick(window, 12, 20);
  checkRadio(window, "#split-mode-ranges");
  setValue(window, "#page-range", "1-2, 4-5");
  await settle(window);
  assert(doc.querySelector("#preview-caption").textContent.includes("2 files"), "should plan 2 files");
  click(window, "#primary-action");
  await tick(window, 40, 20);
  const zipEntry = registry.downloads.find((d) => d.name.endsWith(".zip"));
  assert(zipEntry, "ZIP missing");
  const zip = await JSZip.loadAsync(Buffer.from(await zipEntry.blob.arrayBuffer()));
  assert(Object.keys(zip.files).length === 2, "expected 2 files");
});

await test("compress-image: reports before/after sizes and percentage saved", async () => {
  const images = new Map([
    ["blob:1", { width: 1600, height: 1200 }],
    ["blob:2", { width: 320, height: 200 }],
  ]);
  const { window, registry } = await loadPage("tools/compress-image.html", { images });
  const doc = window.document;
  setValue(window, "#quality", "60");
  setValue(window, "#max-width", "800");
  await selectFiles(window, [
    makeFile(window, "big.jpg", pngLarge, "image/jpeg"),
    makeFile(window, "small.jpg", pngSmall, "image/jpeg"),
  ]);
  await tick(window, 4, 10);
  click(window, "#primary-action");
  await tick(window, 30, 20);

  const tiles = doc.querySelectorAll("#preview-body .tile");
  assert(tiles.length === 2, "expected 2 results, got " + tiles.length);
  assert(doc.querySelector("#totals").hidden === false, "totals row hidden");
  const stats = [...doc.querySelectorAll("#totals .stat")].map((s) => s.textContent);
  assert(stats.length === 3, "expected 3 total stats");
  assert(stats[2].includes("%"), "third stat should be a percentage: " + stats[2]);
  assert(registry.canvasCalls[0].width === 800, "max width not applied, got " + registry.canvasCalls[0].width);
  assert(doc.querySelector(".result.is-visible"), "success panel missing");
  assert(registry.downloads.some((d) => d.name.endsWith(".zip")) === false, "no ZIP yet");
});

await test("compress-image: keeps the original when re-encoding is not smaller", async () => {
  const images = new Map([["blob:x", { width: 64, height: 64 }]]);
  const { window } = await loadPage("tools/compress-image.html", { images });
  const doc = window.document;
  setValue(window, "#quality", "100");
  /* A tiny original that no re-encode can beat. */
  const file = makeFile(window, "flat.png", Buffer.alloc(90), "image/png");
  await selectFiles(window, [file]);
  await tick(window, 3, 10);
  click(window, "#primary-action");
  await tick(window, 20, 20);
  assert(doc.querySelector("#preview-body .tile__sub").textContent.includes("original kept"), "should say the original was kept");
  assert(doc.querySelector("#preview-body .file-item__badge").textContent === "0% saved", "badge should show 0% saved");
});

await test("image-converter: converts to JPG with a background and zips the batch", async () => {
  const images = new Map([
    ["blob:1", { width: 400, height: 300 }],
    ["blob:2", { width: 500, height: 500 }],
  ]);
  const { window, registry } = await loadPage("tools/image-converter.html", { images });
  const doc = window.document;
  setValue(window, "#max-width", "250");
  await selectFiles(window, [
    makeFile(window, "one.png", pngSmall, "image/png"),
    makeFile(window, "two.png", pngLarge, "image/png"),
  ]);
  await tick(window, 4, 10);
  click(window, "#primary-action");
  await tick(window, 30, 20);

  const tiles = doc.querySelectorAll("#preview-body .tile");
  assert(tiles.length === 2, "expected 2 converted images");
  assert(doc.querySelectorAll("#preview-body .tile__name")[0].textContent === "one.jpg", "should be renamed to .jpg");
  assert(registry.canvasCalls.every((c) => c.type === "image/jpeg"), "all outputs should be JPEG");
  assert(registry.canvasCalls[0].width === 250, "max width not applied");

  click(window, "#download-zip");
  await tick(window, 20, 20);
  const zipEntry = registry.downloads.find((d) => d.name.endsWith(".zip"));
  assert(zipEntry, "ZIP missing");
  const zip = await JSZip.loadAsync(Buffer.from(await zipEntry.blob.arrayBuffer()));
  assert(Object.keys(zip.files).length === 2, "ZIP should hold 2 files");
});

await test("image-converter: disables quality for PNG and blocks unsupported WEBP", async () => {
  const { window } = await loadPage("tools/image-converter.html");
  const doc = window.document;
  checkRadio(window, "#format-png");
  await tick(window, 2);
  assert(doc.querySelector("#quality").disabled === true, "quality should be disabled for lossless PNG");
  /* Force the WEBP-unsupported path. */
  checkRadio(window, "#format-webp");
  window.HTMLCanvasElement.prototype.toDataURL = () => "data:image/png;base64,AAAA";
  await selectFiles(window, [makeFile(window, "one.png", pngSmall, "image/png")]);
  await tick(window, 3, 10);
  click(window, "#primary-action");
  await tick(window, 5);
  const toast = doc.querySelector(".toast--error");
  assert(toast, "expected an error toast when WEBP is unsupported");
  assert(toast.textContent.includes("WEBP"), "toast should mention WEBP");
});

await test("text-to-pdf: paginates the preview and exports a real PDF", async () => {
  const { window, registry } = await loadPage("tools/text-to-pdf.html");
  const doc = window.document;
  const text = Array.from({ length: 120 }, (_, i) => "Line " + (i + 1) + ": the quick brown fox jumps over the lazy dog.").join("\n");
  setValue(window, "#text-input", text);
  await settle(window);
  const pages = doc.querySelectorAll("#preview-body .paper");
  assert(pages.length > 1, "long text should paginate the preview, got " + pages.length);
  assert(doc.querySelector("#preview-caption").textContent.includes("page"), "caption should count pages");
  assert(doc.querySelector("#text-stats").textContent.includes("words"), "stats line missing");

  click(window, "#primary-action");
  await tick(window, 20, 20);
  const { name, buffer } = await downloadedBytes(registry);
  assert(name === "text-document.pdf", "unexpected name " + name);
  const pdf = await PDFDocument.load(buffer);
  assert(pdf.getPageCount() >= 2, "expected multiple pages, got " + pdf.getPageCount());
  assert(buffer.toString("latin1").includes("/Helvetica"), "PDF should embed the Helvetica font");
  assert(registry.consoleErrors.length === 0, "console errors: " + registry.consoleErrors.join(" | "));
});

await test("text-to-pdf: imports a .txt file into the editor", async () => {
  const { window } = await loadPage("tools/text-to-pdf.html");
  const doc = window.document;
  await selectFiles(window, [makeFile(window, "notes.txt", Buffer.from("Hello from a file.\nSecond line."), "text/plain")]);
  await tick(window, 8, 15);
  assert(doc.querySelector("#text-input").value.includes("Hello from a file"), "text not imported");
  assert(doc.querySelector(".toast--success"), "success toast missing");
});

await test("qr-generator: draws the code, reports the version and exports PNG + SVG", async () => {
  const { window, registry } = await loadPage("tools/qr-generator.html");
  const doc = window.document;
  assert(doc.querySelector("#primary-action").disabled === true, "download should start disabled");
  setValue(window, "#qr-text", "https://filetools.app/tools/qr-generator.html");
  await settle(window);
  const canvas = doc.querySelector("#qr-canvas");
  const context = canvas.getContext("2d");
  const rects = context.calls.filter((c) => c[0] === "fillRect");
  assert(rects.length > 100, "expected many module rects, got " + rects.length);
  assert(Number(canvas.width) === 512, "canvas should match the size control");
  assert(doc.querySelector("#qr-meta").textContent.includes("modules"), "meta line missing");
  assert(doc.querySelector("#qr-length").textContent.includes("bytes"), "length line missing");
  assert(doc.querySelector("#primary-action").disabled === false, "download should be enabled");

  click(window, "#primary-action");
  await tick(window, 5);
  const png = registry.downloads.find((d) => d.name.endsWith(".png"));
  assert(png && png.name === "qr-code-512px.png", "PNG download missing");

  click(window, "#download-svg");
  await tick(window, 5);
  const svg = registry.downloads.find((d) => d.name.endsWith(".svg"));
  assert(svg, "SVG download missing");
  const svgText = Buffer.from(await svg.blob.arrayBuffer()).toString("utf8");
  assert(svgText.startsWith("<svg"), "SVG payload malformed");
  assert(svgText.includes('viewBox="0 0'), "SVG missing viewBox");
  assert((svgText.match(/h1v1h-1z/g) || []).length > 100, "SVG should contain module paths");
});

await test("qr-generator: rejects content that is too long", async () => {
  const { window } = await loadPage("tools/qr-generator.html");
  const doc = window.document;
  setValue(window, "#qr-text", "x".repeat(3000));
  await settle(window);
  const toast = doc.querySelector(".toast--error");
  assert(toast, "expected an error toast");
  assert(toast.textContent.includes("too long"), "message should say it is too long: " + toast.textContent);
  assert(doc.querySelector("#primary-action").disabled === true, "download should stay disabled");
});

await test("qr-generator: colours, size and quiet zone are honoured", async () => {
  const { window } = await loadPage("tools/qr-generator.html");
  const doc = window.document;
  setValue(window, "#qr-text", "FileTools");
  await settle(window);
  setValue(window, "#fg-color", "#ff0000");
  setValue(window, "#qr-size", "256");
  setValue(window, "#qr-margin", "2");
  await tick(window, 3);
  const canvas = doc.querySelector("#qr-canvas");
  assert(Number(canvas.width) === 256, "size control not applied");
  const context = canvas.getContext("2d");
  assert(context.fillStyle === "#ff0000", "foreground colour not applied, got " + context.fillStyle);
  assert(doc.querySelector("#qr-size-value").textContent === "256 px", "size label not updated");
  assert(doc.querySelector("#qr-margin-value").textContent === "2 modules", "margin label not updated");
});

await test("word-counter: counts words, sentences, paragraphs and reading time", async () => {
  const { window, registry } = await loadPage("tools/word-counter.html");
  const doc = window.document;
  const text =
    "The quick brown fox jumps over the lazy dog.\n" +
    "It repeats: fox, dog, fox.\n\n" +
    "A second paragraph adds three words here!";
  setValue(window, "#word-input", text);
  await settle(window);
  const stats = {};
  doc.querySelectorAll("#stats-grid .stat").forEach((card) => {
    stats[card.querySelector(".stat__label").textContent] = card.querySelector(".stat__value").textContent;
  });
  assert(stats["Words"] === "21", "expected 21 words, got " + stats["Words"]);
  assert(stats["Sentences"] === "3", "expected 3 sentences, got " + stats["Sentences"]);
  assert(stats["Paragraphs"] === "2", "expected 2 paragraphs, got " + stats["Paragraphs"]);
  assert(stats["Characters"] === String(text.length), "character count wrong: " + stats["Characters"]);
  assert(stats["No spaces"] === String(text.replace(/\s/g, "").length), "no-space count wrong");
  assert(stats["Reading time"] === "6 s", "reading time wrong: " + stats["Reading time"]);
  const keywords = [...doc.querySelectorAll("#keyword-body tr")].map((r) => r.children[0].textContent);
  assert(keywords.includes("fox"), "keyword list should include 'fox', got " + keywords.join(","));
  assert(!keywords.includes("the"), "stop words should be filtered out");
  assert(registry.consoleErrors.length === 0, "console errors: " + registry.consoleErrors.join(" | "));
});

await test("word-counter: copies and downloads the text", async () => {
  const { window, registry } = await loadPage("tools/word-counter.html");
  const doc = window.document;
  setValue(window, "#word-input", "Copy me please");
  await settle(window);
  click(window, "#copy-action");
  await tick(window, 4);
  assert(registry.clipboard[0] === "Copy me please", "clipboard not written");
  click(window, "#download-action");
  await tick(window, 4);
  assert(registry.downloads[0].name === "document.txt", "txt download missing");
  const content = Buffer.from(await registry.downloads[0].blob.arrayBuffer()).toString("utf8");
  assert(content === "Copy me please", "downloaded content wrong");
});

await test("contact form composes a mailto link and validates input", async () => {
  const { window } = await loadPage("contact.html");
  const doc = window.document;
  const form = doc.querySelector("#contact-form");
  form.dispatchEvent(new window.Event("submit", { bubbles: true, cancelable: true }));
  await tick(window, 3);
  assert(doc.querySelector(".toast--warning"), "empty form should warn");

  setValue(window, "#contact-name", "Ada");
  setValue(window, "#contact-email", "ada@example.com");
  setValue(window, "#contact-message", "The split tool is great, could it also handle bookmarks?");
  form.dispatchEvent(new window.Event("submit", { bubbles: true, cancelable: true }));
  await tick(window, 3);
  assert(doc.querySelector('[data-component="status"]').textContent.includes("email app"), "status not updated");
  assert(doc.querySelector(".toast--success"), "success toast missing");
});

console.log("\nShared helpers (unit level)");

await test("parsePageRanges handles ranges, duplicates, reversed input and errors", async () => {
  const { window } = await loadPage("tools/split-pdf.html");
  const FT = window.FT;
  const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  assert(eq(FT.parsePageRanges("1-3, 5, 7-9", 10), [1, 2, 3, 5, 7, 8, 9]), "range parsing wrong");
  assert(eq(FT.parsePageRanges("5-3", 10), [3, 4, 5]), "reversed range should be normalised");
  assert(eq(FT.parsePageRanges("2,2,3", 10), [2, 3]), "duplicates should collapse");
  assert(eq(FT.parsePageRanges("4", 10), [4]), "single page wrong");
  const throws = (input, fragment) => {
    try {
      FT.parsePageRanges(input, 10);
      throw new Error("expected a throw for " + input);
    } catch (error) {
      assert(error.message.includes(fragment), "unexpected message: " + error.message);
    }
  };
  throws("1-99", "out of range");
  throws("abc", "not a valid page");
  throws("", "Enter at least one page");
  throws("0", "out of range");
});

await test("formatBytes, safeFileName and friendlyError behave", async () => {
  const { window } = await loadPage("index.html");
  const FT = window.FT;
  assert(FT.formatBytes(0) === "0 B", "zero bytes");
  assert(FT.formatBytes(1023) === "1023 B", "bytes");
  assert(FT.formatBytes(2048) === "2.0 KB", "kilobytes: " + FT.formatBytes(2048));
  assert(FT.formatBytes(5 * 1024 * 1024) === "5.0 MB", "megabytes");
  assert(FT.safeFileName("My File (1): final?.PDF") === "My-File-(1)-final-.PDF", "filename not sanitised: " + FT.safeFileName("My File (1): final?.PDF"));
  assert(!/[\\/:*?"<>|\s]/.test(FT.safeFileName("My File (1): final?.PDF")), "unsafe characters survived");
  assert(FT.friendlyError(new Error("Input document to `PDFDocument.load` is encrypted")).includes("password"), "encrypted message");
  assert(FT.friendlyError(new Error("Invalid PDF structure")).includes("valid PDF"), "invalid pdf message");
  assert(FT.baseName("a.b.pdf") === "a.b", "baseName wrong");
  assert(FT.extension("a.b.PDF") === "pdf", "extension wrong");
  assert(FT.searchTools("spreadsheet").length === 1, "keyword search should find Excel to PDF");
  assert(FT.searchTools("pdf").length >= 5, "pdf search should find several tools");
  assert(FT.searchTools("").length === 0, "empty search should return nothing");
});

await test("object URLs are revoked when files are removed or the page unloads", async () => {
  const images = new Map([["blob:1", { width: 100, height: 100 }]]);
  const { window, registry, dom } = await loadPage("tools/compress-image.html", { images });
  const doc = window.document;
  await selectFiles(window, [makeFile(window, "a.png", pngSmall, "image/png")]);
  await tick(window, 4, 10);
  const created = registry.blobs.size;
  assert(created >= 1, "thumbnail should create an object URL");
  doc.querySelector('.file-item [data-action="remove"]').dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
  await tick(window, 3);
  assert(registry.revoked.length >= 1, "removing a file should revoke its thumbnail URL");
  window.dispatchEvent(new window.Event("pagehide"));
  assert(registry.revoked.length >= created, "pagehide should revoke the remaining URLs");
  dom.window.close();
});


console.log("\nDeep links and design system");

await test("index.html honours ?category= and ?q= deep links", async () => {
  const { window } = await loadPage("index.html?category=image&q=compress");
  const doc = window.document;
  const cards = [...doc.querySelectorAll("#tools-grid .card .card__title")].map((n) => n.textContent);
  assert(cards.length === 1 && cards[0] === "Compress Image", "deep link should filter to one tool, got " + cards.join(","));
  const pressed = [...doc.querySelectorAll(".chip")].filter((c) => c.getAttribute("aria-pressed") === "true");
  assert(pressed.length === 1 && pressed[0].textContent.includes("Image Tools"), "image chip should be active");
  assert(doc.querySelector("#tool-search").value === "compress", "search box should carry the query");
});

await test("docx-to-pdf: an export failure is reported, not swallowed", async () => {
  /* html2pdf's html2canvas pass cannot run without a real canvas, so in this
     environment the export fails. What we verify is the failure path: a clear
     message, the button re-enabled and no half-built result panel. */
  const { window } = await loadPage("tools/docx-to-pdf.html");
  const doc = window.document;
  const bytes = await makeDocx();
  await selectFiles(window, [makeFile(window, "report.docx", bytes, "application/vnd.openxmlformats-officedocument.wordprocessingml.document")]);
  await tick(window, 30, 25);
  click(window, "#primary-action");
  await tick(window, 80, 30);
  assert(doc.querySelector(".toast--error"), "a failure should raise an error toast");
  assert(doc.querySelector('[data-component="status"]').textContent.length > 10, "status line should explain the failure");
  assert(!doc.querySelector(".result.is-visible"), "no success panel should be shown after a failure");
  assert(doc.querySelector("#primary-action").disabled === false, "the user must be able to try again");
  assert(doc.querySelector("#loader").classList.contains("is-visible") === false, "the loader must be hidden again");
});

await test("design system covers mobile, tablet, desktop and reduced motion", () => {
  const css = read("css/style.css");
  ["640px", "960px", "1280px", "900px", "380px"].forEach((bp) =>
    assert(css.includes("(min-width: " + bp + ")") || css.includes("(max-width: " + bp + ")"), "missing breakpoint " + bp)
  );
  assert(/grid-template-columns: 1fr;/.test(css), "tool grid should start as a single column");
  assert(/repeat\(2, minmax\(0, 1fr\)\)/.test(css), "tablet grid should be 2 columns");
  assert(/repeat\(3, minmax\(0, 1fr\)\)/.test(css), "desktop grid should be 3 columns");
  assert(/repeat\(4, minmax\(0, 1fr\)\)/.test(css), "wide grid should be 4 columns");
  assert(css.includes("--tap: 44px"), "touch target token missing");
  assert(/clamp\(/.test(css), "fluid typography should use clamp()");
  assert(css.includes("overflow-x: hidden"), "body should not scroll horizontally");
  assert(/:focus-visible/.test(css), "visible focus styles missing");
  assert(css.includes("--ease-out"), "motion tokens missing");
  ["--primary", "--accent", "--bg", "--surface", "--text", "--border", "--success", "--danger"].forEach((token) =>
    assert(css.includes(token + ":"), "design token missing: " + token)
  );
});

await test("every page is privacy-first and keyboard reachable", () => {
  const pagesWithDropzone = TOOL_PAGES.filter((p) => read(p).includes('data-component="dropzone"'));
  assert(pagesWithDropzone.length === 10, "every tool except the QR generator should offer an uploader, found " + pagesWithDropzone.length);
  PAGES.forEach((page) => {
    const html = read(page);
    assert(html.includes("never leave your device") || html.includes("no server"), page + " should state the privacy promise");
  });
  const common = read("js/common.js");
  assert(common.includes('e.key === "Enter"') && common.includes('" "'), "dropzone should open on Enter and Space");
  assert(common.includes("aria-live"), "status regions should be announced");
  assert(common.includes('role="button"'), "dropzone should expose a button role");
});

/* ========================================================================== */
console.log("\n" + "─".repeat(64));
console.log(`${passed} passed, ${failed} failed`);
if (failed) {
  console.log("Failing: " + results.filter((r) => !r.ok).map((r) => r.name).join("; "));
  process.exit(1);
}
console.log("All checks passed.");
