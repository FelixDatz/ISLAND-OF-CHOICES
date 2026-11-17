import { KINDS } from "../data/assets.js";

// Art prosedural (tanpa file gambar). Setiap key di KINDS digambar dengan
// Phaser Graphics lalu dijadikan texture. Untuk art final, cukup muat gambar
// dengan key yang sama di BootScene.preload() dan lewati fungsi ini.

export function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const shadow = (g, w, h, sw, sh = 10) => g.fillStyle(0x000000, 0.22).fillEllipse(w / 2, h - sh / 2 - 1, sw, sh);
const poly = (g, color, pts, alpha = 1) => {
  g.fillStyle(color, alpha);
  g.fillPoints(pts.map(([x, y]) => ({ x, y })), true);
};
const canopy = (g, cx, cy, r, dark, mid, light) => {
  g.fillStyle(dark).fillCircle(cx - r * 0.55, cy + r * 0.2, r * 0.75).fillCircle(cx + r * 0.55, cy + r * 0.2, r * 0.75).fillCircle(cx, cy + r * 0.35, r * 0.8);
  g.fillStyle(mid).fillCircle(cx, cy - r * 0.15, r * 0.85).fillCircle(cx - r * 0.45, cy - r * 0.05, r * 0.55).fillCircle(cx + r * 0.45, cy, r * 0.6);
  g.fillStyle(light, 0.9).fillCircle(cx - r * 0.25, cy - r * 0.45, r * 0.35).fillCircle(cx + r * 0.2, cy - r * 0.2, r * 0.25);
};
const rockShape = (g, w, h, base, light, dark) => {
  g.fillStyle(dark).fillEllipse(w / 2, h * 0.62, w * 0.96, h * 0.7);
  g.fillStyle(base).fillEllipse(w / 2, h * 0.52, w * 0.9, h * 0.66);
  g.fillStyle(light, 0.8).fillEllipse(w * 0.42, h * 0.38, w * 0.45, h * 0.25);
};

