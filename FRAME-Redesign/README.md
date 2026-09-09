# FRAME — Clean-Sheet Redesign

Branch: `frame-redesign-main`

This folder is the permanent design workspace for the new FRAME concept. It is intentionally separated from the existing packaged `FRAME-Studio` source so redesign work can progress without breaking the current build.

## Product direction
FRAME is a mobile-first professional photo editor with a Lightroom/Photoshop-inspired workflow, but simplified for one-hand use and fast visual decisions.

Core promise: **import a photo → see every edit live → use professional manual controls or AI assistance → export a clean final image without leaving the editor.**

## Non-negotiable requirements
- Full live preview for every edit.
- Non-destructive editing; original image is never overwritten.
- Fast undo/redo and before/after.
- Professional Light, Color, Detail, Crop, Mask, Heal and Preset tools.
- AI scene recognition from the photo itself: location/context clues, time of day, weather/atmosphere and lighting conditions where inferable.
- Manual scene context fallback, e.g. `Rome, 4pm, Vatican`.
- `GPT Rate` workflow that scores the photo and returns prioritized corrections.
- One-tap AI fix that applies transparent, reversible edits.
- Simple masking and healing workflows that work visually instead of hiding actions behind menus.
- Export controls for social, web and high-resolution use.
- Minimal chrome around the image. The photo remains the primary object on screen.

## Redesign stages
1. Concept lock
2. Screen-flow mockups
3. Interactive prototype
4. Editing-engine contracts
5. Android beta
6. Regression test
7. Final build

## Folder map
- `docs/PRODUCT_SPEC.md` — product architecture and UX rules
- `docs/UI_SPEC.md` — screen-by-screen layout specification
- `docs/FEATURE_CONTRACTS.md` — expected behavior of editing/AI tools
- `PROGRESS.md` — permanent progress log and design decisions

No existing FRAME code is deleted or replaced by this redesign branch.