import { gameState, resetState } from "./GameState.js";
import { logEvent } from "./EventLog.js";
import { now } from "./Clock.js";
import { listActions, performAction } from "./Interaction.js";
import { CELL_SIZE, nextStageId } from "../data/stages.js";

// Zona yang memuat titik (x, y), atau null.
export function zoneAt(stage, x, y) {
  return stage.zones.find(({ bounds: b }) => x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) || null;
}

export const cellKey = (x, y) => `${Math.floor(x / CELL_SIZE)},${Math.floor(y / CELL_SIZE)}`;

/**
 * Aturan satu percobaan stage, tanpa Phaser. StageScene memanggilnya dari input
 * pemain; simulator dan tes memanggilnya langsung. Semua event dicatat di sini
 * sehingga data analisis identik antara game dan simulasi.
 */
export class StageSession {
  constructor(stage, state = gameState) {
    this.stage = stage;
    this.state = state;
    this.objects = new Map(stage.objects.filter((o) => o.id).map((o) => [o.id, o]));
    this.reachable = new Set(stage.reachableCells || []);
  }

  /**
   * inventory: barang yang dibawa dari stage sebelumnya (atau awal percobaan ini).
   * visitedCells: sel peta yang sudah dijelajahi di percobaan sebelumnya.
   */
  start({ attempt = 1, priorLog, startedAt, reason = null, inventory = null, visitedCells = null } = {}) {
    const keepLog = Array.isArray(priorLog) ? [...priorLog] : this.state.log;
    const keepStartedAt = Number.isFinite(startedAt) ? startedAt : this.state.startedAt;
    resetState(this.state);
    this.state.log = keepLog;
    this.state.startedAt = keepStartedAt;
    this.state.stageId = this.stage.id;
    this.state.attempt = Number.isFinite(attempt) ? attempt : 1;
    this.startInventory = { ...(inventory || {}) };
    this.state.inventory = { ...this.startInventory };

    this.zone = null;
    this.zoneEnteredAt = 0;
    this.zoneDistance = 0;
    this.distance = 0;
    this.goalVisits = 0;
    this.finished = false;
    this.lastFatal = null;
    this.cells = new Set(visitedCells || []);
    this.startedT = now();
    logEvent("stage_start", { restartReason: reason, carriedItems: { ...this.startInventory } }, this.state);
    return this;
  }

  log(type, data) {
    return logEvent(type, data, this.state);
  }

  object(id) {
    const obj = this.objects.get(id);
    if (!obj) throw new Error(`Objek tidak dikenal: ${id}`);
    return obj;
  }

  action(objectId, actionId) {
    const action = this.object(objectId).actions.find((a) => a.id === actionId);
    if (!action) throw new Error(`Aksi tidak dikenal: ${objectId}.${actionId}`);
    return action;
  }

  // ---------- pergerakan & eksplorasi ----------

  enterZone(zoneId) {
    if (zoneId === this.zone) return null;
    this.leaveZone();
    const zone = this.stage.zones.find((z) => z.id === zoneId) || null;
    this.zone = zoneId;
    this.zoneEnteredAt = now();
    this.zoneDistance = 0;
    this.log("zone_entered", { zoneId, zoneTitle: zone?.title || zoneId });
    return zone;
  }

  leaveZone() {
    if (!this.zone) return;
    this.log("zone_left", { zoneId: this.zone, dwellMs: now() - this.zoneEnteredAt, distance: Math.round(this.zoneDistance) });
    this.zone = null;
  }

  addDistance(d) {
    if (!(d > 0)) return;
    this.distance += d;
    this.zoneDistance += d;
  }

  /** Menandai sel peta di posisi (x, y). true jika sel baru. */
  visit(x, y) {
    const key = cellKey(x, y);
    if (this.cells.has(key)) return false;
    this.cells.add(key);
    return true;
  }

  /** Untuk simulasi: tandai sebagian sel terjangkau sebagai sudah dijelajahi. */
  markCoverage(ratio) {
    const cells = this.stage.reachableCells || [];
    for (const key of cells.slice(0, Math.round(cells.length * ratio))) this.cells.add(key);
  }

  coverage() {
    if (!this.reachable.size) return 0;
    let n = 0;
    for (const key of this.cells) if (this.reachable.has(key)) n += 1;
    return Math.round((n / this.reachable.size) * 100) / 100;
  }

  // ---------- interaksi ----------

