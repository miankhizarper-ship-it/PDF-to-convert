/* ==========================================================================
   compress-image.js — canvas re-encoding with a live size comparison
   If re-encoding makes a file bigger, the original is kept and labelled.
   ========================================================================== */
(function () {
  "use strict";

  var FT = window.FT;
  var tool = FT.initPage({ slug: "compress-image" });

  var dropzoneMount = FT.$('[data-component="dropzone"]');
  var primaryBtn = FT.$("#primary-action");
  var clearBtn = FT.$("#clear-action");
  var zipBtn = FT.$("#download-zip");
  var progress = FT.createProgress(FT.$("#progress"));
  var loader = FT.createLoader(FT.$("#loader"));
  var resultEl = FT.$("#result");
  var qualityEl = FT.$("#quality");
  var qualityOut = FT.$("#quality-value");
  var maxWidthEl = FT.$("#max-width");
  var maxHeightEl = FT.$("#max-height");
  var formatEl = FT.$("#output-format");
  var previewBody = FT.$("#preview-body");
  var totalsEl = FT.$("#totals");

  var results = [];

  FT.bindRange(qualityEl, qualityOut, function (v) {
    return v + "%";
  });

  /* ---- Compression ------------------------------------------------------ */
  function targetMime(entry) {
    var chosen = formatEl.value;
    if (chosen !== "keep") return chosen;
    if (entry.file.type === "image/png" || /\.png$/i.test(entry.name)) return "image/png";
    if (entry.file.type === "image/webp" || /\.webp$/i.test(entry.name)) return "image/webp";
    return "image/jpeg";
  }

  function compressOne(entry) {
    var mime = targetMime(entry);
    var quality = mime === "image/png" ? undefined : Number(qualityEl.value) / 100;
    var maxWidth = Number(maxWidthEl.value) || 0;
    var maxHeight = Number(maxHeightEl.value) || 0;

    return FT.loadImage(entry.file).then(function (loaded) {
      var canvas = FT.drawImageToCanvas(loaded.image, {
        mode: "contain",
        maxWidth: maxWidth,
        maxHeight: maxHeight,
        background: mime === "image/jpeg" ? "#ffffff" : null,
      });
      return FT.canvasToBlob(canvas, mime, quality).then(function (blob) {
        FT.revokeObjectURL(loaded.url);
        /* A compressor must never hand back a larger file, so when re-encoding
           does not help we keep the original bytes and say so. */
        var kept = blob.size >= entry.file.size;
        var output = kept ? entry.file : blob;
        return {
          id: entry.id,
          name: kept
            ? entry.name
            : FT.safeFileName(FT.baseName(entry.name), "image") + "." + FT.mimeExtension(mime),
          before: entry.file.size,
          after: output.size,
          blob: output,
          width: canvas.width,
          height: canvas.height,
          kept: kept,
          previewUrl: FT.createObjectURL(output),
        };
      });
    });
  }

  /* ---- Results ---------------------------------------------------------- */
  function clearResults() {
    results.forEach(function (result) {
      if (result.previewUrl) FT.revokeObjectURL(result.previewUrl);
    });
    results = [];
  }

  function renderResults() {
    previewBody.innerHTML = "";
    if (!results.length) {
      previewBody.innerHTML = "<p class='muted center'>Compressed images appear here with the space you saved.</p>";
      totalsEl.hidden = true;
      zipBtn.disabled = true;
      return;
    }

    var grid = FT.el("div", { class: "tiles" });
    results.forEach(function (result) {
      var saved = result.before - result.after;
      var percent = result.before ? Math.round((saved / result.before) * 100) : 0;

      var tile = FT.el("div", { class: "tile" });
      tile.appendChild(
        FT.el("img", {
          class: "tile__img",
          src: result.previewUrl,
          alt: "Compressed preview of " + result.name,
          loading: "lazy",
        })
      );
      tile.appendChild(FT.el("p", { class: "tile__name", text: result.name }));
      tile.appendChild(
        FT.el("p", {
          class: "tile__sub",
          text:
            FT.formatBytes(result.before) +
            " → " +
            FT.formatBytes(result.after) +
            (result.kept ? " · original kept" : " · " + result.width + "×" + result.height),
        })
      );
      tile.appendChild(
        FT.el("span", {
          class: "file-item__badge" + (result.kept ? "" : " file-item__badge--saved"),
          text: result.kept ? "0% saved" : percent + "% saved",
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

    var before = results.reduce(function (sum, r) {
      return sum + r.before;
    }, 0);
    var after = results.reduce(function (sum, r) {
      return sum + r.after;
    }, 0);
    var percent = before ? Math.round(((before - after) / before) * 100) : 0;

    totalsEl.hidden = false;
    totalsEl.innerHTML = "";
    [
      { value: FT.formatBytes(before), label: "Before" },
      { value: FT.formatBytes(after), label: "After" },
      { value: percent + "%", label: "Saved", kind: percent > 0 ? "good" : "" },
    ].forEach(function (stat) {
      totalsEl.appendChild(
        FT.el("div", { class: "stat" }, [
          FT.el("span", {
            class: "stat__value" + (stat.kind ? " stat__value--" + stat.kind : ""),
            text: stat.value,
          }),
          FT.el("span", { class: "stat__label", text: stat.label }),
        ])
      );
    });

    zipBtn.disabled = results.length < 2;
  }

  /* ---- ZIP -------------------------------------------------------------- */
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
        return zip
          .generateAsync({ type: "blob", compression: "STORE" }, function (meta) {
            progress.set(meta.percent, "Compressing");
          })
          .then(function (blob) {
            FT.downloadBlob(blob, "compressed-images.zip");
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
    actions.push({ label: "Compress others", variant: "btn--ghost", icon: FT.icons.restart, onClick: reset });

    FT.renderResult(resultEl, {
      title: "Images compressed",
      text: info.saved > 0 ? "Saved " + info.savedPercent + "% across " + info.count + " images." : "No size gain at these settings — the originals were kept.",
      stats: [
        { value: info.count, label: info.count === 1 ? "Image" : "Images" },
        { value: FT.formatBytes(info.after), label: "New size" },
        { value: info.savedPercent + "%", label: "Saved", kind: info.saved > 0 ? "good" : "" },
      ],
      actions: actions,
    });
    FT.toast("Compression finished", "success", info.savedPercent + "% saved");
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
    hint: "JPG, PNG or WEBP · up to 50 MB each",
    iconHtml: FT.icons.image,
    readyMessage: "Set the quality, then compress.",
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
    FT.hideResult(resultEl);
    clearResults();
    renderResults();

    FT.runTask({
      label: "Compressing images",
      controls: [primaryBtn, clearBtn, zipBtn],
      progress: progress,
      loader: loader,
      successMessage: "Compression finished.",
      work: function (ctx) {
        return entries
          .reduce(function (chain, entry, index) {
            return chain.then(function () {
              ctx.progress((index / entries.length) * 100, entry.name);
              return compressOne(entry).then(function (result) {
                results.push(result);
                renderResults();
                return FT.yield();
              });
            });
          }, Promise.resolve())
          .then(function () {
            ctx.progress(100, "Done");
            var before = results.reduce(function (sum, r) {
              return sum + r.before;
            }, 0);
            var after = results.reduce(function (sum, r) {
              return sum + r.after;
            }, 0);
            return {
              count: results.length,
              after: after,
              saved: before - after,
              savedPercent: before ? Math.round(((before - after) / before) * 100) : 0,
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
})();
