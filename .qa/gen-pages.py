#!/usr/bin/env python3
"""Static site generator for the tool pages (QA/build helper — the emitted HTML
files are the real source of truth afterwards).

Every page shares one shell; per-tool content lives in the TOOLS dict below.
Run:  python3 .qa/gen-pages.py
"""
import json
import os

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
BASE_URL = "https://filetools.app"

SHIELD = ('<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" '
          'stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'
          '<path d="M12 3l7 3v6c0 4.4-3 8-7 9-4-1-7-4.6-7-9V6z"/><path d="m9 12 2 2 4-4"/></svg>')
SETTINGS_ICON = ('<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.85" '
                 'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3"/>'
                 '<path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-2.9 1.2v.2a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.6 1.7 1.7 0 0 0-1.9.4l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0-1.2-2.9H3a2 2 0 1 1 0-4h.1A1.7 1.7 0 0 0 4.7 9a1.7 1.7 0 0 0-.4-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 2.9 1.1l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z"/></svg>')
EYE_ICON = ('<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.85" '
            'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z"/>'
            '<circle cx="12" cy="12" r="3"/></svg>')

CDN = {
    "mammoth": ("mammoth.js", "https://cdn.jsdelivr.net/npm/mammoth@1.13.0/mammoth.browser.min.js"),
    "html2pdf": ("html2pdf.js", "https://cdn.jsdelivr.net/npm/html2pdf.js@0.14.0/dist/html2pdf.bundle.min.js"),
    "xlsx": ("SheetJS", "https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js"),
    "jspdf": ("jsPDF", "https://cdn.jsdelivr.net/npm/jspdf@3.0.4/dist/jspdf.umd.min.js"),
    "autotable": ("jsPDF-AutoTable", "https://cdn.jsdelivr.net/npm/jspdf-autotable@5.0.8/dist/jspdf.plugin.autotable.min.js"),
    "pdfjs": ("pdf.js", "https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/legacy/build/pdf.min.js"),
    "pdfjsworker": ("pdf.js worker", "https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/legacy/build/pdf.worker.min.js"),
    "pdflib": ("pdf-lib", "https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/dist/pdf-lib.min.js"),
    "jszip": ("JSZip", "https://cdn.jsdelivr.net/npm/jszip@3.10.2/dist/jszip.min.js"),
    "qrcode": ("qrcode-generator", "https://cdn.jsdelivr.net/npm/qrcode-generator@2.0.4/dist/qrcode.js"),
}

SHELL = """<!doctype html>
<html lang="en" data-theme="light">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>%(title)s</title>
    <meta name="description" content="%(desc)s">
    <link rel="canonical" href="%(url)s">
    <meta name="theme-color" content="#f5f6fb">
    <meta name="color-scheme" content="light dark">
    <meta name="keywords" content="%(keywords)s">
    <meta name="robots" content="index, follow">
    <meta name="author" content="FileTools">

    <meta property="og:type" content="website">
    <meta property="og:site_name" content="FileTools">
    <meta property="og:title" content="%(title)s">
    <meta property="og:description" content="%(desc)s">
    <meta property="og:url" content="%(url)s">
    <meta property="og:image" content="%(base)s/favicon.svg">
    <meta name="twitter:card" content="summary">
    <meta name="twitter:title" content="%(title)s">
    <meta name="twitter:description" content="%(desc)s">
    <meta name="twitter:image" content="%(base)s/favicon.svg">

    <link rel="icon" type="image/svg+xml" href="../favicon.svg">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link
      href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
      rel="stylesheet"
    >
    <link rel="stylesheet" href="../css/style.css">

    <script type="application/ld+json">
%(jsonld)s
    </script>
  </head>
  <body>
    <header class="site-header" data-component="site-header"></header>

    <main id="main">
      <div class="container"><div data-component="breadcrumb"></div></div>

      <section class="container" aria-labelledby="page-title">
        <div class="tool-head page-enter">
          <span class="tool-head__icon" data-component="tool-icon" aria-hidden="true"></span>
          <h1 id="page-title">%(h1)s</h1>
          <p class="lead">%(lead)s</p>
          <div class="row">
            <span class="privacy-pill">%(shield)s Your files never leave your device</span>
            <span class="tag">Free &amp; unlimited</span>
            <span class="tag">No sign-up</span>
          </div>
        </div>
      </section>

      <section class="section section--tight" aria-label="%(h1)s tool">
        <div class="container">
%(workspace)s
        </div>
      </section>

      <section class="section section--tight" id="how-to-use" aria-labelledby="howto-heading">
        <div class="container">
          <div class="section-head reveal">
            <h2 id="howto-heading">How to use %(h1)s</h2>
            <p>%(howto_lead)s</p>
          </div>
          <ol class="steps">
%(howto)s
          </ol>
        </div>
      </section>

      <section class="section section--tight faq-section" id="faq" aria-labelledby="faq-heading" data-component="faq">
        <div class="container">
          <div class="section-head reveal">
            <h2 id="faq-heading">%(h1)s — FAQ</h2>
          </div>
          <div class="accordion reveal">
%(faq)s
          </div>
        </div>
      </section>

      <section class="section section--tight related-section" aria-labelledby="related-heading">
        <div class="container">
          <div class="section-head reveal">
            <h2 id="related-heading">Related tools</h2>
            <p>More private, in-browser utilities from the same toolbox.</p>
          </div>
          <div class="related" data-component="related-tools"></div>
        </div>
      </section>
    </main>

    <footer class="site-footer" data-component="site-footer"></footer>
%(cdn)s
    <script src="../js/tools.js" defer></script>
    <script src="../js/common.js" defer></script>
    <script src="../js/%(script)s" defer></script>
  </body>
</html>
"""

STATUS_BLOCK = """            <p class="field__help" data-component="status" role="status" aria-live="polite"></p>
            <div class="progress" id="progress" hidden>
              <div class="progress__bar">
                <div class="progress__fill" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" aria-label="Conversion progress"></div>
              </div>
              <div class="progress__label">
                <span data-role="progress-caption">Preparing…</span>
                <span data-role="progress-value">0%</span>
              </div>
            </div>
            <div class="loader" id="loader" aria-hidden="true">
              <div class="loader__ring"></div>
              <p class="loader__text">Working…</p>
            </div>
            <div class="result" id="result" hidden></div>"""


def panel(title, icon, body):
    return (
        '          <div class="panel">\n'
        '            <div class="panel__head">%s<h2>%s</h2></div>\n'
        '            <div class="panel__body">\n%s\n            </div>\n'
        '          </div>' % (icon, title, body)
    )


def dropzone():
    return '              <div data-component="dropzone"></div>'


