# FRAME — Universal Mockup Lock 0.8

The approved 10-screen FRAME mockup is the authoritative UI/behavior specification for the 0.8 functional beta.

## Locked screens
1. Splash / Cover
2. Library
3. Viewer (Fit)
4. Smart Edit
5. Rate & Improve
6. Crop & Straighten (Crop Lock ON by default)
7. Masking (Lightroom-style structure)
8. Heal / Remove
9. Presets & Lightroom XMP Export
10. Settings / Admin

## Non-negotiable behavior
- Preserve the existing FRAME app lineage, package, IndexedDB library and saved user data.
- Add Photos remains visible in a populated Library.
- New images open centered in true Fit at their native aspect ratio; pinch zoom/pan and double-tap zoom are functional.
- AI scene analysis is isolated per image request so results from the previous photo cannot leak into the next photo.
- Library scene categories include People, Architecture, Wedding, Travel, Landscape, Night and Food, plus Edited and Favorites states.
- Rate & Improve generates one AI Master Recipe combining tone, color, local masks, crop/straighten recommendations and distraction review.
- Crop Lock is ON by default. AI may calculate and preview a crop while locked, but composition changes cannot be committed until the user unlocks Crop.
- Crop ratios include Free, 1:1, 4:5, 3:4, 16:9, 9:16 and 3:2.
- Smart Crop chooses ratio/position based on scene, orientation, subject evidence and composition heuristics instead of forcing one ratio.
- Masking exposes Subject, People, Background, Sky, Object and Landscape plus Brush, Linear, Radial, Color Range and Luminance tools; Depth remains disabled when no depth data exists.
- Mask overlay can be shown in red and refined with Add/Subtract, Feather, Flow, Invert and Clear/Duplicate behavior.
- Heal/Remove is approval-based: propose -> review -> apply -> undo.
- Presets are scene-aware, custom presets can be saved, and global preset settings can export as Lightroom XMP.
- No visible placeholder control may silently do nothing.

## Build identity
- Android package: `com.ilia.frame.redesignbeta.debug`
- Version: `0.8.0-beta8-debug`
- Canonical branch: `frame-redesign-main`
