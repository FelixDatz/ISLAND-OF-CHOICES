import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createApp } from "../server/app.js";
import { PERSONAS } from "../src/sim/personas.js";
import { runPlaythrough } from "../src/sim/playthrough.js";
import { buildEvidenceReport } from "../src/systems/Evidence.js";

let server;
let base;
let dataDir;

before(async () => {
  dataDir = mkdtempSync(join(tmpdir(), "ioc-test-"));
  server = createApp({ dataDir });
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  base = `http://127.0.0.1:${server.address().port}`;
});

after(() => {
  server.close();
  rmSync(dataDir, { recursive: true, force: true });
});

const post = (body) => fetch(`${base}/api/sessions`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
const persona = (id) => PERSONAS.find((p) => p.id === id);
const logOf = (id) => runPlaythrough(persona(id).steps, { stepMs: persona(id).stepMs }).log;

test("health endpoint responds", async () => {
  const res = await fetch(`${base}/api/health`);
  assert.equal(res.status, 200);
  assert.equal((await res.json()).ok, true);
});

test("server recomputes the profile from the raw log (same result as the client)", async () => {
  const log = logOf("explorer");
  const res = await post({ sessionId: "session-explorer", player: { id: "player-aaaa", name: "Tester" }, log });
  assert.equal(res.status, 201);
  const data = await res.json();
  assert.equal(data.headline, buildEvidenceReport({ log }).profile.headline);
  assert.equal(data.stages[0].strategy, "upstream_route");
  assert.equal(readdirSync(dataDir).filter((f) => f.endsWith(".json")).length, 1);
});

test("a fake client-side profile is ignored", async () => {
  const res = await post({ sessionId: "session-fake", log: logOf("speedrunner"), report: { profile: { headline: "Jenius" } } });
  const data = await res.json();
  assert.notEqual(data.headline, "Jenius");
});

test("partial beacon does not overwrite a final report", async () => {
  const res = await post({ sessionId: "session-explorer", final: false, log: logOf("speedrunner") });
  assert.equal(res.status, 200);
  assert.equal((await res.json()).ignored, true);
  const record = await (await fetch(`${base}/api/sessions/session-explorer`)).json();
  assert.equal(record.report.stages[0].main.strategy, "upstream_route");
  assert.equal(record.final, true);
});

test("list, detail and stats aggregate stored sessions", async () => {
  await post({ sessionId: "session-builder", log: logOf("builder") });
  const list = await (await fetch(`${base}/api/sessions`)).json();
  assert.equal(list.length, 3);
  const stats = await (await fetch(`${base}/api/stats`)).json();
  assert.equal(stats.sessions, 3);
  assert.equal(stats.completedSessions, 3);
  assert.equal(stats.dimensions.length, 5);
  assert.ok(stats.strategies.some((s) => s.label === "Rakit kayu apung"));
  assert.deepEqual(stats.strategiesByStage.map((g) => g.stageId), ["stage1", "stage2", "stage3"]);
});

test("invalid input is rejected", async () => {
  assert.equal((await post({ sessionId: "x", log: [] })).status, 400);
  assert.equal((await post({ sessionId: "valid-id-123", log: [{ type: "x" }] })).status, 400);
  const bad = await fetch(`${base}/api/sessions`, { method: "POST", body: "not json" });
  assert.equal(bad.status, 400);
  assert.equal((await fetch(`${base}/api/sessions/..%2F..%2Fetc`)).status, 400);
  assert.equal((await fetch(`${base}/api/sessions/does-not-exist`)).status, 404);
});
