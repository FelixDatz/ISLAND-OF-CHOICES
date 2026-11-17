import { getSettings, setSetting, audioStatus } from "../audio/sound.js";

// Lapisan UI HTML di atas canvas. Logika permainan tetap berada di scene/systems.

let locationObjective, pauseEl;
let hintEl, locationEl, locationTitle, locationHint, promptEl, promptLabel, toastBox, dialogEl, dialogText;
let menuEl, menuTitle, menuList, menuButtons = [];
let invEl, invList;
let gameOverEl, gameOverTitle, gameOverText, gameOverRetry;
let journalEl, journalBody, journalExport, journalClose;
let resultEl, puzzleEl, stageCardEl, stageCardTimer;

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function makeSection(title, entries, emptyText, renderEntry) {
  const section = el("section", "ui-journal-section");
  section.append(el("h3", "ui-journal-section-title", title));
  if (!entries.length) {
    section.append(el("p", "ui-journal-empty", emptyText));
    return section;
  }
  const list = el("div", "ui-journal-list");
  for (const entry of entries) list.append(renderEntry(entry));
  section.append(list);
  return section;
}

export function mountUi() {
  const root = document.getElementById("ui-root");

  hintEl = el("div", "hud-hint", "WASD/panah: gerak · E: interaksi\nI: inventori · J: jurnal · M: peta · N: suara");
  locationEl = el("section", "hud-location");
  locationTitle = el("strong", "hud-location-title");
  locationHint = el("span", "hud-location-hint");
  locationObjective = el("span", "hud-location-objective");
  locationEl.append(locationTitle, locationHint, locationObjective);
  promptEl = el("div", "ui-prompt");
  promptEl.hidden = true;
  promptEl.append(el("kbd", "", "E"));
  promptLabel = el("span");
  promptEl.append(promptLabel);
  toastBox = el("div", "ui-toasts");

  dialogEl = el("div", "ui-panel ui-dialog");
  dialogEl.hidden = true;
  dialogText = el("p", "ui-dialog-text");
  dialogEl.append(dialogText, el("span", "ui-foot", "E atau klik untuk lanjut"));

  menuEl = el("div", "ui-panel ui-menu");
  menuEl.hidden = true;
  menuTitle = el("h2", "ui-menu-title");
  menuList = el("div", "ui-menu-list");
  menuEl.append(menuTitle, menuList);

  invEl = el("div", "ui-panel ui-inventory");
  invEl.hidden = true;
  invEl.append(el("h2", "ui-menu-title", "Inventori"));
  invList = el("div", "ui-inv-list");
  invEl.append(invList, el("span", "ui-foot", "I atau Esc untuk menutup"));

  journalEl = el("section", "ui-panel ui-journal");
  journalEl.hidden = true;
  const journalHeader = el("header", "ui-journal-header");
  const journalHeading = el("div", "ui-journal-heading");
  journalHeading.append(el("h2", "ui-journal-title", "Jurnal Penjelajah"), el("p", "ui-journal-subtitle", "Catatan penemuan dan keputusan selama perjalanan."));
  journalClose = el("button", "ui-journal-close", "Tutup");
  journalClose.type = "button";
  journalHeader.append(journalHeading, journalClose);
  journalBody = el("div", "ui-journal-body");
  const journalFooter = el("footer", "ui-journal-footer");
  journalExport = el("button", "ui-journal-export", "Unduh laporan perjalanan (.json)");
  journalExport.type = "button";
  journalFooter.append(journalExport, el("span", "ui-foot", "J untuk menutup · Esc juga bisa digunakan"));
  journalEl.append(journalHeader, journalBody, journalFooter);

  gameOverEl = el("div", "ui-panel ui-gameover");
  gameOverEl.hidden = true;
  gameOverTitle = el("h2", "ui-gameover-title");
  gameOverText = el("p", "ui-gameover-text");
  gameOverRetry = el("button", "ui-gameover-retry", "Coba lagi dari awal (E)");
  gameOverRetry.type = "button";
  gameOverEl.append(gameOverTitle, gameOverText, gameOverRetry);

  resultEl = el("section", "ui-panel ui-result");
  resultEl.hidden = true;
  pauseEl = el("section", "ui-panel ui-pause");
  pauseEl.hidden = true;
  puzzleEl = el("section", "ui-panel ui-puzzle");
  puzzleEl.hidden = true;
  stageCardEl = el("div", "ui-stage-card");
  stageCardEl.hidden = true;

  root.append(hintEl, locationEl, promptEl, toastBox, dialogEl, menuEl, invEl, journalEl, gameOverEl, resultEl, puzzleEl, stageCardEl, pauseEl);
}

