import Phaser from "phaser";

// Kehidupan dunia: makhluk kecil, partikel atmosfer, pencahayaan per stage.
// Semua objek yang dibuat dikembalikan supaya bisa disembunyikan dari minimap.

const rnd = Phaser.Math.Between;
const rndf = Phaser.Math.FloatBetween;

function crab(scene, area, player) {
  const c = scene.add.image(rnd(area.x, area.x + area.w), rnd(area.y, area.y + area.h), "crab").setDepth(7);
  const wander = () => {
    if (!c.active) return;
    const near = Phaser.Math.Distance.Between(c.x, c.y, player.x, player.y) < 110;
    const tx = Phaser.Math.Clamp(c.x + rnd(-90, 90) + (near ? Math.sign(c.x - player.x) * 140 : 0), area.x, area.x + area.w);
    const ty = Phaser.Math.Clamp(c.y + rnd(-50, 50), area.y, area.y + area.h);
    scene.tweens.add({
      targets: c, x: tx, y: ty, duration: near ? 500 : rnd(1200, 2200), ease: "Sine.easeInOut",
      onComplete: () => scene.time.delayedCall(rnd(400, 2200), wander)
    });
  };
  scene.time.delayedCall(rnd(0, 1500), wander);
  return c;
}

function fish(scene, area, splash) {
  const f = scene.add.image(rnd(area.x, area.x + area.w), rnd(area.y, area.y + area.h), "fish").setDepth(2).setAlpha(0.55);
  const swim = () => {
    if (!f.active) return;
    const tx = rnd(area.x, area.x + area.w);
    const ty = rnd(area.y, area.y + area.h);
    f.setFlipX(tx > f.x);
    scene.tweens.add({ targets: f, x: tx, y: ty, duration: rnd(2500, 5000), ease: "Sine.easeInOut", onComplete: () => {
      if (Math.random() < 0.35) {
        scene.tweens.add({ targets: f, y: f.y - 26, alpha: 1, duration: 260, yoyo: true, ease: "Quad.easeOut", onComplete: () => { f.setAlpha(0.55); splash(f.x, f.y); swim(); } });
      } else swim();
    } });
  };
  swim();
  return f;
}

function bird(scene, world) {
  const b = scene.add.image(-40, 0, "bird").setDepth(8000);
  const shadowImg = scene.add.ellipse(-40, 0, 14, 5, 0x000000, 0.18).setDepth(7);
  scene.tweens.add({ targets: b, scaleY: 0.5, duration: 220, yoyo: true, repeat: -1 });
  const fly = () => {
    if (!b.active) return;
    const fromLeft = Math.random() < 0.5;
    const y = rnd(80, world.height - 80);
    const startX = fromLeft ? -40 : world.width + 40;
    const endX = fromLeft ? world.width + 40 : -40;
    b.setPosition(startX, y).setFlipX(!fromLeft);
    scene.tweens.add({
      targets: b, x: endX, y: y + rnd(-200, 200), duration: rnd(9000, 15000),
      onUpdate: () => shadowImg.setPosition(b.x + 20, b.y + 60),
      onComplete: () => scene.time.delayedCall(rnd(2000, 9000), fly)
    });
  };
  scene.time.delayedCall(rnd(0, 6000), fly);
  return [b, shadowImg];
}

function particles(scene, kind, stage) {
  const { width, height } = stage.world;
  const whole = new Phaser.Geom.Rectangle(0, 0, width, height);
  switch (kind) {
    case "leaves":
      return scene.add.particles(0, 0, "px_leaf", {
        emitZone: { type: "random", source: whole }, lifespan: 7000, speedX: { min: 10, max: 40 }, speedY: { min: 15, max: 35 },
        rotate: { min: 0, max: 360 }, scale: { min: 0.7, max: 1.2 }, alpha: { start: 0.9, end: 0 },
        tint: [0x6fa040, 0x9bc45a, 0xc9b04a], frequency: 260
      }).setDepth(7500);
    case "spray": {
      const seas = (stage.water || []).filter((w) => w.style === "sea");
      return seas.map((w) => scene.add.particles(0, 0, "px_dot", {
        emitZone: { type: "random", source: new Phaser.Geom.Rectangle(w.x, w.y, w.w, w.h) },
        lifespan: 1200, speedY: { min: -12, max: -4 }, scale: { start: 0.5, end: 0 }, alpha: { start: 0.7, end: 0 },
        frequency: Math.max(60, 40000 / (w.w * w.h / 1000))
      }).setDepth(2));
    }
    case "fireflies":
      return scene.add.particles(0, 0, "px_glow", {
        emitZone: { type: "random", source: whole }, lifespan: { min: 3000, max: 6000 },
        speedX: { min: -12, max: 12 }, speedY: { min: -12, max: 12 }, scale: { start: 0.6, end: 0.2 },
        alpha: { values: [0, 1, 0.3, 1, 0] }, tint: 0xe8f27a, blendMode: "ADD", frequency: 90
      }).setDepth(7400);
    case "mist":
      return scene.add.particles(0, 0, "px_glow", {
        emitZone: { type: "random", source: whole }, lifespan: 9000, speedX: { min: 4, max: 14 },
        scale: { start: 5, end: 8 }, alpha: { start: 0.07, end: 0 }, tint: 0xdff7ef, frequency: 400
      }).setDepth(7300);
    case "wind":
      return scene.add.particles(0, 0, "px_streak", {
        emitZone: { type: "random", source: whole }, lifespan: 1600, speedX: { min: 260, max: 420 }, speedY: { min: -10, max: 10 },
        scale: { min: 0.6, max: 1.4 }, alpha: { start: 0.35, end: 0 }, frequency: 70
      }).setDepth(7600);
    default:
      return null;
  }
}

export function buildAmbience(scene, stage, player, splash) {
  const amb = stage.ambience || {};
  const created = [];
  for (const spec of amb.critters || []) {
    for (let i = 0; i < spec.count; i++) {
      if (spec.kind === "crab") created.push(crab(scene, spec.area, player));
      if (spec.kind === "fish") created.push(fish(scene, spec.area, splash));
      if (spec.kind === "bird") created.push(...bird(scene, stage.world));
    }
  }
  for (const kind of amb.particles || []) {
    const p = particles(scene, kind, stage);
    if (Array.isArray(p)) created.push(...p);
    else if (p) created.push(p);
  }
  return created;
}

/** Lapisan warna & vignette yang menempel di kamera utama. */
export function buildLighting(scene, stage) {
  const tint = stage.ambience?.tint;
  const items = [];
  if (tint) {
    items.push(scene.add.rectangle(0, 0, 1280, 720, tint.color, tint.alpha)
      .setOrigin(0, 0).setScrollFactor(0).setDepth(9000).setBlendMode(Phaser.BlendModes.MULTIPLY));
  }
  items.push(scene.add.image(0, 0, "vignette").setOrigin(0, 0).setScrollFactor(0).setDepth(9001));
  return items;
}
