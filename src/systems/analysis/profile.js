import { DIMENSIONS, SOLUTION_STYLES } from "../../data/taxonomy.js";
import { ITEMS } from "../../data/items.js";

// Profil gaya bermain berbasis bukti.
// Setiap dimensi: skor -1..1 (positif = kutub `positive` di taxonomy.js),
// tingkat keyakinan dari banyaknya bukti, dan daftar bukti yang bisa dibaca pemain.

const clamp = (v, lo = -1, hi = 1) => Math.max(lo, Math.min(hi, v));
const ratio = (a, b) => (b > 0 ? a / b : 0);
const round = (v) => Math.round(v * 100) / 100;
const seconds = (ms) => Math.round(ms / 1000);
const listText = (items) => (items.length ? items.join(", ") : "-");
const itemNames = (ids) => ids.map((id) => ITEMS[id]?.name || id);

const SCORERS = {
  exploration(m) {
    const discTotal = m.optional.total + m.clues.total;
    const discFound = m.optional.found.length + m.clues.found.length;
    const discRatio = ratio(discFound, discTotal);
    const zoneRatio = ratio(m.zones.visited.length, m.zones.total);
    const chRatio = ratio(m.optionalChallenges.solved.length, m.optionalChallenges.total);
    const lingered = m.afterGoal.deferred > 0 || m.afterGoal.actionsAfterGoal > 0;
    // Cakupan peta dinormalisasi: menjelajahi ~70% sel terjangkau sudah dianggap penuh.
    const coverage = m.coverage === null ? zoneRatio : Math.min(1, m.coverage / 0.7);
    const v = 0.4 * discRatio + 0.2 * coverage + 0.25 * chRatio + 0.15 * (lingered ? 1 : 0);
    const evidence = [
      { text: `Menemukan ${discFound} dari ${discTotal} hal yang bisa diamati atau ditemukan (opsional: ${listText(m.optional.found)}).` },
      { text: m.optionalChallenges.total
        ? (m.optionalChallenges.solved.length ? `Menyelesaikan ${m.optionalChallenges.solved.length} dari ${m.optionalChallenges.total} tantangan opsional.` : `Tidak menyelesaikan tantangan opsional (${m.optionalChallenges.total} tersedia).`)
        : "Tidak ada tantangan opsional di stage ini." },
      { text: m.coverage === null ? `Mengunjungi ${m.zones.visited.length} dari ${m.zones.total} zona.` : `Menjelajahi ${Math.round(m.coverage * 100)}% area peta yang bisa dilalui (${m.zones.visited.length} dari ${m.zones.total} zona).` }
    ];
    if (m.completed || m.afterGoal.goalVisits) {
      evidence.push({ text: lingered ? "Tetap menjelajah setelah area tujuan terbuka." : "Langsung menyelesaikan stage begitu area tujuan tercapai." });
    }
    return {
      hasData: true,
      score: 2 * v - 1,
      // Jika stage selesai, semua peluang eksplorasi (diambil atau dilewati) adalah bukti.
      signals: m.completed
        ? discTotal + m.optionalChallenges.total + 1
        : discFound + m.optionalChallenges.solved.length + m.afterGoal.deferred,
      evidence
    };
  },

  information(m) {
    const hasDecision = !!m.main.strategy || m.trials.failures > 0;
    if (!hasDecision && m.clues.found.length === 0) return { hasData: false, score: 0, signals: 0, evidence: [{ text: "Belum ada keputusan di tantangan utama." }] };
    const clueRatio = ratio(m.clues.beforeDecisionCount, m.clues.total);
    const informed = m.main.informedBy.length > 0;
    const observe = 0.55 * clueRatio + 0.3 * (informed ? 1 : 0) + 0.15 * Math.min(1, m.trials.lockedViews / 3);
    const nonFatal = m.trials.failures - m.trials.fatal;
    const trial = Math.min(1, (m.trials.blocked + nonFatal + 2 * m.trials.fatal + 0.5 * m.puzzles.wrong) / 4);
    const evidence = [
      { text: `Mengamati ${m.clues.beforeDecisionCount} dari ${m.clues.total} petunjuk lingkungan sebelum keputusan utama${m.clues.beforeDecision.length ? ` (${listText(m.clues.beforeDecision)})` : ""}.` }
    ];
    if (m.main.strategy && m.main.relevantClues.length) {
      evidence.push({ text: informed
        ? `Cara yang dipilih (${m.main.strategyLabel}) sejalan dengan petunjuk yang sudah diamati: ${listText(m.main.informedBy)}.`
        : `Cara yang dipilih (${m.main.strategyLabel}) diambil tanpa mengamati petunjuk yang berkaitan (${listText(m.main.relevantClues)}).` });
    }
    if (m.trials.blocked || m.trials.failures) {
      evidence.push({ text: `${m.trials.failures} percobaan gagal (${m.trials.fatal} fatal, ${m.trials.setbacks} terjatuh/mundur) dan ${m.trials.blocked} kali mencoba aksi yang belum memenuhi syarat.` });
    }
    if (m.puzzles.attempts) {
      const solved = m.puzzles.solved.length > 0;
      evidence.push({ text: !m.puzzles.wrong
        ? `Teka-teki dipecahkan tanpa tebakan salah (${m.puzzles.attempts} kali memasukkan kode).`
        : solved
          ? `Teka-teki: ${m.puzzles.wrong} tebakan salah sebelum benar, artinya jawaban dicari lewat coba-coba.`
          : `Teka-teki: ${m.puzzles.wrong} tebakan salah dan belum terpecahkan.` });
    }
    return {
      hasData: true,
      score: clamp(2 * observe - 1 - 0.6 * trial),
      // Setelah keputusan diambil, setiap petunjuk (diamati atau tidak) ikut menjadi bukti.
      signals: (m.main.strategy ? m.clues.total : m.clues.beforeDecisionCount) + m.trials.blocked + m.trials.failures + Math.min(4, m.puzzles.attempts) + Math.min(3, m.trials.lockedViews),
      evidence
    };
  },

  pace(m) {
    const t = m.pace.timeToFirstDecisionMs;
    if (t === null) return { hasData: false, score: 0, signals: 0, evidence: [{ text: "Belum ada percobaan di tantangan utama." }] };
    const timeScore = clamp((seconds(t) - 90) / 120);
    const interScore = clamp((m.pace.interactionsBeforeDecision - 5) / 5);
    return {
      hasData: true,
      score: 0.5 * timeScore + 0.5 * interScore,
      signals: Math.min(6, m.pace.interactionsBeforeDecision) + 2,
      evidence: [{ text: `Percobaan pertama di tantangan utama dilakukan setelah ${seconds(t)} detik dan ${m.pace.interactionsBeforeDecision} interaksi.` }]
    };
  },

  resources(m) {
    const n = m.resources.collected.length;
    if (!n && !m.completed) return { hasData: false, score: 0, signals: 0, evidence: [{ text: "Belum ada barang yang diambil." }] };
    const unused = m.resources.unused.length;
    const v = n ? 0.6 * ratio(unused, n) + 0.4 * Math.min(1, m.resources.collectibles / 2) : 0;
    const evidence = n
      ? [
          { text: `Mengambil ${n} jenis barang (${listText(itemNames(m.resources.collected))}); ${n - unused} di antaranya dipakai untuk menyelesaikan tantangan.` },
          { text: unused ? `Barang yang dibawa tetapi tidak dipakai: ${listText(itemNames(m.resources.unused))}.` : "Semua barang yang diambil dipakai." }
        ]
      : [{ text: "Menyelesaikan stage tanpa mengambil barang apa pun." }];
    if (m.resources.collectibles) evidence.push({ text: `Mengambil ${m.resources.collectibles} barang koleksi yang tidak dibutuhkan tantangan.` });
    if (m.resources.carriedUsed.length) evidence.push({ text: `Barang bawaan dari stage sebelumnya ternyata berguna di sini: ${listText(itemNames(m.resources.carriedUsed))}.` });
    if (m.resources.leftBehind.length) evidence.push({ text: `Sengaja meninggalkan barang demi beban ringan: ${listText(itemNames(m.resources.leftBehind))}.` });
    const signals = n + m.resources.collectibles + 1;
    return { hasData: true, score: 2 * v - 1, signals: m.completed ? Math.max(3, signals) : signals, evidence };
  },

  resilience(m) {
    const { adapted, persisted, adaptations, retries } = m.resilience;
    const total = adapted + persisted;
    if (!total) return { hasData: false, score: 0, signals: 0, evidence: [{ text: m.trials.failures ? "Kegagalan tidak diikuti percobaan lanjutan di tantangan yang sama." : "Tidak ada kegagalan, jadi respons terhadap kegagalan belum terlihat." }] };
    return {
      hasData: true,
      score: (adapted - persisted) / total,
      signals: total * 2 + retries,
      evidence: [
        { text: `Setelah gagal, ${adapted} kali berganti cara dan ${persisted} kali mencoba cara yang sama (${adaptations.map((a) => `${a.fromLabel} → ${a.toLabel}`).join(", ")}).` },
        { text: `${retries} kali memilih mencoba lagi dari awal.` }
      ]
    };
  }
};

