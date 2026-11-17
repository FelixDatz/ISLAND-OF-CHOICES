import test, { beforeEach } from "node:test";
import assert from "node:assert/strict";
import { getStage, STAGES } from "../src/data/stages.js";
import { gameState, resetState, giveItem, itemCount } from "../src/systems/GameState.js";
import { listActions, performAction } from "../src/systems/Interaction.js";

const stage = getStage("stage1");
const object = (id) => stage.objects.find((o) => o.id === id);
const action = (obj, id) => obj.actions.find((a) => a.id === id);

beforeEach(() => resetState());

test("stage data is valid: every action has tags and decisions are flagged", () => {
  for (const s of STAGES) {
    for (const o of s.objects) {
      for (const a of o.actions || []) {
        assert.ok(Array.isArray(a.tags), `${o.id}.${a.id} tags`);
        if (a.resolvesChallenge || a.outcome === "fatal") assert.equal(a.isDecision, true);
      }
    }
  }
});

test("Stage 1 keeps four zones, four environmental clues and four optional activities", () => {
  assert.deepEqual(stage.zones.map((z) => z.id), ["shore", "wilderness", "riverbank", "far_side"]);
  const disc = stage.objects.flatMap((o) => (o.actions || []).filter((a) => a.discoveryId));
  assert.equal(disc.filter((a) => !a.discoveryCategory).length, 4);
  assert.equal(disc.filter((a) => a.discoveryCategory === "optional_activity").length, 4);
});

test("environmental observation records a discovery without changing inventory", () => {
  const target = object("shore_tracks");
  assert.equal(performAction(target, action(target, "inspect_tracks")).ok, true);
  assert.deepEqual(gameState.inventory, {});
  assert.equal(gameState.flags.discovery_shore_tracks, true);
  assert.ok(gameState.log.some((e) => e.type === "discovery_made" && e.discoveryId === "shore_tracks"));
  assert.equal(listActions(target).length, 0);
});

test("supply cache: three methods, tools are not consumed", () => {
  const cache = object("supply_cache");
  assert.deepEqual(cache.actions.map((a) => a.strategy), ["tool_prying", "rope_leverage", "improvised_wedge"]);
  giveItem(gameState, "rope", 1);
  giveItem(gameState, "driftwood", 2);
  assert.equal(performAction(cache, action(cache, "loosen_with_rope")).ok, true);
  assert.equal(itemCount(gameState, "rope"), 1);
  assert.equal(itemCount(gameState, "driftwood"), 2);
  assert.equal(itemCount(gameState, "map_fragment"), 1);
  assert.equal(gameState.challenges.supply_cache.strategy, "rope_leverage");
  assert.equal(listActions(cache).length, 0);
});

test("raft consumes exactly 1 rope + 2 driftwood and records the challenge", () => {
  const river = object("river_bank");
  giveItem(gameState, "rope", 1);
  giveItem(gameState, "driftwood", 2);
  const r = performAction(river, action(river, "make_raft"));
  assert.equal(r.ok, true);
  assert.equal(r.resolvedChallenge, "river_crossing");
  assert.deepEqual(gameState.inventory, {});
  assert.equal(gameState.challenges.river_crossing.strategy, "raft");
  assert.ok(gameState.log.some((e) => e.type === "challenge_resolved" && e.strategy === "raft"));
});

test("log bridge consumes exactly one log; upstream needs nothing", () => {
  const river = object("river_bank");
  giveItem(gameState, "log", 1);
  assert.equal(performAction(river, action(river, "build_log_bridge")).ok, true);
  assert.equal(itemCount(gameState, "log"), 0);
  resetState();
  const up = object("upstream_path");
  assert.equal(performAction(up, up.actions[0]).ok, true);
  assert.deepEqual(gameState.inventory, {});
  assert.equal(gameState.flags.river_crossing_open, true);
});

test("failed requirements never consume partial materials", () => {
  const river = object("river_bank");
  giveItem(gameState, "rope", 1);
  giveItem(gameState, "driftwood", 1);
  const r = performAction(river, action(river, "make_raft"));
  assert.equal(r.ok, false);
  assert.equal(itemCount(gameState, "rope"), 1);
  assert.equal(itemCount(gameState, "driftwood"), 1);
  assert.equal(gameState.flags.river_crossing_open, undefined);
});

test("swimming is fatal: no items consumed, challenge not resolved", () => {
  const river = object("river_bank");
  giveItem(gameState, "rope", 1);
  const r = performAction(river, action(river, "swim"));
  assert.equal(r.ok, false);
  assert.equal(r.fatal.reason, "drowned_midstream");
  assert.equal(itemCount(gameState, "rope"), 1);
  assert.equal(gameState.flags.river_crossing_resolved, undefined);
  assert.ok(gameState.log.some((e) => e.type === "action_failed" && e.outcome === "fatal" && e.strategy === "swim"));
});
