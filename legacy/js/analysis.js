function getGameSummary(state) {
  const successful = state.decisionHistory.filter((item) => item.success).length;
  const skills = [...new Set(state.decisionHistory.filter((item) => item.success).map((item) => item.skill))];
  return { successful, skills };
}

function getRescueRating(state) {
  const summary = getGameSummary(state);
  const failedChoices = state.decisionHistory.filter((item) => !item.success).length;
  const score = Math.max(0, Math.min(100, Math.round(
    state.player.energy * 0.35 + state.player.time * 0.35 + summary.successful * 10 - failedChoices * 5
  )));
  let title = "Penjelajah Tangguh";
  let message = "Kamu sampai pada solusi yang tepat dan berhasil mengirim sinyal darurat.";
  if (score >= 85) {
    title = "Navigator Andal";
    message = "Keputusanmu efisien, tenang, dan sangat terencana. Tim penyelamat menerima koordinat dengan cepat.";
  } else if (score < 55) {
    title = "Penyintas Gigih";
    message = "Perjalananmu penuh rintangan, tetapi kamu terus belajar dari setiap percobaan hingga sinyal terkirim.";
  }
  return { score, title, message, failedChoices };
}
