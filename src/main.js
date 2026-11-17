import Phaser from "phaser";
import "./style.css";
import "./intro.css";
import BootScene from "./scenes/BootScene.js";
import StageScene from "./scenes/StageScene.js";
import { firstStageId } from "./data/stages.js";
import { mountUi, hideAllPanels } from "./ui/ui.js";
import { mountIntro } from "./ui/intro.js";
import { gameState } from "./systems/GameState.js";
import { installExitBeacon, newSession, resumeSession } from "./systems/Telemetry.js";
import { loadProgress, clearProgress } from "./systems/SaveGame.js";
import { unlockAudio } from "./audio/sound.js";

// UI gameplay (HUD, panel) terpisah dari bagian depan (intro.js).
mountUi();
installExitBeacon(() => gameState.log);

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: "game-container",
  width: 1280,
  height: 720,
  backgroundColor: "#0b1f33",
  render: { roundPixels: true },
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  physics: { default: "arcade", arcade: { debug: false } },
  scene: [BootScene, StageScene]
});

function startGame(data) {
  unlockAudio();
  hideAllPanels();
  document.body.classList.add("is-playing");
  game.scene.start("Stage", data);
}

function newGame({ priorLog = [], startedAt = Date.now() } = {}) {
  clearProgress();
  newSession();
  startGame({ stageId: firstStageId(), priorLog, startedAt, attempt: 1, reason: "new_game", inventory: {} });
}

function continueGame(save) {
  resumeSession(save.sessionId);
  // Geser waktu awal agar jeda saat aplikasi ditutup tidak terhitung sebagai durasi bermain.
  const lastT = save.log.at(-1)?.t || 0;
  startGame({
    stageId: save.stageId,
    priorLog: save.log,
    startedAt: Date.now() - lastT - 1000,
    attempt: (save.attempt || 1) + 1,
    reason: "resume",
    inventory: save.inventory || {}
  });
}

// Mode demo: buka dengan ?dev untuk melewati bagian depan dan langsung bermain.
const devMode = new URLSearchParams(window.location.search).has("dev");

if (devMode) {
  window.__ioc = { game, gameState }; // akses konsol untuk demo/debug; P = analisis live, ] = lompat stage
  const begin = () => newGame();
  if (window.__iocAssetsReady) begin();
  else window.addEventListener("ioc:assets-ready", begin, { once: true });
  window.addEventListener("ioc:return-to-menu", () => { window.location.href = window.location.pathname; });
} else {
  const intro = mountIntro({ onNewGame: newGame, onContinue: continueGame, getSave: loadProgress });
  window.addEventListener("ioc:return-to-menu", () => {
    game.scene.stop("Stage");
    game.input.keyboard?.clearCaptures();
    document.body.classList.remove("is-playing");
    intro.showMenu();
  });
}

export default game;
