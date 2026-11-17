import { STAGES } from "../data/stages.js";
import { computeStageMetrics } from "./analysis/metrics.js";
import { buildProfile } from "./analysis/profile.js";

/**
 * Laporan lengkap: metrik per stage, profil gaya bermain (dengan bukti dan
 * tingkat keyakinan), batasan interpretasi, dan event log mentah.
 */
export function buildEvidenceReport(state, stages = STAGES) {
  const events = Array.isArray(state?.log) ? state.log : [];
  const played = stages.filter((stage) => events.some((e) => e.type === "stage_start" && e.stage === stage.id));
  const stageMetrics = played.map((stage) => computeStageMetrics(events, stage));
  const profile = buildProfile(stageMetrics);

  return {
    schemaVersion: 2,
    generatedAt: new Date().toISOString(),
    session: {
      loggedEvents: events.length,
      stagesPlayed: played.map((s) => s.id),
      stagesCompleted: stageMetrics.filter((m) => m.completed).map((m) => m.stageId),
      totalDurationMs: events.length ? events.at(-1).t - events[0].t : 0
    },
    profile,
    stages: stageMetrics,
    limitations: [
      `Profil disusun dari ${stageMetrics.length} stage yang dimainkan; makin banyak stage, makin kuat buktinya.`,
      "Profil menggambarkan kecenderungan dalam permainan ini, bukan tes psikologis atau penilaian kemampuan.",
      "Niat pemain tidak selalu terlihat dari tindakan. Kegagalan atau pilihan rute tidak otomatis berarti kekurangan."
    ],
    rawEventLog: events
  };
}
