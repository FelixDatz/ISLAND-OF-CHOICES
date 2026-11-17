import { SOLUTION_STYLES } from "../../data/taxonomy.js";

// Mengubah event mentah menjadi fakta terukur per stage. Hanya membaca data stage
// (zona, penemuan, tantangan, tag), jadi berlaku untuk stage mana pun.

const ofType = (events, type) => events.filter((e) => e.type === type);
const uniq = (list) => [...new Set(list.filter((v) => v !== null && v !== undefined))];

function discoveryCatalog(stage) {
  const list = [];
  for (const obj of stage.objects) {
    for (const action of obj.actions || []) {
      if (!action.discoveryId) continue;
      list.push({
        id: action.discoveryId,
        title: action.discoveryTitle || obj.label || action.discoveryId,
        category: action.discoveryCategory || "environmental_clue"
      });
    }
  }
  return list;
}

export function computeStageMetrics(allEvents, stage) {
  const ev = allEvents.filter((e) => e.stage === stage.id);
  const starts = ofType(ev, "stage_start");
  const complete = ofType(ev, "stage_complete").at(-1) || null;
  const firstStart = starts[0] || null;
  const finalAttempt = complete?.attempt ?? starts.at(-1)?.attempt ?? 1;
  const endEvent = complete || ev.at(-1) || null;

  // ---- zona & pergerakan ----
  const zonesVisited = uniq(ofType(ev, "zone_entered").map((e) => e.zoneId));
  const zoneDwellMs = {};
  let distance = 0;
  for (const e of ofType(ev, "zone_left")) {
    zoneDwellMs[e.zoneId] = (zoneDwellMs[e.zoneId] || 0) + (e.dwellMs || 0);
    distance += e.distance || 0;
  }

  // ---- penemuan (gabungan semua percobaan: pengetahuan pemain tetap terbawa) ----
  const catalog = discoveryCatalog(stage);
  const firstFound = new Map();
  for (const e of ofType(ev, "discovery_made")) if (!firstFound.has(e.discoveryId)) firstFound.set(e.discoveryId, e.eventId);
  const titleOf = (id) => catalog.find((d) => d.id === id)?.title || id;
  const clueIds = catalog.filter((d) => d.category === "environmental_clue").map((d) => d.id);
  const optionalIds = catalog.filter((d) => d.category !== "environmental_clue").map((d) => d.id);

  // ---- tantangan ----
  const challengeIds = Object.keys(stage.challenges || {});
  const optionalChallenges = challengeIds.filter((id) => stage.challenges[id].optional);
  const resolved = ofType(ev, "challenge_resolved");
  const optionalSolved = uniq(resolved.filter((e) => optionalChallenges.includes(e.challengeId)).map((e) => e.challengeId));
  const main = stage.mainChallenge;
  const mainResolved = resolved.filter((e) => e.challengeId === main).at(-1) || null;
  const mainStrategy = mainResolved?.strategy || null;
  const mainStrategyDef = mainStrategy ? stage.challenges[main].strategies[mainStrategy] : null;

  const attempts = ofType(ev, "action_attempted");
  const firstMainAttempt = attempts.find((e) => e.challengeId === main) || null;
  const decisionId = mainResolved?.eventId ?? Infinity;
  const cluesBeforeDecision = clueIds.filter((id) => firstFound.has(id) && firstFound.get(id) < decisionId);
  // Keputusan "terinformasi": penemuan relevan (petunjuk atau aktivitas opsional) terjadi sebelum keputusan.
  const informedBy = (mainStrategyDef?.informedBy || []).filter((id) => firstFound.has(id) && firstFound.get(id) < decisionId);

  // ---- tempo ----
  const interacts = ofType(ev, "interact");
  const interactionsBeforeDecision = firstMainAttempt
    ? interacts.filter((e) => e.eventId < firstMainAttempt.eventId).length
    : interacts.length;
  const timeToFirstDecisionMs = firstMainAttempt && firstStart ? firstMainAttempt.t - firstStart.t : null;

  // ---- percobaan & kegagalan ----
  const failures = ofType(ev, "action_failed").filter((e) => e.reason !== "puzzle_unsolved");
  const fatal = failures.filter((e) => e.outcome === "fatal");
  const setbacks = failures.filter((e) => e.outcome === "setback");
  const puzzleAttempts = ofType(ev, "puzzle_attempt");
  const puzzleWrong = puzzleAttempts.filter((e) => !e.correct).length;
  const puzzlesSolved = uniq(puzzleAttempts.filter((e) => e.correct).map((e) => e.strategy));
  const blocked = ofType(ev, "blocked_action");
  const lockedViews = interacts.filter((e) => (e.locked || []).length > 0).length;
  const menuCancels = ofType(ev, "menu_cancel").length;

  // Setelah gagal di tantangan X, apakah percobaan berikutnya di X memakai strategi sama?
  let adapted = 0;
  let persisted = 0;
  const adaptations = [];
  for (const f of failures.filter((e) => e.challengeId && e.strategy && e.reason !== "challenge_already_resolved")) {
    const next = attempts.find((a) => a.eventId > f.eventId && a.challengeId === f.challengeId);
    if (!next) continue;
    if (next.strategy === f.strategy) persisted += 1;
    else adapted += 1;
    const label = (s) => stage.challenges[f.challengeId]?.strategies?.[s]?.label || s;
    adaptations.push({ from: f.strategy, to: next.strategy, fromLabel: label(f.strategy), toLabel: label(next.strategy), failedEventId: f.eventId, nextEventId: next.eventId });
  }

  // ---- barang (percobaan terakhir saja, karena dunia di-reset saat Try Again) ----
  const finalResolved = ofType(ev, "action_resolved").filter((e) => e.attempt === finalAttempt);
  const collected = uniq(finalResolved.flatMap((e) => e.gained || []));
  const used = new Set(finalResolved.flatMap((e) => e.usedItems || []));
  const unusedItems = collected.filter((id) => !used.has(id));
  const collectibles = finalResolved.filter((e) => (e.tags || []).includes("collect")).length;
  const carriedIn = starts[0]?.carriedItems || {};
  const carriedUsed = uniq(finalResolved.flatMap((e) => e.usedItems || []).filter((id) => carriedIn[id] && !collected.includes(id)));
  const leftBehind = Object.keys(complete?.left || {});

  // ---- setelah tujuan terbuka ----
  const goalReached = ofType(ev, "goal_reached");
  const deferred = ofType(ev, "goal_deferred").length;
  const firstGoal = goalReached[0] || null;
  const actionsAfterGoal = firstGoal ? ofType(ev, "action_resolved").filter((e) => e.eventId > firstGoal.eventId).length : 0;

  // ---- gaya solusi (tag dari strategi yang berhasil + percobaan berisiko) ----
  const solutionTags = {};
  const addTags = (tags, w) => {
    for (const tag of tags || []) if (SOLUTION_STYLES[tag]) solutionTags[tag] = (solutionTags[tag] || 0) + w;
  };
  for (const e of resolved) addTags(e.tags, e.challengeId === main ? 2 : 1);
  for (const e of failures.filter((f) => f.outcome === "fatal")) addTags(e.tags, 1);

  return {
    stageId: stage.id,
    stageName: stage.name,
    completed: !!complete,
    attempts: starts.length,
    finalAttempt,
    durationMs: firstStart && endEvent ? endEvent.t - firstStart.t : 0,
    distance: Math.round(distance),
    zones: { visited: zonesVisited, total: stage.zones.length, dwellMs: zoneDwellMs },
    clues: { total: clueIds.length, found: clueIds.filter((id) => firstFound.has(id)).map(titleOf), beforeDecision: cluesBeforeDecision.map(titleOf), beforeDecisionCount: cluesBeforeDecision.length },
    optional: { total: optionalIds.length, found: optionalIds.filter((id) => firstFound.has(id)).map(titleOf) },
    optionalChallenges: { total: optionalChallenges.length, solved: optionalSolved, strategies: resolved.filter((e) => optionalChallenges.includes(e.challengeId)).map((e) => e.strategy) },
    main: {
      challengeId: main,
      strategy: mainStrategy,
      strategyLabel: mainStrategyDef?.label || null,
      tags: mainResolved?.tags || [],
      eventId: mainResolved?.eventId || null,
      informedBy: informedBy.map(titleOf),
      relevantClues: (mainStrategyDef?.informedBy || []).map(titleOf)
    },
    pace: { timeToFirstDecisionMs, interactionsBeforeDecision },
    coverage: complete?.coverage ?? null,
    trials: { failures: failures.length, fatal: fatal.length, setbacks: setbacks.length, blocked: blocked.length, lockedViews, menuCancels, failedStrategies: uniq(failures.map((f) => f.strategy)) },
    puzzles: { attempts: puzzleAttempts.length, wrong: puzzleWrong, solved: puzzlesSolved },
    resilience: { adapted, persisted, adaptations, retries: ofType(ev, "retry_selected").length },
    resources: { collected, used: [...used].filter((id) => collected.includes(id)), unused: unusedItems, collectibles, finalInventory: complete?.inventory || null, carriedIn: Object.keys(carriedIn), carriedUsed, leftBehind },
    afterGoal: { goalVisits: goalReached.length, deferred, actionsAfterGoal },
    solutionTags,
    panels: { journal: ofType(ev, "journal_open").length, inventory: ofType(ev, "inventory_open").length }
  };
}
