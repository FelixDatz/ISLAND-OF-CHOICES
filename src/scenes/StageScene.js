import Phaser from "phaser";
import { ITEMS } from "../data/items.js";
import { getStage, firstStageId, stageIndex, STAGES, CELL_SIZE } from "../data/stages.js";
import { gameState } from "../systems/GameState.js";
import { StageSession, zoneAt, cellKey } from "../systems/StageSession.js";
import { listActions, itemLabel } from "../systems/Interaction.js";
import { buildJournalSnapshot } from "../systems/Journal.js";
import { buildEvidenceReport } from "../systems/Evidence.js";
import { submitSession, newSession as newTelemetrySession, getSessionId } from "../systems/Telemetry.js";
import { saveProgress, clearProgress } from "../systems/SaveGame.js";
import { sfx, setAmbience, unlockAudio, toggleMute, playMusic } from "../audio/sound.js";
import * as ui from "../ui/ui.js";
import { buildGround, buildWater, buildWalls, scatterDecor, buildObjects, buildGates, openGate, drawCrossingVisual, buildGoal } from "./world.js";
import { buildAmbience, buildLighting } from "./ambience.js";

const PLAYER_SPEED = 200;
const PLAYER_BODY = { w: 20, h: 14 };
const REACH = 48;
const REPORT_STORAGE_KEY = "ioc:lastReport";
const MINIMAP_WIDTH = 220;
const FONT = "Trebuchet MS, Arial, sans-serif";

/**
 * Scene generik untuk semua stage. Mengurus rendering, input, fisika, animasi,
 * dan efek. Semua aturan permainan & pencatatan event ada di StageSession.
 *
 * Mode: play | dialog | menu | puzzle | inventory | journal | analysis | cutscene | gameover | result
 * Hanya "play" yang menggerakkan karakter.
 */
export default class StageScene extends Phaser.Scene {
  constructor() {
    super("Stage");
  }

  create(data = {}) {
    this.stage = getStage(data.stageId || firstStageId());
    this.session = new StageSession(this.stage, gameState).start({
      attempt: data.attempt,
      priorLog: data.priorLog,
      startedAt: data.startedAt,
      reason: data.reason || null,
      inventory: data.inventory || null,
      visitedCells: data.visitedCells || null
    });

    this.mode = "play";
    ui.hideGameOver();
    ui.hideResult();
    ui.hidePuzzle();
    this.currentTarget = null;
    this.menu = null;
    this.puzzle = null;
    this.inGoal = false;
    this.walkT = 0;
    this.stepDist = 0;
    this.minimapOnly = [];
    this.mainOnly = [];

    const { world } = this.stage;
    this.physics.world.setBounds(0, 0, world.width, world.height);
    this.solids = this.physics.add.staticGroup();

    buildGround(this, this.stage);
    this.waterAnim = buildWater(this, this.stage);
    buildWalls(this, this.stage);
    this.gates = buildGates(this, this.stage);
    this.goalFx = buildGoal(this, this.stage);
    this.decor = scatterDecor(this, this.stage);
    this.interactables = buildObjects(this, this.stage, gameState);
    this.buildPlayer();
    this.buildFx();
    this.ambient = buildAmbience(this, this.stage, this.player, (x, y) => this.splash(x, y, 6));
    this.lighting = buildLighting(this, this.stage);
    this.buildMarkers();
    this.setupCamera();
    this.buildMinimap();
    this.setupInput();
    this.setupDebug();
    this.refreshWorld();
    this.lastPos = { x: this.player.x, y: this.player.y };
    this.updateZoneContext();
    this.visitCell(true);

    setAmbience(this.stage.ambience?.sound || null);
    playMusic(this.stage.music || null);
    this.updateObjective();
    saveProgress({
      stageId: this.stage.id,
      stageName: this.stage.name,
      attempt: this.session.state.attempt,
      inventory: { ...this.session.startInventory },
      log: [...gameState.log],
      sessionId: getSessionId()
    });
    if (data.reason === "resume") {
      ui.toast(`Melanjutkan ${this.stage.name} dari awal stage`);
    } else if (this.session.state.attempt > 1) {
      ui.toast(`Percobaan ke-${this.session.state.attempt}`);
    } else {
      ui.showStageCard(this.stage.intro || { kicker: `STAGE ${stageIndex(this.stage.id) + 1}`, title: this.stage.name });
    }
  }

  // ---------- pembangunan ----------

