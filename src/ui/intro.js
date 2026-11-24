import { createState } from "../systems/GameState.js";
import { logEvent } from "../systems/EventLog.js";
import { getPlayerName, setPlayerName } from "../systems/Telemetry.js";
import { clearProgress } from "../systems/SaveGame.js";
import { unlockAudio, playMusic, setAmbience, sfx } from "../audio/sound.js";
import { buildAudioSettings } from "./ui.js";
import { CREDITS } from "../data/credits.js";

// Bagian depan: layar pembuka → sinematik → menu utama → (nama) → cerita → Stage 1.
// Semua visual dibuat dengan CSS (src/intro.css), tanpa file gambar.

const OPENING_SCENES = [
  { cls: "scene-voyage", text: "Laut biru membentang. Pelayaranmu baru saja dimulai." },
  { cls: "scene-storm", text: "Tanpa peringatan, langit menghitam dan badai datang." },
  { cls: "scene-wreck", text: "Ombak raksasa menghantam. Kapalmu hancur." },
  { cls: "scene-island", text: "Saat kamu membuka mata, sebuah pulau asing menantimu." }
];
const SCENE_MS = 4600;
const SKIP_UNLOCK_MS = 1500;
const SEEN_KEY = "ioc:seenOpening";

const STORY = [
  {
    eyebrow: "01 · PELAYARAN", scene: "voyage", title: "Perjalanan melewati cakrawala",
    body: "Kamu berlayar meninggalkan pelabuhan yang kamu kenal. Rencananya sederhana: menyusuri cakrawala, menemukan perairan baru, lalu pulang membawa cerita.",
    caption: "Laut yang tenang. Cakrawala yang belum pasti."
  },
  {
    eyebrow: "02 · BADAI", scene: "storm", title: "Saat laut berbalik melawan",
    body: "Langit menggelap tanpa aba-aba. Ombak menghantam lambung kapal, dan para awak berjuang menjaga kapal tetap mengapung.",
    caption: "Badai tidak memberi waktu untuk jawaban yang mudah."
  },
  {
    eyebrow: "03 · KARAM", scene: "wreck", title: "Semuanya berubah dalam sekejap",
    body: "Satu gelombang besar membelah geladak. Kapal hancur dan laut menyeretmu ke dalam gelap. Saat terbangun, hanya suara ombak yang kamu kenali.",
    caption: "Kapalnya hilang. Perjalanannya belum."
  },
  {
    eyebrow: "04 · PULAU", scene: "island", title: "Dunia baru. Banyak jalan.",
    body: "Kamu terdampar di pulau asing. Puing berserakan di pantai, hutan membentang ke pedalaman, dan sungai deras memotong jalanmu. Tidak ada yang memaksamu memilih satu cara. Jelajahi, coba, dan putuskan sendiri.",
    caption: "Pilihanmu akan menentukan jalan ke depan."
  }
];

let root;
let stage;
let layer;
let handlers = {};
let introState = createState();
let keyHandler = null;
let timers = [];
let assetsReady = false;
let started = false;

const $ = (tag, className, text) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
};

function button(label, className, handler) {
  const node = $("button", className, label);
  node.type = "button";
  node.addEventListener("click", () => {
    unlockAudio();
    handler();
  });
  return node;
}

const log = (type, data = {}) => logEvent(type, data, introState);

function clearTimers() {
  timers.forEach((t) => clearTimeout(t));
  timers = [];
}

function later(ms, fn) {
  timers.push(setTimeout(fn, ms));
}

function onKeys(fn) {
  keyHandler = fn;
}

function setScreen(name, extraClass = "") {
  clearTimers();
  onKeys(null);
  root.className = `io-root is-${name} ${extraClass}`.trim();
  layer.replaceChildren();
  layer.className = `io-layer io-layer-${name}`;
}

// ---------- latar animasi (dipakai semua layar) ----------

function buildBackdrop() {
  stage = $("div", "io-stage");
  stage.setAttribute("aria-hidden", "true");
  const parts = [
    "io-sky", "io-stars", "io-sun", "io-clouds io-clouds-far", "io-clouds io-clouds-near",
    "io-island", "io-sea io-sea-back", "io-ship", "io-sea io-sea-mid", "io-sea io-sea-front",
    "io-birds", "io-rain", "io-flash", "io-vignette", "io-grain"
  ];
  for (const cls of parts) {
    const el = $("div", cls);
    if (cls === "io-ship") el.append($("div", "io-ship-sail"), $("div", "io-ship-hull"));
    if (cls === "io-island") el.append($("div", "io-island-land"), $("div", "io-island-palm"), $("div", "io-island-tower"), $("div", "io-island-beam"));
    if (cls === "io-birds") for (let i = 0; i < 4; i++) el.append($("span", "io-bird"));
    stage.append(el);
  }
  return stage;
}

