/* ==========================================================================
   tools.js — THE single source of truth for every tool on the site.
   Add a new tool by appending one object to TOOLS (and creating its page +
   /js/<slug>.js script). The home page cards, the header search, the category
   dropdown, breadcrumbs and the "related tools" grids all read from here.
   Loads before common.js on every page (plain script, no modules, so the site
   also works when opened straight from the file system).
   ========================================================================== */
(function (global) {
  "use strict";

  /* ---- Site configuration ---------------------------------------------- */
  var SITE = {
    name: "FileTools",
    /* Base URL used for canonical links + sitemap.xml. Change this to your own
       domain before deploying (Netlify / Vercel / GitHub Pages). */
    url: "https://filetools.app",
    tagline: "Free private file tools that run 100% in your browser",
    repo: "https://github.com/",
  };

  /* ---- Categories ------------------------------------------------------- */
  var CATEGORIES = [
    {
      id: "pdf",
      label: "PDF Tools",
      blurb: "Convert, merge, split and preview PDF documents.",
      icon:
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/><path d="M9.5 15.5h5"/><path d="M9.5 18h3"/></svg>',
    },
    {
      id: "image",
      label: "Image Tools",
      blurb: "Compress, resize and convert images without quality guesswork.",
      icon:
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.6"/><path d="m21 15-5-5L5 21"/></svg>',
    },
    {
      id: "utility",
      label: "Utility Tools",
      blurb: "Everyday helpers: text to PDF, QR codes and word counting.",
      icon:
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v3M12 18v3M3 12h3M18 12h3"/><rect x="7" y="7" width="10" height="10" rx="2.5"/></svg>',
    },
  ];

  /* ---- Icons (inline SVG, no icon library) ------------------------------ */
  var ICONS = {
    docToPdf:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/><path d="M12 11v6"/><path d="m9.5 14.5 2.5 2.5 2.5-2.5"/></svg>',
    sheetToPdf:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="2.5"/><path d="M3 10h18"/><path d="M9 10v10"/><path d="M15 10v10"/></svg>',
    imageToPdf:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="14" height="14" rx="2.5"/><circle cx="7.8" cy="9.8" r="1.4"/><path d="m17 15-3.5-3.5L6 19"/><path d="M19 5h2v14"/></svg>',
    pdfToImage:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 3h7l4 4v6"/><path d="M6 3a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h4"/><rect x="10" y="13" width="11" height="8" rx="2"/><circle cx="13.2" cy="16" r="1"/></svg>',
    merge:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 4v4a4 4 0 0 0 4 4h6"/><path d="M7 20v-4a4 4 0 0 1 4-4h6"/><path d="m14 9 3 3-3 3"/></svg>',
    split:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v6"/><path d="M12 9 6.5 19"/><path d="M12 9l5.5 10"/><circle cx="5" cy="20.5" r="1.6"/><circle cx="19" cy="20.5" r="1.6"/></svg>',
    compress:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 14h6v6"/><path d="m10 14-6 6"/><path d="M20 10h-6V4"/><path d="m14 10 6-6"/></svg>',
    convert:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 8h13"/><path d="m14 5 3 3-3 3"/><path d="M20 16H7"/><path d="m10 13-3 3 3 3"/></svg>',
    textToPdf:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/><path d="M9 13h6"/><path d="M9 16.5h4"/></svg>',
    qr:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><path d="M14 14h3v3h-3z"/><path d="M20 14v.01M14 20v.01M20 20v.01M17.5 20.5v.01"/></svg>',
    counter:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9h16"/><path d="M4 15h16"/><path d="m10 3-2 18"/><path d="m16 3-2 18"/></svg>',
  };

  /* ---- The tool registry ------------------------------------------------ */
  var TOOLS = [
    {
      slug: "docx-to-pdf",
      name: "DOCX to PDF",
      tagline: "Turn Word documents into print-ready PDFs — headings, tables, lists and images included.",
      category: "pdf",
      icon: ICONS.docToPdf,
      keywords: ["word", "docx", "doc", "pdf", "convert", "mammoth"],
      accept: [".docx"],
      maxFileMB: 50,
      multiple: false,
      featured: true,
      order: 1,
    },
    {
      slug: "excel-to-pdf",
      name: "Excel to PDF",
      tagline: "Export XLSX, XLS or CSV spreadsheets to PDF with clean tables and repeating headers.",
      category: "pdf",
      icon: ICONS.sheetToPdf,
      keywords: ["excel", "xlsx", "xls", "csv", "spreadsheet", "pdf", "sheet"],
      accept: [".xlsx", ".xls", ".csv"],
      maxFileMB: 50,
      multiple: false,
      featured: true,
      order: 2,
    },
    {
      slug: "image-to-pdf",
      name: "Image to PDF",
      tagline: "Combine JPG, PNG and WEBP images into one PDF. Reorder, rotate and pick your page fit.",
      category: "pdf",
      icon: ICONS.imageToPdf,
      keywords: ["image", "jpg", "jpeg", "png", "webp", "photo", "pdf", "combine"],
      accept: [".jpg", ".jpeg", ".png", ".webp"],
      maxFileMB: 50,
      multiple: true,
      featured: true,
      order: 3,
    },
    {
      slug: "pdf-to-image",
      name: "PDF to Image",
      tagline: "Export every PDF page as a crisp PNG or JPG, individually or bundled in a ZIP.",
      category: "pdf",
      icon: ICONS.pdfToImage,
      keywords: ["pdf", "png", "jpg", "jpeg", "image", "screenshot", "render"],
      accept: [".pdf"],
      maxFileMB: 100,
      multiple: false,
      order: 4,
    },
    {
      slug: "merge-pdf",
      name: "Merge PDF",
      tagline: "Join any number of PDFs into a single file. Drag to set the exact page order.",
      category: "pdf",
      icon: ICONS.merge,
      keywords: ["merge", "combine", "pdf", "join", "concatenate"],
      accept: [".pdf"],
      maxFileMB: 100,
      multiple: true,
      featured: true,
      order: 5,
    },
    {
      slug: "split-pdf",
      name: "Split PDF",
      tagline: "Extract page ranges, pull out single pages, or split every page into its own PDF.",
      category: "pdf",
      icon: ICONS.split,
      keywords: ["split", "extract", "pdf", "pages", "range", "separate"],
      accept: [".pdf"],
      maxFileMB: 100,
      multiple: false,
      order: 6,
    },
    {
      slug: "compress-image",
      name: "Compress Image",
      tagline: "Shrink JPG, PNG and WEBP files with a quality slider and see the exact % saved.",
      category: "image",
      icon: ICONS.compress,
      keywords: ["compress", "reduce", "image", "jpg", "png", "webp", "optimise", "optimize", "size"],
      accept: [".jpg", ".jpeg", ".png", ".webp"],
      maxFileMB: 50,
      multiple: true,
      featured: true,
      order: 7,
    },
    {
      slug: "image-converter",
      name: "Image Converter",
      tagline: "Bulk convert between JPG, PNG and WEBP with full control over output quality.",
      category: "image",
      icon: ICONS.convert,
      keywords: ["convert", "jpg", "png", "webp", "image", "batch", "format"],
      accept: [".jpg", ".jpeg", ".png", ".webp", ".gif", ".bmp"],
      maxFileMB: 50,
      multiple: true,
      order: 8,
    },
    {
      slug: "text-to-pdf",
      name: "Text to PDF",
      tagline: "Type or paste plain text and export a neatly paginated PDF with page numbers.",
      category: "utility",
      icon: ICONS.textToPdf,
      keywords: ["text", "txt", "pdf", "notes", "typewriter", "document"],
      accept: [".txt", ".md"],
      maxFileMB: 10,
      multiple: false,
      order: 9,
    },
    {
      slug: "qr-generator",
      name: "QR Code Generator",
      tagline: "Create custom-coloured QR codes for links, Wi-Fi or text and download as PNG or SVG.",
      category: "utility",
      icon: ICONS.qr,
      keywords: ["qr", "qrcode", "barcode", "link", "url", "generator", "svg", "png"],
      accept: [],
      maxFileMB: 0,
      multiple: false,
      order: 10,
    },
    {
      slug: "word-counter",
      name: "Word Counter",
      tagline: "Live word, character, sentence and paragraph counts plus reading time.",
      category: "utility",
      icon: ICONS.counter,
      keywords: ["word", "counter", "characters", "sentences", "reading time", "essay", "seo"],
      accept: [".txt", ".md"],
      maxFileMB: 10,
      multiple: false,
      order: 11,
    },
  ];

  /* ---- Helpers ---------------------------------------------------------- */
  function bySlug(slug) {
    for (var i = 0; i < TOOLS.length; i++) {
      if (TOOLS[i].slug === slug) return TOOLS[i];
    }
    return null;
  }

  function byCategory(categoryId) {
    if (!categoryId || categoryId === "all") return TOOLS.slice();
    return TOOLS.filter(function (t) {
      return t.category === categoryId;
    });
  }

  function category(id) {
    for (var i = 0; i < CATEGORIES.length; i++) {
      if (CATEGORIES[i].id === id) return CATEGORIES[i];
    }
    return null;
  }

  function categoryIcon(id) {
    var c = category(id);
    return c ? c.icon : "";
  }

  /** Absolute path to a tool page. `depth` = how many folders deep we are. */
  function toolHref(slug, depth) {
    return (depth === 2 ? "../tools/" : "tools/") + slug + ".html";
  }

  /** Absolute path to a site page (index, about, …). */
  function pageHref(name, depth) {
    var prefix = depth === 2 ? "../" : "";
    return prefix + name;
  }

  global.FileToolsRegistry = {
    SITE: SITE,
    CATEGORIES: CATEGORIES,
    TOOLS: TOOLS,
    ICONS: ICONS,
    bySlug: bySlug,
    byCategory: byCategory,
    category: category,
    categoryIcon: categoryIcon,
    toolHref: toolHref,
    pageHref: pageHref,
  };
})(window);