  buildPlayer() {
    const { spawn } = this.stage;
    this.player = this.physics.add.sprite(spawn.x, spawn.y, "player");
    this.player.setCollideWorldBounds(true);
    this.player.body.setSize(PLAYER_BODY.w, PLAYER_BODY.h);
    this.player.body.setOffset((30 - PLAYER_BODY.w) / 2, 42 - PLAYER_BODY.h - 2);
    this.physics.add.collider(this.player, this.solids);
    this.facing = new Phaser.Math.Vector2(0, 1);
    this.facingNub = this.add.circle(0, 0, 3, 0xffffff, 0.55);
  }

  buildFx() {
    this.dust = this.add.particles(0, 0, "px_dot", {
      follow: this.player, followOffset: { x: 0, y: 18 }, lifespan: 450, speed: { min: 4, max: 18 },
      scale: { start: 0.55, end: 0 }, alpha: { start: 0.45, end: 0 }, tint: 0xd9c9a0, frequency: 85, emitting: false
    }).setDepth(7);
    this.burstFx = this.add.particles(0, 0, "px_glow", {
      lifespan: 800, speed: { min: 60, max: 180 }, scale: { start: 0.8, end: 0 }, alpha: { start: 1, end: 0 },
      tint: [0xffe08a, 0xffffff, 0xf6b84a], blendMode: "ADD", emitting: false
    }).setDepth(8500);
    this.splashFx = this.add.particles(0, 0, "px_dot", {
      lifespan: 700, speedY: { min: -180, max: -60 }, speedX: { min: -90, max: 90 }, gravityY: 400,
      scale: { start: 0.9, end: 0.2 }, alpha: { start: 0.9, end: 0 }, tint: [0xffffff, 0xbfe6ff], emitting: false
    }).setDepth(8400);
    this.fireFx = null;
  }

