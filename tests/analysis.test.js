import test from "node:test";
import assert from "node:assert/strict";
import { PERSONAS } from "../src/sim/personas.js";
import { runPlaythrough } from "../src/sim/playthrough.js";
import { buildEvidenceReport } from "../src/systems/Evidence.js";
import { createState } from "../src/systems/GameState.js";

const reports = Object.fromEntries(
  PERSONAS.map((p) => [p.id, buildEvidenceReport(runPlaythrough(p.steps, { stepMs: p.stepMs }))])
);
const dim = (id, d) => reports[id].profile.dimensions.find((x) => x.id === d);

test("report schema v2 has profile, per-stage metrics, limitations and raw log", () => {
  const r = reports.explorer;
  assert.equal(r.schemaVersion, 2);
  assert.deepEqual(r.session.stagesCompleted, ["stage1", "stage2", "stage3"]);
  assert.equal(r.stages.length, 3);
  assert.equal(r.profile.dimensions.length, 5);
  assert.ok(r.profile.headline && r.profile.narrative);
  assert.ok(r.limitations.length >= 3);
  assert.ok(r.rawEventLog.length > 0);
  for (const d of r.profile.dimensions) assert.ok(d.evidence.length > 0, `${d.id} has evidence`);
});

test("explorer vs speedrunner differ on exploration, information and pace", () => {
  assert.ok(dim("explorer", "exploration").score > 0.6);
  assert.ok(dim("speedrunner", "exploration").score < -0.5);
  assert.ok(dim("explorer", "information").score > 0.5);
  assert.ok(dim("speedrunner", "information").score < -0.5);
  assert.ok(dim("explorer", "pace").score > dim("speedrunner", "pace").score);
  assert.ok(dim("explorer", "resources").score > dim("speedrunner", "resources").score);
});

test("informed decision is detected only when relevant clues came first", () => {
  assert.deepEqual(reports.explorer.stages[0].main.informedBy, ["Rumpun gelagah", "Batu bertanda"]);
  assert.deepEqual(reports.speedrunner.stages[0].main.informedBy, []);
});

test("solution style follows the tags of the chosen strategy", () => {
  assert.equal(reports.builder.profile.solutionStyle.tag, "craft");
  assert.equal(reports.explorer.profile.solutionStyle.tag, "decode");
  assert.equal(reports.stubborn.profile.solutionStyle.tag, "risk");
});

test("resilience: switching after failure = adaptive, repeating = persistent", () => {
  assert.equal(dim("adaptive_risk", "resilience").score, 1);
  assert.ok(dim("stubborn", "resilience").score < 0);
  assert.equal(dim("speedrunner", "resilience").hasData, false);
  assert.equal(reports.stubborn.stages[0].attempts, 4);
});

test("resources are measured on the final attempt only", () => {
  const m = reports.adaptive_risk.stages[0];
  assert.deepEqual([...m.resources.collected].sort(), ["log", "rope", "small_axe"]);
});

test("empty session produces a safe placeholder profile", () => {
  const r = buildEvidenceReport(createState());
  assert.equal(r.profile.dimensions.length, 0);
  assert.equal(r.stages.length, 0);
});

test("every persona gets a distinct headline", () => {
  const headlines = new Set(Object.values(reports).map((r) => r.profile.headline));
  assert.ok(headlines.size >= 4, [...headlines].join(" | "));
});

test("multi-stage summaries aggregate evidence across all stages", () => {
  const resilience = dim("adaptive_risk", "resilience");
  assert.ok(resilience.evidence[0].summary);
  assert.match(resilience.summary, /3 kali berganti cara/);
  assert.match(reports.stubborn.profile.narrative, /tebakan teka-teki yang salah/);
});

test("cross-stage item use is detected (shell from Stage 1 used at the Stage 2 altar)", () => {
  const stage2 = reports.explorer.stages.find((m) => m.stageId === "stage2");
  assert.ok(stage2.resources.carriedUsed.includes("shell"));
  assert.ok(stage2.main.informedBy.includes("Altar yang terbangun"));
});

test("puzzle trial-and-error vs informed solving is visible in the metrics", () => {
  const explorer2 = reports.explorer.stages.find((m) => m.stageId === "stage2");
  const stubborn2 = reports.stubborn.stages.find((m) => m.stageId === "stage2");
  assert.equal(explorer2.puzzles.wrong, 0);
  assert.equal(stubborn2.puzzles.wrong, 5);
  assert.equal(stubborn2.main.strategy, "glyph_code");
});
