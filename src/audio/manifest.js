// Daftar resmi file suara. Letakkan file di src/assets/audio/<folder>/<nama>.mp3
// (boleh juga .ogg / .wav / .m4a). File yang belum ada otomatis diganti suara
// sintetis, jadi game tetap berbunyi selama aset belum lengkap.
// Panduan lengkap untuk tim: src/assets/audio/DAFTAR_SUARA.md

export const MUSIC = {
  menu: { file: "music/menu", desc: "Tema menu utama: tenang, misterius, petualangan", loop: true, volume: 0.8 },
  opening: { file: "music/opening", desc: "Sinematik pembuka: laut tenang → badai → sunyi (±20 dtk)", loop: false, volume: 0.9 },
  cerita: { file: "music/cerita", desc: "Latar slide cerita/prolog: lembut, naratif", loop: true, volume: 0.7 },
  stage1_pantai: { file: "music/stage1_pantai", desc: "Stage 1 Pantai Terdampar: ringan, cerah, perkusi kayu", loop: true, volume: 0.55 },
  stage2_hutan: { file: "music/stage2_hutan", desc: "Stage 2 Reruntuhan Hutan: misterius, kuno, perkusi lembut", loop: true, volume: 0.55 },
  stage3_mercusuar: { file: "music/stage3_mercusuar", desc: "Stage 3 Tanjung Mercusuar: senja, haru, membangun harapan", loop: true, volume: 0.55 },
  ending: { file: "music/ending", desc: "Penutup & layar hasil: hangat, lega, sedikit emosional", loop: true, volume: 0.75 }
};

export const AMBIENCE = {
  pantai: { file: "ambience/pantai", desc: "Debur ombak + angin pantai + camar sesekali", volume: 0.6 },
  hutan: { file: "ambience/hutan", desc: "Hutan tropis: burung, serangga, gemericik air jauh", volume: 0.6 },
  angin: { file: "ambience/angin", desc: "Angin kencang di tebing + ombak di bawah", volume: 0.6 }
};

export const SFX = {
  ambil: { file: "sfx/ambil", desc: "Mengambil barang (ting pendek)" },
  temuan: { file: "sfx/temuan", desc: "Penemuan dicatat di jurnal (chime lembut)" },
  berhasil: { file: "sfx/berhasil", desc: "Tantangan terpecahkan (fanfare singkat 1–2 dtk)" },
  gagal: { file: "sfx/gagal", desc: "Aksi gagal / terkunci (nada turun)" },
  cebur: { file: "sfx/cebur", desc: "Tercebur / terseret air" },
  jatuh: { file: "sfx/jatuh", desc: "Terjatuh dari dinding (buk)" },
  ui_pilih: { file: "sfx/ui_pilih", desc: "Pindah pilihan di menu (klik halus)" },
  ui_buka: { file: "sfx/ui_buka", desc: "Membuka panel/menu" },
  ui_tutup: { file: "sfx/ui_tutup", desc: "Menutup panel/menu" },
  simbol: { file: "sfx/simbol", desc: "Menekan simbol teka-teki (klik batu)" },
  salah: { file: "sfx/salah", desc: "Jawaban teka-teki salah (bzz pendek)" },
  gemuruh: { file: "sfx/gemuruh", desc: "Pintu batu bergeser (gemuruh 1–2 dtk)" },
  desir: { file: "sfx/desir", desc: "Gerakan cepat / melompat / jalan terbuka (whoosh)" },
  klakson_kapal: { file: "sfx/klakson_kapal", desc: "Klakson kapal penyelamat (2–3 dtk)" },
  langkah: { file: "sfx/langkah", desc: "Satu langkah kaki pelan (dimainkan berulang)" },
  api: { file: "sfx/api", desc: "Api menyala / berkobar" }
};
