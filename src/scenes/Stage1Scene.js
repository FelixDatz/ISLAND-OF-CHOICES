import Phaser from "phaser";
import { STAGE1 } from "../data/stage1.js";
import { COLORS, PLACEHOLDERS } from "../data/assets.js";
import { ITEMS } from "../data/items.js";
import { gameState, resetState } from "../systems/GameState.js";
import { logEvent } from "../systems/EventLog.js";
import { listActions, performAction, itemLabel } from "../systems/Interaction.js";
import * as ui from "../ui/ui.js";

const PLAYER_SPEED = 190;
// Hitbox hanya di bagian kaki, supaya pemain bisa lewat "di belakang" pohon nanti.
const PLAYER_BODY = { w: 22, h: 18 };
// Jarak jangkau interaksi dari tepi objek.
const REACH = 48;

// Mode permainan: hanya "play" yang menggerakkan karakter.
// "dialog" | "menu" | "inventory" membekukan karakter dan mengambil alih tombol.
export default class Stage1Scene extends Phaser.Scene {
  constructor() {
    super("Stage1");
  }

  create(data = {}) {
    const stage = STAGE1;
    // Dunia dimulai ulang setelah game over, tetapi log sesi dipertahankan
    // agar percobaan gagal tetap tersedia untuk analisis perilaku.
    resetState();
    if (Array.isArray(data.priorLog)) gameState.log = [...data.priorLog];
    if (Number.isFinite(data.startedAt)) gameState.startedAt = data.startedAt;
    this.attempt = Number.isFinite(data.attempt) ? data.attempt : 1;
    logEvent("stage_start", { stage: stage.id, attempt: this.attempt, restartReason: data.reason || null });

    this.mode = "play";
    ui.hideGameOver();
    this.interactables = [];
    this.currentTarget = null;
    this.menu = null;

    this.physics.world.setBounds(0, 0, stage.world.width, stage.world.height);
    this.solids = this.physics.add.staticGroup();

    this.buildGround(stage);
    this.buildWater(stage);
    this.buildRiverGate();
    this.buildGoalMarker(stage);
    this.buildObjects(stage);
    this.buildPlayer(stage);
    this.setupCamera(stage);
    this.setupInput();
    this.setupDebug();
  }

  // ---------- dunia ----------

  buildGround(stage) {
    for (const g of stage.ground) {
      this.add.rectangle(g.x, g.y, g.w, g.h, COLORS[g.color]).setOrigin(0, 0).setDepth(0);
    }
  }

  buildWater(stage) {
    for (const w of stage.water) {
      const rect = this.add.rectangle(w.x, w.y, w.w, w.h, COLORS[w.color]).setOrigin(0, 0).setDepth(1);
      if (w.solid !== false) this.solids.add(rect);
    }
  }

  buildRiverGate() {
    // Penghalang placeholder menutup koridor sampai pemain menyelesaikan aksi
    // penyeberangan yang valid. Tidak ada energi atau timer dalam mekanik ini.
    this.riverGate = this.add.rectangle(1225, 690, 250, 100, 0x253b4a, 0.92)
      .setStrokeStyle(3, 0xf6b84a)
      .setDepth(4);
    this.solids.add(this.riverGate);
    this.riverGateOpen = false;
  }

  openRiverGate(method) {
    if (this.riverGateOpen || !gameState.flags.river_crossing_open) return;
    this.riverGateOpen = true;
    this.solids.remove(this.riverGate, true, true);
    this.riverGate = null;
    logEvent("challenge_resolved", {
      challengeId: "river_crossing",
      status: "success",
      strategy: method
    });
    ui.toast("Jalur penyeberangan terbuka");
  }

