import Phaser from "phaser";
import { PLACEHOLDERS } from "../data/assets.js";

// Membuat texture placeholder. Saat art asli siap, ganti isi create()
// dengan this.load.image(key, "path/ke/gambar.png") di preload() untuk key yang sama.
export default class BootScene extends Phaser.Scene {
  constructor() {
    super("Boot");
  }

  create() {
    for (const [key, def] of Object.entries(PLACEHOLDERS)) {
      const g = this.make.graphics({ x: 0, y: 0 }, false);
      g.fillStyle(def.color, 1);
      g.fillRoundedRect(0, 0, def.w, def.h, 6);
      g.lineStyle(2, def.outline, 1);
      g.strokeRoundedRect(1, 1, def.w - 2, def.h - 2, 6);
      g.generateTexture(key, def.w, def.h);
      g.destroy();
    }
    // Siapkan texture lebih dulu, tetapi tunggu pemain menyelesaikan prolog
    // sebelum memulai Stage 1. Landing page dikelola oleh lapisan HTML.
    this.scene.stop();
    window.__iocAssetsReady = true;
    window.dispatchEvent(new Event("ioc:assets-ready"));
  }
}