  buildMarkers() {
    for (const it of this.interactables) {
      it.marker = this.add.image(it.x, it.y - it.h / 2 - 14, "hint_marker").setDepth(6500).setAlpha(0.9);
      this.tweens.add({ targets: it.marker, y: it.marker.y - 6, duration: 700 + (it.x % 300), yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
      this.mainOnly.push(it.marker);
    }
  }

  setupCamera() {
    const cam = this.cameras.main;
    cam.setBounds(0, 0, this.stage.world.width, this.stage.world.height);
    cam.setBackgroundColor(0x176b9f);
    cam.startFollow(this.player, true, 0.1, 0.1);
    cam.fadeIn(900, 0, 0, 0);
  }

  buildMinimap() {
    const { width: W, height: H } = this.stage.world;
    const mw = MINIMAP_WIDTH;
    const mh = Math.round((mw * H) / W);
    const x = 1280 - mw - 14;
    const y = 14;
    this.miniFrame = this.add.rectangle(x - 3, y - 3, mw + 6, mh + 6, 0x0b1f33, 0.9)
      .setOrigin(0, 0).setScrollFactor(0).setStrokeStyle(2, 0xf6c56e, 0.75).setDepth(9500);
    this.mini = this.cameras.add(x, y, mw, mh).setZoom(mw / W).setName("minimap");
    this.mini.setBounds(0, 0, W, H);
    this.mini.centerOn(W / 2, H / 2);
    this.mini.setBackgroundColor(0x0b1f33);

    this.fog = this.add.graphics().setDepth(9800);
    this.miniPlayer = this.add.circle(0, 0, 40, 0xffffff).setStrokeStyle(14, 0xe2763a).setDepth(9900);
    this.miniGoal = this.add.star(this.goalFx.cx, this.goalFx.cy, 5, 40, 80, 0xf6c56e).setDepth(9900).setVisible(false);
    this.seen = new Set();
    for (const key of this.session.cells) this.revealAround(key);
    this.redrawFog();

    this.cameras.main.ignore([this.fog, this.miniPlayer, this.miniGoal]);
    this.mini.ignore([
      this.miniFrame, this.facingNub, this.dust, this.burstFx, this.splashFx, this.goalFx.label,
      ...this.lighting, ...this.ambient, ...this.mainOnly, ...this.decor
    ]);
  }

  /** Objek yang hanya untuk kamera utama (efek, teks melayang). */
  mainCameraOnly(obj) {
    this.mini?.ignore(obj);
    return obj;
  }

  revealAround(key) {
    const [cx, cy] = key.split(",").map(Number);
    for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) this.seen.add(`${cx + dx},${cy + dy}`);
  }

  redrawFog() {
    const { width: W, height: H } = this.stage.world;
    this.fog.clear().fillStyle(0x23384d, 0.96);
    for (let cy = 0; cy * CELL_SIZE < H; cy++) {
      for (let cx = 0; cx * CELL_SIZE < W; cx++) {
        if (!this.seen.has(`${cx},${cy}`)) this.fog.fillRect(cx * CELL_SIZE, cy * CELL_SIZE, CELL_SIZE, CELL_SIZE);
      }
    }
  }

  visitCell(force = false) {
    const c = this.player.body.center;
    if (this.session.visit(c.x, c.y) || force) {
      this.revealAround(cellKey(c.x, c.y));
      this.redrawFog();
    }
  }

  // ---------- input ----------

  setupInput() {
    const kb = this.input.keyboard;
    this.cursors = kb.createCursorKeys();
    this.keys = kb.addKeys("W,A,S,D");
    this.moveVector = new Phaser.Math.Vector2();

    const on = (name, fn) => kb.on(`keydown-${name}`, (e) => !e.repeat && fn());
    on("E", () => this.onConfirm());
    on("SPACE", () => this.onConfirm());
    on("ENTER", () => this.onConfirm());
    on("ESC", () => this.onCancel());
    on("I", () => this.toggleInventory());
    on("J", () => this.toggleJournal());
    const dev = !!window.__ioc;
    if (dev) on("P", () => this.toggleAnalysisPreview());
    on("M", () => this.toggleMinimap());
    on("N", () => ui.toast(toggleMute() ? "Suara dimatikan" : "Suara dinyalakan"));
    if (dev) on("CLOSED_BRACKET", () => this.devSkipStage());
    on("UP", () => this.onNav(-1));
    on("W", () => this.onNav(-1));
    on("DOWN", () => this.onNav(1));
    on("S", () => this.onNav(1));
    kb.on("keydown", (e) => {
      unlockAudio();
      if (this.mode !== "puzzle" || e.repeat) return;
      if (/^[1-9]$/.test(e.key)) this.puzzleInput(Number(e.key) - 1);
      else if (e.key === "Backspace") this.puzzleBack();
    });
  }

  setupDebug() {
    const world = this.physics.world;
    world.createDebugGraphic();
    world.drawDebug = false;
    world.debugGraphic.clear();
    this.mainCameraOnly(world.debugGraphic);
    this.input.keyboard.on("keydown-B", () => {
      world.drawDebug = !world.drawDebug;
      if (!world.drawDebug) world.debugGraphic.clear();
    });
    this.input.keyboard.on("keydown-L", () => console.table(gameState.log));
  }

  setMode(mode) {
    this.mode = mode;
    this.currentTarget = null;
    ui.showPrompt(null);
    // Kartu judul stage tidak boleh menutupi panel yang sedang dibuka.
    if (mode !== "play" && mode !== "cutscene") ui.hideStageCard();
  }

  onConfirm() {
    if (this.mode === "play") {
      const target = this.findInteractable();
      if (target) this.openInteraction(target);
    } else if (this.mode === "dialog") {
      this.closeDialog();
    } else if (this.mode === "menu") {
      this.pickMenu(this.menu.selected);
    } else if (this.mode === "puzzle") {
      this.puzzleSubmit();
    } else if (this.mode === "gameover") {
      this.retryFromStart();
    } else if (this.mode === "pause") {
      ui.pausePick();
    }
  }

  onCancel() {
    if (this.mode === "play") this.openPause();
    else if (this.mode === "pause") this.closePause();
    else if (this.mode === "menu") this.cancelMenu();
    else if (this.mode === "dialog") this.closeDialog();
    else if (this.mode === "puzzle") this.closePuzzle();
    else if (this.mode === "inventory") this.toggleInventory();
    else if (this.mode === "journal") this.closeJournal();
    else if (this.mode === "analysis") this.toggleAnalysisPreview();
  }

  onNav(dir) {
    if (this.mode === "pause") {
      ui.setPauseSelected(this.pauseIndex = (this.pauseIndex || 0) + dir);
      sfx.ui();
      return;
    }
    if (this.mode !== "menu") return;
    const count = this.menu.options.length;
    this.menu.selected = (this.menu.selected + dir + count) % count;
    ui.setMenuSelected(this.menu.selected);
    sfx.ui();
  }

  toggleMinimap() {
    const visible = !this.mini.visible;
    this.mini.setVisible(visible);
    this.miniFrame.setVisible(visible);
  }

  // ---------- menu jeda ----------

  openPause() {
    this.setMode("pause");
    this.pauseIndex = 0;
    this.physics.pause();
    this.tweens.pauseAll();
    sfx.open();
    this.session.panelOpened("pause");
    ui.showPause({
      onResume: () => this.closePause(),
      onMenu: () => this.returnToMenu()
    });
  }

  closePause() {
    if (this.mode !== "pause") return;
    ui.hidePause();
    this.physics.resume();
    this.tweens.resumeAll();
    sfx.close();
    this.setMode("play");
  }

  /** Kembali ke menu utama (progres tersimpan di awal stage). */
  returnToMenu() {
    this.physics.resume();
    this.tweens.resumeAll();
    ui.hideAllPanels();
    this.mode = "menu-exit";
    setAmbience(null);
    window.dispatchEvent(new CustomEvent("ioc:return-to-menu"));
  }

  updateObjective() {
    const o = this.stage.objective;
    if (!o) return ui.setObjective(null);
    ui.setObjective(this.session.isGoalUnlocked() ? o.after : o.before);
  }

  // ---------- menu generik ----------

  // options: [{ label, enabled?, cancel? }]; onPick(option, index); onCancel()
  openChoice(title, options, onPick, onCancel) {
    this.setMode("menu");
    this.menu = { options, onPick, onCancel, selected: 0 };
    ui.showMenu(title, options.map((o) => ({ label: o.label, enabled: o.enabled !== false })), 0, (i) => this.pickMenu(i));
    sfx.open();
  }

  closeMenu() {
    const menu = this.menu;
    ui.hideMenu();
    this.menu = null;
    this.setMode("play");
    return menu;
  }

  pickMenu(index) {
    if (this.mode !== "menu") return;
    const menu = this.closeMenu();
    const option = menu.options[index];
    if (!option || option.cancel) menu.onCancel?.();
    else menu.onPick(option, index);
  }

  cancelMenu() {
    if (this.mode !== "menu") return;
    sfx.close();
    this.closeMenu().onCancel?.();
  }

  // ---------- interaksi ----------

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
    const { list, mode, text } = this.session.interact(target.def.id);
    if (mode === "examine") return this.showDialog(text);
    if (mode === "auto") return this.runAction(target, list[0].action);

    const options = list.map((entry) => ({ label: entry.action.text, enabled: entry.enabled, entry }));
    options.push({ label: "Batal", cancel: true });
    this.openChoice(target.def.label, options, ({ entry }) => {
      if (!entry.enabled) {
        sfx.fail();
        this.showDialog(this.session.blocked(target.def.id, entry.action.id));
      } else if (entry.action.puzzle) {
        this.openPuzzle(target, entry.action);
      } else {
        this.runAction(target, entry.action);
      }
    }, () => this.session.cancel(target.def.id));
  }

