/* ==========================================================================
   .qa/env.mjs — jsdom test environment for the static site.

   This sandbox has no browser (Chromium download and every CDN except the npm
   registry are blocked), so tests run the real pinned libraries inside jsdom.
   Browser-only APIs that jsdom lacks are shimmed here — canvas, object URLs,
   image decoding and anchor downloads. Nothing about the site's own logic is
   replaced: the shipped scripts and HTML are loaded unchanged.
   ========================================================================== */
import { JSDOM, ResourceLoader, VirtualConsole } from "jsdom";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.resolve(HERE, "..");
const VENDOR = path.join(HERE, "vendor");
const ORIGIN = "http://localhost:8080";

/* Map the pinned CDN URLs used in the HTML to the identical files fetched
   from the npm registry (jsdelivr mirrors npm packages 1:1). */
const CDN_MAP = {
  "https://cdn.jsdelivr.net/npm/mammoth@1.13.0/mammoth.browser.min.js": "mammoth.browser.min.js",
  "https://cdn.jsdelivr.net/npm/html2pdf.js@0.14.0/dist/html2pdf.bundle.min.js": "html2pdf.bundle.min.js",
  "https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js": "xlsx.full.min.js",
  "https://cdn.jsdelivr.net/npm/jspdf@3.0.4/dist/jspdf.umd.min.js": "jspdf.umd.min.js",
  "https://cdn.jsdelivr.net/npm/jspdf-autotable@5.0.8/dist/jspdf.plugin.autotable.min.js":
    "jspdf.plugin.autotable.min.js",
  "https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/legacy/build/pdf.min.js": "pdf.min.js",
  "https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/legacy/build/pdf.worker.min.js": "pdf.worker.min.js",
  "https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/dist/pdf-lib.min.js": "pdf-lib.min.js",
  "https://cdn.jsdelivr.net/npm/jszip@3.10.2/dist/jszip.min.js": "jszip.min.js",
  "https://cdn.jsdelivr.net/npm/qrcode-generator@2.0.4/dist/qrcode.js": "qrcode.js",
};

/* 1x1 PNG and a minimal JPEG, used by the canvas shim. */
const PNG_1PX = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64"
);
const JPEG_1PX = Buffer.from(
  "/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0a" +
    "HBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/wAALCAABAAEBAREA/8QAFAABAAAAAAAA" +
    "AAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAD8AKp//2Q==",
  "base64"
);

class LocalLoader extends ResourceLoader {
  constructor(registry) {
    super();
    this.registry = registry;
  }

  fetch(url) {
    if (CDN_MAP[url]) return Promise.resolve(fs.readFileSync(path.join(VENDOR, CDN_MAP[url])));
    if (url.startsWith(ORIGIN)) {
      const rel = decodeURIComponent(new URL(url).pathname).replace(/^\//, "") || "index.html";
      const file = path.join(ROOT, rel);
      if (!fs.existsSync(file)) return Promise.reject(new Error("missing file " + rel));
      return Promise.resolve(fs.readFileSync(file));
    }
    /* Google Fonts and anything else external: serve an empty stylesheet. */
    return Promise.resolve(Buffer.from(""));
  }
}

/* ---- Browser API shims -------------------------------------------------- */

/** Register a fake image so <img src="blob:…"> resolves to known dimensions. */
export function installShims(window, registry) {
  window.TextEncoder = TextEncoder;
  window.TextDecoder = TextDecoder;
  /* pdf.js expects the Streams API; jsdom does not ship it. */
  window.ReadableStream = ReadableStream;
  window.WritableStream = WritableStream;
  window.TransformStream = TransformStream;
  /* JSZip's browser build schedules work through setImmediate, which jsdom
     lacks — without this its promises never settle. */
  window.setImmediate = (fn, ...args) => window.setTimeout(() => fn(...args), 0);
  window.clearImmediate = (id) => window.clearTimeout(id);

  /* URL.createObjectURL / revokeObjectURL */
  const blobs = new Map();
  let next = 0;
  window.URL.createObjectURL = (blob) => {
    const url = "blob:" + ORIGIN + "/" + ++next;
    blobs.set(url, blob);
    registry.blobs.set(url, blob);
    return url;
  };
  window.URL.revokeObjectURL = (url) => {
    blobs.delete(url);
    registry.revoked.push(url);
  };

  /* jsdom's Blob has no arrayBuffer(); implement it with FileReader. */
  window.Blob.prototype.arrayBuffer = function () {
    return new Promise((resolve, reject) => {
      const reader = new window.FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error("FileReader failed"));
      reader.readAsArrayBuffer(this);
    });
  };

