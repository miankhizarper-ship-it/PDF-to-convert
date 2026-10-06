/* ==========================================================================
   qr-generator.js — QR codes drawn locally with qrcode-generator
   Canvas for the PNG export, a hand-built SVG string for the vector export.
   ========================================================================== */
(function () {
  "use strict";

  var FT = window.FT;
  FT.initPage({ slug: "qr-generator" });

  var textEl = FT.$("#qr-text");
  var lengthEl = FT.$("#qr-length");
  var metaEl = FT.$("#qr-meta");
  var canvas = FT.$("#qr-canvas");
  var ecEl = FT.$("#ec-level");
  var fgEl = FT.$("#fg-color");
  var bgEl = FT.$("#bg-color");
  var sizeEl = FT.$("#qr-size");
  var sizeOut = FT.$("#qr-size-value");
  var marginEl = FT.$("#qr-margin");
  var marginOut = FT.$("#qr-margin-value");
  var pngBtn = FT.$("#primary-action");
  var svgBtn = FT.$("#download-svg");
  var copyBtn = FT.$("#copy-action");
  var clearBtn = FT.$("#clear-action");
  var statusEl = FT.$('[data-component="status"]');

  var current = null; /* the qrcode matrix currently on screen */

  FT.bindRange(sizeEl, sizeOut, function (v) {
    return v + " px";
  });
  FT.bindRange(marginEl, marginOut, function (v) {
    return v + (v === "1" ? " module" : " modules");
  });

  /* ---- Generation ------------------------------------------------------- */
  function build() {
    var value = textEl.value;
    var length = new TextEncoder().encode(value).length;
    lengthEl.textContent = value
      ? value.length + " characters · " + length + " bytes"
      : "Enter a link or text to generate a code.";

    if (!value.trim()) {
      current = null;
      clearCanvas();
      metaEl.textContent = "";
      statusEl.textContent = "";
      setButtonsEnabled(false);
      return;
    }

    try {
      var qr = window.qrcode(0, ecEl.value);
      qr.addData(value);
      qr.make();
      current = qr;
      draw();
      var modules = qr.getModuleCount();
      metaEl.textContent =
        "Version " +
        ((modules - 17) / 4 + 1) +
        " · " +
        modules +
        " × " +
        modules +
        " modules · error correction " +
        ecEl.value;
      statusEl.textContent = "QR code updated.";
      setButtonsEnabled(true);
    } catch (error) {
      current = null;
      clearCanvas();
      metaEl.textContent = "";
      setButtonsEnabled(false);
      var message =
        String(error.message || error).indexOf("overflow") > -1
          ? "That content is too long for a QR code. Shorten it and try again."
          : FT.friendlyError(error);
      statusEl.textContent = message;
      FT.toast("Cannot build that QR code", "error", message);
    }
  }

  function setButtonsEnabled(enabled) {
    [pngBtn, svgBtn].forEach(function (button) {
      button.disabled = !enabled;
    });
  }

  function moduleSpan() {
    return current.getModuleCount() + Number(marginEl.value) * 2;
  }

  function draw() {
    var size = Number(sizeEl.value);
    var modules = moduleSpan();
    var quiet = Number(marginEl.value);
    var unit = size / modules;

    canvas.width = size;
    canvas.height = size;
    canvas.setAttribute("aria-label", "QR code for " + textEl.value.slice(0, 60));
    var ctx = canvas.getContext("2d");
    ctx.fillStyle = bgEl.value;
    ctx.fillRect(0, 0, size, size);
    ctx.fillStyle = fgEl.value;

    for (var row = 0; row < current.getModuleCount(); row++) {
      for (var col = 0; col < current.getModuleCount(); col++) {
        if (!current.isDark(row, col)) continue;
        var x = (col + quiet) * unit;
        var y = (row + quiet) * unit;
        ctx.fillRect(Math.round(x), Math.round(y), Math.ceil(unit), Math.ceil(unit));
      }
    }
  }

  function clearCanvas() {
    var ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    canvas.setAttribute("aria-label", "QR code preview (empty)");
  }

  function toSvg() {
    var modules = moduleSpan();
    var quiet = Number(marginEl.value);
    var commands = [];
    for (var row = 0; row < current.getModuleCount(); row++) {
      for (var col = 0; col < current.getModuleCount(); col++) {
        if (current.isDark(row, col)) {
          commands.push("M" + (col + quiet) + " " + (row + quiet) + "h1v1h-1z");
        }
      }
    }
    var size = Number(sizeEl.value);
    return (
      '<svg xmlns="http://www.w3.org/2000/svg" width="' +
      size +
      '" height="' +
      size +
      '" viewBox="0 0 ' +
      modules +
      " " +
      modules +
      '" shape-rendering="crispEdges" role="img" aria-label="QR code">' +
      '<rect width="' +
      modules +
      '" height="' +
      modules +
      '" fill="' +
      bgEl.value +
      '"/><path d="' +
      commands.join("") +
      '" fill="' +
      fgEl.value +
      '"/></svg>'
    );
  }

  /* ---- Exports ---------------------------------------------------------- */
  function downloadPng() {
    if (!current) return;
    canvas.toBlob(function (blob) {
      if (!blob) {
        FT.toast("Export failed", "error", "The canvas could not be encoded as PNG.");
        return;
      }
      FT.downloadBlob(blob, "qr-code-" + Number(sizeEl.value) + "px.png");
      statusEl.textContent = "PNG downloaded.";
      FT.toast("PNG downloaded", "success", Number(sizeEl.value) + " × " + Number(sizeEl.value) + " px");
    }, "image/png");
  }

  function downloadSvg() {
    if (!current) return;
    var blob = new Blob([toSvg()], { type: "image/svg+xml" });
    FT.downloadBlob(blob, "qr-code.svg");
    statusEl.textContent = "SVG downloaded.";
    FT.toast("SVG downloaded", "success", "Scalable vector format");
  }

  function copyText() {
    if (!textEl.value) {
      FT.toast("Nothing to copy", "warning");
      return;
    }
    navigator.clipboard.writeText(textEl.value).then(
      function () {
        FT.toast("Copied", "success");
      },
      function () {
        FT.toast("Copy failed", "error", "Select the text and copy it manually.");
      }
    );
  }

  /* ---- Wiring ----------------------------------------------------------- */
  var rebuild = FT.debounce(build, 160);
  textEl.addEventListener("input", rebuild);
  [ecEl, sizeEl, marginEl].forEach(function (input) {
    input.addEventListener("input", function () {
      if (!current) return;
      draw();
      var modules = moduleSpan();
      metaEl.textContent =
        "Version " +
        ((current.getModuleCount() - 17) / 4 + 1) +
        " · " +
        modules +
        " × " +
        modules +
        " modules with quiet zone";
    });
  });
  ecEl.addEventListener("change", build);
  [fgEl, bgEl].forEach(function (input) {
    input.addEventListener("input", function () {
      if (current) draw();
    });
  });

  pngBtn.addEventListener("click", downloadPng);
  svgBtn.addEventListener("click", downloadSvg);
  copyBtn.addEventListener("click", copyText);
  clearBtn.addEventListener("click", function () {
    textEl.value = "";
    build();
    textEl.focus();
  });

  setButtonsEnabled(false);
  clearCanvas();
  build();
})();
