import { defineConfig } from "vite";
import { fileURLToPath } from "node:url";

const API = `http://localhost:${process.env.PORT || 8787}`;
const page = (file) => fileURLToPath(new URL(file, import.meta.url));

export default defineConfig({
  // Saat dev, /api diteruskan ke server Node (npm run server).
  server: { proxy: { "/api": API } },
  preview: { proxy: { "/api": API } },
  build: {
    chunkSizeWarningLimit: 1600, // Phaser memang ~1.2 MB
    rolldownOptions: {
      input: { main: page("./index.html"), dashboard: page("./dashboard.html") }
    }
  }
});
