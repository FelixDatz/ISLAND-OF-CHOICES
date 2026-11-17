import { getStage, firstStageId } from "../data/stages.js";
import { createState } from "../systems/GameState.js";
import { setClock } from "../systems/Clock.js";
import { StageSession } from "../systems/StageSession.js";

/**
 * Menjalankan skrip permainan tanpa browser, memakai aturan yang sama dengan game.
 * Langkah:
 *   ["zone", id]                  masuk zona
 *   ["walk", px]                  menambah jarak tempuh
 *   ["cover", rasio]              menandai sebagian peta sebagai sudah dijelajahi
 *   ["wait", ms]                  jeda berpikir
 *   ["do", objectId, actionId]    buka interaksi lalu jalankan aksi
 *                                 (fatal → otomatis Try Again; setback → lanjut)
 *   ["puzzle", objectId, actionId, [simbol...]]  satu percobaan teka-teki
 *   ["look", objectId]            buka menu lalu batal
 *   ["blocked", objectId, actionId]  memilih aksi yang masih terkunci
 *   ["goal"] / ["explore"]        masuk area tujuan / memilih menjelajah dulu
 *   ["finish"]                    menyelesaikan stage (otomatis lanjut ke stage berikutnya)
 */
export function runPlaythrough(steps, { stageId = firstStageId(), stepMs = 6000 } = {}) {
  const state = createState();
  let t = 0;
  setClock(() => t);
  state.startedAt = 0;
  let session = new StageSession(getStage(stageId), state).start({ attempt: 1 });
  const restart = (data) => {
    session = new StageSession(getStage(data.stageId), state).start(data);
  };
  const handle = (result, label) => {
    if (result.fatal) {
      t += 3000;
      session.completeFatal(result.fatal);
      restart(session.retry());
    } else if (result.setback) {
      session.completeSetback(result.setback);
    } else if (!result.ok) {
      throw new Error(`[${session.stage.id}] langkah gagal: ${label} (${result.reason})`);
    }
  };

  try {
    for (const [op, a, b, c] of steps) {
      t += op === "wait" ? a : stepMs;
      switch (op) {
        case "zone": session.enterZone(a); break;
        case "walk": session.addDistance(a); break;
        case "cover": session.markCoverage(a); break;
        case "wait": break;
        case "look": session.interact(a); session.cancel(a); break;
        case "blocked": session.interact(a); session.blocked(a, b); break;
        case "goal": session.reachGoal(); break;
        case "explore": session.keepExploring(); break;
        case "finish": {
          if (!session.isGoalUnlocked()) throw new Error(`[${session.stage.id}] finish sebelum tujuan terbuka`);
          session.finish();
          const next = session.nextStart();
          if (next) restart(next);
          break;
        }
        case "do":
          session.interact(a);
          handle(session.perform(a, b), `${a}.${b}`);
          break;
        case "puzzle": {
          // c = satu tebakan [..] atau beberapa tebakan [[..], [..]] dalam satu kali membuka panel.
          session.interact(a);
          session.openPuzzle(a, b);
          let solved = false;
          for (const guess of Array.isArray(c[0]) ? c : [c]) {
            t += 4000;
            const r = session.submitPuzzle(a, b, guess);
            if (r.correct) {
              handle(r.result, `${a}.${b}`);
              solved = true;
              break;
            }
          }
          if (!solved) session.closePuzzle(a, b);
          break;
        }
        default: throw new Error(`Langkah tidak dikenal: ${op}`);
      }
    }
  } finally {
    setClock(null);
  }
  return state;
}
