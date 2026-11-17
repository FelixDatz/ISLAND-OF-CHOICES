// Ukuran & fisika setiap "kind" objek. Tampilan dibuat secara prosedural di
// src/art/textures.js dengan key yang sama; art final cukup mengganti texture-nya.
//   solid: menghalangi gerak · body: hitbox (default seluruh sprite, menempel di bawah)

export const COLORS = {
  sea: 0x176b9f,
  goal: 0xf6b84a
};

const S = (w, h, body) => ({ w, h, solid: true, body });
const D = (w, h) => ({ w, h, solid: false });

export const KINDS = {
  player: D(30, 42),

  // Stage 1
  tree: S(70, 92, { w: 18, h: 14 }),
  palm: S(70, 100, { w: 14, h: 12 }),
  bush: D(44, 30),
  rock: S(42, 30),
  wreck: S(124, 58, { w: 110, h: 34 }),
  driftwood: D(70, 20),
  sign: S(32, 46, { w: 14, h: 12 }),
  cache: S(56, 42),
  bottle: D(22, 34),
  tidepool: D(60, 34),
  camp: S(76, 56, { w: 50, h: 22 }),
  marker: S(38, 48, { w: 30, h: 18 }),
  tracks: D(46, 34),
  branch: D(50, 26),
  carved_stone: S(46, 36),
  reeds: D(44, 46),

  // Stage 2
  jungle_tree: S(90, 110, { w: 22, h: 16 }),
  banana_tree: S(70, 92, { w: 16, h: 14 }),
  monkey: D(30, 30),
  vines: D(44, 76),
  bamboo: D(52, 84),
  note_post: S(30, 50, { w: 14, h: 12 }),
  mural: S(76, 64, { w: 76, h: 26 }),
  shrine: S(56, 46, { w: 50, h: 24 }),
  tablet: S(44, 40, { w: 40, h: 18 }),
  relic_chest: S(54, 40),
  pillar: S(34, 80, { w: 30, h: 22 }),
  statue: S(40, 74, { w: 30, h: 20 }),
  glyph_panel: D(40, 56),
  cracked_wall: D(40, 70),
  hollow_log: S(70, 30),
  birds: D(46, 30),
  mist: D(40, 60),
  backpack: D(32, 28),

  // Stage 3
  hut: S(120, 90, { w: 110, h: 40 }),
  book: D(28, 22),
  board: S(36, 44, { w: 30, h: 12 }),
  barrel: S(30, 36),
  crate: S(40, 36),
  weather_station: S(50, 80, { w: 30, h: 16 }),
  woodpile: D(56, 30),
  grass_patch: D(52, 30),
  flint: D(34, 24),
  grave: S(30, 40, { w: 26, h: 14 }),
  lighthouse: S(96, 190, { w: 80, h: 50 }),
  radio: D(40, 36),
  lamp_console: D(40, 40),
  firepit: D(60, 42),
  telescope: S(30, 48, { w: 16, h: 12 }),
  planks: D(64, 26),
  boat_frame: D(96, 42),

  // Dekorasi (tidak interaktif, tidak menghalangi)
  tuft: D(16, 12),
  flower: D(14, 14),
  pebble: D(12, 8),
  fern: D(30, 22),
  mushroom: D(14, 14),
  starfish: D(14, 14),

  // Makhluk ambient
  crab: D(20, 14),
  fish: D(18, 9),
  bird: D(22, 12),
  ship: D(190, 110)
};

// Kompatibilitas nama lama.
export const PLACEHOLDERS = KINDS;
