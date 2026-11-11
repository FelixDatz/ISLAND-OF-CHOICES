function renderScreen(screenName, hasSavedGame) {
  const app = document.getElementById("app");
  const screens = {
    menu: () => renderMenu(hasSavedGame),
    introduction: renderIntroduction,
    "how-to-play": renderHowToPlay,
    gameplay: renderGameplayPlaceholder,
    ending: renderEndingPlaceholder,
    analysis: renderAnalysisPlaceholder
  };

  const render = screens[screenName] || screens.menu;
  app.innerHTML = render();
  app.focus();
}

function renderMenu(hasSavedGame) {
  const continueButton = hasSavedGame
    ? '<button type="button" data-action="continue">Lanjutkan Perjalanan</button>'
    : '<button type="button" disabled aria-describedby="save-notice">Lanjutkan Perjalanan</button>';

  return `
    <section class="screen screen--menu" aria-labelledby="menu-title">
      <div class="content-card">
        <p class="eyebrow">Petualangan Computational Thinking</p>
        <h1 class="game-logo" id="menu-title">Island of<br />Choices</h1>
        <p class="screen-copy">Setiap keputusan membuka cara baru untuk bertahan dan menemukan jalan pulang.</p>
        <div class="menu-actions">
          <button type="button" data-action="new-game">Mulai Perjalanan</button>
          ${continueButton}
          <button class="button--secondary" type="button" data-action="how-to-play">Cara Bermain</button>
        </div>
        <p class="save-notice" id="save-notice" role="status">${hasSavedGame ? "Save permainan ditemukan." : "Belum ada save permainan."}</p>
        ${hasSavedGame ? '<button class="text-button" type="button" data-action="reset-save">Hapus save permainan</button>' : ""}
      </div>
    </section>`;
}

function renderHowToPlay() {
  return `<section class="screen screen--introduction" aria-labelledby="guide-title"><div class="content-card guide-card"><p class="eyebrow">Panduan Pemain</p><h1 class="screen-title" id="guide-title">Bertahan dengan Berpikir</h1><ol class="guide-list"><li><span>1</span><p><strong>Pilih lokasi</strong><br />Buka jalur baru dengan menyelesaikan tantangan pada lokasi saat ini.</p></li><li><span>2</span><p><strong>Jaga sumber daya</strong><br />Setiap pilihan memakai energi dan waktu. Amati dahulu sebelum mengambil risiko.</p></li><li><span>3</span><p><strong>Gunakan cara berpikir komputasional</strong><br />Pecah masalah, temukan pola, lalu susun urutan instruksi yang tepat.</p></li></ol><div class="menu-actions"><button type="button" data-action="close-guide">Kembali ke Menu</button></div></div></section>`;
}

function renderIntroduction() {
  return `
    <section class="screen screen--introduction" aria-labelledby="introduction-title">
      <div class="content-card">
        <p class="eyebrow">Prolog</p>
        <h1 class="screen-title" id="introduction-title">Pulau yang menyimpan pilihan</h1>
        <p class="screen-copy">Setelah kecelakaan, kamu terdampar di sebuah pulau tropis. Amati keadaan, pilih strategi, dan temukan cara untuk menyalakan sinyal darurat.</p>
        <div class="menu-actions">
          <button type="button" data-action="start-gameplay">Mulai Eksplorasi</button>
          <button class="button--secondary" type="button" data-action="back-menu">Kembali</button>
        </div>
      </div>
    </section>`;
}