const DRAW = {
  player(g, w, h) {
    shadow(g, w, h, 22, 8);
    g.fillStyle(0x2d3e5c).fillRoundedRect(9, 29, 5, 10, 2).fillRoundedRect(16, 29, 5, 10, 2);
    g.fillStyle(0x3b2a1a).fillRect(8, 37, 7, 3).fillRect(15, 37, 7, 3);
    g.fillStyle(0x7a5230).fillRoundedRect(4, 16, 7, 13, 3);
    g.fillStyle(0xe2763a).fillRoundedRect(8, 16, 15, 15, 4);
    g.fillStyle(0xc75f2a).fillRect(8, 26, 15, 3);
    g.fillStyle(0xf1c27d).fillCircle(16, 10, 8);
    g.fillStyle(0x4a2f17).fillEllipse(15, 5, 17, 8).fillRect(8, 5, 4, 7);
    g.fillStyle(0x1b1b1b).fillCircle(19.5, 10.5, 1.4);
    g.fillStyle(0xe8a86a).fillCircle(22, 13, 1.5);
  },
  tree(g, w, h) {
    shadow(g, w, h, 46, 12);
    g.fillStyle(0x5b3a1f).fillRoundedRect(w / 2 - 6, h - 40, 12, 36, 3);
    g.fillStyle(0x6e4a2a).fillRect(w / 2 - 2, h - 38, 3, 30);
    canopy(g, w / 2, 34, 28, 0x1f5a3c, 0x2f7d4a, 0x58a862);
  },
  palm(g, w, h) {
    shadow(g, w, h, 34, 10);
    for (let i = 0; i < 9; i++) {
      const t = i / 8;
      g.fillStyle(i % 2 ? 0x8c6a3f : 0x9e7a4a).fillEllipse(w / 2 + Math.sin(t * 2.2) * 8 - 4, h - 8 - t * 66, 11 - t * 3, 10);
    }
    const tx = w / 2 + Math.sin(2.2) * 8 - 4;
    const ty = 26;
    const fronds = [[-32, 6], [-26, -12], [-8, -22], [12, -22], [28, -10], [33, 8], [0, 14]];
    for (const [dx, dy] of fronds) {
      poly(g, 0x3d8a3a, [[tx, ty], [tx + dx * 0.5 - dy * 0.15, ty + dy * 0.5 - 4], [tx + dx, ty + dy], [tx + dx * 0.5 + dy * 0.15, ty + dy * 0.5 + 4]]);
      g.lineStyle(1.5, 0x2a6a2a).lineBetween(tx, ty, tx + dx, ty + dy);
    }
    g.fillStyle(0x6b4423).fillCircle(tx - 4, ty + 5, 4).fillCircle(tx + 4, ty + 6, 4).fillCircle(tx, ty + 9, 4);
  },
  bush(g, w, h) {
    shadow(g, w, h, 40, 8);
    g.fillStyle(0x2f6f3c).fillCircle(12, 18, 10).fillCircle(32, 18, 10).fillCircle(22, 14, 12);
    g.fillStyle(0x4f9a52).fillCircle(18, 11, 6).fillCircle(29, 12, 5);
    g.fillStyle(0xf7e07a).fillCircle(14, 15, 1.6).fillCircle(30, 20, 1.6).fillCircle(23, 8, 1.6);
  },
  rock(g, w, h) {
    shadow(g, w, h, w, 8);
    rockShape(g, w, h, 0x8f9aa3, 0xc2cbd1, 0x5c666e);
  },
  wreck(g, w, h) {
    shadow(g, w, h, w, 14);
    poly(g, 0x5a3a1c, [[6, 22], [w - 8, 14], [w - 22, h - 8], [18, h - 6]]);
    poly(g, 0x7d5430, [[10, 22], [w - 12, 15], [w - 24, h - 16], [20, h - 14]]);
    g.lineStyle(2, 0x4a2f12);
    for (let i = 1; i < 4; i++) g.lineBetween(12 + i * 2, 22 + i * 8, w - 14 - i * 3, 15 + i * 8);
    g.fillStyle(0x2a1c0e).fillRect(54, 28, 18, 10);
    g.lineStyle(4, 0x6b4a2a).lineBetween(46, 24, 30, 2);
    poly(g, 0xe8dcc0, [[31, 4], [56, 12], [36, 20]], 0.9);
  },
  driftwood(g, w, h) {
    g.fillStyle(0x000000, 0.18).fillEllipse(w / 2, h - 4, w - 6, 6);
    g.fillStyle(0x9c7448).fillRoundedRect(3, 4, w - 6, h - 9, 6);
    g.fillStyle(0xc8a372).fillRoundedRect(8, 6, w - 20, 3, 2);
    g.fillStyle(0x6b4a22).fillCircle(24, 10, 2).fillCircle(48, 9, 1.6);
  },
  sign(g, w, h) {
    shadow(g, w, h, 20, 6);
    g.fillStyle(0x6b4a22).fillRect(w / 2 - 3, 16, 6, h - 20);
    g.fillStyle(0xd9b27c).fillRoundedRect(2, 6, w - 4, 18, 3);
    g.lineStyle(2, 0x8a6534).strokeRoundedRect(2, 6, w - 4, 18, 3);
    g.lineStyle(2, 0x5a3b1f).lineBetween(8, 12, w - 8, 12).lineBetween(8, 18, w - 12, 18);
  },
  cache(g, w, h) {
    shadow(g, w, h, w, 8);
    g.fillStyle(0x6e4527).fillRoundedRect(3, 12, w - 6, h - 16, 4);
    g.fillStyle(0x8c5a33).fillRoundedRect(2, 6, w - 4, 12, 4);
    g.fillStyle(0x9aa3ab).fillRect(10, 6, 5, h - 10).fillRect(w - 15, 6, 5, h - 10);
    g.fillStyle(0xe8b94a).fillRoundedRect(w / 2 - 5, 14, 10, 9, 2);
  },
  bottle(g, w, h) {
    g.fillStyle(0x000000, 0.18).fillEllipse(w / 2, h - 3, 18, 5);
    g.fillStyle(0x6fb59b, 0.85).fillRoundedRect(4, 12, w - 8, h - 16, 5);
    g.fillStyle(0x6fb59b, 0.85).fillRect(w / 2 - 3, 4, 6, 10);
    g.fillStyle(0x9b6b3a).fillRect(w / 2 - 3, 1, 6, 5);
    g.fillStyle(0xf2e6c9).fillRoundedRect(w / 2 - 3, 16, 6, 12, 2);
    g.fillStyle(0xffffff, 0.5).fillRect(6, 14, 2, h - 22);
  },
  tidepool(g, w, h) {
    g.fillStyle(0x7d858c).fillEllipse(w / 2, h / 2 + 2, w, h - 4);
    g.fillStyle(0x3e93a8).fillEllipse(w / 2, h / 2 + 1, w - 12, h - 14);
    g.fillStyle(0x8fd6e3, 0.6).fillEllipse(w / 2 - 6, h / 2 - 3, w - 34, 5);
    g.fillStyle(0xf0c5b0).fillCircle(20, h / 2 + 3, 2.5).fillCircle(38, h / 2 + 5, 2);
  },
  camp(g, w, h) {
    shadow(g, w, h, w, 10);
    poly(g, 0x8f8a5e, [[4, h - 10], [30, 6], [56, h - 10]]);
    poly(g, 0xa9a274, [[30, 6], [56, h - 10], [44, h - 10]]);
    poly(g, 0x3a3424, [[24, h - 10], [30, 22], [36, h - 10]]);
    g.fillStyle(0x6f6f6f).fillCircle(62, h - 12, 3).fillCircle(70, h - 9, 3).fillCircle(64, h - 5, 3);
    g.lineStyle(3, 0x5a3b1f).lineBetween(60, h - 8, 72, h - 12);
  },
  marker(g, w, h) {
    shadow(g, w, h, w - 4, 8);
    const stones = [[w / 2, h - 10, 30, 14, 0x8c8478], [w / 2 + 1, h - 20, 24, 12, 0x9e968a], [w / 2 - 1, h - 29, 18, 10, 0xb0a89b], [w / 2, h - 37, 12, 8, 0xc3bcb0]];
    for (const [x, y, sw, sh, c] of stones) g.fillStyle(c).fillEllipse(x, y, sw, sh);
  },
  tracks(g, w, h) {
    g.fillStyle(0x6b5536, 0.55);
    const prints = [[8, 26], [16, 22], [20, 16], [28, 12], [32, 6], [40, 3]];
    prints.forEach(([x, y], i) => g.fillEllipse(x + (i % 2) * 3, y + 4, 5, 8));
  },
  branch(g, w, h) {
    g.fillStyle(0x000000, 0.15).fillEllipse(w / 2, h - 4, w - 6, 6);
    g.lineStyle(5, 0x6b4a2a).lineBetween(4, h - 8, w - 8, 8);
    g.lineStyle(3, 0x6b4a2a).lineBetween(26, 15, 36, h - 5);
    g.fillStyle(0xe8cfa0).fillCircle(w - 8, 8, 3);
    g.fillStyle(0x4f9a52).fillEllipse(14, h - 14, 10, 6).fillEllipse(36, 9, 9, 5);
  },
  carved_stone(g, w, h) {
    shadow(g, w, h, w, 8);
    rockShape(g, w, h, 0x8a8f85, 0xb5bab0, 0x5b6058);
    g.lineStyle(2, 0x3f433b);
    g.beginPath().moveTo(10, 18).lineTo(18, 14).lineTo(24, 20).lineTo(32, 13).lineTo(38, 17).strokePath();
    g.lineBetween(14, 25, 20, 25).lineBetween(24, 25, 30, 25);
  },
  reeds(g, w, h) {
    for (let i = 0; i < 9; i++) {
      const x = 6 + i * 4;
      g.lineStyle(2, i % 2 ? 0x5c8f3a : 0x76a84a).lineBetween(x, h - 2, x + 6, 8 + (i % 3) * 5);
      if (i % 2 === 0) g.fillStyle(0x7a5230).fillRoundedRect(x + 4, 6 + (i % 3) * 5, 4, 10, 2);
    }
  },
  jungle_tree(g, w, h) {
    shadow(g, w, h, 60, 14);
    g.fillStyle(0x4a3220).fillRoundedRect(w / 2 - 8, h - 50, 16, 46, 4);
    g.fillStyle(0x3a2616).fillRect(w / 2 - 14, h - 10, 8, 6).fillRect(w / 2 + 6, h - 10, 8, 6);
    canopy(g, w / 2, 40, 36, 0x0f3a24, 0x1d5a35, 0x2f7d45);
    g.lineStyle(2, 0x2f6a2a);
    for (const x of [22, 40, 62, 72]) g.lineBetween(x, 50, x + 2, 50 + 18 + (x % 3) * 6);
  },
  banana_tree(g, w, h) {
    shadow(g, w, h, 38, 10);
    g.fillStyle(0x7d8a45).fillRoundedRect(w / 2 - 5, 34, 10, h - 38, 4);
    for (const [dx, dy] of [[-30, 10], [-24, -14], [0, -26], [24, -14], [30, 10]]) {
      poly(g, 0x5aa040, [[w / 2, 34], [w / 2 + dx * 0.5 - 6, 34 + dy * 0.5], [w / 2 + dx, 34 + dy], [w / 2 + dx * 0.5 + 6, 34 + dy * 0.5 + 6]]);
    }
    g.fillStyle(0xe9cf4f).fillEllipse(w / 2 + 8, 46, 8, 14).fillEllipse(w / 2 + 13, 48, 7, 13);
  },
  monkey(g, w, h) {
    g.fillStyle(0x000000, 0.18).fillEllipse(w / 2, h - 3, 20, 5);
    g.lineStyle(3, 0x6b4423).beginPath().arc(24, 18, 7, -1.2, 1.6).strokePath();
    g.fillStyle(0x7a4f2c).fillEllipse(w / 2, 19, 18, 18);
    g.fillStyle(0x7a4f2c).fillCircle(w / 2, 9, 8).fillCircle(w / 2 - 8, 8, 3.5).fillCircle(w / 2 + 8, 8, 3.5);
    g.fillStyle(0xd9b48a).fillEllipse(w / 2, 11, 10, 8).fillEllipse(w / 2, 21, 9, 9);
    g.fillStyle(0x1b1b1b).fillCircle(w / 2 - 2.5, 9, 1.2).fillCircle(w / 2 + 2.5, 9, 1.2);
  },
  vines(g, w, h) {
    g.fillStyle(0x4a3220).fillRoundedRect(0, 0, w, 7, 3);
    for (let i = 0; i < 5; i++) {
      const x = 5 + i * 8;
      const len = h - 10 - (i % 3) * 12;
      g.lineStyle(2.5, 0x3f7a30).lineBetween(x, 5, x + (i % 2 ? 2 : -2), len);
      for (let y = 14; y < len; y += 12) g.fillStyle(0x5aa040).fillEllipse(x + (y % 24 ? 3 : -3), y, 6, 4);
    }
  },
  bamboo(g, w, h) {
    shadow(g, w, h, 40, 8);
    [[8, 10], [18, 0], [28, 6], [38, 14]].forEach(([x, top], i) => {
      g.fillStyle(i % 2 ? 0x9db04f : 0x8aa041).fillRoundedRect(x, top, 7, h - top - 4, 3);
      g.lineStyle(1.5, 0x5f7330);
      for (let y = top + 12; y < h - 6; y += 14) g.lineBetween(x, y, x + 7, y);
    });
    g.fillStyle(0x6fa040).fillEllipse(14, 10, 14, 4).fillEllipse(34, 18, 14, 4).fillEllipse(24, 4, 12, 4);
  },
  note_post(g, w, h) {
    shadow(g, w, h, 18, 6);
    g.fillStyle(0x5a3b1f).fillRect(w / 2 - 3, 8, 6, h - 12);
    g.fillStyle(0xf2ead2).fillRect(5, 12, w - 10, 16);
    g.lineStyle(1, 0x8a8a8a).lineBetween(8, 17, w - 8, 17).lineBetween(8, 21, w - 10, 21).lineBetween(8, 25, w - 12, 25);
    g.fillStyle(0xb5462f).fillCircle(w / 2, 13, 1.6);
  },
  mural(g, w, h) {
    shadow(g, w, h, w, 10);
    g.fillStyle(0x8f8770).fillRoundedRect(2, 2, w - 4, h - 8, 4);
    g.fillStyle(0xb8ad8e).fillRoundedRect(7, 7, w - 14, h - 20, 3);
    g.fillStyle(0xd9a441).fillCircle(24, 22, 8);
    g.lineStyle(2, 0x3f6f8f).beginPath().moveTo(36, 36).lineTo(44, 30).lineTo(52, 36).lineTo(60, 30).strokePath();
    g.fillStyle(0x5a8a3a).fillEllipse(54, 18, 10, 6);
    g.fillStyle(0xe8e0c6).fillCircle(64, 14, 4);
    g.fillStyle(0x6b6452).fillRect(2, h - 10, w - 4, 4);
  },
  shrine(g, w, h) {
    shadow(g, w, h, w, 10);
    g.fillStyle(0x7a7466).fillRect(2, h - 18, w - 4, 12);
    g.fillStyle(0x938c7c).fillRect(8, h - 30, w - 16, 14);
    g.fillStyle(0xaba493).fillRect(14, h - 40, w - 28, 12);
    g.fillStyle(0x5d574b).fillEllipse(w / 2, h - 40, 14, 6);
  },
  tablet(g, w, h) {
    shadow(g, w, h, w, 8);
    g.fillStyle(0x7f7a6c).fillRoundedRect(6, 2, w - 12, h - 8, { tl: 14, tr: 14, bl: 2, br: 2 });
    g.fillStyle(0xe6dcc0).fillCircle(w / 2 - 9, 18, 3).fillCircle(w / 2, 18, 3).fillCircle(w / 2 + 9, 18, 3);
    g.lineStyle(1, 0x5d574b).lineBetween(12, 27, w - 12, 27);
  },
  relic_chest(g, w, h) {
    shadow(g, w, h, w, 8);
    g.fillStyle(0x6f6a5c).fillRoundedRect(3, 10, w - 6, h - 14, 3);
    g.fillStyle(0x8c8676).fillRoundedRect(2, 4, w - 4, 12, 3);
    g.lineStyle(2, 0xd4a83a).strokeRoundedRect(3, 5, w - 6, h - 9, 3);
    g.fillStyle(0xd4a83a).fillCircle(w / 2, 20, 5);
    g.fillStyle(0x3d3a33).fillCircle(w / 2, 20, 2);
  },
  pillar(g, w, h) {
    shadow(g, w, h, w, 8);
    g.fillStyle(0xa39b85).fillRect(6, 10, w - 12, h - 18);
    g.fillStyle(0x8a826e).fillRect(9, 10, 3, h - 18).fillRect(w - 13, 10, 3, h - 18);
    g.fillStyle(0xb8b09a).fillRect(2, 4, w - 4, 8).fillRect(2, h - 12, w - 4, 8);
    g.lineStyle(1.5, 0x5d574b).lineBetween(14, 30, 20, 40).lineBetween(20, 40, 16, 52);
    g.fillStyle(0x5a8a3a, 0.8).fillEllipse(10, h - 16, 10, 5);
  },
  statue(g, w, h) {
    shadow(g, w, h, w, 8);
    g.fillStyle(0x7f7a6c).fillRect(4, h - 16, w - 8, 12);
    g.fillStyle(0x9a9482).fillRoundedRect(10, 22, w - 20, h - 38, 6);
    g.fillStyle(0xa8a28f).fillCircle(w / 2, 14, 10);
    g.fillStyle(0x4a463c).fillRect(w / 2 - 5, 12, 3, 2).fillRect(w / 2 + 2, 12, 3, 2);
    g.fillStyle(0x5a8a3a, 0.7).fillEllipse(w / 2 + 6, 40, 8, 12);
  },
  glyph_panel(g, w, h) {
    g.fillStyle(0x6e685a).fillRoundedRect(2, 2, w - 4, h - 4, 4);
    g.fillStyle(0x8f887a).fillRoundedRect(5, 5, w - 10, h - 10, 3);
    const colors = [0xf0b84a, 0x5aa9d6, 0x6fbf5a, 0xd9d6f0];
    colors.forEach((c, i) => g.fillStyle(c).fillCircle(i % 2 ? w - 13 : 13, 16 + Math.floor(i / 2) * 20, 6));
  },
  cracked_wall(g, w, h) {
    g.lineStyle(2, 0x3a3630);
    g.beginPath().moveTo(20, 2).lineTo(14, 18).lineTo(24, 30).lineTo(16, 46).lineTo(22, 68).strokePath();
    g.lineBetween(14, 18, 4, 24).lineBetween(24, 30, 36, 34).lineBetween(16, 46, 6, 52);
    g.fillStyle(0x3a3630, 0.6).fillRect(26, 14, 8, 4).fillRect(8, 36, 7, 4).fillRect(24, 56, 9, 4);
  },
  hollow_log(g, w, h) {
    shadow(g, w, h, w, 8);
    g.fillStyle(0x5f3f22).fillRoundedRect(4, 4, w - 14, h - 10, 8);
    g.fillStyle(0x8a6239).fillEllipse(w - 12, h / 2 - 1, 16, h - 8);
    g.fillStyle(0x221509).fillEllipse(w - 12, h / 2 - 1, 9, h - 15);
    g.fillStyle(0x4f9a52).fillEllipse(18, 6, 12, 5);
  },
  birds(g, w, h) {
    g.lineStyle(2, 0x2d2d2d);
    for (const [x, y] of [[8, 8], [22, 4], [34, 12], [16, 20]]) g.beginPath().moveTo(x - 5, y - 2).lineTo(x, y + 2).lineTo(x + 5, y - 2).strokePath();
    g.fillStyle(0x8a6239).fillEllipse(w - 10, h - 6, 16, 7);
  },
  mist(g, w, h) {
    for (let i = 0; i < 6; i++) g.fillStyle(0xffffff, 0.16).fillEllipse(w / 2 + (i % 2 ? 6 : -6), 8 + i * 9, 26, 16);
  },
  backpack(g, w, h) {
    shadow(g, w, h, w, 6);
    g.fillStyle(0x56603a).fillRoundedRect(4, 4, w - 8, h - 8, 6);
    g.fillStyle(0x6c7748).fillRoundedRect(8, 12, w - 16, 10, 3);
    g.lineStyle(2, 0x3a4126).lineBetween(10, 4, 10, h - 6).lineBetween(w - 10, 4, w - 10, h - 6);
  },
  hut(g, w, h) {
    shadow(g, w, h, w, 12);
    g.fillStyle(0x8a6a48).fillRect(10, 36, w - 20, h - 42);
    g.lineStyle(1.5, 0x6b4f33);
    for (let y = 44; y < h - 6; y += 9) g.lineBetween(10, y, w - 10, y);
    poly(g, 0x8f3d2e, [[2, 40], [w / 2, 2], [w - 2, 40]]);
    poly(g, 0xa84b38, [[w / 2, 2], [w - 2, 40], [w / 2 + 8, 40]]);
    g.fillStyle(0x3d2a1a).fillRect(w / 2 - 10, h - 34, 20, 28);
    g.fillStyle(0xf3d68a).fillRect(22, 50, 16, 12).fillRect(w - 38, 50, 16, 12);
  },
  book(g, w, h) {
    g.fillStyle(0x000000, 0.18).fillEllipse(w / 2, h - 3, w - 4, 5);
    g.fillStyle(0x7a3b2e).fillRect(2, 6, w - 4, 12);
    g.fillStyle(0xf2ead2).fillRect(4, 4, w / 2 - 5, 12).fillRect(w / 2 + 1, 4, w / 2 - 5, 12);
    g.lineStyle(1, 0x9a9a9a).lineBetween(6, 8, w / 2 - 3, 8).lineBetween(w / 2 + 3, 8, w - 6, 8).lineBetween(6, 12, w / 2 - 3, 12);
  },
  board(g, w, h) {
    shadow(g, w, h, 26, 6);
    g.fillStyle(0x5a3b1f).fillRect(6, 20, 4, h - 22).fillRect(w - 10, 20, 4, h - 22);
    g.fillStyle(0x8a6239).fillRect(2, 2, w - 4, 24);
    g.fillStyle(0xf2ead2).fillRect(6, 5, w - 12, 18);
    g.lineStyle(1, 0x3f6f8f);
    g.beginPath().moveTo(8, 18).lineTo(14, 10).lineTo(20, 16).lineTo(26, 8).strokePath();
    g.lineStyle(1, 0xc0392b).lineBetween(8, 20, w - 8, 12);
  },
  barrel(g, w, h) {
    shadow(g, w, h, w, 6);
    g.fillStyle(0x7a4f2c).fillRoundedRect(3, 3, w - 6, h - 7, 6);
    g.fillStyle(0x9a6a3c).fillRect(7, 3, 4, h - 7);
    g.fillStyle(0x4c545a).fillRect(3, 9, w - 6, 3).fillRect(3, h - 14, w - 6, 3);
  },
  crate(g, w, h) {
    shadow(g, w, h, w, 6);
    g.fillStyle(0xa77a49).fillRect(2, 2, w - 4, h - 6);
    g.lineStyle(3, 0x7a5530).strokeRect(3, 3, w - 6, h - 8).lineBetween(4, 4, w - 4, h - 6).lineBetween(w - 4, 4, 4, h - 6);
  },
  weather_station(g, w, h) {
    shadow(g, w, h, 30, 8);
    g.lineStyle(4, 0x6d7378).lineBetween(w / 2, h - 6, w / 2 + 6, 14);
    g.lineStyle(2, 0x6d7378).lineBetween(w / 2 - 12, 14, w / 2 + 22, 12);
    g.fillStyle(0x9aa3ab).fillCircle(w / 2 - 12, 14, 4).fillCircle(w / 2 + 22, 12, 4);
    g.fillStyle(0xd8dde0).fillRect(w / 2 - 12, 40, 18, 16);
    g.lineStyle(2, 0xc7773a).beginPath().moveTo(w / 2 - 4, 56).lineTo(w / 2 - 14, 66).lineTo(w / 2 - 6, h - 8).strokePath();
  },
  woodpile(g, w, h) {
    shadow(g, w, h, w, 8);
    const logs = [[12, 20], [26, 20], [40, 20], [19, 10], [33, 10]];
    for (const [x, y] of logs) {
      g.fillStyle(0x7a5230).fillCircle(x, y, 7);
      g.fillStyle(0xd9b07a).fillCircle(x, y, 4.5);
      g.lineStyle(1, 0x9a6a3c).strokeCircle(x, y, 2.5);
    }
  },
  grass_patch(g, w, h) {
    for (let i = 0; i < 16; i++) {
      const x = 4 + i * 3;
      g.lineStyle(2, i % 2 ? 0xd6c27a : 0xc4a85a).lineBetween(x, h - 2, x + (i % 3) - 1, 6 + (i % 4) * 4);
    }
  },
  flint(g, w, h) {
    g.fillStyle(0x000000, 0.2).fillEllipse(w / 2, h - 3, w - 4, 5);
    g.fillStyle(0x45474b).fillEllipse(11, 13, 16, 12).fillEllipse(23, 15, 14, 10);
    g.fillStyle(0x6d6f73).fillEllipse(10, 10, 6, 3).fillEllipse(22, 12, 5, 3);
    g.fillStyle(0xfff2a8).fillCircle(17, 7, 1.5);
  },
  grave(g, w, h) {
    shadow(g, w, h, 24, 6);
    g.fillStyle(0x8c8f93).fillRoundedRect(5, 4, w - 10, h - 10, { tl: 10, tr: 10, bl: 1, br: 1 });
    g.lineStyle(2, 0x5c5f63).lineBetween(w / 2, 10, w / 2, 24).lineBetween(w / 2 - 6, 15, w / 2 + 6, 15);
    g.fillStyle(0xd96b6b).fillCircle(w / 2 - 6, h - 6, 2).fillCircle(w / 2 + 4, h - 7, 2);
  },
  lighthouse(g, w, h) {
    shadow(g, w, h, 86, 18);
    g.fillStyle(0x7a7468).fillRect(8, h - 30, w - 16, 26);
    poly(g, 0xf2efe8, [[22, h - 30], [32, 44], [w - 32, 44], [w - 22, h - 30]]);
    for (let i = 0; i < 4; i++) {
      const y1 = 60 + i * 30;
      const y2 = y1 + 14;
      const inset = (y) => 32 - ((y - 44) / (h - 74)) * 10;
      poly(g, 0xc0392b, [[inset(y2), y2], [inset(y1), y1], [w - inset(y1), y1], [w - inset(y2), y2]]);
    }
    g.fillStyle(0x2d3436).fillRect(26, 30, w - 52, 16);
    g.fillStyle(0xfff1a8).fillRect(30, 32, w - 60, 12);
    poly(g, 0xc0392b, [[22, 32], [w / 2, 6], [w - 22, 32]]);
    g.fillStyle(0x2d3436).fillRect(20, 44, w - 40, 4);
    g.fillStyle(0x3d2a1a).fillRect(w / 2 - 8, h - 50, 16, 22);
  },
  radio(g, w, h) {
    shadow(g, w, h, w, 6);
    g.fillStyle(0x6b4a2a).fillRect(4, 20, w - 8, 4).fillRect(6, 24, 3, h - 26).fillRect(w - 9, 24, 3, h - 26);
    g.fillStyle(0x4c545a).fillRoundedRect(6, 6, w - 12, 15, 2);
    g.fillStyle(0xd8dde0).fillCircle(14, 13, 4);
    g.fillStyle(0xe8b94a).fillRect(22, 10, 10, 6);
    g.lineStyle(1.5, 0x2d3436).lineBetween(w - 10, 6, w - 4, 0);
  },
  lamp_console(g, w, h) {
    shadow(g, w, h, w, 6);
    g.fillStyle(0x4c545a).fillRoundedRect(6, 14, w - 12, h - 18, 3);
    g.fillStyle(0xfff1a8, 0.9).fillCircle(w / 2, 12, 9);
    g.lineStyle(2, 0x2d3436).strokeCircle(w / 2, 12, 9);
    g.fillStyle(0xc0392b).fillRect(w / 2 - 2, 24, 4, 10);
  },
  firepit(g, w, h) {
    shadow(g, w, h, w, 10);
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2;
      g.fillStyle(i % 2 ? 0x7d858c : 0x9aa3ab).fillEllipse(w / 2 + Math.cos(a) * 22, h / 2 + 4 + Math.sin(a) * 11, 12, 8);
    }
    g.lineStyle(4, 0x5a3b1f).lineBetween(w / 2 - 12, h / 2 + 8, w / 2 + 10, h / 2 - 2).lineBetween(w / 2 - 10, h / 2 - 2, w / 2 + 12, h / 2 + 8);
  },
  telescope(g, w, h) {
    shadow(g, w, h, 20, 6);
    g.lineStyle(2, 0x5a3b1f).lineBetween(w / 2, 22, 6, h - 4).lineBetween(w / 2, 22, w - 6, h - 4).lineBetween(w / 2, 22, w / 2, h - 2);
    g.lineStyle(6, 0xb08a3e).lineBetween(4, 26, w - 4, 10);
    g.fillStyle(0x2d3436).fillCircle(w - 4, 10, 3);
  },
  planks(g, w, h) {
    g.fillStyle(0x000000, 0.18).fillEllipse(w / 2, h - 3, w - 4, 6);
    g.fillStyle(0x8a6239).fillRect(4, 4, w - 8, 8);
    g.fillStyle(0xa7764a).fillRect(8, 12, w - 12, 8);
    g.fillStyle(0x4c545a).fillCircle(10, 8, 1.5).fillCircle(w - 10, 16, 1.5);
  },
  boat_frame(g, w, h) {
    shadow(g, w, h, w, 10);
    g.lineStyle(4, 0x6b4a2a).beginPath().arc(w / 2, -10, w / 2 - 4, 0.35, Math.PI - 0.35).strokePath();
    g.lineStyle(3, 0x7a5230);
    for (let i = 1; i < 6; i++) {
      const x = 10 + i * ((w - 20) / 6);
      g.lineBetween(x, 10, x, h - 10 - Math.abs(x - w / 2) * 0.25);
    }
    g.lineStyle(3, 0x5a3b1f).lineBetween(8, 10, w - 8, 10);
  },

  // ---------- dekorasi ----------
  tuft(g, w, h) {
    g.lineStyle(1.5, 0x3f7f3f).lineBetween(3, h, 1, 2).lineBetween(7, h, 8, 0).lineBetween(11, h, 14, 3);
  },
  flower(g, w, h) {
    g.fillStyle(0xffffff).fillCircle(4, 7, 3).fillCircle(10, 7, 3).fillCircle(7, 4, 3).fillCircle(7, 10, 3);
    g.fillStyle(0xf6c445).fillCircle(7, 7, 2);
  },
  pebble(g, w, h) {
    g.fillStyle(0x7d858c).fillEllipse(w / 2, h / 2 + 1, w - 2, h - 2);
    g.fillStyle(0xb0b8bf).fillEllipse(w / 2 - 1, h / 2 - 1, w - 6, h - 5);
  },
  fern(g, w, h) {
    for (const [dx, dy] of [[-12, -6], [-6, -14], [2, -16], [10, -12], [13, -4]]) {
      g.lineStyle(2, 0x2f7a3a).lineBetween(w / 2, h - 2, w / 2 + dx, h - 2 + dy);
      g.fillStyle(0x3f9a4a).fillEllipse(w / 2 + dx * 0.7, h - 2 + dy * 0.7, 6, 3);
    }
  },
  mushroom(g, w, h) {
    g.fillStyle(0xf2ead2).fillRect(5, 7, 4, 6);
    g.fillStyle(0xd0453a).fillEllipse(7, 6, 13, 8);
    g.fillStyle(0xffffff).fillCircle(4, 5, 1.2).fillCircle(9, 4, 1.2);
  },
  starfish(g, w, h) {
    const pts = [];
    for (let i = 0; i < 10; i++) {
      const r = i % 2 ? 2.6 : 6.5;
      const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
      pts.push([7 + Math.cos(a) * r, 7 + Math.sin(a) * r]);
    }
    poly(g, 0xe8834a, pts);
  },

  // ---------- makhluk ----------
  crab(g, w, h) {
    g.lineStyle(1.5, 0xa8322a).lineBetween(3, 9, 0, 13).lineBetween(17, 9, 20, 13).lineBetween(5, 10, 3, 14).lineBetween(15, 10, 17, 14);
    g.fillStyle(0xd9473a).fillEllipse(10, 8, 13, 9);
    g.fillStyle(0xd9473a).fillCircle(2.5, 4, 2.5).fillCircle(17.5, 4, 2.5);
    g.fillStyle(0x1b1b1b).fillCircle(8, 5, 1).fillCircle(12, 5, 1);
  },
  fish(g, w, h) {
    g.fillStyle(0xbfd9e8, 0.9).fillEllipse(8, h / 2, 14, 7);
    poly(g, 0x9fc1d6, [[14, h / 2], [18, 1], [18, h - 1]]);
    g.fillStyle(0x1b1b1b).fillCircle(4, h / 2 - 1, 0.9);
  },
  bird(g, w, h) {
    g.lineStyle(2.5, 0xf5f5f5).beginPath().moveTo(1, 3).lineTo(7, 7).lineTo(11, 5).lineTo(15, 7).lineTo(21, 3).strokePath();
    g.fillStyle(0xf5f5f5).fillEllipse(11, 7, 6, 4);
    g.fillStyle(0xf0a830).fillRect(13, 7, 2, 1);
  },
  ship(g, w, h) {
    poly(g, 0x2c3e50, [[6, 70], [w - 6, 70], [w - 26, h - 8], [26, h - 8]]);
    g.fillStyle(0xecf0f1).fillRect(10, 66, w - 20, 6);
    g.fillStyle(0xc0392b).fillRect(20, h - 22, w - 40, 5);
    g.fillStyle(0xecf0f1).fillRect(w / 2 + 4, 42, 50, 26);
    g.fillStyle(0x2c3e50).fillRect(w / 2 + 10, 48, 8, 8).fillRect(w / 2 + 24, 48, 8, 8).fillRect(w / 2 + 38, 48, 8, 8);
    g.lineStyle(4, 0x6b4a2a).lineBetween(60, 68, 60, 6);
    poly(g, 0xf5ecd7, [[62, 10], [62, 60], [104, 58]]);
    poly(g, 0xc0392b, [[60, 6], [76, 10], [60, 14]]);
  }
};