// Satu kalimat ringkasan lintas stage per dimensi (dipakai di narasi & bukti utama).
const sum = (list, fn) => list.reduce((acc, m) => acc + (fn(m) || 0), 0);
const SUMMARIES = {
  exploration(ms) {
    const found = sum(ms, (m) => m.optional.found.length + m.clues.found.length);
    const total = sum(ms, (m) => m.optional.total + m.clues.total);
    const cov = ms.filter((m) => m.coverage !== null);
    const covText = cov.length ? ` dan menjelajahi rata-rata ${Math.round((sum(cov, (m) => m.coverage) / cov.length) * 100)}% area peta` : "";
    const opt = sum(ms, (m) => m.optionalChallenges.solved.length);
    const optTotal = sum(ms, (m) => m.optionalChallenges.total);
    return `Menemukan ${found} dari ${total} hal yang bisa diamati atau ditemukan${covText}; ${opt} dari ${optTotal} tantangan opsional diselesaikan.`;
  },
  information(ms) {
    const before = sum(ms, (m) => m.clues.beforeDecisionCount);
    const total = sum(ms, (m) => m.clues.total);
    const decided = ms.filter((m) => m.main.strategy);
    const informed = decided.filter((m) => m.main.informedBy.length).length;
    const wrong = sum(ms, (m) => m.puzzles.wrong);
    const fails = sum(ms, (m) => m.trials.failures);
    let text = `Sebelum keputusan utama, mengamati ${before} dari ${total} petunjuk lingkungan; ${informed} dari ${decided.length} keputusan utama sejalan dengan petunjuk yang sudah ditemukan`;
    const extra = [fails ? `${fails} percobaan gagal` : "", wrong ? `${wrong} tebakan teka-teki yang salah` : ""].filter(Boolean);
    if (extra.length) text += `, dengan ${extra.join(" dan ")}`;
    return `${text}.`;
  },
  pace(ms) {
    const timed = ms.filter((m) => m.pace.timeToFirstDecisionMs !== null);
    if (!timed.length) return "Belum ada percobaan di tantangan utama.";
    const avgT = Math.round(sum(timed, (m) => m.pace.timeToFirstDecisionMs) / timed.length / 1000);
    const avgI = Math.round(sum(timed, (m) => m.pace.interactionsBeforeDecision) / timed.length);
    return `Rata-rata, percobaan pertama di tantangan utama dilakukan setelah ${avgT} detik dan ${avgI} interaksi.`;
  },
  resources(ms) {
    const collected = sum(ms, (m) => m.resources.collected.length);
    const used = sum(ms, (m) => m.resources.used.length);
    const carried = [...new Set(ms.flatMap((m) => m.resources.carriedUsed))];
    let text = `Mengambil ${collected} jenis barang dan memakai ${used} di antaranya untuk tantangan`;
    if (carried.length) text += `; barang bawaan yang berguna di stage berikutnya: ${listText(itemNames(carried))}`;
    return `${text}.`;
  },
  resilience(ms) {
    const adapted = sum(ms, (m) => m.resilience.adapted);
    const persisted = sum(ms, (m) => m.resilience.persisted);
    if (!adapted && !persisted) return "Tidak ada kegagalan yang diikuti percobaan lanjutan.";
    return `Setelah gagal, ${adapted} kali berganti cara dan ${persisted} kali mengulang cara yang sama.`;
  }
};

