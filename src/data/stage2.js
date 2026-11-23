// Stage 2 — Reruntuhan Hutan.
// Tantangan utama: melewati dinding kuil. Empat cara dengan karakter berbeda:
//   glyph_code        teka-teki simbol (bisa dipecahkan lewat mural ATAU coba-coba)
//   stone_lever       merakit tuas dari bambu + pengikat (tali Stage 1 atau sulur)
//   waterfall_passage jalan rahasia di balik air terjun (hanya muncul setelah diamati)
//   climb_wall        memanjat dinding retak: aman hanya jika beban ringan
// Barang dari Stage 1 punya kegunaan: kerang (altar), kelapa (monyet), kapak (sulur, peti).

const GLYPHS = [
  { id: "sun", glyph: "☀", label: "Matahari" },
  { id: "wave", glyph: "≋", label: "Ombak" },
  { id: "leaf", glyph: "❦", label: "Daun" },
  { id: "moon", glyph: "☾", label: "Bulan" }
];

export const STAGE2 = {
  id: "stage2",
  name: "Reruntuhan Hutan",
  world: { width: 2400, height: 1600 },
  spawn: { x: 150, y: 810 },
  mainChallenge: "temple_gate",

  intro: {
    kicker: "STAGE 2",
    title: "Reruntuhan Hutan",
    text: "Hutan lebat menyembunyikan kuil tua. Dinding batunya memotong jalan menuju dataran tinggi. Ada lebih dari satu cara untuk melewatinya."
  },

  ambience: {
    tint: { color: 0x9fd0b0, alpha: 0.32 },
    particles: ["fireflies", "mist", "leaves"],
    critters: [
      { kind: "bird", count: 4 },
      { kind: "fish", count: 3, area: { x: 1470, y: 70, w: 160, h: 120 } }
    ],
    sound: "hutan"
  },

  music: "stage2_hutan",
  objective: { before: "Temukan cara melewati dinding kuil.", after: "Lanjutkan ke lingkaran emas di dataran tinggi." },

  challenges: {
    temple_gate: {
      label: "Melewati dinding kuil",
      gates: {
        main: { x: 1640, y: 740, w: 80, h: 120, style: "stone_door" },
        waterfall: { x: 1640, y: 200, w: 80, h: 120, style: "waterfall" }
      },
      strategies: {
        glyph_code: { label: "Memecahkan kode simbol", tags: ["decode", "observe"], informedBy: ["mural_sun", "mural_wave", "mural_moon", "shrine_offering"], opens: "main" },
        stone_lever: { label: "Tuas bambu", tags: ["craft", "tool"], informedBy: ["explorer_note"], opens: "main" },
        waterfall_passage: { label: "Jalan rahasia air terjun", tags: ["pathfinding", "observe"], informedBy: ["waterfall_birds"], opens: "waterfall" },
        climb_wall: { label: "Memanjat dinding retak", tags: ["risk"], informedBy: ["wall_cracks"] }
      }
    },
    relic_chest: {
      label: "Membuka peti relik",
      optional: true,
      strategies: {
        chest_code: { label: "Kode tablet", tags: ["decode"], informedBy: ["stone_tablet"] },
        chest_pry: { label: "Ungkit dengan kapak", tags: ["tool"] },
        chest_bamboo: { label: "Dongkrak bambu", tags: ["improvise"] }
      }
    }
  },

  zones: [
    { id: "jungle_edge", title: "TEPI RIMBA", hint: "Hutan yang hidup. Buah, sulur, dan bambu tumbuh di mana-mana.", bounds: { x: 0, y: 0, w: 700, h: 1600 } },
    { id: "ruins", title: "RERUNTUHAN", hint: "Lukisan dan batu bertulis. Orang-orang dahulu meninggalkan pesan.", bounds: { x: 700, y: 0, w: 760, h: 1600 } },
    { id: "temple", title: "DINDING KUIL", hint: "Dinding kuil yang tinggi. Pintu batu, air terjun, dan retakan.", bounds: { x: 1460, y: 0, w: 260, h: 1600 } },
    { id: "highland", title: "JALAN DATARAN TINGGI", hint: "Udara lebih sejuk. Jalan setapak naik menuju tanjung.", bounds: { x: 1720, y: 0, w: 680, h: 1600 } }
  ],

  ground: [
    { x: 0, y: 0, w: 2400, h: 1600, tile: "jungle" },
    { x: 700, y: 60, w: 940, h: 1480, tile: "stone_floor" },
    { x: 1720, y: 0, w: 680, h: 1600, tile: "grass" },
    { x: 40, y: 785, w: 1600, h: 50, tile: "path" },
    { x: 1720, y: 785, w: 640, h: 50, tile: "path" },
    { x: 1640, y: 740, w: 80, h: 120, tile: "stone_floor" },
    { x: 1640, y: 200, w: 80, h: 120, tile: "stone_floor" }
  ],

  water: [
    { x: 1460, y: 60, w: 180, h: 140, style: "pool", flow: [0, 25] }
  ],

  walls: [
    { x: 0, y: 0, w: 2400, h: 60, style: "foliage" },
    { x: 0, y: 1540, w: 2400, h: 60, style: "foliage" },
    { x: 0, y: 0, w: 40, h: 1600, style: "foliage" },
    { x: 2360, y: 0, w: 40, h: 1600, style: "foliage" },
    { x: 1640, y: 0, w: 80, h: 200, style: "stone" },
    { x: 1640, y: 320, w: 80, h: 420, style: "stone" },
    { x: 1640, y: 860, w: 80, h: 740, style: "stone" }
  ],

  decor: [
    { kind: "fern", count: 60, area: { x: 50, y: 70, w: 640, h: 1460 } },
    { kind: "mushroom", count: 24, area: { x: 50, y: 70, w: 640, h: 1460 } },
    { kind: "pebble", count: 40, area: { x: 710, y: 70, w: 920, h: 1460 } },
    { kind: "tuft", count: 30, area: { x: 710, y: 70, w: 920, h: 1460 } },
    { kind: "tuft", count: 70, area: { x: 1730, y: 70, w: 620, h: 1460 } },
    { kind: "flower", count: 34, area: { x: 1730, y: 70, w: 620, h: 1460 } }
  ],

  goal: { x: 2140, y: 700, w: 200, h: 220, requiresFlags: ["temple_gate_resolved"], label: "Jalan menuju tanjung" },

  objects: [
    // ---------- tepi hutan ----------
    {
      id: "explorer_note", kind: "note_post", x: 250, y: 660, label: "Catatan di batang pohon",
      examine: "Kertas yang dipaku di batang pohon, sudah kamu baca.",
      actions: [{
        id: "read_note", text: "Baca catatan", once: true, tags: ["observe"],
        discoveryId: "explorer_note", discoveryTitle: "Catatan penjelajah", discoveryCategory: "optional_activity",
        journalNote: "Penjelajah sebelumnya: gerbang kuil bisa diungkit dengan batang panjang, tetapi ia memilih jalan lain.",
        dialog: "Tulisan tangan yang luntur: \"Pintu batu kuil bergeser kalau diungkit batang panjang yang diikat kuat. Tapi aku menemukan jalan lain... ikuti burung-burung.\""
      }]
    },
    {
      id: "banana_tree", kind: "banana_tree", x: 420, y: 520, label: "Pohon pisang",
      examine: "Pohon pisang yang sudah dipetik.",
      actions: [{
        id: "pick_banana", text: "Petik pisang", once: true, tags: ["gather"],
        effects: [{ give: "banana" }],
        dialog: "Kamu memetik setandan kecil pisang matang."
      }]
    },
    {
      id: "monkey", kind: "monkey", x: 560, y: 380, label: "Monyet penasaran",
      examine: "Monyet itu sibuk mengunyah dan sudah tidak memperhatikanmu.",
      actions: [
        {
          id: "give_banana", text: "Beri pisang", once: true, tags: ["improvise"], hideIfFlags: ["monkey_fed"],
          requires: { items: { banana: 1 } }, consumes: { banana: 1 },
          hint: "Monyet itu terus memperhatikan tanganmu, seperti berharap ada makanan.",
          effects: [{ give: "vine" }, { flag: "monkey_fed" }],
          discoveryId: "monkey_friend", discoveryTitle: "Teman di pepohonan", discoveryCategory: "optional_activity",
          journalNote: "Monyet itu menerima pisang lalu menjatuhkan sehelai sulur panjang dari atas pohon.",
          dialog: "Monyet itu menyambar pisangnya, memanjat ke atas, lalu menjatuhkan seutas sulur panjang tepat di depanmu."
        },
        {
          id: "give_coconut", text: "Beri kelapa", once: true, tags: ["improvise"], hideIfFlags: ["monkey_fed"],
          requires: { items: { coconut: 1 } }, consumes: { coconut: 1 },
          effects: [{ give: "vine" }, { flag: "monkey_fed" }],
          discoveryId: "monkey_friend", discoveryTitle: "Teman di pepohonan", discoveryCategory: "optional_activity",
          journalNote: "Kelapa dari pantai ternyata disukai monyet. Ia membalas dengan menjatuhkan sulur panjang.",
          dialog: "Monyet itu memeluk kelapanya dengan gembira, lalu menarik sulur dari dahan dan menjatuhkannya untukmu."
        }
      ]
    },
    {
      id: "hanging_vines", kind: "vines", x: 300, y: 1100, label: "Sulur menjuntai",
      examine: "Sisa sulur yang terlalu tinggi untuk dijangkau.",
      actions: [{
        id: "cut_vine", text: "Potong sulur", once: true, tags: ["gather", "tool"],
        requires: { items: { small_axe: 1 } },
        hint: "Sulurnya liat sekali. Kamu butuh sesuatu yang tajam untuk memotongnya.",
        effects: [{ give: "vine" }],
        dialog: "Dengan kapak kecil, kamu memotong seutas sulur panjang yang kuat."
      }]
    },
    {
      id: "bamboo_grove_1", kind: "bamboo", x: 600, y: 1250, label: "Rumpun bambu",
      examine: "Batang-batang yang tersisa masih terlalu muda.",
      actions: [{
        id: "take_bamboo", text: "Ambil sebatang bambu", once: true, tags: ["gather"],
        effects: [{ give: "bamboo" }],
        dialog: "Kamu mematahkan sebatang bambu tua yang panjang dan kokoh."
      }]
    },

    // ---------- reruntuhan ----------
    {
      id: "mural_sun", kind: "mural", x: 850, y: 500, label: "Lukisan dinding I",
      examine: "Matahari besar dengan angka I.",
      actions: [{
        id: "study_mural", text: "Amati lukisan", once: true, tags: ["observe"],
        discoveryId: "mural_sun", discoveryTitle: "Lukisan I: Matahari",
        dialog: "Panel pertama: matahari besar memancarkan sinar. Di bawahnya terukir angka romawi I."
      }]
    },
    {
      id: "mural_wave", kind: "mural", x: 1050, y: 1050, label: "Lukisan dinding II",
      examine: "Ombak bergulung dengan angka II.",
      actions: [{
        id: "study_mural", text: "Amati lukisan", once: true, tags: ["observe"],
        discoveryId: "mural_wave", discoveryTitle: "Lukisan II: Ombak",
        dialog: "Panel kedua: ombak bergulung di bawah langit cerah. Angka II terukir di sudutnya."
      }]
    },
    {
      id: "mural_moon", kind: "mural", x: 1250, y: 620, label: "Lukisan dinding III–IV",
      examine: "Daun (III) dan bulan (IV).",
      actions: [{
        id: "study_mural", text: "Amati lukisan", once: true, tags: ["observe"],
        discoveryId: "mural_moon", discoveryTitle: "Lukisan III–IV: Daun & Bulan",
        dialog: "Panel ini terbagi dua: sehelai daun tumbuh setelah hujan (III), lalu bulan sabit menutup hari (IV)."
      }]
    },
    {
      id: "shrine", kind: "shrine", x: 1000, y: 800, label: "Altar kecil",
      examine: "Kerang berkilau di altar memantulkan cahaya ke pintu kuil.",
      actions: [{
        id: "offer_shell", text: "Letakkan kerang di altar", once: true, tags: ["improvise"],
        requires: { items: { shell: 1 } }, consumes: { shell: 1 },
        hint: "Ada cekungan kecil berbentuk kerang di tengah altar.",
        discoveryId: "shrine_offering", discoveryTitle: "Altar yang terbangun", discoveryCategory: "optional_activity",
        journalNote: "Kerang dari kolam pasang pas di altar. Cahaya memperlihatkan urutan: matahari, ombak, daun, bulan.",
        effects: [{ flag: "glyph_order_revealed" }],
        dialog: "Kerang itu pas di cekungan altar. Cahaya memantul dan menyinari empat simbol berurutan: ☀ Matahari, ≋ Ombak, ❦ Daun, ☾ Bulan."
      }]
    },
    {
      id: "stone_tablet", kind: "tablet", x: 800, y: 1150, label: "Tablet batu",
      examine: "Tiga simbol: bulan, daun, bulan.",
      actions: [{
        id: "read_tablet", text: "Baca tablet", once: true, tags: ["observe"],
        discoveryId: "stone_tablet", discoveryTitle: "Tablet batu",
        dialog: "Tablet kecil bertuliskan tiga simbol berderet: ☾ Bulan, ❦ Daun, ☾ Bulan. Di bawahnya ada gambar peti."
      }]
    },
    {
      id: "relic_chest", kind: "relic_chest", x: 1300, y: 1250, label: "Peti relik",
      examine: "Peti batu yang sudah terbuka.",
      reactive: { flag: "relic_chest_opened", tint: 0xd9c79b, scaleY: 0.8 },
      actions: [
        {
          id: "chest_code", text: "Putar kunci simbol (3)", once: true,
          challengeId: "relic_chest", strategy: "chest_code", resolvesChallenge: true,
          puzzle: { title: "Kunci peti relik", prompt: "Masukkan tiga simbol.", symbols: GLYPHS, solution: ["moon", "leaf", "moon"] },
          effects: [{ flag: "relic_chest_opened" }, { give: "lens" }],
          journalNote: "Peti relik terbuka dengan kode simbol. Di dalamnya ada lensa kuno.",
          dialog: "Klik! Kunci simbol berputar dan tutup peti terangkat. Di dalamnya ada lensa kaca yang tebal."
        },
        {
          id: "chest_pry", text: "Ungkit dengan kapak", once: true,
          requires: { items: { small_axe: 1 } }, hint: "Celah tutupnya sempit. Perlu bilah logam.",
          challengeId: "relic_chest", strategy: "chest_pry", resolvesChallenge: true,
          effects: [{ flag: "relic_chest_opened" }, { give: "lens" }],
          journalNote: "Peti relik dibuka paksa dengan kapak. Isinya lensa kuno.",
          dialog: "Kamu menyelipkan kapak ke celah tutup dan mengungkitnya. Di dalam ada lensa kaca yang tebal."
        },
        {
          id: "chest_bamboo", text: "Dongkrak dengan bambu", once: true,
          requires: { items: { bamboo: 1 } }, consumes: { bamboo: 1 }, hint: "Tutupnya berat. Batang panjang bisa jadi dongkrak.",
          challengeId: "relic_chest", strategy: "chest_bamboo", resolvesChallenge: true,
          effects: [{ flag: "relic_chest_opened" }, { give: "lens" }],
          journalNote: "Peti relik didongkrak dengan bambu sampai bambunya patah. Isinya lensa kuno.",
          dialog: "Bambu melengkung... krak! Bambunya patah, tetapi tutup peti terbuka. Di dalam ada lensa kaca yang tebal."
        }
      ]
    },
    {
      id: "bamboo_grove_2", kind: "bamboo", x: 900, y: 300, label: "Rumpun bambu",
      examine: "Batang-batang yang tersisa masih terlalu muda.",
      actions: [{
        id: "take_bamboo", text: "Ambil sebatang bambu", once: true, tags: ["gather"],
        effects: [{ give: "bamboo" }],
        dialog: "Kamu mematahkan sebatang bambu tua yang panjang."
      }]
    },

    // ---------- dinding kuil ----------
    {
      id: "temple_panel", kind: "glyph_panel", x: 1605, y: 800, label: "Pintu batu kuil",
      examine: "Pintu batu sudah terbuka.",
      actions: [
        {
          id: "enter_code", text: "Tekan simbol di panel (4)",
          challengeId: "temple_gate", strategy: "glyph_code", resolvesChallenge: true,
          puzzle: { title: "Panel simbol kuil", prompt: "Empat simbol terukir di pintu. Tekan dalam urutan yang benar.", symbols: GLYPHS, solution: ["sun", "wave", "leaf", "moon"] },
          dialog: "Simbol terakhir menyala. Gemuruh rendah terdengar dan pintu batu perlahan terangkat."
        },
        {
          id: "build_lever", text: "Ungkit dengan tuas bambu",
          requires: { items: { bamboo: 1 }, choices: [{ label: "pengikat", options: [{ rope: 1 }, { vine: 1 }], consume: true }] },
          consumes: { bamboo: 1 },
          hint: "Ada celah di bawah pintu. Batang panjang yang diikat kuat bisa jadi tuas.",
          challengeId: "temple_gate", strategy: "stone_lever", resolvesChallenge: true,
          dialog: "Kamu mengikat bambu menjadi tuas, menyelipkannya ke celah, lalu menekan sekuat tenaga. Pintu batu terangkat dan terganjal."
        }
      ]
    },
    {
      id: "cracked_wall", kind: "cracked_wall", x: 1615, y: 1110, label: "Dinding retak",
      examine: "Dinding retak yang sudah kamu lewati.",
      actions: [
        {
          id: "inspect_cracks", text: "Periksa retakan", once: true, tags: ["observe"],
          discoveryId: "wall_cracks", discoveryTitle: "Dinding retak",
          dialog: "Pijakannya rapuh. Batu-batu kecil runtuh hanya karena disentuh. Dengan beban ringan, mungkin bisa dipanjat."
        },
        {
          id: "climb", text: "Panjat dinding retak",
          challengeId: "temple_gate", strategy: "climb_wall", resolvesChallenge: true,
          risky: {
            safeIf: { maxItems: 3 },
            failure: {
              outcome: "setback", reason: "fell_from_wall", respawn: { x: 1420, y: 1120 }, toast: "Pijakan runtuh!",
              title: "Terjatuh", text: "Beban yang kamu bawa terlalu berat. Pijakan runtuh dan kamu terjatuh, tetapi tidak terluka parah."
            }
          },
          moveTo: { x: 1790, y: 1110 },
          dialog: "Dengan beban ringan, kamu memanjat dari celah ke celah lalu melompat turun di sisi seberang."
        }
      ]
    },
    {
      id: "hollow_log", kind: "hollow_log", x: 1500, y: 1000, label: "Batang berlubang",
      examine: "Batang tua yang berlubang.",
      actions: [
        {
          id: "stash_items", text: "Tinggalkan semua barang di sini", tags: [],
          requires: { flags: [] }, hideIfFlags: ["stash_has_items"],
          effects: [{ stash: true }],
          dialog: "Kamu menyimpan semua barangmu di dalam batang berlubang. Bebanmu jauh lebih ringan. (Barang yang tertinggal tidak ikut ke stage berikutnya.)"
        },
        {
          id: "take_back", text: "Ambil kembali barang", tags: [],
          requires: { flags: ["stash_has_items"] },
          effects: [{ unstash: true }],
          dialog: "Kamu mengambil kembali barang-barangmu."
        }
      ]
    },
    {
      id: "waterfall_birds", kind: "birds", x: 1530, y: 290, label: "Burung walet",
      examine: "Burung-burung walet masih beterbangan di dekat air terjun.",
      actions: [{
        id: "watch_birds", text: "Perhatikan burung", once: true, tags: ["observe"],
        discoveryId: "waterfall_birds", discoveryTitle: "Burung walet di air terjun",
        dialog: "Burung walet terbang menembus tirai air terjun dan muncul lagi dengan ranting di paruhnya. Pasti ada rongga di balik air itu."
      }]
    },
    {
      id: "waterfall", kind: "mist", x: 1615, y: 260, label: "Tirai air terjun",
      examine: "Air terjun deras menutupi dinding batu. Burung-burung beterbangan di sekitarnya.",
      actions: [{
        id: "slip_behind", text: "Menyusup ke balik air terjun",
        requires: { flags: ["discovery_waterfall_birds"] },
        challengeId: "temple_gate", strategy: "waterfall_passage", resolvesChallenge: true,
        dialog: "Kamu menahan napas dan menembus tirai air. Di baliknya ada lorong batu yang mengarah ke sisi seberang dinding."
      }]
    },

    // ---------- dataran tinggi ----------
    {
      id: "explorer_backpack", kind: "backpack", x: 1950, y: 500, label: "Ransel tua",
      examine: "Ransel kosong yang sudah lapuk.",
      actions: [{
        id: "search_backpack", text: "Periksa ransel", once: true, tags: ["collect"],
        discoveryId: "explorer_backpack", discoveryTitle: "Ransel penjelajah", discoveryCategory: "optional_activity",
        journalNote: "Ransel penjelajah berisi aki tua yang masih menyimpan daya.",
        effects: [{ give: "battery" }],
        dialog: "Di dalam ransel ada aki tua. Lampunya berkedip lemah saat kamu menekan tombolnya: masih ada daya."
      }]
    },
    {
      id: "viewpoint", kind: "marker", x: 2200, y: 300, label: "Tebing pandang",
      examine: "Mercusuar tua terlihat di ujung tanjung.",
      actions: [{
        id: "look_out", text: "Pandang ke kejauhan", once: true, tags: ["observe"],
        discoveryId: "lighthouse_sighted", discoveryTitle: "Mercusuar di kejauhan", discoveryCategory: "optional_activity",
        journalNote: "Dari tebing terlihat mercusuar tua di ujung tanjung, dan sesekali kapal melintas jauh di laut.",
        dialog: "Dari tebing, kamu melihat mercusuar tua di ujung tanjung. Jauh di laut, sebuah kapal kecil melintas."
      }]
    },

    // ---------- dekorasi ----------
    ...[[120, 200], [300, 300], [180, 450], [480, 180], [640, 640], [120, 980], [470, 900], [640, 1050], [200, 1300], [450, 1420], [600, 1480]]
      .map(([x, y]) => ({ kind: "jungle_tree", x, y })),
    ...[[760, 720], [1150, 400], [1360, 900], [1200, 1380], [880, 900]].map(([x, y]) => ({ kind: "pillar", x, y })),
    ...[[1100, 250], [780, 1400]].map(([x, y]) => ({ kind: "statue", x, y })),
    ...[[1850, 250], [2050, 1000], [1900, 1350], [2250, 1200], [2280, 520]].map(([x, y]) => ({ kind: "tree", x, y })),
    ...[[1800, 700], [2000, 1250], [2300, 900]].map(([x, y]) => ({ kind: "rock", x, y })),
    ...[[350, 760], [520, 1180], [150, 1150]].map(([x, y]) => ({ kind: "bush", x, y }))
  ]
};