  checkGoal() {
    if (gameState.flags.stage1_complete) return;
    const g = STAGE1.goal;
    const p = this.player.body.center;
    const inside = p.x >= g.x && p.x <= g.x + g.w && p.y >= g.y && p.y <= g.y + g.h;
    if (!inside) return;

    // Target berada di sisi seberang; gate harus dibuka lewat aksi yang valid.
    if (!gameState.flags.river_crossing_open) return;
    gameState.flags.stage1_complete = true;
    logEvent("stage_complete", {
      stage: STAGE1.id,
      challengeId: "river_crossing",
      strategy: Object.keys(gameState.flags).find((key) => key.startsWith("crossing_method_"))?.replace("crossing_method_", "unknown") || "unknown"
    });
    this.showDialog("Kamu berhasil mencapai area seberang! Tidak ada satu cara yang wajib: keputusan dan jalur yang kamu pilih akan menjadi bagian dari catatan perjalananmu.");
  }

  buildGoalMarker(stage) {
    const g = stage.goal;
    this.add.rectangle(g.x, g.y, g.w, g.h, COLORS.goal, 0.25).setOrigin(0, 0).setDepth(2);
  }

  buildObjects(stage) {
    for (const o of stage.objects) {
      if (o.id && gameState.removedObjects[o.id]) continue;
      const def = PLACEHOLDERS[o.kind];
      const depth = o.y + def.h / 2;
      const sprite = def.solid
        ? this.solids.create(o.x, o.y, o.kind).setDepth(depth)
        : this.add.image(o.x, o.y, o.kind).setDepth(depth);
      if (o.actions) {
        this.interactables.push({
          def: o,
          sprite,
          solid: def.solid,
          x: o.x,
          y: o.y,
          radius: Math.max(def.w, def.h) / 2
        });
      }
    }
  }

  buildPlayer(stage) {
    const def = PLACEHOLDERS.player;
    this.player = this.physics.add.sprite(stage.spawn.x, stage.spawn.y, "player");
    this.player.setCollideWorldBounds(true);
    this.player.body.setSize(PLAYER_BODY.w, PLAYER_BODY.h);
    this.player.body.setOffset((def.w - PLAYER_BODY.w) / 2, def.h - PLAYER_BODY.h);
    this.physics.add.collider(this.player, this.solids);

    this.facing = new Phaser.Math.Vector2(0, 1);
    this.facingNub = this.add.rectangle(0, 0, 8, 8, 0xffffff).setStrokeStyle(1, 0x7a4b00);
  }

  setupCamera(stage) {
    const cam = this.cameras.main;
    cam.setBounds(0, 0, stage.world.width, stage.world.height);
    cam.setBackgroundColor(COLORS.sea);
    cam.startFollow(this.player, true, 0.12, 0.12);
  }

  // ---------- input ----------

  setupInput() {
    const kb = this.input.keyboard;
    this.cursors = kb.createCursorKeys();
    this.keys = kb.addKeys("W,A,S,D");
    this.moveVector = new Phaser.Math.Vector2();

    // Tombol tahan (repeat) diabaikan supaya satu tekan = satu aksi.
    const on = (name, fn) => kb.on(`keydown-${name}`, (e) => !e.repeat && fn());
    on("E", () => this.onConfirm());
    on("SPACE", () => this.onConfirm());
    on("ENTER", () => this.onConfirm());
    on("ESC", () => this.onCancel());
    on("I", () => this.toggleInventory());
    on("UP", () => this.onNav(-1));
    on("W", () => this.onNav(-1));
    on("DOWN", () => this.onNav(1));
    on("S", () => this.onNav(1));
  }

  setupDebug() {
    const world = this.physics.world;
    world.createDebugGraphic();
    world.drawDebug = false;
    world.debugGraphic.clear();
    this.input.keyboard.on("keydown-B", () => {
      world.drawDebug = !world.drawDebug;
      if (!world.drawDebug) world.debugGraphic.clear();
    });
    this.input.keyboard.on("keydown-L", () => console.table(gameState.log));
  }

  setMode(mode) {
    this.mode = mode;
    // Prompt hanya relevan saat berjalan; dihitung ulang di update().
    this.currentTarget = null;
    ui.showPrompt(null);
  }