  runAction(target, action) {
    this.applyResult(target, action, this.session.perform(target.def.id, action.id));
  }

  applyResult(target, action, result) {
    if (result.fatal) return this.playFatal(result.fatal);
    if (result.setback) return this.playSetback(result.setback);
    if (!result.ok) {
      sfx.fail();
      return this.showDialog(result.dialog);
    }
    result.gained.forEach((g, i) => {
      this.time.delayedCall(i * 180, () => this.floatText(target.x, target.y - target.h / 2, `+ ${itemLabel(g.id, g.n)}`, "#ffe9a8"));
    });
    if (result.gained.length) {
      sfx.pickup();
      ui.toast(`Mendapat: ${result.gained.map((g) => itemLabel(g.id, g.n)).join(", ")}`);
    }
    if (action.discoveryId) {
      sfx.discover();
      this.burst(target.x, target.y - 10, 10);
      ui.toast(`Dicatat di jurnal: ${action.discoveryTitle || target.def.label}`);
    }
    if (result.removed) this.removeInteractable(target);
    if (result.resolvedChallenge) this.onChallengeResolved(result.resolvedChallenge, result.strategy, target);
    this.refreshWorld();
    if (result.moveTo) return this.travelTo(result.moveTo, () => this.showDialog(result.dialog));
    this.showDialog(result.dialog);
  }