export function showLocation(title, hint) {
  if (!locationEl) return;
  locationTitle.textContent = title || "";
  locationHint.textContent = hint || "";
  locationEl.hidden = !title;
}

export function setObjective(text) {
  if (!locationObjective) return;
  locationObjective.textContent = text ? `Tujuan: ${text}` : "";
  locationObjective.hidden = !text;
}

export function showPrompt(label) {
  if (!label) {
    promptEl.hidden = true;
    return;
  }
  promptLabel.textContent = label;
  promptEl.hidden = false;
}

export function showDialog(text, onClick) {
  dialogText.textContent = text;
  dialogEl.onclick = onClick;
  dialogEl.hidden = false;
}

export function hideDialog() {
  dialogEl.hidden = true;
  dialogEl.onclick = null;
}

// options: [{ label, enabled }]
export function showMenu(title, options, selected, onPick) {
  menuTitle.textContent = title;
  menuList.replaceChildren();
  menuButtons = options.map((option, index) => {
    const button = el("button", "ui-option" + (option.enabled === false ? " is-locked" : ""), option.label);
    button.type = "button";
    button.tabIndex = -1;
    button.addEventListener("mousedown", (event) => event.preventDefault());
    button.addEventListener("click", () => onPick(index));
    menuList.append(button);
    return button;
  });
  setMenuSelected(selected);
  menuEl.hidden = false;
}

export function setMenuSelected(index) {
  menuButtons.forEach((button, i) => button.classList.toggle("is-selected", i === index));
}

export function hideMenu() {
  menuEl.hidden = true;
  menuButtons = [];
}

// items: [{ name, desc, color, count }]
export function showInventory(items) {
  invList.replaceChildren();
  if (items.length === 0) invList.append(el("p", "ui-empty", "Belum ada barang."));
  for (const item of items) {
    const row = el("div", "ui-inv-row");
    const icon = el("span", "ui-inv-icon");
    icon.style.background = item.color;
    const text = el("div", "ui-inv-text");
    text.append(el("strong", "", item.count > 1 ? `${item.name} ×${item.count}` : item.name), el("span", "", item.desc));
    row.append(icon, text);
    invList.append(row);
  }
  invEl.hidden = false;
}

export function hideInventory() {
  invEl.hidden = true;
}

export function showJournal(snapshot, onClose, onExport) {
  journalBody.replaceChildren();
  journalBody.append(
    makeSection("Penemuan", snapshot.discoveries, "Belum ada penemuan yang dicatat. Coba amati benda-benda di sekitarmu.", (entry) => {
      const card = el("article", "ui-journal-entry");
      card.append(el("strong", "ui-journal-entry-title", entry.title), el("p", "ui-journal-entry-text", entry.note));
      return card;
    }),
    makeSection("Riwayat keputusan", snapshot.decisions, "Belum ada keputusan penting yang tercatat.", (entry) => {
      const card = el("article", "ui-journal-entry");
      const heading = el("div", "ui-journal-entry-row");
      heading.append(el("strong", "ui-journal-entry-title", entry.label), el("span", "ui-journal-status", entry.outcome));
      card.append(heading);
      if (entry.detail) card.append(el("p", "ui-journal-entry-text", entry.detail));
      if (entry.strategy) card.append(el("small", "ui-journal-meta", `Cara: ${entry.strategy}${entry.attempt > 1 ? ` · percobaan ke-${entry.attempt}` : ""}`));
      return card;
    })
  );
  journalBody.append(el("p", "ui-journal-caveat", "Analisis gaya bermain ditampilkan di akhir perjalanan."));
  journalClose.onclick = onClose;
  journalExport.onclick = onExport;
  journalEl.hidden = false;
}

export function hideJournal() {
  if (!journalEl) return;
  journalEl.hidden = true;
  journalClose.onclick = null;
  journalExport.onclick = null;
}

