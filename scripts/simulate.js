// Demo mesin analisis tanpa browser:  npm run simulate  [-- --json] [-- <personaId>]
import { PERSONAS } from "../src/sim/personas.js";
import { runPlaythrough } from "../src/sim/playthrough.js";
import { buildEvidenceReport } from "../src/systems/Evidence.js";

const args = process.argv.slice(2);
const asJson = args.includes("--json");
const only = args.filter((a) => !a.startsWith("--"));
const personas = only.length ? PERSONAS.filter((p) => only.includes(p.id)) : PERSONAS;

function bar(score, width = 21) {
  const pos = Math.round(((score + 1) / 2) * (width - 1));
  return [...Array(width)].map((_, i) => (i === pos ? "●" : i === (width - 1) / 2 ? "┼" : "─")).join("");
}

const results = [];
for (const persona of personas) {
  const state = runPlaythrough(persona.steps, { stepMs: persona.stepMs });
  const report = buildEvidenceReport(state);
  results.push({ persona: persona.id, report });
  if (asJson) continue;

  const { profile } = report;
  console.log(`\n━━ ${persona.name}  (${persona.id})`);
  console.log(`   diharapkan : ${persona.expect}`);
  console.log(`   HASIL      : ${profile.headline}`);
  for (const m of report.stages) {
    const route = (m.main.strategyLabel || "-").padEnd(26);
    console.log(`   ${m.stageName.padEnd(19)}: ${route} percobaan ${m.attempts} · ${Math.round(m.durationMs / 1000)} dtk · peta ${Math.round((m.coverage ?? 0) * 100)}%`);
  }
  if (profile.solutionStyle) {
    console.log(`   gaya solusi: ${profile.solutionStyle.distribution.map((d) => `${d.label} ${Math.round(d.share * 100)}%`).join(", ")}`);
  }
  for (const d of profile.dimensions) {
    const name = d.label.padEnd(28);
    const left = d.poles.negative.padStart(20);
    console.log(`   ${name}${left} ${bar(d.score)} ${d.poles.positive.padEnd(20)} ${String(d.score).padStart(5)}  [${d.confidence}]`);
  }
  console.log(`   narasi     : ${profile.narrative}`);
}

if (asJson) console.log(JSON.stringify(results, null, 2));