  onChallengeResolved(challengeId, strategy, target) {
    const challenge = this.stage.challenges[challengeId];
    const strat = challenge.strategies[strategy] || {};
    if (strat.opens) {
      const gate = this.gates.get(`${challengeId}:${strat.opens}`);
      if (gate) {
        if (gate.def.style === "stone_door") sfx.rumble();
        else sfx.whoosh();
        openGate(this, gate);
        drawCrossingVisual(this, gate.def, strat.visual);
      }
    }
    if (challenge.resolveFx === "ship_arrival") this.shipArrival(strategy);
    if (strategy === "signal_fire") this.lightFire(target);
    if (challengeId === this.stage.mainChallenge) {
      sfx.success();
      this.cameras.main.flash(500, 255, 240, 200, false);
      this.burst(target.x, target.y, 28);
      ui.toast(challenge.resolveFx ? "Pertolongan datang!" : "Jalan terbuka!");
    } else {
      sfx.success();
      this.burst(target.x, target.y, 16);
    }
  }

  removeInteractable(target) {
    this.interactables = this.interactables.filter((it) => it !== target);
    target.marker?.destroy();
    if (target.solid) this.solids.remove(target.sprite, true, true);
    else target.sprite.destroy();
    if (target.def.onRemove?.stump) {
      this.add.ellipse(target.x, target.y + target.h / 2 - 10, 34, 14, 0x8b5a2b).setStrokeStyle(2, 0x4a2f12).setDepth(target.y + 8);
      this.burst(target.x, target.y, 14);
    }
  }

  // Tampilan objek mengikuti state: reaktif, tanda penemuan, penanda interaksi, tujuan.
  refreshWorld() {
    for (const entry of this.interactables) {
      if (!entry.sprite?.active) continue;
      const reactive = entry.def.reactive;
      if (reactive && gameState.flags[reactive.flag]) {
        entry.sprite.setTint(reactive.tint ?? 0xd5b47c).setScale(1, reactive.scaleY ?? 1);
        entry.sprite.refreshBody?.();
      } else {
        const discoveryId = entry.def.actions?.find((a) => a.discoveryId)?.discoveryId;
        if (discoveryId && gameState.flags[`discovery_${discoveryId}`]) entry.sprite.setTint(0xe8dcb8);
      }
      if (entry.marker) entry.marker.setVisible(listActions(entry.def, gameState).length > 0);
    }
    const unlocked = this.session.isGoalUnlocked();
    this.goalFx.setUnlocked(unlocked);
    this.miniGoal?.setVisible(unlocked);
    this.updateObjective();
  }

  // ---------- efek ----------

  floatText(x, y, text, color = "#ffffff") {
    const t = this.add.text(x, y, text, { fontFamily: FONT, fontSize: "16px", fontStyle: "bold", color, stroke: "#12263a", strokeThickness: 4 })
      .setOrigin(0.5, 1).setDepth(9990);
    this.mainCameraOnly(t);
    this.tweens.add({ targets: t, y: y - 46, alpha: 0, duration: 1400, ease: "Cubic.easeOut", onComplete: () => t.destroy() });
  }

  burst(x, y, n = 12) {
    this.burstFx.explode(n, x, y);
  }

  splash(x, y, n = 18) {
    this.splashFx.explode(n, x, y);
  }

  travelTo(point, done) {
    this.setMode("cutscene");
    this.player.body.enable = false;
    sfx.whoosh();
    this.tweens.add({
      targets: this.player, x: point.x, y: point.y, duration: 1100, ease: "Sine.easeInOut",
      onUpdate: (tw) => this.player.setScale(1 + Math.sin(tw.progress * Math.PI) * 0.25),
      onComplete: () => {
        this.player.setScale(1);
        this.player.body.enable = true;
        this.player.body.reset(point.x, point.y);
        this.burst(point.x, point.y + 16, 8);
        this.setMode("play");
        done?.();
      }
    });
  }

  lightFire(target) {
    sfx.fire();
    this.fireFx = this.add.particles(target.x, target.y - 6, "px_flame", {
      lifespan: 900, speedY: { min: -120, max: -60 }, speedX: { min: -20, max: 20 },
      scale: { start: 1.4, end: 0.2 }, alpha: { start: 1, end: 0 }, tint: [0xffd27a, 0xff8a3a, 0xff5a2a],
      blendMode: "ADD", frequency: 35
    }).setDepth(target.y + 30);
    const smoke = this.add.particles(target.x, target.y - 30, "px_glow", {
      lifespan: 4000, speedY: { min: -70, max: -40 }, speedX: { min: 10, max: 40 },
      scale: { start: 1.5, end: 6 }, alpha: { start: 0.35, end: 0 }, tint: 0x8a8a8a, frequency: 120
    }).setDepth(7700);
    this.mainCameraOnly(smoke);
  }

