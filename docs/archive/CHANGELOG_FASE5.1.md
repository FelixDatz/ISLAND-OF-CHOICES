# Changelog Fase 5.1 — Opening Flow Revision

## Player flow
1. Website opens into a cinematic animated opening (22 seconds).
2. Skip is disabled for the first 10 seconds, then becomes available.
3. Whether skipped or watched to completion, the player must proceed through the illustrated storyboard.
4. Storyboard has four slides with Previous / Next controls.
5. After the final slide, the cinematic landing page appears.
6. Start / Play enters Stage 1 directly.

## Storyboard scenes
- The Voyage
- The Storm
- The Shipwreck
- The Island

## Event logging
- `experience_opened`
- `cinematic_intro_started`
- `cinematic_intro_skip_unlocked`
- `cinematic_intro_completed`
- `storyboard_slide_viewed`
- `storyboard_completed`
- `landing_opened`
- `game_started_from_landing`

## Notes
- The opening is currently a CSS-animated cinematic placeholder, not a final MP4. It is designed to be replaceable by the team's final video asset later.
- Storyboard illustrations are CSS-generated placeholders and can later be replaced by the team's final illustrations.
- Stage 1, crafting routes, river crossing, inventory, retry behavior, and gameplay UI were not intentionally modified.