def actions(primary_label, primary_icon, extra="", disabled=True):
    return (
        '              <div class="row">\n'
        '                <button class="btn btn--primary" id="primary-action" type="button"%s>%s<span>%s</span></button>\n'
        '                <button class="btn btn--ghost" id="clear-action" type="button">Clear</button>%s\n'
        '              </div>' % (" disabled" if disabled else "", primary_icon, primary_label, extra)
    )


def field(label, control_id, control, help_text=""):
    h = '\n                <span class="field__help">%s</span>' % help_text if help_text else ""
    return (
        '              <div class="field">\n'
        '                <label for="%s">%s</label>\n'
        '                %s%s\n'
        '              </div>' % (control_id, label, control, h)
    )


def options_grid(inner):
    return '              <div class="options-grid">\n%s\n              </div>' % inner


def segmented(label, name, items):
    rows = []
    for value, text, checked in items:
        rows.append(
            '                  <input type="radio" id="%s-%s" name="%s" value="%s"%s><label for="%s-%s">%s</label>'
            % (name, value, name, value, " checked" if checked else "", name, value, text)
        )
    return (
        '              <div class="field">\n'
        '                <span class="field__label" id="%s-label">%s</span>\n'
        '                <div class="segmented" role="radiogroup" aria-labelledby="%s-label">\n%s\n                </div>\n'
        '              </div>' % (name, label, name, "\n".join(rows))
    )


def switch(control_id, label, checked=False):
    return (
        '              <label class="switch"><input type="checkbox" id="%s"%s>'
        '<span class="switch__track"></span><span>%s</span></label>' % (control_id, " checked" if checked else "", label)
    )


def range(control_id, label, min_v, max_v, value, step, help_text=""):
    h = '\n                <span class="field__help">%s</span>' % help_text if help_text else ""
    return (
        '              <div class="field range">\n'
        '                <div class="range__top"><label for="%s">%s</label>'
        '<span class="range__value" id="%s-value"></span></div>\n'
        '                <input type="range" id="%s" min="%s" max="%s" value="%s" step="%s" '
        'aria-describedby="%s-value">%s\n'
        '              </div>' % (control_id, label, control_id, control_id, min_v, max_v, value, step, control_id, h)
    )


def steps(items):
    out = []
    for i, (title, body) in enumerate(items, 1):
        out.append(
            '            <li class="step reveal">\n'
            '              <div class="step__num">%d</div>\n'
            '              <h3>%s</h3>\n'
            '              <p>%s</p>\n'
            '            </li>' % (i, title, body)
        )
    return "\n".join(out)


def faq(items):
    out = []
    chevron = ('<svg class="accordion__chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" '
               'stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>')
    for i, (q, a) in enumerate(items):
        out.append(
            '            <div class="accordion__item">\n'
            '              <h3>\n'
            '                <button class="accordion__trigger" type="button" aria-expanded="false">\n'
            '                  <span>%s</span>\n'
            '                  %s\n'
            '                </button>\n'
            '              </h3>\n'
            '              <div class="accordion__panel"><div><p>%s</p></div></div>\n'
            '            </div>' % (q, chevron, a)
        )
    return "\n".join(out)


def jsonld(name, slug, desc, category, features):
    return "    " + json.dumps(
        {
            "@context": "https://schema.org",
            "@type": "WebApplication",
            "name": name,
            "url": "%s/tools/%s.html" % (BASE_URL, slug),
            "applicationCategory": "UtilitiesApplication",
            "applicationSubCategory": category,
            "operatingSystem": "Any (browser based)",
            "browserRequirements": "Requires JavaScript. All conversion runs locally in the browser.",
            "description": desc,
            "offers": {"@type": "Offer", "price": "0", "priceCurrency": "USD"},
            "featureList": features,
        },
        indent=2,
    ).replace("\n", "\n    ")


PAGE_SIZE_SELECT = (
    '<select class="control" id="page-size">\n'
    '                  <option value="a4" selected>A4 · 210 × 297 mm</option>\n'
    '                  <option value="letter">Letter · 8.5 × 11 in</option>\n'
    '                  <option value="legal">Legal · 8.5 × 14 in</option>\n'
    '                </select>'
)

MARGIN_SELECT = (
    '<select class="control" id="margin">\n'
    '                  <option value="normal" selected>Normal · 12 mm</option>\n'
    '                  <option value="wide">Wide · 25 mm</option>\n'
    '                  <option value="none">None · 0 mm</option>\n'
    '                </select>'
)

UPLOAD_ICON = ('<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" '
               'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 4v11"/>'
               '<path d="m7.5 10.5 4.5 4.5 4.5-4.5"/><path d="M4 18v1.5A1.5 1.5 0 0 0 5.5 21h13a1.5 1.5 0 0 0 1.5-1.5V18"/></svg>')
PLAY_ICON = ('<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" '
             'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M13 2 4.5 13.5H11l-1 8.5 9-12h-6.5z"/></svg>')

TOOLS = {}

# --------------------------------------------------------------------------
# 1. DOCX to PDF
# --------------------------------------------------------------------------
TOOLS["docx-to-pdf"] = dict(
    title="DOCX to PDF — Convert Word documents to PDF free, no upload",
    desc="Convert .docx Word files to PDF in your browser. Keep headings, bold, lists, tables and images, choose A4/Letter/Legal, orientation and margins, preview before you download.",
    keywords="docx to pdf, word to pdf, convert docx, docx converter, free pdf converter, no upload",
    h1="DOCX to PDF",
    lead="Drop a Word document in and get a print-ready PDF back. The conversion runs entirely on your device with a live preview, so confidential documents never touch a server.",
    howto_lead="Three steps from .docx to a paginated PDF.",
    libs=["mammoth", "html2pdf"],
    script="docx-to-pdf.js",
    category="PDF Tools",
    features=[
        "Convert .docx to PDF client-side with mammoth.js",
        "A4, Letter and Legal page sizes with portrait or landscape orientation",
        "None, normal or wide margins and optional page numbers",
        "Live preview of the converted document before downloading",
    ],
    workspace="""          <div class="workspace workspace--split">
%s
%s
          </div>""" % (
        panel(
            "1 · Document &amp; page setup",
            SETTINGS_ICON,
            "\n".join([
                dropzone(),
                options_grid("\n".join([
                    field("Page size", "page-size", PAGE_SIZE_SELECT),
                    segmented("Orientation", "orientation", [("portrait", "Portrait", True), ("landscape", "Landscape", False)]),
                    field("Margins", "margin", MARGIN_SELECT),
                ])),
                switch("page-numbers", "Add page numbers in the footer"),
                actions("Convert to PDF", UPLOAD_ICON),
                STATUS_BLOCK,
            ]),
        ),
        panel(
            "2 · Live preview",
            EYE_ICON,
            """              <div class="preview" id="preview">
                <div class="preview__head"><span>Rendered document</span></div>
                <div class="preview__body preview__body--paper" id="preview-body">
                  <p class="muted center">Your converted document appears here before you download it.</p>
                </div>
              </div>""",
        ),
    ),
    howto=steps([
        ("Upload your .docx", "Drag the file onto the drop zone or press “Choose files”. Files up to 50 MB are accepted and validated before anything else happens."),
        ("Check the preview", "The document is converted to HTML instantly and rendered at the page size you picked, so you can confirm headings, tables and images look right."),
        ("Download the PDF", "Press “Convert to PDF”. The PDF is generated in your browser and saved to your downloads folder — nothing is uploaded."),
    ]),
    faq=faq([
        ("Will my formatting survive the conversion?",
         "Headings, bold and italic runs, bullet and numbered lists, hyperlinks, tables and inline images are all preserved. Exact pagination, headers/footers and complex text boxes can shift slightly because browsers do not use Word's layout engine."),
        ("Can I convert the older .doc format?",
         "Not directly. The .doc binary format predates the open ZIP-based .docx standard. Open the file in Word, Google Docs or LibreOffice, save it as .docx, then convert it here."),
        ("What about password-protected documents?",
         "Protected files cannot be read by the browser, so the tool will tell you to remove the protection first. Because nothing is uploaded, you stay in control of the password."),
        ("Does it work on a phone?",
         "Yes. Pick the file from your phone's storage, review the preview and download the PDF. The whole flow is touch-friendly from 320 px upwards."),
    ]),
)

