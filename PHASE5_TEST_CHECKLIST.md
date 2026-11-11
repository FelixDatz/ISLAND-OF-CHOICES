# Phase 5 Demo Checklist

## Landing page
- [ ] Opening page appears before the Phaser gameplay.
- [ ] Brand, hero title, Begin your journey, Explore the story, How to play, and About are visible.
- [ ] Navigation buttons open the correct information screens and Back returns to the landing page.
- [ ] Layout remains usable at desktop and narrow/mobile widths.

## Interactive prologue
- [ ] Begin your journey opens Chapter 1.
- [ ] Each of the three chapters presents three selectable narrative choices.
- [ ] Selecting a choice shows its contextual response and a Continue button.
- [ ] Choices are not marked right/wrong and do not lock gameplay strategies.
- [ ] Final chapter leads to the arrival screen.
- [ ] Enter the island starts Stage 1.

## Gameplay regression
- [ ] Character movement and collision still work.
- [ ] E interaction and I inventory still work.
- [ ] Wreckage search and resource gathering still work.
- [ ] Upstream trail, log bridge, and raft crossing still work.
- [ ] Swimming still causes the failed attempt / Try Again flow.
- [ ] No energy or timer mechanic appears.

## Event log
- [ ] `landing_opened` is recorded.
- [ ] `prologue_started`, three `prologue_choice` events, and `prologue_completed` are recorded.
- [ ] Stage 1 events continue in the same session log (press L to print it).
