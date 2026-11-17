import Phaser from "phaser";
import { generateTextures } from "../art/textures.js";

// Membuat semua texture prosedural. Saat art final siap, muat gambar di
// preload() dengan key yang sama (lihat data/assets.js) dan lewati generateTextures.
export default class BootScene extends Phaser.Scene {
  constructor() {
    super("Boot");
  }

  create() {
    generateTextures(this);
    // Tunggu pemain menyelesaikan opening sebelum memulai Stage 1.
    this.scene.stop();
    window.__iocAssetsReady = true;
    window.dispatchEvent(new Event("ioc:assets-ready"));
  }
}