# --------------------------------------------------------------------------
# 2. Excel to PDF
# --------------------------------------------------------------------------
TOOLS["excel-to-pdf"] = dict(
    title="Excel to PDF — Export XLSX, XLS &amp; CSV spreadsheets as PDF tables",
    desc="Convert Excel and CSV files to PDF in your browser. Pick one sheet or all of them, landscape or portrait, font size, gridlines and header styling — with a table preview first.",
    keywords="excel to pdf, xlsx to pdf, csv to pdf, spreadsheet to pdf, convert xls, table pdf",
    h1="Excel to PDF",
    lead="Turn a spreadsheet into a clean, paginated PDF table. Choose which sheets to export, let wide tables shrink to fit or split across pages, and preview the result before you save it.",
    howto_lead="From workbook to paginated PDF in four steps.",
    libs=["xlsx", "jspdf", "autotable"],
    script="excel-to-pdf.js",
    category="PDF Tools",
    features=[
        "Reads .xlsx, .xls and .csv with SheetJS",
        "Export a single sheet or every sheet in the workbook",
        "Auto-scaling for wide tables with repeating header rows",
        "Landscape or portrait, adjustable font size and gridline styling",
    ],
    workspace="""          <div class="workspace workspace--split">
%s
%s
          </div>""" % (
        panel(
            "1 · Spreadsheet",
            SETTINGS_ICON,
            "\n".join([
                dropzone(),
                '              <div class="field" id="sheet-field" hidden>\n                <span class="field__label">Sheets</span>\n                <div class="sheet-tabs" id="sheet-tabs" role="group" aria-label="Choose sheets to export"></div>\n              </div>',
                options_grid("\n".join([
                    segmented("Orientation", "orientation", [("landscape", "Landscape", True), ("portrait", "Portrait", False)]),
                    field("Page size", "page-size", PAGE_SIZE_SELECT),
                    field("Header style", "header-style",
                          '<select class="control" id="header-style">\n'
                          '                  <option value="filled" selected>Filled (brand colour)</option>\n'
                          '                  <option value="outline">Outline only</option>\n'
                          '                  <option value="plain">Plain text</option>\n'
                          '                </select>'),
                ])),
                range("font-size", "Font size", 6, 16, 10, 1),
                switch("gridlines", "Draw gridlines between cells", True),
                switch("fit-width", "Shrink wide tables to fit the page width", True),
                actions("Export PDF", UPLOAD_ICON),
                STATUS_BLOCK,
            ]),
        ),
        panel(
            "2 · Table preview",
            EYE_ICON,
            """              <div class="preview" id="preview">
                <div class="preview__head"><span id="preview-caption">Spreadsheet preview</span></div>
                <div class="preview__body" id="preview-body">
                  <p class="muted center">Upload a spreadsheet to see the first rows here.</p>
                </div>
              </div>""",
        ),
    ),
    howto=steps([
        ("Upload the workbook", "Add an .xlsx, .xls or .csv file. It is parsed locally with SheetJS, so even private financial data stays on your machine."),
        ("Pick your sheets", "Every sheet appears as a chip. Choose one, or switch to “All sheets” to export the whole workbook into a single PDF."),
        ("Tune the table", "Set orientation (landscape suits wide tables), font size, gridlines and header styling. The preview updates as you go."),
        ("Export the PDF", "Press “Export PDF”. Wide tables shrink to fit or continue on the next page, and header rows repeat automatically."),
    ]),
    faq=faq([
        ("Will formulas be converted?",
         "You get the calculated values that are stored in the file, not the formula text. That is the same result you would see when printing the sheet."),
        ("How are very wide tables handled?",
         "With “Shrink to fit” on, the font is reduced until the columns fit the printable width. If a table is still too wide it is split into column groups, each starting on a new page with a heading that tells you which columns you are looking at."),
        ("Can I export several sheets at once?",
         "Yes — switch the sheet selector to “All sheets”. Each sheet starts on a new page and is labelled with its name."),
        ("Are charts and images included?",
         "Cell data is exported as a table. Embedded charts, pivot visuals and floating images are not part of the cell grid, so they are not rendered."),
    ]),
)