function renderGameplayPlaceholder() {
  const state = currentGameState;
  if (!state) return renderMenu(false);
  if (isGameOver(state)) return renderGameOver(state);
  const location = LOCATIONS[state.player.currentLocation] || LOCATIONS.beach;
  const locations = getAvailableLocations(state);
  const problemId = location.problem;
  const problem = PROBLEMS[problemId];
  const completed = problemId && state.problems[problemId].status === "completed";
  const result = state.lastResult;
  const completedCount = ["river", "locked_station", "signal_tower"].filter((id) => state.problems[id].status === "completed").length;
  const clues = state.world.cluesFound.length ? state.world.cluesFound.map((clue) => `<li>${clue}</li>`).join("") : "<li>Belum ada petunjuk ditemukan.</li>";
  const tip = getContextualTip(problemId, completed);
  const locationButtons = locations.map(([id, item]) => `
    <button class="location-button ${id === state.player.currentLocation ? "is-active" : ""}" type="button" data-action="travel" data-location="${id}">
      <span>${item.icon}</span>${item.name}
    </button>`).join("");
  let challenge = "";
  if (state.player.currentLocation === "signal_point") {
    challenge = `<div class="challenge challenge--complete"><h2>Koordinat terkirim</h2><p>Suar sinyal menyala terang. Bantuan sedang menuju pulau ini.</p><button type="button" data-action="finish-game">Lihat Perjalananmu</button></div>`;
  } else if (problemId === "signal_tower") {
    const sequence = state.problems.signal_tower.sequenceAttempts.map((item) => item === "pulse" ? "●" : "○").join(" ") || "—";
    challenge = completed
      ? `<div class="challenge challenge--complete"><h2>Panel terkalibrasi</h2><p>Ikuti jalan ke Menara Sinyal untuk mengirim SOS.</p><button type="button" data-action="travel" data-location="signal_point">Ke Menara Sinyal</button></div>`
      : `<div class="challenge"><p class="eyebrow">Algoritma</p><h2>Panel Pemancar</h2><p>Ulangi instruksi lampu: <strong>nyala → jeda → nyala</strong>.</p><p class="sequence" aria-label="Urutan saat ini">${sequence}</p><div class="signal-actions"><button type="button" data-action="signal-step" data-step="pulse">Nyala</button><button type="button" data-action="signal-step" data-step="wait">Jeda</button></div></div>`;
  } else if (problem && !completed) {
    challenge = `<div class="challenge"><p class="eyebrow">${problem.skill}</p><h2>${problem.title}</h2><p>${problem.prompt}</p><div class="choice-list">${problem.choices.map((choice) => `<button class="choice-button" type="button" data-action="problem-choice" data-problem="${problemId}" data-choice="${choice.id}">${choice.label}</button>`).join("")}</div></div>`;
  } else if (problem) {
    const next = problemId === "river" ? "Hutan Lumina" : "Pos Peneliti";
    challenge = `<div class="challenge challenge--complete"><h2>Jalan terbuka</h2><p>Kamu menemukan petunjuk baru. Lanjutkan ke ${next}.</p></div>`;
  }
  return `
    <section class="screen screen--gameplay" aria-labelledby="gameplay-title">
      <div class="game-shell">
        <header class="game-header"><div><p class="eyebrow">Island of Choices</p><h1 id="gameplay-title">${location.name}</h1></div><div class="header-actions"><button class="menu-link" type="button" data-action="toggle-journal" aria-expanded="false" aria-controls="journal-panel">Jurnal</button><button class="menu-link" type="button" data-action="back-menu">Menu</button></div></header>
        <section class="status-bar" aria-label="Status pemain"><div><span>⚡ Energi</span><strong>${state.player.energy}%</strong></div><div><span>⌛ Waktu</span><strong>${state.player.time}%</strong></div><div><span>🧭 Petunjuk</span><strong>${state.world.cluesFound.length}</strong></div></section>
        <section class="mission-progress" aria-label="Progres misi"><div><span>Misi utama</span><strong>${completedCount}/3</strong></div><div class="progress-track" aria-hidden="true"><span style="width: ${(completedCount / 3) * 100}%"></span></div><p>${completedCount === 3 ? "Menara sinyal siap digunakan." : "Selesaikan tantangan untuk membuka jalan ke menara."}</p></section>
        <nav class="location-list" aria-label="Peta pulau">${locationButtons}</nav>
        <aside class="journal-panel" id="journal-panel" hidden aria-label="Jurnal petunjuk"><div><p class="eyebrow">Jurnal Temuan</p><h2>Petunjuk yang Dibawa</h2></div><button class="journal-close" type="button" data-action="toggle-journal" aria-label="Tutup jurnal">×</button><ul>${clues}</ul><p class="journal-hint">Tekan Esc untuk menutup.</p></aside>
        <main class="adventure-card"><div class="location-hero"><span class="location-icon">${location.icon}</span><div><p class="eyebrow">Lokasi saat ini</p><h2>${location.name}</h2><p>${location.description}</p></div></div><aside class="strategy-tip"><span>💡</span><p><strong>Petunjuk strategi:</strong> ${tip}</p></aside>${result ? `<aside class="result ${result.success ? "result--success" : "result--warning"}"><strong>${result.title}</strong><span>${result.text}</span></aside>` : ""}${challenge}<div class="camp-actions"><div><strong>Tempat istirahat</strong><span>Pulihkan hingga 25% energi, gunakan 10% waktu.</span></div><button class="button--secondary" type="button" data-action="rest" ${state.player.time < 10 ? "disabled" : ""}>Istirahat</button></div></main>
      </div>
    </section>`;
}

