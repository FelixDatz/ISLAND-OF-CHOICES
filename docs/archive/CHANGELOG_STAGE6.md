# Changelog — Stage 1 Fase 6.1–6.7

## 6.1 — Environmental Interaction & Guided Orientation
- Added four guidance zones and four optional environmental observations.
- Zone entries and discoveries are logged with stable identifiers.

## 6.2 — Open Mini Puzzles
- Added an optional old supply cache in the wilderness.
- Supports three alternatives: small axe, rope leverage, or driftwood wedge.
- The puzzle does not consume tools or affect river-crossing resources.
- Successful resolution gives a map fragment and adds a journal note.

## 6.3 — Simple Explorer Journal
- Added the `J` shortcut and a concise in-game journal panel.
- Shows discoveries and the ten latest successful/failed decisions.

## 6.4 — Reactive Environment
- Added state-driven visuals for the open cache, palm stump, discovered clues, and crossing method.

## 6.5 — Optional Exploration
- Added a message bottle and tide pool on the shore.
- Added an abandoned camp and stone marker on the far side.
- These activities do not gate the main challenge.

## 6.6 — Evidence & Interpretation
- Added structured descriptive evidence and cautious interpretations.
- Added JSON export containing the report and raw event history.
- No score, player ranking, or fixed problem-solving persona is generated.

## 6.7 — Integration
- Added 17 automated logic tests for the integrated Stage 1 systems.
- Preserved the protected Fase 4 crossing rules and Fase 5.1 opening flow.
- Full browser build could not be verified in the build environment because dependency installation timed out; run `npm install` and `npm run build` locally.
