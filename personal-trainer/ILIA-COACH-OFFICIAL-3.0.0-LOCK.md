# ILIA COACH 3.0.0 — OFFICIAL PRODUCTION LOCK

Date: 2026-09-18

## Canonical identity
- Repository: `smilemangaphotography-svg/apps`
- Branch: `personal-trainer-main`
- Android package: `com.ilia.personaltrainer`
- App label: `ILIA COACH`
- Version: `3.0.0`
- versionCode: `40`

## Product lock
Official 3.0.0 preserves the accepted V7/V7.3 behavior:
- Home / Plan / Train / Run / More architecture
- Real device-calendar dates and TODAY marker
- My Plan / Recommended / AI Recommended
- AI Coach recommendation -> explanation -> explicit user approval -> plan application
- Recommended/AI Recommended days expose the actual exercise list
- Better Option replacement removes the original workout exercise and inserts the chosen replacement
- + Add Exercise on strength days
- Exercise upload flow with local known-movement matching and confirmation
- Equipment availability manager and individual exercise remove/restore
- Equipment-aware plan filtering
- GPS/TTS Run Coach with pace guidance
- Opaque bottom navigation and Samsung safe-area fixes
- Existing anatomical-motion exercise detail system

## Anatomy lock
The official build must import and validate the proven 26 MP4 + WebP anatomy-motion pairs from `rebuild/ilias-coach-v2`.
Do not replace these assets with web-preview placeholders, static-only generic images, Pinterest assets, or unlicensed media.

## Production behavior
- No Preview/Beta package identity.
- No Preview/Beta app label.
- WebView debugging disabled.
- HTTPS-only WebView traffic remains enforced.
- The app must remain portrait and retain Android file picker, GPS/location and TTS bridges.

## Signing
The public repository MUST NOT contain the production private signing key.
Official distributable APKs must be signed with the permanent owner signing key.
The same key must be retained for every future direct-APK update to `com.ilia.personaltrainer`.

## Do-not-touch lock
Everything already accepted in V7.3 is frozen unless a later approved request explicitly changes it.
