// Mengisi server dengan sesi contoh dari persona simulasi (untuk demo dashboard).
//   npm run seed            (server harus sudah berjalan: npm run server)
import { PERSONAS } from "../src/sim/personas.js";
import { runPlaythrough } from "../src/sim/playthrough.js";

const SERVER = process.env.IOC_SERVER || `http://localhost:${process.env.PORT || 8787}`;

for (const persona of PERSONAS) {
  const state = runPlaythrough(persona.steps, { stepMs: persona.stepMs });
  const res = await fetch(`${SERVER}/api/sessions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sessionId: `demo-${persona.id}`,
      player: { id: `demo-player-${persona.id}`, name: `[Demo] ${persona.name}` },
      final: true,
      client: { version: "seed" },
      log: state.log
    })
  }).catch((err) => ({ ok: false, status: err.message }));
  if (!res.ok) {
    console.error(`Gagal mengirim ${persona.id}: ${res.status}. Apakah server berjalan di ${SERVER}?`);
    process.exit(1);
  }
  const data = await res.json();
  console.log(`✓ ${persona.name.padEnd(36)} → ${data.headline}`);
}
console.log(`\nDashboard: ${SERVER}/dashboard  (atau http://localhost:5173/dashboard.html saat npm run dev)`);
