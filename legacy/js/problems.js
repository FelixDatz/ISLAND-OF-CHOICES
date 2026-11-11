const PROBLEMS = {
  river: { title: "Sungai yang Menghalangi", prompt: "Arus deras memutus jalan ke hutan. Apa rencanamu?", skill: "Dekomposisi", choices: [
    { id: "survey", label: "Amati arus dan cari batu pijakan", detail: "Pecah masalah besar menjadi hal kecil yang bisa dicek.", success: true, energy: -8, time: -10, clue: "Peta jalur hutan" },
    { id: "swim", label: "Langsung berenang menyeberang", detail: "Cepat, tetapi berisiko tanpa informasi.", success: false, energy: -20, time: -12 },
    { id: "raft", label: "Buat rakit dari kayu apung", detail: "Kumpulkan bahan lalu uji kestabilannya.", success: true, energy: -14, time: -18, clue: "Tali serat kelapa" }
  ] },
  locked_station: { title: "Stasiun Terkunci", prompt: "Panel stasiun mati. Lampu indikator berkedip dalam pola yang berulang.", skill: "Pengenalan Pola", choices: [
    { id: "pattern", label: "Catat pola lampu dan gunakan urutannya", detail: "Pola merah-biru-biru berulang membuka panel.", success: true, energy: -7, time: -12, clue: "Baterai cadangan" },
    { id: "force", label: "Paksa buka panel", detail: "Panel terbuka, tetapi kabel penting ikut rusak.", success: true, energy: -18, time: -8, clue: "Baterai retak", condition: "damaged" },
    { id: "leave", label: "Tinggalkan stasiun", detail: "Kamu kembali untuk mencoba cara lain.", success: false, energy: -4, time: -6 }
  ] }
};

function applyProblemChoice(problemId, choiceId) {
  const problem = PROBLEMS[problemId];
  const choice = problem?.choices.find((item) => item.id === choiceId);
  if (!choice || !currentGameState) return;
  const state = currentGameState, record = state.problems[problemId];
  record.attempts += 1;
  state.player.energy = Math.max(0, state.player.energy + choice.energy);
  state.player.time = Math.max(0, state.player.time + choice.time);
  state.decisionHistory.push({ problem: problemId, choice: choice.label, skill: problem.skill, success: choice.success });
  if (choice.success) {
    record.status = "completed"; record.strategyUsed = choice.id;
    if (choice.condition) record.deviceCondition = choice.condition;
    if (choice.clue && !state.world.cluesFound.includes(choice.clue)) state.world.cluesFound.push(choice.clue);
    unlockAfterProblem(problemId);
  }
  state.lastResult = { title: choice.success ? "Strategi berhasil!" : "Belum berhasil", text: choice.detail, success: choice.success };
  saveGame(state); renderCurrentScreen();
}

function unlockAfterProblem(problemId) {
  const locations = currentGameState.world.locations;
  if (problemId === "river") locations.forest.unlocked = true;
  if (problemId === "locked_station") locations.hub.unlocked = true;
}

function submitSignalStep(step) {
  const state = currentGameState, record = state.problems.signal_tower;
  const expected = ["pulse", "wait", "pulse"];
  record.sequenceAttempts.push(step);
  const index = record.sequenceAttempts.length - 1;
  if (record.sequenceAttempts[index] !== expected[index]) {
    record.attempts += 1; record.sequenceAttempts = []; state.player.energy = Math.max(0, state.player.energy - 5);
    state.lastResult = { title: "Urutan belum tepat", text: "Amati ritme lampu: nyala, jeda, nyala.", success: false };
  } else if (record.sequenceAttempts.length === expected.length) {
    record.status = "completed"; record.attempts += 1; state.world.locations.signal_point.unlocked = true;
    state.decisionHistory.push({ problem: "signal_tower", choice: "Nyala–jeda–nyala", skill: "Algoritma", success: true });
    state.lastResult = { title: "Sinyal aktif!", text: "Pola yang benar mengirimkan koordinatmu ke laut lepas.", success: true };
  } else state.lastResult = { title: "Pola dicatat", text: "Lanjutkan satu langkah lagi.", success: true };
  saveGame(state); renderCurrentScreen();
}