  shipArrival(strategy) {
    const { width } = this.stage.world;
    const g = this.stage.goal;
    const ship = this.add.image(width + 260, g.y + g.h / 2 - 20, "ship").setDepth(g.y + g.h + 60);
    const wake = this.add.particles(0, 0, "px_dot", {
      follow: ship, followOffset: { x: 80, y: 40 }, lifespan: 900, speedX: { min: 20, max: 60 },
      scale: { start: 0.8, end: 0 }, alpha: { start: 0.7, end: 0 }, frequency: 40
    }).setDepth(ship.depth - 1);
    this.time.delayedCall(strategy === "raft_escape" ? 200 : 900, () => sfx.horn());
    this.tweens.add({
      targets: ship, x: g.x + g.w + 70, duration: 5200, ease: "Sine.easeOut",
      onComplete: () => {
        wake.emitting = false;
        this.tweens.add({ targets: ship, y: ship.y - 4, duration: 1400, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
        ui.toast(`Kapal menunggu di ${g.label || "tujuan"}`);
      }
    });
  }

  // ---------- teka-teki ----------

  openPuzzle(target, action) {
    const def = this.session.openPuzzle(target.def.id, action.id);
    this.setMode("puzzle");
    sfx.open();
    this.puzzle = { target, action, def, input: [], history: [] };
    ui.showPuzzle(def, {
      onSymbol: (i) => this.puzzleInput(i),
      onBack: () => this.puzzleBack(),
      onSubmit: () => this.puzzleSubmit(),
      onClose: () => this.closePuzzle()
    });
  }

  puzzleInput(i) {
    const p = this.puzzle;
    if (!p || !p.def.symbols[i] || p.input.length >= p.def.solution.length) return;
    p.input.push(p.def.symbols[i].id);
    sfx.key(i);
    ui.updatePuzzle({ input: p.input, history: p.history, message: " " });
  }

  puzzleBack() {
    const p = this.puzzle;
    if (!p) return;
    p.input.pop();
    ui.updatePuzzle({ input: p.input, history: p.history });
  }

  puzzleSubmit() {
    const p = this.puzzle;
    if (!p) return;
    const len = p.def.solution.length;
    if (p.input.length < len) {
      sfx.wrong();
      ui.updatePuzzle({ input: p.input, history: p.history, message: `Masukkan ${len} simbol dulu.`, kind: "wrong" });
      return;
    }
    const r = this.session.submitPuzzle(p.target.def.id, p.action.id, [...p.input]);
    p.history.push({ input: [...p.input], exact: r.exact });
    p.input = [];
    if (!r.correct) {
      sfx.wrong();
      ui.updatePuzzle({ input: [], history: p.history, message: `${r.exact} dari ${len} simbol sudah di posisi yang tepat.`, kind: "wrong" });
      return;
    }
    ui.hidePuzzle();
    this.puzzle = null;
    this.setMode("play");
    this.applyResult(p.target, p.action, r.result);
  }

  closePuzzle() {
    const p = this.puzzle;
    if (!p) return;
    this.session.closePuzzle(p.target.def.id, p.action.id);
    ui.hidePuzzle();
    this.puzzle = null;
    sfx.close();
    this.setMode("play");
  }

  // ---------- kegagalan ----------

  playFatal(fatal) {
    this.setMode("cutscene");
    this.player.body.enable = false;
    this.facingNub.setVisible(false);
    this.dust.emitting = false;
    ui.toast(fatal.toast || "Percobaan gagal!");
    sfx.splash();
    this.cameras.main.shake(600, 0.006);
    const finish = () => {
      this.player.setTint(0x8da8b8);
      this.splash(this.player.x, this.player.y, 30);
      sfx.fail();
      this.session.completeFatal(fatal);
      this.cameras.main.fade(700, 10, 30, 50, true, (cam, progress) => {
        if (progress < 1) return;
        this.setMode("gameover");
        ui.showGameOver(fatal.title || "Percobaan gagal", fatal.text || "", () => this.retryFromStart());
      });
    };
    if (!fatal.moveTo) return finish();
    this.tweens.add({
      targets: this.player, x: fatal.moveTo.x, y: fatal.moveTo.y, angle: 160, duration: 1000, ease: "Sine.easeIn",
      onUpdate: () => { if (Math.random() < 0.3) this.splash(this.player.x, this.player.y, 4); },
      onComplete: finish
    });
  }

  playSetback(setback) {
    this.setMode("cutscene");
    this.player.body.enable = false;
    sfx.thud();
    this.cameras.main.shake(400, 0.008);
    ui.toast(setback.toast || "Ups!");
    const to = setback.respawn || { x: this.player.x, y: this.player.y + 60 };
    this.tweens.add({
      targets: this.player, x: to.x, y: to.y, duration: 700, ease: "Bounce.easeOut",
      onComplete: () => {
        this.player.body.enable = true;
        this.player.body.reset(to.x, to.y);
        this.burst(to.x, to.y + 14, 6);
        this.session.completeSetback(setback);
        this.setMode("play");
        this.showDialog(setback.text || "Kamu terjatuh.");
      }
    });
  }

  retryFromStart() {
    if (this.mode !== "gameover") return;
    this.mode = "restarting";
    ui.hideGameOver();
    this.scene.restart(this.session.retry());
  }

  // ---------- tujuan & akhir stage ----------

  checkGoal() {
    const g = this.stage.goal;
    const p = this.player.body.center;
    const inside = p.x >= g.x && p.x <= g.x + g.w && p.y >= g.y && p.y <= g.y + g.h;
    if (!inside) {
      this.inGoal = false;
      return;
    }
    if (this.inGoal) return;
    this.inGoal = true;
    if (!this.session.reachGoal()) return;
    const last = stageIndex(this.stage.id) === STAGES.length - 1;
    this.openChoice("Kamu mencapai tujuan", [
      { label: last ? "Naik ke kapal & pulang" : `Selesaikan ${this.stage.name}` },
      { label: "Jelajahi dulu", cancel: true }
    ], () => this.finishStage(), () => {
      this.session.keepExploring();
      ui.toast("Kembali ke area tujuan kapan saja untuk melanjutkan");
    });
  }

  finishStage() {
    this.session.finish();
    sfx.success();
    const next = this.session.nextStart();
    this.setMode("cutscene");
    this.player.setVelocity(0, 0);
    this.dust.emitting = false;
    this.cameras.main.fade(1000, 0, 0, 0, true, (cam, progress) => {
      if (progress < 1) return;
      if (next) this.scene.restart(next);
      else this.showEnding();
    });
  }

  showEnding() {
    clearProgress();
    playMusic("ending");
    setAmbience(null);
    this.cameras.main.fadeIn(1200, 0, 0, 0);
    ui.showStageCard({
      kicker: "AKHIR PERJALANAN",
      title: "Kamu selamat!",
      text: "Kapal membawamu pulang. Setiap pilihan di pulau ini meninggalkan jejak. Mari lihat seperti apa caramu menjelajah."
    }, 3400);
    this.time.delayedCall(4000, () => this.showFinalResult());
  }

  showFinalResult() {
    const report = buildEvidenceReport(gameState);
    try {
      localStorage.setItem(REPORT_STORAGE_KEY, JSON.stringify(report));
    } catch {
      // Penyimpanan bisa diblokir browser; laporan tetap bisa diunduh.
    }
    this.setMode("result");
    ui.showResult(report, {
      onDownload: () => ui.downloadJson("island-of-choices-report.json", report),
      onRestart: () => this.newSession(),
      onMenu: () => this.returnToMenu()
    });
    ui.setResultStatus("Menyimpan ke server…");
    submitSession(gameState.log).then((r) => {
      if (this.mode !== "result") return;
      if (r.ok) ui.setResultStatus(`Tersimpan di server · sesi ${r.data.sessionId.slice(0, 8)} · profil server: ${r.data.headline}`, "ok");
      else ui.setResultStatus(`Tidak tersimpan ke server (${r.error}). Laporan tetap bisa diunduh.`, "warn");
    });
  }

  newSession() {
    ui.hideResult();
    clearProgress();
    newTelemetrySession();
    this.mode = "restarting";
    this.scene.restart({ stageId: firstStageId(), priorLog: [], startedAt: Date.now(), attempt: 1, reason: "new_session", inventory: {} });
  }

  /** Alat demo (mode ?dev): selesaikan stage ini seketika untuk melompat ke stage berikutnya. */
  devSkipStage() {
    if (this.mode !== "play") return;
    for (const flag of this.stage.goal.requiresFlags || []) gameState.flags[flag] = true;
    this.session.log("dev_skip", {});
    this.finishStage();
  }

  // ---------- panel ----------

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
      this.session.panelOpened("inventory");
      sfx.open();
      ui.showInventory(Object.entries(gameState.inventory).map(([id, count]) => ({ ...ITEMS[id], count })));
    } else if (this.mode === "inventory") {
      ui.hideInventory();
      sfx.close();
      this.setMode("play");
    }
  }

