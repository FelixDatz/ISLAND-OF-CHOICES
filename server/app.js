import http from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, resolve, sep } from "node:path";
import { buildEvidenceReport } from "../src/systems/Evidence.js";
import { DIMENSIONS } from "../src/data/taxonomy.js";
import { createStore } from "./store.js";

// API:
//   GET  /api/health
//   POST /api/sessions        { sessionId, player?, final?, client?, log: [...] }
//   GET  /api/sessions        ringkasan semua sesi
//   GET  /api/sessions/:id    rekaman lengkap (termasuk laporan & event log)
//   GET  /api/stats           agregat untuk dashboard
// Selain /api, server menyajikan hasil build (dist/) bila ada.

const MAX_BODY_BYTES = 2 * 1024 * 1024;
const MAX_EVENTS = 20000;
const ID_RE = /^[A-Za-z0-9_-]{6,64}$/;
const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".mp4": "video/mp4",
  ".ico": "image/x-icon"
};

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function sendJson(res, status, data) {
  const body = JSON.stringify(data);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body),
    "Cache-Control": "no-store",
    "Access-Control-Allow-Origin": "*"
  });
  res.end(body);
}

async function readJsonBody(req) {
  let size = 0;
  const chunks = [];
  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_BODY_BYTES) throw new HttpError(413, "Payload terlalu besar");
    chunks.push(chunk);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw new HttpError(400, "Body harus JSON yang valid");
  }
}

const cleanText = (value, max) => (typeof value === "string" ? value.trim().slice(0, max) : null);

export function validateSubmission(body) {
  if (!body || typeof body !== "object") return { error: "Body kosong" };
  if (!ID_RE.test(String(body.sessionId || ""))) return { error: "sessionId tidak valid" };
  if (!Array.isArray(body.log) || body.log.length === 0) return { error: "log harus array berisi event" };
  if (body.log.length > MAX_EVENTS) return { error: `log melebihi ${MAX_EVENTS} event` };
  for (const [i, e] of body.log.entries()) {
    const ok = e && typeof e === "object" && typeof e.type === "string" && e.type.length <= 64 &&
      Number.isInteger(e.eventId) && Number.isFinite(e.t);
    if (!ok) return { error: `event ke-${i} tidak valid` };
  }
  const playerId = String(body.player?.id || "");
  return {
    value: {
      sessionId: body.sessionId,
      player: { id: ID_RE.test(playerId) ? playerId : null, name: cleanText(body.player?.name, 40) },
      final: body.final !== false,
      client: { version: cleanText(body.client?.version, 20), userAgent: null },
      log: body.log
    }
  };
}

export function summarize(record) {
  const { report } = record;
  return {
    sessionId: record.sessionId,
    player: record.player,
    final: record.final,
    receivedAt: record.receivedAt,
    updatedAt: record.updatedAt,
    headline: report.profile.headline,
    solutionStyle: report.profile.solutionStyle?.label || null,
    loggedEvents: report.session.loggedEvents,
    stages: report.stages.map((m) => ({
      stageId: m.stageId,
      stageName: m.stageName,
      completed: m.completed,
      strategy: m.main.strategy,
      strategyLabel: m.main.strategyLabel,
      attempts: m.attempts,
      durationMs: m.durationMs
    })),
    dimensions: report.profile.dimensions.map((d) => ({ id: d.id, label: d.label, score: d.score, tendency: d.tendency, confidence: d.confidence, hasData: d.hasData }))
  };
}

const countBy = (items) => {
  const counts = {};
  for (const item of items) if (item) counts[item] = (counts[item] || 0) + 1;
  return Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([label, count]) => ({ label, count }));
};
const mean = (nums) => (nums.length ? Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 100) / 100 : null);

