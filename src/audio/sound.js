import menuTrackAssetUrl from "../assets/audio/music/01_exploring_the_ocean.ogg?url";
import { MUSIC, AMBIENCE, SFX } from "./manifest.js";

// Audio game: memakai file di src/assets/audio bila ada, dan suara sintetis
// (WebAudio) sebagai pengganti selama file belum disiapkan.
//   musik     → HTMLAudio (streaming, loop, crossfade)
//   suasana   → file loop, atau noise sintetis sesuai tema
//   efek      → AudioBuffer dari file, atau nada sintetis
// Browser hanya mengizinkan suara setelah interaksi pertama: panggil unlockAudio()
// dari handler klik/tombol.

const FOUND = import.meta.glob("../assets/audio/**/*.{mp3,ogg,m4a,wav}", { eager: true, query: "?url", import: "default" });
const EXT_ORDER = ["mp3", "ogg", "m4a", "wav"];
const SETTINGS_KEY = "ioc:audio";

export function urlFor(file) {
  // Track kiriman pengguna di-bundle secara eksplisit agar selalu terdeteksi Vite.
  if (file === "music/01_exploring_the_ocean" || file === "music/title_menu") {
    return menuTrackAssetUrl;
  }
  for (const ext of EXT_ORDER) {
    const url = FOUND[`../assets/audio/${file}.${ext}`];
    if (url) return url;
  }
  return null;
}

/** Ringkasan aset yang ditemukan (ditampilkan di Pengaturan). */
export function audioStatus() {
  const all = [...Object.values(MUSIC), ...Object.values(AMBIENCE), ...Object.values(SFX)];
  return { found: all.filter((d) => urlFor(d.file)).length, total: all.length };
}

// ---------- pengaturan ----------

const settings = { master: 1, music: 0.7, sfx: 0.85, muted: false };
try {
  Object.assign(settings, JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}"));
} catch {
  // pakai bawaan
}

function saveSettings() {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // abaikan
  }
}

export function getSettings() {
  return { ...settings };
}

export function setSetting(key, value) {
  if (!(key in settings)) return;
  settings[key] = key === "muted" ? !!value : Math.max(0, Math.min(1, Number(value)));
  saveSettings();
  applyVolumes();
}

export function isMuted() {
  return settings.muted;
}

export function toggleMute() {
  setSetting("muted", !settings.muted);
  return settings.muted;
}

const musicLevel = (base = 1) => (settings.muted ? 0 : settings.master * settings.music * base);
const sfxLevel = (base = 1) => (settings.muted ? 0 : settings.master * settings.sfx * base);

// ---------- WebAudio ----------

let ctx = null;
let sfxBus = null;
let ambBus = null;
let noiseBuffer = null;
let unlocked = false;
const buffers = new Map();

function init() {
  if (ctx) return true;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return false;
  ctx = new AC();
  sfxBus = ctx.createGain();
  sfxBus.connect(ctx.destination);
  ambBus = ctx.createGain();
  ambBus.connect(ctx.destination);
  noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
  const data = noiseBuffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  applyVolumes();
  preloadSfx();
  return true;
}

function preloadSfx() {
  for (const [key, def] of Object.entries(SFX)) {
    const url = urlFor(def.file);
    if (!url || buffers.has(key)) continue;
    buffers.set(key, null);
    fetch(url)
      .then((r) => r.arrayBuffer())
      .then((data) => ctx.decodeAudioData(data))
      .then((buf) => buffers.set(key, buf))
      .catch(() => buffers.delete(key));
  }
}

/** Panggil dari handler input (klik/tombol) agar browser mengizinkan suara. */
export function unlockAudio() {
  // HTMLAudio (BGM/ambience) tetap bisa dipakai walau WebAudio tidak tersedia.
  // Ini juga memastikan pending BGM diputar langsung dari gesture pertama pengguna.
  if (!unlocked) {
    unlocked = true;
    init();
  }
  if (ctx?.state === "suspended") {
    ctx.resume().catch((error) => console.warn("AudioContext gagal di-resume:", error));
  }
  if (pendingMusic !== undefined) {
    const key = pendingMusic;
    pendingMusic = undefined;
    playMusic(key);
  }
  if (pendingAmbience !== undefined) {
    const key = pendingAmbience;
    pendingAmbience = undefined;
    setAmbience(key);
  }
}

