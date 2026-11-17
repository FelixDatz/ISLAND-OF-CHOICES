// Data Stage 1. Semua aturan dunia ada di sini (deklaratif); StageScene dan
// StageSession bersifat generik dan dipakai ulang oleh Stage 2 & 3.
//
// Skema aksi objek:
//   { id, text, once?, requires?, consumes?, effects?, dialog, hint?, removeObject?,
//     challengeId?, strategy?, resolvesChallenge?, outcome?: "fatal", fatal?,
//     discoveryId?, discoveryTitle?, discoveryCategory?, journalNote?, tags? }
// Tag strategi diambil dari `challenges` dan digabung otomatis (lihat stages.js).

export const STAGE1 = {
  id: "stage1",
  name: "Pantai Terdampar",
  world: { width: 2400, height: 1500 },
  spawn: { x: 260, y: 750 },
  mainChallenge: "river_crossing",

  intro: {
    kicker: "STAGE 1",
    title: "Pantai Terdampar",
    text: "Kapalmu karam. Di seberang sungai yang deras, jalan setapak menghilang ke dalam hutan. Bagaimana caramu menyeberang?"
  },

  ambience: {
    tint: { color: 0xfff1d6, alpha: 0.18 },
    particles: ["spray", "leaves"],
    critters: [
      { kind: "crab", count: 5, area: { x: 110, y: 120, w: 280, h: 1260 } },
      { kind: "fish", count: 6, area: { x: 1110, y: 90, w: 230, h: 1320 } },
      { kind: "bird", count: 3 }
    ],
    sound: "pantai"
  },

  music: "stage1_pantai",
  objective: { before: "Cari cara menyeberangi sungai.", after: "Ikuti jalan setapak ke lingkaran emas di timur." },

  // Tantangan & strategi. `informedBy` = penemuan yang relevan, dipakai untuk
  // menilai apakah keputusan diambil setelah mengamati.
  challenges: {
    river_crossing: {
      label: "Menyeberangi sungai",
      gates: { ford: { x: 1100, y: 640, w: 250, h: 100, style: "rapids" } },
      strategies: {
        upstream_route: { label: "Jalur dangkal di hulu", tags: ["pathfinding", "observe"], informedBy: ["river_reeds", "carved_stone"], visual: "stones" },
        raft: { label: "Rakit kayu apung", tags: ["craft"], informedBy: ["shore_tracks"], visual: "raft" },
        log_bridge: { label: "Jembatan batang kayu", tags: ["craft", "tool"], informedBy: ["split_branch"], visual: "log_bridge" },
        swim: { label: "Berenang melawan arus", tags: ["risk"], informedBy: [] }
      }
    },
    supply_cache: {
      label: "Membuka kotak perlengkapan",
      optional: true,
      strategies: {
        tool_prying: { label: "Ungkit dengan kapak", tags: ["tool"] },
        rope_leverage: { label: "Tarik dengan tali", tags: ["improvise"] },
        improvised_wedge: { label: "Ganjal dengan kayu apung", tags: ["improvise"] }
      }
    }
  },

  // Zona memberi orientasi ringan tanpa mengunci eksplorasi atau menunjuk satu solusi.
  zones: [
    { id: "shore", title: "PANTAI", hint: "Puing kapal dan garis pantai mungkin menyimpan sesuatu yang berguna.", bounds: { x: 0, y: 70, w: 420, h: 1360 } },
    { id: "wilderness", title: "HUTAN KECIL", hint: "Amati pepohonan, semak, dan jejak kecil di antara vegetasi.", bounds: { x: 420, y: 70, w: 610, h: 1360 } },
    { id: "riverbank", title: "TEPI SUNGAI", hint: "Arus terlihat kuat. Petunjuk di sekitar tepi sungai bisa memberi arah.", bounds: { x: 1030, y: 70, w: 320, h: 1360 } },
    { id: "far_side", title: "SEBERANG SUNGAI", hint: "Kamu sudah di seberang. Jalan setapak di timur mengarah ke hutan.", bounds: { x: 1350, y: 70, w: 960, h: 1360 } }
  ],

  // Lantai visual (tile prosedural), digambar berurutan.
  ground: [
    { x: 0, y: 0, w: 2400, h: 1500, tile: "grass" },
    { x: 0, y: 0, w: 430, h: 1500, tile: "sand" },
    { x: 1330, y: 0, w: 1070, h: 1500, tile: "grass_dark" },
    { x: 1040, y: 0, w: 60, h: 1500, tile: "mud" },
    { x: 1350, y: 0, w: 40, h: 1500, tile: "mud" },
    { x: 300, y: 720, w: 760, h: 46, tile: "path" },
    { x: 1350, y: 700, w: 760, h: 46, tile: "path" }
  ],

  // Air: laut & sungai solid, kecuali koridor penyeberangan (ditutup gate tantangan).
  water: [
    { x: 0, y: 0, w: 90, h: 1500, style: "sea" },
    { x: 2310, y: 0, w: 90, h: 1500, style: "sea" },
    { x: 0, y: 0, w: 2400, h: 70, style: "sea" },
    { x: 0, y: 1430, w: 2400, h: 70, style: "sea" },
    { x: 1100, y: 70, w: 250, h: 570, style: "river", flow: [0, 70] },
    { x: 1100, y: 640, w: 250, h: 100, style: "river", flow: [0, 70], solid: false },
    { x: 1100, y: 740, w: 250, h: 690, style: "river", flow: [0, 70] }
  ],

  // Dekorasi acak (deterministik) untuk mengisi dunia.
  decor: [
    { kind: "starfish", count: 10, area: { x: 100, y: 100, w: 300, h: 1300 } },
    { kind: "pebble", count: 26, area: { x: 100, y: 100, w: 320, h: 1300 } },
    { kind: "tuft", count: 70, area: { x: 440, y: 90, w: 600, h: 1320 } },
    { kind: "flower", count: 26, area: { x: 440, y: 90, w: 600, h: 1320 } },
    { kind: "tuft", count: 80, area: { x: 1400, y: 90, w: 900, h: 1320 } },
    { kind: "flower", count: 30, area: { x: 1400, y: 90, w: 900, h: 1320 } }
  ],

  // Area tujuan. Saat dicapai, pemain memilih menyelesaikan stage atau menjelajah dulu.
  goal: { x: 2080, y: 650, w: 220, h: 200, requiresFlags: ["river_crossing_open"], label: "Jalan setapak ke hutan" },

  // Objek dunia. "kind" = key di assets.js. (x, y) = titik tengah objek.
  objects: [
    {
      id: "wreck", kind: "wreck", x: 250, y: 880, label: "Perahu rusak",
      examine: "Sisa puing perahu. Tidak ada lagi yang berguna di sini.",
      actions: [
        {
          id: "search", text: "Periksa puing", once: true, tags: ["gather"],
          effects: [{ give: "rope" }, { give: "small_axe" }, { flag: "wreck_searched" }],
          dialog: "Di antara puing perahu, kamu menemukan seutas tali yang masih kuat dan sebuah kapak kecil."
        }
      ]
    },
    {
      id: "palm_1", kind: "palm", x: 470, y: 640, label: "Pohon kelapa",
      examine: "Pohon kelapa yang menjulang. Kamu sudah mengambil semua yang bisa diambil.",
      onRemove: { stump: true },
      actions: [
        {
          id: "pick", text: "Petik kelapa", once: true, tags: ["collect"],
          effects: [{ give: "coconut" }],
          dialog: "Kamu menggoyang batangnya, dan sebuah kelapa jatuh ke pasir."
        },
        {
          id: "chop", text: "Tebang pohon", once: true, removeObject: true, tags: ["gather", "tool"],
          requires: { items: { small_axe: 1 } },
          hint: "Batangnya keras. Kamu butuh sesuatu yang tajam.",
          effects: [{ give: "log" }],
          dialog: "Beberapa ayunan kapak, dan pohon itu tumbang. Kamu memotong sebatang kayu yang lurus."
        }
      ]
    },
    ...[["driftwood_1", 330, 620], ["driftwood_2", 360, 1140], ["driftwood_3", 1040, 980]].map(([id, x, y]) => ({
      id, kind: "driftwood", x, y, label: "Kayu apung",
      actions: [
        {
          id: "take", text: "Ambil kayu apung", once: true, removeObject: true, tags: ["gather"],
          effects: [{ give: "driftwood" }],
          dialog: "Kayu apung yang kering dan ringan."
        }
      ]
    })),
    {
      id: "river_bank", kind: "sign", x: 1050, y: 690, label: "Tepi sungai",
      examine: "Arus sungai cukup deras. Sudah ada jalan untuk menyeberang.",
      actions: [
        {
          id: "make_raft", text: "Rakit kayu dan tali",
          requires: { items: { rope: 1, driftwood: 2 } },
          hint: "Kayu apung yang diikat erat mungkin bisa mengapung melintasi arus.",
          consumes: { rope: 1, driftwood: 2 },
          effects: [{ flag: "river_crossing_open" }, { flag: "crossing_method_raft" }],
          challengeId: "river_crossing", strategy: "raft", resolvesChallenge: true,
          dialog: "Kamu mengikat kayu apung dengan tali hingga menjadi rakit sederhana. Koridor penyeberangan kini terbuka."
        },
        {
          id: "build_log_bridge", text: "Bentangkan batang kayu",
          requires: { items: { log: 1 } },
          hint: "Batang kayu yang cukup panjang bisa dibentangkan di bagian tersempit.",
          consumes: { log: 1 },
          effects: [{ flag: "river_crossing_open" }, { flag: "crossing_method_log_bridge" }],
          challengeId: "river_crossing", strategy: "log_bridge", resolvesChallenge: true,
          dialog: "Kamu membentangkan batang kayu panjang pada bagian sungai yang paling sempit. Koridor penyeberangan kini terbuka."
        },
        {
          id: "swim", text: "Coba berenang (arus deras)",
          challengeId: "river_crossing", strategy: "swim", outcome: "fatal",
          fatal: {
            reason: "drowned_midstream",
            moveTo: { x: 1225, y: 690 },
            toast: "Arus sungai terlalu deras!",
            title: "Terseret arus",
            text: "Kamu mencoba berenang, tetapi arus terlalu deras dan menyeretmu ke tengah sungai. Perjalanan dimulai lagi dari pantai."
          },
          dialog: "Kamu mencoba berenang, tetapi arus deras menyeretmu ke tengah sungai."
        }
      ]
    },
    {
      id: "supply_cache", kind: "cache", x: 790, y: 820, label: "Kotak perlengkapan tua",
      examine: "Kotak kayu itu sudah terbuka.",
      reactive: { flag: "supply_cache_opened", tint: 0xd5b47c, scaleY: 0.72 },
      actions: [
        {
          id: "pry_with_axe", text: "Ungkit dengan kapak kecil", once: true,
          requires: { items: { small_axe: 1 } },
          hint: "Tutupnya lapuk. Sesuatu yang tajam mungkin bisa mengungkitnya.",
          effects: [{ flag: "supply_cache_opened" }, { give: "map_fragment" }],
          challengeId: "supply_cache", strategy: "tool_prying", resolvesChallenge: true,
          journalNote: "Kotak perlengkapan dibuka dengan mengungkit tutupnya menggunakan kapak kecil.",
          dialog: "Dengan hati-hati kamu mengungkit bagian tutup yang sudah lapuk. Di dalamnya ada potongan peta tua."
        },
        {
          id: "loosen_with_rope", text: "Tarik ikatan dengan tali", once: true,
          requires: { items: { rope: 1 } },
          hint: "Bagian tutup yang menonjol mungkin bisa ditarik dengan sesuatu yang panjang dan kuat.",
          effects: [{ flag: "supply_cache_opened" }, { give: "map_fragment" }],
          challengeId: "supply_cache", strategy: "rope_leverage", resolvesChallenge: true,
          journalNote: "Kotak perlengkapan dibuka dengan memanfaatkan tali sebagai alat penarik.",
          dialog: "Kamu melilitkan tali pada bagian tutup yang menonjol, lalu menariknya perlahan sampai pengait terlepas. Di dalamnya ada potongan peta tua."
        },
        {
          id: "wedge_with_driftwood", text: "Selipkan kayu apung", once: true,
          requires: { items: { driftwood: 1 } },
          hint: "Ada celah sempit di tutupnya. Sesuatu yang pipih mungkin bisa diselipkan.",
          effects: [{ flag: "supply_cache_opened" }, { give: "map_fragment" }],
          challengeId: "supply_cache", strategy: "improvised_wedge", resolvesChallenge: true,
          journalNote: "Kotak perlengkapan dibuka dengan menyelipkan kayu apung sebagai pengungkit.",
          dialog: "Kamu memilih kayu apung yang paling pipih dan menyelipkannya ke celah tutup. Pengaitnya terlepas. Di dalamnya ada potongan peta tua."
        }
      ]
    },
    {
      id: "message_bottle", kind: "bottle", x: 145, y: 340, label: "Botol berisi pesan",
      examine: "Botol kosong yang tersangkut di pasir.",
      actions: [
        {
          id: "read_message", text: "Baca pesan di dalam botol", once: true, tags: ["observe"],
          discoveryId: "message_bottle_note", discoveryTitle: "Pesan dalam botol", discoveryCategory: "optional_activity",
          journalNote: "Pesan singkat menyebutkan sebuah perkemahan di sisi lain sungai, tanpa petunjuk cara mencapainya.",
          effects: [{ flag: "message_bottle_read" }],
          dialog: "Kertasnya hampir hancur oleh air laut. Beberapa kata masih terbaca: '...perkemahan di seberang... jangan ikuti arus...'."
        }
      ]
    },
    {
      id: "tide_pool", kind: "tidepool", x: 330, y: 1290, label: "Kolam pasang",
      examine: "Air laut terjebak di cekungan batu.",
      actions: [
        {
          id: "collect_shell", text: "Ambil sebuah kerang", once: true, tags: ["collect"],
          discoveryId: "tide_pool_shell", discoveryTitle: "Kerang di kolam pasang", discoveryCategory: "optional_activity",
          journalNote: "Satu kerang diambil dari kolam pasang.",
          effects: [{ give: "shell" }, { flag: "tide_pool_explored" }],
          dialog: "Kamu mengambil satu kerang kecil yang masih utuh."
        }
      ]
    },
    {
      id: "abandoned_camp", kind: "camp", x: 1680, y: 850, label: "Perkemahan lama",
      examine: "Sisa perapian sudah dingin.",
      actions: [
        {
          id: "search_camp", text: "Periksa sisa perkemahan", once: true, tags: ["collect"],
          discoveryId: "far_side_camp", discoveryTitle: "Sisa perkemahan", discoveryCategory: "optional_activity",
          journalNote: "Di perkemahan lama ditemukan selembar kain usang. Tempat ini pernah dipakai seseorang.",
          effects: [{ give: "cloth" }, { flag: "far_side_camp_searched" }],
          dialog: "Di bawah ranting kering, kamu menemukan selembar kain yang masih bisa dibawa."
        }
      ]
    },
    {
      id: "far_side_marker", kind: "marker", x: 2020, y: 390, label: "Penanda batu di bukit",
      examine: "Tumpukan batu kecil menghadap ke arah laut lepas.",
      actions: [
        {
          id: "inspect_marker", text: "Amati penanda batu", once: true, tags: ["observe"],
          discoveryId: "far_side_marker_note", discoveryTitle: "Penanda di sisi seberang", discoveryCategory: "optional_activity",
          journalNote: "Penanda batu menghadap laut lepas.",
          effects: [{ flag: "far_side_marker_inspected" }],
          dialog: "Dari sini kamu bisa melihat garis pantai yang jauh. Penanda ini tampaknya menunjuk arah laut."
        }
      ]
    },
    {
      id: "shore_tracks", kind: "tracks", x: 510, y: 900, label: "Jejak di pasir",
      examine: "Jejak itu mulai tertutup pasir.",
      actions: [
        {
          id: "inspect_tracks", text: "Amati jejak", once: true, tags: ["observe"],
          discoveryId: "shore_tracks", discoveryTitle: "Jejak di pasir",
          dialog: "Jejak sepatu dan serpihan kecil mengarah kembali ke pantai. Seseorang tampaknya sempat mengumpulkan barang di sekitar sini. Mungkin puing kapal belum sepenuhnya kosong."
        }
      ]
    },
    {
      id: "split_branch", kind: "branch", x: 760, y: 470, label: "Dahan patah",
      examine: "Dahan yang patah menunjukkan arah angin yang cukup kuat.",
      actions: [
        {
          id: "inspect_branch", text: "Periksa patahan", once: true, tags: ["observe"],
          discoveryId: "split_branch", discoveryTitle: "Dahan patah",
          dialog: "Patahan ini masih segar. Beberapa pohon kelapa di dekat pantai terlihat kokoh, tetapi batangnya perlu dipotong dengan alat yang tepat."
        }
      ]
    },
    {
      id: "carved_stone", kind: "carved_stone", x: 940, y: 1170, label: "Batu bertanda",
      examine: "Guratan pada batu sudah aus oleh hujan dan waktu.",
      actions: [
        {
          id: "read_marks", text: "Amati guratan", once: true, tags: ["observe"],
          discoveryId: "carved_stone", discoveryTitle: "Batu bertanda",
          dialog: "Guratan sederhana itu menyerupai aliran air yang berbelok ke utara. Di sampingnya ada garis-garis pendek seperti tepian yang landai."
        }
      ]
    },
    {
      id: "river_reeds", kind: "reeds", x: 970, y: 630, label: "Rumpun gelagah",
      examine: "Rumpun gelagah tumbuh rapat di sisi sungai.",
      actions: [
        {
          id: "inspect_reeds", text: "Amati arah gelagah", once: true, tags: ["observe"],
          discoveryId: "river_reeds", discoveryTitle: "Rumpun gelagah",
          dialog: "Batang-batang gelagah condong mengikuti arus. Di bagian hulu, aliran tampak lebih tenang. Jejak di dekat tepian mungkin layak ditelusuri."
        }
      ]
    },
    {
      id: "upstream_path", kind: "tracks", x: 1010, y: 500, label: "Jejak di tepi sungai",
      examine: "Jejak kaki mengarah ke bagian hulu.",
      actions: [
        {
          id: "discover_shallow_route", text: "Telusuri jalur di hulu", once: true,
          effects: [{ flag: "river_crossing_open" }, { flag: "crossing_method_upstream" }, { flag: "upstream_route_discovered" }],
          challengeId: "river_crossing", strategy: "upstream_route", resolvesChallenge: true,
          dialog: "Kamu mengikuti jejak ke arah hulu dan menemukan jalur dangkal yang dapat dilewati dengan hati-hati. Koridor penyeberangan kini terbuka."
        }
      ]
    },
    { kind: "palm", x: 190, y: 190 },
    { kind: "palm", x: 380, y: 470 },
    { kind: "palm", x: 160, y: 1030 },
    { kind: "palm", x: 410, y: 1365 },
    { kind: "palm", x: 150, y: 640 },
    { kind: "bush", x: 300, y: 1210 },
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
