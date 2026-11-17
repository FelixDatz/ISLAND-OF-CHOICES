import { ITEMS } from "../data/items.js";
import { gameState, itemCount, giveItem, takeItem } from "./GameState.js";
import { logEvent } from "./EventLog.js";

// Logika interaksi murni (tanpa Phaser). Skema aksi:
//   requires:  { items: { rope: 1 }, flags: ["x"],
//                choices: [{ label, options: [{ rope: 1 }, { vine: 1 }], consume }] }
//              `choices` = bahan alternatif; opsi pertama yang tersedia dipakai.
//   consumes:  { rope: 1 }                       item yang terpakai
//   effects:   [{ give, n }, { take, n }, { flag }, { unflag }, { stash: true }, { unstash: true }]
//   hint:      aksi yang syaratnya belum terpenuhi tampil terkunci dengan hint ini;
//              tanpa hint, aksi disembunyikan (mis. jalan rahasia yang belum ditemukan).
//   hideIfFlags: sembunyikan aksi jika salah satu flag aktif.
//   outcome:   "fatal" → selalu gagal total (tanpa konsumsi item).
//   risky:     { safeIf: kondisi, failure: { outcome: "fatal"|"setback", reason, ... } }
//              aksi berhasil hanya jika kondisi terpenuhi; jika tidak, gagal sesuai `failure`.
//   puzzle:    { symbols, solution } → harus dipecahkan lewat StageSession.submitPuzzle.
//   moveTo:    { x, y } posisi pemain setelah berhasil (mis. setelah memanjat).
// Kondisi: { flags, items, maxItems, anyOf: [kondisi, ...] }

export function actionKey(obj, action) {
  return `${obj.id}.${action.id}`;
}

export function isChallengeResolved(state, challengeId) {
  return !!state.flags[`${challengeId}_resolved`];
}

export function totalItems(state) {
  return Object.values(state.inventory).reduce((sum, n) => sum + n, 0);
}

const itemsSatisfied = (items, state) => Object.entries(items || {}).every(([id, n]) => itemCount(state, id) >= n);

function resolveChoices(req, state) {
  const chosen = [];
  for (const group of req?.choices || []) {
    const option = group.options.find((o) => itemsSatisfied(o, state));
    if (!option) return null;
    chosen.push({ label: group.label || "bahan", items: option, consume: !!group.consume });
  }
  return chosen;
}

export function conditionMet(cond, state) {
  if (!cond) return true;
  if (cond.flags && !cond.flags.every((f) => state.flags[f])) return false;
  if (cond.items && !itemsSatisfied(cond.items, state)) return false;
  if (Number.isFinite(cond.maxItems) && totalItems(state) > cond.maxItems) return false;
  if (cond.anyOf && !cond.anyOf.some((c) => conditionMet(c, state))) return false;
  return true;
}

export function meetsRequirements(req, state = gameState) {
  if (!req) return true;
  if (!itemsSatisfied(req.items, state)) return false;
  for (const flag of req.flags || []) {
    if (!state.flags[flag]) return false;
  }
  return resolveChoices(req, state) !== null;
}

export function listActions(obj, state = gameState) {
  const result = [];
  for (const action of obj.actions || []) {
    if (action.challengeId && isChallengeResolved(state, action.challengeId)) continue;
    if (action.once && state.doneActions[actionKey(obj, action)]) continue;
    if (action.hideIfFlags?.some((f) => state.flags[f])) continue;
    if (meetsRequirements(action.requires, state)) result.push({ action, enabled: true });
    else if (action.hint) result.push({ action, enabled: false });
  }
  return result;
}

function baseFields(obj, action) {
  return {
    object: obj.id,
    action: action.id,
    challengeId: action.challengeId || null,
    strategy: action.strategy || null,
    tags: action.tags || []
  };
}

function fail(obj, action, state, reason, dialog, extra = {}) {
  logEvent("action_failed", { ...baseFields(obj, action), reason, ...extra }, state);
  return { ok: false, reason, dialog, gained: [], removed: false, resolvedChallenge: null, strategy: action.strategy || null };
}

function applyEffect(effect, state, gained) {
  if (effect.give) {
    const n = effect.n || 1;
    giveItem(state, effect.give, n);
    gained.push({ id: effect.give, n });
  }
  if (effect.take) takeItem(state, effect.take, effect.n || 1);
  if (effect.flag) state.flags[effect.flag] = true;
  if (effect.unflag) delete state.flags[effect.unflag];
  if (effect.stash) {
    for (const [id, n] of Object.entries(state.inventory)) state.stash[id] = (state.stash[id] || 0) + n;
    state.inventory = {};
    if (Object.keys(state.stash).length) state.flags.stash_has_items = true;
  }
  if (effect.unstash) {
    for (const [id, n] of Object.entries(state.stash)) giveItem(state, id, n);
    state.stash = {};
    delete state.flags.stash_has_items;
  }
}