function confidenceOf(signals, hasData) {
  if (!hasData || signals < 3) return "rendah";
  if (signals < 6) return "sedang";
  return "tinggi";
}

const LOWER = { tinggi: "sedang", sedang: "rendah", rendah: "rendah" };

function aggregateDimension(id, stageMetrics) {
  const def = DIMENSIONS[id];
  const results = stageMetrics.map((m) => ({ m, r: SCORERS[id](m) }));
  const withData = results.filter(({ r }) => r.hasData);
  const score = withData.length ? withData.reduce((sum, { r }) => sum + r.score, 0) / withData.length : 0;
  const signals = withData.reduce((sum, { r }) => sum + r.signals, 0);
  let confidence = confidenceOf(signals, withData.length > 0);
  // Arah yang berlawanan antar stage menurunkan keyakinan.
  const signs = new Set(withData.filter(({ r }) => Math.abs(r.score) >= 0.2).map(({ r }) => Math.sign(r.score)));
  if (signs.size > 1) confidence = LOWER[confidence];
  const multi = stageMetrics.length > 1;
  const summary = SUMMARIES[id](stageMetrics);
  const perStage = results.flatMap(({ m, r }) => r.evidence.map((e) => ({ ...e, stageId: m.stageId, text: multi ? `[${m.stageName}] ${e.text}` : e.text })));
  const evidence = multi ? [{ text: summary, summary: true }, ...perStage] : perStage;
  const pole = score >= 0 ? def.positive : def.negative;
  const abs = Math.abs(score);
  return {
    id,
    label: def.label,
    poles: { negative: def.negative.label, positive: def.positive.label },
    score: round(score),
    hasData: withData.length > 0,
    tendency: !withData.length ? "Belum ada data" : abs < 0.2 ? "Seimbang" : pole.label,
    adjective: abs < 0.2 ? null : pole.adjective,
    strength: abs >= 0.6 ? "kuat" : abs >= 0.2 ? "sedang" : "lemah",
    confidence,
    signals,
    summary,
    evidence
  };
}

