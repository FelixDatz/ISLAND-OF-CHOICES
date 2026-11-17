import "./dashboard.css";

// Dashboard peneliti/pengajar: ringkasan semua sesi yang dikirim ke server.
const app = document.getElementById("app");
const state = { stats: null, sessions: [], selected: null, detail: null, error: null };

const h = (tag, attrs = {}, ...children) => {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === "class") node.className = v;
    else if (k.startsWith("on")) node.addEventListener(k.slice(2), v);
    else if (v !== null && v !== undefined && v !== false) node.setAttribute(k, v);
  }
  for (const child of children.flat()) if (child !== null && child !== undefined && child !== false) node.append(child);
  return node;
};
const secs = (ms) => (ms === null || ms === undefined ? "-" : `${Math.round(ms / 1000)} dtk`);
const when = (iso) => (iso ? new Date(iso).toLocaleString("id-ID", { dateStyle: "short", timeStyle: "short" }) : "-");

async function getJson(url) {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`${url} → HTTP ${res.status}`);
  return res.json();
}

async function refresh() {
  try {
    const [stats, sessions] = await Promise.all([getJson("/api/stats"), getJson("/api/sessions")]);
    Object.assign(state, { stats, sessions, error: null });
    if (state.selected && !sessions.some((s) => s.sessionId === state.selected)) state.selected = null;
  } catch (err) {
    state.error = `Server tidak terjangkau (${err.message}). Jalankan \`npm run server\`.`;
  }
  render();
}

async function select(id) {
  state.selected = id;
  state.detail = null;
  render();
  try {
    state.detail = await getJson(`/api/sessions/${id}`);
  } catch (err) {
    state.error = err.message;
  }
  render();
}

function distribution(title, items) {
  const max = Math.max(1, ...items.map((i) => i.count));
  return h("section", { class: "panel" },
    h("h2", {}, title),
    items.length
      ? h("ul", { class: "dist" }, items.map((i) => h("li", {},
          h("span", {}, i.label), h("strong", {}, String(i.count)),
          h("div", { class: "bar" }, h("span", { style: `width:${(i.count / max) * 100}%` })))))
      : h("p", { class: "muted" }, "Belum ada data."));
}

function dimRow(label, poles, score, note) {
  const has = score !== null && score !== undefined;
  return h("div", { class: "dim" },
    h("span", { class: "dim-label" }, label, note ? h("span", { class: "muted" }, ` · ${note}`) : null),
    h("span", { class: "pole" }, poles.negative),
    h("div", { class: "track" }, has ? h("span", { class: "marker", style: `left:${((score + 1) / 2) * 100}%` }) : null),
    h("span", { class: "pole" }, poles.positive));
}

function detailPanel() {
  if (!state.selected) return h("section", { class: "panel detail" }, h("h2", {}, "Detail sesi"), h("p", { class: "muted" }, "Klik baris sesi untuk melihat profil dan buktinya."));
  if (!state.detail) return h("section", { class: "panel detail" }, h("p", { class: "muted" }, "Memuat…"));
  const { report, player, sessionId } = state.detail;
  const p = report.profile;
  return h("section", { class: "panel detail" },
    h("h2", {}, p.headline),
    h("p", { class: "muted" }, `${player?.name || "Anonim"} · sesi ${sessionId.slice(0, 8)} · ${report.session.loggedEvents} event · `,
      h("a", { href: `/api/sessions/${sessionId}`, target: "_blank", rel: "noopener" }, "JSON lengkap")),
    h("p", {}, p.narrative),
    p.dimensions.map((d) => h("div", {},
      dimRow(d.label, d.poles, d.hasData ? d.score : null, `${d.tendency} · keyakinan ${d.confidence}`),
      h("ul", {}, d.evidence.map((e) => h("li", {}, e.text))))));
}

function render() {
  const s = state.stats;
  app.replaceChildren(h("div", { class: "wrap" },
    h("header", { class: "top" },
      h("div", {}, h("h1", {}, "Island of Choices · Dasbor"), h("p", { class: "muted" }, "Profil gaya bermain dihitung ulang di server dari event log mentah.")),
      h("div", {}, h("button", { onclick: refresh }, "Muat ulang"), " ", h("a", { class: "btn", href: "/?dev" }, "Buka game"))),
    state.error ? h("p", { class: "error" }, state.error) : null,
    s ? h("div", { class: "cards" },
      [["Sesi", s.sessions], ["Selesai", s.completedSessions], ["Pemain unik", s.players], ["Rata-rata durasi", secs(s.avgDurationMs)], ["Rata-rata percobaan", s.avgAttempts ?? "-"]]
        .map(([k, v]) => h("div", { class: "card" }, h("span", { class: "muted" }, k), h("strong", {}, String(v))))) : null,
    s ? h("div", { class: "grid" },
      distribution("Profil", s.headlines),
      ...(s.strategiesByStage?.length ? s.strategiesByStage.map((g) => distribution(`Cara · ${g.stageName}`, g.items)) : [distribution("Cara menyelesaikan tantangan utama", s.strategies)]),
      h("section", { class: "panel" }, h("h2", {}, "Rata-rata dimensi"),
        s.dimensions.map((d) => dimRow(d.label, d.poles, d.mean, d.n ? `rata-rata ${d.mean} (n=${d.n})` : "belum ada data")))) : null,
    h("div", { class: "grid" },
      h("section", { class: "panel" }, h("h2", {}, "Sesi"),
        state.sessions.length
          ? h("div", { class: "table-wrap" }, h("table", {},
              h("thead", {}, h("tr", {}, ["Waktu", "Pemain", "Profil", "Rute (Stage 1 → 3)", "Percobaan", "Durasi", "Status"].map((t) => h("th", {}, t)))),
              h("tbody", {}, state.sessions.map((row) => {
                const st = row.stages[0] || {};
                const route = row.stages.map((x) => x.strategyLabel || "–").join(" → ");
                const attempts = row.stages.reduce((a, x) => a + (x.attempts || 0), 0);
                const duration = row.stages.reduce((a, x) => a + (x.durationMs || 0), 0);
                const done = row.stages.filter((x) => x.completed).length;
                return h("tr", { class: row.sessionId === state.selected ? "is-active" : "", onclick: () => select(row.sessionId) },
                  h("td", {}, when(row.updatedAt)),
                  h("td", {}, row.player?.name || `anonim ${String(row.player?.id || "").slice(0, 4)}`),
                  h("td", {}, row.headline),
                  h("td", {}, route || st.strategyLabel || "-"),
                  h("td", {}, String(attempts)),
                  h("td", {}, secs(duration)),
                  h("td", {}, h("span", { class: `badge ${done === 3 ? "ok" : "warn"}` }, `${done}/3 stage`)));
              }))))
          : h("p", { class: "empty" }, "Belum ada sesi. Mainkan game sampai selesai, atau jalankan `npm run seed`.")),
      detailPanel())));
}

render();
refresh();
setInterval(refresh, 10000);