// ---------- layar pembuka ----------

function showSplash() {
  setScreen("splash");
  // Lagu kiriman pengguna menjadi tema layar judul awal.
  // Browser baru mengizinkan audio setelah klik/tekan tombol pertama.
  playMusic("title_menu");
  setAmbience(null);
  const box = $("main", "io-splash");
  box.append(
    $("p", "io-kicker", "SEBUAH PETUALANGAN INTERAKTIF"),
    titleBlock(),
    $("p", "io-splash-tagline", "Satu pulau. Banyak jalan. Setiap pilihan meninggalkan jejak."),
    $("p", "io-press", "Tekan tombol apa saja atau klik untuk memulai")
  );
  layer.append(box);
  const go = () => {
    unlockAudio();
    let seen = false;
    try { seen = localStorage.getItem(SEEN_KEY) === "1"; } catch { seen = false; }
    if (seen) showMenu();
    else showOpening();
  };
  layer.addEventListener("click", go, { once: true });
  onKeys(() => go());
}

function titleBlock(size = "") {
  const h = $("h1", `io-title ${size}`.trim());
  h.append($("span", "io-title-small", "ISLAND OF"), $("span", "io-title-big", "CHOICES"));
  return h;
}

// ---------- sinematik pembuka ----------

function showOpening() {
  setScreen("opening");
  // Lagu yang sama tetap berjalan dari Splash melewati cinematic hingga Lobby.
  // Suara kapal/badai/karam ditambahkan sebagai ambience dan SFX per adegan.
  playMusic("title_menu");
  setAmbience(null);
  const t0 = Date.now();
  log("cinematic_intro_started", { scenes: OPENING_SCENES.length });
  const caption = $("p", "io-caption");
  const skip = button("Lewati ›", "io-btn io-btn-ghost io-skip", () => finish("skipped"));
  skip.disabled = true;
  const bar = $("div", "io-progress");
  const fill = $("span", "io-progress-fill");
  fill.style.animationDuration = `${OPENING_SCENES.length * SCENE_MS + 3200}ms`;
  bar.append(fill);
  const controls = $("div", "io-opening-controls");
  controls.append(bar, skip);
  layer.append(caption, controls);

  const finish = (reason) => {
    if (root.classList.contains("is-menu")) return;
    log("cinematic_intro_completed", { reason, elapsedMs: Date.now() - t0 });
    try { localStorage.setItem(SEEN_KEY, "1"); } catch { /* abaikan */ }
    showMenu();
  };

  OPENING_SCENES.forEach((scene, i) => {
    later(i * SCENE_MS, () => {
      OPENING_SCENES.forEach((s) => root.classList.remove(s.cls));
      root.classList.add(scene.cls);
      caption.classList.remove("is-in");
      void caption.offsetWidth;
      caption.textContent = scene.text;
      caption.classList.add("is-in");

      const sceneAudio = {
        "scene-voyage": "voyage",
        "scene-storm": "storm",
        "scene-wreck": "wreck",
        "scene-island": "island"
      };
      setAmbience(sceneAudio[scene.cls] || null);

      if (scene.cls === "scene-voyage") later(950, () => sfx.gull());
      if (scene.cls === "scene-storm") later(1400, () => sfx.rumble());
      if (scene.cls === "scene-wreck") {
        later(180, () => sfx.shipCreak());
        later(600, () => sfx.woodBreak());
        later(1050, () => sfx.waveCrash());
        later(1650, () => sfx.splash());
      }
      if (scene.cls === "scene-island") later(850, () => sfx.gull());
    });
  });
  later(OPENING_SCENES.length * SCENE_MS, () => {
    caption.classList.remove("is-in");
    layer.append(titleBlock("is-reveal"));
  });
  later(OPENING_SCENES.length * SCENE_MS + 3200, () => finish("completed"));
  later(SKIP_UNLOCK_MS, () => { skip.disabled = false; });
  onKeys((e) => {
    if (Date.now() - t0 < SKIP_UNLOCK_MS) return;
    if (["Escape", "Enter", " "].includes(e.key)) finish("skipped");
  });
}

// ---------- menu utama ----------

