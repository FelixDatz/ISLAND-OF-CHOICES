// Audio sintetis (WebAudio) tanpa file: efek suara pendek + ambience per tema.
// AudioContext baru dibuat setelah interaksi pertama pemain (aturan browser).

const MUTE_KEY = "ioc:muted";
let ctx = null;
let master = null;
let sfxBus = null;
let ambBus = null;
let noiseBuffer = null;
let ambience = null;
let muted = false;
let pendingTheme = null;

try {
  muted = localStorage.getItem(MUTE_KEY) === "1";
} catch {
  muted = false;
}

function init() {
  if (ctx) return true;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return false;
  ctx = new AC();
  master = ctx.createGain();
  master.gain.value = muted ? 0 : 0.7;
  master.connect(ctx.destination);
  sfxBus = ctx.createGain();
  sfxBus.gain.value = 0.9;
  sfxBus.connect(master);
  ambBus = ctx.createGain();
  ambBus.gain.value = 0.55;
  ambBus.connect(master);
  noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
  const data = noiseBuffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  return true;
}

/** Panggil dari handler input pertama (keydown/klik). */
export function unlockAudio() {
  if (!init()) return;
  if (ctx.state === "suspended") ctx.resume();
  if (pendingTheme) {
    const theme = pendingTheme;
    pendingTheme = null;
    setAmbience(theme);
  }
}

export function isMuted() {
  return muted;
}

export function toggleMute() {
  muted = !muted;
  try {
    localStorage.setItem(MUTE_KEY, muted ? "1" : "0");
  } catch {
    // abaikan
  }
  if (master) master.gain.setTargetAtTime(muted ? 0 : 0.7, ctx.currentTime, 0.05);
  return muted;
}

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

export const sfx = {
  pickup: () => { tone({ freq: 660, to: 990, dur: 0.12, type: "triangle", vol: 0.16 }); tone({ freq: 990, to: 1320, dur: 0.14, type: "triangle", vol: 0.1, delay: 0.07 }); },
  discover: () => [784, 988, 1175].forEach((f, i) => tone({ freq: f, dur: 0.22, type: "sine", vol: 0.1, delay: i * 0.07 })),
  success: () => [523, 659, 784, 1046].forEach((f, i) => tone({ freq: f, dur: 0.4, type: "triangle", vol: 0.14, delay: i * 0.1 })),
  fail: () => tone({ freq: 240, to: 90, dur: 0.5, type: "sawtooth", vol: 0.1 }),
  splash: () => { noise({ dur: 0.9, freq: 900, q: 0.6, vol: 0.45 }); noise({ dur: 0.5, freq: 2400, q: 1, vol: 0.2, delay: 0.1 }); },
  thud: () => { tone({ freq: 130, to: 45, dur: 0.35, vol: 0.35 }); noise({ dur: 0.25, freq: 300, q: 1, vol: 0.3 }); },
  ui: () => tone({ freq: 880, dur: 0.05, type: "square", vol: 0.04 }),
  open: () => tone({ freq: 520, to: 700, dur: 0.08, type: "triangle", vol: 0.07 }),
  close: () => tone({ freq: 600, to: 420, dur: 0.08, type: "triangle", vol: 0.06 }),
  key: (i = 0) => tone({ freq: 440 + i * 110, dur: 0.08, type: "square", vol: 0.05 }),
  wrong: () => { tone({ freq: 300, dur: 0.12, type: "square", vol: 0.07 }); tone({ freq: 190, dur: 0.2, type: "square", vol: 0.07, delay: 0.12 }); },
  rumble: () => { noise({ dur: 1.6, freq: 110, q: 0.7, vol: 0.6, type: "lowpass" }); tone({ freq: 55, dur: 1.4, vol: 0.2 }); },
  whoosh: () => noise({ dur: 0.5, freq: 1400, q: 0.8, vol: 0.18 }),
  horn: () => { tone({ freq: 147, dur: 1.8, type: "sawtooth", vol: 0.09 }); tone({ freq: 110, dur: 1.8, type: "sawtooth", vol: 0.08 }); },
  step: () => noise({ dur: 0.05, freq: 1600, q: 2, vol: 0.025 }),
  fire: () => noise({ dur: 1.2, freq: 600, q: 0.5, vol: 0.3 })
};

function stopAmbience() {
  if (!ambience) return;
  for (const node of ambience.nodes) {
    try { node.stop?.(); } catch { /* sudah berhenti */ }
    try { node.disconnect(); } catch { /* abaikan */ }
  }
  clearInterval(ambience.timer);
  ambience = null;
}

const THEMES = {
  beach: { filter: "bandpass", freq: 420, q: 0.5, vol: 0.5, lfo: 0.11, depth: 0.35, chirp: null },
  jungle: { filter: "highpass", freq: 2600, q: 0.4, vol: 0.12, lfo: 0.3, depth: 0.05, chirp: [1800, 3600] },
  wind: { filter: "lowpass", freq: 380, q: 0.8, vol: 0.55, lfo: 0.07, depth: 0.3, chirp: [1200, 1700] }
};

/** Ambience berulang sesuai tema stage ("beach" | "jungle" | "wind"). */
export function setAmbience(theme) {
  if (!ctx) {
    pendingTheme = theme;
    return;
  }
  stopAmbience();
  const cfg = THEMES[theme];
  if (!cfg) return;
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
        if (Math.random() < 0.45) {
          const [lo, hi] = cfg.chirp;
          const f = lo + Math.random() * (hi - lo);
          for (let i = 0; i < 2 + Math.floor(Math.random() * 3); i++) tone({ freq: f, to: f * 1.25, dur: 0.07, vol: 0.035, delay: i * 0.11 });
        }
      }, 1800)
    : null;
  ambience = { nodes: [src, lfo, filter, gain, lfoGain], timer };
}