# --------------------------------------------------------------------------
# 3. Image to PDF
# --------------------------------------------------------------------------
TOOLS["image-to-pdf"] = dict(
    title="Image to PDF — Combine JPG, PNG &amp; WEBP into one PDF free",
    desc="Merge multiple images into a single PDF in your browser. Drag to reorder, rotate, choose page size, orientation, margins and fit mode — no upload, no watermarks.",
    keywords="image to pdf, jpg to pdf, png to pdf, webp to pdf, photos to pdf, combine images",
    h1="Image to PDF",
    lead="Turn a set of photos or scans into one tidy PDF. Reorder the pages by dragging, rotate anything that is sideways, and choose exactly how each image sits on the page.",
    howto_lead="Build a multi-page PDF from any images.",
    libs=["jspdf"],
    script="image-to-pdf.js",
    category="PDF Tools",
    features=[
        "Unlimited JPG, PNG and WEBP images per PDF",
        "Drag-and-drop reordering plus 90° rotation and removal",
        "Fit, fill or original sizing with adjustable margins",
        "A4, Letter or Legal pages in portrait or landscape",
    ],
    workspace="""          <div class="workspace workspace--split">
%s
%s
          </div>""" % (
        panel(
            "1 · Images",
            SETTINGS_ICON,
            "\n".join([
                dropzone(),
                '              <p class="field__help" id="order-help">Drag a file to reorder the pages, or use the arrow buttons. Each file can be rotated or removed.</p>',
                options_grid("\n".join([
                    field("Page size", "page-size", PAGE_SIZE_SELECT),
                    segmented("Orientation", "orientation", [("portrait", "Portrait", True), ("landscape", "Landscape", False)]),
                    field("Margin", "margin", MARGIN_SELECT),
                ])),
                segmented("Fit mode", "fit-mode", [
                    ("fit", "Fit whole image", True),
                    ("fill", "Fill page (crop)", False),
                    ("original", "Original size", False),
                ]),
                switch("border", "Draw a thin border around each image"),
                actions("Create PDF", UPLOAD_ICON),
                STATUS_BLOCK,
            ]),
        ),
        panel(
            "2 · Page preview",
            EYE_ICON,
            """              <div class="preview" id="preview">
                <div class="preview__head"><span id="preview-caption">First page</span></div>
                <div class="preview__body preview__body--paper" id="preview-body">
                  <p class="muted center">The first page appears here as it will be laid out.</p>
                </div>
              </div>""",
        ),
    ),
    howto=steps([
        ("Add your images", "Drop JPG, PNG or WEBP files onto the zone — you can add as many as you like, in several batches."),
        ("Arrange the pages", "Drag tiles into the order you want (or use the arrow buttons for keyboard control), rotate sideways shots and remove anything you do not need."),
        ("Choose the layout", "Pick a page size, orientation, margin and fit mode. “Fit” shows the whole image, “Fill” crops it to the page shape, “Original” keeps pixel dimensions."),
        ("Create the PDF", "Press “Create PDF” and each image becomes one page of a single downloadable PDF."),
    ]),
    faq=faq([
        ("Is there a limit on how many images I can add?",
         "No hard limit — the practical limit is your device's memory, since every image is decoded in the browser. A few hundred photos are fine; thousands at once may be slow."),
        ("Will image quality drop?",
         "PNG sources are embedded losslessly; JPG and WEBP sources are re-encoded at 92% quality, which is visually indistinguishable. “Fill” mode crops instead of stretching, so nothing is ever distorted."),
        ("Can each image have a different page size?",
         "All pages share the page settings you choose, which keeps the document consistent. Switch to “Original size” fit mode if you want each image drawn at its native pixel dimensions."),
        ("What order will the pages be in?",
         "Exactly the order shown in the tiles grid — numbering on each tile tells you the final page number."),
    ]),
)

# --------------------------------------------------------------------------
# 4. PDF to Image
# --------------------------------------------------------------------------
TOOLS["pdf-to-image"] = dict(
    title="PDF to Image — Export PDF pages as PNG or JPG (ZIP download)",
    desc="Render every page of a PDF to PNG or JPG in your browser. Choose resolution and quality, download pages one by one or grab them all as a ZIP archive.",
    keywords="pdf to image, pdf to png, pdf to jpg, convert pdf pages, pdf screenshot, pdf zip",
    h1="PDF to Image",
    lead="Export each page of a PDF as a high-resolution PNG or JPG. Rendered locally with pdf.js, so scanned contracts and personal documents stay on your device.",
    howto_lead="Render pages at the resolution you need.",
    libs=["pdfjs", "pdfjsworker", "jszip"],
    script="pdf-to-image.js",
    category="PDF Tools",
    features=[
        "Page-per-image rendering with pdf.js",
        "PNG or JPG output with quality control",
        "Resolution scale from 1× to 3× (up to ~300 dpi)",
        "Download individual pages or everything as a ZIP",
    ],
    workspace="""          <div class="workspace workspace--split">
%s
%s
          </div>""" % (
        panel(
            "1 · PDF &amp; export settings",
            SETTINGS_ICON,
            "\n".join([
                dropzone(),
                '              <p class="field__help" id="page-info" hidden></p>',
                options_grid("\n".join([
                    segmented("Format", "format", [("png", "PNG (lossless)", True), ("jpg", "JPG (smaller)", False)]),
                    field("Resolution", "scale",
                          '<select class="control" id="scale">\n'
                          '                  <option value="1">Standard · 96 dpi</option>\n'
                          '                  <option value="1.5">High · 144 dpi</option>\n'
                          '                  <option value="2" selected>Print · 192 dpi</option>\n'
                          '                  <option value="3">Ultra · 288 dpi</option>\n'
                          '                </select>'),
                    field("Page range", "page-range",
                          '<input class="control" id="page-range" type="text" inputmode="numeric" placeholder="e.g. 1-3, 5 (blank = all)">',
                          "Leave blank to convert every page."),
                ])),
                range("quality", "JPG quality", 40, 100, 90, 5, "Only used for JPG output."),
                actions("Convert to images", UPLOAD_ICON),
                STATUS_BLOCK,
            ]),
        ),
        panel(
            "2 · Pages",
            EYE_ICON,
            """              <div class="row" id="pages-actions" hidden>
                <button class="btn btn--primary btn--sm" id="download-zip" type="button">Download all as ZIP</button>
              </div>
              <div class="preview" id="preview">
                <div class="preview__head"><span>Rendered pages</span></div>
                <div class="preview__body" id="preview-body">
                  <p class="muted center">Rendered pages appear here with their own download buttons.</p>
                </div>
              </div>""",
        ),
    ),
    howto=steps([
        ("Upload the PDF", "Drop in a PDF (up to 100 MB). The tool reads the page count straight away and shows it above the options."),
        ("Choose format and resolution", "PNG keeps every detail; JPG is much smaller. 2× gives you roughly 192 dpi, 3× around 288 dpi."),
        ("Convert", "Pages are rendered one at a time so the interface stays responsive, with a progress bar as it goes."),
        ("Download", "Save a single page from its tile, or take the whole set as one ZIP archive."),
    ]),
    faq=faq([
        ("Which resolution should I pick?",
         "Standard (1×) is fine for on-screen reading. Use 2× for printing or documents with small type, and 3× when you need to crop into details. Higher scales use considerably more memory."),
        ("Why is my PDF password-protected error appearing?",
         "Encrypted PDFs cannot be decrypted in the browser without the password. Open the file in a PDF reader, remove the protection, then convert it."),
        ("Can I convert only a few pages?",
         "Yes — type a range such as 1-3, 5, 7-9 in the “Page range” box and only those pages are rendered."),
        ("Will scanned PDFs work?",
         "Perfectly. Scanned documents are already images internally, so they render at exactly the quality they were scanned at."),
    ]),
)

