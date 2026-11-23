// Stage 3 — Tanjung Mercusuar (senja).
// Tantangan utama: memanggil pertolongan. Empat cara:
//   radio_repair  merakit radio: aki (Stage 2 / gudang) + kabel
//   lamp_code     kode darurat lampu mercusuar (minyak + teka-teki •/—)
//   signal_fire   api sinyal: kayu + bahan sulut (rumput / kain Stage 1) + pemantik (lensa Stage 2 / batu api)
//   raft_escape   berlayar sendiri: aman hanya jika paham arus (tabel pasang ATAU peta Stage 1)

const SOS = [
  { id: "short", glyph: "•", label: "Pendek" },
  { id: "long", glyph: "—", label: "Panjang" }
];

export const STAGE3 = {
  id: "stage3",
  name: "Tanjung Mercusuar",
  world: { width: 2400, height: 1600 },
  spawn: { x: 130, y: 1300 },
  mainChallenge: "rescue_signal",

  intro: {
    kicker: "STAGE 3",
    title: "Tanjung Mercusuar",
    text: "Matahari mulai terbenam. Dari tanjung ini, kapal yang lewat bisa melihatmu. Panggil pertolongan dengan caramu sendiri."
  },

  ambience: {
    tint: { color: 0xffb07a, alpha: 0.34 },
    particles: ["wind", "spray"],
    critters: [
      { kind: "bird", count: 5 },
      { kind: "crab", count: 3, area: { x: 1520, y: 820, w: 440, h: 700 } },
      { kind: "fish", count: 4, area: { x: 2040, y: 60, w: 320, h: 1500 } }
    ],
    sound: "angin"
  },

  music: "stage3_mercusuar",
  objective: { before: "Panggil pertolongan dengan caramu sendiri.", after: "Pergi ke dermaga, kapal sudah menunggu." },

  challenges: {
    rescue_signal: {
      label: "Memanggil pertolongan",
      resolveFx: "ship_arrival",
      strategies: {
        radio_repair: { label: "Memperbaiki radio", tags: ["craft", "tool"], informedBy: [] },
        lamp_code: { label: "Kode darurat lampu", tags: ["decode", "observe"], informedBy: ["logbook_sos"] },
        signal_fire: { label: "Api sinyal", tags: ["improvise", "craft"], informedBy: ["telescope_ship"] },
        raft_escape: { label: "Berlayar sendiri", tags: ["risk", "craft"], informedBy: ["tide_chart"] }
      }
    }
  },

  zones: [
    { id: "trail", title: "JALUR TEBING", hint: "Angin kencang. Rumput kering, kayu, dan batu tersebar di jalan setapak.", bounds: { x: 0, y: 0, w: 800, h: 1600 } },
    { id: "keeper", title: "RUMAH PENJAGA", hint: "Rumah penjaga mercusuar. Catatan lamanya mungkin masih ada.", bounds: { x: 800, y: 0, w: 700, h: 1600 } },
    { id: "peak", title: "MERCUSUAR", hint: "Puncak tanjung. Dari sini, laut lepas terlihat jelas.", bounds: { x: 1500, y: 0, w: 900, h: 760 } },
    { id: "cove", title: "TELUK", hint: "Teluk kecil dan dermaga rusak. Arus di sini sulit ditebak.", bounds: { x: 1500, y: 760, w: 900, h: 840 } }
  ],

  ground: [
    { x: 0, y: 0, w: 2400, h: 1600, tile: "rock_ground" },
    { x: 40, y: 40, w: 1460, h: 1520, tile: "grass_dry" },
    { x: 1500, y: 800, w: 500, h: 760, tile: "sand" },
    { x: 40, y: 1270, w: 1000, h: 46, tile: "path" },
    { x: 1000, y: 600, w: 46, h: 716, tile: "path" },
    { x: 1000, y: 600, w: 700, h: 46, tile: "path" }
  ],

  water: [
    { x: 2000, y: 0, w: 400, h: 1130, style: "sea" },
    { x: 2000, y: 1130, w: 400, h: 80, style: "sea", solid: false },
    { x: 2000, y: 1210, w: 400, h: 390, style: "sea" }
  ],

  bridges: [{ x: 1990, y: 1130, w: 260, h: 80, style: "pier" }],

  walls: [
    { x: 0, y: 0, w: 2000, h: 40, style: "cliff" },
    { x: 0, y: 1560, w: 2000, h: 40, style: "cliff" },
    { x: 0, y: 0, w: 40, h: 1600, style: "cliff" },
    { x: 1620, y: 760, w: 380, h: 40, style: "cliff" }
  ],

  decor: [
    { kind: "tuft", count: 90, area: { x: 50, y: 50, w: 1440, h: 1500 } },
    { kind: "pebble", count: 40, area: { x: 50, y: 50, w: 1900, h: 1500 } },
    { kind: "flower", count: 18, area: { x: 50, y: 50, w: 1440, h: 1500 } },
    { kind: "starfish", count: 8, area: { x: 1520, y: 820, w: 460, h: 720 } }
  ],

  goal: { x: 2060, y: 1130, w: 170, h: 80, requiresFlags: ["rescue_signal_resolved"], label: "Dermaga" },

  objects: [
    // ---------- jalan tebing ----------
    {
      id: "dry_grass", kind: "grass_patch", x: 400, y: 600, label: "Rumput kering",
      examine: "Rumput yang tersisa masih basah oleh embun.",
      actions: [{ id: "gather_grass", text: "Kumpulkan rumput kering", once: true, tags: ["gather"], effects: [{ give: "dry_grass" }], dialog: "Kamu mengumpulkan segenggam rumput kering." }]
    },
    {
      id: "woodpile", kind: "woodpile", x: 600, y: 900, label: "Tumpukan kayu",
      examine: "Hanya tersisa ranting basah.",
      actions: [{ id: "take_wood", text: "Ambil kayu kering", once: true, tags: ["gather"], effects: [{ give: "dry_wood", n: 2 }], dialog: "Kamu mengambil dua ikat kayu kering." }]
    },
    {
      id: "flint_rocks", kind: "flint", x: 700, y: 1380, label: "Batu-batu gelap",
      examine: "Batu-batu biasa.",
      actions: [{ id: "take_flint", text: "Ambil batu api", once: true, tags: ["gather"], effects: [{ give: "flint" }], dialog: "Kamu membenturkan dua batu. Percikan api! Kamu menyimpan satu batu api." }]
    },
    {
      id: "keeper_grave", kind: "grave", x: 320, y: 300, label: "Nisan sederhana",
      examine: "Nisan penjaga mercusuar.",
      actions: [{
        id: "read_grave", text: "Baca tulisan nisan", once: true, tags: ["observe"],
        discoveryId: "keeper_grave", discoveryTitle: "Nisan penjaga", discoveryCategory: "optional_activity",
        journalNote: "Nisan penjaga mercusuar: \"Ia menjaga cahaya tetap menyala selama empat puluh tahun.\"",
        dialog: "\"Di sini beristirahat penjaga cahaya. Selama empat puluh tahun, tak satu kapal pun tersesat.\""
      }]
    },

    // ---------- rumah penjaga ----------
    {
      id: "keeper_logbook", kind: "book", x: 1050, y: 540, label: "Buku catatan penjaga",
      examine: "Buku catatan yang sudah kamu baca.",
      actions: [{
        id: "read_logbook", text: "Baca buku catatan", once: true, tags: ["observe"],
        discoveryId: "logbook_sos", discoveryTitle: "Kode darurat",
        dialog: "Halaman yang ditandai: \"Kode darurat lampu: tiga kedip pendek, tiga kedip panjang, tiga kedip pendek. Kapal mana pun akan berhenti.\""
      }]
    },
    {
      id: "tide_chart", kind: "board", x: 1220, y: 560, label: "Tabel pasang surut",
      examine: "Tabel pasang surut yang sudah kamu pelajari.",
      actions: [{
        id: "study_chart", text: "Pelajari tabel", once: true, tags: ["observe"],
        discoveryId: "tide_chart", discoveryTitle: "Tabel pasang surut",
        dialog: "Coretan merah: \"Saat surut, arus teluk menyeret ke karang. Berlayarlah menyusuri sisi utara, dekat dermaga.\""
      }]
    },
    {
      id: "oil_barrel", kind: "barrel", x: 880, y: 560, label: "Tong minyak",
      examine: "Tong minyak yang sudah kosong.",
      actions: [{ id: "take_oil", text: "Isi botol minyak", once: true, tags: ["gather"], effects: [{ give: "oil" }], dialog: "Kamu mengisi sebotol minyak lampu dari tong tua." }]
    },
    {
      id: "storeroom_crate", kind: "crate", x: 1330, y: 400, label: "Peti gudang",
      examine: "Peti kosong.",
      actions: [{ id: "search_crate", text: "Periksa peti", once: true, tags: ["gather"], effects: [{ give: "battery" }], dialog: "Di antara perkakas berkarat, ada sebuah aki tua. Masih ada sedikit daya." }]
    },
    {
      id: "weather_station", kind: "weather_station", x: 1300, y: 1100, label: "Stasiun cuaca rusak",
      examine: "Tiang besi yang sudah kamu preteli.",
      actions: [{ id: "salvage_wire", text: "Ambil kabel", once: true, tags: ["gather"], effects: [{ give: "wire" }], dialog: "Kamu menarik gulungan kabel tembaga dari stasiun cuaca yang roboh." }]
    },

    // ---------- puncak mercusuar ----------
    {
      id: "lighthouse_radio", kind: "radio", x: 1640, y: 470, label: "Radio penjaga",
      examine: "Radio yang sudah menyala.",
      actions: [{
        id: "repair_radio", text: "Perbaiki dan nyalakan radio",
        requires: { items: { battery: 1, wire: 1 } }, consumes: { battery: 1, wire: 1 },
        hint: "Radio tua ini mati total. Butuh sumber listrik dan kabel pengganti.",
        challengeId: "rescue_signal", strategy: "radio_repair", resolvesChallenge: true,
        dialog: "Kamu menyambung kabel ke aki. Radio berdesis... \"Di sini kapal Nusa Jaya, kami mendengarmu! Menuju dermaga.\""
      }]
    },
    {
      id: "lighthouse_lamp", kind: "lamp_console", x: 1800, y: 470, label: "Lampu mercusuar",
      examine: "Lampu mercusuar menyala terang.",
      actions: [{
        id: "send_signal", text: "Kirim sinyal lampu",
        requires: { items: { oil: 1 } }, consumes: { oil: 1 },
        hint: "Wadah lampunya kering. Butuh minyak.",
        challengeId: "rescue_signal", strategy: "lamp_code", resolvesChallenge: true,
        puzzle: { title: "Saklar lampu mercusuar", prompt: "Kirim kode kedipan. Sembilan kedipan pendek (•) atau panjang (—).", symbols: SOS, solution: ["short", "short", "short", "long", "long", "long", "short", "short", "short"] },
        dialog: "Cahaya mercusuar berkedip membelah senja. Tak lama, sebuah kapal membalas dengan klakson panjang."
      }]
    },
    {
      id: "signal_firepit", kind: "firepit", x: 1580, y: 220, label: "Tungku sinyal",
      examine: "Api sinyal berkobar tinggi.",
      actions: [{
        id: "light_fire", text: "Nyalakan api sinyal",
        requires: {
          items: { dry_wood: 2 },
          choices: [
            { label: "bahan sulut", options: [{ dry_grass: 1 }, { cloth: 1 }], consume: true },
            { label: "pemantik", options: [{ lens: 1 }, { flint: 1 }], consume: false }
          ]
        },
        consumes: { dry_wood: 2 },
        hint: "Tungku kosong. Butuh kayu bakar, bahan sulut, dan sesuatu untuk menyalakan api.",
        challengeId: "rescue_signal", strategy: "signal_fire", resolvesChallenge: true,
        dialog: "Api menjilat tinggi dan asap tebal membubung ke langit senja. Di kejauhan, sebuah kapal berbelok ke arah tanjung."
      }]
    },
    {
      id: "telescope", kind: "telescope", x: 1930, y: 600, label: "Teropong tua",
      examine: "Teropong menghadap ke utara.",
      actions: [{
        id: "look_telescope", text: "Lihat lewat teropong", once: true, tags: ["observe"],
        discoveryId: "telescope_ship", discoveryTitle: "Kapal di cakrawala", discoveryCategory: "optional_activity",
        journalNote: "Lewat teropong terlihat kapal nelayan melintas di utara. Asap atau cahaya dari puncak pasti terlihat dari sana.",
        dialog: "Lewat lensa yang buram, kamu melihat kapal nelayan bergerak pelan di utara. Dari sana, asap di puncak pasti terlihat."
      }]
    },

    // ---------- teluk ----------
    {
      id: "fishing_wreck", kind: "wreck", x: 1660, y: 1050, label: "Perahu nelayan karam",
      examine: "Bangkai perahu yang sudah kamu periksa.",
      actions: [{ id: "search_wreck", text: "Periksa perahu", once: true, tags: ["gather"], effects: [{ give: "rope" }], dialog: "Di bawah jaring yang robek, kamu menemukan gulungan tali yang masih kuat." }]
    },
    {
      id: "broken_pier", kind: "planks", x: 1760, y: 1420, label: "Papan dermaga lepas",
      examine: "Tidak ada lagi papan yang utuh.",
      actions: [{ id: "take_planks", text: "Ambil papan", once: true, tags: ["gather"], effects: [{ give: "planks", n: 2 }], dialog: "Kamu menarik dua papan kayu yang masih utuh." }]
    },
    {
      id: "boat_frame", kind: "boat_frame", x: 1880, y: 1300, label: "Rangka perahu",
      examine: "Tempat rangka perahu tadi.",
      actions: [{
        id: "sail_away", text: "Rakit perahu dan berlayar",
        requires: { items: { planks: 2 }, choices: [{ label: "pengikat", options: [{ rope: 1 }, { vine: 1 }], consume: true }] },
        consumes: { planks: 2 },
        hint: "Rangka perahu kecil. Butuh papan dan pengikat untuk membuatnya layak.",
        challengeId: "rescue_signal", strategy: "raft_escape", resolvesChallenge: true,
        risky: {
          safeIf: { anyOf: [{ flags: ["discovery_tide_chart"] }, { items: { map_fragment: 1 } }] },
          failure: {
            outcome: "fatal", reason: "capsized_reef", moveTo: { x: 2150, y: 1400 }, toast: "Arus menyeret ke karang!",
            title: "Terbalik di karang", text: "Arus teluk menyeret perahumu ke karang dan perahu terbalik. Perjalanan di tanjung dimulai lagi."
          }
        },
        moveTo: { x: 2100, y: 1170 },
        dialog: "Kamu menyusuri sisi utara teluk sesuai jalur aman. Arus tenang, dan sebuah kapal nelayan melambat untuk menjemputmu."
      }]
    },

    // ---------- dekorasi ----------
    { kind: "hut", x: 1050, y: 420 },
    { kind: "lighthouse", x: 1720, y: 290 },
    ...[[200, 900], [520, 220], [760, 700], [300, 1450], [1150, 860], [1400, 1450], [860, 1150]].map(([x, y]) => ({ kind: "tree", x, y })),
    ...[[460, 1100], [900, 300], [1450, 700], [1250, 1300], [1600, 650], [1550, 1500]].map(([x, y]) => ({ kind: "rock", x, y })),
    ...[[620, 500], [980, 1450], [250, 1100]].map(([x, y]) => ({ kind: "bush", x, y }))
  ]
};
