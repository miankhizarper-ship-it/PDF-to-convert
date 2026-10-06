/* ==========================================================================
   merge-pdf.js — join PDFs in any order with pdf-lib
   Pages are copied (not re-rendered), so text stays selectable.
   ========================================================================== */
(function () {
  "use strict";

  var FT = window.FT;
  var tool = FT.initPage({ slug: "merge-pdf" });

  var dropzoneMount = FT.$('[data-component="dropzone"]');
  var primaryBtn = FT.$("#primary-action");
  var clearBtn = FT.$("#clear-action");
  var progress = FT.createProgress(FT.$("#progress"));
  var loader = FT.createLoader(FT.$("#loader"));
  var resultEl = FT.$("#result");
  var summary = FT.$("#merge-summary");
  var titleEl = FT.$("#doc-title");
  var authorEl = FT.$("#doc-author");

  var pageCounts = Object.create(null);

  /* ---- Page counting ---------------------------------------------------- */
  function countPages(entry) {
    var PDFLib = FT.requireLib("PDFLib");
    return FT.readFileAsArrayBuffer(entry.file).then(function (buffer) {
      return PDFLib.PDFDocument.load(buffer, { updateMetadata: false }).then(function (doc) {
        return doc.getPageCount();
      });
    });
  }

  function updateSummary() {
    var entries = uploader.entries;
    var known = entries.filter(function (entry) {
      return typeof pageCounts[entry.id] === "number";
    });
    var total = known.reduce(function (sum, entry) {
      return sum + pageCounts[entry.id];
    }, 0);
    if (!entries.length) {
      summary.textContent = "";
      return;
    }
    summary.textContent =
      entries.length +
      " file" +
      (entries.length === 1 ? "" : "s") +
      (known.length === entries.length
        ? " · " + total + " page" + (total === 1 ? "" : "s") + " in the merged document"
        : " · counting pages…");
  }

  /* ---- Merge ------------------------------------------------------------ */
  function merge(reportProgress) {
    var PDFLib = FT.requireLib("PDFLib");
    var entries = uploader.entries;

    return PDFLib.PDFDocument.create().then(function (merged) {
      return entries
        .reduce(function (chain, entry, index) {
          return chain.then(function () {
            reportProgress((index / entries.length) * 90, "Merging " + entry.name);
            return FT.readFileAsArrayBuffer(entry.file).then(function (buffer) {
              return PDFLib.PDFDocument.load(buffer, { updateMetadata: false }).then(function (doc) {
                return merged.copyPages(doc, doc.getPageIndices()).then(function (pages) {
                  pages.forEach(function (page) {
                    merged.addPage(page);
                  });
                  return FT.yield();
                });
              });
            });
          });
        }, Promise.resolve())
        .then(function () {
          var title = titleEl.value.trim();
          var author = authorEl.value.trim();
          if (title) merged.setTitle(title);
          if (author) merged.setAuthor(author);
          merged.setProducer("FileTools (in-browser)");
          merged.setCreator("FileTools Merge PDF");
          merged.setModificationDate(new Date());
          reportProgress(95, "Saving");
          return merged.save({ useObjectStreams: true });
        })
        .then(function (bytes) {
          var blob = new Blob([bytes], { type: "application/pdf" });
          var name = "merged-" + entries.length + "-files.pdf";
          FT.downloadBlob(blob, name);
          return { name: name, size: blob.size, pages: merged.getPageCount(), files: entries.length };
        });
    });
  }

  /* ---- Result / reset --------------------------------------------------- */
  function showResult(info) {
    progress.hide();
    FT.renderResult(resultEl, {
      title: "PDFs merged",
      text: info.name + " combines " + info.files + " files into " + info.pages + " pages.",
      stats: [
        { value: info.files, label: "Files" },
        { value: info.pages, label: "Pages" },
        { value: FT.formatBytes(info.size), label: "File size" },
      ],
      actions: [
        { label: "Merge other files", variant: "btn--ghost", icon: FT.icons.restart, onClick: reset },
      ],
    });
    FT.toast("Merged PDF downloaded", "success", info.pages + " pages · " + FT.formatBytes(info.size));
  }

  function reset() {
    pageCounts = Object.create(null);
    uploader.clear();
    FT.hideResult(resultEl);
    progress.hide();
    updateSummary();
  }

  /* ---- Wiring ----------------------------------------------------------- */
  var uploader = FT.createUploader(dropzoneMount, {
    accept: tool.accept,
    maxSizeMB: tool.maxFileMB,
    multiple: true,
    reorderable: true,
    title: "Drop your PDFs here",
    hint: "Two or more PDF files · up to 100 MB each",
    iconHtml: FT.icons.file,
    readyMessage: "Drag the rows to set the final page order.",
    onRenderList: function (entries, listEl) {
      FT.$$(".file-item", listEl).forEach(function (item) {
        var id = item.getAttribute("data-id");
        var sub = FT.$(".file-item__sub", item);
        if (sub && typeof pageCounts[id] === "number") {
          sub.textContent += " · " + pageCounts[id] + " page" + (pageCounts[id] === 1 ? "" : "s");
        }
      });
    },
    onFiles: function (entries) {
      FT.hideResult(resultEl);
      primaryBtn.disabled = entries.length < 2;
      updateSummary();
      if (entries.length) countAllPages(entries);
    },
    onReorder: updateSummary,
    onRemove: updateSummary,
  });

  function countAllPages(entries) {
    entries.forEach(function (entry) {
      if (typeof pageCounts[entry.id] === "number") return;
      countPages(entry)
        .then(function (count) {
          pageCounts[entry.id] = count;
          uploader.refresh();
          updateSummary();
        })
        .catch(function () {
          /* A file we cannot read is reported when the user tries to merge. */
          updateSummary();
        });
    });
  }

  primaryBtn.addEventListener("click", function () {
    if (uploader.count < 2) {
      FT.toast("Add at least two PDFs", "warning", "A merge needs two or more files.");
      return;
    }
    FT.hideResult(resultEl);
    FT.runTask({
      label: "Merging PDFs",
      controls: [primaryBtn, clearBtn],
      progress: progress,
      loader: loader,
      successMessage: "Merged PDF downloaded.",
      work: function (ctx) {
        ctx.progress(2, "Reading files");
        return FT.yield().then(function () {
          return merge(ctx.progress);
        });
      },
    })
      .then(showResult)
      .catch(function () {
        progress.hide();
      });
  });

  clearBtn.addEventListener("click", reset);
})();