// ---------- tile 64×64 ----------
function speckle(g, rand, base, colors, count, size = [1, 3]) {
  g.fillStyle(base).fillRect(0, 0, 64, 64);
  for (let i = 0; i < count; i++) {
    const [c, a] = colors[Math.floor(rand() * colors.length)];
    g.fillStyle(c, a).fillCircle(rand() * 64, rand() * 64, size[0] + rand() * (size[1] - size[0]));
  }
}

const TILES = {
  sand: (g, r) => speckle(g, r, 0xeed6a2, [[0xf7e6bd, 0.8], [0xd9bd85, 0.7], [0xc9a86f, 0.5]], 70, [0.6, 1.8]),
  grass: (g, r) => {
    speckle(g, r, 0x5a9f5c, [[0x6db56c, 0.8], [0x4a8a4e, 0.8]], 60, [1, 3]);
    g.lineStyle(1, 0x3f7f45, 0.8);
    for (let i = 0; i < 26; i++) { const x = r() * 64; const y = r() * 64; g.lineBetween(x, y, x + 1, y - 4); }
  },
  grass_dark: (g, r) => {
    speckle(g, r, 0x3f7d50, [[0x4d9160, 0.8], [0x2f6a42, 0.8]], 60, [1, 3]);
    g.lineStyle(1, 0x2a5f3a, 0.8);
    for (let i = 0; i < 26; i++) { const x = r() * 64; const y = r() * 64; g.lineBetween(x, y, x - 1, y - 4); }
  },
  grass_dry: (g, r) => {
    speckle(g, r, 0x9aa35d, [[0xb3b46e, 0.8], [0x828a4c, 0.8], [0xc4b07a, 0.6]], 70, [1, 3]);
    g.lineStyle(1, 0x7a7f45, 0.8);
    for (let i = 0; i < 22; i++) { const x = r() * 64; const y = r() * 64; g.lineBetween(x, y, x + 2, y - 4); }
  },
  mud: (g, r) => speckle(g, r, 0x8f7550, [[0x7a6243, 0.8], [0xa88b60, 0.6]], 50, [1, 4]),
  path: (g, r) => speckle(g, r, 0xc9a46b, [[0xb48f59, 0.8], [0xdbbb85, 0.7], [0x9c9c94, 0.6]], 60, [0.8, 2.6]),
  jungle: (g, r) => speckle(g, r, 0x2e5a36, [[0x3a6b40, 0.9], [0x23462a, 0.9], [0x5a4a2a, 0.6], [0x4f7a3a, 0.6]], 90, [1, 4]),
  stone_floor: (g, r) => {
    speckle(g, r, 0x8f8a78, [[0x9e9986, 0.7], [0x7d786a, 0.7]], 40, [1, 3]);
    g.lineStyle(2, 0x6d6858, 0.9).strokeRect(0, 0, 64, 64).lineBetween(32, 0, 32, 32).lineBetween(0, 32, 64, 32).lineBetween(16, 32, 16, 64).lineBetween(48, 32, 48, 64);
    g.fillStyle(0x5a8a3a, 0.5).fillEllipse(r() * 64, r() * 64, 10, 4);
  },
  rock_ground: (g, r) => speckle(g, r, 0x7d7468, [[0x8f877a, 0.8], [0x665e54, 0.8], [0xa39a8a, 0.5]], 80, [1, 4]),
  sea: (g, r) => {
    g.fillStyle(0x1d6aa3).fillRect(0, 0, 64, 64);
    g.fillStyle(0x2479b5, 0.8).fillRect(0, 0, 64, 32);
    g.lineStyle(2, 0x6fb4e0, 0.55);
    for (let i = 0; i < 5; i++) { const x = r() * 64; const y = r() * 64; g.beginPath().arc(x, y, 6, Math.PI * 1.15, Math.PI * 1.85).strokePath(); }
  },
  river: (g, r) => {
    g.fillStyle(0x2f86bf).fillRect(0, 0, 64, 64);
    g.lineStyle(2, 0x9ad3f0, 0.5);
    for (let i = 0; i < 9; i++) { const x = r() * 64; const y = r() * 64; g.lineBetween(x, y, x + (r() - 0.5) * 3, y + 10 + r() * 10); }
  },
  pool: (g, r) => {
    g.fillStyle(0x2f9aa8).fillRect(0, 0, 64, 64);
    g.lineStyle(1.5, 0xa8e6ee, 0.5);
    for (let i = 0; i < 4; i++) g.strokeEllipse(r() * 64, r() * 64, 14, 6);
  },
  rapids: (g, r) => {
    g.fillStyle(0x4aa3d4).fillRect(0, 0, 64, 64);
    g.lineStyle(3, 0xffffff, 0.75);
    for (let i = 0; i < 14; i++) { const x = r() * 64; const y = r() * 64; g.lineBetween(x, y, x + (r() - 0.5) * 6, y + 12 + r() * 8); }
    g.fillStyle(0xffffff, 0.5);
    for (let i = 0; i < 10; i++) g.fillCircle(r() * 64, r() * 64, 2 + r() * 3);
  },
  waterfall: (g, r) => {
    g.fillStyle(0x8fd3ee).fillRect(0, 0, 64, 64);
    g.lineStyle(3, 0xffffff, 0.8);
    for (let i = 0; i < 12; i++) { const x = r() * 64; const y = r() * 64; g.lineBetween(x, y, x, y + 14 + r() * 12); }
  },
  foliage: (g, r) => {
    g.fillStyle(0x163d22).fillRect(0, 0, 64, 64);
    for (let i = 0; i < 16; i++) g.fillStyle([0x1f5230, 0x2a6a3a, 0x0f2f1a][i % 3]).fillCircle(r() * 64, r() * 64, 8 + r() * 8);
  },
  stone: (g, r) => {
    g.fillStyle(0x7f7869).fillRect(0, 0, 64, 64);
    g.lineStyle(2, 0x5a5448);
    for (let row = 0; row < 4; row++) {
      const y = row * 16;
      g.lineBetween(0, y, 64, y);
      const off = row % 2 ? 16 : 0;
      for (let x = off; x < 64; x += 32) g.lineBetween(x, y, x, y + 16);
    }
    g.fillStyle(0x9a9382, 0.6).fillRect(4, 3, 20, 4).fillRect(36, 35, 18, 4);
    g.fillStyle(0x5a8a3a, 0.5).fillEllipse(r() * 64, r() * 64, 12, 5);
  },
  cliff: (g, r) => {
    speckle(g, r, 0x6b5f52, [[0x7d7062, 0.9], [0x564b40, 0.9], [0x8a7d6c, 0.6]], 40, [3, 8]);
    g.lineStyle(1.5, 0x463c33);
    for (let i = 0; i < 5; i++) { const x = r() * 64; const y = r() * 64; g.lineBetween(x, y, x + 8, y + 10); }
  },
  stone_door: (g, r) => {
    g.fillStyle(0x6e675a).fillRect(0, 0, 64, 64);
    g.lineStyle(3, 0x4f493f).strokeRect(2, 2, 60, 60);
    g.lineStyle(2, 0xd4a83a, 0.8).strokeCircle(32, 32, 14);
    g.fillStyle(0xd4a83a, 0.8).fillCircle(32, 32, 4);
  },
  pier: (g, r) => {
    g.fillStyle(0x8a6239).fillRect(0, 0, 64, 64);
    g.lineStyle(3, 0x5a3b1f);
    for (let x = 0; x < 64; x += 16) g.lineBetween(x, 0, x, 64);
    g.fillStyle(0x3d2a1a).fillCircle(8, 6, 1.5).fillCircle(24, 58, 1.5).fillCircle(40, 6, 1.5).fillCircle(56, 58, 1.5);
  }
};

