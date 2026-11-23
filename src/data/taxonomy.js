// Taksonomi lintas stage. Stage cukup memberi tag pada aksi/strategi;
// mesin analisis hanya membaca tag, tidak perlu tahu isi stage.

// Tag pendekatan solusi. Dipakai untuk "gaya solusi" pemain.
export const SOLUTION_STYLES = {
  pathfinding: { label: "Pencari Jalur", desc: "memanfaatkan jalur atau kondisi alami yang sudah ada" },
  craft: { label: "Perakit", desc: "mengumpulkan bahan lalu membangun solusi sendiri" },
  tool: { label: "Pengguna Alat", desc: "memakai alat untuk mengubah lingkungan" },
  improvise: { label: "Improvisator", desc: "memakai benda untuk fungsi yang tidak biasa" },
  decode: { label: "Pemecah Kode", desc: "membaca pola dan memecahkan teka-teki" },
  risk: { label: "Pengambil Risiko", desc: "mencoba cara langsung walau berbahaya" }
};

// Tag perilaku pendukung (bukan gaya solusi).
//   observe  : mengamati / membaca lingkungan
//   gather   : mengambil bahan yang berguna untuk tantangan
//   collect  : mengambil barang koleksi yang tidak dibutuhkan tantangan
export const BEHAVIOR_TAGS = ["observe", "gather", "collect"];

// Dimensi profil. score > 0 condong ke kutub `positive`.
export const DIMENSIONS = {
  // salience: seberapa khas dimensi ini untuk judul profil (bukti yang jarang muncul diberi bobot lebih).
  exploration: {
    label: "Eksplorasi",
    salience: 1,
    positive: { label: "Penjelajah", adjective: "Gemar Menjelajah" },
    negative: { label: "Terfokus", adjective: "Terfokus pada Tujuan" }
  },
  information: {
    label: "Cara mengumpulkan informasi",
    salience: 1.1,
    positive: { label: "Pengamat", adjective: "Teliti Mengamati" },
    negative: { label: "Pencoba langsung", adjective: "Berani Langsung Mencoba" }
  },
  pace: {
    label: "Tempo keputusan",
    salience: 0.9,
    positive: { label: "Penuh pertimbangan", adjective: "Penuh Pertimbangan" },
    negative: { label: "Cepat bertindak", adjective: "Cepat Bertindak" }
  },
  resources: {
    label: "Pengelolaan barang",
    salience: 0.8,
    positive: { label: "Pengumpul", adjective: "Suka Mengumpulkan" },
    negative: { label: "Hemat", adjective: "Hemat Sumber Daya" }
  },
  resilience: {
    label: "Respons terhadap kegagalan",
    salience: 1.3,
    positive: { label: "Adaptif", adjective: "Cepat Beradaptasi" },
    negative: { label: "Gigih pada satu cara", adjective: "Gigih" }
  }
};

export const REASON_LABELS = {
  requirements_not_met: "syarat belum terpenuhi",
  insufficient_items: "barang tidak cukup",
  already_completed: "aksi sudah dilakukan",
  challenge_already_resolved: "tantangan sudah selesai",
  drowned_midstream: "terseret arus sungai",
  puzzle_unsolved: "teka-teki belum terpecahkan",
  fell_from_wall: "jatuh saat memanjat",
  capsized_reef: "perahu terbalik di karang"
};
