# FRAME Beta 0.4.0 Milestone

Canonical repository: `smilemangaphotography-svg/apps`

Canonical branch: `frame-redesign-main`

Android package: `com.ilia.frame.redesignbeta.debug`

Verified beta version: `0.4.0-beta4-debug`

## Purpose
Beta 0.4 is a functional-hardening release based on Samsung real-device testing. The Essential Professional visual design remains locked. The priority is to remove misleading or non-functional controls, improve analysis trust, and make the editing workflow simpler.

## Changes
- Removed the visible Fit / Fill / 1:1 rail. Photos still open in normal Fit view; only the Zoom control remains visible.
- Pinch zoom, double-tap zoom and pan remain available.
- Hardened technical light classification to avoid labeling high-contrast daylight images as `Low light` based only on mean luminance.
- Highlight status now distinguishes `Highlights Protected`, `Highlights At Risk`, and `Source Highlights Clipped` using sampled rendered-pixel statistics.
- Low-confidence semantic status labels are suppressed rather than presented as facts.
- Face analysis now retries at 0°, 90° and 270° so strongly rotated/tilted portraits have a better chance of being detected.
- Preset category buttons are now wired to actual filtering behavior.
- Removed misleading Color tabs for HSL / Grading until they have real processing implementations.
- Hidden Detail controls for Sharpen and Noise Reduce until edge-aware processing is actually wired.
- Mask UI now exposes only working selections: Subject and Background through native ML Kit subject segmentation; Person is shown only when a reliable face is detected. Unsupported Sky / Water / Buildings mask buttons are hidden instead of pretending to work.
- Brush / Invert / Clear and Mask Exposure remain available for mask refinement.
- Heal UI hides Clone until a real clone-source workflow exists; working repair mode remains exposed.
- Crop/Rotate no longer exposes non-functional aspect-ratio buttons.
- Rotation now includes ±90° actions, ±0.5° fine steps, a -180°..180° fine slider and Reset Rotation.
- Rotation is now included in exported JPEGs, including reopened edits whose saved rotation is already present before Crop is revisited.
- Settings identity updated to FRAME Beta 0.4.0.

## CI verification
GitHub Actions run `34473868666` completed successfully.

Passed:
- locked asset presence checks
- JavaScript syntax checks for `app.js` and `beta04.js`
- Android compile
- APK identity verification
- artifact collection
- SHA-256 generation
- artifact upload

## Explicit limitations
Beta 0.4 does not claim production completion for:
- RAW/color-managed rendering
- full-resolution non-destructive export
- semantic sky/water/building segmentation
- production content-aware removal / clone
- edge-aware sharpening and denoise
- full HSL and color-grading engines
- automated horizon/keystone geometry correction

Controls for unfinished features are intentionally hidden rather than shown as dead UI.
