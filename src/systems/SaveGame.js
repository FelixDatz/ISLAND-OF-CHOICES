// Simpan otomatis di awal setiap stage. "Lanjutkan" di menu utama memulai ulang
// stage terakhir dengan inventori & riwayat yang sama (event log tetap utuh).

const KEY = "ioc:save";
const VERSION = 1;

export function saveProgress(data) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ version: VERSION, savedAt: Date.now(), ...data }));
  } catch {
    // Penyimpanan bisa diblokir browser; permainan tetap berjalan.
  }
}

export function loadProgress() {
  try {
    const save = JSON.parse(localStorage.getItem(KEY) || "null");
    if (save?.version === VERSION && save.stageId && Array.isArray(save.log)) return save;
  } catch {
    // data rusak → abaikan
  }
  return null;
}

export function clearProgress() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // abaikan
  }
}
