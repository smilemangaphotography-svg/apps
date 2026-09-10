# FRAME Beta 0.3 — Intelligence / Smart Selection Milestone

Date: 2026-09-10
Canonical branch: `frame-redesign-main`
Android package: `com.ilia.frame.redesignbeta.debug`
Version target: `0.3.0-beta3-debug`

## Purpose
Beta 0.3 addresses the main device-test weakness of Beta 0.2: Smart selection and Smart Analyze looked intelligent but were still heuristic. This milestone moves the core image understanding into native Android ML Kit components while preserving the approved Essential Professional UI and persistent FRAME library.

## Implemented
- Bundled ML Kit image labeling for on-device semantic cues.
- Bundled ML Kit face detection for real face presence/bounds.
- Google Play services ML Kit Subject Segmentation for edge-aware foreground subject masks.
- Subject / People / Background Smart Select now use native segmentation rather than geometric oval masks.
- Semantic detections are confidence-gated so weak Water/Sky/Architecture guesses are hidden rather than presented as fact.
- Skin Priority now uses detected face regions for local temperature/face-light behavior rather than applying skin temperature globally.
- `View Skin Mask` provides a visible local face/skin region preview.
- Preset recommendations adapt to detected people, architecture and technical exposure state.
- Smart Edit adds Best Match and `Why this edit?` context.
- Technical / Creative / Potential rating path retained.
- Editing tool panel can collapse so the image can occupy substantially more of the Android display.
- Pinch zoom, pan and double-tap zoom persist while moving between editing tools.
- The right Fit/Fill/1:1 rail de-emphasizes during pinch gestures.
- Duplicate Settings/Admin entry is hidden; owner Admin remains the single configuration destination.
- Existing IndexedDB library lineage from Beta 0.2 is retained (`frameBeta02`) to preserve imported photos and edits during upgrade testing.

## Safety / truthfulness rules
- FRAME must not label an unsupported selection as if it succeeded.
- Sky, Water and Buildings masks are not faked with an unrelated foreground mask.
- If there is no reliable semantic cue, the selection is not applied.
- Subject segmentation may require the Google Play services model to download the first time it is used; the UI reports that state rather than silently falling back to an oval.

## Still not production-complete
- dedicated semantic segmentation for Sky / Water / Buildings
- pixel-accurate full-body skin segmentation
- teeth / eye segmentation
- production content-aware remove
- RAW / color-managed rendering
- final full-resolution non-destructive export pipeline

## Beta 0.3 regression priorities
1. Upgrade over Beta 0.2 and confirm library photos remain present.
2. Test a clear full-body portrait: Smart Analyze should detect a person/face and must not invent Water.
3. Mask → Subject: verify the red overlay follows actual foreground edges instead of an ellipse.
4. Mask → Background: verify it is the inverse of the subject selection.
5. Color → Skin Priority: verify Temperature affects the face region rather than globally shifting the scene.
6. Pinch zoom and pan, then switch Light → Color → Mask; zoom position should remain.
7. Collapse/expand the tool panel and confirm the photograph remains visible.
8. Compare must remain optional and appear only when requested.
9. Export a test JPEG and compare it with the visible edit.

Beta 0.3 remains an interaction/intelligence beta; it should be evaluated on real-device behavior before further visual redesign.