export function performAction(obj, action, state = gameState, opts = {}) {
  // Validasi ulang ketika aksi dieksekusi. Ini mencegah konsumsi item parsial
  // apabila kondisi berubah setelah menu aksi dibuka.
  logEvent("action_attempted", baseFields(obj, action), state);

  if (action.challengeId && isChallengeResolved(state, action.challengeId)) {
    return fail(obj, action, state, "challenge_already_resolved", "Tantangan ini sudah kamu selesaikan.");
  }
  if (action.once && state.doneActions[actionKey(obj, action)]) {
    return fail(obj, action, state, "already_completed", "Aksi ini sudah dilakukan.");
  }
  if (!meetsRequirements(action.requires, state)) {
    return fail(obj, action, state, "requirements_not_met", action.hint || "Kamu belum memenuhi syarat untuk melakukan aksi ini.");
  }
  if (action.puzzle && !opts.puzzleSolved) {
    return fail(obj, action, state, "puzzle_unsolved", "Teka-tekinya belum terpecahkan.");
  }
  for (const [id, n] of Object.entries(action.consumes || {})) {
    if (itemCount(state, id) < n) {
      return fail(obj, action, state, "insufficient_items", `Barang tidak cukup: ${itemLabel(id, n)}. Tidak ada barang yang terpakai.`, { item: id });
    }
  }
  if (action.outcome === "fatal") {
    const result = fail(obj, action, state, action.fatal?.reason || "fatal", action.dialog, { outcome: "fatal" });
    return { ...result, fatal: action.fatal || { reason: "fatal" } };
  }
  if (action.risky && !conditionMet(action.risky.safeIf, state)) {
    const failure = action.risky.failure || { outcome: "setback", reason: "risk_failed" };
    const result = fail(obj, action, state, failure.reason, failure.text, { outcome: failure.outcome, carried: totalItems(state) });
    return failure.outcome === "fatal" ? { ...result, fatal: failure } : { ...result, setback: failure };
  }

  const chosen = resolveChoices(action.requires, state) || [];
  const gained = [];
  for (const [id, n] of Object.entries(action.consumes || {})) takeItem(state, id, n);
  for (const c of chosen) if (c.consume) for (const [id, n] of Object.entries(c.items)) takeItem(state, id, n);
  for (const effect of action.effects || []) applyEffect(effect, state, gained);
  if (action.once) state.doneActions[actionKey(obj, action)] = true;
  if (action.discoveryId) state.flags[`discovery_${action.discoveryId}`] = true;
  if (action.removeObject) state.removedObjects[obj.id] = true;

  // Barang yang "dipakai" = dikonsumsi + alat yang disyaratkan + bahan alternatif terpilih.
  const usedItems = [...new Set([
    ...Object.keys(action.consumes || {}),
    ...Object.keys(action.requires?.items || {}),
    ...chosen.flatMap((c) => Object.keys(c.items))
  ])];
  const resolvedEvent = logEvent("action_resolved", {
    ...baseFields(obj, action),
    discoveryId: action.discoveryId || null,
    status: "success",
    gained: gained.map((g) => g.id),
    consumed: { ...(action.consumes || {}) },
    usedItems,
    choices: chosen.map((c) => ({ label: c.label, items: Object.keys(c.items) })),
    risk: action.risky ? "safe" : undefined
  }, state);

  let resolvedChallenge = null;
  if (action.resolvesChallenge && action.challengeId) {
    resolvedChallenge = action.challengeId;
    state.flags[`${action.challengeId}_resolved`] = true;
    state.challenges[action.challengeId] = {
      strategy: action.strategy || null,
      object: obj.id,
      action: action.id,
      eventId: resolvedEvent.eventId,
      attempt: state.attempt
    };
    logEvent("challenge_resolved", {
      challengeId: action.challengeId,
      strategy: action.strategy || null,
      tags: action.tags || [],
      status: "success"
    }, state);
  }

  if (action.discoveryId) {
    logEvent("discovery_made", {
      discoveryId: action.discoveryId,
      object: obj.id,
      action: action.id,
      category: action.discoveryCategory || "environmental_clue",
      title: action.discoveryTitle || obj.label || "Penemuan",
      note: action.journalNote || action.dialog || "Sebuah detail telah ditemukan."
    }, state);
  } else if (action.journalNote) {
    logEvent("journal_note_added", {
      noteId: action.noteId || `${obj.id}_${action.id}`,
      title: action.discoveryTitle || obj.label || "Catatan perjalanan",
      note: action.journalNote,
      category: action.discoveryCategory || "observation",
      object: obj.id,
      action: action.id
    }, state);
  }
  return {
    ok: true,
    dialog: action.dialog,
    gained,
    removed: !!action.removeObject,
    resolvedChallenge,
    strategy: action.strategy || null,
    moveTo: action.moveTo || null
  };
}

export function itemLabel(id, n = 1) {
  const name = ITEMS[id]?.name || id;
  return n > 1 ? `${name} ×${n}` : name;
}
