import { gameState } from "./GameState.js";
import { now } from "./Clock.js";

// Event log merekam bukti tindakan secara kronologis. Setiap event otomatis
// diberi stage & nomor percobaan supaya analisis bisa memisahkan per percobaan.
export function logEvent(type, data = {}, state = gameState) {
  const event = {
    eventId: state.log.length + 1,
    t: now() - state.startedAt,
    type
  };
  if (state.stageId) event.stage = state.stageId;
  if (state.attempt) event.attempt = state.attempt;
  Object.assign(event, data);
  state.log.push(event);
  return event;
}
