/* ==========================================================================
   image-to-pdf.js — JPG / PNG / WEBP images → one multi-page PDF (jsPDF)
   Reordering, rotation and page fitting all happen locally.
   ========================================================================== */
(function () {
  "use strict";

  var FT = window.FT;
  var tool = FT.initPage({ slug: "image-to-pdf" });

  var dropzoneMount = FT.$('[data-component="dropzone"]');
  var primaryBtn = FT.$("#primary-action");
  var clearBtn = FT.$("#clear-action");
  var progress = FT.createProgress(FT.$("#progress"));
  var loader = FT.createLoader(FT.$("#loader"));
  var resultEl = FT.$("#result");
  var previewBody = FT.$("#preview-body");
  var previewCaption = FT.$("#preview-caption");
  var pageSizeEl = FT.$("#page-size");
  var marginEl = FT.$("#margin");
  var borderEl = FT.$("#border");

  var PAGE_SIZES = {
    a4: [595.28, 841.89],
    letter: [612, 792],
    legal: [612, 1008],
  };
  var MARGIN_PT = { none: 0, normal: 34, wide: 71 };
  var RENDER_SCALE = 2; /* pixels per PDF point when rasterising */

  var rotations = Object.create(null);

  /* ---- Page geometry ---------------------------------------------------- */
  function orientation() {
    var checked = FT.$('input[name="orientation"]:checked');
    return checked ? checked.value : "portrait";
  }

  function fitMode() {
    var checked = FT.$('input[name="fit-mode"]:checked');
    return checked ? checked.value : "fit";
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
      contentWidth: Math.max(20, width - margin * 2),
      contentHeight: Math.max(20, height - margin * 2),
    };
  }

  /* ---- Uploader --------------------------------------------------------- */
  var uploader = FT.createUploader(dropzoneMount, {
    accept: tool.accept,
    maxSizeMB: tool.maxFileMB,
    multiple: true,
    reorderable: true,
    title: "Drop your images here",
    hint: "JPG, PNG or WEBP · add as many as you like · up to 50 MB each",
    iconHtml: FT.icons.image,
    readyMessage: "Drag to set the page order.",
    extraActions: [{ action: "rotate", label: "Rotate", icon: FT.icons.rotate }],
    onExtraAction: function (action, entry) {
      if (action !== "rotate") return;
      rotations[entry.id] = ((rotations[entry.id] || 0) + 90) % 360;
      /* Rotate in place: rebuilding the list would throw away the button the
         user is holding focus on. */
      var thumb = document.querySelector('.file-item[data-id="' + entry.id + '"] .file-item__thumb');
      if (thumb) thumb.style.transform = "rotate(" + rotations[entry.id] + "deg)";
      renderPreview();
    },
    onRenderList: function (entries, listEl) {
      FT.$$(".file-item__thumb", listEl).forEach(function (img) {
        var item = img.closest(".file-item");
        var entry = entries.filter(function (e) {
          return e.id === item.getAttribute("data-id");
        })[0];
        if (entry && rotations[entry.id]) img.style.transform = "rotate(" + rotations[entry.id] + "deg)";
      });
    },
    onFiles: function (entries) {
      FT.hideResult(resultEl);
      primaryBtn.disabled = entries.length === 0;
      renderPreview();
    },
    onReorder: renderPreview,
  });

  /* ---- Preview ---------------------------------------------------------- */
  function renderPreview() {
    var entries = uploader.entries;
    if (!entries.length) {
      previewBody.innerHTML = "<p class='muted center'>The first page appears here as it will be laid out.</p>";
      previewCaption.textContent = "First page";
      return;
    }
    var entry = entries[0];
    var geo = geometry();
    var mode = fitMode();
    previewCaption.textContent = "Page 1 of " + entries.length + " · " + entry.name;

    var paper = FT.el("div", { class: "paper" + (orientation() === "landscape" ? " paper--landscape" : "") });
    var padPercent = geo.margin ? (geo.margin / geo.width) * 100 : 0;
    paper.style.padding = padPercent + "%";
    paper.style.display = "flex";
    paper.style.alignItems = "center";
    paper.style.justifyContent = "center";
    paper.style.overflow = "hidden";

    var box = FT.el("div");
    box.style.position = "relative";
    box.style.width = "100%";
    box.style.height = "100%";
    if (borderEl.checked) {
      box.style.border = "1px solid #cbd5e1";
    }

    var img = FT.el("img", { src: entry.thumb || "", alt: "Preview of page 1" });
    img.style.display = "block";
    if (rotations[entry.id]) img.style.transform = "rotate(" + rotations[entry.id] + "deg)";

    if (mode === "fill") {
      img.style.width = "100%";
      img.style.height = "100%";
      img.style.objectFit = "cover";
    } else if (mode === "original") {
      var natural = rotatedSize(img.naturalWidth || 1, img.naturalHeight || 1, rotations[entry.id] || 0);
      img.style.width = Math.min(100, (natural.width / geo.width) * 100) + "%";
      img.style.height = "auto";
    } else {
      img.style.maxWidth = "100%";
      img.style.maxHeight = "100%";
      img.style.width = "auto";
      img.style.height = "auto";
      img.style.margin = "auto";
    }

    box.appendChild(img);
    paper.appendChild(box);
    previewBody.innerHTML = "";
    previewBody.appendChild(paper);
  }

  function rotatedSize(width, height, degrees) {
    return degrees === 90 || degrees === 270 ? { width: height, height: width } : { width: width, height: height };
  }

  /* ---- PDF creation ----------------------------------------------------- */
  function imageMime(entry, mode) {
    var isPng = entry.file.type === "image/png" || /\.png$/i.test(entry.name);
    return isPng && mode !== "fill" ? "image/png" : "image/jpeg";
  }

  function buildPdf(reportProgress) {
    var jsPDF = FT.requireLib("jspdf").jsPDF;
    var entries = uploader.entries;
    var geo = geometry();
    var mode = fitMode();
    var doc = new jsPDF({
      unit: "pt",
      format: pageSizeEl.value,
      orientation: orientation(),
      compress: true,
    });

    return entries
      .reduce(function (chain, entry, index) {
        return chain.then(function () {
          return FT.loadImage(entry.file).then(function (loaded) {
            var rotation = rotations[entry.id] || 0;
            var targetW = geo.contentWidth * RENDER_SCALE;
            var targetH = geo.contentHeight * RENDER_SCALE;
            var canvas;

            if (mode === "fill") {
              canvas = FT.drawImageToCanvas(loaded.image, {
                rotation: rotation,
                mode: "cover",
                maxWidth: targetW,
                maxHeight: targetH,
                background: "#ffffff",
              });
            } else if (mode === "original") {
              canvas = FT.drawImageToCanvas(loaded.image, { rotation: rotation, mode: "native" });
            } else {
              canvas = FT.drawImageToCanvas(loaded.image, {
                rotation: rotation,
                mode: "contain",
                maxWidth: targetW,
                maxHeight: targetH,
              });
            }

            var mime = imageMime(entry, mode);
            var dataUrl = canvas.toDataURL(mime, 0.92);
            var format = mime === "image/png" ? "PNG" : "JPEG";

            var drawW = canvas.width / RENDER_SCALE;
            var drawH = canvas.height / RENDER_SCALE;
            var x = geo.margin;
            var y = geo.margin;

            if (mode === "fit") {
              x = geo.margin + (geo.contentWidth - drawW) / 2;
              y = geo.margin + (geo.contentHeight - drawH) / 2;
            } else if (mode === "original") {
              drawW = canvas.width;
              drawH = canvas.height;
            }

            if (index > 0) doc.addPage();
            doc.addImage(dataUrl, format, x, y, drawW, drawH, undefined, "FAST");
            if (borderEl.checked) {
              doc.setDrawColor(203, 213, 225);
              doc.setLineWidth(0.6);
              doc.rect(x, y, drawW, drawH);
            }

            FT.revokeObjectURL(loaded.url);
            reportProgress(((index + 1) / entries.length) * 100, "Page " + (index + 1) + " of " + entries.length);
            return FT.yield();
          });
        });
      }, Promise.resolve())
      .then(function () {
        var outName = "images-to-pdf-" + entries.length + "-pages.pdf";
        var blob = doc.output("blob");
        FT.downloadBlob(blob, outName);
        return { name: outName, size: blob.size, pages: entries.length };
      });
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
        { label: "Add more images", variant: "btn--ghost", icon: FT.icons.restart, onClick: reset },
      ],
    });
    FT.toast("PDF downloaded", "success", info.pages + " pages · " + FT.formatBytes(info.size));
  }

  function reset() {
    rotations = Object.create(null);
    uploader.clear();
    FT.hideResult(resultEl);
    progress.hide();
    renderPreview();
  }

  /* ---- Wiring ----------------------------------------------------------- */
  primaryBtn.addEventListener("click", function () {
    var entries = uploader.entries;
    if (!entries.length) {
      FT.toast("Add at least one image", "warning");
      return;
    }
    FT.hideResult(resultEl);
    FT.runTask({
      label: "Building your PDF",
      controls: [primaryBtn, clearBtn],
      progress: progress,
      loader: loader,
      successMessage: "PDF created and downloaded.",
      work: function (ctx) {
        ctx.progress(2, "Decoding images");
        return FT.yield().then(function () {
          return buildPdf(ctx.progress);
        });
      },
    })
      .then(showResult)
      .catch(function () {
        progress.hide();
      });
  });

  clearBtn.addEventListener("click", reset);
  [pageSizeEl, marginEl, borderEl].forEach(function (input) {
    input.addEventListener("change", renderPreview);
  });
  FT.$$('input[name="orientation"], input[name="fit-mode"]').forEach(function (radio) {
    radio.addEventListener("change", renderPreview);
  });
})();