  onConfirm() {
    if (this.mode === "play") {
      // Dihitung langsung saat E ditekan, bukan memakai hasil frame sebelumnya.
      const target = this.findInteractable();
      if (target) this.openInteraction(target);
    } else if (this.mode === "dialog") {
      this.closeDialog();
    } else if (this.mode === "menu") {
      this.pickMenu(this.menu.selected);
    }
  }

  onCancel() {
    if (this.mode === "menu") this.pickMenu(this.menu.list.length); // baris terakhir = Batal
    else if (this.mode === "dialog") this.closeDialog();
    else if (this.mode === "inventory") this.toggleInventory();
  }

  onNav(dir) {
    if (this.mode !== "menu") return;
    const count = this.menu.list.length + 1;
    this.menu.selected = (this.menu.selected + dir + count) % count;
    ui.setMenuSelected(this.menu.selected);
  }

  // ---------- interaksi ----------

  // Objek interaktif terdekat yang berada di depan karakter (atau sudah menempel).
  findInteractable() {
    const c = this.player.body.center;
    let best = null;
    let bestScore = Infinity;
    for (const it of this.interactables) {
      const dx = it.x - c.x;
      const dy = it.y - c.y;
      const dist = Math.hypot(dx, dy);
      if (dist > it.radius + REACH) continue;
      const dot = dist > 0 ? (this.facing.x * dx + this.facing.y * dy) / dist : 1;
      if (dist > it.radius + 20 && dot < 0.3) continue;
      const score = dist - dot * 20;
      if (score < bestScore) {
        best = it;
        bestScore = score;
      }
    }
    return best;
  }

  openInteraction(target) {
    const obj = target.def;
    const list = listActions(obj, gameState);
    logEvent("interact", { object: obj.id, options: list.filter((a) => a.enabled).map((a) => a.action.id) });

    if (list.length === 0) {
      this.showDialog(obj.examine || "Tidak ada lagi yang bisa kamu lakukan di sini.");
    } else if (list.length === 1 && list[0].enabled) {
      this.runAction(target, list[0].action);
    } else {
      this.openMenu(target, list);
    }
  }

  openMenu(target, list) {
    this.setMode("menu");
    this.menu = { target, list, selected: 0 };
    const options = list.map((a) => ({ label: a.action.text, enabled: a.enabled }));
    options.push({ label: "Batal", enabled: true });
    ui.showMenu(target.def.label, options, 0, (i) => this.pickMenu(i));
  }

  pickMenu(index) {
    if (this.mode !== "menu") return;
    const { target, list } = this.menu;
    ui.hideMenu();
    this.menu = null;
    this.setMode("play");

    if (index >= list.length) {
      logEvent("menu_cancel", { object: target.def.id });
      return;
    }
    const chosen = list[index];
    if (!chosen.enabled) {
      logEvent("blocked_action", { object: target.def.id, action: chosen.action.id });
      this.showDialog(chosen.action.hint);
      return;
    }
    this.runAction(target, chosen.action);
  }

  runAction(target, action) {
    // Berenang sengaja bukan solusi sukses: percobaan membawa pemain ke tengah
    // sungai, lalu game over. Tidak ada energi atau timer yang dipakai.
    if (target.def.id === "river_bank" && action.id === "swim") {
      this.beginSwimAttempt(action);
      return;
    }

    const result = performAction(target.def, action, gameState);
    for (const g of result.gained) ui.toast(`Mendapat: ${itemLabel(g.id, g.n)}`);
    if (result.removed) this.removeInteractable(target);
    if (result.ok && gameState.flags.river_crossing_open) {
      const method = action.strategy || Object.keys(gameState.flags)
        .find((key) => key.startsWith("crossing_method_"))?.replace("crossing_method_", "unknown") || "unknown";
      this.openRiverGate(method);
    }
    this.showDialog(result.dialog);
  }


