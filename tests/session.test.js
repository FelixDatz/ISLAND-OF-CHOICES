import test, { beforeEach } from "node:test";
import assert from "node:assert/strict";
import { getStage } from "../src/data/stages.js";
import { createState } from "../src/systems/GameState.js";
import { StageSession, zoneAt } from "../src/systems/StageSession.js";
import { buildJournalSnapshot } from "../src/systems/Journal.js";
import { runPlaythrough } from "../src/sim/playthrough.js";

const stage = getStage("stage1");
let state;
let session;
beforeEach(() => {
  state = createState();
  session = new StageSession(stage, state).start({ attempt: 1 });
});

test("challenge-resolving actions always require a menu choice (no accidental decisions)", () => {
  assert.equal(session.interact("upstream_path").mode, "menu");
  assert.equal(session.interact("wreck").mode, "auto");
  assert.equal(state.flags.river_crossing_open, undefined);
});

test("every event carries stage and attempt", () => {
  session.enterZone("shore");
  session.perform("wreck", "search");
  for (const e of state.log) {
    assert.equal(e.stage, "stage1");
    assert.equal(e.attempt, 1);
  }
});

test("goal is locked until the river is crossed; stage_complete records the real strategy", () => {
  assert.equal(session.reachGoal(), false);
  session.perform("upstream_path", "discover_shallow_route");
  assert.equal(session.reachGoal(), true);
  const done = session.finish();
  assert.equal(done.strategy, "upstream_route");
  assert.equal(state.flags.stage1_complete, true);
});

test("retry keeps the log, resets the world and increments the attempt", () => {
  session.perform("wreck", "search");
  const fatal = session.perform("river_bank", "swim");
  session.completeFatal(fatal.fatal);
  const next = session.retry();
  const logLength = state.log.length;
  session = new StageSession(stage, state).start(next);
  assert.equal(state.attempt, 2);
  assert.deepEqual(state.inventory, {});
  assert.equal(state.log.length, logLength + 1);
  assert.ok(state.log.some((e) => e.type === "retry_selected" && e.reason === "drowned_midstream"));
});

test("zone changes log dwell time and distance", () => {
  session.enterZone("shore");
  session.addDistance(120);
  session.enterZone("wilderness");
  const left = state.log.find((e) => e.type === "zone_left");
  assert.equal(left.zoneId, "shore");
  assert.equal(left.distance, 120);
  assert.equal(zoneAt(stage, 1500, 700).id, "far_side");
});

test("journal shows human labels and no interpretations", () => {
  const s = runPlaythrough([["zone", "shore"], ["do", "wreck", "search"], ["do", "upstream_path", "discover_shallow_route"]]);
  const journal = buildJournalSnapshot(s, stage);
  assert.equal(journal.decisions[0].strategy, "Jalur dangkal di hulu");
  assert.equal("evidence" in journal, false);
});
