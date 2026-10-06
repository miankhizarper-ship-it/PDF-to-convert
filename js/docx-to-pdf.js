/* ==========================================================================
   docx-to-pdf.js — .docx → HTML (mammoth.js) → PDF (html2pdf.js)
   Everything runs in the browser; the file is never uploaded.
   ========================================================================== */
(function () {
  "use strict";

  var FT = window.FT;
  var tool = FT.initPage({ slug: "docx-to-pdf" });

  /* ---- DOM handles ------------------------------------------------------ */
  var dropzoneMount = FT.$('[data-component="dropzone"]');
  var primaryBtn = FT.$("#primary-action");
  var clearBtn = FT.$("#clear-action");
  var progress = FT.createProgress(FT.$("#progress"));
  var loader = FT.createLoader(FT.$("#loader"));
  var resultEl = FT.$("#result");
  var previewBody = FT.$("#preview-body");
  var pageSizeEl = FT.$("#page-size");
  var marginEl = FT.$("#margin");
  var pageNumbersEl = FT.$("#page-numbers");

  /* Page geometry in points (1 pt = 1/72 in) */
  var PAGE_SIZES = {
    a4: [595.28, 841.89],
    letter: [612, 792],
    legal: [612, 1008],
  };
  var MARGIN_PT = { none: 0, normal: 34, wide: 71 };

  var state = { html: "", fileName: "", messages: 0 };

  /* ---- Options ---------------------------------------------------------- */
  function selectedOrientation() {
    var checked = FT.$('input[name="orientation"]:checked');
    return checked ? checked.value : "portrait";
  }

  function pageGeometry() {
    var size = PAGE_SIZES[pageSizeEl.value] || PAGE_SIZES.a4;
    var width = selectedOrientation() === "landscape" ? size[1] : size[0];
    var height = selectedOrientation() === "landscape" ? size[0] : size[1];
    var margin = MARGIN_PT[marginEl.value] == null ? MARGIN_PT.normal : MARGIN_PT[marginEl.value];
    return { width: width, height: height, margin: margin };
  }

  /* ---- Conversion ------------------------------------------------------- */

  /** .docx → HTML string, with inline base64 images. */
  function docxToHtml(file) {
    var mammoth = FT.requireLib("mammoth");
    return FT.readFileAsArrayBuffer(file).then(function (arrayBuffer) {
      return mammoth.convertToHtml(
        { arrayBuffer: arrayBuffer },
        {
          /* mammoth 1.x hands over an image with readAsBase64String() plus a
             contentType; we inline it as a data URL so it survives into the PDF. */
          convertImage: mammoth.images.imgElement(function (image) {
            return image.readAsBase64String().then(function (base64) {
              return {
                src: "data:" + image.contentType + ";base64," + base64,
                alt: image.altText || "Image from the document",
              };
            });
          }),
        }
      );
    });
  }

  function renderPreview() {
    var geometry = pageGeometry();
    var landscape = selectedOrientation() === "landscape";
    var paper = FT.el("div", { class: "paper docx-preview" + (landscape ? " paper--landscape" : "") });
    paper.style.padding = geometry.margin ? Math.round((geometry.margin / geometry.width) * 100) + "%" : "2%";
    paper.innerHTML = state.html || "<p class='muted'>Nothing to preview yet.</p>";
    previewBody.innerHTML = "";
    previewBody.appendChild(paper);
  }

  /** Build an offscreen, correctly sized node for html2canvas to capture. */
  function buildSourceNode() {
    var geometry = pageGeometry();
    var contentWidthPx = Math.max(200, Math.round(((geometry.width - geometry.margin * 2) * 96) / 72));
    var node = FT.el("div", { class: "docx-preview" });
    node.setAttribute("style", [
      "position:absolute",
      "left:-10000px",
      "top:0",
      "width:" + contentWidthPx + "px",
      "background:#ffffff",
      "color:#111827",
      "font-family:Georgia,'Times New Roman',serif",
      "font-size:12pt",
      "line-height:1.5",
    ].join(";"));
    node.innerHTML = state.html;
    document.body.appendChild(node);
    return node;
  }

  function stampPageNumbers(pdf, geometry) {
    var total = pdf.internal.getNumberOfPages();
    pdf.setFontSize(9);
    pdf.setTextColor(120);
    for (var page = 1; page <= total; page++) {
      pdf.setPage(page);
      pdf.text("Page " + page + " of " + total, geometry.width / 2, geometry.height - 18, {
        align: "center",
      });
    }
    return total;
  }

  function convert() {
    var html2pdf = FT.requireLib("html2pdf");
    var geometry = pageGeometry();
    var source = buildSourceNode();
    var outName = FT.safeFileName(FT.baseName(state.fileName), "document") + ".pdf";

    var options = {
      margin: [geometry.margin, geometry.margin, geometry.margin + 6, geometry.margin],
      filename: outName,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, backgroundColor: "#ffffff", logging: false },
      jsPDF: {
        unit: "pt",
        format: pageSizeEl.value,
        orientation: selectedOrientation(),
        compress: true,
      },
      pagebreak: { mode: ["css", "legacy"], avoid: ["img", "tr", "table", "h1", "h2", "h3", "li"] },
    };

    return html2pdf()
      .set(options)
      .from(source)
      .toPdf()
      .get("pdf")
      .then(function (pdf) {
        var pages = pageNumbersEl.checked ? stampPageNumbers(pdf, geometry) : pdf.internal.getNumberOfPages();
        var blob = pdf.output("blob");
        source.remove();
        FT.downloadBlob(blob, outName);
        return { name: outName, size: blob.size, pages: pages };
      })
      .catch(function (error) {
        source.remove();
        throw error;
      });
  }

  /* ---- Result ----------------------------------------------------------- */
  function showResult(info) {
    progress.hide();
    FT.renderResult(resultEl, {
      title: "Your PDF is ready",
      text: info.name + " has been saved to your downloads.",
      stats: [
        { value: info.pages, label: info.pages === 1 ? "Page" : "Pages" },
        { value: FT.formatBytes(info.size), label: "File size" },
      ],
      actions: [
        {
          label: "Convert another file",
          variant: "btn--ghost",
          icon: FT.icons.restart,
          onClick: reset,
        },
      ],
    });
    FT.toast("PDF downloaded", "success", info.name + " · " + FT.formatBytes(info.size));
  }

  function reset() {
    uploader.clear();
    state = { html: "", fileName: "", messages: 0 };
    FT.hideResult(resultEl);
    progress.hide();
    previewBody.innerHTML =
      "<p class='muted center'>Your converted document appears here before you download it.</p>";
    primaryBtn.disabled = true;
  }

  /* ---- Wiring ----------------------------------------------------------- */
  var uploader = FT.createUploader(dropzoneMount, {
    accept: tool.accept,
    maxSizeMB: tool.maxFileMB,
    multiple: false,
    title: "Drop your Word document here",
    hint: ".docx up to 50 MB · converted on your device",
    iconHtml: FT.icons.file,
    readyMessage: "Rendering your preview…",
    onFiles: function (entries) {
      FT.hideResult(resultEl);
      primaryBtn.disabled = true;
      if (!entries.length) {
        previewBody.innerHTML =
          "<p class='muted center'>Your converted document appears here before you download it.</p>";
        return;
      }
      buildPreview(entries[0]);
    },
  });

  function buildPreview(entry) {
    FT.runTask({
      label: "Reading document",
      controls: [primaryBtn, clearBtn],
      progress: progress,
      loader: loader,
      successMessage: "Preview ready. Check it, then convert.",
      work: function () {
        return FT.yield()
          .then(function () {
            return docxToHtml(entry.file);
          })
          .then(function (result) {
            state.html = result.value;
            state.fileName = entry.name;
            state.messages = result.messages ? result.messages.length : 0;
            renderPreview();
            primaryBtn.disabled = false;
          });
      },
    })
      .then(function () {
        progress.hide();
        if (state.messages > 0) {
          FT.toast(
            "Preview ready",
            "info",
            state.messages + " element(s) in this document are not standard Word markup and may look slightly different."
          );
        }
      })
      .catch(function () {
        progress.hide();
        previewBody.innerHTML =
          "<p class='muted center'>That file could not be read. Make sure it is a valid .docx document.</p>";
      });
  }

  primaryBtn.addEventListener("click", function () {
    if (!state.html) {
      FT.toast("Add a document first", "warning", "Drop a .docx file onto the upload zone.");
      return;
    }
    FT.hideResult(resultEl);
    FT.runTask({
      label: "Building your PDF",
      controls: [primaryBtn, clearBtn],
      progress: progress,
      loader: loader,
      successMessage: "PDF created and downloaded.",
      work: function () {
        return FT.yield().then(convert);
      },
    })
      .then(showResult)
      .catch(function () {
        progress.hide();
      });
  });

  clearBtn.addEventListener("click", reset);
  [pageSizeEl, marginEl].forEach(function (input) {
    input.addEventListener("change", function () {
      if (state.html) renderPreview();
    });
  });
  FT.$$('input[name="orientation"]').forEach(function (radio) {
    radio.addEventListener("change", function () {
      if (state.html) renderPreview();
    });
  });
})();
