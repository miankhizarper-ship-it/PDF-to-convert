/* ==========================================================================
   home.js — powers index.html: category chips, the tool grid and search.
   Everything it renders comes from the registry in js/tools.js.
   ========================================================================== */
(function () {
  "use strict";

  var FT = window.FT;
  var R = FT.registry;

  var state = { category: "all", query: "" };
  var chipsEl = FT.$("#category-chips");
  var gridEl = FT.$("#tools-grid");
  var searchEl = FT.$("#tool-search");
  var countEl = FT.$("#search-count");

  /* ---- Category chips --------------------------------------------------- */
  function renderChips() {
    var chips = [{ id: "all", label: "All tools", count: R.TOOLS.length, icon: "" }].concat(
      R.CATEGORIES.map(function (cat) {
        return { id: cat.id, label: cat.label, count: R.byCategory(cat.id).length, icon: cat.icon };
      })
    );

    chipsEl.innerHTML = "";
    chips.forEach(function (chip) {
      var button = FT.el("button", {
        class: "chip",
        type: "button",
        "data-category": chip.id,
        "aria-pressed": state.category === chip.id ? "true" : "false",
      });
      button.innerHTML = chip.icon + "<span></span><span class='nav-drop__count'>" + chip.count + "</span>";
      FT.$("span", button).textContent = chip.label;
      button.addEventListener("click", function () {
        setCategory(chip.id);
      });
      chipsEl.appendChild(button);
    });
  }

  /* ---- Tool grid -------------------------------------------------------- */
  function visibleTools() {
    var query = state.query.trim().toLowerCase();
    return R.TOOLS.filter(function (tool) {
      if (state.category !== "all" && tool.category !== state.category) return false;
      if (!query) return true;
      var cat = R.category(tool.category);
      return (
        tool.name.toLowerCase().indexOf(query) > -1 ||
        tool.tagline.toLowerCase().indexOf(query) > -1 ||
        (cat && cat.label.toLowerCase().indexOf(query) > -1) ||
        tool.keywords.some(function (k) {
          return k.indexOf(query) > -1 || query.indexOf(k) > -1;
        })
      );
    });
  }

  function renderGrid() {
    var tools = visibleTools();
    gridEl.innerHTML = "";

    if (!tools.length) {
      var empty = FT.el("p", { class: "tools-empty" });
      empty.innerHTML = "No tool matches <strong></strong>. ";
      FT.$("strong", empty).textContent = state.query;
      var reset = FT.el("button", { class: "btn btn--ghost btn--sm", type: "button", text: "Clear filters" });
      reset.addEventListener("click", function () {
        state.query = "";
        state.category = "all";
        if (searchEl) searchEl.value = "";
        renderChips();
        renderGrid();
      });
      empty.appendChild(reset);
      gridEl.appendChild(empty);
    } else {
      tools.forEach(function (tool) {
        var card = FT.el("a", { class: "card reveal", href: R.toolHref(tool.slug, 1) });
        card.innerHTML =
          '<span class="card__icon">' +
          tool.icon +
          '</span><span class="card__title"></span>' +
          '<span class="card__desc"></span>' +
          '<span class="card__meta"><span class="tag"></span><span>Free · in-browser</span></span>';
        FT.$(".card__title", card).textContent = tool.name;
        FT.$(".card__desc", card).textContent = tool.tagline;
        FT.$(".tag", card).textContent = R.category(tool.category).label;
        gridEl.appendChild(card);
      });
    }

    FT.observeReveals(gridEl);
    if (countEl) {
      countEl.textContent = state.query.trim()
        ? tools.length + " of " + R.TOOLS.length + " tools match “" + state.query.trim() + "”"
        : R.TOOLS.length + " tools · " + R.CATEGORIES.length + " categories";
    }
  }

  /* ---- State ------------------------------------------------------------ */
  function setCategory(id) {
    state.category = id;
    FT.$$(".chip", chipsEl).forEach(function (chip) {
      chip.setAttribute("aria-pressed", chip.getAttribute("data-category") === id ? "true" : "false");
    });
    renderGrid();
    var toolsSection = FT.$("#tools");
    if (toolsSection && window.location.hash !== "#tools") {
      toolsSection.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "start" });
    }
  }

  function setQuery(value) {
    state.query = value || "";
    if (searchEl && searchEl.value !== state.query) searchEl.value = state.query;
    renderGrid();
  }

  function prefersReducedMotion() {
    return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  /* ---- Wiring ----------------------------------------------------------- */
  if (searchEl) {
    searchEl.addEventListener(
      "input",
      FT.debounce(function () {
        setQuery(searchEl.value);
      }, 120)
    );
    searchEl.addEventListener("keydown", function (e) {
      if (e.key === "Escape") {
        searchEl.value = "";
        setQuery("");
      }
    });
  }

  /* Category links (nav dropdown, breadcrumbs) filter in place when we are
     already on the home page. */
  document.addEventListener("click", function (e) {
    var link = e.target.closest("a[data-category]");
    if (!link || !gridEl) return;
    if (!/^#tools$/.test(link.getAttribute("href").split("#")[1] || "")) return;
    e.preventDefault();
    setCategory(link.getAttribute("data-category"));
    history.replaceState(null, "", "?category=" + link.getAttribute("data-category") + "#tools");
  });

  /* Search term handed over by the header search box on other pages */
  document.addEventListener("filetools:search", function (e) {
    setQuery(e.detail);
    var toolsSection = FT.$("#tools");
    if (toolsSection) toolsSection.scrollIntoView({ block: "start" });
  });

  /* Deep links: index.html?category=pdf&qr#tools and the ?q= search action
     advertised in the site's JSON-LD. */
  function readInitialState() {
    var params = new URLSearchParams(window.location.search);
    var wanted = params.get("category");
    var valid = R.CATEGORIES.some(function (c) {
      return c.id === wanted;
    });
    state.category = valid ? wanted : "all";
    state.query = params.get("q") || "";
    if (state.query && searchEl) searchEl.value = state.query;
  }

  readInitialState();
  renderChips();
  renderGrid();
  FT.initPage({});
})();