function menuList(items, { onBack } = {}) {
  const list = $("nav", "io-menu");
  let selected = 0;
  const buttons = items.map((item, i) => {
    const b = button(item.label, `io-menu-item ${item.primary ? "is-primary" : ""}`.trim(), () => {
      sfx.open();
      item.action();
    });
    if (item.sub) b.append($("small", "io-menu-sub", item.sub));
    b.addEventListener("mouseenter", () => select(i));
    list.append(b);
    return b;
  });
  const select = (i) => {
    selected = (i + buttons.length) % buttons.length;
    buttons.forEach((b, j) => b.classList.toggle("is-selected", j === selected));
    buttons[selected].focus({ preventScroll: true });
  };
  onKeys((e) => {
    if (["ArrowDown", "s", "S"].includes(e.key)) { select(selected + 1); sfx.ui(); e.preventDefault(); }
    else if (["ArrowUp", "w", "W"].includes(e.key)) { select(selected - 1); sfx.ui(); e.preventDefault(); }
    else if (["Enter", " ", "e", "E"].includes(e.key)) { e.preventDefault(); buttons[selected].click(); }
    else if (e.key === "Escape" && onBack) onBack();
  });
  setTimeout(() => select(0), 0);
  return list;
}

function showMenu() {
  setScreen("menu");
  // Lagu yang sama seperti Splash Screen, diputar looping di Lobby.
  playMusic("title_menu");
  // Lobby hanya memakai lagu utama; ambience storyboard tidak ikut menimpa.
  setAmbience(null);
  introState = createState();
  log("menu_opened", {});
  const save = handlers.getSave?.();

  const panel = $("main", "io-menu-panel");
  panel.append($("p", "io-kicker", "SEBUAH PETUALANGAN INTERAKTIF"), titleBlock("is-menu"),
    $("p", "io-tagline", "Satu pulau. Banyak jalan. Setiap pilihan meninggalkan jejak."));

  const items = [];
  if (save) items.push({ label: "Lanjutkan", sub: `${save.stageName || save.stageId} · dari awal stage`, primary: true, action: () => continueGame(save) });
  items.push({ label: "Mulai Petualangan", primary: !save, action: () => showNameDialog(save) });
  items.push({ label: "Cerita", action: () => showStory({ fromMenu: true }) });
  items.push({ label: "Cara Bermain", action: showHowTo });
  items.push({ label: "Pengaturan", action: showSettings });
  items.push({ label: "Tentang", action: showAbout });
  panel.append(menuList(items));
  const status = $("p", "io-status", assetsReady ? "Pulau siap dijelajahi." : "Menyiapkan dunia…");
  status.dataset.status = "assets";
  panel.append(status);

  const footer = $("footer", "io-footer");
  footer.append($("span", "", "↑ ↓ untuk memilih · Enter untuk masuk"), $("span", "", `${CREDITS.course} · ${CREDITS.project}`));
  layer.append(panel, footer);
}

function showNameDialog(save) {
  const overlay = $("div", "io-modal");
  const card = $("section", "io-card io-card-narrow");
  card.append($("p", "io-kicker", "SEBELUM BERANGKAT"), $("h2", "io-card-title", "Siapa namamu, penjelajah?"));
  const input = $("input", "io-input");
  input.type = "text";
  input.maxLength = 30;
  input.placeholder = "Nama (boleh dikosongkan)";
  input.value = getPlayerName();
  card.append(input, $("p", "io-note", "Nama hanya dipakai untuk menandai laporan perjalananmu. Kosongkan jika ingin anonim."));
  if (save) card.append($("p", "io-note io-warn", `Memulai baru akan menimpa progres tersimpan (${save.stageName || save.stageId}).`));
  const actions = $("div", "io-actions");
  const go = () => {
    setPlayerName(input.value);
    log("player_named", { named: !!input.value.trim() });
    overlay.remove();
    clearProgress();
    showStory({ fromMenu: false });
  };
  actions.append(button("Batal", "io-btn io-btn-ghost", () => { overlay.remove(); showMenu(); }), button("Berangkat →", "io-btn io-btn-primary", go));
  card.append(actions);
  overlay.append(card);
  layer.append(overlay);
  onKeys((e) => {
    if (e.key === "Enter") { e.preventDefault(); go(); }
    if (e.key === "Escape") { overlay.remove(); showMenu(); }
  });
  setTimeout(() => input.focus(), 50);
}

// ---------- cerita / prolog ----------

