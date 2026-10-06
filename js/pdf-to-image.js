/* ==========================================================================
   pdf-to-image.js — PDF pages → PNG / JPG with pdf.js (+ JSZip for batches)
   Rendering happens page by page so the interface never freezes.
   ========================================================================== */
(function () {
  "use strict";

  var FT = window.FT;
  var tool = FT.initPage({ slug: "pdf-to-image" });

  var dropzoneMount = FT.$('[data-component="dropzone"]');
  var primaryBtn = FT.$("#primary-action");
  var clearBtn = FT.$("#clear-action");
  var zipBtn = FT.$("#download-zip");
  var progress = FT.createProgress(FT.$("#progress"));
  var loader = FT.createLoader(FT.$("#loader"));
  var resultEl = FT.$("#result");
  var pageInfo = FT.$("#page-info");
  var scaleEl = FT.$("#scale");
  var rangeEl = FT.$("#page-range");
  var qualityEl = FT.$("#quality");
  var qualityOut = FT.$("#quality-value");
  var previewBody = FT.$("#preview-body");
  var pagesActions = FT.$("#pages-actions");

  var state = { pdf: null, numPages: 0, fileName: "", outputs: [] };

  FT.bindRange(qualityEl, qualityOut, function (v) {
    return v + "%";
  });
  updateQualityEnabled();

  function selectedFormat() {
    var checked = FT.$('input[name="format"]:checked');
    return checked ? checked.value : "png";
  }

  function updateQualityEnabled() {
    var isJpg = selectedFormat() === "jpg";
    qualityEl.disabled = !isJpg;
    qualityEl.closest(".field").style.opacity = isJpg ? "1" : "0.5";
  }

  /* ---- Loading ---------------------------------------------------------- */
  function loadPdf(entry) {
    var pdfjsLib = FT.requireLib("pdfjsLib");
    return FT.readFileAsArrayBuffer(entry.file).then(function (buffer) {
      return pdfjsLib.getDocument({ data: new Uint8Array(buffer) }).promise;
    });
  }

  /* ---- Rendering -------------------------------------------------------- */
  function renderPage(pageNumber) {
    var scale = Number(scaleEl.value) || 2;
    return state.pdf.getPage(pageNumber).then(function (page) {
      var viewport = page.getViewport({ scale: scale });
      var canvas = document.createElement("canvas");
      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);
      var context = canvas.getContext("2d", { alpha: false });
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, canvas.width, canvas.height);
      return page.render({ canvasContext: context, viewport: viewport }).promise.then(function () {
        var mime = selectedFormat() === "png" ? "image/png" : "image/jpeg";
        var quality = selectedFormat() === "png" ? undefined : Number(qualityEl.value) / 100;
        return FT.canvasToBlob(canvas, mime, quality).then(function (blob) {
          return {
            page: pageNumber,
            blob: blob,
            width: canvas.width,
            height: canvas.height,
            name:
              FT.safeFileName(FT.baseName(state.fileName), "page") +
              "-page-" +
              String(pageNumber).padStart(3, "0") +
              "." +
              (selectedFormat() === "png" ? "png" : "jpg"),
          };
        });
      });
    });
  }

  function targetPages() {
    var raw = rangeEl.value.trim();
    if (!raw) {
      var all = [];
      for (var i = 1; i <= state.numPages; i++) all.push(i);
      return all;
    }
    return FT.parsePageRanges(raw, state.numPages);
  }

  /* ---- Output list ------------------------------------------------------ */
  function clearOutputs() {
    state.outputs.forEach(function (output) {
      if (output.url) FT.revokeObjectURL(output.url);
    });
    state.outputs = [];
  }

  function renderOutputs() {
    previewBody.innerHTML = "";
    if (!state.outputs.length) {
      previewBody.innerHTML = "<p class='muted center'>Rendered pages appear here with their own download buttons.</p>";
      pagesActions.hidden = true;
      return;
    }
    var grid = FT.el("div", { class: "tiles" });
    state.outputs.forEach(function (output) {
      var tile = FT.el("div", { class: "tile" });
      var img = FT.el("img", {
        class: "tile__img",
        src: output.url,
        alt: "Page " + output.page,
        loading: "lazy",
      });
      var name = FT.el("p", { class: "tile__name", text: "Page " + output.page });
      var sub = FT.el("p", {
        class: "tile__sub",
        text: output.width + " × " + output.height + " px · " + FT.formatBytes(output.blob.size),
      });
      var actions = FT.el("div", { class: "tile__actions" });
      var download = FT.el("button", {
        class: "mini-btn",
        type: "button",
        "aria-label": "Download page " + output.page,
        html: FT.icons.download,
      });
      download.addEventListener("click", function () {
        FT.downloadBlob(output.blob, output.name);
      });
      actions.appendChild(download);
      tile.appendChild(img);
      tile.appendChild(name);
      tile.appendChild(sub);
      tile.appendChild(actions);
      grid.appendChild(tile);
    });
    previewBody.appendChild(grid);
    pagesActions.hidden = false;
  }

  /* ---- ZIP -------------------------------------------------------------- */
  function downloadZip() {
    var JSZip = FT.requireLib("JSZip");
    var zip = new JSZip();
    state.outputs.forEach(function (output) {
      zip.file(output.name, output.blob);
    });
    FT.runTask({
      label: "Zipping pages",
      controls: [primaryBtn, clearBtn, zipBtn],
      progress: progress,
      loader: loader,
      successMessage: "ZIP downloaded.",
      work: function () {
        return zip
          .generateAsync({ type: "blob", compression: "STORE" }, function (meta) {
            progress.set(meta.percent, "Compressing");
          })
          .then(function (blob) {
            var name = FT.safeFileName(FT.baseName(state.fileName), "pages") + "-images.zip";
            FT.downloadBlob(blob, name);
            return { name: name, size: blob.size };
          });
      },
    })
      .then(function (info) {
        progress.hide();
        FT.toast("ZIP downloaded", "success", info.name + " · " + FT.formatBytes(info.size));
      })
      .catch(function () {
        progress.hide();
      });
  }

  /* ---- Result / reset --------------------------------------------------- */
  function showResult(info) {
    progress.hide();
    FT.renderResult(resultEl, {
      title: "Pages exported",
      text: info.pages + " page" + (info.pages === 1 ? "" : "s") + " rendered at " + info.sizeLabel + ".",
      stats: [
        { value: info.pages, label: info.pages === 1 ? "Image" : "Images" },
        { value: FT.formatBytes(info.total), label: "Total size" },
      ],
      actions: [
        {
          label: "Download all as ZIP",
          variant: "btn--primary",
          icon: FT.icons.zip,
          onClick: downloadZip,
        },
        { label: "Convert another PDF", variant: "btn--ghost", icon: FT.icons.restart, onClick: reset },
      ],
    });
    FT.toast("Images ready", "success", info.pages + " pages exported");
  }

  function reset() {
    clearOutputs();
    if (state.pdf && state.pdf.destroy) state.pdf.destroy();
    state = { pdf: null, numPages: 0, fileName: "", outputs: [] };
    uploader.clear();
    pageInfo.hidden = true;
    primaryBtn.disabled = true;
    FT.hideResult(resultEl);
    progress.hide();
    renderOutputs();
  }

  /* ---- Wiring ----------------------------------------------------------- */
  var uploader = FT.createUploader(dropzoneMount, {
    accept: tool.accept,
    maxSizeMB: tool.maxFileMB,
    multiple: false,
    title: "Drop your PDF here",
    hint: ".pdf up to 100 MB · rendered locally, never uploaded",
    iconHtml: FT.icons.file,
    readyMessage: "PDF loaded. Choose a format and convert.",
    onFiles: function (entries) {
      FT.hideResult(resultEl);
      clearOutputs();
      renderOutputs();
      primaryBtn.disabled = true;
      pageInfo.hidden = true;
      if (!entries.length) {
        state.pdf = null;
        return;
      }
      open(entries[0]);
    },
  });

  function open(entry) {
    FT.runTask({
      label: "Opening PDF",
      controls: [primaryBtn, clearBtn],
      progress: progress,
      loader: loader,
      successMessage: "PDF opened.",
      work: function () {
        return FT.yield().then(function () {
          return loadPdf(entry);
        });
      },
    })
      .then(function (pdf) {
        progress.hide();
        state.pdf = pdf;
        state.numPages = pdf.numPages;
        state.fileName = entry.name;
        pageInfo.hidden = false;
        pageInfo.textContent = entry.name + " · " + pdf.numPages + " page" + (pdf.numPages === 1 ? "" : "s");
        primaryBtn.disabled = false;
      })
      .catch(function () {
        progress.hide();
      });
  }

  primaryBtn.addEventListener("click", function () {
    if (!state.pdf) {
      FT.toast("Add a PDF first", "warning");
      return;
    }
    var pages;
    try {
      pages = targetPages();
    } catch (error) {
      FT.toast("Check the page range", "error", FT.friendlyError(error));
      return;
    }

    FT.hideResult(resultEl);
    clearOutputs();
    renderOutputs();

    var sizeLabel = scaleEl.options[scaleEl.selectedIndex].text;

    FT.runTask({
      label: "Rendering pages",
      controls: [primaryBtn, clearBtn, zipBtn],
      progress: progress,
      loader: loader,
      successMessage: "All pages rendered.",
      work: function (ctx) {
        return pages
          .reduce(function (chain, pageNumber, index) {
            return chain.then(function () {
              ctx.progress(((index + 0.2) / pages.length) * 100, "Page " + pageNumber + " of " + pages[pages.length - 1]);
              return renderPage(pageNumber).then(function (output) {
                output.url = FT.createObjectURL(output.blob);
                state.outputs.push(output);
                renderOutputs();
                ctx.progress(((index + 1) / pages.length) * 100, "Page " + pageNumber + " done");
                return FT.yield();
              });
            });
          }, Promise.resolve())
          .then(function () {
            var total = state.outputs.reduce(function (sum, output) {
              return sum + output.blob.size;
            }, 0);
            return { pages: state.outputs.length, total: total, sizeLabel: sizeLabel };
          });
      },
    })
      .then(showResult)
      .catch(function () {
        progress.hide();
      });
  });

  zipBtn.addEventListener("click", downloadZip);
  clearBtn.addEventListener("click", reset);
  FT.$$('input[name="format"]').forEach(function (radio) {
    radio.addEventListener("change", updateQualityEnabled);
  });
})();
