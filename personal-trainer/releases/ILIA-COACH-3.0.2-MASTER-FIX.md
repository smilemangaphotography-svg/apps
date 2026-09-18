# ILIA COACH 3.0.2 — MASTER FIX

Date: 2026-09-18

## Launch screen
Selected concept: Option 4.
- Full-screen photographic launch artwork.
- Artwork fills the complete app viewport.
- Existing GET STARTED and Settings controls remain functional through aligned hit targets.
- Official version overlay updated to 3.0.2.

## Exercise swipe controls
Root cause found in 3.0.1: the swipe binder called querySelector through `$` and then attempted `.forEach()`, so exercise swipe handlers were never attached.

3.0.2 fixes this by:
- binding every `[data-swipe-exercise]` card with `$$`
- using Pointer Events on Android WebView with touch fallback
- lowering the activation threshold for natural phone gestures
- Swipe left = remove / mark exercise unavailable
- Swipe right = show compatible replacement exercises
- visual REMOVE / REPLACE reveal during the drag
- blocking the normal card tap after a completed swipe

Removed exercises remain recoverable from Equipment & Exercise Library.

## Preserved
- package `com.ilia.personaltrainer`
- official signing lineage
- anatomical motion library
- My Plan / Recommended / AI Recommended
- duplicate-exercise protection
- AI Coach
- exercise upload and equipment manager
- Run Coach
- full-screen/safe-area/navigation fixes

## Version
- versionName: 3.0.2
- versionCode: 42
