import { fileURLToPath } from "node:url";
import { createApp } from "./app.js";

const PORT = Number(process.env.PORT) || 8787;
const dataDir = process.env.IOC_DATA_DIR || fileURLToPath(new URL("../data/sessions", import.meta.url));
const staticDir = fileURLToPath(new URL("../dist", import.meta.url));

createApp({ dataDir, staticDir }).listen(PORT, () => {
  console.log(`Island of Choices server  http://localhost:${PORT}`);
  console.log(`  game (build)   http://localhost:${PORT}/?dev`);
  console.log(`  dashboard      http://localhost:${PORT}/dashboard`);
  console.log(`  data           ${dataDir}`);
});
