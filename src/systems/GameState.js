// State tunggal permainan. Semua yang perlu disimpan (save) atau dianalisis ada di sini.
// Tidak bergantung pada Phaser, jadi mudah diuji dan diserialisasi ke localStorage.

export function createState() {
  return {
    inventory: {},       // { rope: 1, driftwood: 3 }
    flags: {},           // { wreck_searched: true }
    doneActions: {},     // { "wreck.search": true } untuk aksi sekali pakai
    removedObjects: {},  // { "driftwood_1": true } objek yang sudah diambil habis
    log: [],             // event log perilaku pemain (lihat EventLog.js)
    startedAt: Date.now()
  };
}

export const gameState = createState();

export function resetState() {
  Object.assign(gameState, createState());
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
