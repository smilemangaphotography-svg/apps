# FRAME Redesign Beta 0.2.0 — Validated

Date: 2026-09-09

Canonical branch: `frame-redesign-main`

Mockup lock: `FRAME-Redesign/docs/MOCKUP_LOCK_BETA_0.2.md`

## Android identity
- Package: `com.ilia.frame.redesignbeta.debug`
- Version code: `2`
- Version name: `0.2.0-beta2-debug`
- Minimum SDK: `26`
- Target / compile SDK: `35`

## CI result
GitHub Actions run `34408705513` completed successfully.

Validated stages:
- locked UI asset presence
- JavaScript syntax (`node --check`)
- Smart Select source presence
- persistent IndexedDB library source presence
- Android compilation
- APK package/version identity
- APK artifact collection
- SHA-256 generation
- artifact upload

## Beta 0.2 feature changes
- Persistent Lightroom-style local library via IndexedDB.
- Multi-photo Android picker support.
- Library filters: All / People / Places / Edited / Favorites.
- Edited thumbnails and favorites retained between sessions.
- Full photo view uses Fit / Fill / 1:1 / Zoom.
- Pinch-to-zoom, double-tap zoom and pan.
- Presets / Light / Color / Detail / Mask / Heal / Crop keep the photograph visible.
- Compare is optional and off by default.
- Long-press image temporarily displays the original.
- Smart Select options: Subject / Sky / Water / Buildings / People / Background.
- Smart mask overlay is visible and manually brush-editable.
- Local mask exposure works on the selected region.
- Highlight Guard remains available and defaults on.
- Skin Priority remains available and defaults on.
- Adaptive Smart recipe and preset recommendation prototype.
- Functional beta spot remove using surrounding-pixel sampling.
- Crop aspect / straighten preview and cropped export.
- Technical / creative / potential GPT Rate prototype.
- Explicit Settings / Admin owner page.
- Custom preset storage.
- JPEG export continues to `Pictures/FRAME Beta`.
- Android Back is deterministic across Editor / Settings / Admin / Onboarding.

## Honest beta limitations
- Smart Select uses on-device heuristic segmentation, not production semantic AI segmentation yet.
- People / buildings detection is heuristic and should be evaluated on real photos.
- Heal / Remove is a functional prototype, not final content-aware fill.
- Full RAW/color-managed high-resolution processing remains a later engine stage.
- Detail sharpening / denoise are not final production algorithms.

## Next test gate
Real-device regression on Samsung:
1. import multiple photos
2. close/reopen and verify library persistence
3. open saved edited photo
4. pinch zoom + pan + Fit/Fill/1:1
5. Presets, Light and Color keep photo visible
6. Highlight Guard
7. Skin Priority on a portrait
8. Smart Select each target class
9. brush refinement + local mask exposure
10. Compare only on demand
11. Heal / Remove
12. Crop / straighten
13. favorite + Edited/Favorites filters
14. Admin settings
15. export and reopen saved JPEG
