// Daftar resmi aset audio Island of Choices.
// File berada di src/assets/audio/<folder>/<nama>.ogg.
// Browser memakai OGG jika tidak tersedia MP3. Aset yang belum ditemukan
// tetap memiliki fallback sintetis agar game tidak gagal dijalankan.

export const MUSIC = {
  // Satu lagu yang sama untuk layar judul awal dan lobby/menu.
  // Audio diputar setelah interaksi pertama pengguna (aturan autoplay browser).
  title_menu: { file: "music/title_menu", desc: "Tema Splash Screen dan Lobby: Exploring the Ocean", loop: true, volume: 0.86 },
  cerita: { file: "music/cerita", desc: "Opsional: musik naratif untuk prolog", loop: true, volume: 0.55 },
  stage1_pantai: { file: "music/stage1_pantai", desc: "Stage 1 Pantai Terdampar", loop: true, volume: 0.55 },
  stage2_hutan: { file: "music/stage2_hutan", desc: "Stage 2 Reruntuhan Hutan", loop: true, volume: 0.55 },
  stage3_mercusuar: { file: "music/stage3_mercusuar", desc: "Stage 3 Tanjung Mercusuar", loop: true, volume: 0.55 },
  ending: { file: "music/ending", desc: "Penutup dan layar hasil", loop: true, volume: 0.65 }
};

export const AMBIENCE = {
  // Empat ambience khusus storyboard / cinematic.
  voyage: { file: "ambience/voyage", desc: "Laut terbuka, angin, lambung kapal, camar jauh", volume: 0.48 },
  storm: { file: "ambience/storm", desc: "Angin badai, hujan deras, dan ombak tinggi", volume: 0.52 },
  wreck: { file: "ambience/wreck", desc: "Suasana bawah air, gelembung, dan kayu kapal yang mengerang", volume: 0.42 },
  island: { file: "ambience/island", desc: "Pantai tropis, ombak kecil, angin, dan burung", volume: 0.44 },
  // Ambience gameplay yang sudah digunakan oleh ketiga stage.
  pantai: { file: "ambience/pantai", desc: "Debur ombak, angin pantai, dan camar", volume: 0.6 },
  hutan: { file: "ambience/hutan", desc: "Hutan tropis: burung, serangga, dan air jauh", volume: 0.6 },
  angin: { file: "ambience/angin", desc: "Angin kencang di tebing dan ombak di bawah", volume: 0.6 }
};

export const SFX = {
  ambil: { file: "sfx/ambil", desc: "Mengambil barang" },
  temuan: { file: "sfx/temuan", desc: "Penemuan dicatat di jurnal" },
  berhasil: { file: "sfx/berhasil", desc: "Tantangan berhasil" },
  gagal: { file: "sfx/gagal", desc: "Aksi gagal atau terkunci" },
  cebur: { file: "sfx/splash", desc: "Karakter tercebur atau terseret air" },
  jatuh: { file: "sfx/jatuh", desc: "Karakter terjatuh" },
  ui_pilih: { file: "sfx/ui_pilih", desc: "Pindah pilihan di menu" },
  ui_buka: { file: "sfx/ui_buka", desc: "Membuka panel atau menu" },
  ui_tutup: { file: "sfx/ui_tutup", desc: "Menutup panel atau menu" },
  simbol: { file: "sfx/simbol", desc: "Menekan simbol teka-teki" },
  salah: { file: "sfx/salah", desc: "Jawaban teka-teki salah" },
  gemuruh: { file: "sfx/thunder", desc: "Petir dan gemuruh badai" },
  desir: { file: "sfx/desir", desc: "Gerakan cepat atau whoosh" },
  klakson_kapal: { file: "sfx/klakson_kapal", desc: "Klakson kapal penyelamat" },
  langkah: { file: "sfx/step_sand", desc: "Langkah kaki default" },
  langkah_pasir: { file: "sfx/step_sand", desc: "Langkah kaki di pasir" },
  langkah_daun: { file: "sfx/step_leaves", desc: "Langkah kaki di tanah dan dedaunan" },
  langkah_batu: { file: "sfx/step_stone", desc: "Langkah kaki di batu" },
  api: { file: "sfx/api", desc: "Api sinyal menyala" },
  derit_kapal: { file: "sfx/ship_creak", desc: "Kayu dan lambung kapal berderit" },
  kayu_patah: { file: "sfx/wood_break", desc: "Kayu kapal patah dan berserpih" },
  ombak_hantam: { file: "sfx/wave_crash", desc: "Ombak besar menghantam kapal" },
  camar: { file: "sfx/gull", desc: "Panggilan burung laut" }
};
