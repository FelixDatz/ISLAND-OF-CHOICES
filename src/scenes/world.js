import Phaser from "phaser";
import { KINDS } from "../data/assets.js";
import { mulberry32 } from "../art/textures.js";

// Membangun tampilan dunia dari data stage. Collision memakai persegi tak terlihat
// di `scene.solids`; tampilan memakai TileSprite/Image terpisah.

const WATER_TILE = { sea: "tile_sea", river: "tile_river", pool: "tile_pool" };
const WALL_TILE = { foliage: "tile_foliage", stone: "tile_stone", cliff: "tile_cliff" };
const GATE_TILE = { rapids: "tile_rapids", stone_door: "tile_stone_door", waterfall: "tile_waterfall" };

const inside = (r, x, y, pad = 0) => x >= r.x - pad && x <= r.x + r.w + pad && y >= r.y - pad && y <= r.y + r.h + pad;

function blocker(scene, r) {
  const rect = scene.add.rectangle(r.x + r.w / 2, r.y + r.h / 2, r.w, r.h).setVisible(false);
  scene.solids.add(rect);
  return rect;
}

export function buildGround(scene, stage) {
  for (const g of stage.ground) {
    scene.add.tileSprite(g.x, g.y, g.w, g.h, `tile_${g.tile}`).setOrigin(0, 0).setDepth(0);
  }
}