export function downloadJson(filename, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = el("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function toast(text) {
  const toast = el("div", "ui-toast", text);
  toastBox.append(toast);
  setTimeout(() => toast.remove(), 2600);
}

export function showGameOver(title, message, onRetry) {
  gameOverTitle.textContent = title;
  gameOverText.textContent = message;
  gameOverRetry.onclick = onRetry;
  gameOverEl.hidden = false;
}

export function hideGameOver() {
  if (!gameOverEl) return;
  gameOverEl.hidden = true;
  gameOverRetry.onclick = null;
}

// ---------- Hasil analisis gaya bermain ----------

const fmtSeconds = (ms) => `${Math.round((ms || 0) / 1000)} dtk`;

function dimensionRow(d) {
  const row = el("article", "ui-dim" + (d.hasData ? "" : " is-empty"));
  const head = el("div", "ui-dim-head");
  head.append(el("strong", "", d.label), el("span", `ui-badge is-${d.confidence}`, `keyakinan ${d.confidence}`));
  const scale = el("div", "ui-dim-scale");
  const track = el("div", "ui-dim-track");
  const marker = el("span", "ui-dim-marker");
  marker.style.left = `${((d.score + 1) / 2) * 100}%`;
  track.append(marker);
  scale.append(el("span", "ui-dim-pole", d.poles.negative), track, el("span", "ui-dim-pole", d.poles.positive));
  const tendency = el("p", "ui-dim-tendency", d.hasData ? `${d.tendency}${d.tendency === "Seimbang" ? "" : ` (${d.strength})`} · skor ${d.score}` : "Belum ada data");
  const list = el("ul", "ui-dim-evidence");
  for (const e of d.evidence) list.append(el("li", "", e.text));
  row.append(head, scale, tendency, list);
  return row;
}

export function showResult(report, { preview = false, onClose, onDownload, onRestart, onMenu } = {}) {
  const { profile } = report;
  resultEl.replaceChildren();

  const header = el("header", "ui-result-header");
  header.append(el("p", "ui-result-kicker", preview ? "PRATINJAU ANALISIS (LIVE) · tekan P untuk menutup" : "ANALISIS GAYA BERMAIN"));
  header.append(el("h2", "ui-result-headline", profile.headline));
  if (profile.solutionStyle) {
    const chips = el("div", "ui-result-chips");
    for (const d of profile.solutionStyle.distribution) chips.append(el("span", "ui-chip", `${d.label} ${Math.round(d.share * 100)}%`));
    header.append(chips);
  }

  const body = el("div", "ui-result-body");
  body.append(el("p", "ui-result-narrative", profile.narrative));

  const stats = el("table", "ui-result-table");
  const head = el("tr");
  for (const label of ["Stage", "Cara", "Percobaan", "Durasi", "Penemuan", "Peta"]) head.append(el("th", "", label));
  stats.append(head);
  for (const m of report.stages) {
    const row = el("tr");
    for (const v of [
      m.stageName,
      m.main.strategyLabel || "belum",
      m.attempts,
      fmtSeconds(m.durationMs),
      `${m.clues.found.length + m.optional.found.length}/${m.clues.total + m.optional.total}`,
      m.coverage === null ? "-" : `${Math.round(m.coverage * 100)}%`
    ]) row.append(el("td", "", String(v)));
    stats.append(row);
  }
  body.append(stats);

  const dims = el("section", "ui-result-dims");
  for (const d of profile.dimensions) dims.append(dimensionRow(d));
  body.append(dims);

  const limits = el("ul", "ui-result-limits");
  for (const text of report.limitations) limits.append(el("li", "", text));
  body.append(limits);

  const footer = el("footer", "ui-result-footer");
  footer.append(el("span", "ui-result-status"));
  const download = el("button", "ui-journal-export", "Unduh laporan (.json)");
  download.type = "button";
  download.onclick = onDownload;
  footer.append(download);
  if (preview && onClose) {
    const close = el("button", "ui-journal-close", "Tutup");
    close.type = "button";
    close.onclick = onClose;
    footer.append(close);
  }
  if (!preview && onMenu) {
    const menu = el("button", "ui-journal-close", "Menu utama");
    menu.type = "button";
    menu.onclick = onMenu;
    footer.append(menu);
  }
  if (!preview && onRestart) {
    const restart = el("button", "ui-result-restart", "Main lagi");
    restart.type = "button";
    restart.onclick = onRestart;
    footer.append(restart);
  }

  resultEl.append(header, body, footer);
  resultEl.hidden = false;
}

export function hideResult() {
  if (!resultEl) return;
  resultEl.hidden = true;
  resultEl.replaceChildren();
}

export function setResultStatus(text, kind = "info") {
  const status = resultEl?.querySelector(".ui-result-status");
  if (!status) return;
  status.textContent = text;
  status.dataset.kind = kind;
}

// ---------- Teka-teki simbol ----------

let puzzleRefs = null;

export function showPuzzle(puzzle, { onSymbol, onBack, onSubmit, onClose }) {
  puzzleEl.replaceChildren();
  const header = el("header", "ui-puzzle-header");
  header.append(el("h2", "ui-menu-title", puzzle.title || "Teka-teki"), el("p", "ui-puzzle-prompt", puzzle.prompt || ""));
  const slots = el("div", "ui-puzzle-slots");
  const message = el("p", "ui-puzzle-message", `Masukkan ${puzzle.solution.length} simbol.`);
  const pad = el("div", "ui-puzzle-pad");
  puzzle.symbols.forEach((sym, i) => {
    const b = el("button", "ui-puzzle-key");
    b.type = "button";
    b.append(el("span", "ui-puzzle-glyph", sym.glyph), el("small", "", `${i + 1} · ${sym.label}`));
    b.addEventListener("mousedown", (e) => e.preventDefault());
    b.addEventListener("click", () => onSymbol(i));
    pad.append(b);
  });
  const history = el("ol", "ui-puzzle-history");
  const actions = el("div", "ui-puzzle-actions");
  for (const [label, fn, cls] of [["⌫ Hapus", onBack, ""], ["Coba (E)", onSubmit, "is-primary"], ["Tutup (Esc)", onClose, ""]]) {
    const b = el("button", `ui-puzzle-action ${cls}`, label);
    b.type = "button";
    b.addEventListener("mousedown", (e) => e.preventDefault());
    b.addEventListener("click", fn);
    actions.append(b);
  }
  puzzleEl.append(header, slots, message, pad, actions, history);
  puzzleRefs = { slots, message, history, symbols: puzzle.symbols, length: puzzle.solution.length };
  updatePuzzle({ input: [], history: [] });
  puzzleEl.hidden = false;
}

export function updatePuzzle({ input, history, message, kind }) {
  if (!puzzleRefs) return;
  const glyph = (id) => puzzleRefs.symbols.find((s) => s.id === id)?.glyph || "?";
  puzzleRefs.slots.replaceChildren();
  for (let i = 0; i < puzzleRefs.length; i++) {
    puzzleRefs.slots.append(el("span", "ui-puzzle-slot" + (input[i] ? " is-filled" : ""), input[i] ? glyph(input[i]) : ""));
  }
  if (message) {
    puzzleRefs.message.textContent = message;
    puzzleRefs.message.dataset.kind = kind || "info";
  }
  puzzleRefs.history.replaceChildren();
  for (const h of history.slice(-6)) {
    const li = el("li");
    li.append(el("span", "ui-puzzle-guess", h.input.map(glyph).join(" ")), el("span", "ui-puzzle-score", `${h.exact}/${puzzleRefs.length} tepat posisi`));
    puzzleRefs.history.append(li);
  }
  if (kind === "wrong") {
    puzzleEl.classList.remove("is-shake");
    void puzzleEl.offsetWidth;
    puzzleEl.classList.add("is-shake");
  }
}

export function hidePuzzle() {
  if (!puzzleEl) return;
  puzzleEl.hidden = true;
  puzzleEl.replaceChildren();
  puzzleRefs = null;
}

// ---------- Kartu judul stage ----------

export function showStageCard({ kicker, title, text }, ms = 4200) {
  clearTimeout(stageCardTimer);
  stageCardEl.replaceChildren(el("p", "ui-stage-kicker", kicker || ""), el("h1", "ui-stage-title", title || ""), el("p", "ui-stage-text", text || ""));
  stageCardEl.hidden = false;
  stageCardEl.classList.remove("is-leaving");
  stageCardTimer = setTimeout(() => {
    stageCardEl.classList.add("is-leaving");
    stageCardTimer = setTimeout(() => { stageCardEl.hidden = true; }, 700);
  }, ms);
}

export function hideStageCard() {
  clearTimeout(stageCardTimer);
  if (stageCardEl) stageCardEl.hidden = true;
}

export function floatingNote(text) {
  toast(text);
}

// ---------- Pengaturan audio (dipakai di menu jeda & menu utama) ----------

export function buildAudioSettings() {
  const wrap = el("div", "ui-audio-settings");
  const current = getSettings();
  const slider = (key, label) => {
    const row = el("label", "ui-audio-row");
    const input = el("input");
    input.type = "range";
    input.min = "0";
    input.max = "100";
    input.value = String(Math.round(current[key] * 100));
    const value = el("span", "ui-audio-value", `${input.value}%`);
    input.addEventListener("input", () => {
      setSetting(key, Number(input.value) / 100);
      value.textContent = `${input.value}%`;
    });
    row.append(el("span", "ui-audio-label", label), input, value);
    return row;
  };
  const mute = el("label", "ui-audio-row ui-audio-mute");
  const box = el("input");
  box.type = "checkbox";
  box.checked = current.muted;
  box.addEventListener("change", () => setSetting("muted", box.checked));
  mute.append(box, el("span", "ui-audio-label", "Bisukan semua suara (N)"));
  const status = audioStatus();
  wrap.append(
    slider("master", "Volume utama"),
    slider("music", "Musik"),
    slider("sfx", "Efek & suasana"),
    mute,
    el("p", "ui-audio-status", status.found
      ? `File suara ditemukan: ${status.found} dari ${status.total}. Sisanya memakai suara sintetis.`
      : `Belum ada file suara (0 dari ${status.total}). Memakai suara sintetis bawaan.`)
  );
  return wrap;
}

// ---------- Menu jeda ----------

let pauseButtons = [];
let pauseSelected = 0;

export function showPause({ onResume, onControls, onMenu }) {
  pauseEl.replaceChildren();
  pauseEl.append(el("h2", "ui-pause-title", "Permainan dijeda"));
  const list = el("div", "ui-pause-list");
  const items = [
    ["Lanjutkan", onResume],
    ["Kontrol & tips", () => showPauseSection("controls")],
    ["Suara", () => showPauseSection("audio")],
    ["Kembali ke menu utama", () => showPauseSection("confirm")]
  ];
  pauseButtons = items.map(([label, fn]) => {
    const b = el("button", "ui-option", label);
    b.type = "button";
    b.addEventListener("mousedown", (e) => e.preventDefault());
    b.addEventListener("click", fn);
    list.append(b);
    return b;
  });
  const section = el("div", "ui-pause-section");
  pauseEl.append(list, section, el("span", "ui-foot", "Esc untuk melanjutkan · ↑↓ dan E untuk memilih"));

  function showPauseSection(kind) {
    section.replaceChildren();
    if (kind === "controls") {
      onControls?.();
      const rows = [
        ["WASD / panah", "bergerak"], ["E / Enter / Spasi", "berinteraksi, memilih"], ["Esc", "batal / jeda"],
        ["I", "inventori"], ["J", "jurnal penjelajah"], ["M", "minimap"], ["N", "suara on/off"], ["1–9, Backspace", "panel teka-teki"]
      ];
      const table = el("div", "ui-pause-controls");
      for (const [k, v] of rows) table.append(el("kbd", "", k), el("span", "", v));
      section.append(table, el("p", "ui-pause-tip", "Tidak ada satu jawaban yang benar. Amati sekitar, coba berbagai cara, dan ikuti rasa penasaranmu."));
    } else if (kind === "audio") {
      section.append(buildAudioSettings());
    } else if (kind === "confirm") {
      const yes = el("button", "ui-result-restart", "Ya, ke menu utama");
      yes.type = "button";
      yes.onclick = onMenu;
      section.append(el("p", "ui-pause-tip", "Progres tersimpan otomatis di awal stage ini. Kamu bisa memilih Lanjutkan dari menu utama."), yes);
    }
  }
  setPauseSelected(0);
  pauseEl.hidden = false;
}

export function setPauseSelected(index) {
  pauseSelected = (index + pauseButtons.length) % pauseButtons.length;
  pauseButtons.forEach((b, i) => b.classList.toggle("is-selected", i === pauseSelected));
  return pauseSelected;
}

export function pausePick() {
  pauseButtons[pauseSelected]?.click();
}

export function hidePause() {
  if (!pauseEl) return;
  pauseEl.hidden = true;
  pauseEl.replaceChildren();
  pauseButtons = [];
}

/** Menyembunyikan semua panel gameplay (saat kembali ke menu utama). */
export function hideAllPanels() {
  hideDialog();
  hideMenu();
  hideInventory();
  hideJournal();
  hideGameOver();
  hideResult();
  hidePuzzle();
  hidePause();
  hideStageCard();
  showPrompt(null);
}