  /* Downloads: record instead of navigating. */
  window.HTMLAnchorElement.prototype.click = function () {
    if (this.hasAttribute("download")) {
      registry.downloads.push({
        name: this.getAttribute("download"),
        href: this.getAttribute("href"),
        blob: registry.blobs.get(this.getAttribute("href")) || null,
      });
    }
  };

  /* Canvas: a recording 2D context with plausible measurements. */
  /* Minimal DOMMatrix2D so pdf.js can read/write the CTM. */
  function matrix2d(init) {
    const m = Object.assign({ a: 1, b: 0, c: 0, d: 1, e: 0, f: 0, is2D: true }, init || {});
    m.multiplySelf = function (other) {
      const { a, b, c, d, e, f } = m;
      m.a = a * other.a + c * other.b;
      m.b = b * other.a + d * other.b;
      m.c = a * other.c + c * other.d;
      m.d = b * other.c + d * other.d;
      m.e = a * other.e + c * other.f + e;
      m.f = b * other.e + d * other.f + f;
      return m;
    };
    m.multiply = function (other) {
      return matrix2d(m).multiplySelf(other);
    };
    m.translateSelf = function (x, y) {
      m.e += m.a * x + m.c * y;
      m.f += m.b * x + m.d * y;
      return m;
    };
    m.scaleSelf = function (sx, sy) {
      m.a *= sx;
      m.b *= sx;
      m.c *= sy;
      m.d *= sy;
      return m;
    };
    m.inverse = function () {
      const det = m.a * m.d - m.b * m.c || 1;
      return matrix2d({
        a: m.d / det,
        b: -m.b / det,
        c: -m.c / det,
        d: m.a / det,
        e: (m.c * m.f - m.d * m.e) / det,
        f: (m.b * m.e - m.a * m.f) / det,
      });
    };
    m.transformPoint = function (p) {
      return { x: m.a * p.x + m.c * p.y + m.e, y: m.b * p.x + m.d * p.y + m.f };
    };
    return m;
  }

  function makeContext(canvas) {
    const calls = [];
    const state = { transform: matrix2d() };
    const ctx = {
      canvas,
      calls,
      fillStyle: "#000",
      strokeStyle: "#000",
      lineWidth: 1,
      font: "10px sans-serif",
      textAlign: "start",
      imageSmoothingQuality: "low",
      globalAlpha: 1,
      save() { calls.push(["save"]); },
      restore() { calls.push(["restore"]); },
      translate(x, y) { state.transform.translateSelf(x, y); calls.push(["translate", x, y]); },
      rotate(r) { calls.push(["rotate", r]); },
      scale(x, y) { state.transform.scaleSelf(x, y); calls.push(["scale", x, y]); },
      setTransform(a, b, c, d, e, f) {
        state.transform = a && typeof a === "object" ? matrix2d(a) : matrix2d({ a, b, c, d, e, f });
        calls.push(["setTransform"]);
      },
      beginPath() { calls.push(["beginPath"]); },
      closePath() { calls.push(["closePath"]); },
      moveTo() { calls.push(["moveTo"]); },
      lineTo() { calls.push(["lineTo"]); },
      stroke() { calls.push(["stroke"]); },
      fill() { calls.push(["fill"]); },
      fillRect(x, y, w, h) { calls.push(["fillRect", x, y, w, h]); },
      strokeRect() { calls.push(["strokeRect"]); },
      clearRect() { calls.push(["clearRect"]); },
      clip() { calls.push(["clip"]); },
      arc() { calls.push(["arc"]); },
      drawImage(img) {
        calls.push(["drawImage", img && (img.width || img.naturalWidth), img && (img.height || img.naturalHeight)]);
      },
      transform(a, b, c, d, e, f) {
        state.transform.multiplySelf({ a, b, c, d, e, f });
        calls.push(["transform", a, b, c, d, e, f]);
      },
      getTransform() { return matrix2d(state.transform); },
      resetTransform() { state.transform = matrix2d(); calls.push(["resetTransform"]); },
      quadraticCurveTo() { calls.push(["quadraticCurveTo"]); },
      bezierCurveTo() { calls.push(["bezierCurveTo"]); },
      arcTo() { calls.push(["arcTo"]); },
      ellipse() { calls.push(["ellipse"]); },
      rect() { calls.push(["rect"]); },
      setLineDash() {},
      getLineDash() { return []; },
      isPointInPath() { return false; },
      createLinearGradient() { return { addColorStop() {} }; },
      createPattern() { return {}; },
      createImageData(w, h) { return { data: new Uint8ClampedArray(Math.max(4, w * h * 4)), width: w, height: h }; },
      getImageData(x, y, w, h) {
        return { data: new Uint8ClampedArray(Math.max(4, w * h * 4)), width: w, height: h };
      },
      putImageData() {},
      measureText(text) {
        const size = parseFloat(String(ctx.font).match(/([\d.]+)px/) ? RegExp.$1 : "10");
        return { width: String(text).length * size * 0.5, actualBoundingBoxAscent: size, actualBoundingBoxDescent: size * 0.2 };
      },
      fillText(text, x, y) { calls.push(["fillText", text, x, y]); },
      strokeText() {},
    };
    return ctx;
  }

