// Menjalankan server API + Vite dev server sekaligus:  npm run dev:all
import { spawn } from "node:child_process";

const procs = [
  spawn(process.execPath, ["server/index.js"], { stdio: "inherit" }),
  spawn("npx", ["vite"], { stdio: "inherit", shell: true })
];

const stop = (code = 0) => {
  for (const p of procs) if (!p.killed) p.kill();
  process.exit(code);
};
process.on("SIGINT", () => stop(0));
process.on("SIGTERM", () => stop(0));
for (const p of procs) p.on("exit", (code) => stop(code ?? 0));