function getContextualTip(problemId, completed) {
  if (completed) return "Jalur berikutnya telah terbuka. Periksa peta pulau untuk melanjutkan misi.";
  if (problemId === "river") return "Sebelum bertindak, pisahkan risiko arus, pijakan, dan bahan yang tersedia.";
  if (problemId === "locked_station") return "Pola yang berulang sering memberi informasi lebih baik daripada tindakan yang terburu-buru.";
  if (problemId === "signal_tower") return "Algoritma yang baik dapat diuji satu langkah demi satu langkah.";
  return "Catat setiap petunjuk di jurnal agar pilihan berikutnya lebih terarah.";
}

function renderGameOver(state) {
  const reason = state.player.energy <= 0 ? "Energi habis sebelum kamu bisa melanjutkan." : "Waktu habis sebelum sinyal darurat dapat dikirim.";
  return `<section class="screen screen--ending" aria-labelledby="gameover-title"><div class="content-card"><p class="eyebrow">Perjalanan Berakhir</p><h1 class="screen-title" id="gameover-title">Kamu Perlu Strategi Baru</h1><p class="screen-copy">${reason} Coba lagi dan pilih langkah yang lebih aman serta terencana.</p><div class="menu-actions"><button type="button" data-action="new-game">Coba Lagi</button><button class="button--secondary" type="button" data-action="back-menu">Menu Utama</button></div></div></section>`;
}

function renderEndingPlaceholder() {
  const summary = getGameSummary(currentGameState);
  const rating = getRescueRating(currentGameState);
  return `
    <section class="screen screen--ending" aria-labelledby="ending-title">
      <div class="content-card"><p class="eyebrow">Misi Selesai</p><h1 class="screen-title" id="ending-title">Sinyalmu Terdengar</h1><p class="screen-copy">${rating.message}</p><div class="rating-card"><span class="rating-icon">★</span><div><p class="eyebrow">Peringkat Penyelamatan</p><h2>${rating.title}</h2></div><strong>${rating.score}</strong></div><div class="ending-stats"><div><strong>${summary.successful}</strong><span>strategi berhasil</span></div><div><strong>${currentGameState.player.energy}%</strong><span>energi tersisa</span></div><div><strong>${currentGameState.player.time}%</strong><span>waktu tersisa</span></div></div><div class="menu-actions"><button type="button" data-action="show-analysis">Lihat Analisis</button><button class="button--secondary" type="button" data-action="new-game">Main Lagi</button></div></div>
    </section>`;
}

function renderAnalysisPlaceholder() {
  const summary = getGameSummary(currentGameState);
  const rating = getRescueRating(currentGameState);
  const history = currentGameState.decisionHistory.map((item) => `<li><span>${item.success ? "✓" : "↻"}</span><div><strong>${item.skill}</strong><br />${item.choice}</div></li>`).join("");
  return `
    <section class="screen screen--analysis" aria-labelledby="analysis-title">
      <div class="content-card"><p class="eyebrow">Refleksi Computational Thinking</p><h1 class="screen-title" id="analysis-title">Jejak Keputusanmu</h1><p class="screen-copy">Kamu meraih <strong>${rating.score}/100</strong>. Strategi berhasil: ${summary.skills.join(", ") || "belum ada"}.</p><ul class="history-list">${history}</ul><div class="menu-actions"><button type="button" data-action="back-ending">Kembali</button><button class="button--secondary" type="button" data-action="back-menu">Menu Utama</button></div></div>
    </section>`;
}
