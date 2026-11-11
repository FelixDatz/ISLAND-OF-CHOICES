import { gameState } from "./GameState.js";

// Event log untuk merekam kejadian bermakna, bukan timer gameplay.
// t adalah waktu relatif untuk menyusun urutan kejadian saat analisis.
export function logEvent(type, data = {}) {
  gameState.log.push({
    eventId: gameState.log.length + 1,
    t: Date.now() - gameState.startedAt,
    type,
    ...data
  });
}