  beginSwimAttempt(action) {
    logEvent("action_attempted", {
      object: "river_bank",
      action: action.id,
      challengeId: "river_crossing",
      strategy: "swim"
    });
    logEvent("action_failed", {
      object: "river_bank",
      action: action.id,
      challengeId: "river_crossing",
      strategy: "swim",
      reason: "drowned_midstream"
    });

    this.setMode("drowning");
    this.player.body.enable = false;
    this.facingNub.setVisible(false);
    ui.showPrompt(null);
    ui.toast("Arus sungai terlalu deras!");

    // Gerakan singkat ke tengah sungai agar kegagalan terlihat di dunia game.
    this.tweens.add({
      targets: this.player,
      x: 1225,
      y: 690,
      duration: 850,
      ease: "Sine.easeInOut",
      onComplete: () => {
        this.player.setTint(0x8da8b8);
        logEvent("player_drowned", { stage: STAGE1.id, attempt: this.attempt, location: "river_midstream" });
        this.setMode("gameover");
        ui.showGameOver(
          "Terseret arus",
          "Kamu mencoba berenang menyeberangi sungai, tetapi arus terlalu deras dan menyeretmu ke tengah. Kamu harus memulai perjalanan dari awal. Coba cari cara lain, misalnya membuat rakit atau jembatan.",
          () => this.retryFromStart()
        );
      }
    });
  }

  retryFromStart() {
    logEvent("retry_selected", { stage: STAGE1.id, attempt: this.attempt, reason: "drowned_midstream" });
    const priorLog = [...gameState.log];
    const startedAt = gameState.startedAt;
    const attempt = this.attempt + 1;
    this.scene.restart({ priorLog, startedAt, attempt, reason: "drowned_midstream" });
  }

  removeInteractable(target) {
    this.interactables = this.interactables.filter((it) => it !== target);
    if (target.solid) this.solids.remove(target.sprite, true, true);
    else target.sprite.destroy();
  }

  showDialog(text) {
    this.setMode("dialog");
    ui.showDialog(text, () => this.closeDialog());
  }

  closeDialog() {
    if (this.mode !== "dialog") return;
    ui.hideDialog();
    this.setMode("play");
  }

  toggleInventory() {
    if (this.mode === "play") {
      this.setMode("inventory");
      logEvent("inventory_open");
      const items = Object.entries(gameState.inventory).map(([id, count]) => ({ ...ITEMS[id], count }));
      ui.showInventory(items);
    } else if (this.mode === "inventory") {
      ui.hideInventory();
      this.setMode("play");
    }
  }

  // ---------- loop ----------

  update() {
    let dx = 0;
    let dy = 0;
    if (this.mode === "play") {
      const left = this.cursors.left.isDown || this.keys.A.isDown;
      const right = this.cursors.right.isDown || this.keys.D.isDown;
      const up = this.cursors.up.isDown || this.keys.W.isDown;
      const down = this.cursors.down.isDown || this.keys.S.isDown;
      dx = (right ? 1 : 0) - (left ? 1 : 0);
      dy = (down ? 1 : 0) - (up ? 1 : 0);
    }

    if (dx !== 0 || dy !== 0) {
      // normalize() supaya gerak diagonal tidak lebih cepat.
      this.moveVector.set(dx, dy).normalize();
      this.player.setVelocity(this.moveVector.x * PLAYER_SPEED, this.moveVector.y * PLAYER_SPEED);
      this.facing.copy(this.moveVector);
    } else {
      this.player.setVelocity(0, 0);
    }

    if (this.mode === "play") {
      const target = this.findInteractable();
      if (target !== this.currentTarget) {
        this.currentTarget = target;
        ui.showPrompt(target ? target.def.label : null);
      }
    }

    const depth = this.player.y + PLAYER_BODY.h / 2;
    this.player.setDepth(depth);
    this.facingNub.setPosition(this.player.x + this.facing.x * 22, this.player.y + this.facing.y * 22);
    this.facingNub.setDepth(depth + 1);
    if (this.mode === "play") this.checkGoal();
  }
}
