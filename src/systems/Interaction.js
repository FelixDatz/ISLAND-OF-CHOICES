import { ITEMS } from "../data/items.js";
import { gameState, itemCount, giveItem, takeItem } from "./GameState.js";
import { logEvent } from "./EventLog.js";

// Logika interaksi murni (tanpa Phaser).
//
// Sebuah objek punya daftar aksi:
//   { id, text, once?, requires?, consumes?, effects?, dialog, hint?, removeObject? }
//   requires: { items: { rope: 1 }, flags: ["x"] }  syarat agar aksi tersedia
//   consumes: { rope: 1 }                           item yang terpakai
//   effects:  [{ give: "rope", n: 1 }, { flag: "x" }]
//   hint:     bila ada, aksi yang syaratnya belum terpenuhi tampil terkunci
//             dan menampilkan hint ini. Tanpa hint, aksi disembunyikan.

export function actionKey(obj, action) {
  return `${obj.id}.${action.id}`;
}

export function meetsRequirements(req, state = gameState) {
  if (!req) return true;
  for (const [id, n] of Object.entries(req.items || {})) {
    if (itemCount(state, id) < n) return false;
  }
  for (const flag of req.flags || []) {
    if (!state.flags[flag]) return false;
  }
  return true;
}

export function listActions(obj, state = gameState) {
  const result = [];
  for (const action of obj.actions || []) {
    if (action.challengeId && state.flags[`${action.challengeId}_resolved`]) continue;
    if (action.once && state.doneActions[actionKey(obj, action)]) continue;
    if (meetsRequirements(action.requires, state)) result.push({ action, enabled: true });
    else if (action.hint) result.push({ action, enabled: false });
  }
  return result;
}

export function performAction(obj, action, state = gameState) {
  // Validasi ulang ketika aksi dieksekusi. Ini mencegah konsumsi item parsial
  // apabila kondisi berubah setelah menu aksi dibuka.
  logEvent("action_attempted", {
    object: obj.id,
    action: action.id,
    challengeId: action.challengeId || null,
    strategy: action.strategy || null
  });

  if (action.challengeId && state.flags[`${action.challengeId}_resolved`]) {
    logEvent("action_failed", { object: obj.id, action: action.id, challengeId: action.challengeId, reason: "challenge_already_resolved" });
    return { ok: false, dialog: "Tantangan ini sudah kamu selesaikan. Lanjutkan perjalanan ke area seberang.", gained: [], removed: false };
  }
  if (action.once && state.doneActions[actionKey(obj, action)]) {
    logEvent("action_failed", { object: obj.id, action: action.id, reason: "already_completed" });
    return { ok: false, dialog: "Aksi ini sudah dilakukan.", gained: [], removed: false };
  }
  if (!meetsRequirements(action.requires, state)) {
    logEvent("action_failed", { object: obj.id, action: action.id, reason: "requirements_not_met" });
    return { ok: false, dialog: action.hint || "Kamu belum memenuhi syarat untuk melakukan aksi ini.", gained: [], removed: false };
  }
  for (const [id, n] of Object.entries(action.consumes || {})) {
    if (itemCount(state, id) < n) {
      logEvent("action_failed", { object: obj.id, action: action.id, reason: "insufficient_items", item: id });
      return { ok: false, dialog: `Barang tidak cukup: ${itemLabel(id, n)}. Tidak ada barang yang terpakai.`, gained: [], removed: false };
    }
  }

  const gained = [];
  for (const [id, n] of Object.entries(action.consumes || {})) takeItem(state, id, n);
  for (const effect of action.effects || []) {
    if (effect.give) {
      const n = effect.n || 1;
      giveItem(state, effect.give, n);
      gained.push({ id: effect.give, n });
    }
    if (effect.take) takeItem(state, effect.take, effect.n || 1);
    if (effect.flag) state.flags[effect.flag] = true;
  }
  if (action.once) state.doneActions[actionKey(obj, action)] = true;
  if (action.resolvesChallenge && action.challengeId) state.flags[`${action.challengeId}_resolved`] = true;
  if (action.removeObject) state.removedObjects[obj.id] = true;

  logEvent("action_resolved", {
    object: obj.id,
    action: action.id,
    challengeId: action.challengeId || null,
    strategy: action.strategy || null,
    status: "success",
    gained: gained.map((g) => g.id),
    consumed: { ...(action.consumes || {}) }
  });
  return { ok: true, dialog: action.dialog, gained, removed: !!action.removeObject };
}

export function itemLabel(id, n = 1) {
  const name = ITEMS[id]?.name || id;
  return n > 1 ? `${name} ×${n}` : name;
}