export function computeStats(records) {
  const summaries = records.map(summarize);
  const stages = summaries.flatMap((s) => s.stages);
  const completed = summaries.filter((s) => s.stages.some((st) => st.completed));
  return {
    sessions: summaries.length,
    completedSessions: completed.length,
    players: new Set(summaries.map((s) => s.player?.id).filter(Boolean)).size,
    avgDurationMs: mean(stages.filter((s) => s.completed).map((s) => s.durationMs)),
    avgAttempts: mean(stages.map((s) => s.attempts)),
    headlines: countBy(summaries.map((s) => s.headline)),
    solutionStyles: countBy(summaries.map((s) => s.solutionStyle)),
    strategies: countBy(stages.map((s) => s.strategyLabel)),
    strategiesByStage: [...new Map(stages.map((s) => [s.stageId, s.stageName])).entries()].map(([stageId, stageName]) => ({
      stageId,
      stageName,
      items: countBy(stages.filter((s) => s.stageId === stageId).map((s) => s.strategyLabel))
    })),
    dimensions: Object.entries(DIMENSIONS).map(([id, def]) => {
      const scores = summaries.flatMap((s) => s.dimensions.filter((d) => d.id === id && d.hasData).map((d) => d.score));
      return { id, label: def.label, poles: { negative: def.negative.label, positive: def.positive.label }, mean: mean(scores), n: scores.length };
    })
  };
}

async function serveStatic(res, staticDir, urlPath) {
  if (!staticDir) throw new HttpError(404, "Tidak ditemukan");
  const root = resolve(staticDir);
  let rel = decodeURIComponent(urlPath);
  if (rel === "/" || rel === "") rel = "/index.html";
  if (rel === "/dashboard") rel = "/dashboard.html";
  const file = resolve(join(root, rel));
  if (file !== root && !file.startsWith(root + sep)) throw new HttpError(403, "Akses ditolak");
  let data;
  try {
    data = await readFile(file);
  } catch {
    throw new HttpError(404, "Tidak ditemukan. Jalankan `npm run build` untuk menyajikan game dari server ini.");
  }
  res.writeHead(200, { "Content-Type": MIME[extname(file)] || "application/octet-stream" });
  res.end(data);
}

export function createApp({ dataDir, staticDir = null } = {}) {
  const store = createStore(dataDir);

  async function route(req, res) {
    const url = new URL(req.url, "http://localhost");
    const path = url.pathname.replace(/\/+$/, "") || "/";

    if (req.method === "OPTIONS") {
      res.writeHead(204, { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET,POST,OPTIONS", "Access-Control-Allow-Headers": "Content-Type" });
      return res.end();
    }

    if (!path.startsWith("/api")) {
      if (req.method !== "GET" && req.method !== "HEAD") throw new HttpError(405, "Metode tidak didukung");
      return serveStatic(res, staticDir, url.pathname);
    }

    if (path === "/api/health" && req.method === "GET") return sendJson(res, 200, { ok: true, time: new Date().toISOString() });

    if (path === "/api/sessions" && req.method === "POST") {
      const { value, error } = validateSubmission(await readJsonBody(req));
      if (error) throw new HttpError(400, error);
      // Analisis dihitung ulang di server dari event mentah: profil dari klien tidak dipercaya.
      const report = buildEvidenceReport({ log: value.log });
      const previous = await store.get(value.sessionId);
      const now = new Date().toISOString();
      const record = {
        sessionId: value.sessionId,
        player: value.player,
        final: value.final,
        client: { ...value.client, userAgent: cleanText(req.headers["user-agent"], 200) },
        receivedAt: previous?.receivedAt || now,
        updatedAt: now,
        report
      };
      // Laporan parsial (mis. pemain menutup tab) tidak menimpa laporan final.
      if (previous?.final && !record.final) return sendJson(res, 200, { ...summarize(previous), ignored: true });
      await store.save(record);
      return sendJson(res, previous ? 200 : 201, summarize(record));
    }

    if (path === "/api/sessions" && req.method === "GET") {
      return sendJson(res, 200, (await store.list()).map(summarize));
    }

    const match = path.match(/^\/api\/sessions\/([^/]+)$/);
    if (match && req.method === "GET") {
      if (!ID_RE.test(match[1])) throw new HttpError(400, "sessionId tidak valid");
      const record = await store.get(match[1]);
      if (!record) throw new HttpError(404, "Sesi tidak ditemukan");
      return sendJson(res, 200, record);
    }

    if (path === "/api/stats" && req.method === "GET") return sendJson(res, 200, computeStats(await store.list()));

    throw new HttpError(404, "Endpoint tidak ditemukan");
  }

  return http.createServer(async (req, res) => {
    try {
      await route(req, res);
    } catch (err) {
      const status = err instanceof HttpError ? err.status : 500;
      if (status === 500) console.error(err);
      if (!res.headersSent) sendJson(res, status, { error: status === 500 ? "Kesalahan server" : err.message });
      else res.end();
    }
  });
}
