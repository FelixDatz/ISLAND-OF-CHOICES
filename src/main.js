import Phaser from "phaser";
import "./style.css";
import "./intro.css";
import BootScene from "./scenes/BootScene.js";
import Stage1Scene from "./scenes/Stage1Scene.js";
import { mountUi } from "./ui/ui.js";
import { mountIntro } from "./ui/intro.js";

// UI gameplay tetap terpisah dari landing page dan prolog.
mountUi();

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: "game-container",
  width: 1280,
  height: 720,
  backgroundColor: "#176b9f",
  render: { roundPixels: true },
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  physics: { default: "arcade", arcade: { debug: false } },
  scene: [BootScene, Stage1Scene]
});

mountIntro({
  startGame: (session) => {
    document.body.classList.add("is-playing");
    game.scene.start("Stage1", {
      priorLog: session.priorLog,
      startedAt: session.startedAt,
      attempt: 1,
      reason: "prologue_completed"
    });
  }
});

export default game;
