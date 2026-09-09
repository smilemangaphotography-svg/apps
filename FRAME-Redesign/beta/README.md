# FRAME Redesign Beta 0.1.0

Canonical branch: `frame-redesign-main`

Package: `com.ilia.frame.redesignbeta.debug`

This beta is intentionally installable beside the existing FRAME app. It does not replace the legacy packaged source.

## What this beta is for
Validate the locked **Essential Professional** interaction model and the first real Smart workflow on an Android phone.

## Core test paths
1. Import a real local photo.
2. Confirm the photo remains visible in Presets, Light and Color.
3. Move Light/Color sliders and verify the live canvas changes immediately.
4. Hold the image to reveal the original.
5. Tap Compare to enable side-by-side Before/After; Compare is off by default.
6. Run Smart Analyze and review measurable technical signals.
7. Optionally confirm scene context (People / Architecture / Wedding / Church / Product / Travel).
8. Build a Smart Recipe, preview selected changes, then Apply.
9. Test Highlight Guard and Skin Priority behavior.
10. Paint a manual mask and adjust Mask Exposure.
11. Tap Heal/Remove on a distraction and verify a visible patch operation.
12. Undo/redo adjustments.
13. Export and confirm the saved JPEG matches the visible edited preview.

## Implemented in Beta 0.1.0
- Dark Essential Professional Android UI.
- Local photo import through Android picker.
- Live photo canvas.
- Optional side-by-side Compare.
- Press-for-original preview.
- Light controls: Exposure, Contrast, Highlights, Shadows, Whites, Blacks.
- Highlight Guard.
- Color controls: Temperature, Tint, Vibrance, Saturation.
- Skin Priority color heuristic.
- Adaptive preset library with scenario families.
- Local technical image analysis (brightness, highlight risk, shadow crush, warmth, skin-color signal).
- Ranked Smart recommendations.
- Smart Recipe Preview / Apply Selected.
- Smart Portrait strength controls.
- Smart Architecture beta control.
- Manual brush mask + local exposure.
- Beta Heal/Remove patch tool.
- Deterministic technical/creative/potential rating prototype.
- WYSIWYG JPEG export to `Pictures/FRAME Beta`.

## Deliberately not claimed as complete yet
- Cloud semantic AI / GPT vision analysis.
- Face/eye/teeth segmentation-grade detection.
- True subject/building semantic masks.
- Perspective/vertical geometry engine.
- RAW pipeline and full color-management.
- Full-resolution export renderer.
- Production-quality content-aware object removal.
- Production denoise / edge-aware sharpening.

These are next-engine milestones, not fake buttons in this beta.

## Beta export rule
Beta 0.1.0 exports the exact live rendered preview (up to ~1200 px long edge) to guarantee that the JPEG matches what was visible on screen. The high-resolution renderer comes after interaction/regression testing passes.
