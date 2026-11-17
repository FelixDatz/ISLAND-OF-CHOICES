// Pengiriman event log ke server. Klien hanya mengirim event mentah; server
// menghitung ulang analisis. Semua fungsi aman dipanggil walau server mati.

const ENDPOINT = "/api/sessions";
const PLAYER_KEY = "ioc:playerId";
const NAME_KEY = "ioc:playerName";
const CLIENT_VERSION = "1.0.0";

function uuid() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

function storage(op, key, value) {
  try {
    if (op === "get") return localStorage.getItem(key);
    localStorage.setItem(key, value);
  } catch {
    return null;
  }
  return null;
}

let sessionId = uuid();
let finalSent = false;

export function getSessionId() {
  return sessionId;
}

export function newSession() {
  sessionId = uuid();
  finalSent = false;
  return sessionId;
}

/** Melanjutkan sesi tersimpan (fitur Lanjutkan) agar laporan tetap satu sesi. */
export function resumeSession(id) {
  if (typeof id === "string" && id.length >= 6) sessionId = id;
  finalSent = false;
}

/** Nama penjelajah dari layar mulai (opsional). */
export function setPlayerName(name) {
  const clean = String(name || "").trim().slice(0, 40);
  storage("set", NAME_KEY, clean);
}

export function getPlayerName() {
  return storage("get", NAME_KEY) || "";
}

/** Pemain anonim (ID tersimpan di browser). Nama opsional lewat URL ?player=Nama */
export function getPlayer() {
  let id = storage("get", PLAYER_KEY);
  if (!id) {
    id = uuid();
    storage("set", PLAYER_KEY, id);
  }
  let name = null;
  try {
    name = new URLSearchParams(window.location.search).get("player");
  } catch {
    name = null;
  }
  if (name) storage("set", NAME_KEY, name);
  else name = storage("get", NAME_KEY) || null;
  return { id, name: name ? name.slice(0, 40) : null };
}

function payload(log, final) {
  return { sessionId, player: getPlayer(), final, client: { version: CLIENT_VERSION }, log };
}

export async function submitSession(log, { final = true, timeoutMs = 6000 } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload(log, final)),
      signal: controller.signal
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) return { ok: false, error: data?.error || `HTTP ${res.status}` };
    if (final) finalSent = true;
    return { ok: true, data };
  } catch (err) {
    return { ok: false, error: err?.name === "AbortError" ? "timeout" : "server tidak terjangkau" };
  } finally {
    clearTimeout(timer);
  }
}

/** Saat tab ditutup sebelum selesai, kirim log parsial (untuk data pemain yang berhenti). */
export function installExitBeacon(getLog) {
  window.addEventListener("pagehide", () => {
    if (finalSent || !navigator.sendBeacon) return;
    const log = getLog();
    if (!log.some((e) => e.type === "stage_start")) return;
    const blob = new Blob([JSON.stringify(payload(log, false))], { type: "application/json" });
    navigator.sendBeacon(ENDPOINT, blob);
  });
}
