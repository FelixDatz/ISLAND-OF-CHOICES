# Stage 1 Development Philosophy & Technical Roadmap

## Product philosophy

**Stage 1 uses guided exploration, open-ended problem solving, and a simple Explorer Journal.** The island should feel readable without becoming a corridor or a checklist. Players may explore in a suggested direction, pause to inspect their surroundings, collect useful objects, or attempt a solution in their own order.

### 1. Guided exploration
- Use recognizable areas, environmental context, and short location hints to help players understand where they are.
- Give clues through objects and the environment rather than a permanent waypoint or a forced sequence.
- Keep optional discoveries optional. A player must still be able to reach the river challenge without finding every clue.
- Do not add energy, stamina, countdown, or time-limit mechanics.

### 2. Open-ended mini puzzles
- Do not prescribe one correct interaction sequence for optional discoveries.
- Let players combine observations, objects, and actions in plausible ways.
- When a result is not explicitly designed, record the attempted action and outcome without inventing an interpretation of the player's intent.
- Preserve multiple viable strategies for the main river challenge.

### 3. Simple Explorer Journal
- Keep the journal lightweight: discovered notes and a compact record of meaningful decisions.
- Do not turn it into a quest checklist, skill tree, achievement system, or numeric score.
- Separate observable evidence (what the player did) from later interpretation (what the action may suggest).
- The journal UI is planned for Fase 6.3; Fase 6.1 only creates structured discovery events that can feed it.

## Technical principles

- Keep world content declarative in `src/data/stage1.js`.
- Keep interaction validation, item consumption, flags, and event recording in `src/systems/Interaction.js` and `src/systems/EventLog.js`.
- Keep Phaser rendering, movement, zone detection, and scene transitions in `src/scenes/Stage1Scene.js`.
- Keep DOM overlays in `src/ui/ui.js`; do not build one-off HTML UI inside the scene.
- Keep the opening sequence independent in `src/ui/intro.js` and its CSS.
- Add optional mechanics in a way that does not block the core route or invalidate existing save/session evidence.

## Roadmap

| Subfase | Fokus | Target implementation | Status |
|---|---|---|---|
| 6.1 | Environmental interaction & guided orientation | Zone context labels, inspectable environmental clues, structured discovery events | Demo ready for review |
| 6.2 | Open mini puzzles | Optional supply cache with axe, rope, or driftwood approaches | Implemented |
| 6.3 | Simple Explorer Journal | J-key panel with discoveries and concise action history | Implemented |
| 6.4 | Reactive environment | Open cache, palm stump, discovered markers, and visible river route | Implemented |
| 6.5 | Optional exploration & far-side activities | Message bottle, tide pool, abandoned camp, and far-side marker | Implemented |
| 6.6 | Evidence and interpretation layer | Structured evidence, cautious interpretation, and JSON export | Implemented |
| 6.7 | Stage 1 integration & playtest | Integrated regression suite and final manual playtest checklist | Implemented; browser playtest pending |

## Fase 6.1 implementation notes

- Four non-blocking zones: `shore`, `wilderness`, `riverbank`, and `far_side`.
- Four optional observations: `shore_tracks`, `split_branch`, `carved_stone`, and `river_reeds`.
- Each observation is a one-time interaction that sets a discovery flag and emits `discovery_made` with a stable `discoveryId`.
- Entering a zone updates a small location panel and emits `zone_entered` once per zone entry.
- Clues contextualize existing points of interest; they do not award items, consume resources, unlock the river gate, or change the river challenge.

## Regression constraints

The following Fase 4 and Fase 5.1 behavior is a protected baseline:

- River routes remain: upstream trail, log bridge (1 log), and raft (1 rope + 2 driftwood).
- Swimming remains a failed, fatal attempt followed by Try Again from the beginning. Previous attempt events remain in the session log.
- A failed requirement must not consume any item.
- A successful river route opens the crossing corridor; the player must physically reach the goal area on the far side.
- No energy or gameplay timer is introduced.
- Opening flow remains: cinematic opening (Skip unlocks after 10 seconds) → complete storyboard sequence → landing page → Start / Play → Stage 1.


## Fase 6.2–6.7 implementation notes

### Fase 6.2 — Open mini puzzle
- Added `supply_cache` in the wilderness as a non-mandatory micro-challenge.
- Three successful alternatives are available: pry with the small axe, pull with rope, or wedge with driftwood.
- Tools are not consumed. The reward is a map fragment and a journal note; no river route is unlocked by this puzzle.

### Fase 6.3 — Simple Explorer Journal
- Press `J` to open or close the journal; `Esc` also closes it.
- The journal shows unique discoveries and the latest ten resolved/failed decisions.
- Entries are derived from EventLog; no player score or fixed persona is calculated.

### Fase 6.4 — Reactive environment
- The cache changes appearance when opened.
- Chopping the palm leaves a visible stump.
- Observed clue objects are visually tinted after discovery.
- A raft, log bridge, or stepping-stone path is drawn after the river challenge is resolved.

### Fase 6.5 — Optional exploration
- Added a message bottle and tide pool on the shore.
- Added an abandoned camp and a stone marker on the far side.
- These activities provide notes or collectibles but do not gate the river crossing or Stage 1 completion.

### Fase 6.6 — Evidence and interpretation
- `src/systems/Evidence.js` summarizes recorded attempts, outcomes, zones, discoveries, retries, and strategies.
- Evidence statements and possible interpretations are stored separately.
- The journal can export the complete structured report and raw EventLog as JSON.
- The report explicitly states its limits: it is descriptive, not a psychological test or a definitive measure of ability.

### Fase 6.7 — Integration
- `tests/stage1-integration.test.js` covers discovery, mini-puzzle alternatives, journal data, optional activities, evidence separation, and protected river routes.
- The Fase 5.1 opening files (`src/ui/intro.js`, `src/intro.css`, and `src/main.js`) are unchanged from the Fase 5.1 base.
- No energy, stamina, countdown, or gameplay timer has been added.
