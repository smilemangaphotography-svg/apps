# ILIA COACH 3.0.1 — MASTER FIX

Date: 2026-09-18

## User-reported fixes
1. Official Android launcher icon added. The app no longer relies on the generic/blank launcher icon.
2. Exercise swipe controls:
   - Swipe left: remove an exercise when equipment is unavailable or the movement should not be used.
   - Swipe right: open compatible replacement exercises.
   - Removed exercises can be restored from Equipment & Exercise Library.
3. Duplicate protection:
   - Add Exercise hides movements already in the selected workout.
   - Replacement options hide exercises already present.
   - If an existing exercise is selected as a replacement, the old movement is removed without creating a duplicate.
   - Calendar plan sanitization deduplicates saved plan IDs.
4. Official branding:
   - Removed legacy Beta 2.9 / Beta 2.9.3 visual overrides.
   - Cover and top bar show OFFICIAL / V7 / 3.0.1.
   - Added the ILIA COACH brand mark to the cover screen.

## Identity
- Package: `com.ilia.personaltrainer`
- Version: `3.0.1`
- versionCode: `41`
- Signing lineage: same permanent official ILIA COACH key as 3.0.0

## Do-not-touch lock
All accepted V7/V7.3 functions not named above remain frozen, including anatomical motion, real calendar, My Plan / Recommended / AI Recommended, AI Coach, Run Coach, equipment manager, upload exercise, safe areas and opaque navigation.