# --------------------------------------------------------------------------
# 5. Merge PDF
# --------------------------------------------------------------------------
TOOLS["merge-pdf"] = dict(
    title="Merge PDF — Combine multiple PDF files into one, free &amp; private",
    desc="Merge PDFs in any order, straight from your browser. Drag files to reorder them, see the page count of each, and download one combined PDF. No uploads, no limits.",
    keywords="merge pdf, combine pdf, join pdf files, pdf merger, concatenate pdf, pdf combiner",
    h1="Merge PDF",
    lead="Join as many PDFs as you like into a single document. Drag to set the exact order, watch the total page count update, and download the merged file — all without uploading anything.",
    howto_lead="Combine PDFs in the exact order you want.",
    libs=["pdflib"],
    script="merge-pdf.js",
    category="PDF Tools",
    features=[
        "Merge unlimited PDFs into one document with pdf-lib",
        "Drag-and-drop reordering with keyboard arrow buttons",
        "Optional document title and author stored in the PDF metadata",
        "Live page count per file and a total for the result",
        "Keeps text selectable — pages are copied, not rasterised",
    ],
    workspace="""          <div class="panel">
            <div class="panel__head">%s<h2>1 · PDF files</h2></div>
            <div class="panel__body">
%s
              <p class="field__help" id="merge-summary"></p>
            </div>
          </div>
          <div class="workspace mt-2">
%s
          </div>""" % (
        SETTINGS_ICON,
        dropzone(),
        panel(
            "2 · Merge",
            UPLOAD_ICON,
            "\n".join([
                options_grid("\n".join([
                    field("Document title", "doc-title",
                          '<input class="control" id="doc-title" type="text" placeholder="Optional">',
                          "Stored in the PDF metadata."),
                    field("Author", "doc-author",
                          '<input class="control" id="doc-author" type="text" placeholder="Optional">'),
                ])),
                actions("Merge PDFs", UPLOAD_ICON),
                STATUS_BLOCK,
            ]),
        ),
    ),
    howto=steps([
        ("Add your PDFs", "Drop two or more PDF files onto the zone. Each one is read locally to show how many pages it has."),
        ("Set the order", "Drag a row to a new position, or use the up/down buttons. The order you see is the order of the merged document."),
        ("Merge", "Press “Merge PDFs”. Pages are copied into a new document — nothing is re-rendered, so text stays selectable and quality is untouched."),
        ("Download", "The combined PDF is saved to your device with a name you can change afterwards."),
    ]),
    faq=faq([
        ("What order will the pages be in?",
         "Top to bottom, exactly as listed. Use the grip handle or the arrow buttons to move a file before merging."),
        ("Can I merge PDFs with different page sizes?",
         "Yes. Each page keeps its own size and orientation; the merged document simply contains a mix of page geometries."),
        ("Does merging reduce quality?",
         "No. The page objects are copied into the new file rather than re-rendered, so text stays crisp and selectable."),
        ("Why did one of my files fail?",
         "Password-protected or damaged PDFs cannot be copied. Remove the protection or re-export the file, then add it again."),
    ]),
)

# --------------------------------------------------------------------------
# 6. Split PDF
# --------------------------------------------------------------------------
TOOLS["split-pdf"] = dict(
    title="Split PDF — Extract page ranges or separate every page free",
    desc="Split a PDF in your browser: extract page ranges such as 1-3, 5, 7-9, pull each range into its own file, or break every page into a separate PDF delivered as a ZIP.",
    keywords="split pdf, extract pages, pdf splitter, separate pdf pages, pdf page range, pdf zip",
    h1="Split PDF",
    lead="Pull the pages you need out of a PDF. Extract a range into one document, split several ranges into separate files, or break every page into its own PDF — processed locally with pdf-lib.",
    howto_lead="Three ways to break a PDF apart.",
    libs=["pdflib", "jszip"],
    script="split-pdf.js",
    category="PDF Tools",
    features=[
        "Extract pages by range, e.g. 1-3, 5, 7-9",
        "Split each range into its own PDF file",
        "Break every page into a separate PDF, delivered as a ZIP",
        "Preview of the selected pages before you split",
    ],
    workspace="""          <div class="workspace workspace--split">
%s
%s
          </div>""" % (
        panel(
            "1 · PDF",
            SETTINGS_ICON,
            "\n".join([
                dropzone(),
                '              <p class="field__help" id="page-info" hidden></p>',
                segmented("Split mode", "split-mode", [
                    ("extract", "Extract pages", True),
                    ("ranges", "One file per range", False),
                    ("every", "Every page", False),
                ]),
                field("Pages", "page-range",
                      '<input class="control" id="page-range" type="text" inputmode="numeric" placeholder="e.g. 1-3, 5, 7-9" aria-describedby="range-help">',
                      'Use commas for separate ranges. Leave blank in “Every page” mode.'),
                actions("Split PDF", UPLOAD_ICON),
                STATUS_BLOCK,
            ]),
        ),
        panel(
            "2 · Selected pages",
            EYE_ICON,
            """              <div class="preview" id="preview">
                <div class="preview__head"><span id="preview-caption">Selection</span></div>
                <div class="preview__body" id="preview-body">
                  <p class="muted center">Upload a PDF and pick pages to see what will be exported.</p>
                </div>
              </div>""",
        ),
    ),
    howto=steps([
        ("Upload the PDF", "The file is opened locally and the tool reports the total number of pages."),
        ("Choose a mode", "“Extract pages” gathers your ranges into a single PDF. “One file per range” writes each comma-separated range to its own file. “Every page” splits the document completely."),
        ("Enter the pages", "Type a range such as 1-3, 5, 7-9. Reversed ranges and duplicates are handled for you."),
        ("Split and download", "One file downloads directly; multiple files arrive together as a ZIP archive."),
    ]),
    faq=faq([
        ("How do I write a page range?",
         "Single pages are just numbers (5), ranges use a hyphen (1-3), and commas separate groups (1-3, 5, 7-9). Reversed ranges such as 5-3 are read as 3-5."),
        ("What if I enter a page that does not exist?",
         "You will get a clear message telling you the file's page count, so you can correct the range."),
        ("Can I extract every page as a separate PDF?",
         "Yes — choose “Every page”. You will receive a ZIP containing one PDF per page, named with zero-padded page numbers."),
        ("Are the split pages re-compressed?",
         "No. Page content streams are copied as they are, so quality and file structure are preserved."),
    ]),
)

