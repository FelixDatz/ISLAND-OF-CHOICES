# Stage 1 Fase 6.7 — Manual Demo Checklist

## Opening regression
- [ ] Cinematic opening appears on first run.
- [ ] Skip only appears after 10 seconds and skips only the cinematic portion.
- [ ] All storyboard slides remain navigable with Previous / Next.
- [ ] Landing page appears after storyboard; gameplay starts only after Start / Play.

## Exploration and interactions
- [ ] Move with WASD and arrow keys; use E to interact.
- [ ] Area labels change across Shore, Wilderness, Riverbank, and Far Side.
- [ ] Inspect the four original environmental clues.
- [ ] Try the supply cache with axe, rope, and driftwood in separate fresh runs.
- [ ] Open Explorer Journal with J; verify discoveries and decisions are legible.
- [ ] Check the message bottle, tide pool, old camp, and far-side marker.
- [ ] Download the JSON report and confirm it contains summary, observations, interpretations, limitations, and rawEventLog.

## Reactive environment
- [ ] Supply cache changes appearance after being opened.
- [ ] Chopped palm leaves a stump.
- [ ] Discovered clue objects change visual state.
- [ ] River crossing displays the correct raft, log bridge, or stepping-stone visual.

## Protected Fase 4 mechanics
- [ ] Upstream route opens the crossing without consuming inventory.
- [ ] Log bridge requires and consumes exactly one log.
- [ ] Raft requires and consumes one rope plus two driftwood.
- [ ] Insufficient materials do not consume partial inventory.
- [ ] Swimming still causes Game Over and offers Try Again.
- [ ] Try Again restarts the stage while retaining previous attempt events in the session report.
- [ ] Reaching the goal requires physically crossing to the far side.

## Regression constraints
- [ ] No energy, stamina, countdown, or gameplay timer appears.
- [ ] Optional exploration is not required to finish the river challenge.
- [ ] `npm test` passes.
- [ ] `npm run build` succeeds in the local Node/Vite environment.
