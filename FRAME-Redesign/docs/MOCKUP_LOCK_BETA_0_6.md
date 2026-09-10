# FRAME — Beta 0.6 Mockup Lock

Status: **APPROVED / LOCKED**

Branch: `frame-redesign-main`

The approved Android mockups are the visual and interaction reference for Beta 0.6. Future beta work must preserve this hierarchy unless explicitly changed by the owner.

## Locked page sequence
1. Branded FRAME cover with logo mark and Get Started action.
2. Library organized by All / People / Architecture / Wedding / Travel / Edited / Favorites, with a permanent `+ Add Photos` action in the Library header so more images can be imported at any time.
3. Immersive Editor / Viewer with photo-first layout, image dimensions and one Zoom control.
4. Smart Edit with scene-aware recommended preset, explanation, Preview and Apply Suggested Fixes.
5. Rate & Improve with Technical / Creative / Potential scores and actionable fixes including Crop & Straighten and Remove Distractions.
6. Crop & Straighten with original/cropped dimensions, straighten, 90° rotation, flip, auto, ratios and explicit Apply Crop.
7. Mask / Selective with red overlay option, Subject / Person / Background / Sky / Architecture / Water, refinement controls and local adjustments.
8. Heal / Remove with proposed removals, per-change approval, undo and final Apply Removals.
9. Presets organized by scene with Lightroom-compatible XMP export.

## Locked behavior rules
- Do not display `Highlights Protected`, `Low light` or similar analysis pills in the editor UI. Analysis remains automatic and silent unless requested.
- Photo remains visible while editing.
- Opening a photo defaults to Fit.
- Only one Zoom control is shown; pinch, pan and double-tap remain available.
- Show the actual source pixel dimensions in the editor metadata.
- Before/After remains optional and appears only when requested.
- Rating must produce actionable changes, not only scores.
- Crop/straighten is part of Rate recommendations when composition or geometry needs work.
- Heal/Remove must propose changes first; nothing is committed until the user approves it.
- Smart masks show a red selection overlay only when `Show Overlay` is enabled.
- People recognition can use face, pose and semantic evidence.
- Library scene categories are inferred automatically from image analysis.
- Preset recommendations are scene-aware and should rank the best photographic starting point for the image.
- Compatible FRAME presets can be exported as Lightroom XMP files.
- Library import must never disappear after the first photo is added. The populated Library keeps a clearly visible `+ Add Photos` control in the top bar, opening the multi-photo picker. The empty Library additionally shows the large `Import Photo` call-to-action.

## Beta 0.6 implementation note
Beta 0.6 keeps the existing non-destructive FRAME lineage and adds a UI/interaction lock layer (`beta06.js`) above the 0.4/0.5 engine. Native ML Kit face, pose, image-label and foreground-subject analysis remain the on-device intelligence base. Sky/Water/Architecture selective masks in this beta use semantic cues plus image-derived mask heuristics and therefore remain beta-quality rather than production Lightroom-equivalent segmentation.