  toggleJournal() {
    if (this.mode === "play") {
      this.setMode("journal");
      this.session.panelOpened("journal");
      sfx.open();
      ui.showJournal(buildJournalSnapshot(gameState, this.stage), () => this.closeJournal(),
        () => ui.downloadJson("island-of-choices-report.json", buildEvidenceReport(gameState)));
    } else if (this.mode === "journal") {
      this.closeJournal();
    }
  }

  closeJournal() {
    if (this.mode !== "journal") return;
    ui.hideJournal();
    sfx.close();
    this.setMode("play");
  }

  // Alat demo: lihat analisis yang sedang terbentuk (tidak dicatat sebagai event).
  toggleAnalysisPreview() {
    if (this.mode === "play") {
      this.setMode("analysis");
      const report = buildEvidenceReport(gameState);
      ui.showResult(report, {
        preview: true,
        onClose: () => this.toggleAnalysisPreview(),
        onDownload: () => ui.downloadJson("island-of-choices-report.json", report)
      });
    } else if (this.mode === "analysis") {
      ui.hideResult();
      this.setMode("play");
    }
  }

  updateZoneContext() {
    const p = this.player.body.center;
    const zone = zoneAt(this.stage, p.x, p.y);
    if (!zone || zone.id === this.session.zone) return;
    this.session.enterZone(zone.id);
    ui.showLocation(zone.title, zone.hint);
  }