function applyVolumes() {
  if (sfxBus) sfxBus.gain.setTargetAtTime(sfxLevel(), ctx.currentTime, 0.05);
  if (ambBus) ambBus.gain.setTargetAtTime(sfxLevel(0.6), ctx.currentTime, 0.05);
  if (music?.el) music.el.volume = musicLevel(music.base);
  if (ambience?.el) ambience.el.volume = sfxLevel(ambience.base);
}

// ---------- efek suara ----------

function tone({ freq, to = null, dur = 0.15, type = "sine", vol = 0.2, delay = 0 }) {
  if (!ctx) return;
  const t0 = ctx.currentTime + delay;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (to) osc.frequency.exponentialRampToValueAtTime(to, t0 + dur);
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(gain).connect(sfxBus);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

function noise({ dur = 0.3, freq = 800, q = 1, vol = 0.3, type = "bandpass", delay = 0 }) {
  if (!ctx) return;
  const t0 = ctx.currentTime + delay;
  const src = ctx.createBufferSource();
  src.buffer = noiseBuffer;
  const filter = ctx.createBiquadFilter();
  filter.type = type;
  filter.frequency.value = freq;
  filter.Q.value = q;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(vol, t0);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  src.connect(filter).connect(gain).connect(sfxBus);
  src.start(t0);
  src.stop(t0 + dur + 0.05);
}

/** Memutar file efek bila tersedia. true jika berhasil. */
function playFile(key, vol = 1, rate = 1) {
  const buf = buffers.get(key);
  if (!ctx || !buf) return false;
  const src = ctx.createBufferSource();
  src.buffer = buf;
  src.playbackRate.value = rate;
  const gain = ctx.createGain();
  gain.gain.value = vol;
  src.connect(gain).connect(sfxBus);
  src.start();
  return true;
}

const SYNTH = {
  ambil: () => { tone({ freq: 660, to: 990, dur: 0.12, type: "triangle", vol: 0.16 }); tone({ freq: 990, to: 1320, dur: 0.14, type: "triangle", vol: 0.1, delay: 0.07 }); },
  temuan: () => [784, 988, 1175].forEach((f, i) => tone({ freq: f, dur: 0.22, vol: 0.1, delay: i * 0.07 })),
  berhasil: () => [523, 659, 784, 1046].forEach((f, i) => tone({ freq: f, dur: 0.4, type: "triangle", vol: 0.14, delay: i * 0.1 })),
  gagal: () => tone({ freq: 240, to: 90, dur: 0.5, type: "sawtooth", vol: 0.1 }),
  cebur: () => { noise({ dur: 0.9, freq: 900, q: 0.6, vol: 0.45 }); noise({ dur: 0.5, freq: 2400, q: 1, vol: 0.2, delay: 0.1 }); },
  jatuh: () => { tone({ freq: 130, to: 45, dur: 0.35, vol: 0.35 }); noise({ dur: 0.25, freq: 300, q: 1, vol: 0.3 }); },
  ui_pilih: () => tone({ freq: 880, dur: 0.05, type: "square", vol: 0.04 }),
  ui_buka: () => tone({ freq: 520, to: 700, dur: 0.08, type: "triangle", vol: 0.07 }),
  ui_tutup: () => tone({ freq: 600, to: 420, dur: 0.08, type: "triangle", vol: 0.06 }),
  simbol: (i = 0) => tone({ freq: 440 + i * 110, dur: 0.08, type: "square", vol: 0.05 }),
  salah: () => { tone({ freq: 300, dur: 0.12, type: "square", vol: 0.07 }); tone({ freq: 190, dur: 0.2, type: "square", vol: 0.07, delay: 0.12 }); },
  gemuruh: () => { noise({ dur: 1.6, freq: 110, q: 0.7, vol: 0.6, type: "lowpass" }); tone({ freq: 55, dur: 1.4, vol: 0.2 }); },
  desir: () => noise({ dur: 0.5, freq: 1400, q: 0.8, vol: 0.18 }),
  klakson_kapal: () => { tone({ freq: 147, dur: 1.8, type: "sawtooth", vol: 0.09 }); tone({ freq: 110, dur: 1.8, type: "sawtooth", vol: 0.08 }); },
  langkah: () => noise({ dur: 0.05, freq: 1600, q: 2, vol: 0.025 }),
  langkah_pasir: () => { noise({ dur: 0.09, freq: 850, q: 0.7, vol: 0.045 }); tone({ freq: 82, to: 48, dur: 0.07, vol: 0.04 }); },
  langkah_daun: () => { noise({ dur: 0.12, freq: 2400, q: 0.6, vol: 0.07 }); tone({ freq: 95, to: 55, dur: 0.06, vol: 0.025 }); },
  langkah_batu: () => { tone({ freq: 155, to: 90, dur: 0.075, type: "triangle", vol: 0.07 }); noise({ dur: 0.045, freq: 1800, q: 2, vol: 0.025 }); },
  derit_kapal: () => { tone({ freq: 105, to: 66, dur: 1.4, type: "triangle", vol: 0.13 }); noise({ dur: 1.1, freq: 380, q: 0.7, vol: 0.08 }); },
  kayu_patah: () => { noise({ dur: 0.11, freq: 4200, q: 0.7, vol: 0.22 }); tone({ freq: 110, to: 45, dur: 0.28, type: "triangle", vol: 0.12, delay: 0.02 }); },
  ombak_hantam: () => { noise({ dur: 1.8, freq: 700, q: 0.5, vol: 0.25, type: "lowpass" }); noise({ dur: 1.2, freq: 3200, q: 0.5, vol: 0.12, delay: 0.2 }); },
  camar: () => { tone({ freq: 1450, to: 2200, dur: 0.36, type: "sine", vol: 0.035 }); tone({ freq: 1900, to: 1350, dur: 0.3, type: "sine", vol: 0.03, delay: 0.42 }); },
  api: () => noise({ dur: 1.2, freq: 600, q: 0.5, vol: 0.3 })
};

function play(key, ...args) {
  if (!ctx) return;
  const isStep = key === "langkah" || key.startsWith("langkah_");
  const rate = key === "simbol" ? 1 + (args[0] || 0) * 0.06 : isStep ? 0.9 + Math.random() * 0.2 : 1;
  const fileLevels = { camar: 0.34, derit_kapal: 0.52, kayu_patah: 0.78, ombak_hantam: 0.72, gemuruh: 0.78 };
  const vol = isStep ? 0.5 : (fileLevels[key] ?? 1);
  if (!playFile(key, vol, rate)) SYNTH[key]?.(...args);
}

// API efek yang dipakai scene & UI.
export const sfx = {
  pickup: () => play("ambil"),
  discover: () => play("temuan"),
  success: () => play("berhasil"),
  fail: () => play("gagal"),
  splash: () => play("cebur"),
  thud: () => play("jatuh"),
  ui: () => play("ui_pilih"),
  open: () => play("ui_buka"),
  close: () => play("ui_tutup"),
  key: (i = 0) => play("simbol", i),
  wrong: () => play("salah"),
  rumble: () => play("gemuruh"),
  whoosh: () => play("desir"),
  horn: () => play("klakson_kapal"),
  step: (surface = "pasir") => {
    const key = surface === "daun" ? "langkah_daun" : surface === "batu" ? "langkah_batu" : "langkah_pasir";
    play(key);
  },
  shipCreak: () => play("derit_kapal"),
  woodBreak: () => play("kayu_patah"),
  waveCrash: () => play("ombak_hantam"),
  gull: () => play("camar"),
  fire: () => play("api")
};

// ---------- musik & suasana (HTMLAudio) ----------

let music = null;
let ambience = null;
let pendingMusic;
let pendingAmbience;

function fadeEl(el, to, ms, done) {
  const from = el.volume;
  const t0 = performance.now();
  const token = Symbol("fade");
  el._fade = token;
  const step = (t) => {
    if (el._fade !== token) return;
    const k = Math.min(1, (t - t0) / ms);
    el.volume = Math.max(0, Math.min(1, from + (to - from) * k));
    if (k < 1) requestAnimationFrame(step);
    else done?.();
  };
  requestAnimationFrame(step);
}

function release(channel, ms) {
  if (!channel?.el) return;
  const el = channel.el;
  fadeEl(el, 0, ms, () => {
    el.pause();
    el.src = "";
  });
}

/** Ganti musik latar dengan crossfade. key dari manifest MUSIC, atau null untuk diam. */
export function playMusic(key, { fade = 1400 } = {}) {
  if (!unlocked) {
    pendingMusic = key;
    return;
  }

  const def = key ? MUSIC[key] : null;
  const url = def ? urlFor(def.file) : null;

  // Layar Splash dan Lobby memakai URL yang sama: pertahankan elemen audio
  // yang sedang berjalan agar lagu tidak restart pada perpindahan layar.
  if (music?.el && url && music.url === url) {
    music.key = key;
    music.base = def.volume ?? music.base ?? 0.7;
    music.el.loop = def.loop !== false;
    applyVolumes();
    if (music.el.paused || music.el.ended) {
      if (music.el.ended) music.el.currentTime = 0;
      const channel = music;
      channel.el.play()
        .then(() => {
          if (music === channel) fadeEl(channel.el, musicLevel(channel.base), fade);
        })
        .catch((error) => console.warn("BGM tidak dapat diputar:", error));
    }
    return;
  }

  if (music?.key === key && !url) return;

  release(music, fade);
  music = null;
  if (!url) {
    music = { key, el: null, url: null };
    return;
  }

  const el = new Audio(url);
  el.preload = "auto";
  el.loop = def.loop !== false;
  el.volume = 0;
  const channel = { key, el, url, base: def.volume ?? 0.7 };
  music = channel;

  el.play()
    .then(() => {
      if (music === channel) fadeEl(el, musicLevel(channel.base), fade);
    })
    .catch((error) => {
      console.warn(`BGM '${key}' gagal diputar:`, error);
    });
}
export function currentMusic() {
  return music?.key || null;
}

const SYNTH_AMB = {
  voyage: { filter: "lowpass", freq: 430, q: 0.5, vol: 0.24, lfo: 0.09, depth: 0.16, chirp: [1500, 2450] },
  storm: { filter: "lowpass", freq: 700, q: 0.7, vol: 0.38, lfo: 0.22, depth: 0.28, chirp: null },
  wreck: { filter: "lowpass", freq: 230, q: 0.65, vol: 0.28, lfo: 0.07, depth: 0.12, chirp: [350, 700] },
  island: { filter: "bandpass", freq: 760, q: 0.45, vol: 0.2, lfo: 0.1, depth: 0.12, chirp: [1750, 3200] },
  pantai: { filter: "bandpass", freq: 420, q: 0.5, vol: 0.5, lfo: 0.11, depth: 0.35, chirp: null },
  hutan: { filter: "highpass", freq: 2600, q: 0.4, vol: 0.12, lfo: 0.3, depth: 0.05, chirp: [1800, 3600] },
  angin: { filter: "lowpass", freq: 380, q: 0.8, vol: 0.55, lfo: 0.07, depth: 0.3, chirp: [1200, 1700] }
};

function stopAmbience(ms = 1200) {
  if (!ambience) return;
  if (ambience.el) release(ambience, ms);
  for (const node of ambience.nodes || []) {
    try { node.stop?.(); } catch { /* sudah berhenti */ }
    try { node.disconnect(); } catch { /* abaikan */ }
  }
  clearInterval(ambience.timer);
  ambience = null;
}

/** Suasana berulang per stage ("pantai" | "hutan" | "angin"), atau null untuk diam. */
export function setAmbience(key) {
  if (!unlocked) {
    pendingAmbience = key;
    return;
  }
  if (ambience?.key === key) return;
  stopAmbience();
  if (!key) return;
  const def = AMBIENCE[key];
  const url = def ? urlFor(def.file) : null;
  if (url) {
    const el = new Audio(url);
    el.loop = true;
    el.volume = 0;
    ambience = { key, el, base: def.volume ?? 0.6 };
    el.play().then(() => fadeEl(el, sfxLevel(ambience?.base), 1500)).catch(() => {});
    return;
  }
  const cfg = SYNTH_AMB[key];
  if (!cfg || !ctx) return;
  const src = ctx.createBufferSource();
  src.buffer = noiseBuffer;
  src.loop = true;
  const filter = ctx.createBiquadFilter();
  filter.type = cfg.filter;
  filter.frequency.value = cfg.freq;
  filter.Q.value = cfg.q;
  const gain = ctx.createGain();
  gain.gain.value = cfg.vol;
  const lfo = ctx.createOscillator();
  lfo.frequency.value = cfg.lfo;
  const lfoGain = ctx.createGain();
  lfoGain.gain.value = cfg.depth;
  lfo.connect(lfoGain).connect(gain.gain);
  src.connect(filter).connect(gain).connect(ambBus);
  src.start();
  lfo.start();
  const timer = cfg.chirp
    ? setInterval(() => {
        if (Math.random() < 0.45 && !settings.muted) {
          const [lo, hi] = cfg.chirp;
          const f = lo + Math.random() * (hi - lo);
          for (let i = 0; i < 2 + Math.floor(Math.random() * 3); i++) tone({ freq: f, to: f * 1.25, dur: 0.07, vol: 0.035, delay: i * 0.11 });
        }
      }, 1800)
    : null;
  ambience = { key, nodes: [src, lfo, filter, gain, lfoGain], timer };
}