/** Mengembalikan daftar TileSprite air yang perlu dianimasikan. */
export function buildWater(scene, stage) {
  const animated = [];
  for (const w of stage.water || []) {
    const ts = scene.add.tileSprite(w.x, w.y, w.w, w.h, WATER_TILE[w.style] || "tile_sea").setOrigin(0, 0).setDepth(1);
    const flow = w.flow || (w.style === "sea" ? [6, 3] : [0, 0]);
    animated.push({ ts, fx: flow[0], fy: flow[1] });
    if (w.solid !== false) blocker(scene, w);
    if (w.style === "sea") {
      const foam = scene.add.graphics().setDepth(2);
      foam.lineStyle(5, 0xffffff, 0.45).strokeRect(w.x + 2, w.y + 2, w.w - 4, w.h - 4);
      scene.tweens.add({ targets: foam, alpha: 0.35, duration: 1800, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
    } else if (w.style === "pool") {
      const edge = scene.add.graphics().setDepth(2);
      edge.lineStyle(3, 0xd8f0ff, 0.35).strokeRect(w.x, w.y, w.w, w.h);
    }
  }
  for (const b of stage.bridges || []) {
    scene.add.tileSprite(b.x, b.y, b.w, b.h, `tile_${b.style || "pier"}`).setOrigin(0, 0).setDepth(3);
  }
  return animated;
}

export function buildWalls(scene, stage) {
  for (const w of stage.walls || []) {
    scene.add.tileSprite(w.x, w.y, w.w, w.h, WALL_TILE[w.style] || "tile_stone").setOrigin(0, 0).setDepth(w.y + w.h);
    scene.add.rectangle(w.x, w.y + w.h - 8, w.w, 8, 0x000000, 0.25).setOrigin(0, 0).setDepth(w.y + w.h);
    blocker(scene, w);
  }
}

export function scatterDecor(scene, stage) {
  const rand = mulberry32([...stage.id].reduce((a, c) => a + c.charCodeAt(0), 0) * 131);
  const blocked = [...(stage.water || []), ...(stage.walls || [])];
  const flowerTints = [0xffffff, 0xf7a8c8, 0xf6d55c, 0xc9a8f7, 0xff9e7a];
  const placed = [];
  for (const spec of stage.decor || []) {
    for (let i = 0; i < spec.count; i++) {
      const x = spec.area.x + rand() * spec.area.w;
      const y = spec.area.y + rand() * spec.area.h;
      if (blocked.some((r) => inside(r, x, y, 10))) continue;
      const img = scene.add.image(x, y, spec.kind).setDepth(6).setAlpha(0.95);
      if (spec.kind === "flower") img.setTint(flowerTints[Math.floor(rand() * flowerTints.length)]).setScale(0.8 + rand() * 0.5);
      else img.setScale(0.8 + rand() * 0.5);
      if (rand() < 0.5) img.setFlipX(true);
      placed.push(img);
    }
  }
  return placed;
}

/** Objek dunia. Mengembalikan daftar interactable. */
export function buildObjects(scene, stage, state) {
  const interactables = [];
  for (const o of stage.objects) {
    if (o.id && state.removedObjects[o.id]) continue;
    const def = KINDS[o.kind];
    if (!def) throw new Error(`Kind tidak dikenal: ${o.kind}`);
    const depth = o.y + def.h / 2;
    let sprite;
    if (def.solid) {
      sprite = scene.solids.create(o.x, o.y, o.kind).setDepth(depth);
      if (def.body) sprite.body.setSize(def.body.w, def.body.h, false).setOffset((def.w - def.body.w) / 2, def.h - def.body.h);
    } else {
      sprite = scene.add.image(o.x, o.y, o.kind).setDepth(depth);
    }
    if (o.kind === "monkey") scene.tweens.add({ targets: sprite, y: o.y - 4, duration: 600, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
    if (o.kind === "mist" || o.kind === "birds") scene.tweens.add({ targets: sprite, alpha: 0.6, duration: 900, yoyo: true, repeat: -1 });
    if (o.actions) {
      interactables.push({ def: o, sprite, solid: def.solid, x: o.x, y: o.y, h: def.h, radius: Math.max(def.w, def.h) / 2, marker: null });
    }
  }
  return interactables;
}

/** Gate tantangan. Mengembalikan Map gateKey → { visual, blocker, def, open }. */
export function buildGates(scene, stage) {
  const gates = new Map();
  for (const [challengeId, challenge] of Object.entries(stage.challenges || {})) {
    for (const [gateId, g] of Object.entries(challenge.gates || {})) {
      const visual = scene.add.tileSprite(g.x, g.y, g.w, g.h, GATE_TILE[g.style] || "tile_stone_door").setOrigin(0, 0);
      if (g.style === "rapids") visual.setDepth(4);
      else if (g.style === "waterfall") visual.setDepth(5000).setAlpha(0.92);
      else visual.setDepth(g.y + g.h);
      gates.set(`${challengeId}:${gateId}`, { visual, blocker: blocker(scene, g), def: g, open: false });
    }
  }
  return gates;
}

/** Membuka gate dengan animasi sesuai gayanya. */
export function openGate(scene, gate) {
  if (!gate || gate.open) return;
  gate.open = true;
  scene.solids.remove(gate.blocker, true, true);
  const { visual, def } = gate;
  if (def.style === "stone_door") {
    scene.cameras.main.shake(700, 0.004);
    scene.tweens.add({ targets: visual, scaleY: 0.06, duration: 1400, ease: "Sine.easeIn" });
  } else if (def.style === "waterfall") {
    scene.tweens.add({ targets: visual, alpha: 0.5, duration: 800 });
  } else {
    scene.tweens.add({ targets: visual, alpha: 0, duration: 900, onComplete: () => visual.setVisible(false) });
  }
}

export function drawCrossingVisual(scene, g, visual) {
  if (!visual) return null;
  const gfx = scene.add.graphics().setDepth(3);
  const x0 = g.x + 10;
  const w = g.w - 20;
  const cy = g.y + g.h / 2;
  if (visual === "raft") {
    for (let x = x0; x < x0 + w; x += 18) {
      gfx.fillStyle(0x9b7041).fillRoundedRect(x, cy - 18, 16, 36, 5);
      gfx.lineStyle(2, 0x5a3b21).strokeRoundedRect(x, cy - 18, 16, 36, 5);
    }
    gfx.lineStyle(3, 0xc9a66b).lineBetween(x0, cy - 9, x0 + w, cy - 9).lineBetween(x0, cy + 9, x0 + w, cy + 9);
  } else if (visual === "log_bridge") {
    gfx.fillStyle(0x7a5230).fillRoundedRect(x0 - 10, cy - 13, w + 20, 26, 12);
    gfx.fillStyle(0x9a6a3c).fillRoundedRect(x0 - 6, cy - 9, w + 12, 7, 4);
    gfx.lineStyle(2, 0x4a2f12).strokeRoundedRect(x0 - 10, cy - 13, w + 20, 26, 12);
    gfx.fillStyle(0xd9b07a).fillEllipse(x0 - 8, cy, 8, 24).fillEllipse(x0 + w + 8, cy, 8, 24);
  } else {
    for (let x = x0 + 12; x <= x0 + w - 8; x += 38) {
      gfx.fillStyle(0x6f817c).fillEllipse(x, cy + 3, 34, 22);
      gfx.fillStyle(0xa3b0aa).fillEllipse(x, cy, 32, 20);
      gfx.fillStyle(0xd0dad5, 0.7).fillEllipse(x - 5, cy - 4, 12, 6);
    }
  }
  gfx.setAlpha(0);
  scene.tweens.add({ targets: gfx, alpha: 1, duration: 700 });
  return gfx;
}

export function buildGoal(scene, stage) {
  const g = stage.goal;
  const cx = g.x + g.w / 2;
  const cy = g.y + g.h / 2;
  const ring = scene.add.ellipse(cx, cy, Math.min(g.w, 220), Math.min(g.h, 120)).setStrokeStyle(4, 0xf6c56e, 0.9).setDepth(5);
  const fill = scene.add.ellipse(cx, cy, Math.min(g.w, 220), Math.min(g.h, 120), 0xf6c56e, 0.12).setDepth(5);
  const label = scene.add.text(cx, g.y - 6, g.label || "Tujuan", {
    fontFamily: "Trebuchet MS, Arial", fontSize: "15px", color: "#fff3d6", stroke: "#12263a", strokeThickness: 4
  }).setOrigin(0.5, 1).setDepth(6000);
  const sparks = scene.add.particles(0, 0, "px_glow", {
    emitZone: { type: "random", source: new Phaser.Geom.Ellipse(cx, cy, Math.min(g.w, 200), Math.min(g.h, 100)) },
    lifespan: 1600, speedY: { min: -40, max: -15 }, scale: { start: 0.5, end: 0 }, alpha: { start: 0.8, end: 0 },
    tint: 0xffd27a, frequency: 140, blendMode: "ADD", emitting: false
  }).setDepth(5);
  scene.tweens.add({ targets: [ring, fill], scaleX: 1.08, scaleY: 1.08, duration: 1100, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
  const setUnlocked = (on) => {
    ring.setAlpha(on ? 1 : 0.25);
    fill.setAlpha(on ? 1 : 0.2);
    label.setVisible(on);
    sparks.emitting = on;
  };
  setUnlocked(false);
  return { ring, fill, label, sparks, setUnlocked, cx, cy };
}
