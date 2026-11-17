import test from "node:test";
import assert from "node:assert/strict";
import { getStage, STAGES } from "../src/data/stages.js";
import { createState, giveItem, itemCount } from "../src/systems/GameState.js";
import { StageSession } from "../src/systems/StageSession.js";
import { listActions } from "../src/systems/Interaction.js";

const start = (stageId, inventory = {}) => {
  const state = createState();
  const session = new StageSession(getStage(stageId), state).start({ inventory });
  return { state, session };
};
const ids = (session, objectId) => listActions(session.object(objectId), session.state).map((e) => e.action.id);

test("three stages are registered, each main challenge has at least four strategies", () => {
  assert.deepEqual(STAGES.map((s) => s.id), ["stage1", "stage2", "stage3"]);
  for (const s of STAGES) {
    assert.ok(Object.keys(s.challenges[s.mainChallenge].strategies).length >= 4, s.id);
    assert.ok(s.reachableCells.length > 10, `${s.id} reachable cells`);
  }
});

test("every main-challenge strategy is reachable through some action", () => {
  for (const s of STAGES) {
    const used = new Set(s.objects.flatMap((o) => (o.actions || []).filter((a) => a.challengeId === s.mainChallenge).map((a) => a.strategy)));
    for (const strategy of Object.keys(s.challenges[s.mainChallenge].strategies)) assert.ok(used.has(strategy), `${s.id}.${strategy}`);
  }
});

test("finishing a stage carries the inventory into the next stage", () => {
  const { state, session } = start("stage1");
  giveItem(state, "shell", 1);
  session.perform("upstream_path", "discover_shallow_route");
  session.finish();
  const next = session.nextStart();
  assert.equal(next.stageId, "stage2");
  const s2 = new StageSession(getStage("stage2"), state).start(next);
  assert.equal(itemCount(state, "shell"), 1);
  assert.ok(state.log.some((e) => e.type === "stage_start" && e.stage === "stage2" && e.carriedItems.shell === 1));
  assert.equal(s2.nextStart().stageId, "stage3");
});

test("retry restores the inventory the player had at the start of the stage", () => {
  const { state, session } = start("stage3", { map_fragment: 0, banana: 1 });
  session.perform("woodpile", "take_wood");
  const next = session.retry();
  new StageSession(getStage("stage3"), state).start(next);
  assert.equal(itemCount(state, "dry_wood"), 0);
  assert.equal(itemCount(state, "banana"), 1);
});

test("stage 2 glyph puzzle: wrong guesses give positional feedback, correct guess opens the gate", () => {
  const { state, session } = start("stage2");
  assert.equal(session.interact("temple_panel").mode, "menu");
  const wrong = session.submitPuzzle("temple_panel", "enter_code", ["sun", "leaf", "wave", "moon"]);
  assert.deepEqual([wrong.correct, wrong.exact], [false, 2]);
  assert.equal(state.flags.temple_gate_resolved, undefined);
  const right = session.submitPuzzle("temple_panel", "enter_code", ["sun", "wave", "leaf", "moon"]);
  assert.equal(right.correct, true);
  assert.equal(right.result.resolvedChallenge, "temple_gate");
  assert.equal(session.perform("temple_panel", "enter_code").reason, "challenge_already_resolved");
});

test("puzzle actions cannot be completed by bypassing the puzzle", () => {
  const { session } = start("stage2");
  assert.equal(session.perform("temple_panel", "enter_code").reason, "puzzle_unsolved");
});

test("stage 2 lever accepts rope OR vine and consumes only the chosen binding", () => {
  const { state, session } = start("stage2", { bamboo: 1, vine: 1, rope: 1 });
  assert.ok(ids(session, "temple_panel").includes("build_lever"));
  const r = session.perform("temple_panel", "build_lever");
  assert.equal(r.ok, true);
  assert.equal(itemCount(state, "rope"), 0);
  assert.equal(itemCount(state, "vine"), 1);
  assert.equal(itemCount(state, "bamboo"), 0);
});

test("stage 2 climbing: heavy load = setback without resolving; light load = success", () => {
  const heavy = start("stage2", { rope: 1, small_axe: 1, bamboo: 1, banana: 1 });
  const fail = heavy.session.perform("cracked_wall", "climb");
  assert.equal(fail.ok, false);
  assert.equal(fail.setback.reason, "fell_from_wall");
  assert.equal(heavy.state.flags.temple_gate_resolved, undefined);
  // Menitipkan barang membuat beban ringan.
  heavy.session.perform("hollow_log", "stash_items");
  assert.deepEqual(heavy.state.inventory, {});
  assert.ok(ids(heavy.session, "hollow_log").includes("take_back"));
  const ok = heavy.session.perform("cracked_wall", "climb");
  assert.equal(ok.ok, true);
  assert.deepEqual(ok.moveTo, { x: 1790, y: 1110 });
  heavy.session.finish();
  const done = heavy.state.log.find((e) => e.type === "stage_complete");
  assert.equal(done.left.rope, 1);
});

test("stage 2 waterfall passage stays hidden until the birds are observed", () => {
  const { session } = start("stage2");
  assert.deepEqual(ids(session, "waterfall"), []);
  session.perform("waterfall_birds", "watch_birds");
  assert.deepEqual(ids(session, "waterfall"), ["slip_behind"]);
});

test("stage 2 monkey accepts either banana or coconut, then both offers disappear", () => {
  const { state, session } = start("stage2", { coconut: 1 });
  assert.deepEqual(ids(session, "monkey"), ["give_banana", "give_coconut"]);
  session.perform("monkey", "give_coconut");
  assert.equal(itemCount(state, "vine"), 1);
  assert.deepEqual(ids(session, "monkey"), []);
});

test("stage 3 signal fire: cloth can replace grass (consumed), lens is kept", () => {
  const { state, session } = start("stage3", { dry_wood: 2, cloth: 1, lens: 1 });
  const r = session.perform("signal_firepit", "light_fire");
  assert.equal(r.ok, true);
  assert.equal(itemCount(state, "cloth"), 0);
  assert.equal(itemCount(state, "lens"), 1);
  const resolved = state.log.find((e) => e.type === "action_resolved" && e.action === "light_fire");
  assert.deepEqual(resolved.usedItems.sort(), ["cloth", "dry_wood", "lens"]);
});

test("stage 3 sailing is fatal without knowledge, safe with the Stage 1 map fragment", () => {
  const blind = start("stage3", { planks: 2, rope: 1 });
  const fatal = blind.session.perform("boat_frame", "sail_away");
  assert.equal(fatal.fatal.reason, "capsized_reef");
  assert.equal(itemCount(blind.state, "planks"), 2);
  const informed = start("stage3", { planks: 2, rope: 1, map_fragment: 1 });
  const ok = informed.session.perform("boat_frame", "sail_away");
  assert.equal(ok.ok, true);
  assert.equal(informed.session.isGoalUnlocked(), true);
});

test("stage 3 lamp requires oil before the code can be entered", () => {
  const { session } = start("stage3");
  const list = listActions(session.object("lighthouse_lamp"), session.state);
  assert.equal(list[0].enabled, false);
});
