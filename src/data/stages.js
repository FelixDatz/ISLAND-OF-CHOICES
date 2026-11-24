import { STAGE1 } from "./stage1.js";
import { STAGE2 } from "./stage2.js";
import { STAGE3 } from "./stage3.js";

// Registri stage. Urutan = alur permainan.
const RAW_STAGES = [STAGE1, STAGE2, STAGE3];

export const CELL_SIZE = 200;

const inside = (r, x, y) => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;

// Sel peta (200px) yang pusatnya bisa diinjak. Dipakai untuk metrik cakupan
// eksplorasi dan fog-of-war minimap.
function reachableCells(stage) {
  const blockers = [
    ...(stage.water || []).filter((w) => w.solid !== false),
    ...(stage.walls || [])
  ];
  const cells = [];
  for (let cy = 0; cy * CELL_SIZE < stage.world.height; cy++) {
    for (let cx = 0; cx * CELL_SIZE < stage.world.width; cx++) {
      const x = cx * CELL_SIZE + CELL_SIZE / 2;
      const y = cy * CELL_SIZE + CELL_SIZE / 2;
      if (!blockers.some((b) => inside(b, x, y))) cells.push(`${cx},${cy}`);
    }
  }
  return cells;
}

// Melengkapi & memvalidasi data stage: tag strategi digabung ke aksi, aksi
// "keputusan" ditandai, gate dinormalisasi, dan referensi diperiksa.
export function prepareStage(stage) {
  for (const [id, challenge] of Object.entries(stage.challenges || {})) {
    if (challenge.gate && !challenge.gates) challenge.gates = { main: challenge.gate };
    const gateIds = Object.keys(challenge.gates || {});
    for (const [sid, strategy] of Object.entries(challenge.strategies)) {
      if (strategy.opens === undefined && gateIds.length) strategy.opens = gateIds[0];
      if (strategy.opens && !gateIds.includes(strategy.opens)) throw new Error(`[${stage.id}] ${id}.${sid}: gate '${strategy.opens}' tidak ada`);
    }
  }
  for (const obj of stage.objects) {
    for (const action of obj.actions || []) {
      const where = `[${stage.id}] ${obj.id}.${action.id}`;
      const challenge = action.challengeId ? stage.challenges?.[action.challengeId] : null;
      if (action.challengeId && !challenge) throw new Error(`${where}: tantangan '${action.challengeId}' tidak ada`);
      const strategy = challenge && action.strategy ? challenge.strategies[action.strategy] : null;
      if (challenge && action.strategy && !strategy) throw new Error(`${where}: strategi '${action.strategy}' tidak ada`);
      if (action.puzzle) {
        const ids = action.puzzle.symbols.map((s) => s.id);
        if (!action.puzzle.solution.every((s) => ids.includes(s))) throw new Error(`${where}: solusi puzzle memakai simbol tak dikenal`);
      }
      action.tags = [...new Set([...(action.tags || []), ...(strategy?.tags || [])])];
      action.isDecision = !!(action.resolvesChallenge || action.outcome === "fatal" || action.risky);
    }
  }
  stage.reachableCells = reachableCells(stage);
  return stage;
}

export const STAGES = RAW_STAGES.map(prepareStage);
const BY_ID = new Map(STAGES.map((stage) => [stage.id, stage]));

export function getStage(id) {
  const stage = BY_ID.get(id);
  if (!stage) throw new Error(`Stage tidak dikenal: ${id}`);
  return stage;
}

export function firstStageId() {
  return STAGES[0].id;
}

export function nextStageId(id) {
  const index = STAGES.findIndex((stage) => stage.id === id);
  return STAGES[index + 1]?.id || null;
}

export function stageIndex(id) {
  return STAGES.findIndex((stage) => stage.id === id);
}

export function strategyLabel(stage, challengeId, strategy) {
  return stage?.challenges?.[challengeId]?.strategies?.[strategy]?.label || strategy || "-";
}