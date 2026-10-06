/* ==========================================================================
   text-to-pdf.js — plain text → paginated PDF with jsPDF
   The same layout routine drives the preview and the exported file.
   ========================================================================== */
(function () {
  "use strict";

  var FT = window.FT;
  var tool = FT.initPage({ slug: "text-to-pdf" });

  var dropzoneMount = FT.$('[data-component="dropzone"]');
  var primaryBtn = FT.$("#primary-action");
  var copyBtn = FT.$("#copy-action");
  var progress = FT.createProgress(FT.$("#progress"));
  var loader = FT.createLoader(FT.$("#loader"));
  var resultEl = FT.$("#result");
  var textEl = FT.$("#text-input");
  var statsEl = FT.$("#text-stats");
  var previewBody = FT.$("#preview-body");
  var previewCaption = FT.$("#preview-caption");
  var pageSizeEl = FT.$("#page-size");
  var fontFamilyEl = FT.$("#font-family");
  var alignEl = FT.$("#align");
  var marginEl = FT.$("#margin");
  var spacingEl = FT.$("#line-spacing");
  var fontSizeEl = FT.$("#font-size");
  var fontSizeOut = FT.$("#font-size-value");
  var pageNumbersEl = FT.$("#page-numbers");

  var PAGE_SIZES = {
    a4: [595.28, 841.89],
    letter: [612, 792],
    legal: [612, 1008],
  };
  var MARGIN_PT = { none: 0, normal: 48, wide: 85 };
  var CSS_FONTS = {
    helvetica: "Helvetica, Arial, sans-serif",
    times: "'Times New Roman', Times, serif",
    courier: "'Courier New', Courier, monospace",
  };

  FT.bindRange(fontSizeEl, fontSizeOut, function (v) {
    return v + " pt";
  });

  /* ---- Options ---------------------------------------------------------- */
  function orientation() {
    var checked = FT.$('input[name="orientation"]:checked');
    return checked ? checked.value : "portrait";
  }

  function geometry() {
    var size = PAGE_SIZES[pageSizeEl.value] || PAGE_SIZES.a4;
    var landscape = orientation() === "landscape";
    var width = landscape ? size[1] : size[0];
    var height = landscape ? size[0] : size[1];
    var margin = MARGIN_PT[marginEl.value] == null ? MARGIN_PT.normal : MARGIN_PT[marginEl.value];
    return {
      width: width,
      height: height,
      margin: margin,
      contentWidth: Math.max(40, width - margin * 2),
      contentHeight: Math.max(40, height - margin * 2),
    };
  }

  /* ---- Layout (shared by preview and export) ---------------------------- */
  function layout() {
    var jsPDF = FT.requireLib("jspdf").jsPDF;
    var probe = new jsPDF({ unit: "pt", format: pageSizeEl.value, orientation: orientation() });
    var geo = geometry();
    var fontSize = Number(fontSizeEl.value) || 12;
    var spacing = Number(spacingEl.value) || 1.15;
    var lineHeight = fontSize * 1.2 * spacing;
    var linesPerPage = Math.max(1, Math.floor(geo.contentHeight / lineHeight));

    probe.setFont(fontFamilyEl.value, "normal");
    probe.setFontSize(fontSize);

    var pages = [[]];
    textEl.value.split(/\r?\n/).forEach(function (paragraph) {
      if (!paragraph.trim()) {
        addLine("");
        return;
      }
      probe.splitTextToSize(paragraph, geo.contentWidth).forEach(addLine);
    });

    function addLine(line) {
      var current = pages[pages.length - 1];
      if (current.length >= linesPerPage) {
        pages.push([]);
        current = pages[pages.length - 1];
      }
      current.push(line);
    }

    return {
      pages: pages,
      lineHeight: lineHeight,
      fontSize: fontSize,
      geometry: geo,
      font: fontFamilyEl.value,
      align: alignEl.value,
    };
  }

  /* ---- Preview ---------------------------------------------------------- */
  function renderPreview() {
    updateStats();
    if (!textEl.value.trim()) {
      previewBody.innerHTML = "<p class='muted center'>Start typing to see the paginated preview.</p>";
      previewCaption.textContent = "Page 1";
      return;
    }

    var model = layout();
    previewCaption.textContent = model.pages.length + " page" + (model.pages.length === 1 ? "" : "s");
    previewBody.innerHTML = "";

    model.pages.slice(0, 12).forEach(function (lines, index) {
      var paper = FT.el("div", { class: "paper" + (orientation() === "landscape" ? " paper--landscape" : "") });
      var padPercent = model.geometry.margin
        ? (model.geometry.margin / model.geometry.width) * 100
        : 2;
      paper.style.padding = padPercent + "%";
      paper.style.color = "#111827";
      paper.style.fontFamily = CSS_FONTS[model.font] || CSS_FONTS.helvetica;
      paper.style.textAlign = model.align === "center" ? "center" : model.align === "right" ? "right" : "left";
      paper.style.lineHeight = String(1.2 * (Number(spacingEl.value) || 1.15));

      var block = FT.el("div");
      block.style.whiteSpace = "pre-wrap";
      block.style.wordBreak = "break-word";
      block.textContent = lines.join("\n");
      paper.appendChild(block);
      previewBody.appendChild(paper);

      /* Scale the text so it matches the page geometry proportionally. */
      var scale = paper.clientWidth / model.geometry.width;
      paper.style.fontSize = Math.max(5, model.fontSize * scale) + "px";
    });

    if (model.pages.length > 12) {
      previewBody.appendChild(
        FT.el("p", {
          class: "muted center",
          text: "Preview shows the first 12 of " + model.pages.length + " pages.",
        })
      );
    }
  }

  function updateStats() {
    var text = textEl.value;
    var words = text.trim() ? text.trim().split(/\s+/).length : 0;
    statsEl.textContent = text
      ? words + " words · " + text.length + " characters · about " + Math.max(1, Math.round(words / 225)) + " min read"
      : "Type something, or drop a .txt file above.";
  }

  /* ---- Export ----------------------------------------------------------- */
  function buildPdf() {
    var jsPDF = FT.requireLib("jspdf").jsPDF;
    var model = layout();
    var geo = model.geometry;
    var doc = new jsPDF({
      unit: "pt",
      format: pageSizeEl.value,
      orientation: orientation(),
      compress: true,
    });

    model.pages.forEach(function (lines, index) {
      if (index > 0) doc.addPage();
      doc.setFont(model.font, "normal");
      doc.setFontSize(model.fontSize);
      doc.setTextColor(17, 24, 39);
      var x = model.align === "center" ? geo.width / 2 : model.align === "right" ? geo.width - geo.margin : geo.margin;
      lines.forEach(function (line, lineIndex) {
        var y = geo.margin + model.fontSize + lineIndex * model.lineHeight;
        doc.text(line, x, y, { align: model.align });
      });
      if (pageNumbersEl.checked) {
        doc.setFontSize(9);
        doc.setTextColor(130);
        doc.text("Page " + (index + 1) + " of " + model.pages.length, geo.width / 2, geo.height - 20, {
          align: "center",
        });
      }
    });

    var blob = doc.output("blob");
    var name = "text-document.pdf";
    FT.downloadBlob(blob, name);
    return { name: name, size: blob.size, pages: model.pages.length };
  }

  /* ---- Result / reset --------------------------------------------------- */
  function showResult(info) {
    progress.hide();
    FT.renderResult(resultEl, {
      title: "PDF created",
      text: info.name + " has been saved to your downloads.",
      stats: [
        { value: info.pages, label: info.pages === 1 ? "Page" : "Pages" },
        { value: FT.formatBytes(info.size), label: "File size" },
      ],
      actions: [
        { label: "Write another", variant: "btn--ghost", icon: FT.icons.restart, onClick: function () { textEl.focus(); } },
      ],
    });
    FT.toast("PDF downloaded", "success", info.pages + " pages · " + FT.formatBytes(info.size));
  }

  function copyText() {
    if (!textEl.value) {
      FT.toast("Nothing to copy", "warning");
      return;
    }
    var done = function () {
      FT.toast("Copied to clipboard", "success");
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(textEl.value).then(done).catch(function () {
        fallbackCopy();
      });
    } else {
      fallbackCopy();
    }

    function fallbackCopy() {
      textEl.select();
      try {
        document.execCommand("copy");
        done();
      } catch (e) {
        FT.toast("Copy failed", "error", "Select the text and copy it manually.");
      }
    }
  }

  /* ---- Wiring ----------------------------------------------------------- */
  FT.createUploader(dropzoneMount, {
    accept: tool.accept,
    maxSizeMB: tool.maxFileMB,
    multiple: false,
    title: "Or drop a .txt / .md file",
    hint: "The file is read locally and inserted into the editor",
    iconHtml: FT.icons.file,
    readyMessage: "Text loaded into the editor.",
    onFiles: function (entries) {
      if (!entries.length) return;
      FT.readFileAsText(entries[0].file)
        .then(function (text) {
          textEl.value = text;
          renderPreview();
          FT.toast("Text loaded", "success", entries[0].name);
        })
        .catch(function (error) {
          FT.toast("Could not read that file", "error", FT.friendlyError(error));
        });
    },
  });

  primaryBtn.addEventListener("click", function () {
    if (!textEl.value.trim()) {
      FT.toast("Nothing to convert", "warning", "Type or paste some text first.");
      return;
    }
    FT.hideResult(resultEl);
    FT.runTask({
      label: "Creating your PDF",
      controls: [primaryBtn, copyBtn],
      progress: progress,
      loader: loader,
      successMessage: "PDF downloaded.",
      work: function () {
        return FT.yield().then(buildPdf);
      },
    })
      .then(showResult)
      .catch(function () {
        progress.hide();
      });
  });

  copyBtn.addEventListener("click", copyText);
  FT.$("#clear-action").addEventListener("click", function () {
    textEl.value = "";
    FT.hideResult(resultEl);
    renderPreview();
    textEl.focus();
  });
  textEl.addEventListener("input", FT.debounce(renderPreview, 180));
  [pageSizeEl, fontFamilyEl, alignEl, marginEl, spacingEl, fontSizeEl].forEach(function (input) {
    input.addEventListener("input", FT.debounce(renderPreview, 120));
    input.addEventListener("change", renderPreview);
  });
  FT.$$('input[name="orientation"]').forEach(function (radio) {
    radio.addEventListener("change", renderPreview);
  });
  renderPreview();
})();