  /**
   * Membuka interaksi. mode:
   *  - "examine": tidak ada aksi, tampilkan deskripsi
   *  - "auto":    satu aksi non-keputusan, langsung dijalankan
   *  - "menu":    pemain memilih (aksi keputusan SELALU lewat menu/konfirmasi)
   */
  interact(objectId) {
    const obj = this.object(objectId);
    const list = listActions(obj, this.state);
    this.log("interact", {
      object: obj.id,
      options: list.filter((a) => a.enabled).map((a) => a.action.id),
      locked: list.filter((a) => !a.enabled).map((a) => a.action.id)
    });
    let mode = "menu";
    if (list.length === 0) mode = "examine";
    else if (list.length === 1 && list[0].enabled && !list[0].action.isDecision && !list[0].action.puzzle) mode = "auto";
    return { obj, list, mode, text: obj.examine || "Tidak ada lagi yang bisa kamu lakukan di sini." };
  }

  perform(objectId, actionId) {
    const result = performAction(this.object(objectId), this.action(objectId, actionId), this.state);
    if (result.fatal) this.lastFatal = result.fatal;
    return result;
  }

  blocked(objectId, actionId) {
    const action = this.action(objectId, actionId);
    this.log("blocked_action", { object: objectId, action: actionId, challengeId: action.challengeId || null, strategy: action.strategy || null, tags: action.tags || [] });
    return action.hint || "Belum bisa dilakukan.";
  }

  cancel(objectId) {
    this.log("menu_cancel", { object: objectId });
  }

  panelOpened(panel) {
    this.log(`${panel}_open`, {});
  }

  // ---------- teka-teki ----------

  openPuzzle(objectId, actionId) {
    const action = this.action(objectId, actionId);
    this.log("puzzle_opened", { object: objectId, action: actionId, challengeId: action.challengeId || null, strategy: action.strategy || null });
    return action.puzzle;
  }

  /** input: array id simbol. Mengembalikan { correct, exact, result? }. */
  submitPuzzle(objectId, actionId, input) {
    const obj = this.object(objectId);
    const action = this.action(objectId, actionId);
    const { solution } = action.puzzle;
    const exact = input.filter((s, i) => s === solution[i]).length;
    const correct = input.length === solution.length && exact === solution.length;
    this.log("puzzle_attempt", {
      object: objectId, action: actionId, challengeId: action.challengeId || null, strategy: action.strategy || null,
      tags: action.tags || [], input: input.join(","), exact, length: solution.length, correct
    });
    if (!correct) return { correct: false, exact };
    return { correct: true, exact, result: performAction(obj, action, this.state, { puzzleSolved: true }) };
  }

  closePuzzle(objectId, actionId) {
    this.log("puzzle_closed", { object: objectId, action: actionId });
  }

  // ---------- kegagalan & percobaan ulang ----------

  completeFatal(fatal = this.lastFatal) {
    this.log("fatal_outcome", { reason: fatal?.reason || "fatal", location: fatal?.moveTo || null });
  }

  completeSetback(setback) {
    this.log("setback", { reason: setback?.reason || "setback", respawn: setback?.respawn || null });
  }

  /** Data untuk memulai percobaan berikutnya (log & inventori awal dipertahankan). */
  retry() {
    this.leaveZone();
    const reason = this.lastFatal?.reason || "retry";
    this.log("retry_selected", { reason });
    return {
      stageId: this.stage.id,
      priorLog: [...this.state.log],
      startedAt: this.state.startedAt,
      attempt: this.state.attempt + 1,
      reason,
      inventory: { ...this.startInventory },
      visitedCells: [...this.cells]
    };
  }

  // ---------- tujuan stage ----------

  isGoalUnlocked() {
    return (this.stage.goal.requiresFlags || []).every((flag) => this.state.flags[flag]);
  }

  /** Pemain masuk area tujuan. true = boleh menyelesaikan stage. */
  reachGoal() {
    if (this.finished || !this.isGoalUnlocked()) return false;
    this.goalVisits += 1;
    this.log("goal_reached", { visit: this.goalVisits });
    return true;
  }

  keepExploring() {
    this.log("goal_deferred", { visit: this.goalVisits });
  }

  finish() {
    if (this.finished) return null;
    this.leaveZone();
    this.finished = true;
    this.state.flags[`${this.stage.id}_complete`] = true;
    const main = this.stage.mainChallenge;
    return this.log("stage_complete", {
      challengeId: main,
      strategy: this.state.challenges[main]?.strategy || null,
      inventory: { ...this.state.inventory },
      left: { ...this.state.stash },
      distance: Math.round(this.distance),
      coverage: this.coverage(),
      attemptDurationMs: now() - this.startedT
    });
  }

  /** Data untuk memulai stage berikutnya (inventori terbawa), atau null jika ini stage terakhir. */
  nextStart() {
    const next = nextStageId(this.stage.id);
    if (!next) return null;
    return {
      stageId: next,
      priorLog: [...this.state.log],
      startedAt: this.state.startedAt,
      attempt: 1,
      reason: "stage_advance",
      inventory: { ...this.state.inventory }
    };
  }
}