  window.HTMLCanvasElement.prototype.getContext = function () {
    if (!this.__ctx) this.__ctx = makeContext(this);
    return this.__ctx;
  };
  window.HTMLCanvasElement.prototype.toDataURL = function (mime) {
    const type = mime || "image/png";
    registry.canvasCalls.push({ width: this.width, height: this.height, type });
    return "data:" + type + ";base64," + (type === "image/png" ? PNG_1PX : JPEG_1PX).toString("base64");
  };
  window.HTMLCanvasElement.prototype.toBlob = function (callback, mime, quality) {
    const type = mime || "image/png";
    const base = type === "image/png" ? PNG_1PX : JPEG_1PX;
    /* Scale the fake payload with the canvas so size comparisons are meaningful. */
    const factor = Math.max(1, Math.round((this.width * this.height) / 4096));
    const qualityFactor = type === "image/png" ? 1 : Math.max(0.2, Number(quality) || 0.9);
    const payload = Buffer.concat([base, Buffer.alloc(Math.round(factor * 64 * qualityFactor))]);
    registry.canvasCalls.push({ width: this.width, height: this.height, type, quality, bytes: payload.length });
    const blob = new window.Blob([payload], { type });
    window.setTimeout(() => callback(blob), 0);
  };

  /* Image decoding: resolve from the test registry instead of the network. */
  const RealImage = window.Image;
  window.Image = function () {
    const img = new RealImage();
    let src = "";
    Object.defineProperty(img, "src", {
      get() { return src; },
      set(value) {
        src = value;
        const meta = registry.images.get(value) || { width: 800, height: 600 };
        window.setTimeout(() => {
          Object.defineProperty(img, "naturalWidth", { value: meta.width, configurable: true });
          Object.defineProperty(img, "naturalHeight", { value: meta.height, configurable: true });
          Object.defineProperty(img, "width", { value: meta.width, configurable: true });
          Object.defineProperty(img, "height", { value: meta.height, configurable: true });
          img.dispatchEvent(new window.Event("load"));
        }, 0);
      },
    });
    return img;
  };

  /* Clipboard */
  window.navigator.clipboard = {
    writeText(text) {
      registry.clipboard.push(text);
      return Promise.resolve();
    },
  };
}

/* ---- Page loading ------------------------------------------------------- */

/**
 * Load a page from the real site and wait for its deferred scripts to run.
 * @param {string} relPath  e.g. "index.html" or "tools/merge-pdf.html"
 */
