/* ==========================================================================
   common.js — shared runtime for every page.
   Exposes a single namespace (window.FT); nothing else is added to global.
   Everything is a small, single-purpose function so each tool script can pick
   only what it needs.
   ========================================================================== */
(function (global) {
  "use strict";

  var R = global.FileToolsRegistry;
  var FT = {};

  /* =========================================================================
     0. Tiny utilities
     ========================================================================= */

  /** Escape a string for safe insertion into HTML. */
  function escapeHtml(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  /** Human readable file size. */
  function formatBytes(bytes, decimals) {
    if (!bytes && bytes !== 0) return "—";
    if (bytes < 1) return "0 B";
    var k = 1024;
    var units = ["B", "KB", "MB", "GB"];
    var i = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), units.length - 1);
    var digits = decimals == null ? (i === 0 ? 0 : 1) : decimals;
    return (bytes / Math.pow(k, i)).toFixed(digits) + " " + units[i];
  }

  function debounce(fn, wait) {
    var t = 0;
    return function () {
      var args = arguments;
      var self = this;
      global.clearTimeout(t);
      t = global.setTimeout(function () {
        fn.apply(self, args);
      }, wait);
    };
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  /** Yield to the browser so progress UI can paint during long work. */
  function yieldToBrowser() {
    return new Promise(function (resolve) {
      if (typeof global.requestAnimationFrame === "function") {
        global.requestAnimationFrame(function () {
          global.setTimeout(resolve, 0);
        });
      } else {
        global.setTimeout(resolve, 0);
      }
    });
  }

  /** Give the event loop a real breather for heavy synchronous chunks. */
  function sleep(ms) {
    return new Promise(function (resolve) {
      global.setTimeout(resolve, ms);
    });
  }

  function $(selector, root) {
    return (root || document).querySelector(selector);
  }

  function $$(selector, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(selector));
  }

  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (key) {
        if (key === "class") node.className = attrs[key];
        else if (key === "html") node.innerHTML = attrs[key];
        else if (key === "text") node.textContent = attrs[key];
        else if (key.indexOf("on") === 0) node.addEventListener(key.slice(2).toLowerCase(), attrs[key]);
        else if (attrs[key] !== null && attrs[key] !== undefined) node.setAttribute(key, attrs[key]);
      });
    }
    (children || []).forEach(function (child) {
      if (!child) return;
      node.appendChild(typeof child === "string" ? document.createTextNode(child) : child);
    });
    return node;
  }

  /** Turn "my file (1).PDF" into "my-file-1.pdf" (keeps the extension). */
  function safeFileName(name, fallback) {
    var clean = String(name || "")
      .replace(/[\\/:*?"<>|]+/g, "-")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
    return clean || fallback || "file";
  }

  function baseName(name) {
    var s = String(name || "file");
    var i = s.lastIndexOf(".");
    return i > 0 ? s.slice(0, i) : s;
  }

  function extension(name) {
    var s = String(name || "");
    var i = s.lastIndexOf(".");
    return i > 0 ? s.slice(i + 1).toLowerCase() : "";
  }

  /* =========================================================================
     1. Object URL bookkeeping (no leaks)
     ========================================================================= */
  var liveUrls = new Set();

  function createObjectURL(blob) {
    var url = URL.createObjectURL(blob);
    liveUrls.add(url);
    return url;
  }

  function revokeObjectURL(url) {
    if (!url) return;
    if (liveUrls.has(url)) {
      URL.revokeObjectURL(url);
      liveUrls.delete(url);
    } else {
      URL.revokeObjectURL(url);
    }
  }

  global.addEventListener("pagehide", function () {
    liveUrls.forEach(function (url) {
      URL.revokeObjectURL(url);
    });
    liveUrls.clear();
  });

  /* =========================================================================
     2. Downloads
     ========================================================================= */

  /** Trigger a browser download for a Blob/File and clean up afterwards. */
  function downloadBlob(blob, filename) {
    var url = createObjectURL(blob);
    triggerDownload(url, filename);
    global.setTimeout(function () {
      revokeObjectURL(url);
    }, 4000);
    return filename;
  }

  function downloadDataUrl(dataUrl, filename) {
    triggerDownload(dataUrl, filename);
    return filename;
  }

  function triggerDownload(href, filename) {
    var a = el("a", { href: href, download: filename, rel: "noopener" });
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    global.setTimeout(function () {
      a.remove();
    }, 0);
  }

  /* =========================================================================
     3. File helpers
     ========================================================================= */

  function readFileAsArrayBuffer(file) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onload = function () {
        resolve(reader.result);
      };
      reader.onerror = function () {
        reject(new Error("Could not read " + file.name + "."));
      };
      reader.readAsArrayBuffer(file);
    });
  }

  function readFileAsText(file) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onload = function () {
        resolve(String(reader.result));
      };
      reader.onerror = function () {
        reject(new Error("Could not read " + file.name + "."));
      };
      reader.readAsText(file);
    });
  }

  /** Decode a File into an HTMLImageElement. */
  function loadImage(fileOrUrl) {
    return new Promise(function (resolve, reject) {
      var url = typeof fileOrUrl === "string" ? fileOrUrl : createObjectURL(fileOrUrl);
      var img = new Image();
      img.onload = function () {
        resolve({ image: img, url: url });
      };
      img.onerror = function () {
        revokeObjectURL(url);
        reject(new Error("That file could not be decoded as an image. It may be corrupt."));
      };
      img.src = url;
    });
  }

  /** Canvas → Blob (falls back from WEBP/PNG to JPEG when unsupported). */
  function canvasToBlob(canvas, mime, quality) {
    return new Promise(function (resolve, reject) {
      var q = quality == null ? undefined : quality;
      if (!canvas.toBlob) {
        reject(new Error("This browser cannot export images from a canvas."));
        return;
      }
      canvas.toBlob(
        function (blob) {
          if (blob) resolve(blob);
          else reject(new Error("Could not encode that image."));
        },
        mime,
        q
      );
    });
  }

  /** Does this browser actually support the given output format? */
  function supportsMime(mime) {
    var c = document.createElement("canvas");
    c.width = c.height = 1;
    var out = c.toDataURL(mime);
    return out.indexOf("data:" + mime) === 0;
  }

  /**
   * Return a canvas with the image drawn at its natural size, rotated by
   * 0/90/180/270 degrees.
   */
  function rotateCanvas(image, rotation) {
    var degrees = (((rotation || 0) % 360) + 360) % 360;
    var w = image.naturalWidth || image.width;
    var h = image.naturalHeight || image.height;
    var swap = degrees === 90 || degrees === 270;
    var canvas = document.createElement("canvas");
    canvas.width = swap ? h : w;
    canvas.height = swap ? w : h;
    var ctx = canvas.getContext("2d");
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((degrees * Math.PI) / 180);
    ctx.drawImage(image, -w / 2, -h / 2, w, h);
    return canvas;
  }

  /**
   * Draw an image (or canvas) onto a fresh canvas with rotation, resize and
   * crop applied.
   * @param {Object} image  HTMLImageElement or canvas
   * @param {Object} opts   { rotation, maxWidth, maxHeight, mode: contain|cover|native, background }
   */
  function drawImageToCanvas(image, opts) {
    var options = opts || {};
    var source = options.rotation ? rotateCanvas(image, options.rotation) : image;
    var srcW = source.naturalWidth || source.width;
    var srcH = source.naturalHeight || source.height;
    var maxW = options.maxWidth || 0;
    var maxH = options.maxHeight || 0;
    var mode = options.mode || "contain";

    var outW = srcW;
    var outH = srcH;
    var sx = 0;
    var sy = 0;
    var sw = srcW;
    var sh = srcH;

    if (mode === "cover" && maxW && maxH) {
      outW = maxW;
      outH = maxH;
      var coverScale = Math.max(maxW / srcW, maxH / srcH);
      sw = maxW / coverScale;
      sh = maxH / coverScale;
      sx = (srcW - sw) / 2;
      sy = (srcH - sh) / 2;
    } else if (maxW || maxH) {
      var limitW = maxW || srcW;
      var limitH = maxH || srcH;
      var containScale = Math.min(limitW / srcW, limitH / srcH, 1);
      outW = Math.max(1, Math.round(srcW * containScale));
      outH = Math.max(1, Math.round(srcH * containScale));
    }

    var canvas = document.createElement("canvas");
    canvas.width = outW;
    canvas.height = outH;
    var ctx = canvas.getContext("2d");
    ctx.imageSmoothingQuality = "high";
    if (options.background) {
      ctx.fillStyle = options.background;
      ctx.fillRect(0, 0, outW, outH);
    }
    ctx.drawImage(source, sx, sy, sw, sh, 0, 0, outW, outH);
    return canvas;
  }

  /** File extension for a mime type. */
  function mimeExtension(mime) {
    return { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" }[mime] || "img";
  }

  /* =========================================================================
     4. Toasts
     ========================================================================= */
  var toastRegion = null;

  var TOAST_ICONS = {
    success:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m4 12.5 5 5L20 6.5"/></svg>',
    error:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 8v5"/><path d="M12 16.5v.01"/></svg>',
    warning:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10.3 3.9 2.5 17.4A2 2 0 0 0 4.2 20.4h15.6a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4"/><path d="M12 16.5v.01"/></svg>',
    info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 11v5"/><path d="M12 7.5v.01"/></svg>',
  };

  function ensureToastRegion() {
    if (toastRegion) return toastRegion;
    toastRegion = el("div", { class: "toast-region", "aria-live": "polite", "aria-atomic": "false" });
    document.body.appendChild(toastRegion);
    return toastRegion;
  }

  /** toast("Saved!", "success", "Optional detail line") */
  function toast(title, kind, detail, timeoutMs) {
    var region = ensureToastRegion();
    var type = kind || "info";
    var node = el("div", {
      class: "toast toast--" + type,
      role: type === "error" ? "alert" : "status",
    });
    node.innerHTML =
      '<span class="toast__icon">' +
      (TOAST_ICONS[type] || TOAST_ICONS.info) +
      "</span>" +
      '<div class="toast__body"><div class="toast__title"></div>' +
      (detail ? '<div class="toast__text"></div>' : "") +
      "</div>" +
      '<button class="toast__close" type="button" aria-label="Dismiss notification">' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>' +
      "</button>";
    $(".toast__title", node).textContent = String(title);
    if (detail) $(".toast__text", node).textContent = String(detail);

    var timer = 0;
    function close() {
      global.clearTimeout(timer);
      node.classList.add("is-leaving");
      global.setTimeout(function () {
        node.remove();
      }, 240);
    }
    $(".toast__close", node).addEventListener("click", close);
    region.appendChild(node);
    timer = global.setTimeout(close, timeoutMs || (type === "error" ? 7000 : 4200));
    return close;
  }

  /* =========================================================================
     5. Theme
     ========================================================================= */
  var THEME_KEY = "filetools-theme";

  function systemTheme() {
    return global.matchMedia && global.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    var meta = $('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", theme === "dark" ? "#0a0f1e" : "#f5f6fb");
    $$(".theme-toggle").forEach(function (btn) {
      btn.setAttribute("aria-label", theme === "dark" ? "Switch to light theme" : "Switch to dark theme");
      btn.setAttribute("aria-pressed", theme === "dark" ? "true" : "false");
    });
  }

  function initTheme() {
    var stored = null;
    try {
      stored = global.localStorage.getItem(THEME_KEY);
    } catch (e) {
      stored = null; /* private mode — fall back to system preference */
    }
    applyTheme(stored === "dark" || stored === "light" ? stored : systemTheme());

    if (global.matchMedia) {
      global.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", function (e) {
        var current = null;
        try {
          current = global.localStorage.getItem(THEME_KEY);
        } catch (err) {
          current = null;
        }
        if (!current) applyTheme(e.matches ? "dark" : "light");
      });
    }
  }

  function toggleTheme() {
    var next = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
    applyTheme(next);
    try {
      global.localStorage.setItem(THEME_KEY, next);
    } catch (e) {
      /* storage blocked — theme still applies for this visit */
    }
    toast(next === "dark" ? "Dark mode on" : "Light mode on", "info");
  }

  /* =========================================================================
     6. Shared UI icons
     ========================================================================= */
  FT.icons = {
    upload:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 16V4"/><path d="m7.5 8.5 4.5-4.5 4.5 4.5"/><path d="M4 16v2.5A2.5 2.5 0 0 0 6.5 21h11a2.5 2.5 0 0 0 2.5-2.5V16"/></svg>',
    download:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 4v11"/><path d="m7.5 10.5 4.5 4.5 4.5-4.5"/><path d="M4 18v1.5A1.5 1.5 0 0 0 5.5 21h13a1.5 1.5 0 0 0 1.5-1.5V18"/></svg>',
    file: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/></svg>',
    image:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="2.5"/><circle cx="8.5" cy="9" r="1.5"/><path d="m21 16-5-5L5 20"/></svg>',
    trash:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.85" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 7h16"/><path d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7"/><path d="M6.5 7 7.6 20h8.8L17.5 7"/></svg>',
    grip: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="9" cy="6" r="1.5"/><circle cx="15" cy="6" r="1.5"/><circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/><circle cx="9" cy="18" r="1.5"/><circle cx="15" cy="18" r="1.5"/></svg>',
    rotate:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.85" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 12a8 8 0 1 1-2.6-5.9"/><path d="M20 4v4h-4"/></svg>',
    up: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 14 6-6 6 6"/></svg>',
    down: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 10 6 6 6-6"/></svg>',
    check:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m4 12.5 5 5L20 6.5"/></svg>',
    restart:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.85" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 12a8 8 0 1 0 2.6-5.9"/><path d="M4 4v4h4"/></svg>',
    zip: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/><path d="M11 11v2M13 13v2M11 15v2M13 17v2"/></svg>',
    copy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.85" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M15 5.5A1.5 1.5 0 0 0 13.5 4h-8A1.5 1.5 0 0 0 4 5.5v8A1.5 1.5 0 0 0 5.5 15"/></svg>',
    settings:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.85" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-2.9 1.2v.2a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.6 1.7 1.7 0 0 0-1.9.4l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0-1.2-2.9H3a2 2 0 1 1 0-4h.1A1.7 1.7 0 0 0 4.7 9a1.7 1.7 0 0 0-.4-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 2.9 1.1l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z"/></svg>',
  };

  /* =========================================================================
     7. Site chrome (header, footer, breadcrumb, related tools)
     ========================================================================= */

  /** depth: 1 = page at site root, 2 = page inside /tools/ */
  function siteDepth() {
    return /\/tools\/[^/]+\.html$/.test(global.location.pathname) || /tools\/[^/]+\.html$/.test(global.location.pathname)
      ? 2
      : 1;
  }

  function renderHeader(currentSlug) {
    var mount = $('[data-component="site-header"]');
    if (!mount) return;
    var depth = siteDepth();
    var home = R.pageHref("index.html", depth);

    var search =
      '<div class="nav-search" role="search">' +
      '<label class="sr-only" for="nav-search-input">Search tools</label>' +
      '<span class="nav-search__icon">' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.6-3.6"/></svg>' +
      "</span>" +
      '<input id="nav-search-input" class="nav-search__input" type="search" placeholder="Search tools…" autocomplete="off" role="combobox" aria-expanded="false" aria-controls="nav-search-results" aria-autocomplete="list">' +
      '<div id="nav-search-results" class="nav-search__results" role="listbox" aria-label="Tool search results"></div>' +
      "</div>";

    var catMenu = R.CATEGORIES.map(function (c) {
      var count = R.byCategory(c.id).length;
      return (
        '<a href="' +
        home +
        "?category=" +
        c.id +
        '#tools" data-category="' +
        c.id +
        '">' +
        c.icon +
        "<span>" +
        escapeHtml(c.label) +
        '</span><span class="nav-drop__count">' +
        count +
        "</span></a>"
      );
    }).join("");

    mount.innerHTML =
      '<a class="skip-link" href="#main">Skip to main content</a>' +
      '<div class="container nav">' +
      '<a class="brand" href="' +
      home +
      '" aria-label="' +
      R.SITE.name +
      ' home">' +
      '<span class="brand__mark">' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/><path d="m9 15 2 2 4-4"/></svg>' +
      '</span><span class="brand__text">File<span>Tools</span></span></a>' +
      '<nav class="nav-links" id="nav-links" aria-label="Main navigation">' +
      '<a href="' +
      home +
      '"' +
      (currentSlug ? "" : ' class="is-current" aria-current="page"') +
      ">All tools</a>" +
      '<a href="' +
      home +
      '#how-it-works">How it works</a>' +
      '<a href="' +
      home +
      '#faq">FAQ</a>' +
      '<a href="' +
      R.pageHref("about.html", depth) +
      '"' +
      (isPage("about.html") ? ' class="is-current" aria-current="page"' : "") +
      ">About</a>" +
      '<a href="' +
      R.pageHref("contact.html", depth) +
      '"' +
      (isPage("contact.html") ? ' class="is-current" aria-current="page"' : "") +
      ">Contact</a>" +
      '<div class="nav-drop">' +
      '<button class="nav-drop__btn" type="button" id="cat-toggle" aria-expanded="false" aria-controls="cat-menu">Categories' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>' +
      "</button>" +
      '<div class="nav-drop__menu" id="cat-menu">' +
      catMenu +
      "</div></div>" +
      "</nav>" +
      search +
      '<div class="nav-actions">' +
      '<button class="icon-btn theme-toggle" type="button" aria-label="Switch theme" aria-pressed="false">' +
      '<svg class="icon-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z"/></svg>' +
      '<svg class="icon-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5 19 19M19 5l-1.5 1.5M6.5 17.5 5 19"/></svg>' +
      "</button>" +
      '<button class="icon-btn nav-toggle" type="button" id="nav-toggle" aria-expanded="false" aria-controls="nav-links" aria-label="Open menu">' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>' +
      "</button>" +
      "</div>" +
      "</div>";

    wireHeader();
    applyTheme(document.documentElement.getAttribute("data-theme") || systemTheme());
  }

  function isPage(name) {
    return global.location.pathname.indexOf("/" + name) > -1 || global.location.pathname.endsWith(name);
  }

  function wireHeader() {
    var toggle = $("#nav-toggle");
    var links = $("#nav-links");
    if (toggle && links) {
      toggle.addEventListener("click", function () {
        var open = links.classList.toggle("is-open");
        toggle.setAttribute("aria-expanded", String(open));
        toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
      });
    }

    var catToggle = $("#cat-toggle");
    var catMenu = $("#cat-menu");
    if (catToggle && catMenu) {
      catToggle.addEventListener("click", function (e) {
        e.stopPropagation();
        var open = catMenu.classList.toggle("is-open");
        catToggle.setAttribute("aria-expanded", String(open));
      });
      document.addEventListener("click", function (e) {
        if (!catMenu.contains(e.target) && e.target !== catToggle) {
          catMenu.classList.remove("is-open");
          catToggle.setAttribute("aria-expanded", "false");
        }
      });
    }

    $$(".theme-toggle").forEach(function (btn) {
      btn.addEventListener("click", toggleTheme);
    });

    var header = $('[data-component="site-header"]');
    if (header) {
      var onScroll = function () {
        header.classList.toggle("is-scrolled", global.scrollY > 8);
      };
      global.addEventListener("scroll", onScroll, { passive: true });
      onScroll();
    }

    initNavSearch();
  }

  /* ---- Header search with live results ---------------------------------- */
  function initNavSearch() {
    var input = $("#nav-search-input");
    var results = $("#nav-search-results");
    if (!input || !results) return;
    var depth = siteDepth();
    var activeIndex = -1;
    var matches = [];

    function close() {
      results.classList.remove("is-open");
      input.setAttribute("aria-expanded", "false");
      activeIndex = -1;
    }

    function render(query) {
      matches = searchTools(query);
      results.innerHTML = "";
      if (!query.trim()) {
        results.innerHTML =
          '<div class="nav-search__empty">Type to search ' + R.TOOLS.length + " tools.</div>";
      } else if (!matches.length) {
        results.innerHTML = '<div class="nav-search__empty">No tool matches “' + escapeHtml(query) + '”.</div>';
      } else {
        matches.forEach(function (tool) {
          var a = el("a", {
            class: "nav-search__result",
            href: R.toolHref(tool.slug, depth),
            role: "option",
            "aria-selected": "false",
          });
          a.innerHTML = tool.icon + "<span><strong></strong><small></small></span>";
          $("strong", a).textContent = tool.name;
          $("small", a).textContent = tool.tagline;
          results.appendChild(a);
        });
      }
      results.classList.add("is-open");
      input.setAttribute("aria-expanded", "true");
    }

    input.addEventListener("input", function () {
      render(input.value);
    });
    input.addEventListener("focus", function () {
      render(input.value);
    });
    input.addEventListener("keydown", function (e) {
      var items = $$(".nav-search__result", results);
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        if (!items.length) return;
        activeIndex = e.key === "ArrowDown" ? (activeIndex + 1) % items.length : (activeIndex - 1 + items.length) % items.length;
        items.forEach(function (item, i) {
          item.classList.toggle("is-active", i === activeIndex);
          item.setAttribute("aria-selected", i === activeIndex ? "true" : "false");
        });
        items[activeIndex].scrollIntoView({ block: "nearest" });
      } else if (e.key === "Enter") {
        if (activeIndex > -1 && items[activeIndex]) {
          e.preventDefault();
          global.location.href = items[activeIndex].getAttribute("href");
        } else if (input.value.trim()) {
          e.preventDefault();
          global.location.href = R.pageHref("index.html", depth) + "#tools";
          try {
            global.sessionStorage.setItem("filetools-query", input.value.trim());
          } catch (err) {
            /* ignore */
          }
        }
      } else if (e.key === "Escape") {
        close();
        input.blur();
      }
    });
    document.addEventListener("click", function (e) {
      if (!results.contains(e.target) && e.target !== input) close();
    });
  }

  /** Search the registry (name + keywords + tagline + category). */
  function searchTools(query) {
    var q = String(query || "").trim().toLowerCase();
    if (!q) return [];
    return R.TOOLS.filter(function (tool) {
      var cat = R.category(tool.category);
      return (
        tool.name.toLowerCase().indexOf(q) > -1 ||
        tool.slug.indexOf(q) > -1 ||
        tool.tagline.toLowerCase().indexOf(q) > -1 ||
        (cat && cat.label.toLowerCase().indexOf(q) > -1) ||
        tool.keywords.some(function (k) {
          return k.indexOf(q) > -1 || q.indexOf(k) > -1;
        })
      );
    }).slice(0, 8);
  }

  /* ---- Footer ----------------------------------------------------------- */
  function renderFooter() {
    var mount = $('[data-component="site-footer"]');
    if (!mount) return;
    var depth = siteDepth();
    var home = R.pageHref("index.html", depth);

    var columns = R.CATEGORIES.map(function (cat) {
      var items = R.byCategory(cat.id)
        .map(function (tool) {
          return '<li><a href="' + R.toolHref(tool.slug, depth) + '">' + escapeHtml(tool.name) + "</a></li>";
        })
        .join("");
      return "<div><h3>" + escapeHtml(cat.label) + "</h3><ul>" + items + "</ul></div>";
    }).join("");

    mount.innerHTML =
      '<div class="container">' +
      '<div class="footer-grid">' +
      '<div class="footer-brand">' +
      '<a class="brand" href="' +
      home +
      '"><span class="brand__mark"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/><path d="m9 15 2 2 4-4"/></svg></span>' +
      '<span class="brand__text">File<span>Tools</span></span></a>' +
      "<p>" +
      escapeHtml(R.SITE.tagline) +
      ". Your files never leave your device — every conversion runs locally in the browser.</p>" +
      '<p class="mt-1"><a href="' +
      R.pageHref("privacy.html", depth) +
      '">Read the privacy promise</a></p>' +
      "</div>" +
      columns +
      '<div><h3>Company</h3><ul>' +
      '<li><a href="' +
      R.pageHref("about.html", depth) +
      '">About</a></li>' +
      '<li><a href="' +
      R.pageHref("contact.html", depth) +
      '">Contact</a></li>' +
      '<li><a href="' +
      R.pageHref("privacy.html", depth) +
      '">Privacy</a></li>' +
      '<li><a href="' +
      home +
      '#faq">FAQ</a></li>' +
      "</ul></div>" +
      "</div>" +
      '<div class="footer-bottom"><span>© <span id="year">' +
      new Date().getFullYear() +
      "</span> " +
      R.SITE.name +
      " — all processing happens in your browser.</span>" +
      "<ul>" +
      '<li><a href="' +
      R.pageHref("privacy.html", depth) +
      '">Privacy</a></li>' +
      '<li><a href="' +
      R.pageHref("about.html", depth) +
      '">About</a></li>' +
      '<li><a href="' +
      home +
      '">Tools</a></li>' +
      "</ul></div>" +
      "</div>";
  }

  /* ---- Breadcrumb ------------------------------------------------------- */
  function renderBreadcrumb(tool) {
    var mount = $('[data-component="breadcrumb"]');
    if (!mount || !tool) return;
    var depth = siteDepth();
    mount.innerHTML =
      '<nav aria-label="Breadcrumb"><ol class="breadcrumb">' +
      '<li><a href="' +
      R.pageHref("index.html", depth) +
      '">Home</a></li>' +
      '<li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="m9 5 7 7-7 7"/></svg></li>' +
      '<li><a href="' +
      R.pageHref("index.html", depth) +
      "?category=" +
      tool.category +
      '#tools" data-category="' +
      tool.category +
      '">' +
      escapeHtml(R.category(tool.category).label) +
      "</a></li>" +
      '<li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="m9 5 7 7-7 7"/></svg></li>' +
      '<li><span aria-current="page">' +
      escapeHtml(tool.name) +
      "</span></li>" +
      "</ol></nav>";
  }

  /* ---- Related tools ---------------------------------------------------- */
  function renderRelated(tool) {
    var mount = $('[data-component="related-tools"]');
    if (!mount) return;
    var depth = siteDepth();
    var picks;
    if (tool) {
      var sameCategory = R.byCategory(tool.category).filter(function (t) {
        return t.slug !== tool.slug;
      });
      var others = R.TOOLS.filter(function (t) {
        return t.category !== tool.category;
      });
      picks = sameCategory.concat(others).slice(0, 4);
    } else {
      /* Static pages (about / privacy / contact) show the featured set. */
      picks = R.TOOLS.filter(function (t) {
        return t.featured;
      })
        .concat(R.TOOLS)
        .filter(function (t, index, list) {
          return list.indexOf(t) === index;
        })
        .slice(0, 4);
    }

    mount.innerHTML = picks
      .map(function (t) {
        return (
          '<a class="card reveal" href="' +
          R.toolHref(t.slug, depth) +
          '">' +
          '<span class="card__icon">' +
          t.icon +
          '</span><span class="card__title">' +
          escapeHtml(t.name) +
          '</span><span class="card__desc">' +
          escapeHtml(t.tagline) +
          "</span></a>"
        );
      })
      .join("");
    observeReveals(mount);
  }

  /* ---- Tool page header icon ------------------------------------------- */
  function renderToolIcon(tool) {
    var mount = $('[data-component="tool-icon"]');
    if (mount && tool) mount.innerHTML = tool.icon;
  }

  /* =========================================================================
     8. FAQ accordion + FAQPage JSON-LD built from the on-page markup
     ========================================================================= */
  function initAccordions(root) {
    $$(".accordion__trigger", root).forEach(function (trigger) {
      if (trigger.dataset.ftBound === "1") return;
      trigger.dataset.ftBound = "1";
      var item = trigger.closest(".accordion__item");
      trigger.addEventListener("click", function () {
        var open = item.classList.toggle("is-open");
        trigger.setAttribute("aria-expanded", String(open));
      });
    });
  }

  /** Read the visible FAQ markup and emit FAQPage structured data. */
  function buildFaqSchema() {
    var section = $('[data-component="faq"]');
    if (!section) return;
    var pairs = $$(".accordion__item", section).map(function (item) {
      var q = $(".accordion__trigger span, .accordion__trigger", item);
      var a = $(".accordion__panel p", item);
      return q && a ? { question: q.textContent.trim(), answer: a.textContent.trim() } : null;
    }).filter(Boolean);
    if (!pairs.length) return;

    var script = el("script", { type: "application/ld+json" });
    script.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: pairs.map(function (p) {
        return {
          "@type": "Question",
          name: p.question,
          acceptedAnswer: { "@type": "Answer", text: p.answer },
        };
      }),
    });
    document.head.appendChild(script);
  }

  /* =========================================================================
     9. Scroll reveal
     ========================================================================= */
  var revealObserver = null;

  function observeReveals(root) {
    var nodes = $$(".reveal", root || document);
    if (!nodes.length) return;
    if (!("IntersectionObserver" in global)) {
      nodes.forEach(function (n) {
        n.classList.add("is-visible");
      });
      return;
    }
    if (!revealObserver) {
      revealObserver = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              entry.target.classList.add("is-visible");
              revealObserver.unobserve(entry.target);
            }
          });
        },
        { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
      );
    }
    nodes.forEach(function (n) {
      revealObserver.observe(n);
    });
  }

  /* =========================================================================
     10. Uploader component
     ========================================================================= */

  /**
   * Build the shared drop zone + file list.
   * @param {HTMLElement} mount   container element
   * @param {Object} opts         { accept, multiple, maxSizeMB, title, hint, onFiles, onRemove, reorderable, iconHtml }
   */
  function createUploader(mount, opts) {
    var options = opts || {};
    var accept = options.accept || [];
    var multiple = !!options.multiple;
    var maxBytes = (options.maxSizeMB || 50) * 1024 * 1024;
    var entries = [];
    var seq = 0;
    var dragDepth = 0;

    var id = options.id || "uploader";
    mount.innerHTML =
      '<div class="dropzone" id="' +
      id +
      '-dz" role="button" tabindex="0" aria-describedby="' +
      id +
      '-hint">' +
      '<span class="dropzone__icon">' +
      (options.iconHtml || FT.icons.upload) +
      "</span>" +
      '<span class="dropzone__title"></span>' +
      '<span class="dropzone__hint" id="' +
      id +
      '-hint"></span>' +
      '<span class="dropzone__or">or</span>' +
      '<span class="btn btn--primary">' +
      FT.icons.file +
      " Choose file" +
      (multiple ? "s" : "") +
      "</span>" +
      '<input type="file" id="' +
      id +
      '-input"' +
      (multiple ? " multiple" : "") +
      ' accept="' +
      accept.join(",") +
      '" tabindex="-1" aria-hidden="true">' +
      "</div>" +
      '<div class="file-list" id="' +
      id +
      '-list" aria-label="Selected files"></div>';

    var dz = $("#" + id + "-dz", mount);
    var input = $("#" + id + "-input", mount);
    var list = $("#" + id + "-list", mount);
    $(".dropzone__title", dz).textContent = options.title || "Drag & drop your file here";
    $(".dropzone__hint", dz).textContent =
      options.hint ||
      "Accepts " +
        (accept.length ? accept.join(", ").toUpperCase() : "files") +
        " · up to " +
        (options.maxSizeMB || 50) +
        " MB";

    function setStatus(message) {
      if (options.onStatus) options.onStatus(message);
      var live = $('[data-component="status"]');
      if (live) live.textContent = message;
    }

    function openPicker() {
      input.value = "";
      input.click();
    }

    dz.addEventListener("click", openPicker);
    dz.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " " || e.key === "Spacebar") {
        e.preventDefault();
        openPicker();
      }
    });
    input.addEventListener("change", function () {
      handleFiles(Array.prototype.slice.call(input.files || []));
      input.value = "";
    });

    /* Drag & drop with a depth counter so nested elements don't flicker */
    ["dragenter", "dragover"].forEach(function (type) {
      dz.addEventListener(type, function (e) {
        e.preventDefault();
        e.stopPropagation();
        if (type === "dragenter") dragDepth += 1;
        dz.classList.add("is-dragging");
      });
    });
    dz.addEventListener("dragleave", function (e) {
      e.preventDefault();
      dragDepth = Math.max(0, dragDepth - 1);
      if (dragDepth === 0) dz.classList.remove("is-dragging");
    });
    dz.addEventListener("drop", function (e) {
      e.preventDefault();
      e.stopPropagation();
      dragDepth = 0;
      dz.classList.remove("is-dragging");
      var files = Array.prototype.slice.call((e.dataTransfer && e.dataTransfer.files) || []);
      if (!files.length) {
        toast("Nothing dropped", "warning", "Drop a file — not a link or a folder.");
        return;
      }
      handleFiles(files);
    });

    function handleFiles(files) {
      var accepted = [];
      var rejected = [];
      files.forEach(function (file) {
        var problem = validateFile(file);
        if (problem) rejected.push(file.name + ": " + problem);
        else accepted.push(file);
      });

      if (rejected.length) {
        toast(rejected.length === 1 ? "File rejected" : rejected.length + " files rejected", "error", rejected[0]);
      }
      if (!accepted.length) {
        setStatus("No valid file added.");
        return;
      }
      if (!multiple && accepted.length > 1) {
        accepted = [accepted[accepted.length - 1]];
        toast("Only one file at a time", "warning", "We kept the last one you dropped.");
      }
      if (!multiple) entries = [];

      accepted.forEach(function (file) {
        entries.push({
          id: "f" + ++seq,
          file: file,
          name: file.name,
          size: file.size,
          type: file.type,
          thumb: null,
        });
      });

      buildThumbnails();
      render();
      setStatus(
        entries.length +
          (entries.length === 1 ? " file" : " files") +
          " ready. " +
          (options.readyMessage || "Adjust the options, then press the convert button.")
      );
      if (options.onFiles) options.onFiles(entries.slice());
    }

    function validateFile(file) {
      if (accept.length) {
        var ext = "." + extension(file.name);
        var mimeOk =
          file.type &&
          accept.some(function (a) {
            var normalized = a.replace(".", "");
            return file.type.indexOf(normalized) > -1 || normalized === ext.slice(1);
          });
        if (!mimeOk && accept.indexOf(ext) === -1) {
          return "unsupported type (" + (ext || "unknown") + "). Allowed: " + accept.join(", ").toUpperCase() + ".";
        }
      }
      if (file.size === 0) return "the file is empty.";
      if (file.size > maxBytes) return "too large (" + formatBytes(file.size) + ", max " + formatBytes(maxBytes) + ").";
      return null;
    }

    function buildThumbnails() {
      entries.forEach(function (entry) {
        var isImage = /^image\//.test(entry.file.type) || /\.(jpe?g|png|webp|gif|bmp)$/i.test(entry.name);
        if (isImage && !entry.thumb) {
          entry.thumb = createObjectURL(entry.file);
        }
      });
    }

    function render() {
      entries.forEach(function (entry) {
        if (entry.thumb) revokeObjectURL(entry.thumb);
        entry.thumb = null;
      });
      buildThumbnails();

      list.innerHTML = "";
      list.hidden = entries.length === 0;
      entries.forEach(function (entry, index) {
        var draggable = options.reorderable && entries.length > 1;
        var item = el("div", {
          class: "file-item",
          "data-id": entry.id,
          draggable: draggable ? "true" : null,
        });
        var media = entry.thumb
          ? '<img class="file-item__thumb" src="' + entry.thumb + '" alt="Preview of ' + escapeHtml(entry.name) + '" loading="lazy">'
          : '<span class="file-item__icon">' + FT.icons.file + "</span>";

        item.innerHTML =
          (options.reorderable && entries.length > 1
            ? '<span class="file-item__grip" title="Drag to reorder" aria-hidden="true">' + FT.icons.grip + "</span>"
            : "") +
          media +
          '<span class="file-item__meta"><span class="file-item__name"></span>' +
          '<span class="file-item__sub">' +
          formatBytes(entry.size) +
          " · " +
          (extension(entry.name).toUpperCase() || "FILE") +
          "</span></span>" +
          '<span class="file-item__actions">' +
          (options.reorderable && entries.length > 1
            ? '<button class="mini-btn" type="button" data-action="up" aria-label="Move ' +
              escapeHtml(entry.name) +
              ' earlier" ' +
              (index === 0 ? "disabled" : "") +
              ">" +
              FT.icons.up +
              "</button>" +
              '<button class="mini-btn" type="button" data-action="down" aria-label="Move ' +
              escapeHtml(entry.name) +
              ' later" ' +
              (index === entries.length - 1 ? "disabled" : "") +
              ">" +
              FT.icons.down +
              "</button>"
            : "") +
          (options.extraActions || [])
            .map(function (extra) {
              return (
                '<button class="mini-btn" type="button" data-action="' +
                extra.action +
                '" aria-label="' +
                extra.label +
                " " +
                escapeHtml(entry.name) +
                '">' +
                extra.icon +
                "</button>"
              );
            })
            .join("") +
          '<button class="mini-btn mini-btn--danger" type="button" data-action="remove" aria-label="Remove ' +
          escapeHtml(entry.name) +
          '">' +
          FT.icons.trash +
          "</button></span>";
        $(".file-item__name", item).textContent = entry.name;
        list.appendChild(item);
      });
      if (options.onRenderList) options.onRenderList(entries.slice(), list);
    }

    list.addEventListener("click", function (e) {
      var button = e.target.closest("[data-action]");
      if (!button) return;
      var item = button.closest(".file-item");
      var entryId = item.getAttribute("data-id");
      var index = entries.findIndex(function (entry) {
        return entry.id === entryId;
      });
      if (index < 0) return;
      var action = button.getAttribute("data-action");
      if (action === "remove") {
        removeAt(index);
      } else if (action === "up" && index > 0) {
        move(index, index - 1);
      } else if (action === "down" && index < entries.length - 1) {
        move(index, index + 1);
      } else if (options.onExtraAction) {
        options.onExtraAction(action, entries[index], index, api);
      }
    });

    /* Drag reorder inside the list */
    var dragId = null;
    list.addEventListener("dragstart", function (e) {
      var item = e.target.closest(".file-item");
      if (!item || !options.reorderable) return;
      dragId = item.getAttribute("data-id");
      item.classList.add("is-dragging");
      if (e.dataTransfer) {
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", dragId);
      }
    });
    list.addEventListener("dragover", function (e) {
      if (!options.reorderable || !dragId) return;
      e.preventDefault();
      var item = e.target.closest(".file-item");
      $$(".file-item", list).forEach(function (n) {
        n.classList.remove("is-over");
      });
      if (item) item.classList.add("is-over");
    });
    list.addEventListener("drop", function (e) {
      if (!options.reorderable || !dragId) return;
      e.preventDefault();
      var target = e.target.closest(".file-item");
      if (target) {
        var from = entries.findIndex(function (en) {
          return en.id === dragId;
        });
        var to = entries.findIndex(function (en) {
          return en.id === target.getAttribute("data-id");
        });
        if (from > -1 && to > -1 && from !== to) move(from, to);
      }
      dragId = null;
      $$(".file-item", list).forEach(function (n) {
        n.classList.remove("is-over", "is-dragging");
      });
    });
    list.addEventListener("dragend", function () {
      dragId = null;
      $$(".file-item", list).forEach(function (n) {
        n.classList.remove("is-over", "is-dragging");
      });
    });
    function move(from, to) {
      var item = entries.splice(from, 1)[0];
      entries.splice(to, 0, item);
      render();
      setStatus("Order updated: " + entries.map(function (e) { return e.name; }).join(", "));
      if (options.onReorder) options.onReorder(entries.slice());
    }

    function removeAt(index) {
      var entry = entries[index];
      if (!entry) return;
      if (entry.thumb) revokeObjectURL(entry.thumb);
      entries.splice(index, 1);
      render();
      setStatus("Removed " + entry.name + ".");
      if (options.onRemove) options.onRemove(entry, entries.slice());
      if (options.onFiles) options.onFiles(entries.slice());
    }

    function clear() {
      entries.forEach(function (entry) {
        if (entry.thumb) revokeObjectURL(entry.thumb);
      });
      entries = [];
      render();
      if (options.onFiles) options.onFiles([]);
      setStatus("Cleared. Drop a new file to start again.");
    }

    render();

    var api = {
      get entries() {
        return entries.slice();
      },
      get count() {
        return entries.length;
      },
      clear: clear,
      remove: function (entryId) {
        var index = entries.findIndex(function (entry) {
          return entry.id === entryId;
        });
        if (index > -1) removeAt(index);
      },
      openPicker: openPicker,
      setStatus: setStatus,
      refresh: render,
      element: dz,
    };
    return api;
  }

  /**
   * Keep a range input's fill + numeric label in sync.
   * @param {HTMLInputElement} input  the <input type="range">
   * @param {HTMLElement} output      element that shows the value
   * @param {Function} [format]       value -> label
   * @param {Function} [onChange]     called with the numeric value
   */
  function bindRange(input, output, format, onChange) {
    function sync() {
      var min = Number(input.min || 0);
      var max = Number(input.max || 100);
      var value = Number(input.value);
      var percent = max === min ? 0 : ((value - min) / (max - min)) * 100;
      input.style.setProperty("--range-fill", percent + "%");
      if (output) output.textContent = format ? format(value) : String(value);
      if (onChange) onChange(value);
    }
    input.addEventListener("input", sync);
    input.addEventListener("change", sync);
    sync();
    return sync;
  }

  /* =========================================================================
     11. Progress + busy state + result panel
     ========================================================================= */

  /** Wrap an element containing .progress__fill / .progress__label. */
  function createProgress(root) {
    var fill = $(".progress__fill", root);
    var label = $(".progress__label", root);
    var value = label ? $("[data-role='progress-value']", label) : null;
    var caption = label ? $("[data-role='progress-caption']", label) : null;

    return {
      show: function () {
        root.hidden = false;
      },
      hide: function () {
        root.hidden = true;
        if (fill) fill.classList.remove("is-indeterminate");
      },
      set: function (percent, text) {
        root.hidden = false;
        var pct = clamp(Math.round(percent), 0, 100);
        if (fill) {
          fill.classList.remove("is-indeterminate");
          fill.style.width = pct + "%";
          fill.setAttribute("aria-valuenow", String(pct));
          fill.setAttribute("aria-valuetext", text ? pct + "% — " + text : pct + "%");
        }
        if (value) value.textContent = pct + "%";
        if (caption && text) caption.textContent = text;
      },
      indeterminate: function (text) {
        root.hidden = false;
        if (fill) {
          fill.classList.add("is-indeterminate");
          fill.style.width = "40%";
        }
        if (value) value.textContent = "…";
        if (caption && text) caption.textContent = text;
      },
    };
  }

  function createLoader(root) {
    var text = $(".loader__text", root);
    return {
      show: function (message) {
        root.classList.add("is-visible");
        if (text && message) text.textContent = message;
      },
      hide: function () {
        root.classList.remove("is-visible");
      },
      set text(message) {
        if (text) text.textContent = message;
      },
    };
  }

  /** Enable/disable a list of controls while a task runs. */
  function setBusy(isBusy, controls) {
    (controls || []).forEach(function (control) {
      if (!control) return;
      if (isBusy) control.setAttribute("aria-disabled", "true");
      else control.removeAttribute("aria-disabled");
      if (control.tagName === "BUTTON" || control.tagName === "INPUT" || control.tagName === "SELECT") {
        control.disabled = isBusy;
      }
    });
  }

  /** Render the success state (checkmark + stats + action buttons). */
  function renderResult(container, config) {
    container.innerHTML =
      '<div class="result__check">' + FT.icons.check + "</div>" +
      '<h2 class="result__title"></h2>' +
      '<p class="result__text"></p>' +
      '<div class="stat-row"></div>' +
      '<div class="result__actions"></div>';

    $(".result__title", container).textContent = config.title || "Done!";
    $(".result__text", container).textContent = config.text || "";
    if (!config.text) $(".result__text", container).remove();

    var statRow = $(".stat-row", container);
    (config.stats || []).forEach(function (stat) {
      statRow.appendChild(
        el("div", { class: "stat" }, [
          el("span", {
            class: "stat__value" + (stat.kind ? " stat__value--" + stat.kind : ""),
            text: String(stat.value),
          }),
          el("span", { class: "stat__label", text: stat.label }),
        ])
      );
    });
    if (!(config.stats || []).length) statRow.remove();

    var actions = $(".result__actions", container);
    (config.actions || []).forEach(function (action) {
      var button = el("button", {
        class: "btn " + (action.variant || "btn--ghost"),
        type: "button",
      });
      button.innerHTML = (action.icon || "") + "<span></span>";
      $("span", button).textContent = action.label;
      button.addEventListener("click", action.onClick);
      actions.appendChild(button);
    });

    container.classList.add("is-visible");
    container.hidden = false;
    return container;
  }

  function hideResult(container) {
    container.classList.remove("is-visible");
    container.hidden = true;
    container.innerHTML = "";
  }

  /* =========================================================================
     12. Task runner — every tool wraps its work in this
     ========================================================================= */

  /**
   * runTask({ label, controls, progress, loader, status, work })
   * Keeps the UI in a consistent busy state and turns thrown errors into
   * friendly messages.
   */
  function runTask(config) {
    var controls = config.controls || [];
    var progress = config.progress || null;
    var loader = config.loader || null;
    var statusEl = config.status ? $(config.status) || config.status : $('[data-component="status"]');

    setBusy(true, controls);
    if (loader) loader.show(config.label || "Working…");
    if (progress) progress.indeterminate(config.label || "Working…");
    if (statusEl) statusEl.textContent = (config.label || "Working") + "…";

    return Promise.resolve()
      .then(function () {
        return config.work({
          progress: progress
            ? function (percent, text) {
                progress.set(percent, text);
              }
            : function () {},
          yield: yieldToBrowser,
        });
      })
      .then(function (result) {
        if (statusEl) statusEl.textContent = config.successMessage || "Finished.";
        return result;
      })
      .catch(function (error) {
        var message = friendlyError(error);
        if (statusEl) statusEl.textContent = message;
        toast(config.errorTitle || "Something went wrong", "error", message);
        if (typeof console !== "undefined" && console.warn) console.warn("[FileTools]", error);
        throw error;
      })
      .then(
        function (result) {
          cleanup();
          return result;
        },
        function (error) {
          cleanup();
          throw error;
        }
      );

    function cleanup() {
      setBusy(false, controls);
      if (loader) loader.hide();
    }
  }

  /** Translate library errors into something a person can act on. */
  function friendlyError(error) {
    var message = String((error && (error.message || error.name)) || error || "Unknown error");
    var lower = message.toLowerCase();
    if (lower.indexOf("password") > -1 || lower.indexOf("encrypted") > -1) {
      return "That file is password-protected or encrypted. Remove the protection and try again.";
    }
    if (lower.indexOf("not a valid pdf") > -1 || lower.indexOf("invalid pdf") > -1 || lower.indexOf("no pdf") > -1) {
      return "That does not look like a valid PDF. It may be corrupt or renamed.";
    }
    if (lower.indexOf("corrupt") > -1 || lower.indexOf("end of file") > -1 || lower.indexOf("unexpected end") > -1) {
      return "The file appears to be damaged or incomplete. Try exporting it again.";
    }
    if (lower.indexOf("network") > -1 || lower.indexOf("failed to fetch") > -1) {
      return "A conversion library could not be loaded. Check your connection and refresh the page.";
    }
    if (lower.indexOf("quota") > -1 || lower.indexOf("memory") > -1) {
      return "Your browser ran out of memory for that file. Try a smaller file or fewer pages.";
    }
    return message.length > 190 ? message.slice(0, 187) + "…" : message;
  }

  /** Throw early if a required CDN library did not load. */
  function requireLib(name) {
    if (!global[name]) {
      throw new Error(
        "The " + name + " library did not load. Check your internet connection and reload the page."
      );
    }
    return global[name];
  }

  /* =========================================================================
     13. Range parsing ("1-3, 5, 7-9")
     ========================================================================= */

  /**
   * Parse a page-range string into a sorted, de-duplicated list of 1-based
   * page numbers. Throws on malformed input or pages outside [1, total].
   */
  function parsePageRanges(input, totalPages) {
    var text = String(input || "").trim();
    if (!text) throw new Error("Enter at least one page number, for example 1-3, 5.");
    var pages = [];
    var parts = text.split(/[,;]+/);
    parts.forEach(function (rawPart) {
      var part = rawPart.trim();
      if (!part) return;
      var match = part.match(/^(\d+)\s*-\s*(\d+)$/);
      if (match) {
        var start = parseInt(match[1], 10);
        var end = parseInt(match[2], 10);
        if (start > end) {
          var tmp = start;
          start = end;
          end = tmp;
        }
        for (var p = start; p <= end; p++) pages.push(p);
        return;
      }
      var single = part.match(/^(\d+)$/);
      if (!single) throw new Error("“" + part + "” is not a valid page or range. Use 1-3, 5, 7-9.");
      pages.push(parseInt(single[1], 10));
    });

    if (!pages.length) throw new Error("No pages found in “" + text + "”.");
    var seen = {};
    var unique = [];
    pages.forEach(function (p) {
      if (p < 1 || p > totalPages) throw new Error("Page " + p + " is out of range (this file has " + totalPages + " pages).");
      if (!seen[p]) {
        seen[p] = true;
        unique.push(p);
      }
    });
    return unique;
  }

  /* =========================================================================
     14. Page bootstrapping
     ========================================================================= */

  /**
   * initPage({ slug }) — call once per page.
   * With a slug it also wires the tool page chrome (breadcrumb, icon, related).
   */
  function initPage(config) {
    var options = config || {};
    initTheme();
    renderHeader(options.slug);
    renderFooter();

    var tool = options.slug ? R.bySlug(options.slug) : null;
    if (tool) {
      renderBreadcrumb(tool);
      renderToolIcon(tool);
      renderRelated(tool);
    } else {
      renderRelated(null);
    }

    initAccordions(document);
    buildFaqSchema();
    observeReveals(document);

    /* Home page search term handed over from the header search box */
    if (!options.slug) {
      try {
        var query = global.sessionStorage.getItem("filetools-query");
        if (query) {
          global.sessionStorage.removeItem("filetools-query");
          var event = new CustomEvent("filetools:search", { detail: query });
          document.dispatchEvent(event);
        }
      } catch (e) {
        /* sessionStorage unavailable */
      }
    }

    return tool;
  }

  /* =========================================================================
     Public API
     ========================================================================= */
  FT.registry = R;
  FT.escapeHtml = escapeHtml;
  FT.formatBytes = formatBytes;
  FT.debounce = debounce;
  FT.clamp = clamp;
  FT.yield = yieldToBrowser;
  FT.sleep = sleep;
  FT.$ = $;
  FT.$$ = $$;
  FT.el = el;
  FT.safeFileName = safeFileName;
  FT.baseName = baseName;
  FT.extension = extension;
  FT.createObjectURL = createObjectURL;
  FT.revokeObjectURL = revokeObjectURL;
  FT.downloadBlob = downloadBlob;
  FT.downloadDataUrl = downloadDataUrl;
  FT.readFileAsArrayBuffer = readFileAsArrayBuffer;
  FT.readFileAsText = readFileAsText;
  FT.loadImage = loadImage;
  FT.rotateCanvas = rotateCanvas;
  FT.drawImageToCanvas = drawImageToCanvas;
  FT.mimeExtension = mimeExtension;
  FT.canvasToBlob = canvasToBlob;
  FT.supportsMime = supportsMime;
  FT.toast = toast;
  FT.initTheme = initTheme;
  FT.applyTheme = applyTheme;
  FT.toggleTheme = toggleTheme;
  FT.systemTheme = systemTheme;
  FT.renderHeader = renderHeader;
  FT.renderFooter = renderFooter;
  FT.renderBreadcrumb = renderBreadcrumb;
  FT.renderRelated = renderRelated;
  FT.initAccordions = initAccordions;
  FT.buildFaqSchema = buildFaqSchema;
  FT.observeReveals = observeReveals;
  FT.createUploader = createUploader;
  FT.bindRange = bindRange;
  FT.createProgress = createProgress;
  FT.createLoader = createLoader;
  FT.setBusy = setBusy;
  FT.renderResult = renderResult;
  FT.hideResult = hideResult;
  FT.runTask = runTask;
  FT.friendlyError = friendlyError;
  FT.requireLib = requireLib;
  FT.parsePageRanges = parsePageRanges;
  FT.searchTools = searchTools;
  FT.initPage = initPage;

  global.FT = FT;

  /* Theme is applied immediately so the first paint already has the right
     colours (initPage() re-applies it once the header buttons exist). */
  initTheme();
})(window);
