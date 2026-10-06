/* ==========================================================================
   image-converter.js — bulk JPG / PNG / WEBP conversion on a canvas
   Transparency is flattened onto a chosen background for JPG output.
   ========================================================================== */
(function () {
  "use strict";

  var FT = window.FT;
  var tool = FT.initPage({ slug: "image-converter" });

  var dropzoneMount = FT.$('[data-component="dropzone"]');
  var primaryBtn = FT.$("#primary-action");
  var clearBtn = FT.$("#clear-action");
  var zipBtn = FT.$("#download-zip");
  var progress = FT.createProgress(FT.$("#progress"));
  var loader = FT.createLoader(FT.$("#loader"));
  var resultEl = FT.$("#result");
  var maxWidthEl = FT.$("#max-width");
  var backgroundEl = FT.$("#background");
  var qualityEl = FT.$("#quality");
  var qualityOut = FT.$("#quality-value");
  var previewBody = FT.$("#preview-body");

  var results = [];

  FT.bindRange(qualityEl, qualityOut, function (v) {
    return v + "%";
  });

  function targetFormat() {
    var checked = FT.$('input[name="format"]:checked');
    return checked ? checked.value : "jpg";
  }

  function targetMime() {
    return { jpg: "image/jpeg", png: "image/png", webp: "image/webp" }[targetFormat()] || "image/jpeg";
  }

  function updateQualityEnabled() {
    var lossless = targetFormat() === "png";
    qualityEl.disabled = lossless;
    qualityEl.closest(".field").style.opacity = lossless ? "0.5" : "1";
  }

  /* ---- Conversion ------------------------------------------------------- */
  function convertOne(entry) {
    var mime = targetMime();
    var quality = mime === "image/png" ? undefined : Number(qualityEl.value) / 100;
    var maxWidth = Number(maxWidthEl.value) || 0;

    return FT.loadImage(entry.file).then(function (loaded) {
      var canvas = FT.drawImageToCanvas(loaded.image, {
        mode: "contain",
        maxWidth: maxWidth,
        background: mime === "image/jpeg" ? backgroundEl.value : null,
      });
      return FT.canvasToBlob(canvas, mime, quality).then(function (blob) {
        FT.revokeObjectURL(loaded.url);
        /* Safari and others silently fall back to PNG when WEBP is missing. */
        var actualMime = blob.type || mime;
        return {
          name: FT.safeFileName(FT.baseName(entry.name), "image") + "." + FT.mimeExtension(actualMime),
          blob: blob,
          before: entry.file.size,
          width: canvas.width,
          height: canvas.height,
          previewUrl: FT.createObjectURL(blob),
        };
      });
    });
  }

  /* ---- Results ---------------------------------------------------------- */
  function clearResults() {
    results.forEach(function (result) {
      FT.revokeObjectURL(result.previewUrl);
    });
    results = [];
  }

  function renderResults() {
    previewBody.innerHTML = "";
    if (!results.length) {
      previewBody.innerHTML =
        "<p class='muted center'>Converted images appear here with their new size and a download button.</p>";
      zipBtn.disabled = true;
      return;
    }
    var grid = FT.el("div", { class: "tiles" });
    results.forEach(function (result) {
      var tile = FT.el("div", { class: "tile" });
      tile.appendChild(
        FT.el("img", {
          class: "tile__img",
          src: result.previewUrl,
          alt: "Converted preview of " + result.name,
          loading: "lazy",
        })
      );
      tile.appendChild(FT.el("p", { class: "tile__name", text: result.name }));
      tile.appendChild(
        FT.el("p", {
          class: "tile__sub",
          text: result.width + " × " + result.height + " px · " + FT.formatBytes(result.blob.size),
        })
      );
      tile.appendChild(
        FT.el("span", {
          class: "file-item__badge file-item__badge--saved",
          text: FT.extension(result.name).toUpperCase(),
        })
      );
      var actions = FT.el("div", { class: "tile__actions" });
      var download = FT.el("button", {
        class: "mini-btn",
        type: "button",
        "aria-label": "Download " + result.name,
        html: FT.icons.download,
      });
      download.addEventListener("click", function () {
        FT.downloadBlob(result.blob, result.name);
      });
      actions.appendChild(download);
      tile.appendChild(actions);
      grid.appendChild(tile);
    });
    previewBody.appendChild(grid);
    zipBtn.disabled = results.length < 2;
  }

  function downloadZip() {
    if (results.length < 2) return;
    var JSZip = FT.requireLib("JSZip");
    var zip = new JSZip();
    results.forEach(function (result) {
      zip.file(result.name, result.blob);
    });
    FT.runTask({
      label: "Zipping images",
      controls: [primaryBtn, clearBtn, zipBtn],
      progress: progress,
      loader: loader,
      successMessage: "ZIP downloaded.",
      work: function () {
        return zip.generateAsync({ type: "blob", compression: "STORE" }, function (meta) {
          progress.set(meta.percent, "Compressing");
        }).then(function (blob) {
          FT.downloadBlob(blob, "converted-images.zip");
          return blob.size;
        });
      },
    })
      .then(function (size) {
        progress.hide();
        FT.toast("ZIP downloaded", "success", FT.formatBytes(size));
      })
      .catch(function () {
        progress.hide();
      });
  }

  /* ---- Result / reset --------------------------------------------------- */
  function showResult(info) {
    progress.hide();
    var actions = [];
    if (info.count > 1) {
      actions.push({ label: "Download ZIP", variant: "btn--primary", icon: FT.icons.zip, onClick: downloadZip });
    }
    actions.push({ label: "Convert more", variant: "btn--ghost", icon: FT.icons.restart, onClick: reset });

    FT.renderResult(resultEl, {
      title: "Conversion complete",
      text: info.count + " image" + (info.count === 1 ? "" : "s") + " converted to " + info.format.toUpperCase() + ".",
      stats: [
        { value: info.count, label: info.count === 1 ? "Image" : "Images" },
        { value: FT.formatBytes(info.total), label: "Total size" },
      ],
      actions: actions,
    });
    FT.toast("Converted", "success", info.count + " × " + info.format.toUpperCase());
  }

  function reset() {
    clearResults();
    uploader.clear();
    FT.hideResult(resultEl);
    progress.hide();
    renderResults();
  }

  /* ---- Wiring ----------------------------------------------------------- */
  var uploader = FT.createUploader(dropzoneMount, {
    accept: tool.accept,
    maxSizeMB: tool.maxFileMB,
    multiple: true,
    title: "Drop your images here",
    hint: "JPG, PNG, WEBP, GIF or BMP · up to 50 MB each",
    iconHtml: FT.icons.image,
    readyMessage: "Pick a target format, then convert.",
    onFiles: function (entries) {
      FT.hideResult(resultEl);
      primaryBtn.disabled = entries.length === 0;
      clearResults();
      renderResults();
    },
  });

  primaryBtn.addEventListener("click", function () {
    var entries = uploader.entries;
    if (!entries.length) {
      FT.toast("Add at least one image", "warning");
      return;
    }
    var mime = targetMime();
    if (mime === "image/webp" && !FT.supportsMime("image/webp")) {
      FT.toast(
        "WEBP is not supported here",
        "error",
        "This browser cannot encode WEBP. Choose PNG or JPG instead."
      );
      return;
    }

    FT.hideResult(resultEl);
    clearResults();
    renderResults();

    FT.runTask({
      label: "Converting images",
      controls: [primaryBtn, clearBtn, zipBtn],
      progress: progress,
      loader: loader,
      successMessage: "All images converted.",
      work: function (ctx) {
        return entries
          .reduce(function (chain, entry, index) {
            return chain.then(function () {
              ctx.progress((index / entries.length) * 100, entry.name);
              return convertOne(entry).then(function (result) {
                results.push(result);
                renderResults();
                return FT.yield();
              });
            });
          }, Promise.resolve())
          .then(function () {
            ctx.progress(100, "Done");
            return {
              count: results.length,
              format: targetFormat(),
              total: results.reduce(function (sum, r) {
                return sum + r.blob.size;
              }, 0),
            };
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
  updateQualityEnabled();
})();