export async function loadPage(relPath, options = {}) {
  const url = ORIGIN + "/" + relPath;
  const html = fs.readFileSync(path.join(ROOT, relPath.split("?")[0]), "utf8");
  const registry = {
    blobs: new Map(),
    downloads: [],
    images: options.images || new Map(),
    canvasCalls: [],
    revoked: [],
    clipboard: [],
    consoleErrors: [],
    consoleWarnings: [],
  };

  const virtualConsole = new VirtualConsole();
  virtualConsole.on("jsdomError", (error) => {
    registry.consoleErrors.push("jsdomError: " + error.message);
  });
  const describe = (args) =>
    args.map((a) => (a && a.stack ? a.stack : typeof a === "string" ? a : String(a))).join(" ");
  virtualConsole.on("error", (...args) => registry.consoleErrors.push(describe(args)));
  virtualConsole.on("warn", (...args) => registry.consoleWarnings.push(describe(args)));

  const dom = new JSDOM(html, {
    url,
    runScripts: "dangerously",
    resources: new LocalLoader(registry),
    pretendToBeVisual: true,
    virtualConsole,
    beforeParse(window) {
      registry.nativePromise = window.Promise;
      installShims(window, registry);
    },
  });

  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("timeout loading " + relPath)), 20000);
    dom.window.addEventListener("load", () => {
      clearTimeout(timer);
      resolve();
    });
  });
  /* html2pdf.js bundles es6-promise, which replaces window.Promise inside
     jsdom (real browsers keep the native one). Put the native Promise back so
     promises created before and after the CDN script stay compatible. */
  if (dom.window.Promise !== registry.nativePromise) {
    dom.window.Promise = registry.nativePromise;
  }
  /* Let deferred promises (theme, initial renders) settle. */
  await new Promise((r) => setTimeout(r, 60));

  return { dom, window: dom.window, registry, url };
}

/* ---- Test helpers ------------------------------------------------------- */

export function makeFile(window, name, bytes, type) {
  /* Wrap in a window-realm typed array so FileReader hands back an ArrayBuffer
     that passes the libraries' `instanceof ArrayBuffer` checks. */
  const payload = new window.Uint8Array(bytes);
  return new window.File([payload], name, { type: type || "application/octet-stream" });
}

/** Fire a FileList-bearing change event on the uploader's hidden input. */
export async function selectFiles(window, files) {
  const input = window.document.querySelector('[data-component="dropzone"] input[type="file"]');
  if (!input) throw new Error("no file input found on the page");
  /* jsdom has no DataTransfer, so hand the input an array-like FileList. */
  const list = Object.assign(files.slice(), { item: (i) => files[i] || null });
  Object.defineProperty(input, "files", { value: list, configurable: true });
  input.dispatchEvent(new window.Event("change", { bubbles: true }));
  await tick(window, 3);
}

export function tick(window, rounds = 1, ms = 5) {
  let chain = Promise.resolve();
  for (let i = 0; i < rounds; i++) chain = chain.then(() => new Promise((r) => setTimeout(r, ms)));
  return chain;
}

/** Select a radio button the way a user would (jsdom ignores synthetic checks). */
export function checkRadio(window, selector) {
  const el = window.document.querySelector(selector);
  if (!el) throw new Error("no radio for " + selector);
  el.checked = true;
  el.dispatchEvent(new window.Event("change", { bubbles: true }));
  el.dispatchEvent(new window.Event("input", { bubbles: true }));
  return el;
}

/** Wait for debounced handlers (120-180 ms in the site) to settle. */
export function settle(window, ms = 300) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

export function click(window, selector) {
  const el = window.document.querySelector(selector);
  if (!el) throw new Error("no element for " + selector);
  el.dispatchEvent(new window.MouseEvent("click", { bubbles: true, cancelable: true }));
}

export function setValue(window, selector, value) {
  const el = window.document.querySelector(selector);
  if (!el) throw new Error("no element for " + selector);
  el.value = value;
  el.dispatchEvent(new window.Event("input", { bubbles: true }));
  el.dispatchEvent(new window.Event("change", { bubbles: true }));
}

export function assert(condition, message) {
  if (!condition) throw new Error("ASSERT FAILED: " + message);
}

export async function runSuite(name, fn) {
  const started = Date.now();
  try {
    await fn();
    console.log(`  ✓ ${name} (${Date.now() - started} ms)`);
    return true;
  } catch (error) {
    console.log(`  ✗ ${name}`);
    console.log("      " + String(error.message || error).split("\n").join("\n      "));
    return false;
  }
}
