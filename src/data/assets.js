// Satu-satunya tempat yang menentukan "tampilan" objek di dunia game.
// Sekarang semuanya placeholder (kotak berwarna). Saat art siap, cukup ganti
// pembuatan texture di BootScene dengan load.image() memakai key yang sama.
// Logika game dan data stage tidak perlu diubah.

export const COLORS = {
  sea: 0x176b9f,
  sand: 0xf0d9a7,
  grass: 0x4f9a5f,
  grassDark: 0x2f6f4a,
  water: 0x2f8fc7,
  goal: 0xf6b84a
};

// solid: true = menghalangi gerak pemain.
export const PLACEHOLDERS = {
  player: { w: 28, h: 36, color: 0xf6b84a, outline: 0x7a4b00, solid: false },
  tree: { w: 44, h: 52, color: 0x1f6b4f, outline: 0x0f3a2a, solid: true },
  rock: { w: 38, h: 28, color: 0x8a97a3, outline: 0x4a5560, solid: true },
  bush: { w: 40, h: 28, color: 0x3f8f4f, outline: 0x245a31, solid: false },
  wreck: { w: 96, h: 42, color: 0x8b5a2b, outline: 0x4a2f12, solid: true },
  palm: { w: 44, h: 58, color: 0x9ac23c, outline: 0x4d6a12, solid: true },
  driftwood: { w: 70, h: 18, color: 0xb98e5a, outline: 0x6b4a22, solid: false },
  sign: { w: 30, h: 44, color: 0xd9b27c, outline: 0x6b4a22, solid: true }
};