# --------------------------------------------------------------------------
# 7. Compress Image
# --------------------------------------------------------------------------
TOOLS["compress-image"] = dict(
    title="Compress Image — Reduce JPG, PNG &amp; WEBP file size free",
    desc="Compress images in your browser with a quality slider and optional max width/height. See the before and after size plus the exact percentage saved, then download or ZIP them.",
    keywords="compress image, reduce image size, image compressor, jpg compress, png compress, webp compress, resize",
    h1="Compress Image",
    lead="Shrink photos and screenshots without guessing. Adjust quality and maximum dimensions, and see the exact size saved for every image before you download — all processing stays on your device.",
    howto_lead="Balance quality against file size in seconds.",
    libs=["jszip"],
    script="compress-image.js",
    category="Image Tools",
    features=[
        "Batch compression for JPG, PNG and WEBP",
        "Quality slider plus optional max width and height",
        "Before/after size and percentage saved per image",
        "Download individually or as a single ZIP archive",
    ],
    workspace="""          <div class="workspace workspace--split">
%s
%s
          </div>""" % (
        panel(
            "1 · Images &amp; settings",
            SETTINGS_ICON,
            "\n".join([
                dropzone(),
                range("quality", "Quality", 10, 100, 75, 1, "Lower quality means a smaller file."),
                options_grid("\n".join([
                    field("Max width (px)", "max-width",
                          '<input class="control" id="max-width" type="number" min="0" step="10" value="0" placeholder="No limit">',
                          "0 keeps the original width."),
                    field("Max height (px)", "max-height",
                          '<input class="control" id="max-height" type="number" min="0" step="10" value="0" placeholder="No limit">',
                          "0 keeps the original height."),
                    field("Output format", "output-format",
                          '<select class="control" id="output-format">\n'
                          '                  <option value="keep" selected>Keep original format</option>\n'
                          '                  <option value="image/jpeg">JPG (smallest)</option>\n'
                          '                  <option value="image/webp">WEBP (best ratio)</option>\n'
                          '                  <option value="image/png">PNG (lossless)</option>\n'
                          '                </select>'),
                ])),
                actions("Compress images", UPLOAD_ICON, extra="""
                <button class="btn btn--soft" id="download-zip" type="button" disabled>Download ZIP</button>"""),
                STATUS_BLOCK,
            ]),
        ),
        panel(
            "2 · Results",
            EYE_ICON,
            """              <div id="totals" class="stat-row" hidden></div>
              <div class="preview" id="preview">
                <div class="preview__head"><span>Before → after</span></div>
                <div class="preview__body" id="preview-body">
                  <p class="muted center">Compressed images appear here with the space you saved.</p>
                </div>
              </div>""",
        ),
    ),
    howto=steps([
        ("Add images", "Drop one or many JPG, PNG or WEBP files. Thumbnails and original sizes are listed straight away."),
        ("Set quality and limits", "Drag the quality slider and optionally cap the width or height. Aspect ratio is always preserved."),
        ("Compress", "Each image is re-encoded on a canvas. You will see the new size and the percentage saved next to the original."),
        ("Download", "Save images one at a time, or take the whole batch as a ZIP."),
    ]),
    faq=faq([
        ("How much smaller will my images get?",
         "It depends on the content and settings. Photos at 75% quality typically shrink by 60–80%. Screenshots and graphics with flat colours compress even better as WEBP."),
        ("Why is my PNG bigger after compressing?",
         "PNG is lossless, so re-encoding cannot always win. For photos, switch the output format to JPG or WEBP — or use “Keep original format” with a lower quality setting."),
        ("Does compression remove metadata?",
         "Yes. Re-encoding on a canvas drops EXIF data, including GPS coordinates, which is often exactly what you want before sharing photos publicly."),
        ("Is the aspect ratio preserved?",
         "Always. The maximum width and height act as a bounding box, and the image is scaled down proportionally to fit inside it."),
    ]),
)

# --------------------------------------------------------------------------
# 8. Image Converter
# --------------------------------------------------------------------------
TOOLS["image-converter"] = dict(
    title="Image Converter — Convert JPG, PNG &amp; WEBP in bulk free",
    desc="Batch convert images between JPG, PNG and WEBP in your browser. Control quality and maximum width, keep transparency or flatten it onto a background colour, download as a ZIP.",
    keywords="image converter, jpg to png, png to jpg, webp to jpg, convert images, batch image conversion",
    h1="Image Converter",
    lead="Convert a whole folder of images between JPG, PNG and WEBP in one go. Choose the target format and quality, decide what happens to transparency, and download everything as a ZIP.",
    howto_lead="Bulk conversion without a single upload.",
    libs=["jszip"],
    script="image-converter.js",
    category="Image Tools",
    features=[
        "Convert to JPG, PNG or WEBP in bulk",
        "Quality control and optional maximum width",
        "Transparent PNGs flattened onto a background colour for JPG",
        "Individual downloads plus a single ZIP for the batch",
    ],
    workspace="""          <div class="workspace workspace--split">
%s
%s
          </div>""" % (
        panel(
            "1 · Images",
            SETTINGS_ICON,
            "\n".join([
                dropzone(),
                options_grid("\n".join([
                    segmented("Convert to", "format", [
                        ("jpg", "JPG", True),
                        ("png", "PNG", False),
                        ("webp", "WEBP", False),
                    ]),
                    field("Max width (px)", "max-width",
                          '<input class="control" id="max-width" type="number" min="0" step="10" value="0" placeholder="No limit">',
                          "0 keeps the original size."),
                    field("Background", "background",
                          '<input type="color" id="background" value="#ffffff">',
                          "Used when converting transparent images to JPG."),
                ])),
                range("quality", "Quality", 30, 100, 90, 1, "Ignored for PNG, which is always lossless."),
                actions("Convert all", UPLOAD_ICON, extra="""
                <button class="btn btn--soft" id="download-zip" type="button" disabled>Download ZIP</button>"""),
                STATUS_BLOCK,
            ]),
        ),
        panel(
            "2 · Converted",
            EYE_ICON,
            """              <div class="preview" id="preview">
                <div class="preview__head"><span>Converted files</span></div>
                <div class="preview__body" id="preview-body">
                  <p class="muted center">Converted images appear here with their new size and a download button.</p>
                </div>
              </div>""",
        ),
    ),
    howto=steps([
        ("Drop your images", "JPG, PNG, WEBP, GIF and BMP are all accepted as input, in any mix."),
        ("Pick the target format", "JPG for photos, PNG for graphics that need transparency, WEBP for the best size-to-quality ratio."),
        ("Adjust quality", "Fine-tune the quality slider and optionally cap the width. Transparent pixels are flattened onto your chosen background colour when the target is JPG."),
        ("Convert and download", "Every image is converted locally; grab them individually or as one ZIP archive."),
    ]),
    faq=faq([
        ("What happens to transparency when converting to JPG?",
         "JPG has no alpha channel, so transparent pixels are painted with the background colour you choose (white by default). Converting to PNG or WEBP keeps transparency intact."),
        ("Are animated GIFs animated in the output?",
         "Only the first frame is kept. Canvas-based conversion works on single images; for animation you would need a dedicated tool."),
        ("Which format should I choose?",
         "JPG for photographs, PNG for logos, screenshots and anything with sharp edges or transparency, WEBP when you want the smallest file and modern browser support."),
        ("Is there a batch limit?",
         "No artificial limit. Because each image is decoded in memory, very large batches are simply processed one after another with a progress bar."),
    ]),
)