function solutionStyle(stageMetrics) {
  const totals = {};
  for (const m of stageMetrics) for (const [tag, w] of Object.entries(m.solutionTags)) totals[tag] = (totals[tag] || 0) + w;
  const sum = Object.values(totals).reduce((a, b) => a + b, 0);
  const distribution = Object.entries(totals)
    .sort((a, b) => b[1] - a[1])
    .map(([tag, w]) => ({ tag, label: SOLUTION_STYLES[tag].label, share: round(w / sum) }));
  const top = distribution[0] || null;
  return top ? { tag: top.tag, label: top.label, desc: SOLUTION_STYLES[top.tag].desc, distribution } : null;
}

const lowerFirst = (s) => s.charAt(0).toLowerCase() + s.slice(1);

export function buildProfile(stageMetrics) {
  if (!stageMetrics.length) {
    return { headline: "Belum ada data permainan", archetype: null, narrative: "Mainkan setidaknya satu stage untuk melihat analisis.", solutionStyle: null, dimensions: [], highlights: [] };
  }
  const dimensions = Object.keys(DIMENSIONS).map((id) => aggregateDimension(id, stageMetrics));
  const style = solutionStyle(stageMetrics);
  const weight = { tinggi: 1.2, sedang: 1, rendah: 0 };
  const salience = (d) => Math.abs(d.score) * weight[d.confidence] * (DIMENSIONS[d.id].salience ?? 1);
  const highlights = dimensions
    .filter((d) => d.hasData && d.adjective && weight[d.confidence] > 0)
    .sort((a, b) => salience(b) - salience(a));
  const top = highlights[0] || null;

  const head = style ? style.label : "Penjelajah";
  const headline = top ? `${head} yang ${top.adjective}` : style ? `${head} yang Seimbang` : "Profil masih terbentuk";
  const archetype = `${style?.tag || "none"}:${top ? `${top.id}:${top.score >= 0 ? "positive" : "negative"}` : "balanced"}`;

  const sentences = [];
  for (const m of stageMetrics) {
    if (!m.main.strategy) {
      sentences.push(`Di ${m.stageName}, tantangan utama belum terselesaikan.`);
      continue;
    }
    let s = `Di ${m.stageName}, kamu menyelesaikan tantangan utama lewat “${m.main.strategyLabel}”`;
    if (m.main.informedBy.length) s += ` setelah mengamati ${listText(m.main.informedBy)}`;
    else if (m.main.relevantClues.length) s += " tanpa terlebih dulu mengamati petunjuk yang berkaitan";
    if (m.finalAttempt > 1) s += ` pada percobaan ke-${m.finalAttempt}`;
    sentences.push(`${s}.`);
  }
  for (const d of highlights.slice(0, 3)) {
    sentences.push(`Kamu cenderung ${d.adjective.toLowerCase()} (${d.strength}, keyakinan ${d.confidence}): ${lowerFirst(d.summary)}`);
  }
  if (style) sentences.push(`Pendekatan solusimu paling banyak bertipe ${style.label}, yaitu ${style.desc}.`);

  return {
    headline,
    archetype,
    narrative: sentences.join(" "),
    solutionStyle: style,
    dimensions,
    highlights: highlights.slice(0, 3).map((d) => d.id)
  };
}
