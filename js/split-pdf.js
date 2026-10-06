/* ==========================================================================
   split-pdf.js — extract ranges / split ranges / split every page (pdf-lib)
   Multiple outputs are bundled into a ZIP with JSZip.
   ========================================================================== */
(function () {
  "use strict";

  var FT = window.FT;
  var tool = FT.initPage({ slug: "split-pdf" });

  var dropzoneMount = FT.$('[data-component="dropzone"]');
  var primaryBtn = FT.$("#primary-action");
  var clearBtn = FT.$("#clear-action");
  var progress = FT.createProgress(FT.$("#progress"));
  var loader = FT.createLoader(FT.$("#loader"));
  var resultEl = FT.$("#result");
  var pageInfo = FT.$("#page-info");
  var rangeEl = FT.$("#page-range");
  var previewBody = FT.$("#preview-body");
  var previewCaption = FT.$("#preview-caption");

  var state = { bytes: null, numPages: 0, fileName: "" };

  /* ---- Options ---------------------------------------------------------- */
  function mode() {
    var checked = FT.$('input[name="split-mode"]:checked');
    return checked ? checked.value : "extract";
  }

  function allPages() {
    var pages = [];
    for (var i = 1; i <= state.numPages; i++) pages.push(i);
    return pages;
  }

  /** Groups of pages, one group per output file. */
  function plannedGroups() {
    if (mode() === "every") {
      return allPages().map(function (page) {
        return [page];
      });
    }
    var raw = rangeEl.value.trim();
    if (!raw) return [allPages()];
    if (mode() === "ranges") {
      return raw
        .split(/[,;]+/)
        .map(function (part) {
          return part.trim();
        })
        .filter(Boolean)
        .map(function (part) {
          return FT.parsePageRanges(part, state.numPages);
        });
    }
    return [FT.parsePageRanges(raw, state.numPages)];
  }

  /* ---- Preview ---------------------------------------------------------- */
  function renderSelection() {
    if (!state.numPages) {
      previewBody.innerHTML = "<p class='muted center'>Upload a PDF and pick pages to see what will be exported.</p>";
      previewCaption.textContent = "Selection";
      return;
    }

    var groups;
    try {
      groups = plannedGroups();
    } catch (error) {
      previewCaption.textContent = "Selection";
      previewBody.innerHTML = "";
      previewBody.appendChild(FT.el("p", { class: "muted", text: FT.friendlyError(error) }));
      return;
    }

    var flat = groups.reduce(function (all, group) {
      return all.concat(group);
    }, []);
    var fileWord = groups.length === 1 ? "1 file" : groups.length + " files";
    previewCaption.textContent = flat.length + " page" + (flat.length === 1 ? "" : "s") + " → " + fileWord;

    previewBody.innerHTML = "";
    var grid = FT.el("div", { class: "tiles" });
    groups.forEach(function (group, index) {
      var tile = FT.el("div", { class: "tile" });
      tile.appendChild(FT.el("span", { class: "tile__order", text: String(index + 1) }));
      var block = FT.el("div", { class: "tile__img" });
      block.style.display = "grid";
      block.style.placeItems = "center";
      block.style.fontSize = "1.5rem";
      block.style.fontWeight = "800";
      block.style.color = "var(--primary-strong)";
      block.textContent =
        group.length === 1 ? "p." + group[0] : "p." + group[0] + "–" + group[group.length - 1];
      tile.appendChild(block);
      tile.appendChild(
        FT.el("p", {
          class: "tile__name",
          text: group.length + " page" + (group.length === 1 ? "" : "s"),
        })
      );
      tile.appendChild(FT.el("p", { class: "tile__sub", text: group.join(", ") }));
      grid.appendChild(tile);
    });
    previewBody.appendChild(grid);
  }

  /* ---- Splitting -------------------------------------------------------- */
  function buildDocuments(groups, reportProgress) {
    var PDFLib = FT.requireLib("PDFLib");
    var base = FT.safeFileName(FT.baseName(state.fileName), "document");

    return groups
      .reduce(function (chain, group, index) {
        return chain.then(function (results) {
          reportProgress((index / groups.length) * 90, "File " + (index + 1) + " of " + groups.length);
          return PDFLib.PDFDocument.create().then(function (out) {
            return PDFLib.PDFDocument.load(state.bytes, { updateMetadata: false })
              .then(function (source) {
                /* copyPages must be called on the destination document, or the
                   pages stay "foreign" and addPage refuses them. */
                return out.copyPages(
                  source,
                  group.map(function (page) {
                    return page - 1;
                  })
                );
              })
              .then(function (pages) {
                pages.forEach(function (page) {
                  out.addPage(page);
                });
                return out.save({ useObjectStreams: true });
              })
              .then(function (bytes) {
                var label =
                  group.length === 1
                    ? "page-" + String(group[0]).padStart(3, "0")
                    : "pages-" + group[0] + "-" + group[group.length - 1];
                results.push({
                  name: base + "-" + (groups.length > 1 ? "part-" + (index + 1) + "-" : "") + label + ".pdf",
                  blob: new Blob([bytes], { type: "application/pdf" }),
                });
                return FT.yield().then(function () {
                  return results;
                });
              });
          });
        });
      }, Promise.resolve([]))
      .then(function (results) {
        return results;
      });
  }

  function deliver(results) {
    if (results.length === 1) {
      FT.downloadBlob(results[0].blob, results[0].name);
      return Promise.resolve({ files: 1, size: results[0].blob.size, name: results[0].name });
    }
    var JSZip = FT.requireLib("JSZip");
    var zip = new JSZip();
    results.forEach(function (result) {
      zip.file(result.name, result.blob);
    });
    var zipName = FT.safeFileName(FT.baseName(state.fileName), "document") + "-split.zip";
    return zip
      .generateAsync({ type: "blob", compression: "STORE" }, function (meta) {
        progress.set(90 + meta.percent / 10, "Zipping");
      })
      .then(function (blob) {
        FT.downloadBlob(blob, zipName);
        return { files: results.length, size: blob.size, name: zipName };
      });
  }

  /* ---- Result / reset --------------------------------------------------- */
  function showResult(info) {
    progress.hide();
    FT.renderResult(resultEl, {
      title: info.files === 1 ? "PDF ready" : "ZIP ready",
      text: info.name + " has been saved to your downloads.",
      stats: [
        { value: info.files, label: info.files === 1 ? "File" : "Files" },
        { value: FT.formatBytes(info.size), label: "Size" },
      ],
      actions: [
        { label: "Split another PDF", variant: "btn--ghost", icon: FT.icons.restart, onClick: reset },
      ],
    });
    FT.toast("Split complete", "success", info.files === 1 ? info.name : info.files + " files in " + info.name);
  }

  function reset() {
    state = { bytes: null, numPages: 0, fileName: "" };
    uploader.clear();
    rangeEl.value = "";
    pageInfo.hidden = true;
    primaryBtn.disabled = true;
    FT.hideResult(resultEl);
    progress.hide();
    renderSelection();
  }

  /* ---- Wiring ----------------------------------------------------------- */
  var uploader = FT.createUploader(dropzoneMount, {
    accept: tool.accept,
    maxSizeMB: tool.maxFileMB,
    multiple: false,
    title: "Drop your PDF here",
    hint: ".pdf up to 100 MB · nothing is uploaded",
    iconHtml: FT.icons.file,
    readyMessage: "Choose pages to export.",
    onFiles: function (entries) {
      FT.hideResult(resultEl);
      primaryBtn.disabled = true;
      pageInfo.hidden = true;
      state.bytes = null;
      state.numPages = 0;
      renderSelection();
      if (entries.length) open(entries[0]);
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
        var PDFLib = FT.requireLib("PDFLib");
        return FT.readFileAsArrayBuffer(entry.file)
          .then(function (buffer) {
            state.bytes = buffer;
            return PDFLib.PDFDocument.load(buffer, { updateMetadata: false });
          })
          .then(function (doc) {
            state.numPages = doc.getPageCount();
            state.fileName = entry.name;
          });
      },
    })
      .then(function () {
        progress.hide();
        pageInfo.hidden = false;
        pageInfo.textContent = entry.name + " · " + state.numPages + " page" + (state.numPages === 1 ? "" : "s");
        primaryBtn.disabled = false;
        renderSelection();
      })
      .catch(function () {
        progress.hide();
      });
  }

  primaryBtn.addEventListener("click", function () {
    if (!state.numPages) {
      FT.toast("Add a PDF first", "warning");
      return;
    }
    var groups;
    try {
      groups = plannedGroups();
      if (!groups.length || !groups[0].length) throw new Error("No pages selected.");
    } catch (error) {
      FT.toast("Check the page range", "error", FT.friendlyError(error));
      return;
    }

    FT.hideResult(resultEl);
    FT.runTask({
      label: "Splitting PDF",
      controls: [primaryBtn, clearBtn],
      progress: progress,
      loader: loader,
      successMessage: "Pages exported.",
      work: function (ctx) {
        ctx.progress(2, "Reading pages");
        return FT.yield()
          .then(function () {
            return buildDocuments(groups, ctx.progress);
          })
          .then(function (results) {
            ctx.progress(90, "Packaging");
            return deliver(results);
          });
      },
    })
      .then(showResult)
      .catch(function () {
        progress.hide();
      });
  });

  clearBtn.addEventListener("click", reset);
  rangeEl.addEventListener("input", FT.debounce(renderSelection, 150));
  FT.$$('input[name="split-mode"]').forEach(function (radio) {
    radio.addEventListener("change", function () {
      rangeEl.disabled = mode() === "every";
      renderSelection();
    });
  });
})();