  // ---------- loop ----------

  update(time, delta) {
    const dt = delta / 1000;
    for (const w of this.waterAnim) {
      w.ts.tilePositionX -= w.fx * dt;
      w.ts.tilePositionY -= w.fy * dt;
    }
    for (const gate of this.gates.values()) {
      if (gate.def.style === "rapids") gate.visual.tilePositionY -= 170 * dt;
      if (gate.def.style === "waterfall") gate.visual.tilePositionY -= 230 * dt;
    }

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

    const moving = dx !== 0 || dy !== 0;
    if (moving) {
      this.moveVector.set(dx, dy).normalize();
      this.player.setVelocity(this.moveVector.x * PLAYER_SPEED, this.moveVector.y * PLAYER_SPEED);
      this.facing.copy(this.moveVector);
      if (dx < 0) this.player.setFlipX(true);
      else if (dx > 0) this.player.setFlipX(false);
      this.walkT += delta;
      this.player.setRotation(Math.sin(this.walkT * 0.018) * 0.07);
    } else if (this.player.body.enable) {
      this.player.setVelocity(0, 0);
      if (this.mode !== "cutscene") this.player.setRotation(0);
    }
    this.dust.emitting = moving && this.mode === "play";

    if (this.mode === "play") {
      const moved = Phaser.Math.Distance.Between(this.lastPos.x, this.lastPos.y, this.player.x, this.player.y);
      if (moved < 50) {
        this.session.addDistance(moved);
        this.stepDist += moved;
        if (this.stepDist > 52) {
          this.stepDist = 0;
          const surface = this.stage.id === "stage2" ? "daun" : this.stage.id === "stage3" ? "batu" : "pasir";
          sfx.step(surface);
        }
      }
      this.updateZoneContext();
      this.visitCell();
      const target = this.findInteractable();
      if (target !== this.currentTarget) {
        this.currentTarget?.marker?.setScale(1);
        this.currentTarget = target;
        target?.marker?.setScale(1.4);
        ui.showPrompt(target ? target.def.label : null);
      }
    }
    this.lastPos.x = this.player.x;
    this.lastPos.y = this.player.y;

    const depth = this.player.y + 21;
    this.player.setDepth(depth);
    this.facingNub.setPosition(this.player.x + this.facing.x * 20, this.player.y + 4 + this.facing.y * 16);
    this.facingNub.setDepth(depth + 1);
    this.miniPlayer.setPosition(this.player.x, this.player.y);
    if (this.mode === "play") this.checkGoal();
  }
}