# --------------------------------------------------------------------------
# 9. Text to PDF
# --------------------------------------------------------------------------
TOOLS["text-to-pdf"] = dict(
    title="Text to PDF — Type or paste text and export a paginated PDF",
    desc="Create a PDF from plain text in your browser. Choose the font, size, line spacing, alignment, page size, orientation and margins — with a live preview and optional page numbers.",
    keywords="text to pdf, txt to pdf, notes to pdf, create pdf from text, plain text pdf, typewriter pdf",
    h1="Text to PDF",
    lead="Type or paste anything — notes, a report, code, lyrics — and export it as a neatly paginated PDF. The preview shows the real line breaks and page splits before you save.",
    howto_lead="From plain text to a formatted PDF.",
    libs=["jspdf"],
    script="text-to-pdf.js",
    category="Utility Tools",
    features=[
        "Write in the browser or import a .txt / .md file",
        "Helvetica, Times or Courier at any size with adjustable line spacing",
        "A4, Letter or Legal pages, portrait or landscape, four margin presets",
        "Live preview with real pagination and optional page numbers",
    ],
    workspace="""          <div class="workspace workspace--split">
%s
%s
          </div>""" % (
        panel(
            "1 · Text &amp; layout",
            SETTINGS_ICON,
            "\n".join([
                '              <div class="field">\n                <label for="text-input">Your text</label>\n                <textarea class="control control--textarea-lg" id="text-input" placeholder="Type or paste your text here…&#10;&#10;Blank lines start a new paragraph."></textarea>\n                <span class="field__help" id="text-stats"></span>\n              </div>',
                '              <div data-component="dropzone"></div>',
                options_grid("\n".join([
                    field("Font", "font-family",
                          '<select class="control" id="font-family">\n'
                          '                  <option value="helvetica" selected>Helvetica (sans-serif)</option>\n'
                          '                  <option value="times">Times (serif)</option>\n'
                          '                  <option value="courier">Courier (monospace)</option>\n'
                          '                </select>'),
                    field("Alignment", "align",
                          '<select class="control" id="align">\n'
                          '                  <option value="left" selected>Left</option>\n'
                          '                  <option value="center">Centre</option>\n'
                          '                  <option value="right">Right</option>\n'
                          '                </select>'),
                    field("Page size", "page-size", PAGE_SIZE_SELECT),
                    segmented("Orientation", "orientation", [("portrait", "Portrait", True), ("landscape", "Landscape", False)]),
                    field("Margins", "margin", MARGIN_SELECT),
                    field("Line spacing", "line-spacing",
                          '<select class="control" id="line-spacing">\n'
                          '                  <option value="1">Single</option>\n'
                          '                  <option value="1.15" selected>1.15</option>\n'
                          '                  <option value="1.5">1.5</option>\n'
                          '                  <option value="2">Double</option>\n'
                          '                </select>'),
                ])),
                range("font-size", "Font size", 8, 24, 12, 1),
                switch("page-numbers", "Add page numbers", True),
                actions("Create PDF", UPLOAD_ICON, extra="""
                <button class="btn btn--ghost" id="copy-action" type="button">Copy text</button>"""),
                STATUS_BLOCK,
            ]),
        ),
        panel(
            "2 · Live preview",
            EYE_ICON,
            """              <div class="preview" id="preview">
                <div class="preview__head"><span id="preview-caption">Page 1</span></div>
                <div class="preview__body preview__body--paper" id="preview-body">
                  <p class="muted center">Start typing to see the paginated preview.</p>
                </div>
              </div>""",
        ),
    ),
    howto=steps([
        ("Write or import", "Type straight into the box, or drop a .txt / .md file onto the zone to fill it."),
        ("Style the page", "Choose a font, size, line spacing, alignment, page size, orientation and margins."),
        ("Watch the preview", "The preview uses the same layout engine as the PDF, so line breaks and page splits match the output."),
        ("Create the PDF", "Press “Create PDF” — text is paginated locally and downloaded as a proper, searchable PDF."),
    ]),
    faq=faq([
        ("Is the preview the same as the PDF?",
         "Yes. Both use jsPDF's text measurement, so wrapping and page breaks line up with what you download."),
        ("Does it support Markdown or rich formatting?",
         "The output is plain, uniformly styled text — ideal for notes, scripts and reports. Markdown syntax is kept as literal characters. For styled documents, convert a .docx instead."),
        ("How long a document can I create?",
         "As long as you like. Text is wrapped and paginated line by line, so even a few hundred pages convert quickly."),
        ("Will the PDF text be selectable?",
         "Yes — text is embedded as real text, not as an image, so it can be selected, searched and copied."),
    ]),
)

# --------------------------------------------------------------------------
# 10. QR Code Generator
# --------------------------------------------------------------------------
TOOLS["qr-generator"] = dict(
    title="QR Code Generator — Create custom PNG &amp; SVG QR codes free",
    desc="Generate a QR code for any link, text or Wi-Fi details. Pick the size, colours, margin and error correction level, preview it live and download as PNG or SVG.",
    keywords="qr code generator, create qr code, qr code png, qr code svg, custom qr code, free qr generator",
    h1="QR Code Generator",
    lead="Make a crisp QR code for a link, Wi-Fi network or plain text. Choose your colours, size and error correction level, then download a pixel-perfect PNG or an infinitely scalable SVG.",
    howto_lead="Design and export a QR code in seconds.",
    libs=["qrcode"],
    script="qr-generator.js",
    category="Utility Tools",
    features=[
        "Live preview as you type",
        "Custom foreground and background colours",
        "Error correction from L (7%) to H (30%)",
        "Download as PNG at up to 1024 px or as scalable SVG",
    ],
    workspace="""          <div class="workspace workspace--split">
%s
%s
          </div>""" % (
        panel(
            "1 · Content &amp; style",
            SETTINGS_ICON,
            "\n".join([
                '              <div class="field">\n                <label for="qr-text">Text or URL</label>\n                <textarea class="control" id="qr-text" rows="3" placeholder="https://example.com"></textarea>\n                <span class="field__help" id="qr-length"></span>\n              </div>',
                options_grid("\n".join([
                    field("Error correction", "ec-level",
                          '<select class="control" id="ec-level">\n'
                          '                  <option value="L">Low · 7% recovery</option>\n'
                          '                  <option value="M" selected>Medium · 15% recovery</option>\n'
                          '                  <option value="Q">Quartile · 25% recovery</option>\n'
                          '                  <option value="H">High · 30% recovery</option>\n'
                          '                </select>',
                          "Higher levels stay scannable when the code is damaged or overlaid with a logo."),
                    field("Foreground", "fg-color", '<input type="color" id="fg-color" value="#0f172a">'),
                    field("Background", "bg-color", '<input type="color" id="bg-color" value="#ffffff">'),
                ])),
                range("qr-size", "Image size", 128, 1024, 512, 32, "Pixels for the PNG export."),
                range("qr-margin", "Quiet zone", 0, 8, 4, 1, "Modules of padding around the code."),
                actions("Download PNG", UPLOAD_ICON, disabled=False, extra="""
                <button class="btn btn--ghost" id="download-svg" type="button">Download SVG</button>
                <button class="btn btn--ghost" id="copy-action" type="button">Copy text</button>"""),
                STATUS_BLOCK,
            ]),
        ),
        panel(
            "2 · Preview",
            EYE_ICON,
            """              <div class="qr-stage" id="qr-stage">
                <canvas id="qr-canvas" width="512" height="512" role="img" aria-label="QR code preview"></canvas>
              </div>
              <p class="field__help" id="qr-meta"></p>""",
        ),
    ),
    howto=steps([
        ("Enter the content", "Paste a URL, Wi-Fi string or any text up to about a thousand characters."),
        ("Style it", "Set the foreground and background colours, the quiet zone and the error correction level."),
        ("Preview", "The code is re-drawn instantly at your chosen size — no server round trip."),
        ("Export", "Download a PNG for social posts and print, or an SVG when you need to scale it without losing quality."),
    ]),
    faq=faq([
        ("Do these QR codes expire?",
         "No. They are static images that encode your text directly, so they work for as long as the destination link does."),
        ("How much text can a QR code hold?",
         "Up to 2,953 bytes at the lowest error correction level. In practice, keep URLs short — the more data, the denser (and harder to scan) the code."),
        ("When should I use a higher error correction level?",
         "Level H recovers up to 30% damage, which matters if you plan to overlay a logo, print on a rough surface, or expect wear and tear."),
        ("PNG or SVG?",
         "PNG for immediate use in documents and social media. SVG for anything you will resize, such as posters or signage, because it stays perfectly sharp."),
    ]),
)

