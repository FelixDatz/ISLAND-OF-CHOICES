# Island of Choices

An open-ended problem-solving adventure built with Phaser 3 and Vite.

## Phase 5 — Cinematic landing page & interactive prologue

The browser now opens on a cinematic landing page instead of immediately entering Stage 1. Players can:

- Read the project story, controls, and project purpose.
- Play a three-chapter interactive prologue.
- Make one narrative choice in each chapter. These choices are recorded as `prologue_choice` events and do not lock or grant gameplay solutions.
- Enter Stage 1 after arriving on the island.

The prologue and gameplay use separate UI layers. The Phaser game textures are prepared in the background; Stage 1 starts only after the player completes the prologue and chooses **Enter the island**.

## Run locally

Requirements: Node.js compatible with Vite 8.

```bash
npm install
npm run dev
```

Open the local URL printed by Vite.

For a production build:

```bash
npm run build
npm run preview
```

## Controls

- `WASD` or arrow keys: move
- `E`, `Enter`, or `Space`: interact / confirm
- `I`: inventory
- `Esc`: cancel / close
- `B`: toggle collision debug
- `L`: print the event log in the browser console

## Stage 1 gameplay preserved

- Search the wreckage and collect useful items.
- Cross the river by discovering the upstream trail, building a log bridge, or crafting a raft.
- Swimming in the strong current fails the attempt and offers a restart from the beginning.
- No energy or timer mechanic is used.

## Event log

The session log begins on the landing page and continues into Stage 1. Narrative events (`landing_opened`, `prologue_started`, `prologue_choice`, `prologue_completed`) remain distinct from gameplay events such as `interact`, `action_attempted`, `action_resolved`, `action_failed`, `challenge_resolved`, and `stage_complete`.

The current project still uses placeholder world art. The landing page uses CSS-generated atmospheric scenery so it can be replaced or refined later without changing gameplay logic.

## Phase 5.1 — revised opening flow

The first-visit flow is now:

`Cinematic Opening (22s; Skip unlocks after 10s) → Illustrated Storyboard (4 slides) → Landing Page → Start / Play → Stage 1`

The cinematic opening and storyboard artwork are lightweight CSS placeholders. Replace them with final MP4 and illustration assets when the art team is ready. The storyboard must still be completed after skipping the opening.

See `CHANGELOG_FASE5.1.md` and `PHASE5_1_TEST_CHECKLIST.md` for details and demo checks.
