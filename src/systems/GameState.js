import { now } from "./Clock.js";

// State tunggal permainan. Tidak bergantung pada Phaser, jadi mudah diuji,
// disimulasikan, dan diserialisasi.
export function createState() {
  return {
    stageId: null,       // stage yang sedang dimainkan
    attempt: 0,          // nomor percobaan di stage ini (naik setelah mencoba lagi)
    inventory: {},       // { rope: 1, driftwood: 3 }
    flags: {},           // { wreck_searched: true }
    doneActions: {},     // { "wreck.search": true } untuk aksi sekali pakai
    removedObjects: {},  // { "driftwood_1": true } objek yang sudah diambil habis
    challenges: {},      // { river_crossing: { strategy, eventId, ... } }
    stash: {},           // barang yang dititipkan di dunia (tidak ikut ke stage berikutnya)
    log: [],             // event log perilaku pemain (lihat EventLog.js)
    startedAt: now()
  };
}

export const gameState = createState();

export function resetState(state = gameState) {
  Object.assign(state, createState());
  return state;
}

export function itemCount(state, id) {
  return state.inventory[id] || 0;
}

export function giveItem(state, id, n = 1) {
  state.inventory[id] = itemCount(state, id) + n;
}

export function takeItem(state, id, n = 1) {
  state.inventory[id] = Math.max(0, itemCount(state, id) - n);
  if (state.inventory[id] === 0) delete state.inventory[id];
}