# --------------------------------------------------------------------------
# 11. Word Counter
# --------------------------------------------------------------------------
TOOLS["word-counter"] = dict(
    title="Word Counter — Count words, characters, sentences &amp; reading time",
    desc="Count words, characters, sentences, paragraphs and lines as you type, plus reading and speaking time, average word length and keyword density. Free, private and instant.",
    keywords="word counter, character count, sentence counter, reading time, word count tool, essay counter, seo word count",
    h1="Word Counter",
    lead="A live counter for anything you write. Words, characters, sentences, paragraphs, reading time, speaking time and keyword density update as you type — and nothing you write is stored or sent anywhere.",
    howto_lead="Instant feedback on anything you write.",
    libs=[],
    script="word-counter.js",
    category="Utility Tools",
    features=[
        "Live word, character, sentence, paragraph and line counts",
        "Reading time (225 wpm) and speaking time (140 wpm)",
        "Average word length, longest word and Flesch reading ease",
        "Top keyword density list to keep your writing focused",
    ],
    workspace="""          <div class="panel">
            <div class="panel__head">%s<h2>Your text</h2></div>
            <div class="panel__body">
              <div class="field">
                <label for="word-input">Type or paste your text</label>
                <textarea class="control control--textarea-lg" id="word-input" placeholder="Start typing — every statistic updates instantly…"></textarea>
              </div>
              <div data-component="dropzone"></div>
              <div class="row">
                <button class="btn btn--primary" id="copy-action" type="button">Copy text</button>
                <button class="btn btn--ghost" id="download-action" type="button">Download .txt</button>
                <button class="btn btn--ghost" id="clear-action" type="button">Clear</button>
              </div>
              <p class="field__help" data-component="status" role="status" aria-live="polite"></p>
            </div>
          </div>
          <div class="workspace mt-2">
%s
%s
          </div>""" % (
        SETTINGS_ICON,
        panel(
            "Statistics",
            EYE_ICON,
            """              <div class="stats-grid" id="stats-grid" aria-live="polite"></div>""",
        ),
        panel(
            "Keywords",
            SETTINGS_ICON,
            """              <p class="field__help">The ten most frequent meaningful words, with how often they appear.</p>
              <div class="data-table-wrap">
                <table class="data-table" id="keyword-table">
                  <caption class="sr-only">Most frequent words</caption>
                  <thead><tr><th scope="col">Word</th><th scope="col">Count</th><th scope="col">Density</th></tr></thead>
                  <tbody id="keyword-body"></tbody>
                </table>
              </div>""",
        ),
    ),
    howto=steps([
        ("Start writing", "Type or paste straight into the box, or drop a .txt file in to analyse existing text."),
        ("Read the statistics", "Every count updates as you type — words, characters with and without spaces, sentences, paragraphs and lines."),
        ("Check the timings", "Reading time assumes 225 words per minute and speaking time 140, so you can plan an essay or a talk."),
        ("Export if you need to", "Copy the text or download it as a .txt file. Nothing is saved on our side."),
    ]),
    faq=faq([
        ("How is a word defined?",
         "Any run of characters separated by whitespace, after stripping punctuation. Hyphenated words such as “state-of-the-art” count as one word, matching how Word and Google Docs behave."),
        ("How is reading time calculated?",
         "Word count divided by 225 words per minute, the average silent reading speed for adults. Speaking time uses 140 words per minute, a comfortable presentation pace."),
        ("Is my text sent anywhere?",
         "No. Counting happens in your browser on every keystroke; there is no server to send it to and nothing is stored once you close the tab."),
        ("What does the keyword density mean?",
         "How often each word appears as a percentage of the total. It is useful for spotting repetition and for light on-page SEO checks."),
    ]),
)


def build(slug, data):
    cdn_lines = []
    for lib in data["libs"]:
        name, url = CDN[lib]
        cdn_lines.append('    <!-- %s (pinned) -->\n    <script src="%s" defer></script>' % (name, url))
    cdn = ("\n".join(cdn_lines) + "\n") if cdn_lines else ""

    return SHELL % dict(
        title=data["title"],
        desc=data["desc"],
        url="%s/tools/%s.html" % (BASE_URL, slug),
        keywords=data["keywords"],
        base=BASE_URL,
        h1=data["h1"],
        lead=data["lead"],
        shield=SHIELD,
        howto_lead=data["howto_lead"],
        howto=data["howto"],
        faq=data["faq"],
        workspace=data["workspace"],
        jsonld=jsonld(data["h1"], slug, data["desc"].replace("&amp;", "&"), data["category"], data["features"]),
        cdn=cdn,
        script=data["script"],
    )


def main():
    outdir = os.path.join(ROOT, "tools")
    os.makedirs(outdir, exist_ok=True)
    for slug, data in TOOLS.items():
        path = os.path.join(outdir, slug + ".html")
        with open(path, "w", encoding="utf-8") as fh:
            fh.write(build(slug, data))
        print("wrote", os.path.relpath(path, ROOT), len(build(slug, data)), "bytes")


if __name__ == "__main__":
    main()
