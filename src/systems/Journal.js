import { REASON_LABELS } from "../data/taxonomy.js";
import { STAGES, strategyLabel } from "../data/stages.js";

// Journal hanya berisi penemuan & riwayat keputusan. Interpretasi sengaja
// tidak ditampilkan selama bermain agar pemain tidak merasa dinilai.
const OBJECTS = new Map(STAGES.flatMap((s) => s.objects.filter((o) => o.id).map((o) => [`${s.id}:${o.id}`, o])));
const STAGE_BY_ID = new Map(STAGES.map((s) => [s.id, s]));

export function buildJournalSnapshot(state, currentStage = null) {
  const events = Array.isArray(state?.log) ? state.log : [];
  const objectOf = (e) => OBJECTS.get(`${e.stage || currentStage?.id}:${e.object}`);
  const actionText = (e) => objectOf(e)?.actions?.find((a) => a.id === e.action)?.text || String(e.action || "Aksi").replaceAll("_", " ");

  const seen = new Set();
  const discoveries = events
    .filter((e) => e.type === "discovery_made" || e.type === "journal_note_added")
    .filter((e) => {
      const key = e.discoveryId || e.noteId || `${e.eventId}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .map((e) => ({
      id: e.discoveryId || e.noteId || `note-${e.eventId}`,
      title: e.title || "Catatan perjalanan",
      note: e.note || "Sebuah detail menarik telah dicatat.",
      category: e.category || "observation",
      eventId: e.eventId
    }));

  const decisions = events
    .filter((e) => e.type === "action_resolved" || (e.type === "action_failed" && e.reason !== "puzzle_unsolved"))
    .slice(-10)
    .reverse()
    .map((e) => ({
      eventId: e.eventId,
      label: `${objectOf(e)?.label || e.object || "Lingkungan"} — ${actionText(e)}`,
      outcome: e.type === "action_resolved" ? "Berhasil" : "Tidak berhasil",
      detail: e.reason ? `Catatan: ${REASON_LABELS[e.reason] || String(e.reason).replaceAll("_", " ")}` : "",
      strategy: e.challengeId && e.strategy ? strategyLabel(STAGE_BY_ID.get(e.stage) || currentStage, e.challengeId, e.strategy) : null,
      stageName: STAGE_BY_ID.get(e.stage)?.name || null,
      attempt: e.attempt || null
    }));

  return { discoveries, decisions };
}
