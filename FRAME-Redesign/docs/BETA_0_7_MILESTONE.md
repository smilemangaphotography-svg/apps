# FRAME Redesign — Beta 0.7.0 Milestone

Status: **BUILT / CI VERIFIED / DEVICE TEST REQUIRED**

Branch: `frame-redesign-main`

Package: `com.ilia.frame.redesignbeta.debug`

Version: `0.7.0-beta7-debug`

## Universal Mockup Lock
The approved FRAME Android mockups are the implementation contract for this beta. Beta 0.7 replaces the older layered UI patch stack with one clean runtime (`index07.html`, `style07.css`, `app07.js`) while retaining the same Android package lineage and the existing `frameBeta02` IndexedDB library so previously imported FRAME records can persist across the upgrade.

## Implemented in Beta 0.7
- Permanent `+ Add Photos` action in the populated Library plus Import Photos empty state.
- Library filters: All / People / Architecture / Wedding / Travel / Edited / Favorites.
- V7 scene re-indexing with stronger people evidence and more conservative architecture classification.
- Photo opens in deterministic Fit mode with one Zoom control; pinch, pan and double-tap zoom share a single viewport transform.
- Actual source pixel dimensions shown in editor metadata; crop metadata shows cropped output dimensions.
- Silent Highlight Guard: no visible Highlights Protected / Low Light analysis strip.
- Scene-aware Smart Edit, including Coastal Architecture rather than generic Natural Clean when architecture + coast evidence is present.
- Actionable Rate & Improve: Technical / Creative / Potential plus routes to crop, straighten, tone, color and heal.
- Crop & Straighten with draggable crop frame/grid, Free / 1:1 / 4:5 / 9:16 / 16:9 / 3:2, ±90°, ±0.5°, Flip H/V, Auto estimate, Reset and explicit Apply Crop.
- Shared source-coordinate geometry for viewer, crop, mask and heal state.
- Masks: Subject / Person / Background / Sky / Water / Architecture, red overlay toggle, Add / Subtract brush, Brush Size / Feather / Flow / Overlay Opacity and Mask Exposure.
- Sky / Water / Architecture selection no longer depends on foreground-subject segmentation; these use independent native image-derived region masks.
- Heal / Remove uses proposed changes, preview, per-change enable/undo and Apply Selected before commit.
- Scene-based presets, custom preset saving, and Lightroom XMP export.
- Settings rows now open real beta controls/information instead of dead placeholder rows.
- Owner Admin retains Highlight Guard, Skin Priority, mask overlay defaults and safe FRAME-library clearing.
- Android Back behavior: Editor → Library, Admin → Settings, Settings → Library, Library/Splash → exit.

## Build validation
GitHub Actions run `34538435418` completed successfully. It passed JavaScript syntax validation, locked asset checks, Android compilation, APK package/version identity checks, artifact collection and upload.

## Known beta limitations
- Subject segmentation depends on the Google Play services ML model being available; first use may require model availability/download.
- Sky / Water / Architecture masks are improved independent region masks, but remain beta-quality image-derived heuristics rather than Lightroom-class semantic segmentation.
- The live editing raster is capped for mobile performance; export preserves requested crop dimensions up to the configured output cap, but this is not yet a full RAW/full-resolution production rendering pipeline.
- Final UI/interaction acceptance still requires Samsung device testing against the approved mockups.