function illustration(scene) {
  const art = $("div", `io-art io-art-${scene}`);
  art.setAttribute("role", "img");
  art.setAttribute("aria-label", `Ilustrasi ${scene}`);
  for (const cls of ["art-sky", "art-sun", "art-land art-land-far", "art-land art-land-near", "art-water", "art-ship", "art-palms", "art-rain"]) {
    const el = $("div", cls);
    if (cls === "art-ship") el.append($("div", "art-sail"));
    art.append(el);
  }
  return art;
}

function showStory({ fromMenu, index = 0 }) {
  setScreen("story");
  // Hentikan lagu Splash/Lobby begitu masuk ke empat slide cerita.
  // Fade singkat menjaga perpindahan tetap halus; setiap slide punya ambience sendiri.
  playMusic(null, { fade: 650 });
  const slide = STORY[index];
  setAmbience(slide.scene);

  // Efek kejadian hanya dimainkan saat masuk ke slide terkait.
  if (slide.scene === "voyage") later(700, () => sfx.gull());
  if (slide.scene === "storm") later(500, () => sfx.rumble());
  if (slide.scene === "wreck") {
    later(180, () => sfx.shipCreak());
    later(620, () => sfx.woodBreak());
    later(1050, () => sfx.waveCrash());
    later(1550, () => sfx.splash());
  }
  if (slide.scene === "island") later(800, () => sfx.gull());
  log("storyboard_slide_viewed", { slide: index + 1, scene: slide.scene, fromMenu });

  const top = $("header", "io-story-top");
  top.append($("span", "io-brand", "ISLAND OF CHOICES"), $("span", "io-counter", `${String(index + 1).padStart(2, "0")} / ${String(STORY.length).padStart(2, "0")}`));
  const panel = $("main", "io-story");
  const visual = $("section", "io-story-visual");
  visual.append(illustration(slide.scene), $("p", "io-story-caption", slide.caption));
  const copy = $("section", "io-story-copy");
  const dots = $("div", "io-dots");
  STORY.forEach((_, i) => dots.append($("span", i === index ? "io-dot is-active" : "io-dot")));
  copy.append($("p", "io-kicker", slide.eyebrow), $("h2", "io-story-title", slide.title), $("p", "io-story-body", slide.body), dots);
  panel.append(visual, copy);

  const last = index === STORY.length - 1;
  const done = (reason) => {
    log(reason === "skipped" ? "storyboard_skipped" : "storyboard_completed", { atSlide: index + 1, fromMenu });
    if (fromMenu) showMenu();
    else beginGame();
  };
  const go = (dir) => {
    const next = index + dir;
    if (next < 0) return;
    sfx.ui();
    if (next >= STORY.length) return done("completed");
    showStory({ fromMenu, index: next });
  };
  const footer = $("footer", "io-story-footer");
  const prev = button("‹ Sebelumnya", "io-btn io-btn-ghost", () => go(-1));
  prev.disabled = index === 0;
  const skip = button(fromMenu ? "Kembali ke menu" : "Lewati cerita", "io-btn io-btn-link", () => done("skipped"));
  const next = button(last ? (fromMenu ? "Selesai" : "Mulai menjelajah →") : "Selanjutnya ›", "io-btn io-btn-primary", () => go(1));
  footer.append(prev, skip, next);
  layer.append(top, panel, footer);
  onKeys((e) => {
    if (["ArrowRight", "Enter", " ", "d", "D"].includes(e.key)) { e.preventDefault(); go(1); }
    else if (["ArrowLeft", "a", "A"].includes(e.key)) go(-1);
    else if (e.key === "Escape") done("skipped");
  });
}

// ---------- info ----------

function infoScreen(kicker, title, content) {
  setScreen("info");
  const card = $("section", "io-card");
  card.append($("p", "io-kicker", kicker), $("h2", "io-card-title", title), content);
  const back = button("← Kembali", "io-btn io-btn-ghost io-back", () => { sfx.close(); showMenu(); });
  card.append(back);
  layer.append(card);
  onKeys((e) => { if (["Escape", "Backspace"].includes(e.key) && document.activeElement?.tagName !== "INPUT") showMenu(); });
}

