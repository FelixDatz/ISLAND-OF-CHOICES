import Phaser from "phaser";
import "./style.css";
import "./intro.css";
import BootScene from "./scenes/BootScene.js";
import StageScene from "./scenes/StageScene.js";
import { firstStageId } from "./data/stages.js";
import { mountUi } from "./ui/ui.js";
import { mountIntro } from "./ui/intro.js";
import { gameState } from "./systems/GameState.js";
import { installExitBeacon } from "./systems/Telemetry.js";
import { unlockAudio } from "./audio/sound.js";

// UI gameplay tetap terpisah dari landing page dan prolog.
mountUi();
installExitBeacon(() => gameState.log);

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: "game-container",
  width: 1280,
  height: 720,
  backgroundColor: "#176b9f",
  render: { roundPixels: true },
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  physics: { default: "arcade", arcade: { debug: false } },
  scene: [BootScene, StageScene]
});

function startGame(session) {
  unlockAudio();
  document.body.classList.add("is-playing");
  game.scene.start("Stage", {
    stageId: firstStageId(),
    priorLog: session.priorLog,
    startedAt: session.startedAt,
    attempt: 1,
    reason: session.reason || "prologue_completed"
  });
}

// Mode demo: buka dengan ?dev untuk melewati opening dan langsung bermain.
const devMode = new URLSearchParams(window.location.search).has("dev");

if (devMode) {
  window.__ioc = { game, gameState }; // akses konsol untuk demo/debug; tombol ] = lompat stage
  const begin = () => startGame({ priorLog: [], startedAt: gameState.startedAt, reason: "dev_skip_intro" });
  if (window.__iocAssetsReady) begin();
  else window.addEventListener("ioc:assets-ready", begin, { once: true });
} else {
  mountIntro({ startGame });
}

export default game;
