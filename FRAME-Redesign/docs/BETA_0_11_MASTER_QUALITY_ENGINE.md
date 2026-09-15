# FRAME Beta 0.11 — Master Quality Engine

Canonical branch: `frame-redesign-main`

## Purpose
Beta 0.11 changes FRAME from a settings-application engine into a quality-gated photo editor. The engine must prefer a better final photograph over simply applying stronger corrections.

## Locked behavior
- Smart/Rate generate multiple candidate recipes: Natural, Balanced, Scene, Creative.
- Candidate recipes are scored for luminance, highlight clipping, crushed shadows, saturation, color-cast shift, dynamic range, and obvious magenta contamination.
- Unsafe color/tone candidates are rejected or backed off automatically.
- Red mask overlay is visible only inside Mask mode. It must never tint Smart, Rate, Crop, Presets, export, or Before/After views.
- Rate scores are based on the rendered current result, not percentage of recommended settings applied.
- Potential remains a potential score; it is not treated as the current result score.
- Smart Crop compares Original, 1:1, 4:5, 3:4, 3:2, 16:9 and 9:16 using saliency, guiding-line placement, scene prior, crop retention, and detected faces.
- Crop Lock remains ON by default. AI may recommend a composition change but asks for one-time approval.
- Crop approval uses a FRAME-styled decision sheet: Apply Recommended Crop / Review Crop / Keep Original. Browser `file://` confirm dialogs are forbidden.
- Rate must show crop state truthfully: ORIGINAL / ASK / REVIEW / READY / APPLIED.
- Full AI apply runs a post-edit QA check and backs off tone/color if safety checks fail.
- Heal/Remove remains approval-controlled.
- Undo remains available after the full AI recipe.

## Version
- Android version code: 12
- Version name: `0.11.0-beta12-debug`
- Package: `com.ilia.frame.redesignbeta.debug`
- Stable beta signature remains unchanged from 0.10.1 so the APK can update the installed beta lineage.

## Build validation
CI validates the generated `app11.js` runtime, `index11.html`, Android entry point, version identity, quality engine functions, crop scoring, mask-overlay isolation, Lightroom XMP path, ML pose/segmentation integration, APK signing, and final package identity.
