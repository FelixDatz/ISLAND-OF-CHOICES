// Data Stage 1: peta sebagai kumpulan persegi (x, y = pojok kiri atas).
// Fase berikutnya menambahkan objek interaktif, item, dan rute di file ini.

export const STAGE1 = {
  id: "stage1",
  name: "Pantai Terdampar",
  world: { width: 2400, height: 1500 },
  spawn: { x: 260, y: 750 },

  // Lantai visual, tidak menghalangi gerak. Digambar berurutan (yang akhir di atas).
  ground: [
    { x: 0, y: 0, w: 2400, h: 1500, color: "grass" },
    { x: 0, y: 0, w: 420, h: 1500, color: "sand" },
    { x: 1330, y: 0, w: 1070, h: 1500, color: "grassDark" }
  ],

  // Laut tetap solid. Sungai memiliki satu koridor penyeberangan yang tertutup
  // penghalang sampai pemain menemukan solusi yang valid. Koridor air digambar,
  // tetapi collision-nya ditangani oleh riverGate di Stage1Scene.
  water: [
    { x: 0, y: 0, w: 90, h: 1500, color: "sea" },
    { x: 2310, y: 0, w: 90, h: 1500, color: "sea" },
    { x: 0, y: 0, w: 2400, h: 70, color: "sea" },
    { x: 0, y: 1430, w: 2400, h: 70, color: "sea" },
    { x: 1100, y: 70, w: 250, h: 570, color: "water" },
    { x: 1100, y: 640, w: 250, h: 100, color: "water", solid: false },
    { x: 1100, y: 740, w: 250, h: 690, color: "water" }
  ],

  // Target stage: tepi seberang sungai. Belum aktif, hanya penanda visual.
  goal: { x: 2080, y: 650, w: 220, h: 200 },

  // Objek dunia. "kind" = key di assets.js. (x, y) = titik tengah objek.
  objects: [
    {
      id: "wreck", kind: "wreck", x: 250, y: 880, label: "Perahu rusak",
      examine: "Sisa puing perahu. Tidak ada lagi yang berguna di sini.",
      actions: [
        {
          id: "search", text: "Periksa puing", once: true,
          effects: [{ give: "rope" }, { give: "small_axe" }, { flag: "wreck_searched" }],
          dialog: "Di antara puing perahu, kamu menemukan seutas tali yang masih kuat dan sebuah kapak kecil."
        }
      ]
    },
    {
      id: "palm_1", kind: "palm", x: 470, y: 640, label: "Pohon kelapa",
      examine: "Pohon kelapa yang menjulang. Kamu sudah mengambil semua yang bisa diambil.",
      actions: [
        {
          id: "pick", text: "Petik kelapa", once: true,
          effects: [{ give: "coconut" }],
          dialog: "Kamu menggoyang batangnya, dan sebuah kelapa jatuh ke pasir."
        },
        {
          id: "chop", text: "Tebang pohon", once: true, removeObject: true,
          requires: { items: { small_axe: 1 } },
          hint: "Batangnya keras. Kamu butuh sesuatu yang tajam.",
          effects: [{ give: "log" }],
          dialog: "Beberapa ayunan kapak, dan pohon itu tumbang. Kamu memotong sebatang kayu yang lurus."
        }
      ]
    },
    {
      id: "driftwood_1", kind: "driftwood", x: 330, y: 620, label: "Kayu apung",
      actions: [
        {
          id: "take", text: "Ambil kayu apung", once: true, removeObject: true,
          effects: [{ give: "driftwood" }],
          dialog: "Kayu apung yang kering dan ringan."
        }
      ]
    },
    {
      id: "driftwood_2", kind: "driftwood", x: 360, y: 1140, label: "Kayu apung",
      actions: [
        {
          id: "take", text: "Ambil kayu apung", once: true, removeObject: true,
          effects: [{ give: "driftwood" }],
          dialog: "Kayu apung yang kering dan ringan."
        }
      ]
    },
    {
      id: "driftwood_3", kind: "driftwood", x: 1040, y: 980, label: "Kayu apung",
      actions: [
        {
          id: "take", text: "Ambil kayu apung", once: true, removeObject: true,
          effects: [{ give: "driftwood" }],
          dialog: "Kayu apung yang kering dan ringan."
        }
      ]
    },
    {
      id: "river_bank", kind: "sign", x: 1050, y: 690, label: "Tepi sungai",
      examine: "Arus sungai cukup deras. Kamu bisa menyiapkan rakit, memanfaatkan batang kayu, atau mencoba berenang. Ada kemungkinan jalur lain di sepanjang tepi sungai.",
      actions: [
        {
          id: "make_raft", text: "Rakit kayu dan tali",
          requires: { items: { rope: 1, driftwood: 2 } },
          hint: "Butuh 1 tali dan 2 kayu apung. Periksa puing perahu dan kumpulkan kayu di pantai.",
          consumes: { rope: 1, driftwood: 2 },
          effects: [{ flag: "river_crossing_open" }, { flag: "crossing_method_raft" }],
          challengeId: "river_crossing", strategy: "raft", resolvesChallenge: true,
          dialog: "Kamu mengikat kayu apung dengan tali hingga menjadi rakit sederhana. Rakit itu cukup untuk membantumu melewati sungai. Koridor penyeberangan kini terbuka."
        },
        {
          id: "build_log_bridge", text: "Bentangkan batang kayu",
          requires: { items: { log: 1 } },
          hint: "Butuh 1 batang kayu. Ambil kapak kecil dari puing perahu, lalu tebang pohon kelapa.",
          consumes: { log: 1 },
          effects: [{ flag: "river_crossing_open" }, { flag: "crossing_method_log_bridge" }],
          challengeId: "river_crossing", strategy: "log_bridge", resolvesChallenge: true,
          dialog: "Kamu membentangkan batang kayu panjang pada bagian sungai yang paling sempit. Jembatan darurat itu bisa kamu lewati. Koridor penyeberangan kini terbuka."
        },
        {
          id: "swim", text: "Coba berenang (arus deras)",
          hint: "Arus terlihat sangat deras. Berenang langsung berisiko terseret ke tengah sungai.",
          challengeId: "river_crossing", strategy: "swim",
          dialog: "Kamu mencoba berenang, tetapi arus deras menyeretmu ke tengah sungai."
        }
      ]
    },
    {
      id: "upstream_path", kind: "sign", x: 1010, y: 500, label: "Jejak di tepi sungai",
      examine: "Jejak kaki mengarah ke bagian hulu. Dari sini, kamu bisa melihat arus yang lebih tenang dan tepian yang landai.",
      actions: [
        {
          id: "discover_shallow_route", text: "Telusuri jalur di hulu", once: true,
          effects: [{ flag: "river_crossing_open" }, { flag: "crossing_method_upstream" }, { flag: "upstream_route_discovered" }],
          challengeId: "river_crossing", strategy: "upstream_route", resolvesChallenge: true,
          dialog: "Kamu mengikuti jejak ke arah hulu dan menemukan jalur dangkal yang dapat dilewati dengan hati-hati. Kamu sudah menemukan rute alternatif tanpa perlu membuat alat. Koridor penyeberangan kini terbuka."
        }
      ]
    },
    { kind: "rock", x: 360, y: 1010 },
    { kind: "rock", x: 1000, y: 800 },
    { kind: "rock", x: 900, y: 1250 },

    { kind: "tree", x: 520, y: 300 },
    { kind: "tree", x: 640, y: 430 },
    { kind: "tree", x: 560, y: 570 },
    { kind: "tree", x: 770, y: 650 },
    { kind: "tree", x: 700, y: 990 },
    { kind: "tree", x: 830, y: 1110 },
    { kind: "tree", x: 480, y: 1210 },
    { kind: "tree", x: 910, y: 310 },
    { kind: "tree", x: 980, y: 530 },
    { kind: "bush", x: 600, y: 760 },
    { kind: "bush", x: 860, y: 900 },
    { kind: "bush", x: 540, y: 1100 },

    { kind: "rock", x: 1400, y: 700 },
    { kind: "rock", x: 1900, y: 360 },
    { kind: "tree", x: 1450, y: 260 },
    { kind: "tree", x: 1560, y: 430 },
    { kind: "tree", x: 1710, y: 300 },
    { kind: "tree", x: 1500, y: 920 },
    { kind: "tree", x: 1660, y: 1060 },
    { kind: "tree", x: 1850, y: 530 },
    { kind: "tree", x: 1960, y: 960 },
    { kind: "tree", x: 2060, y: 1210 },
    { kind: "tree", x: 1760, y: 1260 },
    { kind: "bush", x: 1600, y: 700 },
    { kind: "bush", x: 1800, y: 880 }
  ]
};