function showHowTo() {
  const wrap = $("div", "io-howto");
  const controls = $("div", "io-controls");
  [
    ["W A S D / ←↑↓→", "Bergerak"], ["E / Enter / Spasi", "Berinteraksi & memilih"], ["Esc", "Batal / menu jeda"],
    ["I", "Inventori"], ["J", "Jurnal penjelajah"], ["M", "Minimap"], ["N", "Suara on/off"], ["1–9 · Backspace", "Panel teka-teki"]
  ].forEach(([k, v]) => controls.append($("kbd", "io-key", k), $("span", "io-key-desc", v)));
  const tips = $("ul", "io-tips");
  [
    "Jelajahi tiga wilayah: pantai, reruntuhan hutan, dan tanjung mercusuar.",
    "Setiap tantangan bisa diselesaikan dengan banyak cara. Tidak ada jawaban tunggal.",
    "Amati lingkungan. Petunjuk tersembunyi di batu, lukisan, catatan, bahkan perilaku hewan.",
    "Barang yang kamu bawa bisa berguna di wilayah berikutnya.",
    "Gagal itu wajar. Kamu selalu bisa mencoba lagi.",
    "Di akhir perjalanan, kamu akan melihat gambaran gaya bermainmu, disusun dari tindakanmu sendiri."
  ].forEach((t) => tips.append($("li", "", t)));
  const left = $("div");
  left.append($("h3", "io-sub", "Kontrol"), controls);
  const right = $("div");
  right.append($("h3", "io-sub", "Cara bermain"), tips);
  wrap.append(left, right);
  infoScreen("CARA BERMAIN", "Jelajahi dengan caramu sendiri.", wrap);
}

function showSettings() {
  const wrap = $("div", "io-settings");
  wrap.append($("h3", "io-sub", "Suara"), buildAudioSettings());
  const data = $("div", "io-settings-data");
  const clear = button("Hapus progres tersimpan", "io-btn io-btn-ghost", () => {
    clearProgress();
    clear.textContent = "Progres dihapus";
    clear.disabled = true;
  });
  const replay = button("Putar ulang sinematik pembuka", "io-btn io-btn-ghost", () => showOpening());
  data.append($("h3", "io-sub", "Data & tampilan"), replay, clear);
  wrap.append(data);
  infoScreen("PENGATURAN", "Atur pengalamanmu.", wrap);
}

function showAbout() {
  const wrap = $("div", "io-about");
  wrap.append(
    $("p", "io-copy", "Island of Choices adalah game petualangan edukatif tentang pemecahan masalah terbuka. Kamu bebas memilih cara menyelesaikan setiap tantangan, mencoba lagi setelah gagal, dan menyesuaikan strategi."),
    $("p", "io-copy", "Selama bermain, game mencatat tindakan dan keputusanmu. Di akhir, catatan itu dirangkum menjadi gambaran gaya bermain berdasarkan bukti, bukan skor atau penilaian benar-salah."),
    $("h3", "io-sub", "Tentang data"),
    $("p", "io-copy io-small", "Yang dicatat hanya tindakan di dalam game (misalnya objek yang diperiksa, cara yang dipilih, dan percobaan ulang). Nama bersifat opsional. Hasilnya adalah bahan refleksi, bukan tes psikologis.")
  );
  const credits = $("div", "io-credits");
  credits.append($("h3", "io-sub", "Kredit"), $("p", "io-copy io-small", `${CREDITS.project} · ${CREDITS.course}`));
  for (const line of [...(CREDITS.team || []), ...(CREDITS.assets || [])].filter(Boolean)) credits.append($("p", "io-copy io-small", line));
  wrap.append(credits);
  infoScreen("TENTANG", "Ada lebih dari satu jalan ke depan.", wrap);
}

// ---------- mulai permainan ----------

function beginGame() {
  if (started || !assetsReady) return;
  started = true;
  log("game_started_from_menu", { mode: "new" });
  handlers.onNewGame?.({ priorLog: [...introState.log], startedAt: introState.startedAt });
}

function continueGame(save) {
  if (started || !assetsReady) return;
  started = true;
  handlers.onContinue?.(save);
}

export function mountIntro(options) {
  handlers = options;
  root = document.getElementById("intro-root");
  root.replaceChildren(buildBackdrop());
  layer = $("div", "io-layer");
  root.append(layer);
  log("experience_opened", { version: "1.0" });

  window.addEventListener("keydown", (e) => {
    if (document.body.classList.contains("is-playing") || !keyHandler || e.repeat) return;
    keyHandler(e);
  });
  if (window.__iocAssetsReady) assetsReady = true;
  window.addEventListener("ioc:assets-ready", () => {
    assetsReady = true;
    const status = root.querySelector('[data-status="assets"]');
    if (status) status.textContent = "Pulau siap dijelajahi.";
  });

  showSplash();
  return {
    showMenu: () => {
      started = false;
      showMenu();
    }
  };
}
