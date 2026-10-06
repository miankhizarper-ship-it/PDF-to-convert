/* ==========================================================================
   excel-to-pdf.js — XLSX / XLS / CSV → PDF table
   SheetJS reads the workbook, jsPDF + AutoTable draw the tables.
   ========================================================================== */
(function () {
  "use strict";

  var FT = window.FT;
  var tool = FT.initPage({ slug: "excel-to-pdf" });

  var dropzoneMount = FT.$('[data-component="dropzone"]');
  var primaryBtn = FT.$("#primary-action");
  var clearBtn = FT.$("#clear-action");
  var progress = FT.createProgress(FT.$("#progress"));
  var loader = FT.createLoader(FT.$("#loader"));
  var resultEl = FT.$("#result");
  var sheetField = FT.$("#sheet-field");
  var sheetTabs = FT.$("#sheet-tabs");
  var previewBody = FT.$("#preview-body");
  var previewCaption = FT.$("#preview-caption");
  var pageSizeEl = FT.$("#page-size");
  var headerStyleEl = FT.$("#header-style");
  var fontSizeEl = FT.$("#font-size");
  var fontSizeOut = FT.$("#font-size-value");
  var gridlinesEl = FT.$("#gridlines");
  var fitWidthEl = FT.$("#fit-width");

  var PAGE_SIZES = {
    a4: [595.28, 841.89],
    letter: [612, 792],
    legal: [612, 1008],
  };
  var MARGIN_PT = 34;
  var PREVIEW_ROWS = 60;
  var PREVIEW_COLS = 40;

  var state = { workbook: null, rowsBySheet: {}, activeSheet: "__all__", fileName: "" };

  FT.bindRange(fontSizeEl, fontSizeOut, function (v) {
    return v + " pt";
  });

  /* ---- Reading ---------------------------------------------------------- */
  function readWorkbook(entry) {
    var XLSX = FT.requireLib("XLSX");
    var isCsv = /\.csv$/i.test(entry.name);
    var read = isCsv
      ? FT.readFileAsText(entry.file).then(function (text) {
          return XLSX.read(text, { type: "string", raw: false });
        })
      : FT.readFileAsArrayBuffer(entry.file).then(function (buffer) {
          return XLSX.read(new Uint8Array(buffer), { type: "array", cellDates: true, raw: false });
        });

    return read.then(function (workbook) {
      var rowsBySheet = {};
      workbook.SheetNames.forEach(function (name) {
        rowsBySheet[name] = XLSX.utils.sheet_to_json(workbook.Sheets[name], {
          header: 1,
          blankrows: false,
          defval: "",
          raw: false,
        }).map(function (row) {
          return row.map(cellText);
        });
      });
      return { workbook: workbook, rowsBySheet: rowsBySheet };
    });
  }

  function cellText(value) {
    if (value === null || value === undefined) return "";
    if (value instanceof Date) return isNaN(value.getTime()) ? "" : value.toISOString().slice(0, 10);
    if (typeof value === "number") {
      return Number.isInteger(value) ? String(value) : String(Math.round(value * 1e6) / 1e6);
    }
    return String(value);
  }

  /* ---- Sheet selector --------------------------------------------------- */
  function renderSheetTabs() {
    var names = Object.keys(state.rowsBySheet);
    sheetField.hidden = names.length === 0;
    sheetTabs.innerHTML = "";
    if (names.length > 1) {
      sheetTabs.appendChild(makeTab("__all__", "All sheets (" + names.length + ")", names.length));
    }
    names.forEach(function (name) {
      var rows = state.rowsBySheet[name].length;
      sheetTabs.appendChild(makeTab(name, name, rows));
    });
  }

  function makeTab(id, label, count) {
    var button = FT.el("button", {
      class: "sheet-tab",
      type: "button",
      "data-sheet": id,
      "aria-pressed": state.activeSheet === id ? "true" : "false",
    });
    button.innerHTML = "<span></span><span class='sheet-tab__count'></span>";
    FT.$$("span", button)[0].textContent = label;
    FT.$$(".sheet-tab__count", button)[0].textContent = count + (count === 1 ? " row" : " rows");
    button.addEventListener("click", function () {
      state.activeSheet = id;
      FT.$$(".sheet-tab", sheetTabs).forEach(function (tab) {
        tab.setAttribute("aria-pressed", tab.getAttribute("data-sheet") === id ? "true" : "false");
      });
      renderPreview();
    });
    return button;
  }

  function selectedSheets() {
    if (state.activeSheet === "__all__") return Object.keys(state.rowsBySheet);
    return [state.activeSheet];
  }

  /* ---- Preview ---------------------------------------------------------- */
  function renderPreview() {
    var name = state.activeSheet === "__all__" ? Object.keys(state.rowsBySheet)[0] : state.activeSheet;
    var rows = state.rowsBySheet[name] || [];
    previewCaption.textContent = name + " · first " + Math.min(rows.length, PREVIEW_ROWS) + " rows";

    if (!rows.length) {
      previewBody.innerHTML = "<p class='muted center'>That sheet is empty.</p>";
      return;
    }

    var widest = rows.reduce(function (max, row) {
      return Math.max(max, row.length);
    }, 0);
    var colCount = Math.min(widest, PREVIEW_COLS);

    var table = FT.el("table", { class: "data-table" });
    var head = FT.el("thead");
    var headRow = FT.el("tr");
    headRow.appendChild(FT.el("th", { class: "data-table__rowhead", scope: "col", text: "#" }));
    for (var h = 0; h < colCount; h++) {
      var header = rows[0] && rows[0][h] !== undefined ? rows[0][h] : "";
      headRow.appendChild(FT.el("th", { scope: "col", text: header === "" ? columnLabel(h) : header }));
    }
    head.appendChild(headRow);
    table.appendChild(head);

    var body = FT.el("tbody");
    rows.slice(0, PREVIEW_ROWS).forEach(function (row, rowIndex) {
      var tr = FT.el("tr");
      tr.appendChild(FT.el("td", { class: "data-table__rowhead", text: String(rowIndex + 1) }));
      for (var c = 0; c < colCount; c++) {
        var value = row[c] === undefined ? "" : row[c];
        var td = FT.el("td", { text: value });
        if (value !== "" && !isNaN(Number(value))) td.className = "is-number";
        tr.appendChild(td);
      }
      body.appendChild(tr);
    });
    table.appendChild(body);

    var wrap = FT.el("div", { class: "data-table-wrap" }, [table]);
    wrap.style.border = "0";
    wrap.style.maxHeight = "none";
    previewBody.innerHTML = "";
    previewBody.appendChild(wrap);
  }

  function columnLabel(index) {
    var label = "";
    var n = index;
    do {
      label = String.fromCharCode(65 + (n % 26)) + label;
      n = Math.floor(n / 26) - 1;
    } while (n >= 0);
    return label;
  }

  /* ---- Layout planning -------------------------------------------------- */
  function usableWidth() {
    var size = PAGE_SIZES[pageSizeEl.value] || PAGE_SIZES.a4;
    var orientation = FT.$('input[name="orientation"]:checked').value;
    var width = orientation === "landscape" ? size[1] : size[0];
    return width - MARGIN_PT * 2;
  }

  /** Estimate how wide each column needs to be at a given font size. */
  function columnWidths(rows, fontSize) {
    var columns = rows.reduce(function (max, row) {
      return Math.max(max, row.length);
    }, 0);
    var widths = [];
    for (var c = 0; c < columns; c++) {
      var longest = 1;
      for (var r = 0; r < rows.length; r++) {
        var cell = rows[r][c];
        if (cell === undefined) continue;
        longest = Math.max(longest, Math.min(String(cell).length, 32));
        if (r > 400) break; /* sample the first rows for very large sheets */
      }
      widths.push(longest * fontSize * 0.52 + 8);
    }
    return widths;
  }

  /** Group columns so each group fits the printable width. */
  function groupColumns(widths, maxWidth) {
    var groups = [];
    var current = [];
    var total = 0;
    widths.forEach(function (width, index) {
      var candidate = Math.min(width, maxWidth);
      if (current.length && total + candidate > maxWidth) {
        groups.push(current);
        current = [];
        total = 0;
      }
      current.push(index);
      total += candidate;
    });
    if (current.length) groups.push(current);
    return groups.length ? groups : [[0]];
  }

  /* ---- PDF building ----------------------------------------------------- */
  function buildPdf() {
    var jsPDF = FT.requireLib("jspdf").jsPDF;
    var orientation = FT.$('input[name="orientation"]:checked').value;
    var doc = new jsPDF({
      unit: "pt",
      format: pageSizeEl.value,
      orientation: orientation,
      compress: true,
    });

    var sheets = selectedSheets();
    var width = usableWidth();
    var requestedSize = Number(fontSizeEl.value) || 10;
    var pageWidth = orientation === "landscape"
      ? (PAGE_SIZES[pageSizeEl.value] || PAGE_SIZES.a4)[1]
      : (PAGE_SIZES[pageSizeEl.value] || PAGE_SIZES.a4)[0];
    var pageHeight = orientation === "landscape"
      ? (PAGE_SIZES[pageSizeEl.value] || PAGE_SIZES.a4)[0]
      : (PAGE_SIZES[pageSizeEl.value] || PAGE_SIZES.a4)[1];

    sheets.forEach(function (sheetName, sheetIndex) {
      var rows = (state.rowsBySheet[sheetName] || []).filter(function (row) {
        return row.some(function (cell) {
          return cell !== "";
        });
      });
      if (!rows.length) return;

      var fontSize = requestedSize;
      var widths = columnWidths(rows, fontSize);
      var groups = groupColumns(widths, width);

      if (fitWidthEl.checked && groups.length > 1) {
        for (var candidate = requestedSize; candidate >= 5; candidate -= 0.5) {
          widths = columnWidths(rows, candidate);
          groups = groupColumns(widths, width);
          if (groups.length === 1) {
            fontSize = candidate;
            break;
          }
          fontSize = candidate;
        }
      }

      var showSheetTitle = sheets.length > 1;
      var headerStyle = headerStyleEl.value;

      groups.forEach(function (group, groupIndex) {
        if (sheetIndex > 0 || groupIndex > 0) doc.addPage();
        var startY = MARGIN_PT;
        if (showSheetTitle) {
          doc.setFont("helvetica", "bold");
          doc.setFontSize(12);
          doc.setTextColor(31, 41, 55);
          var title = sheetName + (groups.length > 1 ? " · columns " + (group[0] + 1) + "-" + (group[group.length - 1] + 1) : "");
          doc.text(title, MARGIN_PT, MARGIN_PT);
          startY = MARGIN_PT + 16;
        }

        var head = headerStyle === "plain" ? [] : [group.map(function (i) {
          return rows[0][i] === undefined || rows[0][i] === "" ? columnLabel(i) : rows[0][i];
        })];
        var body = (headerStyle === "plain" ? rows : rows.slice(1)).map(function (row) {
          return group.map(function (i) {
            return row[i] === undefined ? "" : row[i];
          });
        });

        doc.autoTable({
          head: head,
          body: body,
          startY: startY,
          theme: gridlinesEl.checked ? "grid" : "plain",
          styles: {
            font: "helvetica",
            fontSize: fontSize,
            cellPadding: 3,
            overflow: "linebreak",
            textColor: [17, 24, 39],
            lineColor: [206, 212, 228],
            lineWidth: 0.5,
            valign: "top",
          },
          headStyles: headStylesFor(headerStyle),
          alternateRowStyles: gridlinesEl.checked ? { fillColor: [248, 249, 252] } : {},
          margin: { top: MARGIN_PT, right: MARGIN_PT, bottom: MARGIN_PT, left: MARGIN_PT },
          tableWidth: "auto",
          didDrawPage: function (data) {
            doc.setFont("helvetica", "normal");
            doc.setFontSize(8);
            doc.setTextColor(140);
            doc.text(
              "Page " + doc.getNumberOfPages(),
              pageWidth - MARGIN_PT,
              pageHeight - MARGIN_PT / 2,
              { align: "right" }
            );
            doc.text(state.fileName, MARGIN_PT, pageHeight - MARGIN_PT / 2);
          },
        });
      });
    });

    var outName = FT.safeFileName(FT.baseName(state.fileName), "spreadsheet") + ".pdf";
    var blob = doc.output("blob");
    FT.downloadBlob(blob, outName);
    return { name: outName, size: blob.size, pages: doc.getNumberOfPages(), sheets: sheets.length };
  }

  function headStylesFor(style) {
    if (style === "filled") {
      return { fillColor: [79, 70, 229], textColor: [255, 255, 255], fontStyle: "bold", lineWidth: 0 };
    }
    if (style === "outline") {
      return {
        fillColor: [241, 243, 250],
        textColor: [31, 41, 55],
        fontStyle: "bold",
        lineColor: [99, 102, 241],
        lineWidth: 0.7,
      };
    }
    return { fillColor: [255, 255, 255], textColor: [31, 41, 55], fontStyle: "bold", lineWidth: 0 };
  }

  /* ---- Result / reset --------------------------------------------------- */
  function showResult(info) {
    progress.hide();
    FT.renderResult(resultEl, {
      title: "PDF exported",
      text: info.name + " is in your downloads.",
      stats: [
        { value: info.pages, label: info.pages === 1 ? "Page" : "Pages" },
        { value: info.sheets, label: info.sheets === 1 ? "Sheet" : "Sheets" },
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
    FT.toast("PDF exported", "success", info.pages + " pages · " + FT.formatBytes(info.size));
  }

  function reset() {
    uploader.clear();
    state = { workbook: null, rowsBySheet: {}, activeSheet: "__all__", fileName: "" };
    sheetField.hidden = true;
    sheetTabs.innerHTML = "";
    previewBody.innerHTML = "<p class='muted center'>Upload a spreadsheet to see the first rows here.</p>";
    previewCaption.textContent = "Spreadsheet preview";
    primaryBtn.disabled = true;
    FT.hideResult(resultEl);
    progress.hide();
  }

  /* ---- Wiring ----------------------------------------------------------- */
  var uploader = FT.createUploader(dropzoneMount, {
    accept: tool.accept,
    maxSizeMB: tool.maxFileMB,
    multiple: false,
    title: "Drop your spreadsheet here",
    hint: ".xlsx, .xls or .csv up to 50 MB",
    iconHtml: FT.icons.file,
    readyMessage: "Reading the workbook…",
    onFiles: function (entries) {
      FT.hideResult(resultEl);
      primaryBtn.disabled = true;
      if (!entries.length) return;
      load(entries[0]);
    },
  });

  function load(entry) {
    FT.runTask({
      label: "Reading spreadsheet",
      controls: [primaryBtn, clearBtn],
      progress: progress,
      loader: loader,
      successMessage: "Workbook ready. Pick your sheets and export.",
      work: function () {
        return FT.yield().then(function () {
          return readWorkbook(entry);
        });
      },
    })
      .then(function (parsed) {
        progress.hide();
        if (!Object.keys(parsed.rowsBySheet).length) {
          FT.toast("Nothing to export", "warning", "That workbook has no readable sheets.");
          return;
        }
        state.workbook = parsed.workbook;
        state.rowsBySheet = parsed.rowsBySheet;
        state.fileName = entry.name;
        state.activeSheet = "__all__";
        renderSheetTabs();
        renderPreview();
        primaryBtn.disabled = false;
      })
      .catch(function () {
        progress.hide();
      });
  }

  primaryBtn.addEventListener("click", function () {
    if (!state.workbook) {
      FT.toast("Add a spreadsheet first", "warning");
      return;
    }
    FT.hideResult(resultEl);
    FT.runTask({
      label: "Building the PDF",
      controls: [primaryBtn, clearBtn],
      progress: progress,
      loader: loader,
      successMessage: "PDF exported.",
      work: function (ctx) {
        ctx.progress(15, "Laying out tables");
        return FT.yield().then(function () {
          var info = buildPdf();
          ctx.progress(100, "Done");
          return info;
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