function particleTextures(scene) {
  const make = (key, w, h, fn) => {
    const g = scene.make.graphics({ x: 0, y: 0 }, false);
    fn(g);
    g.generateTexture(key, w, h);
    g.destroy();
  };
  make("px_dot", 8, 8, (g) => g.fillStyle(0xffffff).fillCircle(4, 4, 4));
  make("px_glow", 24, 24, (g) => {
    for (let r = 12; r > 0; r -= 2) g.fillStyle(0xffffff, 0.12).fillCircle(12, 12, r);
  });
  make("px_leaf", 10, 6, (g) => g.fillStyle(0xffffff).fillEllipse(5, 3, 10, 5));
  make("px_streak", 40, 3, (g) => g.fillStyle(0xffffff).fillRect(0, 0, 40, 2));
  make("px_flame", 14, 14, (g) => {
    g.fillStyle(0xffffff, 0.35).fillCircle(7, 7, 7);
    g.fillStyle(0xffffff).fillCircle(7, 7, 4);
  });
  make("hint_marker", 16, 16, (g) => {
    g.fillStyle(0x12263a).fillPoints([{ x: 8, y: 0 }, { x: 16, y: 8 }, { x: 8, y: 16 }, { x: 0, y: 8 }], true);
    g.fillStyle(0xf6c56e).fillPoints([{ x: 8, y: 2 }, { x: 14, y: 8 }, { x: 8, y: 14 }, { x: 2, y: 8 }], true);
    g.fillStyle(0xffffff).fillCircle(8, 8, 2);
  });

  const vignette = scene.textures.createCanvas("vignette", 1280, 720);
  const ctx = vignette.getContext();
  const grad = ctx.createRadialGradient(640, 360, 250, 640, 360, 820);
  grad.addColorStop(0, "rgba(0,0,0,0)");
  grad.addColorStop(1, "rgba(0,0,0,0.6)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1280, 720);
  vignette.refresh();
}

export function generateTextures(scene) {
  for (const [key, def] of Object.entries(KINDS)) {
    const g = scene.make.graphics({ x: 0, y: 0 }, false);
    const fn = DRAW[key];
    if (fn) fn(g, def.w, def.h);
    else g.fillStyle(0xff00ff).fillRect(0, 0, def.w, def.h);
    g.generateTexture(key, def.w, def.h);
    g.destroy();
  }
  let seed = 7;
  for (const [key, fn] of Object.entries(TILES)) {
    const g = scene.make.graphics({ x: 0, y: 0 }, false);
    fn(g, mulberry32(seed++ * 97));
    g.generateTexture(`tile_${key}`, 64, 64);
    g.destroy();
  }
  particleTextures(scene);
}
