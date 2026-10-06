/* ==========================================================================
   word-counter.js — live writing statistics, computed locally
   Nothing is stored or transmitted; every keystroke is counted in the tab.
   ========================================================================== */
(function () {
  "use strict";

  var FT = window.FT;
  var tool = FT.initPage({ slug: "word-counter" });

  var inputEl = FT.$("#word-input");
  var statsEl = FT.$("#stats-grid");
  var keywordBody = FT.$("#keyword-body");
  var copyBtn = FT.$("#copy-action");
  var downloadBtn = FT.$("#download-action");
  var clearBtn = FT.$("#clear-action");
  var statusEl = FT.$('[data-component="status"]');
  var dropzoneMount = FT.$('[data-component="dropzone"]');

  var STOP_WORDS = [
    "a", "about", "above", "after", "again", "all", "am", "an", "and", "any", "are", "as", "at",
    "be", "because", "been", "before", "being", "below", "between", "both", "but", "by",
    "can", "did", "do", "does", "doing", "down", "during",
    "each", "few", "for", "from", "further",
    "had", "has", "have", "having", "he", "her", "here", "hers", "him", "his", "how",
    "i", "if", "in", "into", "is", "it", "its",
    "just", "me", "more", "most", "my", "no", "nor", "not", "now", "of", "off", "on", "once",
    "only", "or", "other", "our", "out", "over", "own", "same", "she", "should", "so", "some",
    "such", "than", "that", "the", "their", "them", "then", "there", "these", "they", "this",
    "those", "through", "to", "too", "under", "until", "up", "very", "was", "we", "were", "what",
    "when", "where", "which", "while", "who", "whom", "why", "will", "with", "would", "you", "your",
  ];

  /* ---- Counting --------------------------------------------------------- */
  function countSyllables(word) {
    var clean = word.toLowerCase().replace(/[^a-z]/g, "");
    if (!clean) return 0;
    if (clean.length <= 3) return 1;
    clean = clean.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, "").replace(/^y/, "");
    var groups = clean.match(/[aeiouy]{1,2}/g);
    return groups ? groups.length : 1;
  }

  function computeStats(text) {
    var trimmed = text.trim();
    var words = trimmed ? trimmed.split(/\s+/) : [];
    var sentences = trimmed ? trimmed.split(/[.!?…]+(?:\s|$)/).filter(function (s) {
      return s.trim().length > 0;
    }) : [];
    var paragraphs = trimmed
      ? text
          .split(/\n{2,}/)
          .map(function (p) {
            return p.trim();
          })
          .filter(Boolean)
      : [];
    var lines = text ? text.split(/\r?\n/) : [];
    var syllables = words.reduce(function (sum, word) {
      return sum + countSyllables(word);
    }, 0);

    var wordCount = words.length;
    var sentenceCount = sentences.length || (wordCount ? 1 : 0);
    var charsNoSpaces = text.replace(/\s/g, "").length;
    var avgWordLength = wordCount
      ? words.reduce(function (sum, word) {
          return sum + word.replace(/[^\p{L}\p{N}]/gu, "").length;
        }, 0) / wordCount
      : 0;
    var longest = words.reduce(function (best, word) {
      return word.length > best.length ? word : best;
    }, "");
    var readingEase =
      wordCount && sentenceCount
        ? 206.835 - 1.015 * (wordCount / sentenceCount) - 84.6 * (syllables / wordCount)
        : 0;

    return {
      words: wordCount,
      characters: text.length,
      charactersNoSpaces: charsNoSpaces,
      sentences: sentenceCount,
      paragraphs: paragraphs.length,
      lines: lines.length,
      readingMinutes: wordCount / 225,
      speakingMinutes: wordCount / 140,
      avgWordLength: avgWordLength,
      longestWord: longest,
      readingEase: readingEase,
      wordsList: words,
    };
  }

  function formatMinutes(minutes) {
    if (!minutes) return "0 s";
    if (minutes < 1) return Math.max(1, Math.round(minutes * 60)) + " s";
    if (minutes < 60) return (Math.round(minutes * 10) / 10).toString().replace(/\.0$/, "") + " min";
    var hours = Math.floor(minutes / 60);
    var rest = Math.round(minutes - hours * 60);
    return hours + " h " + rest + " min";
  }

  function easeLabel(score) {
    if (score >= 90) return "Very easy";
    if (score >= 80) return "Easy";
    if (score >= 70) return "Fairly easy";
    if (score >= 60) return "Standard";
    if (score >= 50) return "Fairly hard";
    if (score >= 30) return "Difficult";
    return "Very difficult";
  }

  /* ---- Rendering -------------------------------------------------------- */
  function render() {
    var stats = computeStats(inputEl.value);

    var cards = [
      { value: stats.words, label: "Words" },
      { value: stats.characters, label: "Characters" },
      { value: stats.charactersNoSpaces, label: "No spaces" },
      { value: stats.sentences, label: "Sentences" },
      { value: stats.paragraphs, label: "Paragraphs" },
      { value: stats.lines, label: "Lines" },
      { value: formatMinutes(stats.readingMinutes), label: "Reading time" },
      { value: formatMinutes(stats.speakingMinutes), label: "Speaking time" },
      { value: stats.avgWordLength ? stats.avgWordLength.toFixed(1) : "0", label: "Avg word length" },
      { value: stats.longestWord.length, label: "Longest word" },
      {
        value: stats.words ? Math.round(stats.readingEase) : "—",
        label: stats.words ? easeLabel(stats.readingEase) : "Reading ease",
      },
    ];

    statsEl.innerHTML = "";
    cards.forEach(function (card) {
      statsEl.appendChild(
        FT.el("div", { class: "stat" }, [
          FT.el("span", { class: "stat__value", text: String(card.value) }),
          FT.el("span", { class: "stat__label", text: card.label }),
        ])
      );
    });

    renderKeywords(stats);
    statusEl.textContent = stats.words
      ? stats.words + " words counted."
      : "Waiting for text.";
  }

  function renderKeywords(stats) {
    var counts = Object.create(null);
    stats.wordsList.forEach(function (word) {
      var clean = word.toLowerCase().replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, "");
      if (clean.length < 3 || STOP_WORDS.indexOf(clean) > -1 || /^\d+$/.test(clean)) return;
      counts[clean] = (counts[clean] || 0) + 1;
    });

    var ranked = Object.keys(counts)
      .map(function (word) {
        return { word: word, count: counts[word] };
      })
      .sort(function (a, b) {
        return b.count - a.count || a.word.localeCompare(b.word);
      })
      .slice(0, 10);

    keywordBody.innerHTML = "";
    if (!ranked.length) {
      var emptyRow = FT.el("tr");
      var cell = FT.el("td", { colspan: "3", class: "muted", text: "Keywords appear once you write a few sentences." });
      emptyRow.appendChild(cell);
      keywordBody.appendChild(emptyRow);
      return;
    }
    ranked.forEach(function (item) {
      var row = FT.el("tr");
      row.appendChild(FT.el("td", { text: item.word }));
      row.appendChild(FT.el("td", { class: "is-number", text: String(item.count) }));
      row.appendChild(
        FT.el("td", {
          class: "is-number",
          text: stats.words ? ((item.count / stats.words) * 100).toFixed(1) + "%" : "0%",
        })
      );
      keywordBody.appendChild(row);
    });
  }

  /* ---- Actions ---------------------------------------------------------- */
  copyBtn.addEventListener("click", function () {
    if (!inputEl.value) {
      FT.toast("Nothing to copy", "warning");
      return;
    }
    navigator.clipboard.writeText(inputEl.value).then(
      function () {
        FT.toast("Copied to clipboard", "success");
      },
      function () {
        FT.toast("Copy failed", "error", "Select the text and copy it manually.");
      }
    );
  });

  downloadBtn.addEventListener("click", function () {
    if (!inputEl.value.trim()) {
      FT.toast("Nothing to download", "warning");
      return;
    }
    var blob = new Blob([inputEl.value], { type: "text/plain;charset=utf-8" });
    FT.downloadBlob(blob, "document.txt");
    FT.toast("Text file downloaded", "success");
  });

  clearBtn.addEventListener("click", function () {
    inputEl.value = "";
    render();
    inputEl.focus();
  });

  inputEl.addEventListener("input", FT.debounce(render, 120));

  FT.createUploader(dropzoneMount, {
    accept: tool.accept,
    maxSizeMB: tool.maxFileMB,
    multiple: false,
    title: "Or drop a .txt file to analyse",
    hint: "Text is read locally — nothing is uploaded",
    iconHtml: FT.icons.file,
    readyMessage: "Text loaded.",
    onFiles: function (entries) {
      if (!entries.length) return;
      FT.readFileAsText(entries[0].file)
        .then(function (text) {
          inputEl.value = text;
          render();
          FT.toast("Text loaded", "success", entries[0].name);
        })
        .catch(function (error) {
          FT.toast("Could not read that file", "error", FT.friendlyError(error));
        });
    },
  });

  render();
})();
